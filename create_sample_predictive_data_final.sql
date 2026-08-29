-- Create Sample Data for Predictive Stocking System (Final - Corrected column names)
-- This script creates sample predictions, alerts, and accuracy tracking data

-- 1. Insert sample predictions
INSERT INTO predictive_stocking (
  material_id,
  equipment_id,
  predicted_usage_next_month,
  confidence_score,
  recommended_order_date,
  recommended_quantity,
  current_stock_level,
  reorder_point,
  prediction_factors
) 
SELECT 
  m.id as material_id,
  e.id as equipment_id,
  CASE 
    WHEN e.pm_class = 'Class A' THEN 2
    WHEN e.pm_class = 'Class B' THEN 1
    WHEN e.pm_class = 'Class C' THEN 3
    ELSE 1
  END as predicted_usage_next_month,
  CASE 
    WHEN e.pm_frequency_days <= 30 THEN 0.85
    WHEN e.pm_frequency_days <= 60 THEN 0.75
    ELSE 0.65
  END as confidence_score,
  (CURRENT_DATE + INTERVAL '7 days')::date as recommended_order_date,
  CASE 
    WHEN e.pm_class = 'Class A' THEN 2
    WHEN e.pm_class = 'Class B' THEN 1
    WHEN e.pm_class = 'Class C' THEN 3
    ELSE 1
  END as recommended_quantity,
  COALESCE(m.quantity, 0) as current_stock_level,
  CASE 
    WHEN e.pm_class = 'Class A' THEN 1
    WHEN e.pm_class = 'Class B' THEN 1
    WHEN e.pm_class = 'Class C' THEN 2
    ELSE 1
  END as reorder_point,
  jsonb_build_object(
    'pm_frequency_days', e.pm_frequency_days,
    'total_pm_logs', 5,
    'average_usage_per_pm', 1,
    'equipment_type', e.type,
    'pm_class', e.pm_class
  ) as prediction_factors
FROM equipment e
CROSS JOIN materials m
WHERE e.is_pm = true
  AND m.type = 'Spare Parts'
LIMIT 20;

-- 2. Insert sample AI learning data
INSERT INTO ai_learning_data (
  prediction_date,
  material_id,
  equipment_id,
  predicted_usage,
  actual_usage,
  prediction_accuracy,
  factors_considered
)
SELECT 
  (CURRENT_DATE - INTERVAL '1 month')::date as prediction_date,
  m.id as material_id,
  e.id as equipment_id,
  CASE 
    WHEN e.pm_class = 'Class A' THEN 2
    WHEN e.pm_class = 'Class B' THEN 1
    WHEN e.pm_class = 'Class C' THEN 3
    ELSE 1
  END as predicted_usage,
  CASE 
    WHEN e.pm_class = 'Class A' THEN 2
    WHEN e.pm_class = 'Class B' THEN 1
    WHEN e.pm_class = 'Class C' THEN 3
    ELSE 1
  END as actual_usage,
  0.85 as prediction_accuracy,
  jsonb_build_object(
    'pm_frequency_days', e.pm_frequency_days,
    'equipment_type', e.type,
    'pm_class', e.pm_class,
    'historical_data_points', 5
  ) as factors_considered
FROM equipment e
CROSS JOIN materials m
WHERE e.is_pm = true
  AND m.type = 'Spare Parts'
LIMIT 15;

-- 3. Insert sample alerts
INSERT INTO predictive_alerts (
  material_id,
  equipment_id,
  alert_type,
  alert_message,
  priority,
  recommended_action
)
SELECT 
  m.id as material_id,
  e.id as equipment_id,
  CASE 
    WHEN COALESCE(m.quantity, 0) = 0 THEN 'low_stock'
    WHEN COALESCE(m.quantity, 0) <= 2 THEN 'low_stock'
    ELSE 'high_confidence_prediction'
  END as alert_type,
  CASE 
    WHEN COALESCE(m.quantity, 0) = 0 THEN 
      'Critical: No stock available for ' || m.name || ' needed by ' || e.name
    WHEN COALESCE(m.quantity, 0) <= 2 THEN 
      'Low stock alert: Only ' || m.quantity || ' units of ' || m.name || ' remaining'
    ELSE 
      'High confidence prediction: ' || 
      CASE 
        WHEN e.pm_class = 'Class A' THEN '2'
        WHEN e.pm_class = 'Class B' THEN '1'
        WHEN e.pm_class = 'Class C' THEN '3'
        ELSE '1'
      END || ' units of ' || m.name || ' needed next month'
  END as alert_message,
  CASE 
    WHEN COALESCE(m.quantity, 0) = 0 THEN 'critical'
    WHEN COALESCE(m.quantity, 0) <= 2 THEN 'high'
    ELSE 'medium'
  END as priority,
  CASE 
    WHEN COALESCE(m.quantity, 0) = 0 THEN 
      'Urgent: Order ' || 
      CASE 
        WHEN e.pm_class = 'Class A' THEN '5'
        WHEN e.pm_class = 'Class B' THEN '3'
        WHEN e.pm_class = 'Class C' THEN '5'
        ELSE '3'
      END || ' units immediately'
    WHEN COALESCE(m.quantity, 0) <= 2 THEN 
      'Order ' || 
      CASE 
        WHEN e.pm_class = 'Class A' THEN '3'
        WHEN e.pm_class = 'Class B' THEN '2'
        WHEN e.pm_class = 'Class C' THEN '4'
        ELSE '2'
      END || ' units within 7 days'
    ELSE 
      'Consider pre-ordering ' || 
      CASE 
        WHEN e.pm_class = 'Class A' THEN '2'
        WHEN e.pm_class = 'Class B' THEN '1'
        WHEN e.pm_class = 'Class C' THEN '3'
        ELSE '1'
      END || ' units for next month'
  END as recommended_action
FROM equipment e
CROSS JOIN materials m
WHERE e.is_pm = true
  AND m.type = 'Spare Parts'
  AND (
    COALESCE(m.quantity, 0) <= 2 
    OR e.pm_frequency_days <= 30
  )
LIMIT 10;

-- 4. Insert sample accuracy tracking data
INSERT INTO prediction_accuracy_tracking (
  material_id,
  month_year,
  predicted_usage,
  actual_usage,
  accuracy_percentage,
  total_predictions,
  correct_predictions
)
SELECT 
  m.id as material_id,
  TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM') as month_year,
  CASE 
    WHEN e.pm_class = 'Class A' THEN 2
    WHEN e.pm_class = 'Class B' THEN 1
    WHEN e.pm_class = 'Class C' THEN 3
    ELSE 1
  END as predicted_usage,
  CASE 
    WHEN e.pm_class = 'Class A' THEN 2
    WHEN e.pm_class = 'Class B' THEN 1
    WHEN e.pm_class = 'Class C' THEN 3
    ELSE 1
  END as actual_usage,
  85.5 as accuracy_percentage,
  10 as total_predictions,
  8 as correct_predictions
FROM equipment e
CROSS JOIN materials m
WHERE e.is_pm = true
  AND m.type = 'Spare Parts'
LIMIT 8;

-- 5. Verification queries
SELECT 'Sample Data Created Successfully' as status;

-- Check predictions
SELECT 
  'Predictions' as table_name,
  COUNT(*) as record_count
FROM predictive_stocking;

-- Check alerts
SELECT 
  'Alerts' as table_name,
  COUNT(*) as record_count,
  priority,
  alert_type
FROM predictive_alerts
GROUP BY priority, alert_type;

-- Check accuracy tracking
SELECT 
  'Accuracy Tracking' as table_name,
  COUNT(*) as record_count,
  AVG(accuracy_percentage) as avg_accuracy
FROM prediction_accuracy_tracking; 