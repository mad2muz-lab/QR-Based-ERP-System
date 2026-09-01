import React, { useState, useEffect } from 'react';
import { DataStorage } from '../../utils/dataStorage';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { AuthManager } from '../../utils/authUtils';
import { supabase } from '../../utils/supabaseClient';
import MaintenancePage from './MaintenancePage';
import HRDepartmentPage from './HRDepartmentPage';
import { Building2, Wrench, Users, Truck, Shield, Settings, Package, Briefcase, AlertTriangle, Clock, CheckCircle, QrCode, DollarSign, BarChart3, Plus, Edit, Trash2, X } from 'lucide-react';
import { Material } from '../../types';
import { MaterialType } from '../../types/constants';
import { MaterialForm, PRForm, InventoryModal } from '../inventory';

// MaterialForm component is now imported from ../inventory

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastUpdated: string;
  type?: string;
}

// Using the Material interface from types/index.ts

const DepartmentsPage: React.FC = () => {
  console.log('🚀 Original DepartmentsPage component is loading...');
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState<string>('maintenance');
  const [loading, setLoading] = useState(true);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  
  // Inventory modal states
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showStockAlertsModal, setShowStockAlertsModal] = useState(false);
  const [showInventoryReportsModal, setShowInventoryReportsModal] = useState(false);
  const [showCreatePRModal, setShowCreatePRModal] = useState(false);
  const [selectedMaterialsForPR, setSelectedMaterialsForPR] = useState<Material[]>([]);
  const [inventoryStats, setInventoryStats] = useState({
    totalMaterials: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });
  const [sites, setSites] = useState<Array<{id: string, name: string}>>([]);

  // Add new state for PR management
  const [showPRManagementModal, setShowPRManagementModal] = useState(false);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [prLoading, setPrLoading] = useState(false);
  const [activeInventoryTab, setActiveInventoryTab] = useState<'inventory' | 'purchase-requests'>('inventory');

  useEffect(() => {
    console.log('🔧 Original DepartmentsPage useEffect triggered');
    loadDepartments();
    loadSites();
  }, []);

  const loadDepartments = async () => {
    console.log('🔍 Loading departments...');
    try {
      const useSupabase = await AuthManager.useSupabase();
      let loadedDepartments: Department[] = [];
      
      if (useSupabase) {
        console.log('🔍 Loading from Supabase...');
        // Load from Supabase
        loadedDepartments = await SupabaseDataService.getDepartments();
      } else {
        console.log('🔍 Loading from local storage...');
        // Load from local storage
        loadedDepartments = DataStorage.loadDepartments();
      }
      
      console.log('📋 Loaded departments:', loadedDepartments);
      
      // If no departments found, create default with only Inventory
      if (loadedDepartments.length === 0) {
        console.log('⚠️ No departments found, creating defaults...');
        const defaultDepartments: Department[] = [
          {
            id: 'dept-inventory',
            name: 'Inventory',
            description: 'Material and equipment inventory management',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        ];
        
        DataStorage.saveDepartments(defaultDepartments);
        loadedDepartments = defaultDepartments;
      }
      
      setDepartments(loadedDepartments);
      setActiveTab('inventory'); // Set inventory as default active tab
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const useSupabase = await AuthManager.useSupabase();
      let loadedSites: Array<{id: string, name: string}> = [];
      
      if (useSupabase && supabase) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('sites')
          .select('id, name')
          .order('name');
        
        if (error) {
          console.error('Error loading sites:', error);
          throw error;
        }
        
        loadedSites = data || [];
      } else {
        // Load from local storage
        const allSites = DataStorage.loadSites();
        loadedSites = allSites.map(site => ({ id: site.id, name: site.name }));
      }
      
      setSites(loadedSites);
    } catch (error) {
      console.error('Error loading sites:', error);
      // Fallback to empty array
      setSites([]);
    }
  };

  const getSiteName = (siteId: string): string => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : siteId; // Fallback to ID if site not found
  };

  const loadMaterials = async () => {
    setMaterialsLoading(true);
    try {
      const useSupabase = await AuthManager.useSupabase();
      let loadedMaterials: Material[] = [];
      
      if (useSupabase && supabase) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error loading materials:', error);
          throw error;
        }
        
        loadedMaterials = data || [];
      } else {
        // Load from local storage
        loadedMaterials = DataStorage.loadMaterials();
      }
      
      setMaterials(loadedMaterials);
      
      // Calculate inventory stats
      const stats = {
        totalMaterials: loadedMaterials.length,
        lowStock: loadedMaterials.filter(m => m.status === 'low-stock').length,
        outOfStock: loadedMaterials.filter(m => m.status === 'out-of-stock').length,
        totalValue: loadedMaterials.reduce((sum, m) => sum + (m.quantity || 0), 0)
      };
      setInventoryStats(stats);
    } catch (error) {
      console.error('Error loading materials:', error);
      // Fallback to local storage
      const loadedMaterials = DataStorage.loadMaterials();
      setMaterials(loadedMaterials);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleOpenInventoryModal = () => {
    setShowInventoryModal(true);
    loadMaterials(); // Load materials when opening the modal
  };

  const handleOpenStockAlerts = () => {
    setShowStockAlertsModal(true);
    loadMaterials(); // Load materials to check for alerts
  };

  const handleOpenInventoryReports = () => {
    setShowInventoryReportsModal(true);
    loadMaterials(); // Load materials for reports
  };

  const handleCreatePR = (materials: Material[]) => {
    setSelectedMaterialsForPR(materials);
    setShowCreatePRModal(true);
  };

  const handleCreatePRFromAlerts = () => {
    const alertMaterials = materials.filter(m => m.status === 'low-stock' || m.status === 'out-of-stock');
    handleCreatePR(alertMaterials);
  };

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowEditMaterialModal(true);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const useSupabase = await AuthManager.useSupabase();
      
      if (useSupabase && supabase) {
        // Delete from Supabase
        const { error } = await supabase
          .from('materials')
          .delete()
          .eq('id', materialId);
        
        if (error) {
          console.error('Error deleting material:', error);
          throw error;
        }
      } else {
        // Delete from local storage
        const currentMaterials = DataStorage.loadMaterials();
        const updatedMaterials = currentMaterials.filter(m => m.id !== materialId);
        DataStorage.saveMaterials(updatedMaterials);
      }
      
      loadMaterials(); // Reload materials
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleSaveMaterial = async (materialData: Partial<Material>) => {
    try {
      const useSupabase = await AuthManager.useSupabase();
      
      if (useSupabase && supabase) {
        if (selectedMaterial) {
          // Update existing material
          const { error } = await supabase
            .from('materials')
            .update(materialData)
            .eq('id', selectedMaterial.id);
          
          if (error) {
            console.error('Error updating material:', error);
            throw error;
          }
        } else {
          // Create new material
          const { error } = await supabase
            .from('materials')
            .insert([materialData]);
          
          if (error) {
            console.error('Error creating material:', error);
            throw error;
          }
        }
      } else {
        // Save to local storage
        const currentMaterials = DataStorage.loadMaterials();
        
        if (selectedMaterial) {
          // Update existing material
          const updatedMaterials = currentMaterials.map(m => 
            m.id === selectedMaterial.id ? { ...m, ...materialData } : m
          );
          DataStorage.saveMaterials(updatedMaterials);
        } else {
          // Add new material
          const newMaterial: Material = {
            ...materialData,
            id: `MAT-${Date.now()}`,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          } as Material;
          DataStorage.saveMaterials([...currentMaterials, newMaterial]);
        }
      }
      
      setShowEditMaterialModal(false);
      setSelectedMaterial(null);
      loadMaterials(); // Reload materials
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const getDepartmentIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('maintenance')) return Wrench;
    if (lowerName.includes('construction')) return Building2;
    if (lowerName.includes('operations')) return Settings;
    if (lowerName.includes('inventory')) return Package;
    if (lowerName.includes('procurement')) return Briefcase;
    if (lowerName.includes('logistics')) return Truck;
    if (lowerName.includes('inventory')) return Package;
    if (lowerName.includes('finance')) return DollarSign;
    if (lowerName.includes('human resources') || lowerName.includes('hr')) return Users;
    if (lowerName.includes('admin')) return Shield;
    return Users; // default icon
  };

  const renderDepartmentContent = (department: Department) => {
    const departmentName = department.name.toLowerCase();
    
    // Special handling for maintenance department
    if (departmentName.includes('maintenance')) {
      return <MaintenancePage />;
    }

    // Special handling for HR department
    if (departmentName.includes('human resources') || departmentName.includes('hr')) {
      return <HRDepartmentPage />;
    }

    // Special handling for logistics department
    if (departmentName.includes('logistics')) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Logistics Department</h1>
                  <p className="text-gray-600">Equipment movement, transport, and logistics management</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <a
                  href="/logistics"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  <span>Logistics Dashboard</span>
                </a>
                <a
                  href="/logistics/triggers"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Trigger Manager</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Movements</p>
                    <p className="text-2xl font-bold text-blue-600">5</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Triggers</p>
                    <p className="text-2xl font-bold text-orange-600">3</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">12</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assets</p>
                    <p className="text-2xl font-bold text-purple-600">45</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span>Create Movement</span>
                </button>
                <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span>View Triggers</span>
                </button>
                <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <span>Analytics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Special handling for inventory department
    if (departmentName.includes('inventory')) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg mr-4">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                  <p className="text-gray-600">Material and equipment inventory tracking</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleOpenInventoryModal}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span>Manage Inventory</span>
                </button>
                <button
                  onClick={handleOpenStockAlerts}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Stock Alerts</span>
                </button>
              </div>
            </div>

            {/* Inventory Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Materials</p>
                    <p className="text-2xl font-bold text-blue-600">{inventoryStats.totalMaterials}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    <p className="text-2xl font-bold text-orange-600">{inventoryStats.lowStock}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-green-600">SAR {inventoryStats.totalValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleOpenInventoryModal}
                className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package className="w-5 h-5 text-orange-600" />
                <span>View All Materials</span>
              </button>
              <button
                onClick={handleOpenStockAlerts}
                className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Stock Alerts</span>
              </button>
              <button
                onClick={handleOpenInventoryReports}
                className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Inventory Reports</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default content for other departments
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg mr-4">
                {React.createElement(getDepartmentIcon(department.name), { 
                  className: "w-6 h-6 text-gray-600" 
                })}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{department.name} Department</h1>
                <p className="text-gray-600">{department.description}</p>
              </div>
            </div>
          </div>
          
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {React.createElement(getDepartmentIcon(department.name), { 
                className: "w-16 h-16 mx-auto" 
              })}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{department.name} Dashboard</h3>
            <p className="text-gray-600">This department dashboard is under development.</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading Departments...</p>
        </div>
      </div>
    );
  }

  const activeDepartment = departments.find(dept => dept.id === activeTab) || departments[0];

  return (
    <div className="space-y-6">
      {activeDepartment && renderDepartmentContent(activeDepartment)}

      {/* Inventory Modal */}
      {showInventoryModal && (
        <InventoryModal
          isOpen={showInventoryModal}
          onClose={() => setShowInventoryModal(false)}
          activeTab={activeInventoryTab}
          onTabChange={setActiveInventoryTab}
          materials={materials}
          materialsLoading={materialsLoading}
          sites={sites}
          purchaseRequests={purchaseRequests}
          prLoading={prLoading}
          showEditMaterialModal={showEditMaterialModal}
          selectedMaterial={selectedMaterial}
          onEditMaterial={handleEditMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          onSaveMaterial={handleSaveMaterial}
          onUpdatePRStatus={() => {}}
          getSiteName={getSiteName}
        />
      )}

      {/* Edit Material Modal */}
      {showEditMaterialModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Material</h2>
              <button
                onClick={() => setShowEditMaterialModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <MaterialForm
                material={selectedMaterial}
                sites={sites}
                onSubmit={handleSaveMaterial}
                onCancel={() => setShowEditMaterialModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;