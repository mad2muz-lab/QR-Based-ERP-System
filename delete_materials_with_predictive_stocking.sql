-- Delete Materials Records with Predictive Stocking Foreign Key Handling
-- This script handles the foreign key constraint from predictive_stocking table

-- Option 1: Delete all materials except one (handling all foreign key references)
-- Replace 'MATERIAL-ID-TO-KEEP' with the ID you want to keep

-- First, delete related records from predictive_stocking
DELETE FROM predictive_stocking 
WHERE material_id != 'MATERIAL-ID-TO-KEEP';

-- Delete related records from ai_learning_data
DELETE FROM ai_learning_data 
WHERE material_id != 'MATERIAL-ID-TO-KEEP';

-- Delete related records from predictive_alerts
DELETE FROM predictive_alerts 
WHERE material_id != 'MATERIAL-ID-TO-KEEP';

-- Delete related records from prediction_accuracy_tracking
DELETE FROM prediction_accuracy_tracking 
WHERE material_id != 'MATERIAL-ID-TO-KEEP';

-- Now delete materials records
DELETE FROM materials 
WHERE id != 'MATERIAL-ID-TO-KEEP';

-- Option 2: Delete specific material by ID
-- Replace 'SPECIFIC-MATERIAL-ID' with the exact ID you want to delete

-- First, delete related records from predictive_stocking
DELETE FROM predictive_stocking 
WHERE material_id = 'SPECIFIC-MATERIAL-ID';

-- Delete related records from ai_learning_data
DELETE FROM ai_learning_data 
WHERE material_id = 'SPECIFIC-MATERIAL-ID';

-- Delete related records from predictive_alerts
DELETE FROM predictive_alerts 
WHERE material_id = 'SPECIFIC-MATERIAL-ID';

-- Delete related records from prediction_accuracy_tracking
DELETE FROM prediction_accuracy_tracking 
WHERE material_id = 'SPECIFIC-MATERIAL-ID';

-- Now delete the specific material
DELETE FROM materials 
WHERE id = 'SPECIFIC-MATERIAL-ID';

-- Option 3: Quick delete all materials (nuclear option)
-- WARNING: This will delete ALL materials and related data

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Delete all predictive stocking data
DELETE FROM predictive_stocking;
DELETE FROM ai_learning_data;
DELETE FROM predictive_alerts;
DELETE FROM prediction_accuracy_tracking;

-- Delete all materials
DELETE FROM materials;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verification queries
SELECT 'Materials deletion completed' as status;

SELECT 
  'Materials' as table_name,
  COUNT(*) as record_count
FROM materials;

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