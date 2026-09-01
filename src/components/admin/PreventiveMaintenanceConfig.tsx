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
  interval_hours: number;
  interval_days: number;
  interval_km: number;
  description: string;
  checklist_items: string[];
  spare_parts: string[];
  estimated_quantities: number[];
  uom: string;
  maintenance_type_id?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const PreventiveMaintenanceConfig: React.FC = () => {
  const [configs, setConfigs] = useState<PreventiveMaintenanceConfig[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [editingConfig, setEditingConfig] = useState<PreventiveMaintenanceConfig | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Default configurations matching the actual database schema
  const defaultConfigs: Record<string, PreventiveMaintenanceConfig> = {
    'Excavator': {
      equipment_type: 'Excavator',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Heavy excavation equipment requiring regular maintenance',
      checklist_items: ['Check oil level', 'Inspect hydraulic system', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Hydraulic Fluid'],
      estimated_quantities: [1, 1, 2],
      uom: 'pcs',
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
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Heavy earthmoving equipment for pushing and leveling',
      checklist_items: ['Check oil level', 'Inspect blade', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Blade Tips'],
      estimated_quantities: [1, 1, 2],
      uom: 'pcs',
      is_active: true
    },
    'Loader': {
      equipment_type: 'Loader',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Material handling and loading equipment',
      checklist_items: ['Check oil level', 'Inspect bucket', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Bucket Teeth'],
      estimated_quantities: [1, 1, 4],
      uom: 'pcs',
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
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Material handling equipment for loading and transport',
      checklist_items: ['Check oil level', 'Inspect bucket', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Bucket Teeth'],
      estimated_quantities: [1, 1, 4],
      uom: 'pcs',
      is_active: true
    },
    'Backhoe Loader': {
      equipment_type: 'Backhoe Loader',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Versatile equipment for digging and loading operations',
      checklist_items: ['Check oil level', 'Inspect bucket', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Bucket Teeth'],
      estimated_quantities: [1, 1, 4],
      uom: 'pcs',
      is_active: true
    },
    'Road Roller': {
      equipment_type: 'Road Roller',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Compaction equipment for road construction',
      checklist_items: ['Check oil level', 'Inspect drums', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Drum Plates'],
      estimated_quantities: [1, 1, 2],
      uom: 'pcs',
      is_active: true
    },
    'Compactor': {
      equipment_type: 'Compactor',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Soil and material compaction equipment',
      checklist_items: ['Check oil level', 'Inspect plate', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Compaction Plate'],
      estimated_quantities: [1, 1, 1],
      uom: 'pcs',
      is_active: true
    },
    'Scraper': {
      equipment_type: 'Scraper',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Earthmoving equipment for cutting and hauling',
      checklist_items: ['Check oil level', 'Inspect bowl', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Bowl Cutting Edges'],
      estimated_quantities: [1, 1, 6],
      uom: 'pcs',
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
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Heavy lifting equipment for construction',
      checklist_items: ['Check oil level', 'Inspect cables', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Wire Rope'],
      estimated_quantities: [1, 1, 1],
      uom: 'pcs',
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
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Mobile lifting equipment for various applications',
      checklist_items: ['Check oil level', 'Inspect boom', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Boom Sections'],
      estimated_quantities: [1, 1, 1],
      uom: 'pcs',
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
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Road construction equipment for grading and leveling',
      checklist_items: ['Check oil level', 'Inspect blade', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Blade'],
      estimated_quantities: [1, 1, 1],
      uom: 'pcs',
      is_active: true
    },
    'Asphalt Paver': {
      equipment_type: 'Asphalt Paver',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Asphalt paving equipment for road construction',
      checklist_items: ['Check oil level', 'Inspect screed', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Screed Plates'],
      estimated_quantities: [1, 1, 2],
      uom: 'pcs',
      is_active: true
    },
    'Batch Plants': {
      equipment_type: 'Batch Plants',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Concrete batch plant for material production',
      checklist_items: ['Check oil level', 'Inspect mixer', 'Clean air filter'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Mixer Blades'],
      estimated_quantities: [1, 1, 6],
      uom: 'pcs',
      is_active: true
    },
    'Fire Extinguisher': {
      equipment_type: 'Fire Extinguisher',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Fire safety equipment for emergency response',
      checklist_items: ['Check pressure gauge', 'Inspect safety seal', 'Verify expiration date'],
      spare_parts: ['Fire Extinguisher Unit', 'Pressure Gauge', 'Safety Seal'],
      estimated_quantities: [1, 1, 1],
      uom: 'pcs',
      is_active: true
    },
    'Emergency Shower': {
      equipment_type: 'Emergency Shower',
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: 'Emergency safety equipment for chemical exposure',
      checklist_items: ['Test water flow', 'Check temperature', 'Inspect activation mechanism'],
      spare_parts: ['Shower Head', 'Activation Handle', 'Water Valve'],
      estimated_quantities: [1, 1, 1],
      uom: 'pcs',
      is_active: true
    }
  };

  useEffect(() => {
    loadData();
    loadEquipmentTypes();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load from local storage first
      const localConfigs = DataStorage.loadPreventiveMaintenanceConfigs();
      setConfigs(localConfigs);

      // Load from database if available
      try {
        const dbConfigs = await OfflineDataManager.getAllPreventiveMaintenanceConfigs();
        if (dbConfigs && dbConfigs.length > 0) {
          setConfigs(dbConfigs);
        }
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (syncError) {
        console.warn('Database load failed, using local data:', syncError);
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Error loading PM configs:', err);
      setError('Failed to load preventive maintenance configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEquipmentTypes = () => {
    const types: string[] = [];
    Object.values(equipmentCategories).forEach(category => {
      types.push(...category.items);
    });
    setEquipmentTypes(types);
  };

  const handleSave = async (config: PreventiveMaintenanceConfig) => {
    try {
      setError('');
      setSuccess('');

      if (config.id) {
        // Update existing config
        await OfflineDataManager.updatePreventiveMaintenanceConfig(config.id!, config);
        setSuccess('Configuration updated successfully!');
      } else {
        // Create new config
        await OfflineDataManager.createPreventiveMaintenanceConfig(config);
        setSuccess('Configuration created successfully!');
      }

      // Reload data
      await loadData();
      setEditingConfig(null);
    } catch (err) {
      console.error('Error saving PM config:', err);
      setError('Failed to save configuration');
    }
  };

  const handleDelete = async (configId: string) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      await OfflineDataManager.deletePreventiveMaintenanceConfig(configId);
      setSuccess('Configuration deleted successfully!');
      await loadData();
    } catch (err) {
      console.error('Error deleting PM config:', err);
      setError('Failed to delete configuration');
    }
  };

  const getMaintenanceClassColor = (classType: string) => {
    switch (classType) {
      case 'Class A': return 'bg-blue-100 text-blue-800';
      case 'Class B': return 'bg-yellow-100 text-yellow-800';
      case 'Class C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAllEquipmentTypes = () => {
    const existingTypes = new Set(configs.map(c => c.equipment_type));
    return equipmentTypes.filter(type => !existingTypes.has(type));
  };

  const getAvailableEquipmentTypes = () => {
    return getAllEquipmentTypes();
  };

  // Generate default config for any equipment type
  const generateDefaultConfig = (equipmentType: string): PreventiveMaintenanceConfig => {
    return {
      equipment_type: equipmentType,
      class_a_hours: 40,
      class_b_hours: 480,
      class_c_hours: 1920,
      class_a_threshold_hours: 32,
      class_b_threshold_hours: 384,
      class_c_threshold_hours: 1536,
      interval_days: 7,
      interval_hours: 50,
      interval_km: 1000,
      description: `${equipmentType} maintenance schedule`,
      checklist_items: ['Check oil level', 'Inspect general condition', 'Clean equipment', 'Test safety systems'],
      spare_parts: ['Oil Filter', 'Air Filter', 'Hydraulic Fluid'],
      estimated_quantities: [1, 1, 2],
      uom: 'pcs',
      is_active: true
    };
  };

  const toggleRowExpansion = (configId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(configId)) {
      newExpanded.delete(configId);
    } else {
      newExpanded.add(configId);
    }
    setExpandedRows(newExpanded);
  };

  const addDefaultConfigs = async (equipmentType: string) => {
    // Use predefined config if available, otherwise generate a default one
    const defaultConfig = defaultConfigs[equipmentType] || generateDefaultConfig(equipmentType);
    
    try {
      await OfflineDataManager.createPreventiveMaintenanceConfig(defaultConfig);
      await loadData();
      setSuccess(`Added default configuration for ${equipmentType}`);
    } catch (err) {
      console.error('Error adding default config:', err);
      setError('Failed to add default configuration');
    }
  };

  const handleSync = async () => {
    try {
      setSyncStatus('syncing');
      await loadData();
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
      setSuccess('Data refreshed successfully!');
    } catch (err) {
      console.error('Refresh error:', err);
      setSyncStatus('error');
      setError('Refresh failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading preventive maintenance configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Preventive Maintenance Configuration
          </h1>
          <p className="text-gray-600 mt-2">
            Configure maintenance schedules and requirements for different equipment types
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              syncStatus === 'synced' ? 'bg-green-500' : 
              syncStatus === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-gray-600">
              {syncStatus === 'synced' ? 'Synced' : 
               syncStatus === 'syncing' ? 'Syncing...' : 'Sync Error'}
            </span>
            {lastSyncTime && (
              <span className="text-gray-500">({lastSyncTime})</span>
            )}
          </div>
          
          <button
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Add New Configuration */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add New Configuration</h2>
          <button
            onClick={() => setEditingConfig({
              equipment_type: '',
              class_a_hours: 40,
              class_b_hours: 480,
              class_c_hours: 1920,
              class_a_threshold_hours: 32,
              class_b_threshold_hours: 384,
              class_c_threshold_hours: 1536,
              interval_days: 30,
              interval_hours: 500,
              interval_km: 1000,
              description: '',
              checklist_items: [],
              spare_parts: [],
              estimated_quantities: [],
              uom: 'pcs',
              is_active: true
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Configuration
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getAvailableEquipmentTypes().map(equipmentType => (
            <div key={equipmentType} className="p-4 border border-gray-200 rounded-lg bg-white">
              <h3 className="font-medium text-gray-900 mb-2">{equipmentType}</h3>
              <p className="text-sm text-gray-600 mb-3">
                Default configuration available
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => addDefaultConfigs(equipmentType)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Add Defaults
                </button>
                
                <button
                  onClick={() => setEditingConfig({
                    equipment_type: equipmentType,
                    class_a_hours: 40,
                    class_b_hours: 480,
                    class_c_hours: 1920,
                    class_a_threshold_hours: 32,
                    class_b_threshold_hours: 384,
                    class_c_threshold_hours: 1536,
                    interval_days: 30,
                    interval_hours: 500,
                    interval_km: 1000,
                    description: '',
                    checklist_items: [],
                    spare_parts: [],
                    estimated_quantities: [],
                    uom: 'pcs',
                    is_active: true
                  })}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Custom
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      

      {/* Edit Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingConfig.id ? 'Edit Configuration' : 'New Configuration'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave(editingConfig);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipment Type
                    </label>
                    <input
                      type="text"
                      value={editingConfig.equipment_type}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        equipment_type: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Class A Hours
                     </label>
                     <input
                       type="number"
                       value={editingConfig.class_a_hours}
                       onChange={(e) => setEditingConfig({
                         ...editingConfig,
                         class_a_hours: parseInt(e.target.value) || 0
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required
                     />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Class B Hours
                     </label>
                     <input
                       type="number"
                       value={editingConfig.class_b_hours}
                       onChange={(e) => setEditingConfig({
                         ...editingConfig,
                         class_b_hours: parseInt(e.target.value) || 0
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required
                     />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Class C Hours
                     </label>
                     <input
                       type="number"
                       value={editingConfig.class_c_hours}
                       onChange={(e) => setEditingConfig({
                         ...editingConfig,
                         class_c_hours: parseInt(e.target.value) || 0
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required
                     />
                   </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval (Days)
                    </label>
                    <input
                      type="number"
                      value={editingConfig.interval_days}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        interval_days: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval (Hours)
                    </label>
                    <input
                      type="number"
                      value={editingConfig.interval_hours}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        interval_hours: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval (KM)
                    </label>
                    <input
                      type="number"
                      value={editingConfig.interval_km}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        interval_km: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingConfig.description}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      description: e.target.value
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Checklist Items */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Checklist Items
                  </label>
                  <div className="space-y-2">
                    {editingConfig.checklist_items.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...editingConfig.checklist_items];
                            newItems[index] = e.target.value;
                            setEditingConfig({
                              ...editingConfig,
                              checklist_items: newItems
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter checklist item"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = editingConfig.checklist_items.filter((_, i) => i !== index);
                            setEditingConfig({
                              ...editingConfig,
                              checklist_items: newItems
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditingConfig({
                        ...editingConfig,
                        checklist_items: [...editingConfig.checklist_items, '']
                      })}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-800"
                    >
                      + Add Checklist Item
                    </button>
                  </div>
                </div>

                {/* Spare Parts */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spare Parts
                  </label>
                  <div className="space-y-2">
                    {editingConfig.spare_parts.map((part, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={part}
                          onChange={(e) => {
                            const newParts = [...editingConfig.spare_parts];
                            newParts[index] = e.target.value;
                            setEditingConfig({
                              ...editingConfig,
                              spare_parts: newParts
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter spare part name"
                        />
                        <input
                          type="number"
                          value={editingConfig.estimated_quantities[index] || 1}
                          onChange={(e) => {
                            const newQuantities = [...editingConfig.estimated_quantities];
                            newQuantities[index] = parseInt(e.target.value) || 1;
                            setEditingConfig({
                              ...editingConfig,
                              estimated_quantities: newQuantities
                            });
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Qty"
                          min="1"
                        />
                        <select
                          value={editingConfig.uom || 'pcs'}
                          onChange={(e) => setEditingConfig({
                            ...editingConfig,
                            uom: e.target.value
                          })}
                          className="w-24 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="l">l</option>
                          <option value="m">m</option>
                          <option value="box">box</option>
                          <option value="set">set</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const newParts = editingConfig.spare_parts.filter((_, i) => i !== index);
                            const newQuantities = editingConfig.estimated_quantities.filter((_, i) => i !== index);
                            setEditingConfig({
                              ...editingConfig,
                              spare_parts: newParts,
                              estimated_quantities: newQuantities
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditingConfig({
                        ...editingConfig,
                        spare_parts: [...editingConfig.spare_parts, ''],
                        estimated_quantities: [...editingConfig.estimated_quantities, 1]
                      })}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-800"
                    >
                      + Add Spare Part
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingConfig(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingConfig.id ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreventiveMaintenanceConfig; 