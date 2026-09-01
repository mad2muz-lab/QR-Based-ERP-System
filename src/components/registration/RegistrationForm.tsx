import React, { useState, useEffect } from 'react';
import { Users, Package, Building, Download, Upload, CheckCircle, AlertCircle, RefreshCw, Database, Wifi } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DataStorage } from '../../utils/dataStorage';
import { generateEntityId } from '../../utils/qrCodeUtils';
import { Employee, Equipment, Material, User } from '../../types';
import { AuthManager } from '../../utils/authUtils';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { SupabaseRegistrationService } from '../../utils/supabaseRegistrationService';
import { Warehouse } from '../../modules/inventory/data/ksaData';
import UnifiedListView from './UnifiedListView';
import QRCodeDisplay from './QRCodeDisplay';
import UnauthorizedAccess from '../common/UnauthorizedAccess';
import { offlineSyncManager } from '../../utils/offlineSync';

import EmployeeForm from './forms/EmployeeForm';
import MaterialForm from './forms/MaterialForm';
import WarehouseForm from './forms/WarehouseForm';
import EmployeeList from './lists/EmployeeList';
import MaterialList from './lists/MaterialList';
import WarehouseList from './lists/WarehouseList';

const loadExcelUtils = () => import('../../utils/excelUtils');

interface RegistrationFormProps {
  currentUser?: User;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ currentUser }) => {
  const hasManagerAccess = AuthManager.hasPermission('manager');

  const [activeTab, setActiveTab] = useState<'employees' | 'warehouses' | 'materials' | 'departments'>('employees');
  const [activeView, setActiveView] = useState<'form' | 'list'>('form');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local');
  const [useSupabase, setUseSupabase] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'list' | 'unified'>('form');
  const [showQRCode, setShowQRCode] = useState(false);
  const [newEntity, setNewEntity] = useState<{type: string; data: any} | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!hasManagerAccess) {
    return <UnauthorizedAccess requiredRole="manager" />;
  }

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
    const checkSupabase = async () => {
      const currentUseSupabase = await AuthManager.shouldUseSupabase();
      setUseSupabase(currentUseSupabase);
      setDataSource(currentUseSupabase ? 'supabase' : 'local');
      loadData(currentUseSupabase);
    };
    checkSupabase();
  }, []);

  const loadData = async (supabaseOverride?: boolean) => {
    setIsLoading(true);
    const supabaseMode = typeof supabaseOverride === 'boolean' ? supabaseOverride : useSupabase;
    try {
      if (supabaseMode) {
        const [employeesData, equipmentData, materialsData, sitesData] = await Promise.all([
          SupabaseDataService.getEmployees(),
          SupabaseDataService.getEquipment(),
          SupabaseDataService.getMaterials(),
          SupabaseDataService.getSites()
        ]);
        setEmployees(employeesData);
        setEquipment(equipmentData);
        setMaterials(materialsData);
        setSites(sitesData);
        setDataSource('supabase');
      } else {
        setEmployees(DataStorage.loadEmployees());
        setEquipment(DataStorage.loadEquipment());
        setMaterials(DataStorage.loadMaterials());
        setSites(DataStorage.loadSites());
        const storedWarehouses = localStorage.getItem('registered_warehouses');
        if (storedWarehouses) {
          try {
            setWarehouses(JSON.parse(storedWarehouses));
          } catch {
            setWarehouses([]);
          }
        }
        setDataSource('local');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'Failed to load data. Please try again.');
      setEmployees(DataStorage.loadEmployees());
      setEquipment(DataStorage.loadEquipment());
      setMaterials(DataStorage.loadMaterials());
      setSites(DataStorage.loadSites());
      setDataSource('local');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'success') {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const acknowledgeMessage = () => {
    setMessage(null);
  };

  const handleDownloadTemplate = async (type: string) => {
    try {
      const excelUtils = await loadExcelUtils();
      switch (type) {
        case 'employees':
          await excelUtils.downloadEmployeeTemplate();
          break;
        case 'materials':
          await excelUtils.downloadMaterialTemplate();
          break;
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      showMessage('error', 'Failed to download template');
    }
  };

  const handleExportToExcel = async (type: string, data: any[]) => {
    try {
      const excelUtils = await loadExcelUtils();
      switch (type) {
        case 'employees':
          await excelUtils.exportEmployeesToExcel(data);
          break;
        case 'materials':
          await excelUtils.exportMaterialsToExcel(data);
          break;
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showMessage('error', 'Failed to export data');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    // Simplified import - just show message for now
    showMessage('success', 'Import feature available in full version');
    event.target.value = '';
  };

  // Employee handlers
  const handleEmployeeSubmit = async (employeeData: any) => {
    setIsLoading(true);
    try {
      if (editingEmployee) {
        const updatedEmployee: Employee = {
          ...editingEmployee,
          ...employeeData,
          lastUpdated: new Date().toISOString()
        };
        const updatedEmployees = employees.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp);
        setEmployees(updatedEmployees);
        DataStorage.saveEmployees(updatedEmployees);
        showMessage('success', `Employee ${updatedEmployee.name} updated successfully!`);
        setEditingEmployee(null);
      } else {
        const employeeId = uuidv4();
        const newEmployee: Employee = {
          ...employeeData,
          id: employeeId,
          qrCode: employeeId,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        const updatedEmployees = [...employees, newEmployee];
        setEmployees(updatedEmployees);
        DataStorage.saveEmployees(updatedEmployees);
        showMessage('success', `Employee ${newEmployee.name} registered successfully!`);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      showMessage('error', `Failed to save employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setActiveView('form');
  };

  const handleEmployeeDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setIsLoading(true);
      try {
        const updatedEmployees = employees.filter(emp => emp.id !== id);
        setEmployees(updatedEmployees);
        DataStorage.saveEmployees(updatedEmployees);
        showMessage('success', 'Employee deleted successfully!');
      } catch (error) {
        showMessage('error', `Failed to delete employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Warehouse handlers
  const handleWarehouseSubmit = async (warehouseData: Omit<Warehouse, 'id'>) => {
    setIsLoading(true);
    try {
      if (editingWarehouse) {
        const updatedWarehouse: Warehouse = {
          ...editingWarehouse,
          ...warehouseData,
          id: editingWarehouse.id
        };
        const updatedWarehouses = warehouses.map(wh => wh.id === editingWarehouse.id ? updatedWarehouse : wh);
        setWarehouses(updatedWarehouses);
        localStorage.setItem('registered_warehouses', JSON.stringify(updatedWarehouses));
        showMessage('success', `Warehouse ${updatedWarehouse.name} updated successfully!`);
        setEditingWarehouse(null);
      } else {
        const warehouseId = `wh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newWarehouse: Warehouse = {
          ...warehouseData,
          id: warehouseId
        };
        const updatedWarehouses = [...warehouses, newWarehouse];
        setWarehouses(updatedWarehouses);
        localStorage.setItem('registered_warehouses', JSON.stringify(updatedWarehouses));
        showMessage('success', `Warehouse ${newWarehouse.name} registered successfully!`);
      }
    } catch (error) {
      console.error('Error saving warehouse:', error);
      showMessage('error', `Failed to save warehouse: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWarehouseEdit = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setActiveView('form');
  };

  const handleWarehouseDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      setIsLoading(true);
      try {
        const updatedWarehouses = warehouses.filter(wh => wh.id !== id);
        setWarehouses(updatedWarehouses);
        localStorage.setItem('registered_warehouses', JSON.stringify(updatedWarehouses));
        showMessage('success', 'Warehouse deleted successfully!');
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        showMessage('error', `Failed to delete warehouse: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Material handlers
  const handleMaterialSubmit = async (materialData: any) => {
    setIsLoading(true);
    try {
      if (editingMaterial) {
        const updatedMaterial: Material = {
          ...editingMaterial,
          ...materialData,
          lastUpdated: new Date().toISOString()
        };
        const updatedMaterials = materials.map(mat => mat.id === editingMaterial.id ? updatedMaterial : mat);
        setMaterials(updatedMaterials);
        DataStorage.saveMaterials(updatedMaterials);
        showMessage('success', `Material ${updatedMaterial.name} updated successfully!`);
        setEditingMaterial(null);
      } else {
        const materialId = uuidv4();
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
        showMessage('success', `Material ${newMaterial.name} registered successfully!`);
      }
    } catch (error) {
      console.error('Error saving material:', error);
      showMessage('error', `Failed to save material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaterialEdit = (mat: Material) => {
    setEditingMaterial(mat);
    setActiveView('form');
  };

  const handleMaterialDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      setIsLoading(true);
      try {
        const updatedMaterials = materials.filter(mat => mat.id !== id);
        setMaterials(updatedMaterials);
        DataStorage.saveMaterials(updatedMaterials);
        showMessage('success', 'Material deleted successfully!');
      } catch (error) {
        showMessage('error', `Failed to delete material: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const tabs = [
    { id: 'employees', label: 'Employees', icon: Users, count: employees.length },
    { id: 'warehouses', label: 'Warehouses', icon: Building, count: warehouses.length },
    { id: 'materials', label: 'Materials', icon: Package, count: materials.length },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Registration</h1>
        <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>Register and manage employees, warehouses, and materials</p>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '16px', fontWeight: '600', background: message.type === 'success' ? '#d1fae5' : '#fee2e2', color: message.type === 'success' ? '#065f46' : '#991b1b', border: `2px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          {message.type === 'error' && (
            <button onClick={acknowledgeMessage} style={{ padding: '6px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>OK</button>
          )}
        </div>
      )}

      {/* Data Source Indicator */}
      {!isLoading && (
        <div style={{ background: 'white', borderRadius: '12px', border: '2px solid #e2e8f0', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {useSupabase ? (
              <>
                <Database style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Supabase Database</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wifi style={{ width: '16px', height: '16px', color: '#059669' }} />
                  <span style={{ fontSize: '14px', color: '#059669', fontWeight: '600' }}>Online</span>
                </div>
              </>
            ) : (
              <>
                <Database style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Local Storage</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wifi style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Offline</span>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={refreshData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
              <RefreshCw style={{ width: '16px', height: '16px' }} /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      {!isLoading && (
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '16px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    fontSize: '17px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isActive ? '#002e17' : 'transparent',
                    color: isActive ? 'white' : '#475569',
                    boxShadow: isActive ? '0 4px 12px rgba(0,46,23,0.3)' : 'none'
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px' }} />
                  <span>{tab.label}</span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '700',
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                    color: isActive ? 'white' : '#475569'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '32px' }}>
            {/* View Toggle & Actions */}
            {activeTab !== 'departments' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {activeTab === 'employees' && (
                    <>
                      <button onClick={() => handleDownloadTemplate('employees')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
                        <Download style={{ width: '18px', height: '18px' }} /> Template
                      </button>
                      <button onClick={() => handleExportToExcel('employees', employees)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
                        <Download style={{ width: '18px', height: '18px' }} /> Export
                      </button>
                    </>
                  )}
                  {activeTab === 'warehouses' && (
                    <>
                      <button onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8,Name,Code,City,Address,Manager,Capacity,Status,Latitude,Longitude\n";
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'warehouse_template.csv';
                        a.click();
                      }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
                        <Download style={{ width: '18px', height: '18px' }} /> Template
                      </button>
                      <button onClick={() => {
                        const csvContent = warehouses.map(wh => `${wh.name},${wh.code},${wh.city},${wh.address},${wh.manager},${wh.capacity},${wh.status},${wh.coordinates.lat},${wh.coordinates.lng}`).join('\n');
                        const header = "Name,Code,City,Address,Manager,Capacity,Status,Latitude,Longitude\n";
                        const blob = new Blob([header + csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'warehouses.csv';
                        a.click();
                      }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
                        <Download style={{ width: '18px', height: '18px' }} /> Export
                      </button>
                    </>
                  )}
                  {activeTab === 'materials' && (
                    <>
                      <button onClick={() => handleDownloadTemplate('materials')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
                        <Download style={{ width: '18px', height: '18px' }} /> Template
                      </button>
                      <button onClick={() => handleExportToExcel('materials', materials)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
                        <Download style={{ width: '18px', height: '18px' }} /> Export
                      </button>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => { setActiveView('form'); setViewMode('form'); }} style={{ padding: '12px 24px', background: activeView === 'form' ? '#002e17' : '#f1f5f9', color: activeView === 'form' ? 'white' : '#374151', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
                    Registration Form
                  </button>
                  <button onClick={() => { setActiveView('list'); setViewMode('unified'); }} style={{ padding: '12px 24px', background: activeView === 'list' ? '#002e17' : '#f1f5f9', color: activeView === 'list' ? 'white' : '#374151', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
                    View All
                  </button>
                </div>
              </div>
            )}

            {/* Registration Forms */}
            {activeTab !== 'departments' && activeView === 'form' && (
              <>
                {activeTab === 'employees' && (
                  <EmployeeForm sites={sites} onSubmit={handleEmployeeSubmit} initialData={editingEmployee} />
                )}
                {activeTab === 'warehouses' && (
                  <WarehouseForm onSubmit={handleWarehouseSubmit} initialData={editingWarehouse} />
                )}
                {activeTab === 'materials' && (
                  <MaterialForm sites={sites} onSubmit={handleMaterialSubmit} initialData={editingMaterial} />
                )}
              </>
            )}

            {/* List Views */}
            {activeTab !== 'departments' && activeView === 'list' && (
              <>
                {activeTab === 'employees' && (
                  <EmployeeList employees={employees} onEdit={handleEmployeeEdit} onDelete={handleEmployeeDelete} />
                )}
                {activeTab === 'warehouses' && (
                  <WarehouseList warehouses={warehouses} onEdit={handleWarehouseEdit} onDelete={handleWarehouseDelete} />
                )}
                {activeTab === 'materials' && (
                  <MaterialList materials={materials} sites={sites} onEdit={handleMaterialEdit} onDelete={handleMaterialDelete} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* QR Code Display Modal */}
      {showQRCode && newEntity && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <QRCodeDisplay entity={newEntity.data} onClose={() => setShowQRCode(false)} />
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;
