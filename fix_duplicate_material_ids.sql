-- Fix duplicate material IDs and primary key constraint violations
-- This script identifies and resolves duplicate id values in materials table

-- Step 1: Check for existing duplicate IDs
SELECT id, COUNT(*) as duplicate_count 
FROM materials 
GROUP BY id 
HAVING COUNT(*) > 1;

-- Step 2: Check for existing duplicate QR codes
SELECT qr_code, COUNT(*) as duplicate_count 
FROM materials 
GROUP BY qr_code 
HAVING COUNT(*) > 1;

-- Step 3: Update duplicate material IDs with unique values
-- This will add a suffix to make them unique
WITH duplicates AS (
  SELECT id, name, qr_code, 
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) as rn
  FROM materials
  WHERE id IN (
    SELECT id 
    FROM materials 
    GROUP BY id 
    HAVING COUNT(*) > 1
  )
)
UPDATE materials 
SET id = CASE 
  WHEN d.rn = 1 THEN d.id  -- Keep the first one unchanged
  ELSE d.id || '-DUP' || d.rn  -- Add suffix to duplicates
END,
qr_code = CASE 
  WHEN d.rn = 1 THEN d.qr_code  -- Keep the first one unchanged
  ELSE d.qr_code || '-DUP' || d.rn  -- Add suffix to duplicates
END
FROM duplicates d
WHERE materials.id = d.id AND materials.name = d.name AND d.rn > 1;

-- Step 4: Update duplicate QR codes (if any remain)
WITH qr_duplicates AS (
  SELECT id, qr_code, 
         ROW_NUMBER() OVER (PARTITION BY qr_code ORDER BY created_at) as rn
  FROM materials
  WHERE qr_code IN (
    SELECT qr_code 
    FROM materials 
    GROUP BY qr_code 
    HAVING COUNT(*) > 1
  )
)
UPDATE materials 
SET qr_code = CASE 
  WHEN d.rn = 1 THEN d.qr_code  -- Keep the first one unchanged
  ELSE d.qr_code || '-QR' || d.rn  -- Add suffix to duplicates
END
FROM qr_duplicates d
WHERE materials.id = d.id AND d.rn > 1;

-- Step 5: Verify no duplicates remain
SELECT 'ID Duplicates:' as check_type, id, COUNT(*) as duplicate_count 
FROM materials 
GROUP BY id 
HAVING COUNT(*) > 1
UNION ALL
SELECT 'QR Code Duplicates:' as check_type, qr_code, COUNT(*) as duplicate_count 
FROM materials 
GROUP BY qr_code 
HAVING COUNT(*) > 1;

-- Step 6: Optional - Update QR codes to match IDs for consistency
-- Uncomment the following if you want QR codes to exactly match material IDs
-- UPDATE materials SET qr_code = id WHERE qr_code != id;

-- Step 7: Show updated material records
SELECT id, name, qr_code, created_at 
FROM materials 
ORDER BY created_at DESC 
LIMIT 10;