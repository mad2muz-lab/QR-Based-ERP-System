import React, { useState, useEffect } from 'react';
import { DataStorage } from '../../utils/dataStorage';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { AuthManager } from '../../utils/authUtils';
import MaintenancePage from './MaintenancePage';
import { Building2, Wrench, Users, Truck, Shield, Settings, Package, Briefcase } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastUpdated: string;
  type?: string;
}

const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState<string>('maintenance');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const useSupabase = await AuthManager.useSupabase();
      let loadedDepartments: Department[] = [];
      
      if (useSupabase) {
        // Load from Supabase
        loadedDepartments = await SupabaseDataService.getDepartments();
      } else {
        // Load from local storage
        loadedDepartments = DataStorage.loadDepartments();
      }
      
      setDepartments(loadedDepartments);
      
      // Set default active tab to maintenance if it exists
      const maintenanceDept = loadedDepartments.find(dept => 
        dept.name.toLowerCase() === 'maintenance'
      );
      if (maintenanceDept) {
        setActiveTab(maintenanceDept.id);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      // Fallback to local storage
      const loadedDepartments = DataStorage.loadDepartments();
      setDepartments(loadedDepartments);
      
      const maintenanceDept = loadedDepartments.find(dept => 
        dept.name.toLowerCase() === 'maintenance'
      );
      if (maintenanceDept) {
        setActiveTab(maintenanceDept.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentIcon = (departmentName: string) => {
    const name = departmentName.toLowerCase();
    if (name.includes('maintenance')) return Wrench;
    if (name.includes('construction')) return Building2;
    if (name.includes('operations')) return Settings;
    if (name.includes('engineering')) return Wrench;
    if (name.includes('safety')) return Shield;
    if (name.includes('admin')) return Briefcase;
    if (name.includes('procurement')) return Package;
    if (name.includes('logistics')) return Truck;
    if (name.includes('inventory')) return Package;
    return Users; // default icon
  };

  const renderDepartmentContent = (department: Department) => {
    const departmentName = department.name.toLowerCase();
    
    // Special handling for maintenance department
    if (departmentName.includes('maintenance')) {
      return <MaintenancePage />;
    }
    
    // Placeholder content for other departments
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              {React.createElement(getDepartmentIcon(department.name), { className: "w-6 h-6 text-blue-600" })}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{department.name} Dashboard</h1>
              <p className="text-gray-600">{department.description || 'Department overview and management'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasks</p>
                <p className="text-2xl font-bold text-purple-600">0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Department Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Department Name</label>
              <p className="mt-1 text-sm text-gray-900">{department.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900">{department.description || 'No description available'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="mt-1 text-sm text-gray-900">{new Date(department.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">{new Date(department.lastUpdated).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-gray-600">
            Detailed {department.name} department functionality is under development. 
            This will include department-specific data, reports, and management tools.
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="text-gray-600">Manage and view department-specific information</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {departments.map((department) => {
              const Icon = getDepartmentIcon(department.name);
              return (
                <button
                  key={department.id}
                  onClick={() => setActiveTab(department.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === department.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{department.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {(() => {
            const activeDepartment = departments.find(dept => dept.id === activeTab);
            if (activeDepartment) {
              return renderDepartmentContent(activeDepartment);
            }
            return (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p>No department selected</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default DepartmentsPage; 