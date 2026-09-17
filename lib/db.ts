import { Client } from "pg";

export async function getDbClient() {
  const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:%24FeelesePhysio%40123@db.jvwthuzgwbfuycvclpif.supabase.co:5432/postgres";
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}
