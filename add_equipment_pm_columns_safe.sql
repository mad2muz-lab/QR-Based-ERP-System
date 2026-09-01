-- Add Missing PM Columns to Equipment Table (SAFE)
-- This script adds the missing columns needed for PM system with safe defaults

-- 1. Check current PM columns in equipment table
SELECT 
    'Current PM columns in equipment table:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND column_name LIKE '%pm%'
ORDER BY column_name;

-- 2. Add missing PM columns with safe defaults
-- These columns are optional and won't affect existing functionality

-- Add usage_duration if not exists
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS usage_duration NUMERIC DEFAULT 0;

-- Add last_pm_date if not exists
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS last_pm_date TIMESTAMP WITH TIME ZONE;

-- Add next_pm_date if not exists  
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS next_pm_date TIMESTAMP WITH TIME ZONE;

-- Add pm_status if not exists
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS pm_status TEXT DEFAULT 'not_enrolled' 
CHECK (pm_status IN ('not_enrolled', 'enrolled', 'due', 'overdue', 'in_progress', 'completed'));

-- 3. Add comments to document the new columns
COMMENT ON COLUMN equipment.usage_duration IS 'Current usage hours since last PM reset';
COMMENT ON COLUMN equipment.last_pm_date IS 'Date of last completed PM';
COMMENT ON COLUMN equipment.next_pm_date IS 'Date of next scheduled PM';
COMMENT ON COLUMN equipment.pm_status IS 'Current PM status: not_enrolled, enrolled, due, overdue, in_progress, completed';

-- 4. Verify the changes
SELECT 
    'New PM columns added to equipment table:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND column_name IN ('usage_duration', 'last_pm_date', 'next_pm_date', 'pm_status')
ORDER BY column_name;

-- 5. Show sample equipment data to verify no impact
SELECT 
    'Sample equipment data (first 3 PM-enabled equipment):' as info;
    
SELECT 
    id,
    name,
    type,
    is_pm,
    pm_class,
    usage_duration,
    last_pm_date,
    next_pm_date,
    pm_status
FROM equipment 
WHERE is_pm = true 
LIMIT 3; 