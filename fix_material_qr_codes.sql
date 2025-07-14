-- Fix material QR codes with double MAT- prefix
-- This script identifies and corrects QR codes that have double MAT- prefixes

-- Step 1: Check for materials with double MAT- prefix in QR codes
SELECT id, name, qr_code, 
       CASE 
         WHEN qr_code LIKE 'MAT-MAT-%' THEN 'Double prefix detected'
         ELSE 'Normal'
       END as status
FROM materials 
WHERE qr_code LIKE 'MAT-MAT-%';

-- Step 2: Fix double MAT- prefix by removing the extra MAT-
UPDATE materials 
SET qr_code = SUBSTRING(qr_code FROM 5)  -- Remove first 'MAT-' (4 characters)
WHERE qr_code LIKE 'MAT-MAT-%';

-- Step 3: Verify the fix
SELECT id, name, qr_code, 
       CASE 
         WHEN qr_code LIKE 'MAT-MAT-%' THEN 'Still has double prefix'
         WHEN qr_code LIKE 'MAT-%' THEN 'Correct format'
         ELSE 'Unexpected format'
       END as status
FROM materials 
ORDER BY id;

-- Step 4: Ensure all materials have proper MAT- prefix
UPDATE materials 
SET qr_code = 'MAT-' || qr_code
WHERE qr_code NOT LIKE 'MAT-%' AND qr_code IS NOT NULL AND qr_code != '';

-- Step 5: Final verification - show all materials with their QR codes
SELECT id, name, qr_code, 
       CASE 
         WHEN qr_code LIKE 'MAT-%' AND qr_code NOT LIKE 'MAT-MAT-%' THEN 'Correct'
         WHEN qr_code LIKE 'MAT-MAT-%' THEN 'Double prefix'
         WHEN qr_code IS NULL OR qr_code = '' THEN 'Missing QR code'
         ELSE 'Invalid format'
       END as qr_status
FROM materials 
ORDER BY qr_status, id;