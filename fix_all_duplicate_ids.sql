-- Comprehensive fix for all duplicate IDs and constraint violations
-- This script identifies and resolves duplicate id and qr_code values across all tables

-- ========================================
-- EMPLOYEES TABLE
-- ========================================

-- Check for existing duplicate employee IDs
SELECT 'EMPLOYEES - ID Duplicates:' as table_check, id, COUNT(*) as duplicate_count 
FROM employees 
GROUP BY id 
HAVING COUNT(*) > 1;

-- Check for existing duplicate employee QR codes
SELECT 'EMPLOYEES - QR Duplicates:' as table_check, qr_code, COUNT(*) as duplicate_count 
FROM employees 
GROUP BY qr_code 
HAVING COUNT(*) > 1;

-- ========================================
-- EQUIPMENT TABLE
-- ========================================

-- Check for existing duplicate equipment IDs
SELECT 'EQUIPMENT - ID Duplicates:' as table_check, id, COUNT(*) as duplicate_count 
FROM equipment 
GROUP BY id 
HAVING COUNT(*) > 1;

-- Check for existing duplicate equipment QR codes
SELECT 'EQUIPMENT - QR Duplicates:' as table_check, qr_code, COUNT(*) as duplicate_count 
FROM equipment 
GROUP BY qr_code 
HAVING COUNT(*) > 1;

-- ========================================
-- MATERIALS TABLE
-- ========================================

-- Check for existing duplicate material IDs
SELECT 'MATERIALS - ID Duplicates:' as table_check, id, COUNT(*) as duplicate_count 
FROM materials 
GROUP BY id 
HAVING COUNT(*) > 1;

-- Check for existing duplicate material QR codes
SELECT 'MATERIALS - QR Duplicates:' as table_check, qr_code, COUNT(*) as duplicate_count 
FROM materials 
GROUP BY qr_code 
HAVING COUNT(*) > 1;

-- ========================================
-- SITES TABLE
-- ========================================

-- Check for existing duplicate site IDs
SELECT 'SITES - ID Duplicates:' as table_check, id, COUNT(*) as duplicate_count 
FROM sites 
GROUP BY id 
HAVING COUNT(*) > 1;

-- ========================================
-- FIX DUPLICATE IDs
-- ========================================

-- Fix duplicate employee IDs
WITH emp_duplicates AS (
  SELECT id, name, qr_code, 
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) as rn
  FROM employees
  WHERE id IN (
    SELECT id FROM employees GROUP BY id HAVING COUNT(*) > 1
  )
)
UPDATE employees 
SET id = CASE 
  WHEN d.rn = 1 THEN d.id
  ELSE d.id || '-DUP' || d.rn
END,
qr_code = CASE 
  WHEN d.rn = 1 THEN d.qr_code
  ELSE d.qr_code || '-DUP' || d.rn
END
FROM emp_duplicates d
WHERE employees.id = d.id AND employees.name = d.name AND d.rn > 1;

-- Fix duplicate equipment IDs
WITH eq_duplicates AS (
  SELECT id, name, qr_code, 
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) as rn
  FROM equipment
  WHERE id IN (
    SELECT id FROM equipment GROUP BY id HAVING COUNT(*) > 1
  )
)
UPDATE equipment 
SET id = CASE 
  WHEN d.rn = 1 THEN d.id
  ELSE d.id || '-DUP' || d.rn
END,
qr_code = CASE 
  WHEN d.rn = 1 THEN d.qr_code
  ELSE d.qr_code || '-DUP' || d.rn
END
FROM eq_duplicates d
WHERE equipment.id = d.id AND equipment.name = d.name AND d.rn > 1;

-- Fix duplicate material IDs
WITH mat_duplicates AS (
  SELECT id, name, qr_code, 
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) as rn
  FROM materials
  WHERE id IN (
    SELECT id FROM materials GROUP BY id HAVING COUNT(*) > 1
  )
)
UPDATE materials 
SET id = CASE 
  WHEN d.rn = 1 THEN d.id
  ELSE d.id || '-DUP' || d.rn
END,
qr_code = CASE 
  WHEN d.rn = 1 THEN d.qr_code
  ELSE d.qr_code || '-DUP' || d.rn
END
FROM mat_duplicates d
WHERE materials.id = d.id AND materials.name = d.name AND d.rn > 1;

-- Fix duplicate site IDs
WITH site_duplicates AS (
  SELECT id, name, 
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY last_updated) as rn
  FROM sites
  WHERE id IN (
    SELECT id FROM sites GROUP BY id HAVING COUNT(*) > 1
  )
)
UPDATE sites 
SET id = CASE 
  WHEN d.rn = 1 THEN d.id
  ELSE d.id || '-DUP' || d.rn
END
FROM site_duplicates d
WHERE sites.id = d.id AND sites.name = d.name AND d.rn > 1;

-- ========================================
-- VERIFICATION - Check no duplicates remain
-- ========================================

SELECT 'FINAL CHECK - All Tables:' as verification;

SELECT 'EMPLOYEES' as table_name, 'ID' as column_type, id as value, COUNT(*) as count 
FROM employees GROUP BY id HAVING COUNT(*) > 1
UNION ALL
SELECT 'EMPLOYEES' as table_name, 'QR_CODE' as column_type, qr_code as value, COUNT(*) as count 
FROM employees GROUP BY qr_code HAVING COUNT(*) > 1
UNION ALL
SELECT 'EQUIPMENT' as table_name, 'ID' as column_type, id as value, COUNT(*) as count 
FROM equipment GROUP BY id HAVING COUNT(*) > 1
UNION ALL
SELECT 'EQUIPMENT' as table_name, 'QR_CODE' as column_type, qr_code as value, COUNT(*) as count 
FROM equipment GROUP BY qr_code HAVING COUNT(*) > 1
UNION ALL
SELECT 'MATERIALS' as table_name, 'ID' as column_type, id as value, COUNT(*) as count 
FROM materials GROUP BY id HAVING COUNT(*) > 1
UNION ALL
SELECT 'MATERIALS' as table_name, 'QR_CODE' as column_type, qr_code as value, COUNT(*) as count 
FROM materials GROUP BY qr_code HAVING COUNT(*) > 1
UNION ALL
SELECT 'SITES' as table_name, 'ID' as column_type, id as value, COUNT(*) as count 
FROM sites GROUP BY id HAVING COUNT(*) > 1;

-- Show recent records from each table
SELECT 'Recent Employees:' as summary;
SELECT id, name, qr_code, created_at FROM employees ORDER BY created_at DESC LIMIT 5;

SELECT 'Recent Equipment:' as summary;
SELECT id, name, qr_code, created_at FROM equipment ORDER BY created_at DESC LIMIT 5;

SELECT 'Recent Materials:' as summary;
SELECT id, name, qr_code, created_at FROM materials ORDER BY created_at DESC LIMIT 5;

SELECT 'Recent Sites:' as summary;
SELECT id, name, last_updated FROM sites ORDER BY last_updated DESC LIMIT 5;