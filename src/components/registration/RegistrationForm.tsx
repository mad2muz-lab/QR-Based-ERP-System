import React, { useState, useEffect } from 'react';
import { Users, Wrench, Package, Building, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { generateEntityId } from '../../utils/qrCodeUtils';
import { Employee, Equipment, Material, Site, User } from '../../types';
import { AuthManager } from '../../utils/authUtils';
import UnifiedListView from './UnifiedListView';
import { CSVAppendManager } from '../../utils/csvAppendUtils';
import QRCodeDisplay from './QRCodeDisplay';
import UnauthorizedAccess from '../common/UnauthorizedAccess';

// Import modular components
import EmployeeForm from './forms/EmployeeForm';
import EquipmentForm from './forms/EquipmentForm';
import MaterialForm from './forms/MaterialForm';
import SiteForm from './forms/SiteForm';
import EmployeeList from './lists/EmployeeList';
import EquipmentList from './lists/EquipmentList';
import MaterialList from './lists/MaterialList';
import SiteList from './lists/SiteList';
import DepartmentManager from '../admin/DepartmentManager';

// Import page components
import EmployeesPage from '../pages/EmployeesPage';
import EquipmentPage from '../pages/EquipmentPage';
import MaterialsPage from '../pages/MaterialsPage';
import SitesPage from '../pages/SitesPage';

// Import Excel utilities
import {
  downloadEmployeeTemplate,
  downloadEquipmentTemplate,
  downloadMaterialTemplate,
  downloadSiteTemplate,
  exportEmployeesToExcel,
  exportEquipmentToExcel,
  exportMaterialsToExcel,
  exportSitesToExcel,
  importEmployeesFromExcel,
  importEquipmentFromExcel,
  importMaterialsFromExcel,
  importSitesFromExcel
} from '../../utils/excelUtils';

interface RegistrationFormProps {
  currentUser?: User;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ currentUser }) => {
  // Check if user has manager access
  const hasManagerAccess = AuthManager.hasPermission('manager');
  
  if (!hasManagerAccess) {
    return <UnauthorizedAccess requiredRole="manager" />;
  }

  const [activeTab, setActiveTab] = useState<'employees' | 'equipment' | 'materials' | 'sites'>('employees');
  const [activeView, setActiveView] = useState<'form' | 'list'>('form');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [showDepartmentManager, setShowDepartmentManager] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'list' | 'unified'>('form');
  const [showQRCode, setShowQRCode] = useState(false);
  const [newEntity, setNewEntity] = useState<{type: string; data: any} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to toggle between form and list views
  const toggleView = () => {
    if (activeView === 'form') {
      setActiveView('list');
      setViewMode('unified');
    } else {
      setActiveView('form');
      setViewMode('form');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEmployees(DataStorage.loadEmployees());
    setEquipment(DataStorage.loadEquipment());
    setMaterials(DataStorage.loadMaterials());
    setSites(DataStorage.loadSites());
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Employee handlers
  const handleEmployeeSubmit = (employeeData: Omit<Employee, 'id' | 'createdAt' | 'qrCode'>) => {
    // Generate QR code using the manual employee ID
    const newEmployee: Employee = {
      ...employeeData,
      id: employeeData.id || generateEntityId('employee'),
      qrCode: employeeData.id || generateEntityId('employee'), // Use the manual ID as QR code
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      accessLevel: 'basic'
    };

    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    DataStorage.saveEmployees(updatedEmployees);
    
    // Show QR code for the new employee
    setNewEntity({type: 'employee', data: newEmployee});
    setShowQRCode(true);
    
    showMessage('success', `Employee ${newEmployee.name} registered successfully!`);
  };

  const handleEmployeeEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      ...employee,
      customType: '',
      type: employee.type || ''
    });
    setActiveView('form');
  };

  const handleEmployeeDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      const updatedEmployees = employees.filter(emp => emp.id !== id);
      setEmployees(updatedEmployees);
      DataStorage.saveEmployees(updatedEmployees);
      showMessage('success', 'Employee deleted successfully!');
    }
  };

  // Equipment handlers
  const handleEquipmentSubmit = (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'qrCode'>) => {
    // Generate ID if not provided
    const equipmentId = equipmentData.id || DataStorage.generateEquipmentId();
    
    const newEquipment: Equipment = {
      ...equipmentData,
      id: equipmentId,
      qrCode: equipmentId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    const updatedEquipment = [...equipment, newEquipment];
    setEquipment(updatedEquipment);
    DataStorage.saveEquipment(updatedEquipment);
    
    // Show QR code for the new equipment
    setNewEntity({type: 'equipment', data: newEquipment});
    setShowQRCode(true);
    
    showMessage('success', `Equipment ${newEquipment.name} registered successfully!`);
  };

  const handleEquipmentEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormData({
      ...eq,
      customType: '',
      type: eq.type || ''
    });
    setActiveView('form');
  };

  const handleEquipmentDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      const updatedEquipment = equipment.filter(eq => eq.id !== id);
      setEquipment(updatedEquipment);
      DataStorage.saveEquipment(updatedEquipment);
      showMessage('success', 'Equipment deleted successfully!');
    }
  };

  // Material handlers
  const handleMaterialSubmit = (materialData: Omit<Material, 'id' | 'createdAt' | 'qrCode'>) => {
    const materialId = materialData.id || DataStorage.generateMaterialId();
    
    const newMaterial: Material = {
      ...materialData,
      id: materialId,
      qrCode: materialId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    const updatedMaterials = [...materials, newMaterial];
    setMaterials(updatedMaterials);
    DataStorage.saveMaterials(updatedMaterials);
    
    // Show QR code for the new material
    setNewEntity({type: 'material', data: newMaterial});
    setShowQRCode(true);
    
    showMessage('success', `Material ${newMaterial.name} registered successfully!`);
  };

  const handleMaterialEdit = (material: Material) => {
    setEditingMaterial(material);
    setActiveView('form');
  };

  const handleMaterialDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      const updatedMaterials = materials.filter(mat => mat.id !== id);
      setMaterials(updatedMaterials);
      DataStorage.saveMaterials(updatedMaterials);
      showMessage('success', 'Material deleted successfully!');
    }
  };

  // Site handlers
  const handleSiteSubmit = (siteData: Omit<Site, 'id' | 'lastUpdated'>) => {
    const siteId = siteData.id || DataStorage.generateSiteId();
    
    const newSite: Site = {
      ...siteData,
      id: siteId,
      lastUpdated: new Date().toISOString()
    };

    const updatedSites = [...sites, newSite];
    setSites(updatedSites);
    DataStorage.saveSites(updatedSites);
    
    // Show QR code for the new site
    setNewEntity({type: 'site', data: newSite});
    setShowQRCode(true);
    
    showMessage('success', `Site ${newSite.name} registered successfully!`);
  };

  const handleSiteEdit = (site: Site) => {
    setEditingSite(site);
    setActiveView('form');
  };

  const handleSiteDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      const updatedSites = sites.filter(site => site.id !== id);
      setSites(updatedSites);
      DataStorage.saveSites(updatedSites);
      showMessage('success', 'Site deleted successfully!');
    }
  };

  // Import handlers
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage({ type: 'success', text: 'Processing import file...' });
    try {
      let importedData: any[] = [];
      
      switch (type) {
        case 'employees':
          importedData = await importEmployeesFromExcel(file);
          
          // Process imported employees and generate QR codes
          break;
        case 'equipment':
          importedData = await importEquipmentFromExcel(file);
          break;
        case 'materials':
          importedData = await importMaterialsFromExcel(file);
          break;
        case 'sites':
          importedData = await importSitesFromExcel(file);
          break;
      }

      if (importedData.length > 0) {
        let result: { success: boolean; message: string; errors?: string[] };

        switch (type) {
          case 'employees':
            const processedEmployees = importedData.map(item => ({
              ...item,
              id: item.id || `EMP-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
              qrCode: item.id || `EMP-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            }));
            result = DataStorage.bulkAddEmployees(processedEmployees);
            break;
          case 'equipment':
            const processedEquipment = importedData.map((item, index) => {
              const equipment = {
                ...item,
                id: item.id || `EQP-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                qrCode: item.id || `EQP-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
              };
              // Show QR code for the last item if import is successful
              if (index === importedData.length - 1) {
                setTimeout(() => {
                  setNewEntity({type: 'equipment', data: equipment});
                  setShowQRCode(true);
                }, 1000);
              }
              return equipment;
            });
            result = DataStorage.bulkAddEquipment(processedEquipment);
            break;
          case 'materials':
            const processedMaterials = importedData.map((item, index) => {
              const material = {
                ...item,
                id: item.id || `MAT-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                qrCode: item.id || `MAT-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
              };
              // Show QR code for the last item if import is successful
              if (index === importedData.length - 1) {
                setTimeout(() => {
                  setNewEntity({type: 'material', data: material});
                  setShowQRCode(true);
                }, 1000);
              }
              return material;
            });
            result = DataStorage.bulkAddMaterials(processedMaterials);
            break;
          case 'sites':
            const processedSites = importedData.map(item => ({
              ...item,
              id: item.id || `SITE-${Date.now().toString().slice(-5)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
              lastUpdated: new Date().toISOString()
            }));
            result = DataStorage.bulkAddSites(processedSites);
            break;
          default:
            result = { success: false, message: 'Unknown import type' };
        }

        if (result.success) {
          loadData(); // Refresh the display
          showMessage('success', result.message);
        } else {
          let errorMessage = result.message;
          if (result.errors && result.errors.length > 0) {
            errorMessage += '\n\nErrors:\n' + result.errors.slice(0, 5).join('\n');
            if (result.errors.length > 5) {
              errorMessage += `\n... and ${result.errors.length - 5} more errors`;
            }
          }
          showMessage('error', errorMessage);
        }
      } else {
        showMessage('error', 'No valid data found in the imported file');
      }
    } catch (error) {
      console.error('Import error:', error);
      showMessage('error', `Failed to import ${type}. Please check the file format and try again.`);
    }

    // Reset file input
    event.target.value = '';
  };

  const tabs = [
    { id: 'employees', label: 'Employees', icon: Users, count: employees.length },
    { id: 'equipment', label: 'Equipment', icon: Wrench, count: equipment.length },
    { id: 'materials', label: 'Materials', icon: Package, count: materials.length },
    { id: 'sites', label: 'Sites', icon: Building, count: sites.length },
    ...(currentUser?.role === 'admin' || currentUser?.role === 'developer' ? [
      { id: 'departments', label: 'Departments', icon: Building, count: 0 }
    ] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Loading registration forms...</span>
        </div>
      )}
      
      {/* Message Display */}
      {!isLoading && message && (
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

      {/* Tab Navigation */}
      {!isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex space-x-1 p-1 bg-gray-50 rounded-t-xl">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-blue-800 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Department Manager for Admins */}
            {activeTab === 'departments' && (currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
              <DepartmentManager onDepartmentUpdate={loadData} />
            )}

            {/* View Toggle Button */}
            {activeTab !== 'departments' && (
              <div className="flex justify-end mb-6">
                <div className="flex space-x-3 mr-auto">
                  {activeTab === 'employees' && (
                    <>
                      <button
                        onClick={() => downloadEmployeeTemplate()}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Template</span>
                      </button>
                      <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                        <input 
                          type="file" 
                          accept=".xlsx,.xls" 
                          onChange={(e) => handleImport(e, 'employees')} 
                          className="hidden" 
                        />
                      </label>
                      <button
                        onClick={() => exportEmployeesToExcel(employees)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </>
                  )}
                  {activeTab === 'equipment' && (
                    <>
                      <button
                        onClick={() => downloadEquipmentTemplate()}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Template</span>
                      </button>
                      <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                        <input 
                          type="file" 
                          accept=".xlsx,.xls" 
                          onChange={(e) => handleImport(e, 'equipment')} 
                          className="hidden" 
                        />
                      </label>
                      <button
                        onClick={() => exportEquipmentToExcel(equipment)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </>
                  )}
                  {activeTab === 'materials' && (
                    <>
                      <button
                        onClick={() => downloadMaterialTemplate()}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Template</span>
                      </button>
                      <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                        <input 
                          type="file" 
                          accept=".xlsx,.xls" 
                          onChange={(e) => handleImport(e, 'materials')} 
                          className="hidden" 
                        />
                      </label>
                      <button
                        onClick={() => exportMaterialsToExcel(materials)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </>
                  )}
                  {activeTab === 'sites' && (
                    <>
                      <button
                        onClick={() => downloadSiteTemplate()}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Template</span>
                      </button>
                      <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                        <input 
                          type="file" 
                          accept=".xlsx,.xls" 
                          onChange={(e) => handleImport(e, 'sites')} 
                          className="hidden" 
                        />
                      </label>
                      <button
                        onClick={() => exportSitesToExcel(sites)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </>
                  )}
                </div>
                {activeView === 'form' ? (
                  <button
                    onClick={toggleView}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>View All</span>
                  </button>
                ) : (
                  <button
                    onClick={toggleView}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>Registration Form</span>
                  </button>
                )}
              </div>
            )}
            
            {/* Registration Forms */}
            {activeTab !== 'departments' && activeView === 'form' && (
              <>
                {activeTab === 'employees' && (
                  <EmployeeForm 
                    sites={sites}
                    onSubmit={handleEmployeeSubmit}
                    initialData={editingEmployee}
                  />
                )}
                {activeTab === 'equipment' && (
                  <EquipmentForm 
                    sites={sites}
                    onSubmit={handleEquipmentSubmit}
                    initialData={editingEquipment}
                  />
                )}
                {activeTab === 'materials' && (
                  <MaterialForm 
                    sites={sites}
                    onSubmit={handleMaterialSubmit}
                    initialData={editingMaterial}
                  />
                )}
                {activeTab === 'sites' && (
                  <SiteForm 
                    onSubmit={handleSiteSubmit}
                    initialData={editingSite}
                  />
                )}
              </>
            )}
            
            {/* Comprehensive List Views */}
            {activeTab !== 'departments' && activeView === 'list' && (
              <>
                {activeTab === 'employees' && (
                  <UnifiedListView 
                    type="employees" 
                    onEdit={handleEmployeeEdit} 
                    onDelete={handleEmployeeDelete}
                    onImport={(e) => handleImport(e, 'employees')}
                    onExport={() => exportEmployeesToExcel(employees)}
                  />
                )}
                {activeTab === 'equipment' && (
                  <UnifiedListView 
                    type="equipment" 
                    onEdit={handleEquipmentEdit} 
                    onDelete={handleEquipmentDelete}
                    onImport={(e) => handleImport(e, 'equipment')}
                    onExport={() => exportEquipmentToExcel(equipment)}
                  />
                )}
                {activeTab === 'materials' && (
                  <UnifiedListView 
                    type="materials" 
                    onEdit={handleMaterialEdit} 
                    onDelete={handleMaterialDelete}
                    onImport={(e) => handleImport(e, 'materials')}
                    onExport={() => exportMaterialsToExcel(materials)}
                  />
                )}
                {activeTab === 'sites' && (
                  <UnifiedListView 
                    type="sites" 
                    onEdit={handleSiteEdit} 
                    onDelete={handleSiteDelete}
                    onImport={(e) => handleImport(e, 'sites')}
                    onExport={() => exportSitesToExcel(sites)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* QR Code Display Modal */}
      {showQRCode && newEntity && (
        <QRCodeDisplay 
          entity={newEntity.data} 
          entityType={newEntity.type} 
          onClose={() => setShowQRCode(false)}
          showMultiple={false}
        />
      )}
    </div>
  );
};

export default RegistrationForm;