-- Enhance Equipment Table for PM Forecasting
-- This script adds missing fields needed for accurate PM forecasting

-- =====================================================
-- 1. ADD MISSING PM FIELDS TO EQUIPMENT TABLE
-- =====================================================

-- Add next_pm_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment' AND column_name = 'next_pm_date') THEN
        ALTER TABLE equipment ADD COLUMN next_pm_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add last_pm_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment' AND column_name = 'last_pm_date') THEN
        ALTER TABLE equipment ADD COLUMN last_pm_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add pm_cost_estimate column for custom cost estimates
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment' AND column_name = 'pm_cost_estimate') THEN
        ALTER TABLE equipment ADD COLUMN pm_cost_estimate DECIMAL(10,2);
    END IF;
END $$;

-- Add pm_frequency_days column for custom frequency
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipment' AND column_name = 'pm_frequency_days') THEN
        ALTER TABLE equipment ADD COLUMN pm_frequency_days INTEGER;
    END IF;
END $$;

-- =====================================================
-- 2. UPDATE EXISTING EQUIPMENT WITH DEFAULT VALUES
-- =====================================================

-- Set default PM frequency days based on PM class
UPDATE equipment 
SET pm_frequency_days = 
    CASE 
        WHEN pm_class = 'Class A' THEN 90
        WHEN pm_class = 'Class B' THEN 365
        WHEN pm_class = 'Class C' THEN 730
        ELSE 30
    END
WHERE is_pm = true AND pm_frequency_days IS NULL;

-- Set default cost estimates based on PM class
UPDATE equipment 
SET pm_cost_estimate = 
    CASE 
        WHEN pm_class = 'Class A' THEN 500.00
        WHEN pm_class = 'Class B' THEN 1500.00
        WHEN pm_class = 'Class C' THEN 3000.00
        ELSE 800.00
    END
WHERE is_pm = true AND pm_cost_estimate IS NULL;

-- =====================================================
-- 3. CALCULATE NEXT PM DATES FOR EQUIPMENT
-- =====================================================

-- Update next_pm_date for equipment that don't have it set
UPDATE equipment 
SET next_pm_date = 
    CASE 
        WHEN last_pm_date IS NOT NULL THEN 
            last_pm_date + INTERVAL '1 day' * pm_frequency_days
        ELSE 
            created_at + INTERVAL '1 day' * pm_frequency_days
    END
WHERE is_pm = true 
  AND next_pm_date IS NULL 
  AND pm_frequency_days IS NOT NULL;

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for PM forecasting queries
CREATE INDEX IF NOT EXISTS idx_equipment_pm_forecast 
ON equipment(is_pm, pm_class, next_pm_date, last_pm_date);

-- Index for PM status queries
CREATE INDEX IF NOT EXISTS idx_equipment_pm_status 
ON equipment(is_pm, pm_status, next_pm_date);

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Check PM forecasting data
SELECT 
    'PM Forecasting Data Summary' as info,
    COUNT(*) as total_equipment,
    COUNT(CASE WHEN is_pm = true THEN 1 END) as pm_enrolled,
    COUNT(CASE WHEN next_pm_date IS NOT NULL THEN 1 END) as has_next_pm_date,
    COUNT(CASE WHEN last_pm_date IS NOT NULL THEN 1 END) as has_last_pm_date,
    COUNT(CASE WHEN pm_cost_estimate IS NOT NULL THEN 1 END) as has_cost_estimate
FROM equipment;

-- Show sample PM forecasting data
SELECT 
    name,
    type,
    pm_class,
    pm_frequency_days,
    pm_cost_estimate,
    last_pm_date,
    next_pm_date,
    CASE 
        WHEN next_pm_date <= NOW() THEN 'OVERDUE'
        WHEN next_pm_date <= NOW() + INTERVAL '30 days' THEN 'DUE_SOON'
        ELSE 'SCHEDULED'
    END as pm_status
FROM equipment 
WHERE is_pm = true 
ORDER BY next_pm_date ASC 
LIMIT 10;

-- =====================================================
-- 6. UPDATE FRONTEND QUERY
-- =====================================================

-- The frontend should now query these additional fields:
/*
SELECT 
    id, custom_equipment_id, name, type, model, site, qr_code, 
    status, operational_status, is_pm, pm_class, pm_frequency_hours,
    pm_frequency_days, pm_cost_estimate, usage_duration, 
    last_pm_date, next_pm_date, created_at, last_updated
FROM equipment
WHERE is_pm = true 
  AND pm_class IS NOT NULL
ORDER BY name ASC
*/ 