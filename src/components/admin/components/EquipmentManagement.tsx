import React, { useEffect, useState } from 'react';
import { Wrench, Download, Plus, Edit, Trash2 } from 'lucide-react';
import EquipmentForm from '../../registration/forms/EquipmentForm';
import { fetchData } from '../../../utils/dataProxy';
import { supabase } from '../../../utils/supabaseClient';
import { SupabaseDataService } from '../../../utils/supabaseDataService';
import { exportToCSV } from '../../../utils/csvUtils';

const EquipmentManagement: React.FC = () => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editEquipment, setEditEquipment] = useState<any | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [usageMap, setUsageMap] = useState<Record<string, { totalMinutes: number; totalRevenue: number }>>({});

  useEffect(() => {
    const loadEquipment = async () => {
      const eq = await fetchData('equipment');
      setEquipment(eq);
    };
    loadEquipment();
  }, [refresh]);

  useEffect(() => {
    const loadSites = async () => {
      const s = await fetchData('sites');
      setSites(s);
    };
    loadSites();
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
      const logs = await SupabaseDataService.getEquipmentLogs();
      const map: Record<string, { totalMinutes: number; totalRevenue: number }> = {};
      equipment.forEach(eq => {
        const eqLogs = logs.filter((log: any) => (log.equipment_id || log.equipmentId) === eq.id);
        const totalMinutes = eqLogs.reduce((sum: number, log: any) => sum + (log.usage_duration || log.usageDuration || 0), 0);
        const hourlyRate = eq.hourly_rate || 0;
        const totalRevenue = ((totalMinutes / 60) * hourlyRate);
        map[eq.id] = { totalMinutes, totalRevenue };
      });
      setUsageMap(map);
    };
    if (equipment.length > 0) fetchUsage();
  }, [equipment]);

  const handleAdd = () => {
    setEditEquipment(null);
    setShowForm(true);
  };

  const handleEdit = (eq: any) => {
    setEditEquipment(eq);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    await supabase.from('equipment').delete().eq('id', id);
    setRefresh(r => r + 1);
  };

  const handleFormSubmit = async (data: any, isEdit?: boolean) => {
    if (isEdit && editEquipment) {
      // Update
      await supabase.from('equipment').update(data).eq('id', editEquipment.id);
    } else {
      // Create
      await supabase.from('equipment').insert([{ ...data, createdAt: new Date().toISOString() }]);
    }
    setShowForm(false);
    setEditEquipment(null);
    setRefresh(r => r + 1);
  };

  const handleExport = () => {
    const rows = equipment.map(eq => ({
      'Custom ID': eq.custom_equipment_id,
      'Name': eq.name,
      'Type': eq.type,
      'Model': eq.model,
      'Site': eq.site,
      'Status': eq.status,
      'Hourly Rate': eq.hourly_rate,
      'Total Usage (hrs)': usageMap[eq.id]?.totalMinutes ? (usageMap[eq.id].totalMinutes / 60).toFixed(2) : '0.00',
      'Total Revenue': usageMap[eq.id]?.totalRevenue ? usageMap[eq.id].totalRevenue.toFixed(2) : '0.00',
    }));
    exportToCSV(rows, 'equipment-analytics.csv');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <Wrench className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Equipment Management</h2>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Custom ID</th>
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Name</th>
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Type</th>
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Model</th>
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Site</th>
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Status</th>
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Hourly Rate</th>
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Total Usage (hrs)</th>
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Total Revenue</th>
              <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((eq) => (
              <tr key={eq.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900 font-mono">
                  {eq.custom_equipment_id}
                </td>
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                  {eq.name}
                </td>
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                  {eq.type}
                </td>
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                  {eq.model || '-'}
                </td>
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                  {eq.site}
                </td>
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    eq.status === 'available' ? 'bg-green-100 text-green-800' :
                    eq.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                    eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {eq.status}
                  </span>
                </td>
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                  {typeof eq.hourly_rate === 'number' ? `SAR ${eq.hourly_rate.toFixed(2)}` : '-'}
                </td>
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                  {usageMap[eq.id]?.totalMinutes ? (usageMap[eq.id].totalMinutes / 60).toFixed(2) : '0.00'}
                </td>
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                  {usageMap[eq.id]?.totalRevenue ? `SAR ${usageMap[eq.id].totalRevenue.toFixed(2)}` : 'SAR 0.00'}
                </td>
                <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(eq)}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                      title="Edit Equipment"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eq.id)}
                      className="text-red-600 hover:text-red-800 transition-colors p-1"
                      title="Delete Equipment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {equipment.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No equipment found. Click "Add Equipment" to create your first equipment entry.
          </div>
        )}
      </div>
      {/* Add/Edit Equipment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <EquipmentForm
              sites={sites}
              initialData={editEquipment}
              onSubmit={handleFormSubmit}
              onClose={() => { setShowForm(false); setEditEquipment(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;