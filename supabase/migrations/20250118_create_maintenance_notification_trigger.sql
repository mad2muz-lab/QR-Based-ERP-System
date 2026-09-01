-- Migration: Create Maintenance Notification Trigger
-- This creates a trigger function and trigger for maintenance notifications
-- No existing functionality is modified or removed

-- Create the trigger function for maintenance notifications
CREATE OR REPLACE FUNCTION public.create_maintenance_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when equipment status changes to 'maintenance'
  IF NEW.status = 'maintenance' AND OLD.status != 'maintenance' THEN
    -- Create notifications for admin and maintenance@system.local users
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      entity_type,
      entity_id,
      priority,
      action_url,
      created_at
    ) 
    SELECT 
      u.id,
      'Equipment Maintenance Required',
      'Equipment ' || NEW.name || ' (' || COALESCE(NEW.custom_equipment_id, NEW.id) || ') has been marked for maintenance.',
      'maintenance',
      'equipment',
      NEW.id,
      'medium', -- Default priority until form is filled
      '/maintenance/corrective/new?equipment_id=' || NEW.id,
      now()
    FROM public.users u 
    WHERE u.username = 'admin' OR u.email = 'maintenance@system.local';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on equipment table
DROP TRIGGER IF EXISTS equipment_maintenance_notification ON public.equipment;
CREATE TRIGGER equipment_maintenance_notification
  AFTER UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.create_maintenance_notification();

-- Log this migration
INSERT INTO migration_rollback_log (migration_name, rollback_sql) VALUES (
  'create_maintenance_notification_trigger',
  '-- Rollback: Remove trigger and function
   -- DROP TRIGGER IF EXISTS equipment_maintenance_notification ON public.equipment;
   -- DROP FUNCTION IF EXISTS public.create_maintenance_notification();'
); 