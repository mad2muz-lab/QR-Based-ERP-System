/*
  # Update RLS Policies for Testing

  1. Security Updates
    - Add policies to allow authenticated users to perform operations
    - Create test user profile automatically
    - Enable proper RLS policies for all tables

  2. Test User Setup
    - Allow creation of test user profiles
    - Enable basic operations for testing purposes
*/

-- Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.email, 'user_' || new.id::text),
    COALESCE(new.raw_user_meta_data->>'full_name', 'Test User'),
    'developer'::user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update departments policies to allow authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert departments" ON departments;
CREATE POLICY "Authenticated users can insert departments"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update employees policies
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON employees;
CREATE POLICY "Authenticated users can insert employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update equipment policies
DROP POLICY IF EXISTS "Authenticated users can insert equipment" ON equipment;
CREATE POLICY "Authenticated users can insert equipment"
  ON equipment
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update materials policies
DROP POLICY IF EXISTS "Authenticated users can insert materials" ON materials;
CREATE POLICY "Authenticated users can insert materials"
  ON materials
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update sites policies
DROP POLICY IF EXISTS "Authenticated users can insert sites" ON sites;
CREATE POLICY "Authenticated users can insert sites"
  ON sites
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update time_logs policies
DROP POLICY IF EXISTS "Authenticated users can insert time_logs" ON time_logs;
CREATE POLICY "Authenticated users can insert time_logs"
  ON time_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);