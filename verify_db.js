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
  console.log('Connected to Supabase\n');

  // 1. List all tables
  const { rows: tables } = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('Existing tables:', tables.map(r => r.table_name).join(', '));

  // 2. Check chat_messages
  const { rows: cols } = await c.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chat_messages'
    ORDER BY ordinal_position;
  `);
  if (cols.length === 0) {
    console.log('\nchat_messages: NOT FOUND — running migration now...');
    const sql = fs.readFileSync('./supabase/migrations/010_chat_messages.sql', 'utf8');
    await c.query(sql);
    console.log('chat_messages: CREATED');
  } else {
    console.log('\nchat_messages columns:', cols.map(col => col.column_name).join(', '));
  }

  // 3. Check RLS policies
  const { rows: policies } = await c.query(`
    SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages';
  `);
  console.log('RLS policies:', policies.map(p => p.policyname).join(', ') || 'none');

  // 4. Test insert + delete (smoke test)
  try {
    await c.query(`
      INSERT INTO public.chat_messages (sender_id, receiver_id, room_id, message, admin_sender)
      VALUES ('test-sender', null, 'test_room', 'smoke test', false);
    `);
    await c.query(`DELETE FROM public.chat_messages WHERE room_id = 'test_room';`);
    console.log('\nSmoke test: INSERT + DELETE OK');
  } catch(err) {
    console.log('\nSmoke test FAILED:', err.message);
  }

  await c.end();
  console.log('\nDone!');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
