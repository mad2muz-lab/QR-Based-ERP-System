-- Fix duplicate QR codes in equipment table
-- This script identifies and resolves duplicate qr_code values

-- Step 1: Check for existing duplicates
SELECT qr_code, COUNT(*) as duplicate_count 
FROM equipment 
GROUP BY qr_code 
HAVING COUNT(*) > 1;

-- Step 2: Update duplicate QR codes with unique values
-- This will add a suffix to make them unique
WITH duplicates AS (
  SELECT id, qr_code, 
         ROW_NUMBER() OVER (PARTITION BY qr_code ORDER BY created_at) as rn
  FROM equipment
  WHERE qr_code IN (
    SELECT qr_code 
    FROM equipment 
    GROUP BY qr_code 
    HAVING COUNT(*) > 1
  )
)
UPDATE equipment 
SET qr_code = CASE 
  WHEN d.rn = 1 THEN d.qr_code  -- Keep the first one unchanged
  ELSE d.qr_code || '-DUP' || d.rn  -- Add suffix to duplicates
END
FROM duplicates d
WHERE equipment.id = d.id AND d.rn > 1;

-- Step 3: Verify no duplicates remain
SELECT qr_code, COUNT(*) as duplicate_count 
FROM equipment 
GROUP BY qr_code 
HAVING COUNT(*) > 1;

-- Step 4: Optional - Update QR codes to match IDs for consistency
-- Uncomment the following if you want QR codes to exactly match equipment IDs
-- UPDATE equipment SET qr_code = id WHERE qr_code != id;

-- Step 5: Show updated equipment records
SELECT id, name, qr_code, created_at 
FROM equipment 
ORDER BY created_at DESC 
LIMIT 10;