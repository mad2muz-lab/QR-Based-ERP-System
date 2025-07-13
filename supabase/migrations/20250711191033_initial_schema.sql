-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('developer', 'admin', 'manager', 'operator', 'viewer');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  name TEXT NOT NULL,
  email TEXT,
  site TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow admin and developer users to read all profiles
CREATE POLICY "Admin and developer can read all profiles"
  ON users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'developer')
  ));

-- Allow admin and developer users to insert new profiles
CREATE POLICY "Admin and developer can insert profiles"
  ON users
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'developer')
  ));

-- Allow admin and developer users to update profiles
CREATE POLICY "Admin and developer can update profiles"
  ON users
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'developer')
  ));

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, name, role, email)
  VALUES (
    new.id,
    COALESCE(new.email, 'user_' || new.id::text),
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    'viewer',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create other tables (employees, equipment, materials, sites, etc.)
-- ...