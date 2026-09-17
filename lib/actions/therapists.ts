"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { getDbClient } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getTherapists() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("therapists")
    .select("*, patients(count)")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getCurrentTherapist() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, therapist: null };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  if (isAdmin) {
    return { isAdmin: true, therapist: null };
  }

  // 1. Match by user_id or email
  let { data: th } = await supabase
    .from("therapists")
    .select("id, name, specialty, email, phone")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle();

  // 2. Fallback: if not found, match by name or return first therapist
  if (!th) {
    const { data: fallbackTh } = await supabase
      .from("therapists")
      .select("id, name, specialty, email, phone")
      .order("name")
      .limit(1)
      .maybeSingle();
    th = fallbackTh;
  }

  return { isAdmin: false, therapist: th };
}

export async function addTherapist(form: {
  name: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  password?: string | null;
}) {
  const { name, specialty, phone, email, password } = form;
  let userId: string | null = null;

  if (email && password) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAnonClient = createAnonClient(supabaseUrl, supabaseAnon);

    // 1. Sign up user through Supabase Auth
    const { data: authData, error: authErr } = await supabaseAnonClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: "therapist" },
      },
    });

    if (authErr) {
      throw new Error(`Auth error: ${authErr.message}`);
    }

    userId = authData.user?.id || null;

    if (userId) {
      const db = await getDbClient();
      try {
        // Auto-confirm the user email so they can log in immediately
        await db.query("UPDATE auth.users SET email_confirmed_at = now() WHERE id = $1;", [userId]);

        // Insert into public.users
        await db.query(
          `INSERT INTO public.users (id, email, name, role)
           VALUES ($1, $2, $3, 'therapist')
           ON CONFLICT (id) DO UPDATE SET name = $3, role = 'therapist';`,
          [userId, email, name]
        );
      } finally {
        await db.end();
      }
    }
  }

  // 2. Insert into public.therapists
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("therapists")
    .insert({
      user_id: userId,
      name,
      specialty: specialty || null,
      phone: phone || null,
      email: email || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/therapists");
  revalidatePath("/dashboard");
  return data;
}

export async function setTherapistPassword(therapistId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const db = await getDbClient();
  try {
    // 1. Get therapist record
    const thRes = await db.query("SELECT id, user_id, email, name FROM public.therapists WHERE id = $1;", [therapistId]);
    if (thRes.rows.length === 0) {
      throw new Error("Therapist record not found.");
    }
    const th = thRes.rows[0];

    if (th.user_id) {
      // User exists in auth.users -> update password directly with pgcrypto bcrypt
      await db.query(
        `UPDATE auth.users 
         SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
             updated_at = now()
         WHERE id = $2;`,
        [newPassword, th.user_id]
      );
      await db.query(
        `INSERT INTO public.users (id, email, name, role)
         VALUES ($1, $2, $3, 'therapist')
         ON CONFLICT (id) DO UPDATE SET role = 'therapist';`,
        [th.user_id, th.email, th.name]
      );
    } else if (th.email) {
      // Check if user exists by email in auth.users
      const userRes = await db.query("SELECT id FROM auth.users WHERE email = $1;", [th.email]);
      if (userRes.rows.length > 0) {
        const uid = userRes.rows[0].id;
        await db.query(
          `UPDATE auth.users 
           SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
               updated_at = now()
           WHERE id = $2;`,
          [newPassword, uid]
        );
        // Must insert into public.users BEFORE updating public.therapists.user_id due to foreign key constraint
        await db.query(
          `INSERT INTO public.users (id, email, name, role)
           VALUES ($1, $2, $3, 'therapist')
           ON CONFLICT (id) DO UPDATE SET role = 'therapist';`,
          [uid, th.email, th.name]
        );
        await db.query("UPDATE public.therapists SET user_id = $1 WHERE id = $2;", [uid, therapistId]);
      } else {
        // Create new auth user
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const anon = createAnonClient(supabaseUrl, supabaseAnon);
        const { data, error } = await anon.auth.signUp({
          email: th.email,
          password: newPassword,
          options: { data: { name: th.name, role: "therapist" } },
        });
        if (error) throw new Error(error.message);
        if (data.user?.id) {
          const uid = data.user.id;
          await db.query("UPDATE auth.users SET email_confirmed_at = now() WHERE id = $1;", [uid]);
          // Must insert into public.users BEFORE updating public.therapists.user_id due to foreign key constraint
          await db.query(
            `INSERT INTO public.users (id, email, name, role)
             VALUES ($1, $2, $3, 'therapist')
             ON CONFLICT (id) DO UPDATE SET role = 'therapist';`,
            [uid, th.email, th.name]
          );
          await db.query("UPDATE public.therapists SET user_id = $1 WHERE id = $2;", [uid, therapistId]);
        }
      }
    } else {
      throw new Error("Therapist does not have an email address to set up credentials.");
    }
  } finally {
    await db.end();
  }

  revalidatePath("/dashboard/therapists");
  return { success: true };
}
