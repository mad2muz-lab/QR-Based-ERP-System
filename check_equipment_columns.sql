-- Check Equipment NOT NULL columns only

SELECT 
  'EQUIPMENT NOT NULL COLUMNS' as table_info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND table_schema = 'public'
  AND is_nullable = 'NO'
ORDER BY ordinal_position; 