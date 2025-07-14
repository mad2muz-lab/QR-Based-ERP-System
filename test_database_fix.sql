-- TEST SCRIPT TO VERIFY DATABASE SETUP FIX
-- This script tests the column existence and function creation order

-- Step 1: Check if users table exists
SELECT 'Testing users table existence...' as test_step;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN 'PASS: users table exists'
    ELSE 'FAIL: users table does not exist'
  END as result;

-- Step 2: Check if all required columns exist
SELECT 'Testing required columns existence...' as test_step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('id', 'username', 'role', 'name', 'email', 'is_active', 'created_at', 'updated_at') 
    THEN 'REQUIRED'
    ELSE 'OPTIONAL'
  END as importance
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY 
  CASE 
    WHEN column_name IN ('id', 'username', 'role', 'name', 'email', 'is_active', 'created_at', 'updated_at') 
    THEN 1 
    ELSE 2 
  END,
  column_name;

-- Step 3: Check if handle_new_user function exists
SELECT 'Testing handle_new_user function existence...' as test_step;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') 
    THEN 'PASS: handle_new_user function exists'
    ELSE 'FAIL: handle_new_user function does not exist'
  END as result;

-- Step 4: Check if trigger exists
SELECT 'Testing trigger existence...' as test_step;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN 'PASS: on_auth_user_created trigger exists'
    ELSE 'FAIL: on_auth_user_created trigger does not exist'
  END as result;

-- Step 5: Test column verification logic
SELECT 'Testing column verification logic...' as test_step;
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check for required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        missing_columns := array_append(missing_columns, 'updated_at');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        missing_columns := array_append(missing_columns, 'created_at');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        missing_columns := array_append(missing_columns, 'is_active');
    END IF;
    
    -- Report results
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'FAIL: Required columns missing: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'PASS: All required columns exist';
    END IF;
END $$;

-- Step 6: Show final summary
SELECT 'Database Fix Test Summary' as summary;
SELECT 
  'Total users in system: ' || COUNT(*) as user_count
FROM users;

SELECT 
  'Users by role:' as breakdown,
  role,
  COUNT(*) as count
FROM users 
GROUP BY role 
ORDER BY role;

SELECT '=== TEST COMPLETE ===' as status;