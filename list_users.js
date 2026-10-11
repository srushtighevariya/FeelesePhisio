// Uses Supabase Admin REST API to list auth users
// Requires SUPABASE_SERVICE_ROLE_KEY — reads from .env.local
const fs = require('fs');
const https = require('https');

const envContent = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let serviceKey = '';
let anonKey = '';

for (const line of envContent.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) anonKey = line.split('=')[1].trim();
}

if (!serviceKey) {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.log('');
  console.log('To get it:');
  console.log('1. Go to https://supabase.com/dashboard/project/jvwthuzgwbfuycvclpif/settings/api');
  console.log('2. Copy the "service_role" key (secret)');
  console.log('3. Add it to .env.local as: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('4. Run this script again');
  console.log('');
  console.log('--- Known admin from login page source code ---');
  console.log('Email: admin@recoverypath.com');
  console.log('Password: $FeelesePhysio@123  (same as DB password pattern)');
  process.exit(0);
}

// Use service role key to list users
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const url = `${supabaseUrl}/auth/v1/admin/users`;

const options = {
  method: 'GET',
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  }
};

console.log('Fetching users from Supabase Auth...\n');

const req = https.request(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log('Error status:', res.statusCode, data);
      return;
    }
    const json = JSON.parse(data);
    const users = json.users || [];
    if (users.length === 0) {
      console.log('No users found.');
      return;
    }
    console.log(`Found ${users.length} user(s):\n`);
    users.forEach(u => {
      console.log('📧 Email:', u.email);
      console.log('👤 Role:', u.user_metadata?.role || u.app_metadata?.role || 'unknown');
      console.log('✅ Confirmed:', u.email_confirmed_at ? 'Yes' : 'No');
      console.log('🕐 Last Login:', u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('en-IN') : 'Never');
      console.log('---');
    });
  });
});

req.on('error', (e) => {
  console.error('Connection error:', e.message);
  console.log('\n⚠️  Cannot reach Supabase — the project may be PAUSED.');
  console.log('Please go to https://supabase.com/dashboard and resume your project first.');
});

req.end();
