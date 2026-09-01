-- Check Equipment Table PM Columns
-- This script checks what PM-related columns exist in the equipment table

-- 1. Check all PM-related columns in equipment table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    'PM Column' as column_type
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND (
    column_name LIKE '%pm%' 
    OR column_name LIKE '%maintenance%'
    OR column_name IN ('usage_duration', 'last_pm_date', 'next_pm_date', 'pm_status')
  )
ORDER BY column_name;

-- 2. Check if specific PM columns exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'last_pm_date') 
        THEN '✅ last_pm_date exists' 
        ELSE '❌ last_pm_date missing' 
    END as last_pm_date_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'next_pm_date') 
        THEN '✅ next_pm_date exists' 
        ELSE '❌ next_pm_date missing' 
    END as next_pm_date_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'pm_status') 
        THEN '✅ pm_status exists' 
        ELSE '❌ pm_status missing' 
    END as pm_status_status;

-- 3. Show sample equipment with PM data
SELECT 
    id,
    name,
    type,
    is_pm,
    pm_class,
    pm_frequency_hours,
    usage_duration,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'last_pm_date') 
        THEN last_pm_date::text 
        ELSE 'Column not found' 
    END as last_pm_date,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'next_pm_date') 
        THEN next_pm_date::text 
        ELSE 'Column not found' 
    END as next_pm_date,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'pm_status') 
        THEN pm_status 
        ELSE 'Column not found' 
    END as pm_status
FROM equipment 
WHERE is_pm = true 
LIMIT 5; 