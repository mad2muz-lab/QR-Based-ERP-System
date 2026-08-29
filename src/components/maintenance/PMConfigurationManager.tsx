import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Wrench,
  Clock,
  Package,
  CheckSquare,
  AlertTriangle,
  Settings,
  RefreshCw,
  FileText
} from 'lucide-react';

interface PMConfig {
  id?: string;
  equipment_type: string;
  class_a_hours: number;
  class_b_hours: number;
  class_c_hours: number;
  class_a_threshold_hours: number;
  class_b_threshold_hours: number;
  class_c_threshold_hours: number;
  interval_days: number;
  interval_hours: number;
  interval_km: number;
  description: string;
  is_active: boolean;
  checklist_items: string[];
  spare_parts: string[];
  estimated_quantities: string[];
  created_at?: string;
  updated_at?: string;
}

interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  required: boolean;
}

interface SparePart {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

const PMConfigurationManager: React.FC = () => {
  const [configs, setConfigs] = useState<PMConfig[]>([]);
  const [pmLogs, setPmLogs] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<PMConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [activeTab, setActiveTab] = useState<'configurations' | 'pm-due' | 'pm-history'>('configurations');
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPMConfigs(),
        loadPMLogs(),
        loadEquipment()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPMConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('preventive_maintenance_configs')
        .select('*')
        .order('equipment_type');

      if (error) throw error;
      setConfigs(data || []);
    } catch (err) {
      console.error('Error loading PM configs:', err);
      setError('Failed to load PM configurations');
    }
  };

  const loadPMLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('preventive_maintenance_logs')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setPmLogs(data || []);
    } catch (err) {
      console.error('Error loading PM logs:', err);
      setError('Failed to load PM logs');
    }
  };

  const loadEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('"Equipment Name"');

      if (error) throw error;
      setEquipment(data || []);
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError('Failed to load equipment');
    }
  };

  const handleCreateNew = () => {
    setEditingConfig({
      equipment_type: '',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: '',
      is_active: true,
      checklist_items: [],
      spare_parts: [],
      estimated_quantities: []
    });
    setChecklistItems([]);
    setSpareParts([]);
    setIsModalOpen(true);
  };

  const handleEdit = (config: PMConfig) => {
    setEditingConfig({ ...config });
    // Parse checklist items and spare parts
    setChecklistItems(config.checklist_items.map((item, index) => ({
      id: `item-${index}`,
      task: item,
      category: 'General',
      required: true
    })));
    setSpareParts(config.spare_parts.map((part, index) => ({
      id: `part-${index}`,
      name: part,
      quantity: config.estimated_quantities[index] || '1',
      unit: 'pcs'
    })));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PM configuration?')) return;
    
    try {
      const { error } = await supabase
        .from('preventive_maintenance_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPMConfigs();
    } catch (err) {
      console.error('Error deleting PM config:', err);
      setError('Failed to delete PM configuration');
    }
  };

  const handleSave = async () => {
    if (!editingConfig) return;

    try {
      const configData = {
        ...editingConfig,
        checklist_items: checklistItems.map(item => item.task),
        spare_parts: spareParts.map(part => part.name),
        estimated_quantities: spareParts.map(part => part.quantity),
        updated_at: new Date().toISOString()
      };

      if (editingConfig.id) {
        // Update existing
        const { error } = await supabase
          .from('preventive_maintenance_configs')
          .update(configData)
          .eq('id', editingConfig.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('preventive_maintenance_configs')
          .insert([{
            ...configData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingConfig(null);
      await loadPMConfigs();
    } catch (err) {
      console.error('Error saving PM config:', err);
      setError('Failed to save PM configuration');
    }
  };

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, {
      id: `item-${Date.now()}`,
      task: '',
      category: 'General',
      required: true
    }]);
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: any) => {
    setChecklistItems(checklistItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addSparePart = () => {
    setSpareParts([...spareParts, {
      id: `part-${Date.now()}`,
      name: '',
      quantity: '1',
      unit: 'pcs'
    }]);
  };

  const removeSparePart = (id: string) => {
    setSpareParts(spareParts.filter(part => part.id !== id));
  };

  const updateSparePart = (id: string, field: keyof SparePart, value: string) => {
    setSpareParts(spareParts.map(part =>
      part.id === id ? { ...part, [field]: value } : part
    ));
  };

  // Helper functions for PM due calculations
  const getDateRange = (filter: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    const start = new Date(now);
    
    switch (filter) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    
    return { start, end: now };
  };

  const calculatePMDue = () => {
    const { start, end } = getDateRange(dateFilter);
    const pmDue: any[] = [];

    // For each equipment, calculate when PM is due based on configs
    equipment.forEach(eq => {
      const config = configs.find(c => c.equipment_type === eq.type);
      if (!config) return;

      // Get last PM for this equipment
      const lastPM = pmLogs
        .filter(log => log.equipment_id === eq.id)
        .sort((a, b) => new Date(b.completed_date || b.scheduled_date).getTime() - new Date(a.completed_date || a.scheduled_date).getTime())[0];

      if (lastPM) {
        const lastPMDate = new Date(lastPM.completed_date || lastPM.scheduled_date);
        const maintenanceClass = lastPM.maintenance_class || 'A';
        
        // Calculate next PM date based on class
        let nextPMDate: Date;
        switch (maintenanceClass) {
          case 'A':
            nextPMDate = new Date(lastPMDate.getTime() + (config.class_a_hours * 60 * 60 * 1000));
            break;
          case 'B':
            nextPMDate = new Date(lastPMDate.getTime() + (config.class_b_hours * 60 * 60 * 1000));
            break;
          case 'C':
            nextPMDate = new Date(lastPMDate.getTime() + (config.class_c_hours * 60 * 60 * 1000));
            break;
          default:
            nextPMDate = new Date(lastPMDate.getTime() + (config.class_a_hours * 60 * 60 * 1000));
        }

        // Check if PM is due in the selected date range
        if (nextPMDate >= start && nextPMDate <= end) {
          pmDue.push({
            equipment_id: eq.id,
            equipment_name: eq.name,
            equipment_type: eq.type,
            last_pm_date: lastPMDate,
            next_pm_date: nextPMDate,
            maintenance_class: maintenanceClass,
            status: nextPMDate <= new Date() ? 'Overdue' : 'Due Soon',
            config: config
          });
        }
      } else {
        // No previous PM, check if initial PM is due
        const initialPMDate = new Date(eq.created_at || new Date());
        if (initialPMDate >= start && initialPMDate <= end) {
          pmDue.push({
            equipment_id: eq.id,
            equipment_name: eq.name,
            equipment_type: eq.type,
            last_pm_date: null,
            next_pm_date: initialPMDate,
            maintenance_class: 'A',
            status: 'Initial PM Due',
            config: config
          });
        }
      }
    });

    return pmDue.sort((a, b) => new Date(a.next_pm_date).getTime() - new Date(b.next_pm_date).getTime());
  };

  const getPMDueByClass = () => {
    const pmDue = calculatePMDue();
    const byClass = {
      'A': pmDue.filter(pm => pm.maintenance_class === 'A'),
      'B': pmDue.filter(pm => pm.maintenance_class === 'B'),
      'C': pmDue.filter(pm => pm.maintenance_class === 'C')
    };
    return byClass;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">PM Configuration Management</h2>
            <p className="text-gray-600">Manage preventive maintenance configurations and schedules</p>
          </div>
          {activeTab === 'configurations' && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Configuration</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('configurations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'configurations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              PM Configurations
            </button>
            <button
              onClick={() => setActiveTab('pm-due')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pm-due'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              PM Due
            </button>
            <button
              onClick={() => setActiveTab('pm-history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pm-history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              PM History
            </button>
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'configurations' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment PM Configurations</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class A (Hours)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class B (Hours)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class C (Hours)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {configs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{config.equipment_type}</div>
                          <div className="text-sm text-gray-500">{config.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.class_a_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.class_b_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.class_c_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          config.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => config.id && handleDelete(config.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PM Due Tab */}
      {activeTab === 'pm-due' && (
        <div className="space-y-6">
          {/* Date Filter */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">PM Due Schedule</h3>
              <div className="flex space-x-2">
                {(['day', 'week', 'month', 'year'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      dateFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PM Due by Class */}
          {(() => {
            const pmDueByClass = getPMDueByClass();
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {(['A', 'B', 'C'] as const).map((pmClass) => (
                  <div key={pmClass} className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Class {pmClass} Maintenance Due
                      </h4>
                      <div className="space-y-3">
                        {pmDueByClass[pmClass].length === 0 ? (
                          <p className="text-gray-500 text-sm">No Class {pmClass} maintenance due</p>
                        ) : (
                          pmDueByClass[pmClass].map((pm, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-medium text-sm text-gray-900">
                                  {pm.equipment_name}
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  pm.status === 'Overdue' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {pm.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>Type: {pm.equipment_type}</div>
                                <div>Due: {pm.next_pm_date.toLocaleDateString()}</div>
                                {pm.last_pm_date && (
                                  <div>Last PM: {pm.last_pm_date.toLocaleDateString()}</div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* PM History Tab */}
      {activeTab === 'pm-history' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">PM History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maintenance Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pmLogs.map((log) => {
                    const equipmentItem = equipment.find(eq => eq.id === log.equipment_id);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {equipmentItem?.["Equipment Name"] || 'Unknown Equipment'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {equipmentItem?.["Equipment Type"] || 'Unknown Type'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Class {log.maintenance_class || 'A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.status === 'completed' ? 'bg-green-100 text-green-800' :
                            log.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            log.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.status || 'scheduled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.scheduled_date ? new Date(log.scheduled_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.performed_date ? new Date(log.performed_date).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {isModalOpen && editingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingConfig.id ? 'Edit' : 'Create'} PM Configuration
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Type *
                  </label>
                  <input
                    type="text"
                    value={editingConfig.equipment_type}
                    onChange={(e) => setEditingConfig({...editingConfig, equipment_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Excavator, Bulldozer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editingConfig.description}
                    onChange={(e) => setEditingConfig({...editingConfig, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description"
                  />
                </div>
              </div>

              {/* Maintenance Intervals */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Intervals (Hours)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class A</label>
                    <input
                      type="number"
                      value={editingConfig.class_a_hours}
                      onChange={(e) => setEditingConfig({...editingConfig, class_a_hours: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class B</label>
                    <input
                      type="number"
                      value={editingConfig.class_b_hours}
                      onChange={(e) => setEditingConfig({...editingConfig, class_b_hours: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class C</label>
                    <input
                      type="number"
                      value={editingConfig.class_c_hours}
                      onChange={(e) => setEditingConfig({...editingConfig, class_c_hours: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Threshold Hours */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Threshold Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class A Threshold</label>
                    <input
                      type="number"
                      value={editingConfig.class_a_threshold_hours}
                      onChange={(e) => setEditingConfig({...editingConfig, class_a_threshold_hours: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class B Threshold</label>
                    <input
                      type="number"
                      value={editingConfig.class_b_threshold_hours}
                      onChange={(e) => setEditingConfig({...editingConfig, class_b_threshold_hours: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class C Threshold</label>
                    <input
                      type="number"
                      value={editingConfig.class_c_threshold_hours}
                      onChange={(e) => setEditingConfig({...editingConfig, class_c_threshold_hours: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Checklist Items</h3>
                  <button
                    onClick={addChecklistItem}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {checklistItems.map((item, index) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                      <input
                        type="text"
                        value={item.task}
                        onChange={(e) => updateChecklistItem(item.id, 'task', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter checklist task"
                      />
                      <button
                        onClick={() => removeChecklistItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spare Parts */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Spare Parts</h3>
                  <button
                    onClick={addSparePart}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Part</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {spareParts.map((part) => (
                    <div key={part.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                      <input
                        type="text"
                        value={part.name}
                        onChange={(e) => updateSparePart(part.id, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Part name"
                      />
                      <input
                        type="text"
                        value={part.quantity}
                        onChange={(e) => updateSparePart(part.id, 'quantity', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Qty"
                      />
                      <input
                        type="text"
                        value={part.unit}
                        onChange={(e) => updateSparePart(part.id, 'unit', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Unit"
                      />
                      <button
                        onClick={() => removeSparePart(part.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingConfig.is_active}
                    onChange={(e) => setEditingConfig({...editingConfig, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Configuration</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMConfigurationManager;
