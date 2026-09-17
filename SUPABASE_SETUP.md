# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (free tier is fine)
2. Click **New Project** → choose your organization → give it a name → pick a region
3. Wait ~2 minutes for the project to provision

---

## 2. Get Your API Keys

In the Supabase dashboard → **Project Settings → API**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (e.g. `https://abcxyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key |

Copy these into your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 3. Run the Database Migrations

Open the **Supabase SQL Editor** (in the dashboard) and run each migration file **in order**:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_indexes.sql`
3. `supabase/migrations/003_rls.sql`
4. `supabase/migrations/004_seed_exercises.sql`
5. `supabase/migrations/005_auto_therapist_trigger.sql`
6. `supabase/migrations/006_attendance.sql`
7. `supabase/migrations/007_monthly_reports.sql`
8. `supabase/migrations/008_notifications_log.sql`

> Paste each file's content into the SQL Editor and click **Run**.

---

## 4. Create the First Admin User

In Supabase dashboard → **Authentication → Users → Invite user**:

1. Invite the admin email address
2. After they accept and set a password, go to **SQL Editor** and run:

```sql
-- Replace with actual auth user ID and email
insert into public.users (id, email, name, role)
values (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- from auth.users.id
  'admin@yourclinic.com',
  'Admin Name',
  'admin'
);
```

---

## 5. Create Therapist Users

For each therapist:
1. Invite them via **Authentication → Users**
2. After they accept, insert into `public.users` with `role = 'therapist'`
3. The trigger (`005_auto_therapist_trigger.sql`) will automatically create a `therapists` row

---

## 6. Start the App

```bash
npm run dev
# Visit http://localhost:3000
```

Or double-click `start-all.bat`.

---

## Row Level Security Summary

| Table | Admin | Therapist |
|---|---|---|
| `patients` | All | Own patients only |
| `appointments` | All | Own appointments only |
| `sessions` | All | Own sessions only |
| `attendance` | Read + Write | Read own |
| `monthly_reports` | All | Read own |
| `notification_log` | All | No access |
| `exercises` | All | Read + Insert |
