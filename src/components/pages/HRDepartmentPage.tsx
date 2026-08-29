import React, { useState, useEffect } from 'react';
import { User, Users, Calendar, Award, Shield, CreditCard, FileText, Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { Employee } from '../../types';
import { DataStorage } from '../../utils/dataStorage';
import { AuthManager } from '../../utils/authUtils';
import EnhancedEmployeeForm from '../registration/forms/EnhancedEmployeeForm';

interface HRDepartmentPageProps {
  currentUser?: any;
}

const HRDepartmentPage: React.FC<HRDepartmentPageProps> = ({ currentUser }) => {
  console.log('🚀 HRDepartmentPage component is loading...');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'attendance' | 'payroll' | 'training' | 'performance' | 'reports'>('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    console.log('🔧 HRDepartmentPage useEffect triggered');
    loadEmployees();
    loadDepartments();
  }, []);

  const loadEmployees = async () => {
    console.log('🔍 Loading employees in HRDepartmentPage...');
    try {
      const useSupabase = await AuthManager.useSupabase();
      let loadedEmployees: Employee[] = [];
      
      if (useSupabase) {
        // Load from Supabase
        // TODO: Implement Supabase employee loading
        loadedEmployees = [];
      } else {
        // Load from local storage
        loadedEmployees = DataStorage.loadEmployees();
      }
      
      console.log('📋 Loaded employees:', loadedEmployees.length);
      setEmployees(loadedEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    console.log('🔍 Loading departments in HRDepartmentPage...');
    const loadedDepartments = DataStorage.loadDepartments();
    console.log('📋 Loaded departments:', loadedDepartments.length);
    setDepartments(loadedDepartments);
  };

  const handleEmployeeSubmit = async (employeeData: Omit<Employee, 'createdAt' | 'qrCode'>, isEdit?: boolean) => {
    try {
      const useSupabase = await AuthManager.useSupabase();
      
      if (useSupabase) {
        // TODO: Implement Supabase employee saving
        console.log('Saving to Supabase:', employeeData);
      } else {
        // Save to local storage
        const currentEmployees = DataStorage.loadEmployees();
        
        if (isEdit && editingEmployee) {
          // Update existing employee
          const updatedEmployees = currentEmployees.map(emp => 
            emp.id === editingEmployee.id 
              ? { ...employeeData, createdAt: emp.createdAt, qrCode: emp.qrCode }
              : emp
          );
          DataStorage.saveEmployees(updatedEmployees);
        } else {
          // Add new employee
          const newEmployee: Employee = {
            ...employeeData,
            createdAt: new Date().toISOString(),
            qrCode: `QR-${employeeData.id}`
          };
          DataStorage.saveEmployees([...currentEmployees, newEmployee]);
        }
      }
      
      setShowEmployeeForm(false);
      setEditingEmployee(null);
      loadEmployees(); // Reload employees
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || employee.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getEmployeeStats = () => {
    const total = employees.length;
    const active = employees.filter(emp => emp.status === 'active').length;
    const departments = [...new Set(employees.map(emp => emp.department))];
    
    return {
      total,
      active,
      inactive: total - active,
      departments: departments.length
    };
  };

  const stats = getEmployeeStats();

  const renderOverview = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">HR Overview</h3>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <User className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.departments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(emp => {
                  const createdDate = new Date(emp.createdAt);
                  const now = new Date();
                  return createdDate.getMonth() === now.getMonth() && 
                         createdDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
          onClick={() => {
            setEditingEmployee(null);
            setShowEmployeeForm(true);
          }}
          className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
            <Plus className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Add Employee</span>
          </button>
          
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Attendance</span>
          </button>
          
          <button
            onClick={() => setActiveTab('payroll')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Payroll</span>
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Reports</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Employee Management</h3>
        <button
          onClick={() => {
            setEditingEmployee(null);
            setShowEmployeeForm(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
          
          <div className="flex space-x-2">
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {employee.photo ? (
                            <img className="h-10 w-10 rounded-full" src={employee.photo} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Attendance Management</h3>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-600">Attendance management features coming soon...</p>
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Payroll Management</h3>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-600">Payroll management features coming soon...</p>
      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Training & Development</h3>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-600">Training management features coming soon...</p>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Performance Management</h3>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-600">Performance management features coming soon...</p>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">HR Reports</h3>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-600">Reporting features coming soon...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Human Resources</h1>
        <p className="text-gray-600">Manage employees, attendance, payroll, and HR processes</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'employees', label: 'Employees', icon: Users },
            { id: 'attendance', label: 'Attendance', icon: Calendar },
            { id: 'payroll', label: 'Payroll', icon: CreditCard },
            { id: 'training', label: 'Training', icon: Award },
            { id: 'performance', label: 'Performance', icon: Award },
            { id: 'reports', label: 'Reports', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'employees' && renderEmployees()}
        {activeTab === 'attendance' && renderAttendance()}
        {activeTab === 'payroll' && renderPayroll()}
        {activeTab === 'training' && renderTraining()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'reports' && renderReports()}
      </div>

      {/* Enhanced Employee Form Modal */}
      {showEmployeeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EnhancedEmployeeForm
              sites={departments.map(dept => ({ id: dept.id, name: dept.name }))}
              onSubmit={handleEmployeeSubmit}
              initialData={editingEmployee || null}
              onClose={() => {
                setShowEmployeeForm(false);
                setEditingEmployee(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDepartmentPage;
