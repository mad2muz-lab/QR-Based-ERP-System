-- Automated PM Schedule Generation System
-- This creates backend functions to automatically generate PM schedules

-- =====================================================
-- 1. FUNCTION TO CALCULATE EQUIPMENT USAGE
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_equipment_usage(equipment_id_param TEXT)
RETURNS TABLE (
  total_hours NUMERIC,
  total_km NUMERIC,
  last_usage_date TIMESTAMP WITH TIME ZONE,
  days_since_last_maintenance INTEGER
) AS $$
DECLARE
  total_hours_val NUMERIC := 0;
  total_km_val NUMERIC := 0;
  last_usage_date_val TIMESTAMP WITH TIME ZONE;
  days_since_maintenance INTEGER := 0;
  log_record RECORD;
  stop_log_record RECORD;
BEGIN
  -- Calculate usage from equipment logs
  FOR log_record IN 
    SELECT * FROM equipment_logs 
    WHERE equipment_id = equipment_id_param 
    AND action = 'start-use'
    ORDER BY created_at DESC
  LOOP
    -- Find corresponding stop-use log
    SELECT * INTO stop_log_record 
    FROM equipment_logs 
    WHERE equipment_id = equipment_id_param 
    AND action = 'stop-use' 
    AND created_at > log_record.created_at
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF stop_log_record IS NOT NULL THEN
      -- Calculate duration in hours
      total_hours_val := total_hours_val + 
        EXTRACT(EPOCH FROM (stop_log_record.created_at - log_record.created_at)) / 3600;
      
      -- Estimate km (rough calculation: 50 km/h average)
      total_km_val := total_km_val + 
        (EXTRACT(EPOCH FROM (stop_log_record.created_at - log_record.created_at)) / 3600) * 50;
      
      -- Track last usage date
      IF last_usage_date_val IS NULL OR stop_log_record.created_at > last_usage_date_val THEN
        last_usage_date_val := stop_log_record.created_at;
      END IF;
    END IF;
  END LOOP;
  
  -- Calculate days since last maintenance
  SELECT COALESCE(
    EXTRACT(DAY FROM (NOW() - last_pm_date))::INTEGER, 
    0
  ) INTO days_since_maintenance
  FROM equipment 
  WHERE id = equipment_id_param;
  
  RETURN QUERY SELECT 
    total_hours_val,
    total_km_val,
    last_usage_date_val,
    days_since_maintenance;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FUNCTION TO GENERATE AUTOMATIC PM SCHEDULES
-- =====================================================

CREATE OR REPLACE FUNCTION generate_automatic_pm_schedules()
RETURNS TABLE (
  equipment_id TEXT,
  equipment_name TEXT,
  equipment_type TEXT,
  maintenance_class TEXT,
  current_usage_hours NUMERIC,
  threshold_hours INTEGER,
  days_overdue INTEGER,
  priority TEXT,
  scheduled_date DATE,
  estimated_duration INTEGER,
  preventive_type_id TEXT
) AS $$
DECLARE
  equipment_record RECORD;
  pm_config_record RECORD;
  usage_record RECORD;
  threshold_hours_val INTEGER;
  maintenance_class_val TEXT;
  interval_days INTEGER;
  is_due_by_hours BOOLEAN;
  is_due_by_days BOOLEAN;
  days_overdue_val INTEGER;
  priority_val TEXT;
  scheduled_date_val DATE;
  estimated_duration_val INTEGER;
BEGIN
  -- Loop through all equipment enrolled in PM
  FOR equipment_record IN 
    SELECT * FROM equipment 
    WHERE is_pm = true
  LOOP
    -- Get PM configurations for this equipment type
    FOR pm_config_record IN 
      SELECT * FROM preventive_maintenance_configs 
      WHERE equipment_type = equipment_record.type
      AND is_active = true
    LOOP
      -- Calculate current usage
      SELECT * INTO usage_record 
      FROM calculate_equipment_usage(equipment_record.id);
      
      -- Get configuration values
      threshold_hours_val := COALESCE(
        CASE pm_config_record.maintenance_class
          WHEN 'Class A' THEN pm_config_record.class_a_threshold_hours
          WHEN 'Class B' THEN pm_config_record.class_b_threshold_hours
          WHEN 'Class C' THEN pm_config_record.class_c_threshold_hours
          ELSE 0
        END, 0
      );
      
      maintenance_class_val := pm_config_record.maintenance_class;
      interval_days := COALESCE(pm_config_record.interval_days, 30);
      
      -- Check if maintenance is due
      is_due_by_hours := usage_record.total_hours >= threshold_hours_val;
      is_due_by_days := usage_record.days_since_last_maintenance >= interval_days;
      
      IF is_due_by_hours OR is_due_by_days THEN
        -- Calculate priority
        days_overdue_val := GREATEST(0, usage_record.days_since_last_maintenance - interval_days);
        
        IF days_overdue_val > 30 THEN
          priority_val := 'critical';
        ELSIF days_overdue_val > 14 THEN
          priority_val := 'high';
        ELSIF days_overdue_val > 7 THEN
          priority_val := 'medium';
        ELSE
          priority_val := 'low';
        END IF;
        
        -- Calculate scheduled date
        IF days_overdue_val > 0 THEN
          scheduled_date_val := CURRENT_DATE + INTERVAL '1 day'; -- Schedule for tomorrow if overdue
        ELSE
          scheduled_date_val := CURRENT_DATE + INTERVAL '7 days'; -- Schedule for next week if due soon
        END IF;
        
        -- Estimate duration based on maintenance class
        CASE maintenance_class_val
          WHEN 'Class A' THEN estimated_duration_val := 2;
          WHEN 'Class B' THEN estimated_duration_val := 4;
          WHEN 'Class C' THEN estimated_duration_val := 8;
          WHEN 'Routine' THEN estimated_duration_val := 1;
          ELSE estimated_duration_val := 2;
        END CASE;
        
        -- Return the schedule
        RETURN QUERY SELECT 
          equipment_record.id,
          equipment_record.name,
          equipment_record.type,
          maintenance_class_val,
          usage_record.total_hours,
          threshold_hours_val,
          days_overdue_val,
          priority_val,
          scheduled_date_val,
          estimated_duration_val,
          equipment_record.name || '_' || maintenance_class_val;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FUNCTION TO CREATE PM LOGS FROM SCHEDULES
-- =====================================================

CREATE OR REPLACE FUNCTION create_pm_logs_from_schedules()
RETURNS TABLE (
  created_count INTEGER,
  error_count INTEGER
) AS $$
DECLARE
  schedule_record RECORD;
  created_count_val INTEGER := 0;
  error_count_val INTEGER := 0;
BEGIN
  -- Loop through generated schedules
  FOR schedule_record IN 
    SELECT * FROM generate_automatic_pm_schedules()
  LOOP
    BEGIN
      -- Check if PM log already exists for this equipment and maintenance class
      IF NOT EXISTS (
        SELECT 1 FROM preventive_maintenance_logs 
        WHERE equipment_id = schedule_record.equipment_id 
        AND maintenance_class = schedule_record.maintenance_class
        AND status IN ('scheduled', 'in_progress')
      ) THEN
        -- Insert new PM log
        INSERT INTO preventive_maintenance_logs (
          equipment_id,
          maintenance_class,
          maintenance_type,
          preventive_type_id,
          scheduled_date,
          status,
          checklist_completed,
          notes
        ) VALUES (
          schedule_record.equipment_id,
          schedule_record.maintenance_class,
          'preventive',
          schedule_record.preventive_type_id,
          schedule_record.scheduled_date,
          'scheduled',
          false,
          'Automatically generated PM schedule - Priority: ' || schedule_record.priority || 
          ', Usage: ' || schedule_record.current_usage_hours || ' hours, Overdue: ' || 
          schedule_record.days_overdue || ' days'
        );
        
        created_count_val := created_count_val + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        error_count_val := error_count_val + 1;
        RAISE NOTICE 'Error creating PM log for equipment %: %', schedule_record.equipment_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT created_count_val, error_count_val;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCTION TO SEND NOTIFICATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION send_pm_notifications()
RETURNS TABLE (
  notification_count INTEGER,
  critical_count INTEGER
) AS $$
DECLARE
  schedule_record RECORD;
  notification_count_val INTEGER := 0;
  critical_count_val INTEGER := 0;
BEGIN
  -- Create notifications for generated schedules
  FOR schedule_record IN 
    SELECT * FROM generate_automatic_pm_schedules()
  LOOP
    -- Insert notification record (you can extend this to send emails/SMS)
    INSERT INTO pm_notifications (
      equipment_id,
      equipment_name,
      maintenance_class,
      priority,
      scheduled_date,
      message,
      notification_type,
      created_at
    ) VALUES (
      schedule_record.equipment_id,
      schedule_record.equipment_name,
      schedule_record.maintenance_class,
      schedule_record.priority,
      schedule_record.scheduled_date,
      'PM Schedule Generated: ' || schedule_record.equipment_name || 
      ' needs ' || schedule_record.maintenance_class || ' maintenance. Priority: ' || 
      schedule_record.priority,
      CASE 
        WHEN schedule_record.priority = 'critical' THEN 'urgent'
        WHEN schedule_record.priority = 'high' THEN 'important'
        ELSE 'normal'
      END,
      NOW()
    );
    
    notification_count_val := notification_count_val + 1;
    
    IF schedule_record.priority = 'critical' THEN
      critical_count_val := critical_count_val + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT notification_count_val, critical_count_val;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. MAIN FUNCTION TO RUN DAILY PM GENERATION
-- =====================================================

CREATE OR REPLACE FUNCTION run_daily_pm_generation()
RETURNS TABLE (
  schedules_generated INTEGER,
  pm_logs_created INTEGER,
  notifications_sent INTEGER,
  critical_alerts INTEGER
) AS $$
DECLARE
  schedules_count INTEGER;
  pm_logs_result RECORD;
  notifications_result RECORD;
BEGIN
  -- Count generated schedules
  SELECT COUNT(*) INTO schedules_count 
  FROM generate_automatic_pm_schedules();
  
  -- Create PM logs from schedules
  SELECT * INTO pm_logs_result 
  FROM create_pm_logs_from_schedules();
  
  -- Send notifications
  SELECT * INTO notifications_result 
  FROM send_pm_notifications();
  
  -- Log the generation run
  INSERT INTO pm_generation_logs (
    generation_date,
    schedules_generated,
    pm_logs_created,
    pm_logs_errors,
    notifications_sent,
    critical_alerts,
    created_at
  ) VALUES (
    CURRENT_DATE,
    schedules_count,
    pm_logs_result.created_count,
    pm_logs_result.error_count,
    notifications_result.notification_count,
    notifications_result.critical_count,
    NOW()
  );
  
  RETURN QUERY SELECT 
    schedules_count,
    pm_logs_result.created_count,
    notifications_result.notification_count,
    notifications_result.critical_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE SUPPORTING TABLES
-- =====================================================

-- PM Notifications table
CREATE TABLE IF NOT EXISTS pm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  maintenance_class TEXT NOT NULL,
  priority TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('urgent', 'important', 'normal')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PM Generation Logs table
CREATE TABLE IF NOT EXISTS pm_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_date DATE NOT NULL,
  schedules_generated INTEGER DEFAULT 0,
  pm_logs_created INTEGER DEFAULT 0,
  pm_logs_errors INTEGER DEFAULT 0,
  notifications_sent INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pm_notifications_equipment_id ON pm_notifications(equipment_id);
CREATE INDEX IF NOT EXISTS idx_pm_notifications_priority ON pm_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_pm_notifications_created_at ON pm_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_pm_generation_logs_date ON pm_generation_logs(generation_date);

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE pm_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_generation_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. CREATE POLICIES
-- =====================================================

-- Allow authenticated users to view notifications
CREATE POLICY "Allow authenticated users to view PM notifications" ON pm_notifications
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow system to insert notifications
CREATE POLICY "Allow system to insert PM notifications" ON pm_notifications
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view generation logs
CREATE POLICY "Allow authenticated users to view PM generation logs" ON pm_generation_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow system to insert generation logs
CREATE POLICY "Allow system to insert PM generation logs" ON pm_generation_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 10. TEST THE SYSTEM
-- =====================================================

-- Test the daily generation function
-- SELECT * FROM run_daily_pm_generation();

-- View recent notifications
-- SELECT * FROM pm_notifications ORDER BY created_at DESC LIMIT 10;

-- View generation history
-- SELECT * FROM pm_generation_logs ORDER BY created_at DESC LIMIT 5; 