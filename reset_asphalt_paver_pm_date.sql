-- Reset PM due date for Asphalt Paver to yesterday (past due) for testing
-- This will make the PM task overdue so it appears in the assignment workflow

UPDATE equipment 
SET 
    "next_pm_date" = (CURRENT_DATE - INTERVAL '1 day')::date,
    "pm_class" = 'Class C',
    "is_pm" = true
WHERE 
    "Equipment Name" = 'Asphalt Paver';

-- Verify the update
SELECT 
    "Equipment Name",
    "Equipment type",
    "is_pm",
    "pm_class",
    "next_pm_date",
    CASE 
        WHEN "next_pm_date" < CURRENT_DATE THEN 'OVERDUE'
        WHEN "next_pm_date" = CURRENT_DATE THEN 'DUE TODAY'
        ELSE 'FUTURE'
    END as pm_status
FROM equipment 
WHERE "Equipment Name" = 'Asphalt Paver';
