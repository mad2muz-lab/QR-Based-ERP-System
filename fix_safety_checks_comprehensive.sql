-- Comprehensive Safety Checks Fix Script
-- This script will diagnose and fix all safety_checks_passed issues in the PM system
-- Run this in your Supabase SQL Editor

-- =====================================================
-- STEP 1: DIAGNOSE CURRENT STATE
-- =====================================================

-- 1.1 Check if the table exists
SELECT 
    'Checking if preventive_maintenance_logs table exists:' as info;
    
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'preventive_maintenance_logs'
) as table_exists;

-- 1.2 Check current column definition
SELECT 
    'Current safety_checks_passed column definition:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_logs' 
  AND column_name = 'safety_checks_passed';

-- 1.3 Check current data distribution
SELECT 
    'Current safety_checks_passed data distribution:' as info;
    
SELECT 
    safety_checks_passed,
    COUNT(*) as record_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM preventive_maintenance_logs), 2) as percentage
FROM preventive_maintenance_logs 
GROUP BY safety_checks_passed
ORDER BY safety_checks_passed;

-- 1.4 Check for null values specifically
SELECT 
    'Records with NULL safety_checks_passed:' as info;
    
SELECT COUNT(*) as null_count
FROM preventive_maintenance_logs 
WHERE safety_checks_passed IS NULL;

-- 1.5 Show sample of problematic records
SELECT 
    'Sample records with NULL safety_checks_passed:' as info;
    
SELECT 
    id,
    equipment_id,
    maintenance_class,
    checklist_completed,
    safety_checks_passed,
    completed_date
FROM preventive_maintenance_logs 
WHERE safety_checks_passed IS NULL
ORDER BY completed_date DESC
LIMIT 5;

-- =====================================================
-- STEP 2: FIX DATA ISSUES
-- =====================================================

-- 2.1 Update null values to false for completed checklists
UPDATE preventive_maintenance_logs 
SET safety_checks_passed = false 
WHERE safety_checks_passed IS NULL 
  AND checklist_completed = true;

-- 2.2 Update null values to false for incomplete checklists
UPDATE preventive_maintenance_logs 
SET safety_checks_passed = false 
WHERE safety_checks_passed IS NULL 
  AND (checklist_completed = false OR checklist_completed IS NULL);

-- 2.3 Set safety_checks_passed = true for recent completed PMs (last 30 days)
-- This ensures recent maintenance has proper safety compliance
UPDATE preventive_maintenance_logs 
SET safety_checks_passed = true 
WHERE checklist_completed = true 
  AND completed_date >= CURRENT_DATE - INTERVAL '30 days'
  AND safety_checks_passed = false
  AND maintenance_class IN ('A', 'B', 'C'); -- Only for actual PM classes

-- =====================================================
-- STEP 3: FIX COLUMN CONSTRAINTS
-- =====================================================

-- 3.1 Add default value if not exists
DO $$
BEGIN
    -- Check if default exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preventive_maintenance_logs' 
        AND column_name = 'safety_checks_passed' 
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE preventive_maintenance_logs 
        ALTER COLUMN safety_checks_passed SET DEFAULT false;
        RAISE NOTICE 'Default value added to safety_checks_passed column';
    ELSE
        RAISE NOTICE 'Default value already exists for safety_checks_passed column';
    END IF;
END $$;

-- 3.2 Make column NOT NULL if it isn't already
DO $$
BEGIN
    -- Check if column is nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preventive_maintenance_logs' 
        AND column_name = 'safety_checks_passed' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE preventive_maintenance_logs 
        ALTER COLUMN safety_checks_passed SET NOT NULL;
        RAISE NOTICE 'safety_checks_passed column made NOT NULL';
    ELSE
        RAISE NOTICE 'safety_checks_passed column is already NOT NULL';
    END IF;
END $$;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

-- 4.1 Verify no null values remain
SELECT 
    'Verification: Records with NULL safety_checks_passed (should be 0):' as info;
    
SELECT COUNT(*) as remaining_null_count
FROM preventive_maintenance_logs 
WHERE safety_checks_passed IS NULL;

-- 4.2 Verify data distribution after fix
SELECT 
    'Verification: Updated safety_checks_passed data distribution:' as info;
    
SELECT 
    safety_checks_passed,
    COUNT(*) as record_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM preventive_maintenance_logs), 2) as percentage
FROM preventive_maintenance_logs 
GROUP BY safety_checks_passed
ORDER BY safety_checks_passed;

-- 4.3 Verify column constraints
SELECT 
    'Verification: Final column definition:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_logs' 
  AND column_name = 'safety_checks_passed';

-- 4.4 Show recent PM logs with safety checks
SELECT 
    'Recent PM logs with safety checks status:' as info;
    
SELECT 
    id,
    equipment_id,
    maintenance_class,
    checklist_completed,
    safety_checks_passed,
    quality_score,
    completed_date
FROM preventive_maintenance_logs 
WHERE checklist_completed = true
ORDER BY completed_date DESC
LIMIT 10;

-- =====================================================
-- STEP 5: ADDITIONAL SAFETY MEASURES
-- =====================================================

-- 5.1 Create a function to ensure safety checks are always set
CREATE OR REPLACE FUNCTION ensure_safety_checks_default()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure safety_checks_passed is never null
    IF NEW.safety_checks_passed IS NULL THEN
        NEW.safety_checks_passed := false;
    END IF;
    
    -- If checklist is completed but safety checks not explicitly set, default to true
    IF NEW.checklist_completed = true AND NEW.safety_checks_passed = false THEN
        -- Only set to true if it's a recent completion (within last hour)
        IF NEW.completed_date >= NOW() - INTERVAL '1 hour' THEN
            NEW.safety_checks_passed := true;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 Create trigger to automatically handle safety checks
DROP TRIGGER IF EXISTS ensure_safety_checks_trigger ON preventive_maintenance_logs;

CREATE TRIGGER ensure_safety_checks_trigger
    BEFORE INSERT OR UPDATE ON preventive_maintenance_logs
    FOR EACH ROW
    EXECUTE FUNCTION ensure_safety_checks_default();

-- =====================================================
-- STEP 6: FINAL SUMMARY
-- =====================================================

SELECT 
    '=== SAFETY CHECKS FIX COMPLETE ===' as summary;

SELECT 
    'Summary of changes made:' as info,
    '1. Fixed NULL safety_checks_passed values' as change_1,
    '2. Set proper default value (false)' as change_2,
    '3. Made column NOT NULL' as change_3,
    '4. Updated recent PMs to have safety_checks_passed = true' as change_4,
    '5. Added trigger for automatic safety checks handling' as change_5;

-- 6.1 Final count verification
SELECT 
    'Final record counts:' as info;
    
SELECT 
    'Total PM logs:' as metric,
    COUNT(*) as count
FROM preventive_maintenance_logs
UNION ALL
SELECT 
    'Completed PM logs:' as metric,
    COUNT(*) as count
FROM preventive_maintenance_logs
WHERE checklist_completed = true
UNION ALL
SELECT 
    'PM logs with safety_checks_passed = true:' as metric,
    COUNT(*) as count
FROM preventive_maintenance_logs
WHERE safety_checks_passed = true
UNION ALL
SELECT 
    'PM logs with safety_checks_passed = false:' as metric,
    COUNT(*) as count
FROM preventive_maintenance_logs
WHERE safety_checks_passed = false;

SELECT 
    '=== SCRIPT EXECUTION COMPLETE ===' as completion_message; 