// delete_supabase_user.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const email = 'developer@system.local';

async function deleteUserByEmail() {
  // 1. Get user by email
  const { data: users, error: getError } = await supabase.auth.admin.listUsers();
  if (getError) {
    console.error('Error listing users:', getError.message);
    process.exit(1);
  }
  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error('User not found.');
    process.exit(1);
  }
  // 2. Delete user by ID
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('Error deleting user:', deleteError.message);
    process.exit(1);
  }
  console.log('User deleted successfully:', email);
}

await deleteUserByEmail(); 