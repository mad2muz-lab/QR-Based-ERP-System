// create_supabase_admin_user.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAdminUser() {
  const email = 'developer@system.local';
  const password = 'MacBookPro';
  const role = 'developer';
  const name = 'System Developer';

  // 1. Create user in Supabase Auth
  const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (signUpError) {
    console.error('Error creating auth user:', signUpError.message);
    process.exit(1);
  }
  const userId = userData.user.id;
  console.log('Auth user created:', userId);

  // 2. Insert user profile in users table
  const { error: profileError } = await supabase.from('users').insert([
    {
      id: userId,
      username: email,
      role,
      name,
      email,
      site: 'HQ',
      created_at: new Date().toISOString(),
    },
  ]);
  if (profileError) {
    console.error('Error inserting user profile:', profileError.message);
    process.exit(1);
  }
  console.log('User profile inserted in users table.');
  console.log('Admin user created successfully!');
}

await createAdminUser(); 