import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Users, 
  Calendar,
  RefreshCw,
  BarChart3
} from 'lucide-react';

const PMDashboard: React.FC = () => {
  const [compliance, setCompliance] = useState<any>(null);
  const [techPerf, setTechPerf] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        setError('Supabase client not configured');
        setLoading(false);
        return;
      }
      
      try {
        // Calculate compliance data from actual PM logs instead of using sample data
        const { data: pmLogsForCompliance, error: complianceError } = await supabase
          .from('preventive_maintenance_logs')
          .select('*');
        
        if (complianceError) {
          console.warn('Could not fetch PM logs for compliance calculation:', complianceError);
          setCompliance(null);
        } else {
                        // Debug: Log the actual PM logs data
              console.log('🔍 PM Logs Data for Compliance:', pmLogsForCompliance);
              console.log('🔍 Sample PM Log:', pmLogsForCompliance?.[0]);

              // Debug: Check all unique status values
              const uniqueStatuses = [...new Set(pmLogsForCompliance?.map(log => log.status) || [])];
              console.log('🔍 Unique Status Values:', uniqueStatuses);

              // Debug: Check completed_date values
              const completedDates = pmLogsForCompliance?.map(log => log.completed_date).filter(date => date !== null);
              console.log('🔍 Completed Dates:', completedDates);
              console.log('🔍 Total logs with completed_date:', completedDates?.length || 0);
          
                        // Calculate real compliance data from PM logs
              const totalScheduled = pmLogsForCompliance?.length || 0;

              // Check for completed tasks (those with completed_date)
              const completed = pmLogsForCompliance?.filter(log => log.completed_date).length || 0;

              // Check for overdue tasks (scheduled_date is in the past but no completed_date)
              const now = new Date();
              const overdue = pmLogsForCompliance?.filter(log => {
                if (log.completed_date) return false; // Already completed
                if (!log.scheduled_date) return false; // No scheduled date
                const scheduledDate = new Date(log.scheduled_date);
                return scheduledDate < now;
              }).length || 0;
          
          const complianceRate = totalScheduled > 0 ? ((completed / totalScheduled) * 100).toFixed(2) : '0';
          
          const realCompliance = {
            total_scheduled_pm: totalScheduled,
            completed_pm: completed,
            overdue_pm: overdue,
            compliance_rate: complianceRate
          };
          setCompliance(realCompliance);
        }
        
        // Fetch technician performance from the dedicated pm_technician_performance table
        try {
          const { data: techData, error: techError } = await supabase
            .from('pm_technician_performance')
            .select('*');
          
          if (techError) {
            console.warn('Could not fetch technician performance data:', techError);
            setTechPerf([]);
          } else {
            setTechPerf(techData && techData.length > 0 ? techData : []);
          }
        } catch (techError) {
          console.warn('Error fetching technician performance:', techError);
          setTechPerf([]);
        }
        
      } catch (err) {
        console.error('Error fetching PM dashboard data:', err);
        setError('Failed to load PM dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading PM Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preventive Maintenance Dashboard</h1>
          <p className="text-gray-600">Monitor and manage equipment maintenance schedules</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Compliance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{compliance?.total_scheduled_pm || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{compliance?.completed_pm || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{compliance?.overdue_pm || 0}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {compliance?.compliance_rate ? `${compliance.compliance_rate}%` : '0%'}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Technician Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Technician Performance</h3>
            </div>
            <span className="text-sm text-gray-500">{techPerf.length} technicians</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Completion (hrs)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {techPerf.map((row) => (
                <tr key={row.technician_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.technician_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">{row.completed}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-red-600">{row.overdue}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.avg_completion_hours ? `${row.avg_completion_hours.toFixed(2)} hrs` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PMDashboard; 