import React, { useState, useEffect } from 'react';
import { 
  Download, 
  BarChart3, 
  Activity, 
  Users, 
  Package, 
  Wrench 
} from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { formatDuration, calculateWorkingHours } from '../../utils/timeUtils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Employee, Equipment, Material } from '../../types';

interface ReportsPanelProps {
  employeeLogs: any[];
  equipmentLogs: any[];
  materialLogs: any[];
  timeLogs: any[];
  employees: Employee[];
  equipment: Equipment[];
  materials: Material[];
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({
  employeeLogs,
  equipmentLogs,
  materialLogs,
  timeLogs,
  employees,
  equipment,
  materials
}) => {
  // Combine all logs into a unified format for filtering
  const allLogs = [
    ...employeeLogs.map(log => ({
      id: log.id,
      entityId: log.employeeId,
      entityType: 'employee' as const,
      action: log.action,
      timestamp: log.timestamp,
      site: log.site,
      notes: log.notes,
      location: log.location,
      quantity: undefined as number | undefined
    })),
    ...equipmentLogs.map(log => ({
      id: log.id,
      entityId: log.equipmentId,
      entityType: 'equipment' as const,
      action: log.action,
      timestamp: log.timestamp,
      site: log.site,
      notes: log.notes,
      location: log.location,
      quantity: undefined as number | undefined
    })),
    ...materialLogs.map(log => ({
      id: log.id,
      entityId: log.materialId,
      entityType: 'material' as const,
      action: log.action,
      timestamp: log.timestamp,
      site: log.site,
      notes: log.notes,
      location: log.location,
      quantity: log.quantity
    })),
    ...timeLogs // Include legacy logs for backward compatibility
  ];
  
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [entityType, setEntityType] = useState<'employee' | 'equipment' | 'material' | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEntity, setSelectedEntity] = useState<string>('all');

  // Debug logging for props
  useEffect(() => {
    console.log('ReportsPanel props:', {
      employeeLogs: employeeLogs.length,
      equipmentLogs: equipmentLogs.length,
      materialLogs: materialLogs.length,
      timeLogs: timeLogs.length,
      employees: employees.length,
      equipment: equipment.length,
      materials: materials.length
    });
  }, [employeeLogs, equipmentLogs, materialLogs, timeLogs, employees, equipment, materials]);

  const getDateRange = () => {
    const date = new Date(selectedDate);
    switch (reportType) {
      case 'weekly':
        return {
          start: startOfWeek(date, { weekStartsOn: 6 }), // Saturday start (KSA)
          end: endOfWeek(date, { weekStartsOn: 6 })
        };
      case 'monthly':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        };
      default:
        return {
          start: date,
          end: date
        };
    }
  };

  const filterLogs = () => {
    const { start, end } = getDateRange();
    
    return allLogs.filter(log => {
      const logDate = parseISO(String(log.timestamp));
      const isInDateRange = isWithinInterval(logDate, { start, end });
      const matchesEntityType = entityType === 'all' || log.entityType === entityType;
      const matchesEntity = selectedEntity === 'all' || log.entityId === selectedEntity;
      
      return isInDateRange && matchesEntityType && matchesEntity;
    });
  };

  const calculateEmployeeHours = () => {
    const filteredLogs = filterLogs().filter(log => log.entityType === 'employee');
    const employeeHours: Record<string, { regular: number; overtime: number; total: number; shifts: number }> = {};

    // Group logs by employee and date
    const employeeShifts: Record<string, Record<string, { clockIn?: string; clockOut?: string }>> = {};

    filteredLogs.forEach(log => {
      if (log.action === 'clock-in' || log.action === 'clock-out') {
        const date = format(parseISO(log.timestamp), 'yyyy-MM-dd');
        if (!employeeShifts[log.entityId]) {
          employeeShifts[log.entityId] = {};
        }
        if (!employeeShifts[log.entityId][date]) {
          employeeShifts[log.entityId][date] = {};
        }
        
        if (log.action === 'clock-in') {
          employeeShifts[log.entityId][date].clockIn = log.timestamp;
        } else {
          employeeShifts[log.entityId][date].clockOut = log.timestamp;
        }
      }
    });

    // Calculate hours for each employee
    Object.entries(employeeShifts).forEach(([employeeId, shifts]) => {
      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      let shiftCount = 0;

      Object.values(shifts).forEach(shift => {
        if (shift.clockIn && shift.clockOut) {
          const hours = calculateWorkingHours(shift.clockIn, shift.clockOut);
          totalHours += hours;
          regularHours += Math.min(hours, 8);
          overtimeHours += Math.max(hours - 8, 0);
          shiftCount++;
        }
      });

      employeeHours[employeeId] = {
        regular: regularHours,
        overtime: overtimeHours,
        total: totalHours,
        shifts: shiftCount
      };
    });

    return employeeHours;
  };

  const calculateEquipmentUsage = () => {
    const filteredLogs = filterLogs().filter(log => log.entityType === 'equipment');
    const equipmentUsage: Record<string, { totalHours: number; sessions: number }> = {};

    // Group logs by equipment and calculate usage
    const equipmentSessions: Record<string, { start?: string; end?: string }[]> = {};

    filteredLogs.forEach(log => {
      if (log.action === 'start-use' || log.action === 'stop-use') {
        if (!equipmentSessions[log.entityId]) {
          equipmentSessions[log.entityId] = [{}];
        }
        
        const currentSession = equipmentSessions[log.entityId][equipmentSessions[log.entityId].length - 1];
        
        if (log.action === 'start-use') {
          if (currentSession.start && !currentSession.end) {
            // Start new session if previous one wasn't closed
            equipmentSessions[log.entityId].push({ start: log.timestamp });
          } else {
            currentSession.start = log.timestamp;
          }
        } else if (log.action === 'stop-use' && currentSession.start) {
          currentSession.end = log.timestamp;
          equipmentSessions[log.entityId].push({}); // Prepare for next session
        }
      }
    });

    // Calculate total usage hours
    Object.entries(equipmentSessions).forEach(([equipmentId, sessions]) => {
      let totalHours = 0;
      let sessionCount = 0;

      sessions.forEach(session => {
        if (session.start && session.end) {
          totalHours += calculateWorkingHours(session.start, session.end);
          sessionCount++;
        }
      });

      equipmentUsage[equipmentId] = {
        totalHours,
        sessions: sessionCount
      };
    });

    return equipmentUsage;
  };

  const calculateMaterialMovement = () => {
    const filteredLogs = filterLogs().filter(log => log.entityType === 'material');
    const materialMovement: Record<string, { received: number; issued: number; net: number }> = {};

    filteredLogs.forEach(log => {
      if (!materialMovement[log.entityId]) {
        materialMovement[log.entityId] = { received: 0, issued: 0, net: 0 };
      }

      const quantity = log.quantity || 0;
      if (log.action === 'material-in') {
        materialMovement[log.entityId].received += quantity;
      } else if (log.action === 'material-out') {
        materialMovement[log.entityId].issued += quantity;
      }
    });

    // Calculate net movement
    Object.values(materialMovement).forEach(movement => {
      movement.net = movement.received - movement.issued;
    });

    return materialMovement;
  };

  const employeeHours = calculateEmployeeHours();
  const equipmentUsage = calculateEquipmentUsage();
  const materialMovement = calculateMaterialMovement();

  const getEntityOptions = () => {
    switch (entityType) {
      case 'employee':
        return employees.map(emp => ({ id: emp.id, name: emp.name }));
      case 'equipment':
        return equipment.map(eq => ({ id: eq.id, name: eq.name }));
      case 'material':
        return materials.map(mat => ({ id: mat.id, name: mat.name }));
      default:
        return [];
    }
  };

  const exportReport = () => {
    const data = {
      reportType,
      entityType,
      dateRange: getDateRange(),
      employeeHours,
      equipmentUsage,
      materialMovement,
      logs: filterLogs()
    };

    // Use the downloadReportAsCSV method directly to avoid localStorage dependency
    DataStorage.downloadReportAsCSV(data, `${reportType}-${entityType}-report-${selectedDate}.csv`);
  };

  const downloadLogs = () => {
    const allLogsForExport = [
      ...employeeLogs.map(log => ({
        'Log ID': log.id,
        'Employee ID': log.employee_id || log.employeeId,
        'Employee Name': log.employee_name,
        'Department': log.department,
        'Entity Type': 'employee',
        'Action': log.action,
        'Timestamp': new Date(log.timestamp).toLocaleString(),
        'Site': log.site,
        'Notes': log.notes || '',
        'Location': log.location || ''
      })),
      ...equipmentLogs.map(log => ({
        'Log ID': log.id,
        'Equipment ID': log.equipment_id || log.equipmentId,
        'Equipment Name': log.equipment_name,
        'Equipment Type': log.equipment_type,
        'Entity Type': 'equipment',
        'Action': log.action,
        'Timestamp': new Date(log.timestamp).toLocaleString(),
        'Site': log.site,
        'Status': log.status || '',
        'Notes': log.notes || ''
      })),
      ...materialLogs.map(log => ({
        'Log ID': log.id,
        'Material ID': log.material_id || log.materialId,
        'Material Name': log.material_name,
        'Material Type': log.material_type,
        'Entity Type': 'material',
        'Action': log.action,
        'Timestamp': new Date(log.timestamp).toLocaleString(),
        'Site': log.site,
        'Quantity': log.quantity || '',
        'Status': log.status || '',
        'Notes': log.notes || ''
      }))
    ];
    
    DataStorage.downloadCSV(allLogsForExport, 'Logs.csv');
  };
  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Period</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value as any);
                setSelectedEntity('all');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="employee">Employees</option>
              <option value="equipment">Equipment</option>
              <option value="material">Materials</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {reportType === 'daily' ? 'Date' : reportType === 'weekly' ? 'Week of' : 'Month of'}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specific Entity</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={entityType === 'all'}
            >
              <option value="all">All {entityType}s</option>
              {getEntityOptions().map(entity => (
                <option key={entity.id} value={entity.id}>{entity.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <div className="flex space-x-3">
            <button
              onClick={downloadLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Logs.csv</span>
            </button>
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          </div>
        </div>
      </div>

      {/* Employee Hours Report */}
      {(entityType === 'all' || entityType === 'employee') && Object.keys(employeeHours).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Employee Hours Summary</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Shifts</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Regular Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Overtime Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(employeeHours).map(([employeeId, hours]) => {
                  const employee = employees.find(emp => emp.id === employeeId);
                  return (
                    <tr key={employeeId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{employee?.name || employeeId}</div>
                          <div className="text-gray-500">{employee?.department}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{hours.shifts}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDuration(hours.regular * 60)}</td>
                      <td className="py-3 px-4">
                        <span className={hours.overtime > 0 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                          {formatDuration(hours.overtime * 60)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{formatDuration(hours.total * 60)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Equipment Usage Report */}
      {(entityType === 'all' || entityType === 'equipment') && Object.keys(equipmentUsage).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Wrench className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Equipment Usage Summary</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Equipment</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Sessions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Usage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Avg per Session</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(equipmentUsage).map(([equipmentId, usage]) => {
                  const eq = equipment.find(e => e.id === equipmentId);
                  const avgHours = usage.sessions > 0 ? usage.totalHours / usage.sessions : 0;
                  return (
                    <tr key={equipmentId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{eq?.name || equipmentId}</div>
                          <div className="text-gray-500">{eq?.type}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{usage.sessions}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{formatDuration(usage.totalHours * 60)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDuration(avgHours * 60)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Material Movement Report */}
      {(entityType === 'all' || entityType === 'material') && Object.keys(materialMovement).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Material Movement Summary</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Material</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Received</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Issued</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Net Movement</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(materialMovement).map(([materialId, movement]) => {
                  const material = materials.find(m => m.id === materialId);
                  return (
                    <tr key={materialId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{material?.name || materialId}</div>
                          <div className="text-gray-500">{material?.type}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-green-600">+{movement.received} {material?.unit}</td>
                      <td className="py-3 px-4 text-red-600">-{movement.issued} {material?.unit}</td>
                      <td className="py-3 px-4">
                        <span className={movement.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {movement.net >= 0 ? '+' : ''}{movement.net} {material?.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{material?.quantity} {material?.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filterLogs().length === 0 ? (
            <p className="text-gray-500 text-center py-8">No activities found for the selected criteria.</p>
          ) : (
            filterLogs().map(log => {
              const entity = 
                log.entityType === 'employee' ? employees.find(e => e.id === log.entityId) :
                log.entityType === 'equipment' ? equipment.find(e => e.id === log.entityId) :
                log.entityType === 'material' ? materials.find(m => m.id === log.entityId) :
                null;
              const entityName =
                entity?.name ||
                log.employeeName || log.employee_name ||
                log.equipmentName || log.equipment_name ||
                log.materialName || log.material_name ||
                log.entityId;
              return (
                <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    log.action.includes('in') || log.action.includes('start') || log.action.includes('received') ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {log.action.replace('-', ' ').toUpperCase()} • {entityName}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{format(parseISO(String(log.timestamp)), 'MMM dd, yyyy HH:mm')}</span>
                      <span>{log.site}</span>
                      {log.quantity && <span>Qty: {log.quantity}</span>}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-gray-600 mt-1">{log.notes}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;