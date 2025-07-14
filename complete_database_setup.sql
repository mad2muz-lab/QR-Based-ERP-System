-- COMPLETE DATABASE SETUP AND MANAGEMENT SYSTEM
-- Execute this SQL in Supabase SQL Editor for complete system restoration
-- Go to: https://supabase.com/dashboard/project/lzbvyptjirohluliiitp/sql/new

-- ========================================
-- PART 1: USER AUTHENTICATION SYSTEM
-- ========================================

-- Create user role enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('developer', 'admin', 'manager', 'operator', 'viewer');
    END IF;
END $$;

-- Create users table with basic schema
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_site ON users(site);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Admin and developer can read all profiles" ON users;
DROP POLICY IF EXISTS "Admin and developer can insert profiles" ON users;
DROP POLICY IF EXISTS "Admin and developer can update profiles" ON users;
DROP POLICY IF EXISTS "Admin and developer can delete profiles" ON users;
DROP POLICY IF EXISTS "Managers can read their site users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can read their own profile"
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin and developer can read all profiles"
  ON users FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'developer') AND users.is_active = true
  ));

CREATE POLICY "Admin and developer can insert profiles"
  ON users FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'developer') AND users.is_active = true
  ));

CREATE POLICY "Admin and developer can update all profiles"
  ON users FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'developer') AND users.is_active = true
  ));

CREATE POLICY "Admin and developer can delete profiles"
  ON users FOR DELETE USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'developer') AND users.is_active = true
  ));

CREATE POLICY "Managers can read their site users"
  ON users FOR SELECT USING (EXISTS (
    SELECT 1 FROM users manager WHERE manager.id = auth.uid()
    AND manager.role = 'manager' AND manager.is_active = true
    AND manager.site = users.site
  ));

-- Note: Function creation moved to end of file after schema verification and user insertions

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
-- PART 2: SCHEMA FIXES FOR MAIN TABLES
-- ========================================

-- Add missing columns if they don't exist
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'basic';
ALTER TABLE materials ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE sites ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Add constraint for materials access_level
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'materials_access_level_check') THEN
        ALTER TABLE materials ADD CONSTRAINT materials_access_level_check 
          CHECK (access_level IN ('basic', 'restricted', 'admin'));
    END IF;
END $$;

-- Change ID columns from UUID to TEXT (if they are UUID)
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Check employees table
    SELECT data_type INTO rec FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'id';
    
    IF rec.data_type = 'uuid' THEN
        ALTER TABLE employees ALTER COLUMN id TYPE TEXT USING id::text;
        UPDATE employees SET id = 'EMP-' || REPLACE(id, '-', '') WHERE id NOT LIKE 'EMP-%';
    END IF;
    
    -- Check equipment table
    SELECT data_type INTO rec FROM information_schema.columns 
    WHERE table_name = 'equipment' AND column_name = 'id';
    
    IF rec.data_type = 'uuid' THEN
        ALTER TABLE equipment ALTER COLUMN id TYPE TEXT USING id::text;
        UPDATE equipment SET id = 'EQP-' || REPLACE(id, '-', '') WHERE id NOT LIKE 'EQP-%';
    END IF;
    
    -- Check materials table
    SELECT data_type INTO rec FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'id';
    
    IF rec.data_type = 'uuid' THEN
        ALTER TABLE materials ALTER COLUMN id TYPE TEXT USING id::text;
        UPDATE materials SET id = 'MAT-' || REPLACE(id, '-', '') WHERE id NOT LIKE 'MAT-%';
    END IF;
    
    -- Check sites table
    SELECT data_type INTO rec FROM information_schema.columns 
    WHERE table_name = 'sites' AND column_name = 'id';
    
    IF rec.data_type = 'uuid' THEN
        ALTER TABLE sites ALTER COLUMN id TYPE TEXT USING id::text;
        UPDATE sites SET id = 'SITE-' || REPLACE(id, '-', '') WHERE id NOT LIKE 'SITE-%';
    END IF;
END $$;

-- Update QR codes to match IDs
UPDATE employees SET qr_code = id WHERE qr_code IS NULL OR qr_code != id;
UPDATE equipment SET qr_code = id WHERE qr_code IS NULL OR qr_code != id;
UPDATE materials SET qr_code = id WHERE qr_code IS NULL OR qr_code != id;
UPDATE sites SET qr_code = id WHERE qr_code IS NULL OR qr_code != id;

-- Create indexes for main tables
CREATE INDEX IF NOT EXISTS idx_employees_qr_code ON employees(qr_code);
CREATE INDEX IF NOT EXISTS idx_equipment_qr_code ON equipment(qr_code);
CREATE INDEX IF NOT EXISTS idx_equipment_serial_number ON equipment(serial_number);
CREATE INDEX IF NOT EXISTS idx_materials_qr_code ON materials(qr_code);
CREATE INDEX IF NOT EXISTS idx_materials_access_level ON materials(access_level);
CREATE INDEX IF NOT EXISTS idx_sites_qr_code ON sites(qr_code);

-- ========================================
-- PART 3: CREATE DEFAULT USERS
-- ========================================

-- Create default admin user
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@system.local';
    
    IF admin_user_id IS NULL THEN
        admin_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, role, aud
        ) VALUES (
            admin_user_id, '00000000-0000-0000-0000-000000000000', 'admin@system.local',
            crypt('Admin123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
        );
        
        -- Insert admin user with all columns
        INSERT INTO public.users (
            id, username, role, name, email, is_active, created_at, updated_at
        )
        VALUES (
            admin_user_id, 'admin', 'admin', 'System Administrator', 'admin@system.local',
            true, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET 
            role = 'admin', is_active = true, updated_at = NOW();
    ELSE
        UPDATE public.users 
        SET role = 'admin', is_active = true, updated_at = NOW() 
        WHERE id = admin_user_id;
    END IF;
END $$;

-- Create sample users for each role
DO $$
DECLARE
    developer_id UUID := gen_random_uuid();
    manager_id UUID := gen_random_uuid();
    operator_id UUID := gen_random_uuid();
    viewer_id UUID := gen_random_uuid();
BEGIN
    -- Developer user
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'developer@system.local') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, role, aud
        ) VALUES (
            developer_id, '00000000-0000-0000-0000-000000000000', 'developer@system.local',
            crypt('Dev123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
        );
    END IF;
    
    -- Insert developer user with all columns
    INSERT INTO public.users (
        id, username, role, name, email, site, department, position, is_active, created_at, updated_at
    )
    VALUES (
        developer_id, 'developer', 'developer', 'System Developer', 'developer@system.local',
        'HQ', 'IT', 'Senior Developer', true, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET 
        role = 'developer', site = 'HQ', department = 'IT', position = 'Senior Developer', 
        is_active = true, updated_at = NOW();
    
    -- Manager user
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager@system.local') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, role, aud
        ) VALUES (
            manager_id, '00000000-0000-0000-0000-000000000000', 'manager@system.local',
            crypt('Mgr123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
        );
    END IF;
    
    -- Insert manager user with all columns
    INSERT INTO public.users (
        id, username, role, name, email, site, department, position, is_active, created_at, updated_at
    )
    VALUES (
        manager_id, 'manager', 'manager', 'Site Manager', 'manager@system.local',
        'Site-A', 'Operations', 'Site Manager', true, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET 
        role = 'manager', site = 'Site-A', department = 'Operations', position = 'Site Manager', 
        is_active = true, updated_at = NOW();
    
    -- Operator user
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'operator@system.local') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, role, aud
        ) VALUES (
            operator_id, '00000000-0000-0000-0000-000000000000', 'operator@system.local',
            crypt('Op123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
        );
    END IF;
    
    -- Insert operator user with all columns
    INSERT INTO public.users (
        id, username, role, name, email, site, department, position, is_active, created_at, updated_at
    )
    VALUES (
        operator_id, 'operator', 'operator', 'System Operator', 'operator@system.local',
        'Site-A', 'Operations', 'Equipment Operator', true, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET 
        role = 'operator', site = 'Site-A', department = 'Operations', position = 'Equipment Operator', 
        is_active = true, updated_at = NOW();
    
    -- Viewer user
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'viewer@system.local') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, role, aud
        ) VALUES (
            viewer_id, '00000000-0000-0000-0000-000000000000', 'viewer@system.local',
            crypt('View123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
        );
    END IF;
    
    -- Insert viewer user with all columns
    INSERT INTO public.users (
        id, username, role, name, email, site, department, position, is_active, created_at, updated_at
    )
    VALUES (
        viewer_id, 'viewer', 'viewer', 'System Viewer', 'viewer@system.local',
        'Site-B', 'Security', 'Security Guard', true, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET 
        role = 'viewer', site = 'Site-B', department = 'Security', position = 'Security Guard', 
        is_active = true, updated_at = NOW();
END $$;

-- ========================================
-- PART 4: VERIFICATION AND RESULTS
-- ========================================

SELECT '=== COMPLETE DATABASE SETUP FINISHED ===' as status;

-- Show user authentication system
SELECT 'USER AUTHENTICATION SYSTEM:' as section;
SELECT username, role, name, email, site, department, position, is_active, created_at
FROM users ORDER BY role, username;

-- Show main tables schema
SELECT 'MAIN TABLES SCHEMA:' as section;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('employees', 'equipment', 'materials', 'sites') 
AND column_name IN ('id', 'serial_number', 'access_level', 'qr_code')
ORDER BY table_name, column_name;

-- Show sample data
SELECT 'SAMPLE DATA:' as section;
SELECT 'employees' as table_name, id, qr_code FROM employees LIMIT 3;
SELECT 'equipment' as table_name, id, qr_code, serial_number FROM equipment LIMIT 3;
SELECT 'materials' as table_name, id, qr_code, access_level FROM materials LIMIT 3;
SELECT 'sites' as table_name, id, qr_code FROM sites LIMIT 3;

-- Show login credentials
SELECT 'LOGIN CREDENTIALS:' as section;
SELECT 
  email,
  CASE 
    WHEN role = 'admin' THEN 'Admin123!@#'
    WHEN role = 'developer' THEN 'Dev123!@#'
    WHEN role = 'manager' THEN 'Mgr123!@#'
    WHEN role = 'operator' THEN 'Op123!@#'
    WHEN role = 'viewer' THEN 'View123!@#'
  END as password,
  role,
  'Use these credentials to login to your system' as note
FROM users 
WHERE email LIKE '%@system.local'
ORDER BY role;

-- ========================================
-- FINAL STEP: CREATE FUNCTIONS AND TRIGGERS AFTER ALL USER INSERTIONS
-- ========================================

-- Create user management functions (after schema verification)
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

CREATE OR REPLACE FUNCTION public.update_user_last_login(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET last_login = NOW(), login_count = login_count + 1, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '=== SETUP COMPLETE - YOUR SYSTEM IS READY ===' as final_status;