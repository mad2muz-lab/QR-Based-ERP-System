-- Check remaining required columns

-- 1. Check Equipment NOT NULL columns
SELECT 
  'EQUIPMENT NOT NULL COLUMNS' as table_info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND table_schema = 'public'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 2. Check if quantity column has default value in materials
SELECT 
  'MATERIALS QUANTITY COLUMN' as table_info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'materials' 
  AND table_schema = 'public'
  AND column_name = 'quantity'; 