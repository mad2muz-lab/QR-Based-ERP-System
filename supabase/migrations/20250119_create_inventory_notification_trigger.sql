-- Migration: Create Inventory Notification Trigger
-- This creates a trigger function and trigger for inventory notifications
-- No existing functionality is modified or removed

-- Trigger for inventory material requests
CREATE OR REPLACE FUNCTION public.create_inventory_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      entity_type,
      entity_id,
      priority,
      action_url,
      created_at,
      role
    ) 
    SELECT 
      u.id,
      'Inventory Material Request',
      'New material request for equipment ' || NEW.equipment_name || ' requires inventory review.',
      'inventory',
      'equipment',
      NEW.equipment_id,
      NEW.priority,
      '/inventory/requests/' || NEW.id,
      now(),
      'inventory'
    FROM public.users u 
    WHERE u.role = 'inventory' OR u.roles @> ARRAY['inventory'];
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on cm_inventory_material_requests table
DROP TRIGGER IF EXISTS inventory_material_request_notification ON public.cm_inventory_material_requests;
CREATE TRIGGER inventory_material_request_notification
  AFTER INSERT ON public.cm_inventory_material_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_inventory_notification();

-- Log this migration
INSERT INTO migration_rollback_log (migration_name, rollback_sql) VALUES (
  'create_inventory_notification_trigger',
  '-- Rollback: Remove trigger and function
   -- DROP TRIGGER IF EXISTS inventory_material_request_notification ON public.cm_inventory_material_requests;
   -- DROP FUNCTION IF EXISTS public.create_inventory_notification();'
); 