import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Equipment } from '../../types';
import { Plus, Settings, Trash2, Edit } from 'lucide-react';

interface PMConfig {
  pm_class: string;
  pm_frequency_days: number;
  pm_frequency_hours: number;
  pm_checklist_items: string[];
  pm_spare_parts: string[];
}

const EnrollEquipmentInPM: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [enrolledEquipment, setEnrolledEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [pmConfigs, setPmConfigs] = useState<PMConfig[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .order('"Equipment Name"');
      
      if (equipmentError) {
        console.error('Error fetching equipment:', equipmentError);
        return;
      }

      setEquipmentList(equipment || []);
    } catch (err) {
      console.error('Error in fetchEquipment:', err);
    }
    setLoading(false);
  };

  const fetchEnrolledEquipment = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
             const { data: enrolled, error: enrolledError } = await supabase
         .from('equipment')
         .select('id, custom_equipment_id, equipment_name, equipment_type, model, site, qr_code, status, operational_status, is_pm, pm_class, pm_frequency_hours, pm_frequency_days, pm_cost_estimate, last_pm_date, next_pm_date, pm_checklist_items, pm_spare_parts, usage_duration, created_at, last_updated')
         .eq('is_pm', true)
         .not('pm_class', 'is', null)
         .order('"Equipment Name"', { ascending: true });
      
      if (enrolledError) {
        console.error('Error fetching enrolled equipment:', enrolledError);
        return;
      }

      setEnrolledEquipment((enrolled as unknown as Equipment[]) || []);
    } catch (err) {
      console.error('Error in fetchEnrolledEquipment:', err);
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchEnrolledEquipment();
  }, []);

  const fetchTemplatesAndAutoPopulate = async (equipmentType: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return [];
      }
      
      const { data: templates, error } = await supabase
        .from('preventive_maintenance_configs')
        .select('*')
        .eq('equipment_type', equipmentType);
      
      if (error) {
        console.error('Error fetching PM configs:', error);
        return [];
      }
      
      const configs: PMConfig[] = [];
      
      if (templates && templates.length > 0) {
        const template = templates[0];
        
        // Create Class A config
        if (template.class_a_hours) {
          configs.push({
            pm_class: 'Class A',
            pm_frequency_days: template.interval_days || 90,
            pm_frequency_hours: template.class_a_hours,
            pm_checklist_items: template.checklist_items || [],
            pm_spare_parts: template.spare_parts || []
          });
        }
        
        // Create Class B config
        if (template.class_b_hours) {
          configs.push({
            pm_class: 'Class B',
            pm_frequency_days: template.interval_days || 365,
            pm_frequency_hours: template.class_b_hours,
            pm_checklist_items: template.checklist_items || [],
            pm_spare_parts: template.spare_parts || []
          });
        }
        
        // Create Class C config
        if (template.class_c_hours) {
          configs.push({
            pm_class: 'Class C',
            pm_frequency_days: template.interval_days || 730,
            pm_frequency_hours: template.class_c_hours,
            pm_checklist_items: template.checklist_items || [],
            pm_spare_parts: template.spare_parts || []
          });
        }
      }

      return configs;
    } catch (error) {
      console.error('Error in fetchTemplatesAndAutoPopulate:', error);
      return [];
    }
  };

  const handleEnrollClick = async (equipment: Equipment) => {
    try {
      const autoConfigs = await fetchTemplatesAndAutoPopulate(equipment.type);
      setSelectedEquipment(equipment);
      setPmConfigs(autoConfigs);
      setMessage(null);
    } catch (error) {
      console.error('Error enrolling equipment:', error);
      setMessage('Error loading PM configurations.');
    }
  };

  const handleSave = async () => {
    if (!selectedEquipment || pmConfigs.length === 0) return;
    
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setMessage('Database connection error.');
        return;
      }
      
      const selectedConfig = pmConfigs[0]; // Use the first config
      
      const { error } = await supabase
        .from('equipment')
        .update({
          is_pm: true,
          pm_class: selectedConfig.pm_class,
          pm_frequency_hours: selectedConfig.pm_frequency_hours,
          pm_frequency_days: selectedConfig.pm_frequency_days,
          pm_checklist_items: selectedConfig.pm_checklist_items,
          pm_spare_parts: selectedConfig.pm_spare_parts
        })
        .eq('id', selectedEquipment.id);

      if (!error) {
        setMessage('Equipment enrolled in PM successfully!');
        setSelectedEquipment(null);
        setPmConfigs([]);
        fetchEquipment();
        fetchEnrolledEquipment();
      } else {
        setMessage('Failed to enroll equipment in PM.');
      }
    } catch (err) {
      console.error('Error enrolling equipment:', err);
      setMessage('Failed to enroll equipment in PM.');
    }
  };

  const handleRemoveFromPM = async (equipment: Equipment) => {
    if (!confirm(`Are you sure you want to remove ${equipment.name} from PM enrollment?`)) {
      return;
    }
    
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setMessage('Database connection error.');
        return;
      }
      
      const { error } = await supabase
        .from('equipment')
        .update({
          is_pm: false,
          pm_class: null,
          pm_frequency_hours: null,
          pm_frequency_days: null,
          pm_checklist_items: [],
          pm_spare_parts: []
        })
        .eq('id', equipment.id);

      if (!error) {
        setMessage(`${equipment.name} removed from PM enrollment successfully!`);
        fetchEquipment();
        fetchEnrolledEquipment();
      } else {
        setMessage('Failed to remove equipment from PM enrollment.');
      }
    } catch (err) {
      console.error('Error removing equipment from PM:', err);
      setMessage('Failed to remove equipment from PM enrollment.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">Enrolled Equipment in PM</h1>
          <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
            {enrolledEquipment.length}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/pm"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to PM Dashboard</span>
          </a>
          <button
            onClick={() => setShowEnrollmentForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Equipment</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-center ${
          message.includes('successfully') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Defaults Status Summary */}
      {enrolledEquipment.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">PM Defaults Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Total Enrolled:</span>
                  <span className="ml-2 text-blue-900">{enrolledEquipment.length}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">With Complete Defaults:</span>
                  <span className="ml-2 text-green-600 font-medium">
                    {enrolledEquipment.filter(eq => 
                      eq.pm_frequency_days && 
                      eq.pm_cost_estimate && 
                      eq.last_pm_date && 
                      eq.next_pm_date
                    ).length}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Needs Defaults:</span>
                  <span className="ml-2 text-yellow-600 font-medium">
                    {enrolledEquipment.filter(eq => 
                      !eq.pm_frequency_days || 
                      !eq.pm_cost_estimate || 
                      !eq.last_pm_date || 
                      !eq.next_pm_date
                    ).length}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">PM Classes:</span>
                  <span className="ml-2 text-blue-900">
                    {[...new Set(enrolledEquipment.map(eq => eq.pm_class).filter(Boolean))].join(', ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700 mb-2">
                Run the SQL script to set defaults for all equipment
              </p>
              <code className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                set_defaults_for_enrolled_equipment.sql
              </code>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading equipment...</span>
        </div>
      ) : enrolledEquipment.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Equipment Enrolled in PM</h3>
          <p className="text-gray-600 mb-6">
            Equipment must be enrolled in preventive maintenance before schedules can be generated.
          </p>
          <button
            onClick={() => setShowEnrollmentForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Equipment in PM</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledEquipment.map(equipment => (
            <div key={equipment.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{equipment.equipment_name}</h3>
                  <p className="text-sm text-gray-600">{equipment.equipment_type}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className="px-3 py-1 text-xs rounded-full font-semibold bg-green-100 text-green-800">
                    Enrolled
                  </span>
                  {(!equipment.pm_frequency_days || !equipment.pm_cost_estimate || !equipment.last_pm_date || !equipment.next_pm_date) && (
                    <span className="px-2 py-1 text-xs rounded-full font-semibold bg-yellow-100 text-yellow-800">
                      Needs Defaults
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">PM Class:</span>
                  <span className="font-medium text-blue-600">{equipment.pm_class || 'Not Set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-medium">
                    {equipment.pm_frequency_days ? `${equipment.pm_frequency_days} days` : 
                     equipment.pm_frequency_hours ? `${equipment.pm_frequency_hours}h` : 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Cost:</span>
                  <span className="font-medium text-green-600">
                    SAR {equipment.pm_cost_estimate ? equipment.pm_cost_estimate.toLocaleString() : 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last PM:</span>
                  <span className="font-medium">
                    {equipment.last_pm_date ? new Date(equipment.last_pm_date).toLocaleDateString() : 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next PM:</span>
                  <span className="font-medium">
                    {equipment.next_pm_date ? new Date(equipment.next_pm_date).toLocaleDateString() : 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Site:</span>
                  <span className="font-medium">{equipment.site || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    equipment.status === 'available' ? 'text-green-600' : 
                    equipment.status === 'in-use' ? 'text-blue-600' : 
                    'text-gray-600'
                  }`}>
                    {equipment.status || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
                <button
                  onClick={() => handleEnrollClick(equipment)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit PM Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveFromPM(equipment)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove from PM"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PM Config Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" 
              onClick={() => setSelectedEquipment(null)}
            >
              &times;
            </button>
            
            <h3 className="text-xl font-bold mb-4">PM Configuration for {selectedEquipment.name}</h3>
            
            <div className="mb-4">
              {pmConfigs.length === 0 ? (
                <div className="text-red-600">No PM templates found for this equipment type.</div>
              ) : (
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Available Maintenance Classes</h4>
                  {pmConfigs.map((cfg, idx) => (
                    <div key={idx} className="border rounded-lg p-4 mb-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-blue-700 text-lg">
                          {cfg.pm_class === 'Class A' ? '🔧 Class A - Minor Service' :
                           cfg.pm_class === 'Class B' ? '⚙️ Class B - Major Service' :
                           cfg.pm_class === 'Class C' ? '🔨 Class C - Overhaul Service' :
                           `🔧 ${cfg.pm_class}`}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PM Frequency (days)</label>
                          <input
                            type="number"
                            value={cfg.pm_frequency_days}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PM Frequency (hours)</label>
                          <input
                            type="number"
                            value={cfg.pm_frequency_hours}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">PM Checklist Items</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                          {cfg.pm_checklist_items && cfg.pm_checklist_items.length > 0 ? 
                            cfg.pm_checklist_items.map((item, index) => (
                              <div key={index} className="text-sm text-gray-700">{item}</div>
                            )) : (
                              <span className="text-gray-500 text-sm">No checklist items defined</span>
                            )
                          }
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">PM Spare Parts</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                          {cfg.pm_spare_parts && cfg.pm_spare_parts.length > 0 ? 
                            cfg.pm_spare_parts.map((part, index) => (
                              <div key={index} className="text-sm text-gray-700">{part}</div>
                            )) : (
                              <span className="text-gray-500 text-sm">No spare parts defined</span>
                            )
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                className="px-4 py-2 bg-gray-300 rounded" 
                onClick={() => setSelectedEquipment(null)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded" 
                onClick={handleSave} 
                disabled={pmConfigs.length === 0}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollEquipmentInPM; 