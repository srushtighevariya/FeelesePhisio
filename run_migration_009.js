const { Client } = require('pg');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring('DATABASE_URL='.length).trim();
}

const c = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function main() {
  await c.connect();
  const sql = fs.readFileSync('./supabase/migrations/009_notif_upgrade.sql', 'utf8');
  try {
    await c.query(sql);
    console.log('✅ Migration 009_notif_upgrade.sql applied');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  }
  await c.end();
}

main().catch(console.error);
