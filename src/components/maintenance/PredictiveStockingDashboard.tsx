import React, { useState, useEffect } from 'react';
import { PredictiveStockingService, PredictiveStockingData, PredictiveAlert } from '../../utils/predictiveStockingService';
import { Brain, AlertTriangle, TrendingUp, BarChart3, RefreshCw, CheckCircle } from 'lucide-react';

const PredictiveStockingDashboard: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictiveStockingData[]>([]);
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [accuracyStats, setAccuracyStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high_confidence' | 'low_stock'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [predictionsData, alertsData, statsData] = await Promise.all([
        PredictiveStockingService.getPredictions(),
        PredictiveStockingService.getAlerts(),
        PredictiveStockingService.getAccuracyStats()
      ]);

      setPredictions(predictionsData);
      setAlerts(alertsData);
      setAccuracyStats(statsData);
    } catch (error) {
      console.error('Error loading predictive stocking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    setGeneratingPredictions(true);
    try {
      await PredictiveStockingService.generatePredictions();
      await loadData(); // Reload data after generating predictions
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setGeneratingPredictions(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await PredictiveStockingService.acknowledgeAlert(alertId, 'current_user_id');
      await loadData(); // Reload alerts
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredPredictions = predictions.filter(prediction => {
    if (selectedFilter === 'high_confidence') return prediction.confidence_score >= 0.8;
    if (selectedFilter === 'low_stock') return prediction.current_stock_level <= prediction.reorder_point;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading predictive stocking data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Predictive Stocking Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generatePredictions}
            disabled={generatingPredictions}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${generatingPredictions ? 'animate-spin' : ''}`} />
            <span>{generatingPredictions ? 'Generating...' : 'Generate Predictions'}</span>
          </button>
          <button
            onClick={loadData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Predictions</p>
              <p className="text-2xl font-bold text-gray-900">{predictions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">
                {accuracyStats.average_accuracy ? `${Math.round(accuracyStats.average_accuracy)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {predictions.filter(p => p.confidence_score >= 0.8).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              Active Alerts ({alerts.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium capitalize">{alert.priority}</span>
                        <span className="text-sm text-gray-600">•</span>
                        <span className="text-sm text-gray-600 capitalize">{alert.alert_type.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm font-medium mb-1">{alert.alert_message}</p>
                      <p className="text-sm text-gray-600">{alert.recommended_action}</p>
                    </div>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="ml-4 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Predictions Section */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              Predictions ({filteredPredictions.length})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter('high_confidence')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedFilter === 'high_confidence' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                High Confidence
              </button>
              <button
                onClick={() => setSelectedFilter('low_stock')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedFilter === 'low_stock' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Low Stock
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {filteredPredictions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No predictions found for the selected filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Predicted Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recommended Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPredictions.map((prediction) => (
                    <tr key={prediction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {prediction.materials?.name || 'Unknown Material'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {prediction.equipment?.name || 'Unknown Equipment'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {prediction.equipment?.type || 'Unknown Type'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {prediction.predicted_usage_next_month} units
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getConfidenceColor(prediction.confidence_score)}`}>
                          {Math.round(prediction.confidence_score * 100)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {prediction.current_stock_level} units
                        </div>
                        {prediction.current_stock_level <= prediction.reorder_point && (
                          <div className="text-xs text-red-600">Low Stock</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {prediction.recommended_quantity} units
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(prediction.recommended_order_date).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictiveStockingDashboard; 