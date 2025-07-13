import React, { useState, useEffect } from 'react';
import { Users, Wrench, Package, Building, Download, Upload, CheckCircle, AlertCircle, RefreshCw, Database, Wifi } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { generateEntityId } from '../../utils/qrCodeUtils';
import { Employee, Equipment, Material, Site, User } from '../../types';
import { AuthManager } from '../../utils/authUtils';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { SupabaseRegistrationService } from '../../utils/supabaseRegistrationService';
import UnifiedListView from './UnifiedListView';
import { CSVAppendManager } from '../../utils/csvAppendUtils';
import QRCodeDisplay from './QRCodeDisplay';
import UnauthorizedAccess from '../common/UnauthorizedAccess';
import { offlineSyncManager } from '../../utils/offlineSync';

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

  // Fix the activeTab type to include 'departments'
  const [activeTab, setActiveTab] = useState<'employees' | 'equipment' | 'materials' | 'sites' | 'departments'>('employees');
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
  
  // Data source management
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local');
  const [useSupabase, setUseSupabase] = useState(AuthManager.useSupabase());
  const [showDepartmentManager, setShowDepartmentManager] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'list' | 'unified'>('form');
  const [showQRCode, setShowQRCode] = useState(false);
  const [newEntity, setNewEntity] = useState<{type: string; data: any} | null>(null);
  
  // Add this missing formData state
  const [formData, setFormData] = useState<any>({});
  
  // Add refresh trigger for UnifiedListView
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  useEffect(() => {
    const currentUseSupabase = AuthManager.useSupabase();
    setUseSupabase(currentUseSupabase);
    setDataSource(currentUseSupabase ? 'supabase' : 'local');
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (useSupabase) {
        // Load from Supabase
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
        // Load from local storage
        setEmployees(DataStorage.loadEmployees());
        setEquipment(DataStorage.loadEquipment());
        setMaterials(DataStorage.loadMaterials());
        setSites(DataStorage.loadSites());
        setDataSource('local');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'Failed to load data. Please try again.');
      // Fallback to local storage
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
    setTimeout(() => setMessage(null), 5000);
  };

  // Employee handlers
  const handleEmployeeSubmit = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'qrCode'>) => {
    setIsLoading(true);
    
    try {
      if (editingEmployee) {
        // Update existing employee
        const updatedEmployee: Employee = {
          ...editingEmployee,
          ...employeeData,
          lastUpdated: new Date().toISOString()
        };
        
        if (useSupabase) {
          // Update in Supabase
          const result = await SupabaseRegistrationService.updateEmployee(updatedEmployee);
          if (result.success && result.data) {
            const updatedEmployees = employees.map(emp => 
              emp.id === editingEmployee.id ? result.data! : emp
            );
            setEmployees(updatedEmployees);
            // Also save locally for offline access
            DataStorage.saveEmployees(updatedEmployees);
            showMessage('success', `Employee ${result.data.name} updated successfully in Supabase!`);
            setRefreshTrigger(prev => prev + 1); // Trigger refresh
          } else {
            throw new Error(result.error || 'Failed to update employee');
          }
        } else {
          // Update locally
          const updatedEmployees = employees.map(emp => 
            emp.id === editingEmployee.id ? updatedEmployee : emp
          );
          setEmployees(updatedEmployees);
          DataStorage.saveEmployees(updatedEmployees);
          
          // Queue sync operation for Supabase
          offlineSyncManager.queueOperation({
            type: 'update',
            entityType: 'employee',
            entityId: updatedEmployee.id,
            data: updatedEmployee,
            priority: 'high'
          });
          
          showMessage('success', `Employee ${updatedEmployee.name} updated successfully!`);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
        }
        
        setEditingEmployee(null);
      } else {
        // Create new employee
        if (useSupabase) {
          // For Supabase, don't generate ID - let PostgreSQL generate UUID
          const newEmployee: Employee = {
            ...employeeData,
            id: '', // Will be generated by PostgreSQL
            qrCode: '', // Will be set after creation
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          // Create in Supabase
          const result = await SupabaseRegistrationService.createEmployee(newEmployee);
          if (result.success && result.data) {
            const updatedEmployees = [...employees, result.data];
            setEmployees(updatedEmployees);
            // Also save locally for offline access
            DataStorage.saveEmployees(updatedEmployees);
            
            // Show QR code for the new employee
            setNewEntity({type: 'employee', data: result.data});
            setShowQRCode(true);
            
            showMessage('success', `Employee ${result.data.name} registered successfully in Supabase!`);
            setRefreshTrigger(prev => prev + 1); // Trigger refresh
          } else {
            throw new Error(result.error || 'Failed to create employee');
          }
        } else {
          // For offline mode, generate custom string ID
          const employeeId = generateEntityId('employee');
          const newEmployee: Employee = {
            ...employeeData,
            id: employeeId,
            qrCode: employeeId,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          // Create locally
          const updatedEmployees = [...employees, newEmployee];
          setEmployees(updatedEmployees);
          DataStorage.saveEmployees(updatedEmployees);
          
          // Queue sync operation for Supabase
          offlineSyncManager.queueOperation({
            type: 'create',
            entityType: 'employee',
            entityId: newEmployee.id,
            data: newEmployee,
            priority: 'high'
          });
          
          // Show QR code for the new employee
          setNewEntity({type: 'employee', data: newEmployee});
          setShowQRCode(true);
          
          showMessage('success', `Employee ${newEmployee.name} registered successfully!`);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
        }
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      showMessage('error', `Failed to save employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setActiveView('form');
  };

  const handleEmployeeDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setIsLoading(true);
      
      try {
        const employeeToDelete = employees.find(emp => emp.id === id);
        
        if (useSupabase) {
          // Delete from Supabase
          const result = await SupabaseRegistrationService.deleteEmployee(id);
          if (result.success) {
            const updatedEmployees = employees.filter(emp => emp.id !== id);
            setEmployees(updatedEmployees);
            // Also update local storage
            DataStorage.saveEmployees(updatedEmployees);
            showMessage('success', 'Employee deleted successfully from Supabase!');
          } else {
            throw new Error(result.error || 'Failed to delete employee');
          }
        } else {
          // Delete locally
          const updatedEmployees = employees.filter(emp => emp.id !== id);
          setEmployees(updatedEmployees);
          DataStorage.saveEmployees(updatedEmployees);
          
          // Queue sync operation for Supabase
          if (employeeToDelete) {
            offlineSyncManager.queueOperation({
              type: 'delete',
              entityType: 'employee',
              entityId: id,
              data: employeeToDelete,
              priority: 'high'
            });
          }
          
          showMessage('success', 'Employee deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        showMessage('error', `Failed to delete employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Equipment handlers
  const handleEquipmentSubmit = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'qrCode'>) => {
    setIsLoading(true);
    
    try {
      if (editingEquipment) {
        // Update existing equipment
        const updatedEquipment: Equipment = {
          ...editingEquipment,
          ...equipmentData,
          lastUpdated: new Date().toISOString()
        };
        
        if (useSupabase) {
          // Update in Supabase
          const result = await SupabaseRegistrationService.updateEquipment(updatedEquipment);
          if (result.success && result.data) {
            const updatedEquipmentList = equipment.map(eq => 
              eq.id === editingEquipment.id ? result.data! : eq
            );
            setEquipment(updatedEquipmentList);
            // Also save locally for offline access
            DataStorage.saveEquipment(updatedEquipmentList);
            showMessage('success', `Equipment ${result.data.name} updated successfully in Supabase!`);
            setRefreshTrigger(prev => prev + 1); // Trigger refresh
          } else {
            throw new Error(result.error || 'Failed to update equipment');
          }
        } else {
          // Update locally
          const updatedEquipmentList = equipment.map(eq => 
            eq.id === editingEquipment.id ? updatedEquipment : eq
          );
          setEquipment(updatedEquipmentList);
          DataStorage.saveEquipment(updatedEquipmentList);
          
          // Queue sync operation for Supabase
          offlineSyncManager.queueOperation({
            type: 'update',
            entityType: 'equipment',
            entityId: updatedEquipment.id,
            data: updatedEquipment,
            priority: 'high'
          });
          
          showMessage('success', `Equipment ${updatedEquipment.name} updated successfully!`);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
        }
        
        setEditingEquipment(null);
      } else {
        // Create new equipment
        if (useSupabase) {
          // For Supabase, don't generate ID - let PostgreSQL generate UUID
          const newEquipment: Equipment = {
            ...equipmentData,
            id: '', // Will be generated by PostgreSQL
            qrCode: '', // Will be set after creation
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          // Create in Supabase
          const result = await SupabaseRegistrationService.createEquipment(newEquipment);
          if (result.success && result.data) {
            const updatedEquipment = [...equipment, result.data];
            setEquipment(updatedEquipment);
            // Also save locally for offline access
            DataStorage.saveEquipment(updatedEquipment);
            
            // Show QR code for the new equipment
            setNewEntity({type: 'equipment', data: result.data});
            setShowQRCode(true);
            
            showMessage('success', `Equipment ${result.data.name} registered successfully in Supabase!`);
            setRefreshTrigger(prev => prev + 1); // Trigger refresh
          } else {
            throw new Error(result.error || 'Failed to create equipment');
          }
        } else {
          // For offline mode, generate custom string ID
          const equipmentId = DataStorage.generateEquipmentId();
          const newEquipment: Equipment = {
            ...equipmentData,
            id: equipmentId,
            qrCode: equipmentId,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          // Create locally
          const updatedEquipment = [...equipment, newEquipment];
          setEquipment(updatedEquipment);
          DataStorage.saveEquipment(updatedEquipment);
          
          // Queue sync operation for Supabase
          offlineSyncManager.queueOperation({
            type: 'create',
            entityType: 'equipment',
            entityId: newEquipment.id,
            data: newEquipment,
            priority: 'high'
          });
          
          // Show QR code for the new equipment
          setNewEntity({type: 'equipment', data: newEquipment});
          setShowQRCode(true);
          
          showMessage('success', `Equipment ${newEquipment.name} registered successfully!`);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
        }
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
      showMessage('error', `Failed to save equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEquipmentEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setActiveView('form');
  };

  const handleEquipmentDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      setIsLoading(true);
      try {
        const equipmentToDelete = equipment.find(eq => eq.id === id);
        
        if (useSupabase) {
          // Delete from Supabase first
          const result = await SupabaseRegistrationService.deleteEquipment(id);
          if (result.success) {
            // Update local state and storage
            const updatedEquipment = equipment.filter(eq => eq.id !== id);
            setEquipment(updatedEquipment);
            DataStorage.saveEquipment(updatedEquipment);
            showMessage('success', 'Equipment deleted successfully!');
          } else {
            showMessage('error', `Failed to delete equipment: ${result.error}`);
          }
        } else {
          // Local deletion and queue for sync
          const updatedEquipment = equipment.filter(eq => eq.id !== id);
          setEquipment(updatedEquipment);
          DataStorage.saveEquipment(updatedEquipment);
          
          // Queue sync operation for Supabase
          if (equipmentToDelete) {
            offlineSyncManager.queueOperation({
              type: 'delete',
              entityType: 'equipment',
              entityId: id,
              data: equipmentToDelete,
              priority: 'high'
            });
          }
          
          showMessage('success', 'Equipment deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting equipment:', error);
        showMessage('error', `Failed to delete equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Material handlers
  const handleMaterialSubmit = async (materialData: Omit<Material, 'id' | 'createdAt' | 'qrCode'>) => {
    setIsLoading(true);
    try {
      if (editingMaterial) {
        // Update existing material
        const updatedMaterial: Material = {
          ...editingMaterial,
          ...materialData,
          lastUpdated: new Date().toISOString()
        };
        
        if (useSupabase) {
          // Update in Supabase first
          const result = await SupabaseRegistrationService.updateMaterial(updatedMaterial);
          if (result.success && result.data) {
            // Update local state and storage
            const updatedMaterials = materials.map(mat => 
              mat.id === editingMaterial.id ? result.data! : mat
            );
            setMaterials(updatedMaterials);
            DataStorage.saveMaterials(updatedMaterials);
            showMessage('success', `Material ${result.data.name} updated successfully!`);
            setRefreshTrigger(prev => prev + 1); // Trigger refresh
            setEditingMaterial(null);
          } else {
            showMessage('error', `Failed to update material: ${result.error}`);
          }
        } else {
          // Local update and queue for sync
          const updatedMaterials = materials.map(mat => 
            mat.id === editingMaterial.id ? updatedMaterial : mat
          );
          setMaterials(updatedMaterials);
          DataStorage.saveMaterials(updatedMaterials);
          
          // Queue sync operation for Supabase
          offlineSyncManager.queueOperation({
            type: 'update',
            entityType: 'material',
            entityId: updatedMaterial.id,
            data: updatedMaterial,
            priority: 'high'
          });
          
          showMessage('success', `Material ${updatedMaterial.name} updated successfully!`);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
          setEditingMaterial(null);
        }
      } else {
        // Create new material
        if (useSupabase) {
          // For Supabase, don't generate ID - let PostgreSQL generate UUID
          const newMaterial: Material = {
            ...materialData,
            id: '', // Will be generated by PostgreSQL
            qrCode: '', // Will be set after creation
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };

          // Create in Supabase first
          const result = await SupabaseRegistrationService.createMaterial(newMaterial);
          if (result.success && result.data) {
            // Update local state and storage
            const updatedMaterials = [...materials, result.data];
            setMaterials(updatedMaterials);
            DataStorage.saveMaterials(updatedMaterials);
            
            // Show QR code for the new material
            setNewEntity({type: 'material', data: result.data});
            setShowQRCode(true);
            
            showMessage('success', `Material ${result.data.name} registered successfully!`);
            setRefreshTrigger(prev => prev + 1); // Trigger refresh
          } else {
            showMessage('error', `Failed to create material: ${result.error}`);
          }
        } else {
          // For offline mode, generate custom string ID
          const materialId = DataStorage.generateMaterialId();
          const newMaterial: Material = {
            ...materialData,
            id: materialId,
            qrCode: materialId,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          // Local creation and queue for sync
          const updatedMaterials = [...materials, newMaterial];
          setMaterials(updatedMaterials);
          DataStorage.saveMaterials(updatedMaterials);
          
          // Queue sync operation for Supabase
          offlineSyncManager.queueOperation({
            type: 'create',
            entityType: 'material',
            entityId: newMaterial.id,
            data: newMaterial,
            priority: 'high'
          });
          
          // Show QR code for the new material
          setNewEntity({type: 'material', data: newMaterial});
          setShowQRCode(true);
          
          showMessage('success', `Material ${newMaterial.name} registered successfully!`);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
        }
      }
    } catch (error) {
      console.error('Error saving material:', error);
      showMessage('error', `Failed to save material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaterialEdit = (material: Material) => {
    setEditingMaterial(material);
    setActiveView('form');
  };

  const handleMaterialDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      setIsLoading(true);
      try {
        const materialToDelete = materials.find(mat => mat.id === id);
        
        if (useSupabase) {
          // Delete from Supabase first
          const result = await SupabaseRegistrationService.deleteMaterial(id);
          if (result.success) {
            // Update local state and storage
            const updatedMaterials = materials.filter(mat => mat.id !== id);
            setMaterials(updatedMaterials);
            DataStorage.saveMaterials(updatedMaterials);
            showMessage('success', 'Material deleted successfully!');
          } else {
            showMessage('error', `Failed to delete material: ${result.error}`);
          }
        } else {
          // Local deletion and queue for sync
          const updatedMaterials = materials.filter(mat => mat.id !== id);
          setMaterials(updatedMaterials);
          DataStorage.saveMaterials(updatedMaterials);
          
          // Queue sync operation for Supabase
          if (materialToDelete) {
            offlineSyncManager.queueOperation({
              type: 'delete',
              entityType: 'material',
              entityId: id,
              data: materialToDelete,
              priority: 'high'
            });
          }
          
          showMessage('success', 'Material deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting material:', error);
        showMessage('error', `Failed to delete material: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Site handlers
  const handleSiteSubmit = async (siteData: Omit<Site, 'id' | 'lastUpdated'>) => {
    setIsLoading(true);
    try {
      if (editingSite) {
        // Update existing site
        const updatedSite: Site = {
          ...editingSite,
          ...siteData,
          lastUpdated: new Date().toISOString()
        };
        
        if (useSupabase) {
          // Update in Supabase first
          const result = await SupabaseRegistrationService.updateSite(updatedSite);
          if (result.success && result.data) {
            // Update local state and storage
            const updatedSites = sites.map(site => 
              site.id === editingSite.id ? result.data! : site
            );
            setSites(updatedSites);
            DataStorage.saveSites(updatedSites);
            showMessage('success', `Site ${result.data.name} updated successfully!`);
            setRefreshTrigger(prev => prev + 1); // Trigger refresh
            setEditingSite(null);
          } else {
            showMessage('error', `Failed to update site: ${result.error}`);
          }
        } else {
          // Local update and queue for sync
          const updatedSites = sites.map(site => 
            site.id === editingSite.id ? updatedSite : site
          );
          setSites(updatedSites);
          DataStorage.saveSites(updatedSites);
          
          // Queue sync operation for Supabase
          offlineSyncManager.queueOperation({
            type: 'update',
            entityType: 'site',
            entityId: updatedSite.id,
            data: updatedSite,
            priority: 'high'
          });
          
          showMessage('success', `Site ${updatedSite.name} updated successfully!`);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
          setEditingSite(null);
        }
      } else {
        // Create new site
        if (useSupabase) {
          // For Supabase, let PostgreSQL generate UUID - don't include ID
          const newSiteData = {
            ...siteData,
            lastUpdated: new Date().toISOString()
          };
          
          // Create in Supabase first
          const result = await SupabaseRegistrationService.createSite(newSiteData as Site);
          if (result.success && result.data) {
            // Update local state and storage
            const updatedSites = [...sites, result.data];
            setSites(updatedSites);
            DataStorage.saveSites(updatedSites);
            
            // Show QR code for the new site
            setNewEntity({type: 'site', data: result.data});
            setShowQRCode(true);
            
            showMessage('success', `Site ${result.data.name} registered successfully!`);
            setRefreshTrigger(prev => prev + 1); // Trigger refresh
          } else {
            showMessage('error', `Failed to create site: ${result.error}`);
          }
        } else {
          // For offline mode, generate custom string ID
          const siteId = DataStorage.generateSiteId();
          const newSite: Site = {
            ...siteData,
            id: siteId,
            lastUpdated: new Date().toISOString()
          };
          
          // Local creation and queue for sync
          const updatedSites = [...sites, newSite];
          setSites(updatedSites);
          DataStorage.saveSites(updatedSites);
          
          // Queue sync operation for Supabase
          offlineSyncManager.queueOperation({
            type: 'create',
            entityType: 'site',
            entityId: newSite.id,
            data: newSite,
            priority: 'high'
          });
          
          // Show QR code for the new site
          setNewEntity({type: 'site', data: newSite});
          setShowQRCode(true);
          
          showMessage('success', `Site ${newSite.name} registered successfully!`);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
        }
      }
    } catch (error) {
      console.error('Error saving site:', error);
      showMessage('error', `Failed to save site: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiteEdit = (site: Site) => {
    setEditingSite(site);
    setActiveView('form');
  };

  const handleSiteDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      setIsLoading(true);
      try {
        const siteToDelete = sites.find(site => site.id === id);
        
        if (useSupabase) {
          // Delete from Supabase first
          const result = await SupabaseRegistrationService.deleteSite(id);
          if (result.success) {
            // Update local state and storage
            const updatedSites = sites.filter(site => site.id !== id);
            setSites(updatedSites);
            DataStorage.saveSites(updatedSites);
            showMessage('success', 'Site deleted successfully!');
          } else {
            showMessage('error', `Failed to delete site: ${result.error}`);
          }
        } else {
          // Local deletion and queue for sync
          const updatedSites = sites.filter(site => site.id !== id);
          setSites(updatedSites);
          DataStorage.saveSites(updatedSites);
          
          // Queue sync operation for Supabase
          if (siteToDelete) {
            offlineSyncManager.queueOperation({
              type: 'delete',
              entityType: 'site',
              entityId: id,
              data: siteToDelete,
              priority: 'high'
            });
          }
          
          showMessage('success', 'Site deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting site:', error);
        showMessage('error', `Failed to delete site: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
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

      {/* Data Source Indicator */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {useSupabase ? (
                  <>
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Data Source: Supabase Database</span>
                    <div className="flex items-center space-x-1">
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600">Online</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Data Source: Local Storage</span>
                    <div className="flex items-center space-x-1">
                      <Wifi className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Offline</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <a
                href="/enable-supabase.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Database className="w-4 h-4" />
                <span>Switch Mode</span>
              </a>
            </div>
          </div>
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
                    refreshTrigger={refreshTrigger}
                  />
                )}
                {activeTab === 'equipment' && (
                  <UnifiedListView 
                    type="equipment" 
                    onEdit={handleEquipmentEdit} 
                    onDelete={handleEquipmentDelete}
                    onImport={(e) => handleImport(e, 'equipment')}
                    onExport={() => exportEquipmentToExcel(equipment)}
                    refreshTrigger={refreshTrigger}
                  />
                )}
                {activeTab === 'materials' && (
                  <UnifiedListView 
                    type="materials" 
                    onEdit={handleMaterialEdit} 
                    onDelete={handleMaterialDelete}
                    onImport={(e) => handleImport(e, 'materials')}
                    onExport={() => exportMaterialsToExcel(materials)}
                    refreshTrigger={refreshTrigger}
                  />
                )}
                {activeTab === 'sites' && (
                  <UnifiedListView 
                    type="sites" 
                    onEdit={handleSiteEdit} 
                    onDelete={handleSiteDelete}
                    onImport={(e) => handleImport(e, 'sites')}
                    onExport={() => exportSitesToExcel(sites)}
                    refreshTrigger={refreshTrigger}
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