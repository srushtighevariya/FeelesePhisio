import { Client } from "pg";

export async function getDbClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Add it to your .env.local file to enable direct database operations."
    );
  }
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}
