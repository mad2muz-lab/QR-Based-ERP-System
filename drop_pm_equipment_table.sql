-- Drop the pm_equipment table and clean up
-- This will remove all PM equipment related changes

-- Drop the pm_equipment table
DROP TABLE IF EXISTS pm_equipment CASCADE;

-- Verify the table is gone
SELECT 
    'PM Equipment Table Status' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pm_equipment'
    ) as table_exists;

-- Show remaining tables (should not include pm_equipment)
SELECT 
    'Remaining Tables' as check_type,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%pm%'
ORDER BY table_name; 