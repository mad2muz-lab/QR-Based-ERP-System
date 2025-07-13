-- Update RLS policies to allow anonymous access

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON employees;

DROP POLICY IF EXISTS "Authenticated users can read equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users can insert equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users can update equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users can delete equipment" ON equipment;

DROP POLICY IF EXISTS "Authenticated users can read materials" ON materials;
DROP POLICY IF EXISTS "Authenticated users can insert materials" ON materials;
DROP POLICY IF EXISTS "Authenticated users can update materials" ON materials;
DROP POLICY IF EXISTS "Authenticated users can delete materials" ON materials;

DROP POLICY IF EXISTS "Authenticated users can read sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can insert sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can update sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can delete sites" ON sites;

DROP POLICY IF EXISTS "Authenticated users can read time_logs" ON time_logs;
DROP POLICY IF EXISTS "Authenticated users can insert time_logs" ON time_logs;
DROP POLICY IF EXISTS "Authenticated users can update time_logs" ON time_logs;
DROP POLICY IF EXISTS "Authenticated users can delete time_logs" ON time_logs;

-- Create new policies that allow anonymous access
CREATE POLICY "Allow all operations on employees"
  ON employees FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on equipment"
  ON equipment FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on materials"
  ON materials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sites"
  ON sites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on time_logs"
  ON time_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);