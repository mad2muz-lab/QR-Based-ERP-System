-- Migration: Enhance Notifications Table
-- This adds new columns to the existing notifications table
-- No existing data is modified or removed

-- Add new columns to notifications table (if they don't exist)
DO $$ 
BEGIN
    -- Add maintenance_request_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'maintenance_request_id') THEN
        ALTER TABLE public.notifications ADD COLUMN maintenance_request_id text;
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'priority') THEN
        ALTER TABLE public.notifications ADD COLUMN priority text DEFAULT 'medium';
    END IF;

    -- Add assigned_to column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.notifications ADD COLUMN assigned_to text;
    END IF;
END $$;

-- Create index for maintenance_request_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_notifications_maintenance_request_id ON public.notifications(maintenance_request_id);

-- Log this migration
INSERT INTO migration_rollback_log (migration_name, rollback_sql) VALUES (
  'enhance_notifications_table',
  '-- Rollback: Remove added columns (if needed)
   -- ALTER TABLE public.notifications DROP COLUMN IF EXISTS maintenance_request_id;
   -- ALTER TABLE public.notifications DROP COLUMN IF EXISTS priority;
   -- ALTER TABLE public.notifications DROP COLUMN IF EXISTS assigned_to;
   -- DROP INDEX IF EXISTS idx_notifications_maintenance_request_id;'
); 