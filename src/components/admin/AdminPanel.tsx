import React, { useState, useEffect } from 'react';
import { Users, Shield, Download, Upload, Trash2, Edit, Plus, Eye, EyeOff, Wrench, AlertCircle, Package } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AuthManager } from '../../utils/authUtils';
import { DataStorage } from '../../utils/dataStorage';
import { SupabaseRegistrationService } from '../../utils/supabaseRegistrationService';
import { SupabaseAuthManager } from '../../utils/supabaseAuthUtils';
import { supabase } from '../../utils/supabaseClient';
import { EquipmentMigration } from '../../utils/equipmentMigration';
import { User, Equipment, Material, MaterialLog } from '../../types';
import DepartmentManager from './DepartmentManager';
import UnauthorizedAccess from '../common/UnauthorizedAccess';
import CompanyManager from './CompanyManager';


interface AdminPanelProps {
  currentUser?: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  // Check if user has admin access
  const hasAdminAccess = currentUser?.role === 'admin' || currentUser?.role === 'developer';
  
  if (!hasAdminAccess) {
    return <UnauthorizedAccess requiredRole="admin" />;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'equipment' | 'materials' | 'companies'>('users');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'operator' as User['role'],
    site: ''
  });
  const [equipmentFormData, setEquipmentFormData] = useState({
    custom_equipment_id: '',
    name: '',
    type: '',
    model: '',
    serialNumber: '',
    site: '',
    status: 'available' as 'available' | 'in-use' | 'maintenance' | 'down'
  });
  const [materialLogFormData, setMaterialLogFormData] = useState({
    material_id: '',
    transaction_type: 'add' as 'add' | 'remove',
    quantity: 0
  });
  const [showPassword, setShowPassword] = useState(false);
  const [customIdError, setCustomIdError] = useState('');
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await loadUsers();
      await loadEquipment();
      await loadMaterials();
    })();
  }, []);

  const loadUsers = async () => {
    if (await AuthManager.useSupabase()) {
      // Load users from Supabase
      try {
        const { data, error } = await supabase!.from('users').select();
        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error loading users from Supabase:', error);
        alert(`Error loading users from Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setUsers([]);
      }
    } else {
      // Fallback: load users from local storage
      const loadedUsers = DataStorage.loadUsers();
      setUsers(loadedUsers);
    }
  };

  const loadMaterials = async () => {
    try {
      if (await AuthManager.useSupabase()) {
        const { data } = await supabase!.from('materials').select();
        setMaterials(data || []);
      } else {
        const loadedMaterials = await DataStorage.loadMaterials();
        setMaterials(loadedMaterials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      alert(`Error loading materials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadEquipment = async () => {
    try {
      if (await AuthManager.useSupabase()) {
        const { data } = await supabase!.from('equipment').select();
        setEquipment(data || []);
      } else {
        const loadedEquipment = await DataStorage.loadEquipment();
        setEquipment(loadedEquipment);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      alert(`Error loading equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await AuthManager.useSupabase()) {
      try {
        const result = await SupabaseAuthManager.createUser({
          ...formData,
          isFirstLogin: false
        });
        if (result.success && result.user) {
          await loadUsers();
          setShowCreateForm(false);
          resetForm();
          alert('User created in Supabase!');
        } else {
          alert('Failed to create user in Supabase: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Supabase createUser error:', error);
        alert('Supabase createUser error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
      return;
    }
    // Local fallback
    const newUser = AuthManager.createUser({
      ...formData,
      isFirstLogin: false
    });
    setUsers([...users, newUser]);
    setShowCreateForm(false);
    resetForm();
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (await AuthManager.useSupabase()) {
      try {
        const result = await SupabaseAuthManager.updateUser(editingUser.id, {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          site: formData.site,
          ...(formData.password && { password: formData.password, isFirstLogin: true })
        });
        if (result.success && result.user) {
          await loadUsers();
          setEditingUser(null);
          resetForm();
          alert('User updated in Supabase!');
        } else {
          alert('Failed to update user in Supabase: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Supabase updateUser error:', error);
        alert('Supabase updateUser error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
      return;
    }
    // Local fallback
    const success = AuthManager.updateUser(editingUser.id, {
      username: formData.username,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      site: formData.site,
      ...(formData.password && { password: formData.password, isFirstLogin: true })
    });
    if (success) {
      loadUsers();
      setEditingUser(null);
      resetForm();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && userToDelete.role === 'developer') {
      alert('Cannot delete the developer user.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    if (await AuthManager.useSupabase()) {
      try {
        const result = await SupabaseAuthManager.deleteUser(userId);
        if (result.success) {
          await loadUsers();
          alert('User deleted from Supabase!');
        } else {
          alert('Failed to delete user in Supabase: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Supabase deleteUser error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
      return;
    }
    // Local fallback
    const success = AuthManager.deleteUser(userId);
    if (success) {
      loadUsers();
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'operator',
      site: ''
    });
    setShowPassword(false);
  };

  const resetEquipmentForm = () => {
    setEquipmentFormData({
      custom_equipment_id: '',
      name: '',
      type: '',
      model: '',
      serialNumber: '',
      site: '',
      status: 'available'
    });
    setCustomIdError('');
  };

  // Equipment validation with debounce
  useEffect(() => {
    if (!equipmentFormData.custom_equipment_id) {
      setCustomIdError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingId(true);
      
      if (!EquipmentMigration.validateCustomEquipmentId(equipmentFormData.custom_equipment_id)) {
        setCustomIdError('Invalid format. Use 1-10 characters: uppercase letters, numbers, and dashes only.');
        setIsCheckingId(false);
        return;
      }
      
      const isUnique = await EquipmentMigration.isCustomEquipmentIdUnique(
        equipmentFormData.custom_equipment_id, 
        editingEquipment?.id
      );
      
      if (!isUnique) {
        setCustomIdError('Custom Equipment ID already exists');
      } else {
        setCustomIdError('');
      }
      
      setIsCheckingId(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [equipmentFormData.custom_equipment_id, editingEquipment?.id]);

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipmentFormData.custom_equipment_id.trim()) {
      setCustomIdError('Custom Equipment ID is required');
      return;
    }

    if (customIdError) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (editingEquipment) {
        // Update existing equipment
        const updatedEquipment: Equipment = {
          ...editingEquipment,
          ...equipmentFormData,
          lastUpdated: new Date().toISOString()
        };
        
        if (await AuthManager.useSupabase()) {
          const result = await SupabaseRegistrationService.updateEquipment(updatedEquipment);
          if (result.success && result.data) {
            const updatedList = equipment.map(eq => 
              eq.id === editingEquipment.id ? result.data! : eq
            );
            setEquipment(updatedList);
            DataStorage.saveEquipment(updatedList);
            alert(`Equipment ${result.data.name} updated successfully!`);
          } else {
            throw new Error(result.error || 'Failed to update equipment');
          }
        } else {
          const updatedList = equipment.map(eq => 
            eq.id === editingEquipment.id ? updatedEquipment : eq
          );
          setEquipment(updatedList);
          DataStorage.saveEquipment(updatedList);
          alert(`Equipment ${updatedEquipment.name} updated successfully!`);
        }
        
        setEditingEquipment(null);
      } else {
        // Create new equipment
        if (await AuthManager.useSupabase()) {
          const newEquipment: Equipment = {
            ...equipmentFormData,
            id: '', // Will be generated by Supabase
            qrCode: equipmentFormData.custom_equipment_id,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          const result = await SupabaseRegistrationService.createEquipment(newEquipment);
          if (result.success && result.data) {
            const updatedList = [...equipment, result.data];
            setEquipment(updatedList);
            DataStorage.saveEquipment(updatedList);
            alert(`Equipment ${result.data.name} (${result.data.custom_equipment_id}) created successfully!`);
          } else {
            throw new Error(result.error || 'Failed to create equipment');
          }
        } else {
          const equipmentId = uuidv4();
          const newEquipment: Equipment = {
            ...equipmentFormData,
            id: equipmentId,
            qrCode: equipmentFormData.custom_equipment_id,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          const updatedList = [...equipment, newEquipment];
          setEquipment(updatedList);
          DataStorage.saveEquipment(updatedList);
          alert(`Equipment ${newEquipment.name} (${newEquipment.custom_equipment_id}) created successfully!`);
        }
      }
      
      resetEquipmentForm();
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error saving equipment:', error);
      alert(`Failed to save equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      setIsLoading(true);
      
      try {
        if (await AuthManager.useSupabase()) {
          const result = await SupabaseRegistrationService.deleteEquipment(equipmentId);
          if (result.success) {
            const updatedList = equipment.filter(eq => eq.id !== equipmentId);
            setEquipment(updatedList);
            DataStorage.saveEquipment(updatedList);
            alert('Equipment deleted successfully!');
          } else {
            throw new Error(result.error || 'Failed to delete equipment');
          }
        } else {
          const updatedList = equipment.filter(eq => eq.id !== equipmentId);
          setEquipment(updatedList);
          DataStorage.saveEquipment(updatedList);
          alert('Equipment deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting equipment:', error);
        alert(`Failed to delete equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setEquipmentFormData({
      custom_equipment_id: equipment.custom_equipment_id,
      name: equipment.name,
      type: equipment.type,
      model: equipment.model || '',
      serialNumber: equipment.serialNumber || '',
      site: equipment.site,
      status: equipment.status
    });
    setShowCreateForm(true);
  };

  const cancelEditEquipment = () => {
    setEditingEquipment(null);
    setShowCreateForm(false);
    resetEquipmentForm();
  };

  const exportEquipment = () => {
    DataStorage.downloadEquipmentCSV(equipment);
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email,
      role: user.role,
      site: user.site || ''
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    resetForm();
  };

  const exportUsers = () => {
    DataStorage.downloadUsersCSV(users);
  };

  const handleLogMaterial = async (formData: { material_id: string; transaction_type: 'add' | 'remove'; quantity: number }) => {
    if (!formData.material_id || formData.quantity <= 0) throw new Error('Invalid input');
    
    const material = materials.find(m => m.id === formData.material_id);
    if (!material) throw new Error('Material not found');
    
    if (formData.transaction_type === 'remove' && material.quantity < formData.quantity) {
      throw new Error('Insufficient quantity');
    }
    
    // Use the proper logManager to handle material logging
    const { logManager } = await import('../../utils/logManager');
    
    const action = formData.transaction_type === 'add' ? 'material-in' : 'material-out';
    
    await logManager.createMaterialLog(
      material,
      action,
      formData.quantity,
      material.site,
      'completed',
      `Material ${action} via Admin Panel`
    );
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleLogMaterial(materialLogFormData);
      await loadMaterials();
      setMaterialLogFormData({ material_id: '', transaction_type: 'add', quantity: 0 });
      alert('Material log created successfully!');
    } catch (error) {
      console.error('Error creating material log:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'operator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'users', label: 'Users' },
    { id: 'departments', label: 'Departments' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'materials', label: 'Materials' },
    { id: 'companies', label: 'Companies' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex space-x-1 p-1 bg-gray-50 rounded-t-xl overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 justify-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-800 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'departments' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <DepartmentManager />
        </div>
      )}

      {activeTab === 'companies' && (
        <CompanyManager />
      )}

      {activeTab === 'materials' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Material Inventory Management</h2>
            </div>
          </div>

          {/* Material Log Form */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Material Log</h3>
            <form onSubmit={handleSubmitLog} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select
                  value={materialLogFormData.material_id}
                  onChange={(e) => setMaterialLogFormData({...materialLogFormData, material_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} (Current: {material.quantity} {material.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={materialLogFormData.transaction_type}
                  onChange={(e) => setMaterialLogFormData({...materialLogFormData, transaction_type: e.target.value as 'add' | 'remove'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={materialLogFormData.quantity}
                  onChange={(e) => setMaterialLogFormData({...materialLogFormData, quantity: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Log
                </button>
              </div>
            </form>
          </div>

          {/* Materials Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Material ID</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Unit</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Site</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 font-mono">
                      {material.id}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {material.name}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {material.type}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 font-semibold">
                      {material.quantity}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {material.unit}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {material.site}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        material.status === 'available' ? 'bg-green-100 text-green-800' :
                        material.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {material.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex items-center space-x-3">
              <Wrench className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Equipment Management</h2>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={exportEquipment}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => {
                  resetEquipmentForm();
                  setEditingEquipment(null);
                  setShowCreateForm(true);
                }}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Equipment</span>
              </button>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Custom ID</th>
                  <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Name</th>
                  <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Type</th>
                  <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Model</th>
                  <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Site</th>
                  <th className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Status</th>
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
                    <td className="border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditEquipment(eq)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                          title="Edit Equipment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
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

          {/* Create/Edit Equipment Modal */}
          {showCreateForm && activeTab === 'equipment' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingEquipment ? 'Edit Equipment' : 'Create New Equipment'}
                </h3>
                <form onSubmit={handleCreateEquipment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Equipment ID *
                    </label>
                    <input
                      type="text"
                      value={equipmentFormData.custom_equipment_id}
                      onChange={(e) => setEquipmentFormData({ 
                        ...equipmentFormData, 
                        custom_equipment_id: e.target.value.toUpperCase() 
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        customIdError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter Custom Equipment ID (e.g., EQP-001)"
                      required
                      maxLength={10}
                    />
                    {isCheckingId && (
                      <div className="text-sm text-blue-600 mt-1">
                        Checking availability...
                      </div>
                    )}
                    {customIdError && (
                      <div className="text-sm text-red-600 mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {customIdError}
                      </div>
                    )}
                    {!customIdError && equipmentFormData.custom_equipment_id && !isCheckingId && (
                      <div className="text-sm text-green-600 mt-1">
                        ✓ Custom ID is available
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      1-10 characters: uppercase letters, numbers, and dashes only.
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      value={equipmentFormData.name}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipment Type *
                    </label>
                    <input
                      type="text"
                      value={equipmentFormData.type}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={equipmentFormData.model}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={equipmentFormData.serialNumber}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, serialNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site *
                    </label>
                    <input
                      type="text"
                      value={equipmentFormData.site}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, site: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={equipmentFormData.status}
                      onChange={(e) => setEquipmentFormData({ 
                        ...equipmentFormData, 
                        status: e.target.value as 'available' | 'in-use' | 'maintenance' | 'down'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="available">Available</option>
                      <option value="in-use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="down">Down</option>
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading || !!customIdError}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Saving...' : (editingEquipment ? 'Update Equipment' : 'Create Equipment')}
                    </button>
                    <button
                      type="button"
                      onClick={editingEquipment ? cancelEditEquipment : () => setShowCreateForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">User Management</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={exportUsers}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Users</span>
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">User</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Username</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Role</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Site</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Last Login</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-gray-600">{user.username}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-gray-600">{user.site || 'All Sites'}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isFirstLogin ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.isFirstLogin ? 'First Login' : 'Active'}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Create/Edit User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!editingUser}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editingUser?.role === 'developer'}
                  required
                >
                  <option value="viewer">Viewer (Level 4)</option>
                  <option value="operator">Operator (Level 3)</option>
                  <option value="manager">Manager (Level 2)</option>
                  <option value="admin">Admin (Level 1)</option>
                  <option value="developer">Developer (Level 0)</option>
                </select>
                {editingUser?.role === 'developer' && (
                  <p className="text-xs text-gray-500 mt-1">Developer role cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site (Optional)</label>
                <input
                  type="text"
                  value={formData.site}
                  onChange={(e) => setFormData({...formData, site: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave blank for all sites"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;