// Logistics Dashboard Component
// Comprehensive logistics management dashboard with AI assistance

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Truck,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  BarChart3,
  MapPin,
  Users,
  Package,
  Settings,
  RefreshCw
} from 'lucide-react';
import LogisticsDataService from '../../utils/logisticsDataService';
import LogisticsAIBot from '../../utils/logisticsAIBot';
import { MaintenanceLogisticsIntegration } from '../../utils/maintenanceLogisticsIntegration';
import {
  LogisticsDashboardData,
  LogisticsKPI,
  LogisticsRecord,
  DepartmentAllocation,
  AssetMovementSummary,
  LogisticsAIResponse,
  LogisticsAIContext
} from '../../types/logistics';

const LogisticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<LogisticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<LogisticsAIResponse[]>([]);
  const [userInput, setUserInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const logisticsService = LogisticsDataService.getInstance();
  const aiBot = LogisticsAIBot.getInstance();

  useEffect(() => {
    loadDashboardData();
    // Load initial AI greeting
    const initialResponse = aiBot.generateResponse({
      user_query: 'help me get started with logistics'
    });
    setAiMessages([initialResponse]);
  }, []);

  const loadDashboardData = () => {
    setLoading(true);
    try {
      const data = logisticsService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMaintenanceLogs = async () => {
    setSyncing(true);
    try {
      console.log('🔄 [LogisticsDashboard] Starting maintenance logs sync...');
      const result = await MaintenanceLogisticsIntegration.syncExistingMaintenanceLogs();
      
      if (result.success) {
        console.log(`✅ [LogisticsDashboard] Sync completed. Created ${result.created} triggers.`);
        alert(`Sync completed! Created ${result.created} logistics triggers from maintenance logs.`);
        loadDashboardData(); // Refresh dashboard data
      } else {
        console.error('❌ [LogisticsDashboard] Sync failed:', result.error);
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [LogisticsDashboard] Sync error:', error);
      alert('Sync failed. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const context: LogisticsAIContext = {
        user_query: userInput
      };

      const response = aiBot.generateResponse(context);
      setAiMessages(prev => [...prev, response]);
      setUserInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600">Unable to load logistics dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics Dashboard</h1>
          <p className="text-gray-600">Real-time logistics operations and performance monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="/logistics/movement"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>Resource Movement</span>
          </a>
          <button
            onClick={handleSyncMaintenanceLogs}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Maintenance'}</span>
          </button>
          <button
            onClick={() => setAiChatOpen(!aiChatOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Triggers</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.total_triggers}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Triggers</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.active_triggers}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Actions</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.completed_actions}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Movements</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.total_movements}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Debug Section - Current Triggers */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Triggers (Debug)</h3>
        <div className="space-y-3">
          {(() => {
            const triggers = logisticsService.getTriggers();
            const maintenanceTriggers = MaintenanceLogisticsIntegration.getMaintenanceTriggers();
            const logsNeedingTriggers = MaintenanceLogisticsIntegration.getMaintenanceLogsNeedingTriggers();
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Total Triggers</h4>
                  <p className="text-2xl font-bold text-blue-600">{triggers.length}</p>
                  <p className="text-sm text-blue-700">All logistics triggers</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Maintenance Triggers</h4>
                  <p className="text-2xl font-bold text-green-600">{maintenanceTriggers.length}</p>
                  <p className="text-sm text-green-700">Maintenance-related triggers</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-2">Logs Needing Triggers</h4>
                  <p className="text-2xl font-bold text-orange-600">{logsNeedingTriggers.length}</p>
                  <p className="text-sm text-orange-700">Maintenance logs without triggers</p>
                </div>
              </div>
            );
          })()}
          
          {/* Show maintenance triggers details */}
          {(() => {
            const maintenanceTriggers = MaintenanceLogisticsIntegration.getMaintenanceTriggers();
            if (maintenanceTriggers.length > 0) {
              return (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Maintenance Triggers Details:</h4>
                  <div className="space-y-2">
                    {maintenanceTriggers.map(trigger => (
                      <div key={trigger.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{trigger.entity_name}</p>
                            <p className="text-sm text-gray-600">{trigger.description}</p>
                            <p className="text-xs text-gray-500">Type: {trigger.trigger_type} | Status: {trigger.status}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(trigger.priority)}`}>
                            {trigger.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPIs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
          <div className="space-y-4">
            {dashboardData.logistics_kpis.map((kpi) => (
              <div key={kpi.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTrendIcon(kpi.trend)}
                  <div>
                    <p className="font-medium text-gray-900">{kpi.kpi_name}</p>
                    <p className="text-sm text-gray-600">{kpi.period}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {kpi.kpi_value} {kpi.kpi_unit}
                  </p>
                  <p className={`text-sm ${kpi.variance_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.variance_percentage >= 0 ? '+' : ''}{kpi.variance_percentage.toFixed(1)}% vs target
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant Chat */}
        {aiChatOpen && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <button
                onClick={() => setAiChatOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-64 overflow-y-auto mb-4 space-y-3">
              {aiMessages.map((message) => (
                <div key={message.id} className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">{message.title}</p>
                  <p className="text-sm text-blue-800">{message.message}</p>
                  {message.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-blue-700 mb-1">Suggestions:</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        {message.suggestions.slice(0, 3).map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about logistics..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sendingMessage}
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !userInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Department Allocations */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Cost Allocations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Charged
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Movements
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.department_allocations.map((allocation) => (
                <tr key={allocation.department}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {allocation.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {allocation.cost_center}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(allocation.total_allocated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(allocation.total_charged)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={allocation.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(allocation.net_amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {allocation.movement_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Movement Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Movement Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.asset_movement_summary.map((summary) => (
            <div key={summary.asset_type} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                {summary.asset_type === 'Equipment' && <Truck className="w-5 h-5 text-blue-600" />}
                {summary.asset_type === 'Materials' && <Package className="w-5 h-5 text-green-600" />}
                {summary.asset_type === 'Crew' && <Users className="w-5 h-5 text-purple-600" />}
                <h4 className="font-medium text-gray-900">{summary.asset_type}</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Movements:</span>
                  <span className="font-medium">{summary.total_movements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">{formatCurrency(summary.total_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Duration:</span>
                  <span className="font-medium">{summary.average_duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Common Destination:</span>
                  <span className="font-medium">{summary.most_common_destination}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Movements</h3>
        <div className="space-y-4">
          {dashboardData.recent_movements.map((movement) => (
            <div key={movement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {movement.entity_type === 'equipment' && <Truck className="w-4 h-4 text-blue-600" />}
                  {movement.entity_type === 'material' && <Package className="w-4 h-4 text-green-600" />}
                  {movement.entity_type === 'employee' && <Users className="w-4 h-4 text-purple-600" />}
                  <span className="text-sm font-medium text-gray-900">{movement.entity_name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {movement.quantity} {movement.unit}
                </div>
                <div className="text-sm text-gray-600">
                  {movement.location_from} → {movement.location_to}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(movement.value)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(movement.status)}`}>
                  {movement.status}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(movement.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogisticsDashboard; 