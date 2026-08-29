-- Create all missing PM-related tables
-- This script creates all the tables that are causing 404 errors

-- 1. Create pm_compliance_summary table
CREATE TABLE IF NOT EXISTS public.pm_compliance_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    equipment_name TEXT,
    equipment_type TEXT,
    total_scheduled_pm INTEGER DEFAULT 0,
    completed_pm INTEGER DEFAULT 0,
    overdue_pm INTEGER DEFAULT 0,
    compliance_rate DECIMAL(5,2) DEFAULT 0.00,
    last_pm_date TIMESTAMP WITH TIME ZONE,
    next_pm_date TIMESTAMP WITH TIME ZONE,
    maintenance_class TEXT DEFAULT 'A',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_pm_compliance_summary_equipment 
        FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE
);

-- 2. Create pm_equipment_history table
CREATE TABLE IF NOT EXISTS public.pm_equipment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    maintenance_class TEXT NOT NULL CHECK (maintenance_class IN ('A', 'B', 'C')),
    maintenance_type TEXT NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    performed_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'assigned', 'in_progress', 'completed', 'cancelled', 'overdue')),
    technician_id TEXT,
    technician_name TEXT,
    notes TEXT,
    actual_duration_hours DECIMAL(10,2),
    estimated_duration_hours DECIMAL(10,2),
    actual_cost DECIMAL(12,2),
    estimated_cost DECIMAL(12,2),
    parts_used TEXT,
    next_maintenance_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_pm_equipment_history_equipment 
        FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE
);

-- 3. Create pm_task_assignments table
CREATE TABLE IF NOT EXISTS public.pm_task_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pm_log_id UUID NOT NULL,
    technician_id TEXT NOT NULL,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_pm_task_assignments_pm_log 
        FOREIGN KEY (pm_log_id) REFERENCES public.preventive_maintenance_logs(id) ON DELETE CASCADE
);

-- 4. Create pm_checklist_items table
CREATE TABLE IF NOT EXISTS public.pm_checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pm_log_id UUID NOT NULL,
    item_name TEXT NOT NULL,
    item_description TEXT,
    item_type TEXT DEFAULT 'check' CHECK (item_type IN ('check', 'measurement', 'inspection')),
    required BOOLEAN DEFAULT true,
    completed BOOLEAN DEFAULT false,
    completed_by TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    measurement_value TEXT,
    measurement_unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_pm_checklist_items_pm_log 
        FOREIGN KEY (pm_log_id) REFERENCES public.preventive_maintenance_logs(id) ON DELETE CASCADE
);

-- 5. Create pm_forecasts table
CREATE TABLE IF NOT EXISTS public.pm_forecasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    forecast_period TEXT NOT NULL CHECK (forecast_period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    forecast_date DATE NOT NULL,
    total_pm_scheduled INTEGER DEFAULT 0,
    estimated_cost DECIMAL(12,2) DEFAULT 0.00,
    estimated_duration_hours DECIMAL(10,2) DEFAULT 0.00,
    maintenance_class_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_pm_forecasts_equipment 
        FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE
);

-- 6. Create pm_notifications table
CREATE TABLE IF NOT EXISTS public.pm_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    pm_log_id UUID,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('scheduled', 'overdue', 'completed', 'assigned')),
    message TEXT NOT NULL,
    recipient_id TEXT,
    recipient_email TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_pm_notifications_equipment 
        FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_notifications_pm_log 
        FOREIGN KEY (pm_log_id) REFERENCES public.preventive_maintenance_logs(id) ON DELETE SET NULL
);

-- 7. Create pm_analytics table
CREATE TABLE IF NOT EXISTS public.pm_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analytics_date DATE NOT NULL,
    total_equipment INTEGER DEFAULT 0,
    total_pm_scheduled INTEGER DEFAULT 0,
    total_pm_completed INTEGER DEFAULT 0,
    total_pm_overdue INTEGER DEFAULT 0,
    overall_compliance_rate DECIMAL(5,2) DEFAULT 0.00,
    total_cost DECIMAL(12,2) DEFAULT 0.00,
    total_duration_hours DECIMAL(10,2) DEFAULT 0.00,
    class_a_compliance DECIMAL(5,2) DEFAULT 0.00,
    class_b_compliance DECIMAL(5,2) DEFAULT 0.00,
    class_c_compliance DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pm_compliance_summary_equipment_id ON public.pm_compliance_summary(equipment_id);
CREATE INDEX IF NOT EXISTS idx_pm_compliance_summary_compliance_rate ON public.pm_compliance_summary(compliance_rate);

CREATE INDEX IF NOT EXISTS idx_pm_equipment_history_equipment_id ON public.pm_equipment_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_pm_equipment_history_status ON public.pm_equipment_history(status);
CREATE INDEX IF NOT EXISTS idx_pm_equipment_history_scheduled_date ON public.pm_equipment_history(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_pm_task_assignments_pm_log_id ON public.pm_task_assignments(pm_log_id);
CREATE INDEX IF NOT EXISTS idx_pm_task_assignments_technician_id ON public.pm_task_assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_pm_task_assignments_status ON public.pm_task_assignments(status);

CREATE INDEX IF NOT EXISTS idx_pm_checklist_items_pm_log_id ON public.pm_checklist_items(pm_log_id);
CREATE INDEX IF NOT EXISTS idx_pm_checklist_items_completed ON public.pm_checklist_items(completed);

CREATE INDEX IF NOT EXISTS idx_pm_forecasts_equipment_id ON public.pm_forecasts(equipment_id);
CREATE INDEX IF NOT EXISTS idx_pm_forecasts_forecast_date ON public.pm_forecasts(forecast_date);

CREATE INDEX IF NOT EXISTS idx_pm_notifications_equipment_id ON public.pm_notifications(equipment_id);
CREATE INDEX IF NOT EXISTS idx_pm_notifications_status ON public.pm_notifications(status);
CREATE INDEX IF NOT EXISTS idx_pm_notifications_sent_at ON public.pm_notifications(sent_at);

CREATE INDEX IF NOT EXISTS idx_pm_analytics_analytics_date ON public.pm_analytics(analytics_date);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.pm_compliance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_equipment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_analytics ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for all tables
-- PM Compliance Summary policies
CREATE POLICY "Users can view pm compliance summary" ON public.pm_compliance_summary
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pm compliance summary" ON public.pm_compliance_summary
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pm compliance summary" ON public.pm_compliance_summary
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pm compliance summary" ON public.pm_compliance_summary
    FOR DELETE USING (true);

-- PM Equipment History policies
CREATE POLICY "Users can view pm equipment history" ON public.pm_equipment_history
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pm equipment history" ON public.pm_equipment_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pm equipment history" ON public.pm_equipment_history
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pm equipment history" ON public.pm_equipment_history
    FOR DELETE USING (true);

-- PM Task Assignments policies
CREATE POLICY "Users can view pm task assignments" ON public.pm_task_assignments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pm task assignments" ON public.pm_task_assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pm task assignments" ON public.pm_task_assignments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pm task assignments" ON public.pm_task_assignments
    FOR DELETE USING (true);

-- PM Checklist Items policies
CREATE POLICY "Users can view pm checklist items" ON public.pm_checklist_items
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pm checklist items" ON public.pm_checklist_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pm checklist items" ON public.pm_checklist_items
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pm checklist items" ON public.pm_checklist_items
    FOR DELETE USING (true);

-- PM Forecasts policies
CREATE POLICY "Users can view pm forecasts" ON public.pm_forecasts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pm forecasts" ON public.pm_forecasts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pm forecasts" ON public.pm_forecasts
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pm forecasts" ON public.pm_forecasts
    FOR DELETE USING (true);

-- PM Notifications policies
CREATE POLICY "Users can view pm notifications" ON public.pm_notifications
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pm notifications" ON public.pm_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pm notifications" ON public.pm_notifications
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pm notifications" ON public.pm_notifications
    FOR DELETE USING (true);

-- PM Analytics policies
CREATE POLICY "Users can view pm analytics" ON public.pm_analytics
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pm analytics" ON public.pm_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pm analytics" ON public.pm_analytics
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pm analytics" ON public.pm_analytics
    FOR DELETE USING (true);

-- 11. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pm_compliance_summary_updated_at 
    BEFORE UPDATE ON public.pm_compliance_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pm_equipment_history_updated_at 
    BEFORE UPDATE ON public.pm_equipment_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pm_task_assignments_updated_at 
    BEFORE UPDATE ON public.pm_task_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pm_checklist_items_updated_at 
    BEFORE UPDATE ON public.pm_checklist_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pm_forecasts_updated_at 
    BEFORE UPDATE ON public.pm_forecasts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pm_analytics_updated_at 
    BEFORE UPDATE ON public.pm_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Insert sample data for testing
INSERT INTO public.pm_compliance_summary (equipment_id, equipment_name, equipment_type, total_scheduled_pm, completed_pm, overdue_pm, compliance_rate, maintenance_class) VALUES
('equipment_001', 'Excavator EX-001', 'Excavator', 12, 10, 2, 83.33, 'A'),
('equipment_002', 'Bulldozer BD-001', 'Bulldozer', 8, 7, 1, 87.50, 'B'),
('equipment_003', 'Crane CR-001', 'Crane', 6, 5, 1, 83.33, 'C')
ON CONFLICT DO NOTHING;

-- 13. Verify all tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'equipment_maintenance_logs',
    'equipment_maintenance_schedules', 
    'preventive_maintenance_logs',
    'preventive_maintenance_configs',
    'pm_compliance_summary',
    'pm_equipment_history',
    'pm_task_assignments',
    'pm_checklist_items',
    'pm_forecasts',
    'pm_notifications',
    'pm_analytics'
)
ORDER BY table_name; 