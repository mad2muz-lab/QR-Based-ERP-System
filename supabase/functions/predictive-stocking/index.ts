import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action } = await req.json()

    switch (action) {
      case 'generate_predictions':
        return await generatePredictions(supabase)
      case 'generate_alerts':
        return await generateAlerts(supabase)
      case 'update_accuracy':
        return await updateAccuracyTracking(supabase)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in predictive stocking function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generatePredictions(supabase: any) {
  try {
    // Get all equipment with PM schedules
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name, type, pm_frequency_days, pm_class')
      .eq('is_pm', true)

    if (equipmentError) throw equipmentError

    // Get PM logs for historical analysis
    const { data: pmLogs, error: pmLogsError } = await supabase
      .from('preventive_maintenance_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    if (pmLogsError) throw pmLogsError

    // Get materials data
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .eq('category', 'Spare Parts')

    if (materialsError) throw materialsError

    const predictions = []

    // Generate predictions for each equipment-material combination
    for (const eq of equipment || []) {
      for (const material of materials || []) {
        const prediction = calculatePrediction(eq, material, pmLogs || [])
        
        if (prediction) {
          predictions.push(prediction)
        }
      }
    }

    // Save predictions to database
    if (predictions.length > 0) {
      const { error: insertError } = await supabase
        .from('predictive_stocking')
        .upsert(predictions, { onConflict: 'material_id,equipment_id' })

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${predictions.length} predictions`,
        predictions_count: predictions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error generating predictions:', error)
    throw error
  }
}

function calculatePrediction(equipment: any, material: any, pmLogs: any[]): any {
  try {
    // Get PM logs for this equipment
    const equipmentPMLogs = pmLogs.filter(log => log.equipment_id === equipment.id)
    
    if (equipmentPMLogs.length === 0) {
      return null // No historical data
    }

    // Calculate average usage per PM
    const totalPMs = equipmentPMLogs.length
    const averageUsagePerPM = 1 // Default assumption

    // Calculate PM frequency in days
    const pmFrequencyDays = equipment.pm_frequency_days || 30

    // Predict usage for next month
    const daysInMonth = 30
    const pmsPerMonth = daysInMonth / pmFrequencyDays
    const predictedUsage = Math.ceil(averageUsagePerPM * pmsPerMonth)

    // Calculate confidence score based on data quality
    const confidenceScore = calculateConfidence(equipmentPMLogs, totalPMs)

    // Calculate reorder point
    const reorderPoint = Math.ceil(predictedUsage * 0.3)

    // Calculate recommended order date
    const recommendedOrderDate = new Date()
    recommendedOrderDate.setDate(recommendedOrderDate.getDate() + 7)

    return {
      material_id: material.id,
      equipment_id: equipment.id,
      predicted_usage_next_month: predictedUsage,
      confidence_score: confidenceScore,
      recommended_order_date: recommendedOrderDate.toISOString().split('T')[0],
      recommended_quantity: predictedUsage,
      current_stock_level: material.stock_quantity || 0,
      reorder_point: reorderPoint,
      prediction_factors: {
        pm_frequency_days: pmFrequencyDays,
        total_pm_logs: totalPMs,
        average_usage_per_pm: averageUsagePerPM,
        equipment_type: equipment.type,
        pm_class: equipment.pm_class
      }
    }

  } catch (error) {
    console.error('Error calculating prediction:', error)
    return null
  }
}

function calculateConfidence(pmLogs: any[], totalPMs: number): number {
  let confidence = 0.5 // Base confidence

  // Increase confidence with more data
  if (totalPMs >= 10) confidence += 0.3
  else if (totalPMs >= 5) confidence += 0.2
  else if (totalPMs >= 3) confidence += 0.1

  // Increase confidence if PM logs are recent
  const recentLogs = pmLogs.filter(log => 
    new Date(log.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  )
  if (recentLogs.length > 0) confidence += 0.1

  // Cap confidence at 0.95
  return Math.min(confidence, 0.95)
}

async function generateAlerts(supabase: any) {
  try {
    // Get all predictions
    const { data: predictions, error: predictionsError } = await supabase
      .from('predictive_stocking')
      .select('*')

    if (predictionsError) throw predictionsError

    const alerts = []

    for (const prediction of predictions || []) {
      // Check for low stock alerts
      if (prediction.current_stock_level <= prediction.reorder_point) {
        alerts.push({
          material_id: prediction.material_id,
          equipment_id: prediction.equipment_id,
          alert_type: 'low_stock',
          alert_message: `Low stock alert: Current stock (${prediction.current_stock_level}) is at or below reorder point (${prediction.reorder_point})`,
          priority: prediction.current_stock_level === 0 ? 'critical' : 'high',
          recommended_action: `Order ${prediction.recommended_quantity} units of this material`
        })
      }

      // Check for high confidence predictions
      if (prediction.confidence_score >= 0.8) {
        alerts.push({
          material_id: prediction.material_id,
          equipment_id: prediction.equipment_id,
          alert_type: 'high_confidence_prediction',
          alert_message: `High confidence prediction: ${prediction.predicted_usage_next_month} units needed next month (${Math.round(prediction.confidence_score * 100)}% confidence)`,
          priority: 'medium',
          recommended_action: `Consider pre-ordering ${prediction.recommended_quantity} units`
        })
      }
    }

    // Save alerts to database
    if (alerts.length > 0) {
      const { error: insertError } = await supabase
        .from('predictive_alerts')
        .insert(alerts)

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${alerts.length} alerts`,
        alerts_count: alerts.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error generating alerts:', error)
    throw error
  }
}

async function updateAccuracyTracking(supabase: any) {
  try {
    // Get AI learning data for the last month
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const monthYear = lastMonth.toISOString().slice(0, 7) // YYYY-MM format

    const { data: learningData, error: learningError } = await supabase
      .from('ai_learning_data')
      .select('*')
      .gte('prediction_date', lastMonth.toISOString().split('T')[0])

    if (learningError) throw learningError

    if (learningData && learningData.length > 0) {
      // Calculate accuracy statistics
      const totalPredictions = learningData.length
      const correctPredictions = learningData.filter(item => 
        Math.abs(item.predicted_usage - item.actual_usage) <= 1
      ).length
      const accuracyPercentage = (correctPredictions / totalPredictions) * 100

      // Update accuracy tracking
      const { error: updateError } = await supabase
        .from('prediction_accuracy_tracking')
        .upsert({
          material_id: learningData[0].material_id, // Using first material as example
          month_year: monthYear,
          predicted_usage: learningData.reduce((sum, item) => sum + item.predicted_usage, 0),
          actual_usage: learningData.reduce((sum, item) => sum + item.actual_usage, 0),
          accuracy_percentage: accuracyPercentage,
          total_predictions: totalPredictions,
          correct_predictions: correctPredictions
        }, { onConflict: 'material_id,month_year' })

      if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Accuracy tracking updated',
        month_year: monthYear
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error updating accuracy tracking:', error)
    throw error
  }
} 