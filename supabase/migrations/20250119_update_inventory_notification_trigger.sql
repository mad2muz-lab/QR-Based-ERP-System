-- Migration: Update Inventory Notification Trigger
-- This updates the inventory notification trigger to follow the same user-based pattern as maintenance
-- No existing functionality is modified or removed

-- Update the trigger function for inventory notifications
CREATE OR REPLACE FUNCTION public.create_inventory_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    -- Create notifications for admin and maintenance@system.local users (same as maintenance)
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
      'Inventory Material Request',
      'New material request for equipment ' || NEW.equipment_name || ' requires inventory review.',
      'inventory',
      'equipment',
      NEW.equipment_id,
      NEW.priority,
      '/inventory/requests/' || NEW.id,
      now()
    FROM public.users u 
    WHERE u.username = 'admin' OR u.email = 'maintenance@system.local';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log this migration
INSERT INTO migration_rollback_log (migration_name, rollback_sql) VALUES (
  'update_inventory_notification_trigger',
  '-- Rollback: Revert to role-based trigger
   -- CREATE OR REPLACE FUNCTION public.create_inventory_notification()
   -- RETURNS TRIGGER AS $$
   -- BEGIN
   --   IF NEW.status = ''pending'' THEN
   --     INSERT INTO public.notifications (
   --       user_id, title, message, type, entity_type, entity_id, priority, action_url, created_at, role
   --     ) 
   --     SELECT 
   --       u.id, ''Inventory Material Request'', ''New material request for equipment '' || NEW.equipment_name || '' requires inventory review.'', ''inventory'', ''equipment'', NEW.equipment_id, NEW.priority, ''/inventory/requests/'' || NEW.id, now(), ''inventory''
   --     FROM public.users u 
   --     WHERE u.role = ''inventory'' OR u.roles @> ARRAY[''inventory''];
   --   END IF;
   --   RETURN NEW;
   -- END;
   -- $$ LANGUAGE plpgsql SECURITY DEFINER;'
); 