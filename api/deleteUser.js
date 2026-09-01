// api/deleteUser.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // 1. Find the user in Auth
  const { data: users, error: getError } = await supabase.auth.admin.listUsers();
  if (getError) return res.status(500).json({ error: getError.message });

  const user = users.users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // 2. Delete from Auth
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) return res.status(500).json({ error: deleteError.message });

  // 3. Delete from your custom users table
  await supabase.from('users').delete().eq('id', user.id);

  return res.status(200).json({ success: true });
} 