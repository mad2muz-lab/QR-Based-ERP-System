import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  Wrench, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Settings,
  Search,
  Filter,
  Calendar,
  Users,
  Database,
  RefreshCw
} from 'lucide-react';

interface Equipment {
  id: string;
  "Equipment Name": string; // Using actual database column name
  "Equipment Type": string; // Using actual database column name
  model: string;
  site: string;
  status: string;
  operational_status: string;
  is_pm: boolean;
  pm_class?: string;
  pm_frequency_hours?: number;
  pm_frequency_days?: number;
  last_pm_date?: string;
  next_pm_date?: string;
  created_at: string;
}

interface PMConfig {
  equipment_type: string;
  class_a_hours: number;
  class_b_hours: number;
  class_c_hours: number;
  class_a_threshold_hours: number;
  class_b_threshold_hours: number;
  class_c_threshold_hours: number;
  description: string;
  is_active: boolean;
}

interface PMEnrollmentData {
  equipment_id: string;
  equipment_name: string; // For internal use
  equipment_type: string; // For internal use
  pm_class: string;
  frequency_hours: number;
  frequency_days: number;
  threshold_hours: number;
  description: string;
}

const PMEnrollmentManager: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [pmConfigs, setPmConfigs] = useState<PMConfig[]>([]);
  const [enrolledEquipment, setEnrolledEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<PMEnrollmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'enrolled' | 'not_enrolled'>('all');
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  useEffect(() => {
    loadEquipment();
    loadPMConfigs();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
             const { data, error } = await supabase
         .from('equipment')
         .select('*')
         .order('"Equipment Name"', { ascending: true });

      if (error) throw error;

      setEquipment(data || []);
      
      // Separate enrolled and non-enrolled equipment
      const enrolled = data?.filter(eq => eq.is_pm) || [];
      setEnrolledEquipment(enrolled);
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const loadPMConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('preventive_maintenance_configs')
        .select('*')
        .eq('is_active', true)
        .order('equipment_type', { ascending: true });

      if (error) throw error;
      setPmConfigs(data || []);
    } catch (err) {
      console.error('Error loading PM configs:', err);
    }
  };

  const handleEnrollEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    
         // Find PM config for this equipment type
     const config = pmConfigs.find(cfg => cfg.equipment_type === equipment["Equipment Type"]);
    
    if (config) {
             setEnrollmentData({
         equipment_id: equipment.id,
         equipment_name: equipment["Equipment Name"],
         equipment_type: equipment["Equipment Type"],
         pm_class: 'Class A', // Default to Class A
         frequency_hours: config.class_a_hours,
         frequency_days: 30, // Default 30 days
         threshold_hours: config.class_a_threshold_hours,
         description: config.description
       });
    } else {
             // Create default enrollment data if no config found
       setEnrollmentData({
         equipment_id: equipment.id,
         equipment_name: equipment["Equipment Name"],
         equipment_type: equipment["Equipment Type"],
         pm_class: 'Class A',
         frequency_hours: 40,
         frequency_days: 30,
         threshold_hours: 32,
         description: 'Default PM configuration'
       });
    }
    
    setShowEnrollmentModal(true);
  };

  const handlePMClassChange = (pmClass: string) => {
    if (!enrollmentData || !selectedEquipment) return;

         const config = pmConfigs.find(cfg => cfg.equipment_type === selectedEquipment["Equipment Type"]);
    
    let frequencyHours = 40;
    let thresholdHours = 32;
    
    if (config) {
      switch (pmClass) {
        case 'Class A':
          frequencyHours = config.class_a_hours;
          thresholdHours = config.class_a_threshold_hours;
          break;
        case 'Class B':
          frequencyHours = config.class_b_hours;
          thresholdHours = config.class_b_threshold_hours;
          break;
        case 'Class C':
          frequencyHours = config.class_c_hours;
          thresholdHours = config.class_c_threshold_hours;
          break;
      }
    }

    setEnrollmentData({
      ...enrollmentData,
      pm_class: pmClass,
      frequency_hours: frequencyHours,
      threshold_hours: thresholdHours
    });
  };

  const handleSaveEnrollment = async () => {
    if (!enrollmentData) return;

    try {
      setLoading(true);
      
      // Update equipment with PM enrollment
      const { error: equipmentError } = await supabase
        .from('equipment')
        .update({
          is_pm: true,
          pm_class: enrollmentData.pm_class,
          pm_frequency_hours: enrollmentData.frequency_hours,
          pm_frequency_days: enrollmentData.frequency_days,
          last_pm_date: null,
          next_pm_date: new Date(Date.now() + enrollmentData.frequency_days * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', enrollmentData.equipment_id);

             if (equipmentError) throw equipmentError;

       // Note: PM log entry creation is temporarily disabled due to schema requirements
       // The equipment is now enrolled in PM and will be available for PM scheduling

      setSuccess(`Equipment "${enrollmentData.equipment_name}" enrolled in PM successfully!`);
      setShowEnrollmentModal(false);
      setSelectedEquipment(null);
      setEnrollmentData(null);
      
      // Reload equipment data
      await loadEquipment();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error enrolling equipment:', err);
      setError('Failed to enroll equipment in PM');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenrollEquipment = async (equipment: Equipment) => {
         if (!confirm(`Are you sure you want to unenroll "${equipment["Equipment Name"]}" from PM?`)) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('equipment')
        .update({
          is_pm: false,
          pm_class: null,
          pm_frequency_hours: null,
          pm_frequency_days: null,
          last_pm_date: null,
          next_pm_date: null
        })
        .eq('id', equipment.id);

      if (error) throw error;

             setSuccess(`Equipment "${equipment["Equipment Name"]}" unenrolled from PM successfully!`);
      await loadEquipment();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error unenrolling equipment:', err);
      setError('Failed to unenroll equipment from PM');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

     const filteredEquipment = equipment.filter(eq => {
     const matchesSearch = eq["Equipment Name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq["Equipment Type"].toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'enrolled') return matchesSearch && eq.is_pm;
    if (filterType === 'not_enrolled') return matchesSearch && !eq.is_pm;
    return matchesSearch;
  });

  const getPMClassColor = (pmClass: string) => {
    switch (pmClass) {
      case 'Class A': return 'bg-green-100 text-green-800';
      case 'Class B': return 'bg-yellow-100 text-yellow-800';
      case 'Class C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PM Enrollment Manager</h1>
        <p className="text-gray-600">Manage equipment enrollment in preventive maintenance schedules</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Equipment</p>
              <p className="text-2xl font-bold text-gray-900">{equipment.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled in PM</p>
              <p className="text-2xl font-bold text-gray-900">{enrolledEquipment.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Not Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{equipment.length - enrolledEquipment.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">PM Configs</p>
              <p className="text-2xl font-bold text-gray-900">{pmConfigs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search equipment by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Equipment</option>
              <option value="enrolled">Enrolled in PM</option>
              <option value="not_enrolled">Not Enrolled</option>
            </select>
            
            <button
              onClick={loadEquipment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Equipment List</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading equipment...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PM Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                                             <div>
                         <div className="text-sm font-medium text-gray-900">{eq["Equipment Name"]}</div>
                         <div className="text-sm text-gray-500">{eq.model}</div>
                       </div>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {eq["Equipment Type"]}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {eq.site}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        eq.status === 'available' ? 'bg-green-100 text-green-800' :
                        eq.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                        eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {eq.is_pm ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPMClassColor(eq.pm_class || '')}`}>
                            {eq.pm_class}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-gray-500">Not Enrolled</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {eq.is_pm ? (
                        <button
                          onClick={() => handleUnenrollEquipment(eq)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Unenroll
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnrollEquipment(eq)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Enroll
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredEquipment.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No equipment found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && enrollmentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Enroll Equipment in PM</h2>
              <button
                onClick={() => setShowEnrollmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Equipment Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Equipment Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{enrollmentData.equipment_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{enrollmentData.equipment_type}</span>
                  </div>
                </div>
              </div>

              {/* PM Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select PM Class
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Class A', 'Class B', 'Class C'].map((pmClass) => (
                    <button
                      key={pmClass}
                      onClick={() => handlePMClassChange(pmClass)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        enrollmentData.pm_class === pmClass
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{pmClass}</div>
                      <div className="text-sm text-gray-600">
                        {pmClass === 'Class A' ? 'Routine (Weekly)' :
                         pmClass === 'Class B' ? 'Scheduled (Monthly)' : 'Major (Quarterly)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* PM Configuration Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">PM Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Frequency:</span>
                    <span className="ml-2 font-medium">{enrollmentData.frequency_hours} hours / {enrollmentData.frequency_days} days</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Threshold:</span>
                    <span className="ml-2 font-medium">{enrollmentData.threshold_hours} hours</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {enrollmentData.description}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowEnrollmentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEnrollment}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enrolling...
                    </>
                  ) : (
                    'Enroll Equipment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMEnrollmentManager;
