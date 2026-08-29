-- Add Quality Score System Columns to preventive_maintenance_logs
-- This script adds the missing columns needed for the PM quality score calculation

-- 1. Add quality score and safety columns
ALTER TABLE preventive_maintenance_logs 
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
ADD COLUMN IF NOT EXISTS safety_checks_passed BOOLEAN DEFAULT false;

-- 2. Add checklist completion tracking columns
ALTER TABLE preventive_maintenance_logs 
ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_items INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_items_completed INTEGER DEFAULT 0;

-- 3. Add documentation tracking columns
ALTER TABLE preventive_maintenance_logs 
ADD COLUMN IF NOT EXISTS photos_documented INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes_documented INTEGER DEFAULT 0;

-- 4. Add detailed checklist data column
ALTER TABLE preventive_maintenance_logs 
ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb;

-- 5. Add comments to document the new columns
COMMENT ON COLUMN preventive_maintenance_logs.quality_score IS 'Quality score from 0-100 based on completion, required items, photos, and notes';
COMMENT ON COLUMN preventive_maintenance_logs.safety_checks_passed IS 'Whether all safety-critical items were completed';
COMMENT ON COLUMN preventive_maintenance_logs.total_items IS 'Total number of checklist items';
COMMENT ON COLUMN preventive_maintenance_logs.completed_items IS 'Number of items completed';
COMMENT ON COLUMN preventive_maintenance_logs.required_items_completed IS 'Number of required items completed';
COMMENT ON COLUMN preventive_maintenance_logs.photos_documented IS 'Number of items with photo documentation';
COMMENT ON COLUMN preventive_maintenance_logs.notes_documented IS 'Number of items with notes';
COMMENT ON COLUMN preventive_maintenance_logs.checklist_items IS 'Detailed checklist data including items, completion status, photos, and notes';

-- 6. Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'preventive_maintenance_logs' 
  AND column_name IN (
    'quality_score', 
    'safety_checks_passed', 
    'total_items', 
    'completed_items', 
    'required_items_completed',
    'photos_documented',
    'notes_documented',
    'checklist_items'
  )
ORDER BY column_name; 