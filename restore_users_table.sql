-- COMPLETE USER AUTHENTICATION SYSTEM RESTORATION
-- Execute this SQL in Supabase SQL Editor to restore full user management
-- Go to: https://supabase.com/dashboard/project/lzbvyptjirohluliiitp/sql/new

-- ========================================
-- STEP 1: CREATE USER ROLE ENUM
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('developer', 'admin', 'manager', 'operator', 'viewer');
    END IF;
END $$;

-- ========================================
-- STEP 2: CREATE USERS TABLE WITH BASIC SCHEMA
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

-- Add all missing columns if they don't exist
-- Add all missing columns using direct ALTER TABLE commands
ALTER TABLE users ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Verify all required columns exist before proceeding
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
    
    -- Raise error if any required columns are missing
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Required columns missing from users table: %', array_to_string(missing_columns, ', ');
    END IF;
    
    RAISE NOTICE 'All required columns verified in users table';
END $$;

-- ========================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_site ON users(site);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- ========================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 5: DROP ALL EXISTING POLICIES
-- ========================================
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Admin and developer can read all profiles" ON users;
DROP POLICY IF EXISTS "Admin and developer can insert profiles" ON users;
DROP POLICY IF EXISTS "Admin and developer can update profiles" ON users;
DROP POLICY IF EXISTS "Admin and developer can delete profiles" ON users;
DROP POLICY IF EXISTS "Allow anonymous access to users" ON users;
DROP POLICY IF EXISTS "Managers can read their site users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- ========================================
-- STEP 6: CREATE COMPREHENSIVE RLS POLICIES
-- ========================================

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Admin and developer can read all profiles
CREATE POLICY "Admin and developer can read all profiles"
  ON users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'developer')
    AND users.is_active = true
  ));

-- Policy 4: Admin and developer can insert new profiles
CREATE POLICY "Admin and developer can insert profiles"
  ON users
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'developer')
    AND users.is_active = true
  ));

-- Policy 5: Admin and developer can update all profiles
CREATE POLICY "Admin and developer can update all profiles"
  ON users
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'developer')
    AND users.is_active = true
  ));

-- Policy 6: Admin and developer can delete profiles
CREATE POLICY "Admin and developer can delete profiles"
  ON users
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'developer')
    AND users.is_active = true
  ));

-- Policy 7: Managers can read users from their site
CREATE POLICY "Managers can read their site users"
  ON users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users manager
    WHERE manager.id = auth.uid()
    AND manager.role = 'manager'
    AND manager.is_active = true
    AND manager.site = users.site
  ));

-- Policy 8: Operators can read users from their site (limited)
CREATE POLICY "Operators can read their site users"
  ON users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users op
    WHERE op.id = auth.uid()
    AND op.role = 'operator'
    AND op.is_active = true
    AND op.site = users.site
  ));

-- ========================================
-- STEP 7: CREATE USER MANAGEMENT FUNCTIONS
-- ========================================

-- Note: Function creation moved to end of file after schema verification and user insertions

-- Function to get user by email
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE(
  id UUID,
  username TEXT,
  role user_role,
  name TEXT,
  email TEXT,
  site TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.role, u.name, u.email, u.site, u.is_active
  FROM users u
  WHERE u.email = user_email AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_text TEXT;
BEGIN
  SELECT role::TEXT INTO user_role_text
  FROM users
  WHERE id = user_id AND is_active = true;
  
  RETURN CASE
    WHEN user_role_text = 'developer' THEN true
    WHEN user_role_text = 'admin' THEN true
    WHEN user_role_text = 'manager' AND required_role IN ('manager', 'operator', 'viewer') THEN true
    WHEN user_role_text = 'operator' AND required_role IN ('operator', 'viewer') THEN true
    WHEN user_role_text = 'viewer' AND required_role = 'viewer' THEN true
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 8: CREATE TRIGGERS
-- ========================================

-- Note: Trigger creation moved to end of file after all user insertions

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- STEP 9: INSERT DEFAULT ADMIN USER
-- ========================================

-- Create default admin user in auth.users if not exists
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@system.local';
  
  IF admin_user_id IS NULL THEN
    -- Generate new UUID for admin
    admin_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@system.local',
      crypt('Admin123!@#', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
    
    -- Insert into public.users
    INSERT INTO public.users (
      id,
      username,
      role,
      name,
      email,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      'admin',
      'admin',
      'System Administrator',
      'admin@system.local',
      true,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      is_active = true,
      updated_at = NOW();
      
    RAISE NOTICE 'Default admin user created: admin@system.local / Admin123!@#';
  ELSE
    -- Update existing admin to ensure proper role
    UPDATE public.users 
    SET 
      role = 'admin',
      is_active = true,
      updated_at = NOW()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Existing admin user updated: admin@system.local';
  END IF;
END $$;

-- ========================================
-- STEP 10: CREATE SAMPLE USERS FOR TESTING
-- ========================================

-- Create sample users for each role
DO $$
DECLARE
  developer_id UUID := gen_random_uuid();
  manager_id UUID := gen_random_uuid();
  operator_id UUID := gen_random_uuid();
  viewer_id UUID := gen_random_uuid();
BEGIN
  -- Developer user
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role, aud
  ) VALUES (
    developer_id, '00000000-0000-0000-0000-000000000000', 'developer@system.local',
    crypt('Dev123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
  ) ON CONFLICT (email) DO NOTHING;
  
  INSERT INTO public.users (
    id, username, role, name, email, site, department, position, is_active
  ) VALUES (
    developer_id, 'developer', 'developer', 'System Developer', 'developer@system.local',
    'HQ', 'IT', 'Senior Developer', true
  ) ON CONFLICT (id) DO UPDATE SET role = 'developer', is_active = true;
  
  -- Manager user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager@system.local') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role, aud
    ) VALUES (
      manager_id, '00000000-0000-0000-0000-000000000000', 'manager@system.local',
      crypt('Mgr123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
    );
  END IF;
  
  INSERT INTO public.users (
    id, username, role, name, email, site, department, position, is_active
  ) VALUES (
    manager_id, 'manager', 'manager', 'Site Manager', 'manager@system.local',
    'Site-A', 'Operations', 'Site Manager', true
  ) ON CONFLICT (id) DO UPDATE SET role = 'manager', is_active = true;
  
  -- Operator user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'operator@system.local') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role, aud
    ) VALUES (
      operator_id, '00000000-0000-0000-0000-000000000000', 'operator@system.local',
      crypt('Op123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
    );
  END IF;
  
  INSERT INTO public.users (
    id, username, role, name, email, site, department, position, is_active
  ) VALUES (
    operator_id, 'operator', 'operator', 'System Operator', 'operator@system.local',
    'Site-A', 'Operations', 'Equipment Operator', true
  ) ON CONFLICT (id) DO UPDATE SET role = 'operator', is_active = true;
  
  -- Viewer user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'viewer@system.local') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role, aud
    ) VALUES (
      viewer_id, '00000000-0000-0000-0000-000000000000', 'viewer@system.local',
      crypt('View123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
    );
  END IF;
  
  INSERT INTO public.users (
    id, username, role, name, email, site, department, position, is_active
  ) VALUES (
    viewer_id, 'viewer', 'viewer', 'System Viewer', 'viewer@system.local',
    'Site-B', 'Security', 'Security Guard', true
  ) ON CONFLICT (id) DO UPDATE SET role = 'viewer', is_active = true;
  
END $$;

-- ========================================
-- STEP 11: VERIFICATION AND RESULTS
-- ========================================

SELECT '=== USER AUTHENTICATION SYSTEM RESTORED ===' as status;

-- Show table structure
SELECT 'TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show user roles enum
SELECT 'USER ROLES:' as info;
SELECT enumlabel as role FROM pg_enum WHERE enumtypid = 'user_role'::regtype ORDER BY enumsortorder;

-- Show all users
SELECT 'ALL USERS:' as info;
SELECT 
  username,
  role,
  name,
  email,
  site,
  department,
  position,
  is_active,
  created_at
FROM users 
ORDER BY role, username;

-- Show RLS policies
SELECT 'RLS POLICIES:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Show functions
SELECT 'USER FUNCTIONS:' as info;
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- ========================================
-- FINAL STEP: CREATE FUNCTIONS AND TRIGGERS AFTER ALL USER INSERTIONS
-- ========================================

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    username,
    name,
    role,
    email,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'viewer'),
    new.email,
    true,
    NOW(),
    NOW()
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user last login
CREATE OR REPLACE FUNCTION public.update_user_last_login(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET 
    last_login = NOW(),
    login_count = login_count + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '=== SETUP COMPLETE ===' as status;
SELECT 'Default Login Credentials:' as info;
SELECT 
  email,
  'Password: ' || CASE 
    WHEN role = 'admin' THEN 'Admin123!@#'
    WHEN role = 'developer' THEN 'Dev123!@#'
    WHEN role = 'manager' THEN 'Mgr123!@#'
    WHEN role = 'operator' THEN 'Op123!@#'
    WHEN role = 'viewer' THEN 'View123!@#'
  END as credentials,
  role
FROM users 
WHERE email LIKE '%@system.local'
ORDER BY role;