import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Wrench,
  HardHat,
  RefreshCw,
  Database
} from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { OfflineDataManager } from '../../utils/offlineDataManager';
import { equipmentCategories } from '../../data/materialTypes';

interface PreventiveMaintenanceConfig {
  id?: string;
  equipment_type: string;
  class_a_hours: number;
  class_b_hours: number;
  class_c_hours: number;
  class_a_threshold_hours: number;
  class_b_threshold_hours: number;
  class_c_threshold_hours: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const PreventiveMaintenanceConfig: React.FC = () => {
  const [configs, setConfigs] = useState<PreventiveMaintenanceConfig[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [editingConfig, setEditingConfig] = useState<PreventiveMaintenanceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Default configurations based on the matrix provided
  const defaultConfigs: Record<string, PreventiveMaintenanceConfig> = {
    // Group 1: Heavy Machinery, Lifting Equipment
    'Excavator': {
      equipment_type: 'Excavator',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      is_active: true
    },
    'Bulldozer': {
      equipment_type: 'Bulldozer',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      is_active: true
    },
    'Motor Grader': {
      equipment_type: 'Motor Grader',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      is_active: true
    },
    'Wheel Loader': {
      equipment_type: 'Wheel Loader',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      is_active: true
    },
    'Tower Crane': {
      equipment_type: 'Tower Crane',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      is_active: true
    },
    'Mobile Crane': {
      equipment_type: 'Mobile Crane',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      is_active: true
    },
    'Forklift': {
      equipment_type: 'Forklift',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      is_active: true
    },
    // Group 2: Transport Vehicles, Cars
    'Dump Truck': {
      equipment_type: 'Dump Truck',
      class_a_hours: 50,
      class_b_hours: 200,
      class_c_hours: 1000,
      class_a_threshold_hours: 40,
      class_b_threshold_hours: 160,
      class_c_threshold_hours: 800,
      is_active: true
    },
    'Concrete Mixer Truck': {
      equipment_type: 'Concrete Mixer Truck',
      class_a_hours: 50,
      class_b_hours: 200,
      class_c_hours: 1000,
      class_a_threshold_hours: 40,
      class_b_threshold_hours: 160,
      class_c_threshold_hours: 800,
      is_active: true
    },
    'Pickup Truck': {
      equipment_type: 'Pickup Truck',
      class_a_hours: 50,
      class_b_hours: 200,
      class_c_hours: 1000,
      class_a_threshold_hours: 40,
      class_b_threshold_hours: 160,
      class_c_threshold_hours: 800,
      is_active: true
    },
    'Car': {
      equipment_type: 'Car',
      class_a_hours: 50,
      class_b_hours: 200,
      class_c_hours: 1000,
      class_a_threshold_hours: 40,
      class_b_threshold_hours: 160,
      class_c_threshold_hours: 800,
      is_active: true
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setSyncStatus('syncing');
      setError('');
      
      // Get all available equipment types from predefined categories
      const allEquipmentTypes: string[] = [];
      Object.values(equipmentCategories).forEach(category => {
        allEquipmentTypes.push(...category.items);
      });
      
      // Load equipment types from existing equipment data (including custom types)
      const equipment = DataStorage.loadEquipment();
      const existingTypes = [...new Set(equipment.map(eq => eq.type))];
      
      // Combine predefined types with existing custom types
      const allTypes = [...new Set([...allEquipmentTypes, ...existingTypes])].sort();
      setEquipmentTypes(allTypes);

      // Load existing PM configurations from database (with fallback to local)
      const existingConfigs = await OfflineDataManager.getAllPreventiveMaintenanceConfigs();
      setConfigs(existingConfigs);
      setLastSyncTime(new Date().toLocaleTimeString());
      setSyncStatus('synced');

      // If no configs exist, initialize with defaults for existing equipment types
      if (existingConfigs.length === 0) {
        console.log('No configurations found, initializing with defaults...');
        const initialConfigs: PreventiveMaintenanceConfig[] = [];
        allTypes.forEach(type => {
          if (defaultConfigs[type]) {
            initialConfigs.push(defaultConfigs[type]);
          } else {
            // Generic default for unknown types
            initialConfigs.push({
              equipment_type: type,
              class_a_hours: 40,
              class_b_hours: 480,
              class_c_hours: 1920,
              class_a_threshold_hours: 32,
              class_b_threshold_hours: 384,
              class_c_threshold_hours: 1536,
              is_active: true
            });
          }
        });
        
        // Save initial configs
        for (const config of initialConfigs) {
          await OfflineDataManager.createPreventiveMaintenanceConfig(config);
        }
        setConfigs(initialConfigs);
      }
    } catch (error) {
      console.error('Error loading PM configurations:', error);
      setError('Failed to load configurations');
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateThresholds = (config: Partial<PreventiveMaintenanceConfig>) => {
    return {
      class_a_threshold_hours: Math.floor(config.class_a_hours! * 0.8),
      class_b_threshold_hours: Math.floor(config.class_b_hours! * 0.8),
      class_c_threshold_hours: Math.floor(config.class_c_hours! * 0.8)
    };
  };

  const handleSave = async (config: PreventiveMaintenanceConfig) => {
    try {
      setIsLoading(true);
      setError('');
      
      const thresholds = calculateThresholds(config);
      const configToSave = {
        ...config,
        ...thresholds,
        updated_at: new Date().toISOString()
      };

      if (config.id) {
        // Update existing
        await OfflineDataManager.updatePreventiveMaintenanceConfig(config.id, configToSave);
        setConfigs(prev => prev.map(c => c.id === config.id ? configToSave : c));
      } else {
        // Check if configuration already exists for this equipment type
        const existingConfig = configs.find(c => c.equipment_type === config.equipment_type);
        if (existingConfig) {
          setError(`Configuration for "${config.equipment_type}" already exists. Please edit the existing configuration instead.`);
          return;
        }

        // Create new
        const newConfig = {
          ...configToSave,
          id: `pm-config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString()
        };
        await OfflineDataManager.createPreventiveMaintenanceConfig(newConfig);
        setConfigs(prev => [...prev, newConfig]);
      }

      setEditingConfig(null);
      setSuccess('Configuration saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh data to ensure we have the latest from database
      await loadData();
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      setIsLoading(true);
      await OfflineDataManager.deletePreventiveMaintenanceConfig(configId);
      setConfigs(prev => prev.filter(c => c.id !== configId));
      setSuccess('Configuration deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh data to ensure we have the latest from database
      await loadData();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setError('Failed to delete configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const getMaintenanceClassColor = (classType: string) => {
    switch (classType) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'C': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAllEquipmentTypes = () => {
    const allTypes: string[] = [];
    
    // Add predefined types from categories
    Object.values(equipmentCategories).forEach(category => {
      allTypes.push(...category.items);
    });
    
    // Add custom types from existing equipment
    const equipment = DataStorage.loadEquipment();
    const customTypes = [...new Set(equipment.map(eq => eq.type))];
    
    // Combine and sort
    return [...new Set([...allTypes, ...customTypes])].sort();
  };

  const getAvailableEquipmentTypes = () => {
    const allTypes = getAllEquipmentTypes();
    const configuredTypes = new Set(configs.map(c => c.equipment_type));
    return allTypes.filter(type => !configuredTypes.has(type));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preventive maintenance configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
                      <div>
              <h1 className="text-2xl font-bold text-gray-900">Preventive Maintenance Configuration</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <p>Configure maintenance intervals for equipment types ({configs.length} configured, {getAvailableEquipmentTypes().length} available)</p>
                <div className="flex items-center space-x-2">
                  <Database className={`w-4 h-4 ${
                    syncStatus === 'synced' ? 'text-green-600' : 
                    syncStatus === 'syncing' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm ${
                    syncStatus === 'synced' ? 'text-green-600' : 
                    syncStatus === 'syncing' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {syncStatus === 'synced' ? 'Synced' : 
                     syncStatus === 'syncing' ? 'Syncing...' : 'Sync Error'}
                    {lastSyncTime && syncStatus === 'synced' && ` (${lastSyncTime})`}
                  </span>
                </div>
              </div>
            </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setEditingConfig({} as PreventiveMaintenanceConfig)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Configuration</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Configuration Form Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingConfig.id ? 'Edit Configuration' : 'Add Configuration'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Equipment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Type *
                </label>
                <select
                  value={editingConfig.equipment_type || ''}
                  onChange={(e) => setEditingConfig(prev => ({ ...prev!, equipment_type: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Equipment Type</option>
                  {Object.entries(equipmentCategories).map(([categoryKey, category]) => (
                    <optgroup key={categoryKey} label={category.name}>
                      {category.items.map(item => {
                        const hasConfig = configs.some(c => c.equipment_type === item);
                        return (
                          <option key={item} value={item} disabled={hasConfig}>
                            {item} {hasConfig ? '(Already Configured)' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                  {/* Add custom types if any */}
                  {(() => {
                    const equipment = DataStorage.loadEquipment();
                    const predefinedTypes = new Set();
                    Object.values(equipmentCategories).forEach(category => {
                      category.items.forEach(item => predefinedTypes.add(item));
                    });
                    const customTypes = [...new Set(equipment.map(eq => eq.type))].filter(type => !predefinedTypes.has(type));
                    if (customTypes.length > 0) {
                      return (
                        <optgroup label="Custom Types">
                          {customTypes.map(type => {
                            const hasConfig = configs.some(c => c.equipment_type === type);
                            return (
                              <option key={type} value={type} disabled={hasConfig}>
                                {type} {hasConfig ? '(Already Configured)' : ''}
                              </option>
                            );
                          })}
                        </optgroup>
                      );
                    }
                    return null;
                  })()}
                </select>
              </div>

              {/* Maintenance Classes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Class A */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">Class A Maintenance</h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval (hours)
                    </label>
                    <input
                      type="number"
                      value={editingConfig.class_a_hours || ''}
                      onChange={(e) => setEditingConfig(prev => ({ 
                        ...prev!, 
                        class_a_hours: parseInt(e.target.value) || 0 
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="40"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Threshold: {Math.floor((editingConfig.class_a_hours || 0) * 0.8)} hours
                  </div>
                </div>

                {/* Class B */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">Class B Maintenance</h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval (hours)
                    </label>
                    <input
                      type="number"
                      value={editingConfig.class_b_hours || ''}
                      onChange={(e) => setEditingConfig(prev => ({ 
                        ...prev!, 
                        class_b_hours: parseInt(e.target.value) || 0 
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="480"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Threshold: {Math.floor((editingConfig.class_b_hours || 0) * 0.8)} hours
                  </div>
                </div>

                {/* Class C */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">Class C Maintenance</h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval (hours)
                    </label>
                    <input
                      type="number"
                      value={editingConfig.class_c_hours || ''}
                      onChange={(e) => setEditingConfig(prev => ({ 
                        ...prev!, 
                        class_c_hours: parseInt(e.target.value) || 0 
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1920"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Threshold: {Math.floor((editingConfig.class_c_hours || 0) * 0.8)} hours
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingConfig.is_active !== false}
                  onChange={(e) => setEditingConfig(prev => ({ ...prev!, is_active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active Configuration
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setEditingConfig(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(editingConfig)}
                disabled={!editingConfig.equipment_type}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configurations List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Equipment Type Configurations</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class A
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class B
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class C
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
                    <div className="flex items-center space-x-3">
                      <Wrench className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">{config.equipment_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getMaintenanceClassColor('A')}`}>
                        {config.class_a_hours}h
                      </span>
                      <span className="text-xs text-gray-500">
                        ({config.class_a_threshold_hours}h)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getMaintenanceClassColor('B')}`}>
                        {config.class_b_hours}h
                      </span>
                      <span className="text-xs text-gray-500">
                        ({config.class_b_threshold_hours}h)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getMaintenanceClassColor('C')}`}>
                        {config.class_c_hours}h
                      </span>
                      <span className="text-xs text-gray-500">
                        ({config.class_c_threshold_hours}h)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      config.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingConfig(config)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id!)}
                        className="text-red-600 hover:text-red-900 transition-colors"
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

      {/* Information Panel */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <HardHat className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Preventive Maintenance Matrix</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Class A:</strong> Basic service, inspections, and minor adjustments (every 40-50 hours)</p>
              <p><strong>Class B:</strong> Standard maintenance including oil changes, filter replacements (every 200-480 hours)</p>
              <p><strong>Class C:</strong> Major maintenance including overhauls and component replacements (every 1000-1920 hours)</p>
              <p><strong>80% Threshold:</strong> System automatically schedules maintenance when equipment reaches 80% of the interval</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreventiveMaintenanceConfig; 