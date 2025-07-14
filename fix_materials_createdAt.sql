-- Fix for materials table missing 'createdAt' column
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lzbvyptjirohluliiitp/sql/new

-- Add the missing createdAt column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have createdAt value based on created_at
UPDATE materials SET "createdAt" = created_at WHERE "createdAt" IS NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'materials' 
AND column_name IN ('created_at', 'createdAt')
ORDER BY column_name;

SELECT 'Materials table createdAt column fix completed successfully!' as status;