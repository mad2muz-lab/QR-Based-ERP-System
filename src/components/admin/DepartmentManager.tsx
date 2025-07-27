import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { AuthManager } from '../../utils/authUtils';
import UnifiedListView from '../registration/UnifiedListView';

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastUpdated: string;
}

interface DepartmentManagerProps {
  onDepartmentUpdate?: () => void;
}

const DepartmentManager: React.FC<DepartmentManagerProps> = ({ onDepartmentUpdate }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const useSupabase = await AuthManager.shouldUseSupabase();
      let loadedDepartments: Department[] = [];
      
      if (useSupabase) {
        // Load from Supabase
        loadedDepartments = await SupabaseDataService.getDepartments();
      } else {
        // Load from local storage
        loadedDepartments = DataStorage.loadDepartments();
      }
      
      setDepartments(loadedDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
      // Fallback to local storage
      const loadedDepartments = DataStorage.loadDepartments();
      setDepartments(loadedDepartments);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const validateDepartmentName = (name: string, excludeId?: string): boolean => {
    const trimmedName = name.trim().toLowerCase();
    return !departments.some(dept => 
      dept.name.toLowerCase() === trimmedName && dept.id !== excludeId
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showMessage('error', 'Department name is required');
      return;
    }

    if (!validateDepartmentName(formData.name, editingDepartment?.id)) {
      showMessage('error', 'Department name already exists');
      return;
    }

    if (editingDepartment) {
      // Update existing department
      const updatedDepartment: Department = {
        ...editingDepartment,
        name: formData.name.trim(),
        description: formData.description.trim(),
        lastUpdated: new Date().toISOString()
      };

      const updatedDepartments = departments.map(dept =>
        dept.id === editingDepartment.id ? updatedDepartment : dept
      );

      setDepartments(updatedDepartments);
      
      // Save to appropriate storage
      const useSupabase = await AuthManager.shouldUseSupabase();
      if (useSupabase) {
        // Save to Supabase
        const result = await SupabaseDataService.updateDepartment(updatedDepartment);
        if (!result.success) {
          console.error('Failed to update department in Supabase:', result.error);
          // Fallback to local storage
          DataStorage.saveDepartments(updatedDepartments);
        }
      } else {
        // Save to local storage
        DataStorage.saveDepartments(updatedDepartments);
      }
      
      DataStorage.logTransaction('department', 'update', updatedDepartment);
      showMessage('success', 'Department updated successfully');
    } else {
      // Create new department
      const newDepartment: Department = {
        id: `dept-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const updatedDepartments = [...departments, newDepartment];
      setDepartments(updatedDepartments);
      
      // Save to appropriate storage
      const useSupabase = await AuthManager.shouldUseSupabase();
      if (useSupabase) {
        // Save to Supabase
        const result = await SupabaseDataService.createDepartment({
          name: newDepartment.name,
          description: newDepartment.description
        });
        if (!result.success) {
          console.error('Failed to create department in Supabase:', result.error);
          // Fallback to local storage
          DataStorage.saveDepartments(updatedDepartments);
        }
      } else {
        // Save to local storage
        DataStorage.saveDepartments(updatedDepartments);
      }
      
      DataStorage.logTransaction('department', 'create', newDepartment);
      showMessage('success', 'Department created successfully');
    }

    resetForm();
    onDepartmentUpdate?.();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingDepartment(null);
    setShowAddForm(false);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (department: Department) => {
    if (window.confirm(`Are you sure you want to delete "${department.name}"?`)) {
      const updatedDepartments = departments.filter(dept => dept.id !== department.id);
      setDepartments(updatedDepartments);
      
      // Save to appropriate storage
      const useSupabase = await AuthManager.shouldUseSupabase();
      if (useSupabase) {
        // Delete from Supabase
        const result = await SupabaseDataService.deleteDepartment(department.id);
        if (!result.success) {
          console.error('Failed to delete department from Supabase:', result.error);
          // Fallback to local storage
          DataStorage.saveDepartments(updatedDepartments);
        }
      } else {
        // Save to local storage
        DataStorage.saveDepartments(updatedDepartments);
      }
      
      DataStorage.logTransaction('department', 'delete', department);
      showMessage('success', 'Department deleted successfully');
      onDepartmentUpdate?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Department Management</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">
            {editingDepartment ? 'Edit Department' : 'Add New Department'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department description (optional)"
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingDepartment ? 'Update' : 'Create'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Departments List */}
      {viewMode === 'list' ? (
        <UnifiedListView 
          type="departments" 
          onEdit={handleEdit} 
          onDelete={(id) => {
            const department = departments.find(d => d.id === id);
            if (department) handleDelete(department);
          }}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">Existing Departments ({departments.length})</h4>
          </div>
        
          {departments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No departments created yet.</p>
              <p className="text-sm">Add your first department to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {departments.map(department => (
                <div key={department.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{department.name}</h5>
                      {department.description && (
                        <p className="text-sm text-gray-600 mt-1">{department.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(department.createdAt).toLocaleDateString()}
                        {department.lastUpdated !== department.createdAt && (
                          <span className="ml-2">
                            • Updated: {new Date(department.lastUpdated).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(department)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(department)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentManager;