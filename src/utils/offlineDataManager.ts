// Offline Data Manager
// Handles local data operations and queuing for sync

import { Employee, Equipment, Material, Site, TimeLog, User, EmployeeLog, EquipmentLog, MaterialLog, EquipmentMaintenanceLog, EquipmentMaintenanceSchedule } from '../types';
import { DataStorage } from './dataStorage';
import { offlineSyncManager } from './offlineSync';
import { SupabaseRegistrationService } from './supabaseRegistrationService';

export class OfflineDataManager {
  // Employee Operations
  static async createEmployee(employee: Employee): Promise<string> {
    try {
      // Save locally first
      const employees = DataStorage.loadEmployees();
      employees.push(employee);
      DataStorage.saveEmployees(employees);

      // Queue for sync
      const operationId = offlineSyncManager.queueOperation({
        type: 'create',
        entityType: 'employee',
        entityId: employee.id,
        data: employee,
        priority: 'high'
      });

      return operationId;
    } catch (error) {
      console.error('Failed to create employee:', error);
      throw error;
    }
  }

  static async updateEmployee(employee: Employee): Promise<string> {
    try {
      // Update locally first
      const employees = DataStorage.loadEmployees();
      const index = employees.findIndex(emp => emp.id === employee.id);
      
      if (index !== -1) {
        employees[index] = { ...employee, lastUpdated: new Date().toISOString() };
        DataStorage.saveEmployees(employees);

        // Queue for sync
        const operationId = offlineSyncManager.queueOperation({
          type: 'update',
          entityType: 'employee',
          entityId: employee.id,
          data: employee,
          priority: 'medium'
        });

        return operationId;
      } else {
        throw new Error('Employee not found');
      }
    } catch (error) {
      console.error('Failed to update employee:', error);
      throw error;
    }
  }

  static async deleteEmployee(employeeId: string): Promise<string> {
    try {
      // Delete locally first
      const employees = DataStorage.loadEmployees();
      const filteredEmployees = employees.filter(emp => emp.id !== employeeId);
      DataStorage.saveEmployees(filteredEmployees);

      // Queue for sync
      const operationId = offlineSyncManager.queueOperation({
        type: 'delete',
        entityType: 'employee',
        entityId: employeeId,
        data: { id: employeeId },
        priority: 'medium'
      });

      return operationId;
    } catch (error) {
      console.error('Failed to delete employee:', error);
      throw error;
    }
  }

  // Equipment Operations
  static async createEquipment(equipment: Equipment): Promise<string> {
    try {
      const equipmentList = DataStorage.loadEquipment();
      equipmentList.push(equipment);
      DataStorage.saveEquipment(equipmentList);

      const operationId = offlineSyncManager.queueOperation({
        type: 'create',
        entityType: 'equipment',
        entityId: equipment.id,
        data: equipment,
        priority: 'high'
      });

      return operationId;
    } catch (error) {
      console.error('Failed to create equipment:', error);
      throw error;
    }
  }

  static async updateEquipment(equipment: Equipment): Promise<string> {
    try {
      const equipmentList = DataStorage.loadEquipment();
      const index = equipmentList.findIndex(eq => eq.id === equipment.id);
      
      if (index !== -1) {
        equipmentList[index] = { ...equipment, lastUpdated: new Date().toISOString() };
        DataStorage.saveEquipment(equipmentList);

        const operationId = offlineSyncManager.queueOperation({
          type: 'update',
          entityType: 'equipment',
          entityId: equipment.id,
          data: equipment,
          priority: 'medium'
        });

        return operationId;
      } else {
        throw new Error('Equipment not found');
      }
    } catch (error) {
      console.error('Failed to update equipment:', error);
      throw error;
    }
  }

  // Material Operations
  static async createMaterial(material: Material): Promise<string> {
    try {
      const materials = DataStorage.loadMaterials();
      materials.push(material);
      DataStorage.saveMaterials(materials);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('materialUpdated', {
        detail: { material, action: 'create' }
      }));

      // Also dispatch a storage event manually to ensure MaterialsPage refreshes
      setTimeout(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'qr_system_materials',
          newValue: localStorage.getItem('qr_system_materials'),
          oldValue: null,
          storageArea: localStorage
        }));
      }, 100);

      const operationId = offlineSyncManager.queueOperation({
        type: 'create',
        entityType: 'material',
        entityId: material.id,
        data: material,
        priority: 'high'
      });

      return operationId;
    } catch (error) {
      console.error('Failed to create material:', error);
      throw error;
    }
  }

  static async updateMaterial(material: Material): Promise<string> {
    try {
      const materials = DataStorage.loadMaterials();
      const index = materials.findIndex(mat => mat.id === material.id);
      if (index !== -1) {
        materials[index] = { ...material, lastUpdated: new Date().toISOString() };
        DataStorage.saveMaterials(materials);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('materialUpdated', {
          detail: { material: materials[index], action: 'update' }
        }));
        // Also dispatch a storage event manually to ensure MaterialsPage refreshes
        setTimeout(() => {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'qr_system_materials',
            newValue: localStorage.getItem('qr_system_materials'),
            oldValue: null,
            storageArea: localStorage
          }));
        }, 100);
      } else {
        // Not found locally, skip local update but still queue for Supabase sync
        console.warn(`Material not found locally for update: ${material.id}. Will still sync to Supabase.`);
      }
      // Always queue the update operation for Supabase
      const operationId = offlineSyncManager.queueOperation({
        type: 'update',
        entityType: 'material',
        entityId: material.id,
        data: material,
        priority: 'medium'
      });
      return operationId;
    } catch (error) {
      console.error('Failed to update material:', error);
      throw error;
    }
  }

  static async deleteMaterial(materialId: string): Promise<string> {
    try {
      const materials = DataStorage.loadMaterials();
      const materialToDelete = materials.find(mat => mat.id === materialId);
      const filteredMaterials = materials.filter(mat => mat.id !== materialId);
      DataStorage.saveMaterials(filteredMaterials);

      // Dispatch custom event to notify other components
      if (materialToDelete) {
        window.dispatchEvent(new CustomEvent('materialUpdated', {
          detail: { material: materialToDelete, action: 'delete' }
        }));
      }

      // Also dispatch a storage event manually to ensure MaterialsPage refreshes
      setTimeout(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'qr_system_materials',
          newValue: localStorage.getItem('qr_system_materials'),
          oldValue: null,
          storageArea: localStorage
        }));
      }, 100);

      const operationId = offlineSyncManager.queueOperation({
        type: 'delete',
        entityType: 'material',
        entityId: materialId,
        data: { id: materialId },
        priority: 'medium'
      });

      return operationId;
    } catch (error) {
      console.error('Failed to delete material:', error);
      throw error;
    }
  }

  // Site Operations
  static async createSite(site: Site): Promise<string> {
    try {
      const sites = DataStorage.loadSites();
      sites.push(site);
      DataStorage.saveSites(sites);

      const operationId = offlineSyncManager.queueOperation({
        type: 'create',
        entityType: 'site',
        entityId: site.id,
        data: site,
        priority: 'high'
      });

      return operationId;
    } catch (error) {
      console.error('Failed to create site:', error);
      throw error;
    }
  }

  static async updateSite(site: Site): Promise<string> {
    try {
      const sites = DataStorage.loadSites();
      const index = sites.findIndex(s => s.id === site.id);
      
      if (index !== -1) {
        sites[index] = { ...site, lastUpdated: new Date().toISOString() };
        DataStorage.saveSites(sites);

        const operationId = offlineSyncManager.queueOperation({
          type: 'update',
          entityType: 'site',
          entityId: site.id,
          data: site,
          priority: 'medium'
        });

        return operationId;
      } else {
        throw new Error('Site not found');
      }
    } catch (error) {
      console.error('Failed to update site:', error);
      throw error;
    }
  }

  // Time Log Operations (High Priority)
  /**
   * @deprecated Use createEmployeeLog, createEquipmentLog, or createMaterialLog instead
   */
  static async createTimeLog(timeLog: TimeLog): Promise<string> {
    try {
      const timeLogs = DataStorage.loadTimeLogs();
      timeLogs.push(timeLog);
      DataStorage.saveTimeLogs(timeLogs);

      const operationId = offlineSyncManager.queueOperation({
        type: 'create',
        entityType: 'timeLog',
        entityId: timeLog.id,
        data: timeLog,
        priority: 'high' // Time logs are critical for payroll
      });

      return operationId;
    } catch (error) {
      console.error('Failed to create time log:', error);
      throw error;
    }
  }

  // Employee Log Operations
  static async createEmployeeLog(employeeLog: EmployeeLog): Promise<string> {
    try {
      const employeeLogs = DataStorage.loadEmployeeLogs();
      employeeLogs.push(employeeLog);
      DataStorage.saveEmployeeLogs(employeeLogs);

      const operationId = offlineSyncManager.queueOperation({
        type: 'create',
        entityType: 'employeeLog',
        entityId: employeeLog.id,
        data: employeeLog,
        priority: 'high'
      });

      return operationId;
    } catch (error) {
      console.error('Failed to create employee log:', error);
      throw error;
    }
  }

  // Equipment Log Operations
  static async createEquipmentLog(equipmentLog: EquipmentLog): Promise<string> {
    try {
      const equipmentLogs = DataStorage.loadEquipmentLogs();
      equipmentLogs.push(equipmentLog);
      DataStorage.saveEquipmentLogs(equipmentLogs);

      const operationId = offlineSyncManager.queueOperation({
        type: 'create',
        entityType: 'equipmentLog',
        entityId: equipmentLog.id,
        data: equipmentLog,
        priority: 'high'
      });

      return operationId;
    } catch (error) {
      console.error('Failed to create equipment log:', error);
      throw error;
    }
  }

  // Material Log Operations
  static async createMaterialLog(materialLog: MaterialLog): Promise<string> {
    try {
      const materialLogs = DataStorage.loadMaterialLogs();
      materialLogs.push(materialLog);
      DataStorage.saveMaterialLogs(materialLogs);

      const operationId = offlineSyncManager.queueOperation({
        type: 'create',
        entityType: 'materialLog',
        entityId: materialLog.id,
        data: materialLog,
        priority: 'high'
      });

      return operationId;
    } catch (error) {
      console.error('Failed to create material log:', error);
      throw error;
    }
  }

  // Batch Operations
  static async batchCreateEmployees(employees: Employee[]): Promise<string[]> {
    const operationIds: string[] = [];
    
    try {
      // Save all locally first
      const existingEmployees = DataStorage.loadEmployees();
      const allEmployees = [...existingEmployees, ...employees];
      DataStorage.saveEmployees(allEmployees);

      // Queue each for sync
      for (const employee of employees) {
        const operationId = offlineSyncManager.queueOperation({
          type: 'create',
          entityType: 'employee',
          entityId: employee.id,
          data: employee,
          priority: 'medium'
        });
        operationIds.push(operationId);
      }

      return operationIds;
    } catch (error) {
      console.error('Failed to batch create employees:', error);
      throw error;
    }
  }

  // Data Validation
  static validateDataIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return new Promise((resolve) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        // Check for duplicate IDs
        const employees = DataStorage.loadEmployees();
        const employeeIds = employees.map(emp => emp.id);
        const duplicateEmployeeIds = employeeIds.filter((id, index) => employeeIds.indexOf(id) !== index);
        
        if (duplicateEmployeeIds.length > 0) {
          errors.push(`Duplicate employee IDs found: ${duplicateEmployeeIds.join(', ')}`);
        }

        // Check for orphaned time logs
        const timeLogs = DataStorage.loadTimeLogs();
        const orphanedLogs = timeLogs.filter(log => 
          log.entityType === 'employee' && !employeeIds.includes(log.entityId)
        );
        
        if (orphanedLogs.length > 0) {
          warnings.push(`${orphanedLogs.length} time logs reference non-existent employees`);
        }

        // Check for missing required fields
        const invalidEmployees = employees.filter(emp => 
          !emp.name || !emp.department || !emp.position
        );
        
        if (invalidEmployees.length > 0) {
          errors.push(`${invalidEmployees.length} employees have missing required fields`);
        }

        resolve({
          isValid: errors.length === 0,
          errors,
          warnings
        });
      } catch (error) {
        resolve({
          isValid: false,
          errors: ['Failed to validate data integrity'],
          warnings: []
        });
      }
    });
  }

  // Cleanup Operations
  static async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Clean old time logs
      const timeLogs = DataStorage.loadTimeLogs();
      const recentTimeLogs = timeLogs.filter(log => 
        new Date(log.timestamp) > cutoffDate
      );
      
      if (recentTimeLogs.length !== timeLogs.length) {
        DataStorage.saveTimeLogs(recentTimeLogs);
        console.log(`Cleaned up ${timeLogs.length - recentTimeLogs.length} old time logs`);
      }

      // Clean old sync errors
      offlineSyncManager.clearErrors();
      
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  // Maintenance Log Operations
  static async createMaintenanceLog(maintenanceLog: EquipmentMaintenanceLog): Promise<string> {
    try {
      const maintenanceLogs = DataStorage.loadMaintenanceLogs();
      maintenanceLogs.push(maintenanceLog);
      DataStorage.saveMaintenanceLogs(maintenanceLogs);

              const operationId = offlineSyncManager.queueOperation({
          type: 'create',
          entityType: 'equipment_maintenance_logs',
          entityId: maintenanceLog.id,
          data: maintenanceLog,
          priority: 'high'
        });

      return operationId;
    } catch (error) {
      console.error('Failed to create maintenance log:', error);
      throw error;
    }
  }

  static async updateMaintenanceLog(maintenanceId: string, updateData: Partial<EquipmentMaintenanceLog>): Promise<string> {
    try {
      const maintenanceLogs = DataStorage.loadMaintenanceLogs();
      const index = maintenanceLogs.findIndex(log => log.id === maintenanceId);
      
      if (index !== -1) {
        maintenanceLogs[index] = { ...maintenanceLogs[index], ...updateData, updated_at: new Date().toISOString() };
        DataStorage.saveMaintenanceLogs(maintenanceLogs);

        const operationId = offlineSyncManager.queueOperation({
          type: 'update',
          entityType: 'equipment_maintenance_logs',
          entityId: maintenanceId,
          data: maintenanceLogs[index],
          priority: 'medium'
        });

        return operationId;
      } else {
        throw new Error('Maintenance log not found');
      }
    } catch (error) {
      console.error('Failed to update maintenance log:', error);
      throw error;
    }
  }

  static async getAllMaintenanceLogs(): Promise<EquipmentMaintenanceLog[]> {
    return DataStorage.loadMaintenanceLogs();
  }

  // Maintenance Schedule Operations
  static async createMaintenanceSchedule(maintenanceSchedule: EquipmentMaintenanceSchedule): Promise<string> {
    try {
      const maintenanceSchedules = DataStorage.loadMaintenanceSchedules();
      maintenanceSchedules.push(maintenanceSchedule);
      DataStorage.saveMaintenanceSchedules(maintenanceSchedules);

              const operationId = offlineSyncManager.queueOperation({
          type: 'create',
          entityType: 'equipment_maintenance_schedules',
          entityId: maintenanceSchedule.id,
          data: maintenanceSchedule,
          priority: 'medium'
        });

      return operationId;
    } catch (error) {
      console.error('Failed to create maintenance schedule:', error);
      throw error;
    }
  }

  static async updateMaintenanceSchedule(scheduleId: string, updateData: Partial<EquipmentMaintenanceSchedule>): Promise<string> {
    try {
      const maintenanceSchedules = DataStorage.loadMaintenanceSchedules();
      const index = maintenanceSchedules.findIndex(schedule => schedule.id === scheduleId);
      
      if (index !== -1) {
        maintenanceSchedules[index] = { ...maintenanceSchedules[index], ...updateData, updated_at: new Date().toISOString() };
        DataStorage.saveMaintenanceSchedules(maintenanceSchedules);

        const operationId = offlineSyncManager.queueOperation({
          type: 'update',
          entityType: 'equipment_maintenance_schedules',
          entityId: scheduleId,
          data: maintenanceSchedules[index],
          priority: 'medium'
        });

        return operationId;
      } else {
        throw new Error('Maintenance schedule not found');
      }
    } catch (error) {
      console.error('Failed to update maintenance schedule:', error);
      throw error;
    }
  }

  static async getAllMaintenanceSchedules(): Promise<EquipmentMaintenanceSchedule[]> {
    return DataStorage.loadMaintenanceSchedules();
  }

  static async getAllEquipmentLogs(): Promise<EquipmentLog[]> {
    return DataStorage.loadEquipmentLogs();
  }

  // Preventive Maintenance Configuration Operations
  static async createPreventiveMaintenanceConfig(config: any): Promise<string> {
    try {
      // Try to create directly in Supabase first
      const result = await SupabaseRegistrationService.createPreventiveMaintenanceConfig(config);
      if (result.success) {
        // Also save to local storage for offline access
        const configs = DataStorage.loadPreventiveMaintenanceConfigs();
        configs.push(result.data || config);
        DataStorage.savePreventiveMaintenanceConfigs(configs);
        return result.data?.id || config.id;
      } else {
        // If Supabase fails, queue for offline sync
        const configs = DataStorage.loadPreventiveMaintenanceConfigs();
        configs.push(config);
        DataStorage.savePreventiveMaintenanceConfigs(configs);

        const operationId = offlineSyncManager.queueOperation({
          type: 'create',
          entityType: 'preventive_maintenance_config',
          entityId: config.id,
          data: config,
          priority: 'medium'
        });

        return operationId;
      }
    } catch (error) {
      console.error('Failed to create preventive maintenance config:', error);
      throw error;
    }
  }

  static async updatePreventiveMaintenanceConfig(configId: string, updateData: any): Promise<string> {
    try {
      // Try to update directly in Supabase first
      const result = await SupabaseRegistrationService.updatePreventiveMaintenanceConfig(configId, updateData);
      if (result.success) {
        // Also update local storage
        const configs = DataStorage.loadPreventiveMaintenanceConfigs();
        const index = configs.findIndex(config => config.id === configId);
        if (index !== -1) {
          configs[index] = { ...configs[index], ...updateData, updated_at: new Date().toISOString() };
          DataStorage.savePreventiveMaintenanceConfigs(configs);
        }
        return configId;
      } else {
        // If Supabase fails, queue for offline sync
        const configs = DataStorage.loadPreventiveMaintenanceConfigs();
        const index = configs.findIndex(config => config.id === configId);
        
        if (index !== -1) {
          configs[index] = { ...configs[index], ...updateData, updated_at: new Date().toISOString() };
          DataStorage.savePreventiveMaintenanceConfigs(configs);

          const operationId = offlineSyncManager.queueOperation({
            type: 'update',
            entityType: 'preventive_maintenance_config',
            entityId: configId,
            data: configs[index],
            priority: 'medium'
          });

          return operationId;
        } else {
          throw new Error('Preventive maintenance config not found');
        }
      }
    } catch (error) {
      console.error('Failed to update preventive maintenance config:', error);
      throw error;
    }
  }

  static async deletePreventiveMaintenanceConfig(configId: string): Promise<string> {
    try {
      // Try to delete directly in Supabase first
      const result = await SupabaseRegistrationService.deletePreventiveMaintenanceConfig(configId);
      if (result.success) {
        // Also remove from local storage
        const configs = DataStorage.loadPreventiveMaintenanceConfigs();
        const filteredConfigs = configs.filter(config => config.id !== configId);
        DataStorage.savePreventiveMaintenanceConfigs(filteredConfigs);
        return configId;
      } else {
        // If Supabase fails, queue for offline sync
        const configs = DataStorage.loadPreventiveMaintenanceConfigs();
        const filteredConfigs = configs.filter(config => config.id !== configId);
        DataStorage.savePreventiveMaintenanceConfigs(filteredConfigs);

        const operationId = offlineSyncManager.queueOperation({
          type: 'delete',
          entityType: 'preventive_maintenance_config',
          entityId: configId,
          data: { id: configId },
          priority: 'medium'
        });

        return operationId;
      }
    } catch (error) {
      console.error('Failed to delete preventive maintenance config:', error);
      throw error;
    }
  }

  static async getAllPreventiveMaintenanceConfigs(): Promise<any[]> {
    try {
      // Try to get from Supabase first
      const result = await SupabaseRegistrationService.getAllPreventiveMaintenanceConfigs();
      if (result.success && result.data) {
        // Update local storage with fresh data from database
        DataStorage.savePreventiveMaintenanceConfigs(result.data);
        return result.data;
      } else {
        // Fallback to local storage
        console.warn('Failed to fetch from Supabase, using local storage:', result.error);
        return DataStorage.loadPreventiveMaintenanceConfigs();
      }
    } catch (error) {
      console.error('Failed to get preventive maintenance configs:', error);
      // Fallback to local storage
      return DataStorage.loadPreventiveMaintenanceConfigs();
    }
  }
}