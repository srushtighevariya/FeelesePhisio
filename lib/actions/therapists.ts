"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
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
  const { getCachedAuthUser } = await import("@/lib/auth-cache");
  const auth = await getCachedAuthUser();
  if (!auth) return { isAdmin: false, therapist: null };
  return { isAdmin: auth.isAdmin, therapist: auth.therapist };
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

  // Use Supabase Admin API — no DATABASE_URL / raw pg needed
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminClient = createAdminClient();
  const supabase = await createServerClient();

  // 1. Get therapist record
  const { data: th, error: fetchErr } = await supabase
    .from("therapists")
    .select("id, user_id, email, name")
    .eq("id", therapistId)
    .single();

  if (fetchErr || !th) {
    throw new Error("Therapist record not found.");
  }

  if (th.user_id) {
    // Auth user already exists — just update password
    const { error } = await adminClient.auth.admin.updateUserById(th.user_id, {
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  } else if (th.email) {
    // Check if an auth user with this email already exists
    const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers();
    if (listErr) throw new Error(listErr.message);

    const existingUser = listData.users.find(
      (u) => u.email?.toLowerCase() === th.email?.toLowerCase()
    );

    if (existingUser) {
      // Update password for the existing auth user
      const { error: updErr } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password: newPassword,
        email_confirm: true,
      });
      if (updErr) throw new Error(updErr.message);

      // Link therapist row to this auth user
      await supabase
        .from("therapists")
        .update({ user_id: existingUser.id })
        .eq("id", therapistId);
    } else {
      // Create a brand-new auth user
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: th.email,
        password: newPassword,
        email_confirm: true,
        user_metadata: { name: th.name, role: "therapist" },
      });
      if (createErr) throw new Error(createErr.message);

      if (created.user?.id) {
        // Link therapist row to new auth user
        await supabase
          .from("therapists")
          .update({ user_id: created.user.id })
          .eq("id", therapistId);
      }
    }
  } else {
    throw new Error("Therapist does not have an email address to set up credentials.");
  }

  revalidatePath("/dashboard/therapists");
  return { success: true };
}

export async function updateTherapistProfile(
  therapistId: string,
  data: {
    name?: string;
    specialty?: string | null;
    phone?: string | null;
    email?: string | null;
    bio?: string | null;
  }
) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("therapists")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.specialty !== undefined && { specialty: data.specialty }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
    })
    .eq("id", therapistId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
