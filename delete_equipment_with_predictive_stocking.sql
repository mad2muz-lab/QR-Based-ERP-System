-- Delete Equipment Records with Predictive Stocking Foreign Key Handling
-- This script handles the foreign key constraint from predictive_stocking table

-- Option 1: Delete all equipment except one (handling all foreign key references)
-- Replace 'EQUIPMENT-ID-TO-KEEP' with the ID you want to keep

-- First, delete related records from predictive_stocking
DELETE FROM predictive_stocking 
WHERE equipment_id != 'EQUIPMENT-ID-TO-KEEP';

-- Delete related records from ai_learning_data
DELETE FROM ai_learning_data 
WHERE equipment_id != 'EQUIPMENT-ID-TO-KEEP';

-- Delete related records from predictive_alerts
DELETE FROM predictive_alerts 
WHERE equipment_id != 'EQUIPMENT-ID-TO-KEEP';

-- Delete related records from prediction_accuracy_tracking
DELETE FROM prediction_accuracy_tracking 
WHERE material_id IN (
  SELECT DISTINCT material_id 
  FROM predictive_stocking 
  WHERE equipment_id != 'EQUIPMENT-ID-TO-KEEP'
);

-- Now delete equipment records
DELETE FROM equipment 
WHERE id != 'EQUIPMENT-ID-TO-KEEP';

-- Option 2: Delete specific equipment by ID
-- Replace 'SPECIFIC-EQUIPMENT-ID' with the exact ID you want to delete

-- First, delete related records from predictive_stocking
DELETE FROM predictive_stocking 
WHERE equipment_id = 'SPECIFIC-EQUIPMENT-ID';

-- Delete related records from ai_learning_data
DELETE FROM ai_learning_data 
WHERE equipment_id = 'SPECIFIC-EQUIPMENT-ID';

-- Delete related records from predictive_alerts
DELETE FROM predictive_alerts 
WHERE equipment_id = 'SPECIFIC-EQUIPMENT-ID';

-- Delete related records from prediction_accuracy_tracking
DELETE FROM prediction_accuracy_tracking 
WHERE material_id IN (
  SELECT DISTINCT material_id 
  FROM predictive_stocking 
  WHERE equipment_id = 'SPECIFIC-EQUIPMENT-ID'
);

-- Now delete the specific equipment
DELETE FROM equipment 
WHERE id = 'SPECIFIC-EQUIPMENT-ID';

-- Option 3: Quick delete all equipment (nuclear option)
-- WARNING: This will delete ALL equipment and related data

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Delete all predictive stocking data
DELETE FROM predictive_stocking;
DELETE FROM ai_learning_data;
DELETE FROM predictive_alerts;
DELETE FROM prediction_accuracy_tracking;

-- Delete all equipment
DELETE FROM equipment;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verification queries
SELECT 'Equipment deletion completed' as status;

SELECT 
  'Equipment' as table_name,
  COUNT(*) as record_count
FROM equipment;

SELECT 
  'Predictive Stocking' as table_name,
  COUNT(*) as record_count
FROM predictive_stocking;

SELECT 
  'AI Learning Data' as table_name,
  COUNT(*) as record_count
FROM ai_learning_data;

SELECT 
  'Predictive Alerts' as table_name,
  COUNT(*) as record_count
FROM predictive_alerts;

SELECT 
  'Accuracy Tracking' as table_name,
  COUNT(*) as record_count
FROM prediction_accuracy_tracking; 