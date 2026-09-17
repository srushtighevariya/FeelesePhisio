// Migration runner — runs all Supabase SQL migrations in order
// Usage: node run-migrations.js
// Requires: DB_URL environment variable

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DB_URL = process.env.DB_URL;

if (!DB_URL) {
  console.error(
    "❌  Missing DB_URL env var.\n" +
    "    Set it like:\n" +
    "    $env:DB_URL='postgresql://postgres.jvwthuzgwbfuycvclpif:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'\n" +
    "    node run-migrations.js"
  );
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, "supabase", "migrations");

const FILES = [
  "001_schema.sql",
  "002_indexes.sql",
  "003_rls.sql",
  "004_seed_exercises.sql",
  "005_auto_therapist_trigger.sql",
  "006_attendance.sql",
  "007_monthly_reports.sql",
  "008_notifications_log.sql",
];

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("✅  Connected to Supabase database\n");

  for (const file of FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf8");
    try {
      await client.query(sql);
      console.log(`✅  ${file}`);
    } catch (err) {
      console.error(`❌  ${file}: ${err.message}`);
    }
  }

  await client.end();
  console.log("\n🎉  All migrations complete!");
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
