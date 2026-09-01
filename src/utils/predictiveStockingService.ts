import { supabase } from './supabaseClient';

export interface PredictiveStockingData {
  id: string;
  material_id: string;
  equipment_id: string;
  predicted_usage_next_month: number;
  confidence_score: number;
  recommended_order_date: string;
  recommended_quantity: number;
  current_stock_level: number;
  reorder_point: number;
  last_prediction_date: string;
  actual_vs_predicted_accuracy: number;
  prediction_factors: any;
}

export interface PredictiveAlert {
  id: string;
  material_id: string;
  equipment_id: string;
  alert_type: 'low_stock' | 'upcoming_pm' | 'high_confidence_prediction';
  alert_message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  recommended_action: string;
  created_at: string;
}

export class PredictiveStockingService {
  // Generate predictions based on PM data
  static async generatePredictions(): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get all equipment with PM schedules
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, type, pm_frequency_days, pm_class')
        .eq('is_pm', true);

      if (equipmentError) throw equipmentError;

      // Get PM logs for historical analysis
      const { data: pmLogs, error: pmLogsError } = await supabase
        .from('preventive_maintenance_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

      if (pmLogsError) throw pmLogsError;

      // Get materials data
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*');

      if (materialsError) throw materialsError;

      // Generate predictions for each equipment-material combination
      for (const eq of equipment || []) {
        for (const material of materials || []) {
          const prediction = this.calculatePrediction(eq, material, pmLogs || []);
          
          if (prediction) {
            await this.savePrediction(prediction);
          }
        }
      }

      // Generate alerts based on predictions
      await this.generateAlerts();

    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }

  // Calculate prediction for a specific equipment-material combination
  private static calculatePrediction(equipment: any, material: any, pmLogs: any[]): any {
    try {
      // Get PM logs for this equipment
      const equipmentPMLogs = pmLogs.filter(log => log.equipment_id === equipment.id);
      
      if (equipmentPMLogs.length === 0) {
        return null; // No historical data
      }

      // Calculate average usage per PM
      const totalPMs = equipmentPMLogs.length;
      const averageUsagePerPM = 1; // Default assumption - can be enhanced with actual usage data

      // Calculate PM frequency in days
      const pmFrequencyDays = equipment.pm_frequency_days || 30;

      // Predict usage for next month
      const daysInMonth = 30;
      const pmsPerMonth = daysInMonth / pmFrequencyDays;
      const predictedUsage = Math.ceil(averageUsagePerPM * pmsPerMonth);

      // Calculate confidence score based on data quality
      const confidenceScore = this.calculateConfidence(equipmentPMLogs, totalPMs);

      // Calculate reorder point (when to order)
      const reorderPoint = Math.ceil(predictedUsage * 0.3); // Order when 30% of predicted usage remains

      // Calculate recommended order date
      const recommendedOrderDate = new Date();
      recommendedOrderDate.setDate(recommendedOrderDate.getDate() + 7); // Order 7 days in advance

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
      };

    } catch (error) {
      console.error('Error calculating prediction:', error);
      return null;
    }
  }

  // Calculate confidence score based on data quality
  private static calculateConfidence(pmLogs: any[], totalPMs: number): number {
    // Base confidence on amount of historical data
    let confidence = 0.5; // Base confidence

    // Increase confidence with more data
    if (totalPMs >= 10) confidence += 0.3;
    else if (totalPMs >= 5) confidence += 0.2;
    else if (totalPMs >= 3) confidence += 0.1;

    // Increase confidence if PM logs are recent
    const recentLogs = pmLogs.filter(log => 
      new Date(log.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentLogs.length > 0) confidence += 0.1;

    // Cap confidence at 0.95
    return Math.min(confidence, 0.95);
  }

  // Save prediction to database
  private static async savePrediction(prediction: any): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Check if prediction already exists
      const { data: existing } = await supabase
        .from('predictive_stocking')
        .select('id')
        .eq('material_id', prediction.material_id)
        .eq('equipment_id', prediction.equipment_id)
        .single();

      if (existing) {
        // Update existing prediction
        await supabase
          .from('predictive_stocking')
          .update({
            ...prediction,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new prediction
        await supabase
          .from('predictive_stocking')
          .insert(prediction);
      }

    } catch (error) {
      console.error('Error saving prediction:', error);
    }
  }

  // Generate alerts based on predictions
  static async generateAlerts(): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get all predictions
      const { data: predictions, error: predictionsError } = await supabase
        .from('predictive_stocking')
        .select('*');

      if (predictionsError) throw predictionsError;

      for (const prediction of predictions || []) {
        // Check for low stock alerts
        if (prediction.current_stock_level <= prediction.reorder_point) {
          await this.createAlert({
            material_id: prediction.material_id,
            equipment_id: prediction.equipment_id,
            alert_type: 'low_stock',
            alert_message: `Low stock alert: Current stock (${prediction.current_stock_level}) is at or below reorder point (${prediction.reorder_point})`,
            priority: prediction.current_stock_level === 0 ? 'critical' : 'high',
            recommended_action: `Order ${prediction.recommended_quantity} units of this material`
          });
        }

        // Check for high confidence predictions
        if (prediction.confidence_score >= 0.8) {
          await this.createAlert({
            material_id: prediction.material_id,
            equipment_id: prediction.equipment_id,
            alert_type: 'high_confidence_prediction',
            alert_message: `High confidence prediction: ${prediction.predicted_usage_next_month} units needed next month (${Math.round(prediction.confidence_score * 100)}% confidence)`,
            priority: 'medium',
            recommended_action: `Consider pre-ordering ${prediction.recommended_quantity} units`
          });
        }
      }

    } catch (error) {
      console.error('Error generating alerts:', error);
    }
  }

  // Create a new alert
  private static async createAlert(alertData: Partial<PredictiveAlert>): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Check if similar alert already exists
      const { data: existing } = await supabase
        .from('predictive_alerts')
        .select('id')
        .eq('material_id', alertData.material_id)
        .eq('equipment_id', alertData.equipment_id)
        .eq('alert_type', alertData.alert_type)
        .eq('status', 'active')
        .single();

      if (!existing) {
        await supabase
          .from('predictive_alerts')
          .insert(alertData);
      }

    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  // Get all predictions
  static async getPredictions(): Promise<PredictiveStockingData[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('predictive_stocking')
        .select(`
          *,
          materials:material_id(name, stock_quantity),
          equipment:equipment_id(name, type)
        `)
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting predictions:', error);
      return [];
    }
  }

  // Get all alerts
  static async getAlerts(): Promise<PredictiveAlert[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('predictive_alerts')
        .select(`
          *,
          materials:material_id(name),
          equipment:equipment_id(name)
        `)
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  // Acknowledge an alert
  static async acknowledgeAlert(alertId: string, employeeId: string): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      await supabase
        .from('predictive_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: employeeId
        })
        .eq('id', alertId);

    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  // Get prediction accuracy statistics
  static async getAccuracyStats(): Promise<any> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('prediction_accuracy_tracking')
        .select('*')
        .order('month_year', { ascending: false })
        .limit(12); // Last 12 months

      if (error) throw error;

      const stats = {
        total_predictions: 0,
        average_accuracy: 0,
        monthly_trends: data || []
      };

      if (data && data.length > 0) {
        stats.total_predictions = data.reduce((sum, item) => sum + (item.total_predictions || 0), 0);
        stats.average_accuracy = data.reduce((sum, item) => sum + (item.accuracy_percentage || 0), 0) / data.length;
      }

      return stats;

    } catch (error) {
      console.error('Error getting accuracy stats:', error);
      return { total_predictions: 0, average_accuracy: 0, monthly_trends: [] };
    }
  }
} 