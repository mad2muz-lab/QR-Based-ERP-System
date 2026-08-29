import { supabase } from './supabaseClient';

export async function createPMNotification({
  userId,
  title,
  message,
  entityId,
  actionUrl = '/pm/dashboard',
  type = 'maintenance',
  entityType = 'equipment',
}) {
  return await supabase.from('notifications').insert([
    {
      user_id: userId,
      title,
      message,
      type,
      entity_type: entityType,
      entity_id: entityId,
      is_read: false,
      action_url: actionUrl,
      created_at: new Date().toISOString(),
    },
  ]);
} 