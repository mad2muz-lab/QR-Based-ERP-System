import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Equipment } from '../../../types';
import PMEquipmentDetail from './PMEquipmentDetail';
import PMChecklistForm from './PMChecklistForm';
import PMPartRequestForm from './PMPartRequestForm';
import PMLogCompletion from './PMLogCompletion';
import PMQRScanner from './PMQRScanner';

// Define PM Equipment type


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
  performed_date: string | null;
  status: string;
  technician_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  equipment?: {
    "Equipment Name": string;
    "Equipment type": string;
    model: string;
    site: string;
  };
}

const PMDashboard: React.FC = () => {
  const [step, setStep] = useState<'scan' | 'detail' | 'checklist' | 'part' | 'complete'>('scan');
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [pmConfigs, setPmConfigs] = useState<PMConfig[]>([]);
  const [pmLogs, setPmLogs] = useState<PMLog[]>([]);
  const [checklist, setChecklist] = useState<any>(null);
  const [partRequest, setPartRequest] = useState<any>(null);
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedPmLogs, setAssignedPmLogs] = useState<PMLog[]>([]);
  const [newAssignments, setNewAssignments] = useState<number>(0);
  const [overduePmLogs, setOverduePmLogs] = useState<PMLog[]>([]);
  const [missedPmLogs, setMissedPmLogs] = useState<PMLog[]>([]);
  const [enrolledEquipment, setEnrolledEquipment] = useState<Equipment[]>([]);

  // Fetch PM configs and enrolled equipment on component mount
  useEffect(() => {
    fetchPMConfigs();
    fetchEnrolledEquipment();
  }, []);

  const fetchPMConfigs = async () => {
    if (!supabase) {
      setError('Supabase client not configured');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('preventive_maintenance_configs')
        .select('*')
        .order('equipment_type', { ascending: true });

      if (error) throw error;
      setPmConfigs(data || []);
    } catch (err) {
      console.error('Error fetching PM configs:', err);
      setError('Failed to load PM configurations');
    } finally {
      setLoading(false);
    }
  };



  const fetchEnrolledEquipment = async () => {
    if (!supabase) {
      setError('Supabase client not configured');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('id, custom_equipment_id, "Equipment Name", "Equipment type", model, site, qr_code, status, operational_status, is_pm, pm_class, pm_frequency_hours, usage_duration, created_at, last_updated')
        .eq('is_pm', true)
        .not('pm_class', 'is', null)
        .order('"Equipment Name"', { ascending: true });

      if (error) throw error;
      
      // Transform database fields to match Equipment interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        custom_equipment_id: item.custom_equipment_id,
        equipment_name: item["Equipment Name"],
        equipment_type: item["Equipment type"],
        model: item.model,
        site: item.site,
        qrCode: item.qr_code,
        status: item.status,
        operational_status: item.operational_status,
        createdAt: item.created_at,
        lastUpdated: item.last_updated,
        is_pm: item.is_pm,
        pm_class: item.pm_class,
        pm_frequency_hours: item.pm_frequency_hours,
        usage_duration: item.usage_duration
      }));
      
      setEnrolledEquipment(transformedData);
    } catch (err) {
      console.error('Error fetching enrolled equipment:', err);
      setError('Failed to load enrolled equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async (id: string): Promise<Equipment | null> => {
    if (!supabase) {
      setError('Supabase client not configured');
      return null;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('id, custom_equipment_id, "Equipment Name", "Equipment type", model, site, qr_code, status, operational_status, is_pm, pm_class, pm_frequency_hours, usage_duration, pm_checklist_items, created_at, last_updated')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching equipment:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }

      if (error) throw error;
      
      // Transform database fields to match Equipment interface
      if (data) {
        return {
          ...data,
          equipment_name: data["Equipment Name"],
          equipment_type: data["Equipment type"],
          qrCode: data.qr_code,
          createdAt: data.created_at,
          lastUpdated: data.last_updated
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError('Equipment not found');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchPMLogs = async (equipmentId: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('preventive_maintenance_logs')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPmLogs(data || []);
    } catch (err) {
      console.error('Error fetching PM logs:', err);
    }
  };

  const handleScan = async (equipmentId: string) => {
    setError(null);
    const eq = await fetchEquipment(equipmentId);
    if (eq) {
      setEquipment(eq);
      await fetchPMLogs(equipmentId);
      setStep('detail');
    }
  };

  const handlePerformPM = () => setStep('checklist');

  const handleChecklistComplete = (data: any) => {
    setChecklist(data);
    // If any part is flagged as missing/damaged, go to part request
    if (data.filters === false || data.belts === false || data.hydraulic === false) {
      setStep('part');
    } else {
      setStep('complete');
    }
  };

  const handlePartRequest = (request: any) => {
    setPartRequest(request);
    setStep('complete');
  };

  const handleLogComplete = async (logData: any) => {
    if (!supabase) {
      setError('Supabase client not configured');
      return;
    }

    try {
      setLoading(true);
      // Save PM log to database
      const { error } = await supabase
        .from('preventive_maintenance_logs')
        .insert({
          equipment_id: equipment?.id,
          maintenance_class: logData.maintenance_class,
          maintenance_type: logData.maintenance_type,
          scheduled_date: logData.scheduled_date,
          performed_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          technician_id: logData.technician_id,
          notes: logData.notes
        });

      if (error) throw error;

      setLog(logData);
      setStep('scan'); // Reset for next PM
      alert('PM completed and logged successfully!');
    } catch (err) {
      console.error('Error saving PM log:', err);
      setError('Failed to save PM log');
    } finally {
      setLoading(false);
    }
  };

  const getRelevantPMConfigs = (equipmentType: string) => {
    return pmConfigs.filter(config => config.equipment_type === equipmentType);
  };

  const getLastPMDate = (equipmentId: string) => {
    const lastPM = pmLogs.find(log => log.equipment_id === equipmentId && log.status === 'completed');
    return lastPM?.performed_date || 'Never';
  };

  const getNextPMDue = (equipment: Equipment) => {
    const configs = getRelevantPMConfigs(equipment.equipment_type);
    if (configs.length === 0) return 'No PM schedule configured';
    
    const lastPM = getLastPMDate(equipment.id);
    if (lastPM === 'Never') return 'Due immediately';
    
    // Simple calculation - in real implementation, you'd use actual usage hours/km
    const lastPMDate = new Date(lastPM);
    const today = new Date();
    const daysSinceLastPM = Math.floor((today.getTime() - lastPMDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const nextPMDays = configs[0]?.interval_days || 30;
    const daysUntilDue = nextPMDays - daysSinceLastPM;
    
    if (daysUntilDue <= 0) return 'Overdue';
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
    return `Due in ${daysUntilDue} days`;
  };

  // Fetch assigned PM logs for the current technician
  useEffect(() => {
    const fetchAssignedPmLogs = async () => {
      if (!supabase) return;
      try {
        setLoading(true);
        
        // First, fetch PM logs
        const { data: pmLogs, error: pmError } = await supabase
          .from('preventive_maintenance_logs')
          .select('*')
          .in('status', ['scheduled', 'assigned', 'in_progress', 'overdue'])
          .order('created_at', { ascending: false });
        
        if (pmError) throw pmError;
        
        // Then, fetch equipment details for each log
        const logsWithEquipment = await Promise.all(
          (pmLogs || []).map(async (log) => {
            if (!supabase) return log;
            
            const { data: equipmentData, error: equipmentError } = await supabase
              .from('equipment')
              .select('id, "Equipment Name", "Equipment type", model, site')
              .eq('id', log.equipment_id)
              .single();
            
            return {
              ...log,
              equipment: equipmentError ? null : {
                id: equipmentData?.id || '',
                "Equipment Name": equipmentData?.["Equipment Name"] || '',
                "Equipment type": equipmentData?.["Equipment type"] || '',
                model: equipmentData?.model || '',
                site: equipmentData?.site || ''
              }
            };
          })
        );
        
        setAssignedPmLogs(logsWithEquipment);
        
        // Separate overdue and missed PMs
        const now = new Date();
        const overdue = logsWithEquipment.filter(log => {
          if (log.status === 'overdue') return true;
          if (log.scheduled_date) {
            const scheduledDate = new Date(log.scheduled_date);
            return scheduledDate < now;
          }
          return false;
        });
        
        const missed = logsWithEquipment.filter(log => {
          if (log.scheduled_date) {
            const scheduledDate = new Date(log.scheduled_date);
            const daysOverdue = Math.floor((now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysOverdue > 30; // PMs overdue by more than 30 days
          }
          return false;
        });
        
        setOverduePmLogs(overdue);
        setMissedPmLogs(missed);
        setNewAssignments(logsWithEquipment.filter(log => log.status === 'scheduled').length);
      } catch (err) {
        console.error('Error fetching assigned PM logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedPmLogs();
  }, []);

  const handleStartPM = async (pmLog: PMLog) => {
    // Fetch equipment details and go directly to checklist
    const eq = await fetchEquipment(pmLog.equipment_id);
    if (eq) {
      setEquipment(eq);
      await fetchPMLogs(pmLog.equipment_id);
      setStep('checklist');
    }
  };

  const handleEscalatePM = async (pmLog: PMLog) => {
    if (!supabase) return;
    
    try {
      // Update PM log status to escalated
      const { error } = await supabase
        .from('preventive_maintenance_logs')
        .update({ 
          status: 'escalated',
          updated_at: new Date().toISOString()
        })
        .eq('id', pmLog.id);

      if (error) throw error;

      // Create notification for supervisor
      await supabase
        .from('notifications')
        .insert({
          user_id: 'supervisor-id', // Replace with actual supervisor ID
          title: 'PM Escalation Required',
          message: `PM task for equipment ${pmLog.equipment_id} has been escalated due to extended delay.`,
          type: 'pm_escalation',
          entity_id: pmLog.id,
          entity_type: 'pm_log',
          created_at: new Date().toISOString()
        });

      // Refresh the logs
      window.location.reload();
    } catch (err) {
      console.error('Error escalating PM:', err);
      setError('Failed to escalate PM task');
    }
  };

  const handleReschedulePM = async (pmLog: PMLog) => {
    if (!supabase) return;
    
    try {
      // Calculate new schedule date (next available slot)
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 1); // Schedule for tomorrow

      const { error } = await supabase
        .from('preventive_maintenance_logs')
        .update({ 
          scheduled_date: newDate.toISOString().split('T')[0],
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', pmLog.id);

      if (error) throw error;

      // Refresh the logs
      window.location.reload();
    } catch (err) {
      console.error('Error rescheduling PM:', err);
      setError('Failed to reschedule PM task');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Preventive Maintenance Dashboard</h1>
        <div className="flex items-center space-x-4">
          <a
            href="/pm/enroll"
            className="bg-blue-100 text-blue-800 px-4 py-2 rounded hover:bg-blue-200 border border-blue-300 transition-colors text-sm font-semibold"
          >
            Enroll Equipment in PM
          </a>
          <a
            href="/pm/schedule-generator"
            className="bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 border border-green-300 transition-colors text-sm font-semibold"
          >
            🔄 Generate Schedules
          </a>
          <a
            href="/pm/task-assignment"
            className="bg-purple-100 text-purple-800 px-4 py-2 rounded hover:bg-purple-200 border border-purple-300 transition-colors text-sm font-semibold"
          >
            👥 Task Assignment
          </a>
          <a
            href="/pm/checklist-execution"
            className="bg-orange-100 text-orange-800 px-4 py-2 rounded hover:bg-orange-200 border border-orange-300 transition-colors text-sm font-semibold"
          >
            ✅ Checklist Execution
          </a>
          <a
            href="/pm/reports"
            className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded hover:bg-indigo-200 border border-indigo-300 transition-colors text-sm font-semibold"
          >
            📊 Reports & Analytics
          </a>
          <a
            href="/pm/history"
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 border border-gray-300 transition-colors text-sm font-semibold"
          >
            📈 PM History
          </a>
          <a
            href="/pm/config"
            className="bg-teal-100 text-teal-800 px-4 py-2 rounded hover:bg-teal-200 border border-teal-300 transition-colors text-sm font-semibold"
          >
            ⚙️ PM Configuration
          </a>
          <div className="relative">
            <span className="text-sm font-medium text-gray-700">My PM Tasks</span>
            {newAssignments > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2 py-0.5 text-xs">{newAssignments}</span>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Missed PMs Section - High Priority */}
      {missedPmLogs.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
            <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
              {missedPmLogs.length}
            </span>
            Critical: Missed PMs (Over 30 Days Overdue)
          </h2>
          <p className="text-red-700 text-sm mb-3">
            These PMs are severely overdue and require immediate attention. Equipment health and compliance are at risk.
          </p>
          <div className="space-y-2">
            {missedPmLogs.map(log => (
              <div key={log.id} className="bg-white p-3 rounded border border-red-300">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-red-800">
                      Equipment: {log.equipment?.["Equipment Name"] || log.equipment_id}
                    </span>
                    <span className="text-sm text-red-600 ml-2">
                      Type: {log.equipment?.["Equipment type"] || 'Unknown'}
                    </span>
                    <span className="text-sm text-red-600 ml-2">Class: {log.maintenance_class}</span>
                    <div className="text-xs text-red-500">
                      Due: {log.scheduled_date ? new Date(log.scheduled_date).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartPM(log)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Start Now
                    </button>
                    <button
                      onClick={() => handleEscalatePM(log)}
                      className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                    >
                      Escalate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue PMs Section */}
      {overduePmLogs.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-orange-800 mb-2 flex items-center">
            <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
              {overduePmLogs.length}
            </span>
            Overdue PMs
          </h2>
          <p className="text-orange-700 text-sm mb-3">
            These PMs are past their scheduled date and should be completed as soon as possible.
          </p>
          <div className="space-y-2">
            {overduePmLogs.map(log => (
              <div key={log.id} className="bg-white p-3 rounded border border-orange-300">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-orange-800">
                      Equipment: {log.equipment?.["Equipment Name"] || log.equipment_id}
                    </span>
                    <span className="text-sm text-orange-600 ml-2">
                      Type: {log.equipment?.["Equipment type"] || 'Unknown'}
                    </span>
                    <span className="text-sm text-orange-600 ml-2">Class: {log.maintenance_class}</span>
                    <div className="text-xs text-orange-500">
                      Due: {log.scheduled_date ? new Date(log.scheduled_date).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartPM(log)}
                      className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                    >
                      Start PM
                    </button>
                    <button
                      onClick={() => handleReschedulePM(log)}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Assigned PM Tasks */}
      {assignedPmLogs.filter(log => !overduePmLogs.includes(log) && !missedPmLogs.includes(log)).length > 0 && (
        <div className="mb-6 bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Assigned PM Tasks</h2>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Equipment</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Maintenance Class</th>
                <th className="text-left p-2">Scheduled Date</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedPmLogs
                .filter(log => !overduePmLogs.includes(log) && !missedPmLogs.includes(log))
                .map(log => (
                <tr key={log.id} className="border-b last:border-b-0">
                  <td className="p-2">{log.equipment?.["Equipment Name"] || log.equipment_id}</td>
                  <td className="p-2">{log.equipment?.["Equipment type"] || 'Unknown'}</td>
                  <td className="p-2">{log.maintenance_class}</td>
                  <td className="p-2">{log.scheduled_date ? new Date(log.scheduled_date).toLocaleString() : '-'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      log.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      log.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleStartPM(log)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Start
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

                  {/* Enrolled Equipment Section */}
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    {enrolledEquipment.length}
                  </span>
                  Enrolled Equipment in PM
                </h2>
                <a
                  href="/pm/enroll"
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Manage Enrollment
                </a>
              </div>
        
        {enrolledEquipment.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledEquipment.map(equipment => (
              <div key={equipment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{equipment.equipment_name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600">{equipment.equipment_type || 'Unknown'}</p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full font-semibold bg-green-100 text-green-800">
                    Enrolled
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">PM Class:</span>
                    <span className="font-medium">{equipment.pm_class || 'Not Set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-medium">{equipment.pm_frequency_hours || 0}h</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Site: {equipment.site}</span>
                    <span>Status: {equipment.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No equipment is currently enrolled in PM.</p>
            <a
              href="/pm/enroll"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Enroll Equipment in PM
            </a>
          </div>
        )}
      </div>

      {/* No assigned tasks message */}
      {assignedPmLogs.length === 0 && (
        <div className="mb-6 bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PM Tasks Assigned</h3>
          <p className="text-gray-600 mb-4">You don't have any preventive maintenance tasks assigned to you.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setStep('scan')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Scan Equipment for PM
            </button>
            <a
              href="/pm/enroll"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Enroll Equipment in PM
            </a>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Existing step-based rendering */}

      {step === 'scan' && (
        <PMQRScanner onScan={handleScan} />
      )}
      
      {step === 'detail' && equipment && (
        <PMEquipmentDetail 
          equipment={equipment} 
          onPerformPM={handlePerformPM} 
        />
      )}
      
      {step === 'checklist' && equipment && (
        <PMChecklistForm 
          equipment={equipment} 
          onComplete={handleChecklistComplete} 
        />
      )}
      
      {step === 'part' && equipment && (
        <PMPartRequestForm 
          equipment={equipment} 
          onSubmit={handlePartRequest} 
        />
      )}
      
      {step === 'complete' && equipment && checklist && (
        <PMLogCompletion 
          equipment={equipment} 
          checklist={checklist} 
          onComplete={handleLogComplete} 
        />
      )}

      {/* Show summary/log after completion */}
      {log && (
        <div className="p-4 bg-green-50 rounded mt-4">
          <h3 className="font-semibold text-green-800 mb-2">Last PM Log</h3>
          <pre className="text-xs text-green-900 bg-green-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(log, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PMDashboard; 