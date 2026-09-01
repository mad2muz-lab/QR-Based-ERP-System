-- Create missing maintenance tables for PM System
-- This script creates the tables that are causing 404 errors

-- 1. Create equipment_maintenance_logs table
CREATE TABLE IF NOT EXISTS public.equipment_maintenance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('repair', 'service')),
    repair_type TEXT CHECK (repair_type IN ('on_site', 'yard_repair')),
    description TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    estimated_duration_hours DECIMAL(10,2),
    actual_duration_hours DECIMAL(10,2),
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    technician_id TEXT,
    technician_notes TEXT,
    parts_used TEXT,
    completion_date TIMESTAMP WITH TIME ZONE,
    maintenance_class TEXT DEFAULT 'Class A' CHECK (maintenance_class IN ('Class A', 'Class B', 'Class C')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    triggered_by TEXT,
    CONSTRAINT fk_equipment_maintenance_logs_equipment 
        FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE
);

-- 2. Create equipment_maintenance_schedules table
CREATE TABLE IF NOT EXISTS public.equipment_maintenance_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    schedule_type TEXT NOT NULL DEFAULT 'preventive' CHECK (schedule_type IN ('preventive', 'corrective', 'emergency')),
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('repair', 'service')),
    maintenance_class TEXT DEFAULT 'Class A' CHECK (maintenance_class IN ('Class A', 'Class B', 'Class C')),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    next_maintenance_date TIMESTAMP WITH TIME ZONE,
    frequency_hours INTEGER DEFAULT 500,
    frequency_days INTEGER DEFAULT 30,
    frequency_km INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    description TEXT,
    estimated_duration_hours DECIMAL(10,2),
    estimated_cost DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_equipment_maintenance_schedules_equipment 
        FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE
);

-- 3. Create preventive_maintenance_logs table (for PM system)
CREATE TABLE IF NOT EXISTS public.preventive_maintenance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    maintenance_class TEXT NOT NULL CHECK (maintenance_class IN ('A', 'B', 'C')),
    maintenance_type TEXT NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    performed_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'assigned', 'in_progress', 'completed', 'cancelled')),
    technician_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_preventive_maintenance_logs_equipment 
        FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE
);

-- 4. Create preventive_maintenance_configs table
CREATE TABLE IF NOT EXISTS public.preventive_maintenance_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_type TEXT NOT NULL,
    maintenance_class TEXT NOT NULL CHECK (maintenance_class IN ('A', 'B', 'C')),
    maintenance_type TEXT NOT NULL,
    interval_hours INTEGER DEFAULT 500,
    interval_km INTEGER DEFAULT 1000,
    interval_days INTEGER DEFAULT 30,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_equipment_id ON public.equipment_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_status ON public.equipment_maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_scheduled_date ON public.equipment_maintenance_logs(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_equipment_id ON public.equipment_maintenance_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_status ON public.equipment_maintenance_schedules(status);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_scheduled_date ON public.equipment_maintenance_schedules(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_logs_equipment_id ON public.preventive_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_logs_status ON public.preventive_maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_logs_scheduled_date ON public.preventive_maintenance_logs(scheduled_date);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preventive_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preventive_maintenance_configs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- Equipment maintenance logs policies
CREATE POLICY "Users can view equipment maintenance logs" ON public.equipment_maintenance_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment maintenance logs" ON public.equipment_maintenance_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment maintenance logs" ON public.equipment_maintenance_logs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment maintenance logs" ON public.equipment_maintenance_logs
    FOR DELETE USING (true);

-- Equipment maintenance schedules policies
CREATE POLICY "Users can view equipment maintenance schedules" ON public.equipment_maintenance_schedules
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment maintenance schedules" ON public.equipment_maintenance_schedules
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment maintenance schedules" ON public.equipment_maintenance_schedules
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment maintenance schedules" ON public.equipment_maintenance_schedules
    FOR DELETE USING (true);

-- Preventive maintenance logs policies
CREATE POLICY "Users can view preventive maintenance logs" ON public.preventive_maintenance_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert preventive maintenance logs" ON public.preventive_maintenance_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update preventive maintenance logs" ON public.preventive_maintenance_logs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete preventive maintenance logs" ON public.preventive_maintenance_logs
    FOR DELETE USING (true);

-- Preventive maintenance configs policies
CREATE POLICY "Users can view preventive maintenance configs" ON public.preventive_maintenance_configs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert preventive maintenance configs" ON public.preventive_maintenance_configs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update preventive maintenance configs" ON public.preventive_maintenance_configs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete preventive maintenance configs" ON public.preventive_maintenance_configs
    FOR DELETE USING (true);

-- 8. Insert sample data for testing
INSERT INTO public.preventive_maintenance_configs (equipment_type, maintenance_class, maintenance_type, interval_hours, interval_km, interval_days, description) VALUES
('Excavator', 'A', 'service', 250, 500, 15, 'Regular service for excavators'),
('Excavator', 'B', 'service', 500, 1000, 30, 'Major service for excavators'),
('Excavator', 'C', 'repair', 1000, 2000, 60, 'Overhaul for excavators'),
('Bulldozer', 'A', 'service', 200, 400, 12, 'Regular service for bulldozers'),
('Bulldozer', 'B', 'service', 400, 800, 25, 'Major service for bulldozers'),
('Bulldozer', 'C', 'repair', 800, 1600, 50, 'Overhaul for bulldozers'),
('Crane', 'A', 'service', 300, 600, 20, 'Regular service for cranes'),
('Crane', 'B', 'service', 600, 1200, 40, 'Major service for cranes'),
('Crane', 'C', 'repair', 1200, 2400, 80, 'Overhaul for cranes')
ON CONFLICT DO NOTHING;

-- 9. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_equipment_maintenance_logs_updated_at 
    BEFORE UPDATE ON public.equipment_maintenance_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_maintenance_schedules_updated_at 
    BEFORE UPDATE ON public.equipment_maintenance_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preventive_maintenance_logs_updated_at 
    BEFORE UPDATE ON public.preventive_maintenance_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preventive_maintenance_configs_updated_at 
    BEFORE UPDATE ON public.preventive_maintenance_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Verify tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'equipment_maintenance_logs',
    'equipment_maintenance_schedules', 
    'preventive_maintenance_logs',
    'preventive_maintenance_configs'
)
ORDER BY table_name; 