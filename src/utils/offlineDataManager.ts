// Offline Data Manager
// Handles local data operations and queuing for sync

import { Employee, Equipment, Material, Site, TimeLog, User, EmployeeLog, EquipmentLog, MaterialLog } from '../types';
import { DataStorage } from './dataStorage';
import { offlineSyncManager } from './offlineSync';

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

        const operationId = offlineSyncManager.queueOperation({
          type: 'update',
          entityType: 'material',
          entityId: material.id,
          data: material,
          priority: 'medium'
        });

        return operationId;
      } else {
        throw new Error('Material not found');
      }
    } catch (error) {
      console.error('Failed to update material:', error);
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
}