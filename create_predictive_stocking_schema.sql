-- Create Predictive Stocking System Schema
-- This implements a basic predictive stocking system for PM parts management

-- 1. Predictive analytics table
CREATE TABLE IF NOT EXISTS predictive_stocking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id),
  equipment_id UUID REFERENCES equipment(id),
  predicted_usage_next_month INTEGER,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  recommended_order_date DATE,
  recommended_quantity INTEGER,
  current_stock_level INTEGER,
  reorder_point INTEGER,
  last_prediction_date DATE DEFAULT CURRENT_DATE,
  actual_vs_predicted_accuracy DECIMAL(3,2),
  prediction_factors JSONB, -- Stores factors used for prediction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AI learning data table for continuous improvement
CREATE TABLE IF NOT EXISTS ai_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_date DATE,
  material_id UUID REFERENCES materials(id),
  equipment_id UUID REFERENCES equipment(id),
  predicted_usage INTEGER,
  actual_usage INTEGER,
  prediction_accuracy DECIMAL(3,2),
  factors_considered JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Automated alerts table
CREATE TABLE IF NOT EXISTS predictive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id),
  equipment_id UUID REFERENCES equipment(id),
  alert_type VARCHAR(50), -- 'low_stock', 'upcoming_pm', 'high_confidence_prediction'
  alert_message TEXT,
  priority VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  recommended_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES employees(id)
);

-- 4. Prediction accuracy tracking table
CREATE TABLE IF NOT EXISTS prediction_accuracy_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id),
  month_year VARCHAR(7), -- Format: '2025-01'
  predicted_usage INTEGER,
  actual_usage INTEGER,
  accuracy_percentage DECIMAL(5,2),
  total_predictions INTEGER,
  correct_predictions INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predictive_stocking_material ON predictive_stocking(material_id);
CREATE INDEX IF NOT EXISTS idx_predictive_stocking_equipment ON predictive_stocking(equipment_id);
CREATE INDEX IF NOT EXISTS idx_predictive_stocking_date ON predictive_stocking(last_prediction_date);
CREATE INDEX IF NOT EXISTS idx_ai_learning_material ON ai_learning_data(material_id);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_status ON predictive_alerts(status);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_priority ON predictive_alerts(priority);

-- 6. Enable RLS (Row Level Security)
ALTER TABLE predictive_stocking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_accuracy_tracking ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Allow authenticated users to view predictive stocking" ON predictive_stocking
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert predictive stocking" ON predictive_stocking
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update predictive stocking" ON predictive_stocking
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users to view ai learning data" ON ai_learning_data
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view predictive alerts" ON predictive_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update predictive alerts" ON predictive_alerts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view accuracy tracking" ON prediction_accuracy_tracking
  FOR SELECT USING (auth.role() = 'authenticated'); 