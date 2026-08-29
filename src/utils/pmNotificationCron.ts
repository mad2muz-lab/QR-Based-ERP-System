import { supabase } from './supabaseClient';
import { createPMNotification } from './notificationService';

export async function checkAndNotifyDuePMLogs() {
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // Get due soon logs
  const { data: dueSoonLogs } = await supabase
    .from('preventive_maintenance_logs')
    .select('*')
    .in('status', ['scheduled', 'in_progress'])
    .gte('scheduled_date', now.toISOString())
    .lte('scheduled_date', soon.toISOString());

  // Get overdue logs
  const { data: overdueLogs } = await supabase
    .from('preventive_maintenance_logs')
    .select('*')
    .in('status', ['scheduled', 'in_progress'])
    .lt('scheduled_date', now.toISOString());

  // Helper to check if notification already exists
  async function notificationExists(logId: string, type: string) {
    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('entity_id', logId)
      .eq('type', type)
      .single();
    return !!data;
  }

  // Notify for due soon
  if (dueSoonLogs) {
    for (const log of dueSoonLogs) {
      if (log.technician_id && !(await notificationExists(log.id, 'pm_due_soon'))) {
        await createPMNotification({
          userId: log.technician_id,
          title: 'Preventive Maintenance Due Soon',
          message: `A preventive maintenance task (type: ${log.preventive_type_id}) is due on ${log.scheduled_date}.`,
          entityId: log.id,
          type: 'pm_due_soon',
          actionUrl: '/pm/dashboard',
          entityType: 'equipment',
        });
      }
    }
  }

  // Notify for overdue
  if (overdueLogs) {
    for (const log of overdueLogs) {
      if (log.technician_id && !(await notificationExists(log.id, 'pm_overdue'))) {
        await createPMNotification({
          userId: log.technician_id,
          title: 'Preventive Maintenance Overdue',
          message: `A preventive maintenance task (type: ${log.preventive_type_id}) was due on ${log.scheduled_date} and is now overdue.`,
          entityId: log.id,
          type: 'pm_overdue',
          actionUrl: '/pm/dashboard',
          entityType: 'equipment',
        });
      }
    }
  }
} 