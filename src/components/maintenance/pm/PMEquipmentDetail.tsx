import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  site: string;
  qr_code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PMConfig {
  id: string;
  equipment_type: string;
  maintenance_class: string;
  maintenance_type: string;
  interval_hours: number;
  interval_km: number;
  interval_days: number;
  description: string;
  // checklist_items: string[]; // Removed, now fetched from preventive_maintenance_types
}

interface PMLog {
  id: string;
  equipment_id: string;
  maintenance_class: string;
  maintenance_type: string;
  scheduled_date: string;
  completed_date: string | null;
  status: string;
  technician_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PMEquipmentDetailProps {
  equipment: Equipment;
  onPerformPM: () => void;
}

const PMEquipmentDetail: React.FC<PMEquipmentDetailProps> = ({ equipment, onPerformPM }) => {
  const [pmConfigs, setPmConfigs] = useState<PMConfig[]>([]);
  const [pmLogs, setPmLogs] = useState<PMLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPMData();
  }, [equipment]);

  const fetchPMData = async () => {
    if (!supabase) return;

    try {
      setLoading(true);
      
      // Fetch PM configs for this equipment type
      const { data: configs, error: configError } = await supabase
        .from('preventive_maintenance_configs')
        .select('*')
        .eq('equipment_type', equipment.type);

      if (configError) throw configError;

      // Fetch PM logs for this equipment
      const { data: logs, error: logError } = await supabase
        .from('preventive_maintenance_logs')
        .select('*')
        .eq('equipment_id', equipment.id)
        .order('created_at', { ascending: false });

      if (logError) throw logError;

      setPmConfigs(configs || []);
      setPmLogs(logs || []);
    } catch (err) {
      console.error('Error fetching PM data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLastPMDate = () => {
    const lastPM = pmLogs.find(log => log.status === 'completed');
    return lastPM?.completed_date || 'Never';
  };

  const getNextPMDue = () => {
    if (pmConfigs.length === 0) return 'No PM schedule configured';
    
    const lastPM = getLastPMDate();
    if (lastPM === 'Never') return 'Due immediately';
    
    const lastPMDate = new Date(lastPM);
    const today = new Date();
    const daysSinceLastPM = Math.floor((today.getTime() - lastPMDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const nextPMDays = pmConfigs[0]?.interval_days || 30;
    const daysUntilDue = nextPMDays - daysSinceLastPM;
    
    if (daysUntilDue <= 0) return 'Overdue';
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
    return `Due in ${daysUntilDue} days`;
  };

  const getPMStatusColor = () => {
    const nextPM = getNextPMDue();
    if (nextPM === 'Overdue') return 'text-red-600 bg-red-50';
    if (nextPM.includes('Due in') && parseInt(nextPM.split(' ')[2]) <= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getPendingIssues = () => {
    // This would typically come from a separate issues table
    // For now, we'll show if there are any incomplete PM logs
    const pendingLogs = pmLogs.filter(log => log.status === 'scheduled');
    return pendingLogs.length > 0 ? `${pendingLogs.length} pending PM(s)` : 'No pending issues';
  };

  if (!equipment) return null;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{equipment.name}</h2>
          <p className="text-gray-600">Equipment ID: {equipment.id}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPMStatusColor()}`}>
          {getNextPMDue()}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading PM data...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Equipment Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Equipment Information</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Type:</span> {equipment.type}</div>
            <div><span className="font-medium">Model:</span> {equipment.model}</div>
            <div><span className="font-medium">Site:</span> {equipment.site}</div>
            <div><span className="font-medium">Status:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                equipment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {equipment.status}
              </span>
            </div>
            <div><span className="font-medium">QR Code:</span> {equipment.qr_code}</div>
          </div>
        </div>

        {/* PM Status */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Maintenance Status</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Last PM:</span> {getLastPMDate()}</div>
            <div><span className="font-medium">Next PM:</span> {getNextPMDue()}</div>
            <div><span className="font-medium">Pending Issues:</span> {getPendingIssues()}</div>
            <div><span className="font-medium">PM Configs:</span> {pmConfigs.length} configured</div>
          </div>
        </div>
      </div>

      {/* PM Configurations */}
      {pmConfigs.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">PM Configurations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pmConfigs.map((config) => (
              <div key={config.id} className="bg-white border border-gray-200 p-4 rounded-lg">
                <div className="font-medium text-gray-800 mb-2">{config.maintenance_class}</div>
                <div className="text-sm text-gray-600 mb-2">{config.description}</div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Interval: {config.interval_days} days</div>
                  {config.interval_hours > 0 && <div>Hours: {config.interval_hours}</div>}
                  {config.interval_km > 0 && <div>KM: {config.interval_km}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent PM History */}
      {pmLogs.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Recent PM History</h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Class</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {pmLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{log.completed_date || log.scheduled_date}</td>
                    <td className="px-4 py-2">{log.maintenance_class}</td>
                    <td className="px-4 py-2">{log.maintenance_type}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={onPerformPM} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Perform PM Now
        </button>
        <button 
          onClick={() => window.history.back()} 
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to Scanner
        </button>
      </div>
    </div>
  );
};

export default PMEquipmentDetail; 