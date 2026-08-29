-- Rename the 'name' column to 'maintenance_type' in preventive_maintenance_types table
ALTER TABLE preventive_maintenance_types 
RENAME COLUMN name TO maintenance_type; 