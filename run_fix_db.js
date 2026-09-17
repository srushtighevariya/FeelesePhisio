const { Client } = require("pg");
const fs = require("fs");

const envContent = fs.readFileSync(".env.local", "utf8");
let dbUrl = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("DATABASE_URL=")) {
    dbUrl = line.substring("DATABASE_URL=".length).trim();
  }
}

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL database.");

  // 1. Update current_therapist_id function
  await client.query(`
    CREATE OR REPLACE FUNCTION public.current_therapist_id()
    RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
      SELECT id FROM public.therapists
      WHERE user_id = auth.uid()
         OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
         OR email = (SELECT email FROM public.users WHERE id = auth.uid())
      LIMIT 1;
    $$;
  `);
  console.log("Updated public.current_therapist_id() function.");

  // 2. Link therapists user_id
  const linkRes = await client.query(`
    UPDATE public.therapists t
    SET user_id = u.id
    FROM auth.users u
    WHERE (t.user_id IS NULL OR t.user_id != u.id) AND LOWER(t.email) = LOWER(u.email);
  `);
  console.log(`Synced therapists user_id from auth.users: ${linkRes.rowCount} rows.`);

  // 3. Fix names in public.users
  await client.query(`
    UPDATE public.users u
    SET name = t.name
    FROM public.therapists t
    WHERE (LOWER(u.name) = 'therapist' OR u.name IS NULL OR u.name = '')
      AND (t.user_id = u.id OR LOWER(t.email) = LOWER(u.email));
  `);
  await client.query(`
    UPDATE public.users
    SET name = 'Clinic Admin'
    WHERE (LOWER(name) = 'admin' OR name IS NULL OR name = '') AND role = 'admin';
  `);
  console.log("Fixed generic 'therapist' / 'admin' names in public.users.");

  // 4. Update attendance hours_worked where null
  await client.query(`
    UPDATE public.attendance
    SET hours_worked = CASE
      WHEN status = 'Present' AND (hours_worked IS NULL OR hours_worked = 0) THEN 8.5
      WHEN status = 'Half-Day' AND (hours_worked IS NULL OR hours_worked = 0) THEN 4.0
      WHEN status IN ('Leave', 'Absent') THEN 0.0
      ELSE hours_worked
    END;
  `);
  console.log("Updated null/zero hours_worked in attendance table.");

  // 5. Query and display current therapists, users, and attendance records
  const thList = await client.query("SELECT id, name, email, user_id FROM public.therapists");
  console.log("Therapists:", thList.rows);

  const uList = await client.query("SELECT id, name, email, role FROM public.users");
  console.log("Users:", uList.rows);

  const attList = await client.query("SELECT therapist_id, date, status, check_in, check_out, hours_worked FROM public.attendance LIMIT 10");
  console.log("Attendance Sample:", attList.rows);

  await client.end();
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
