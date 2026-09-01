import Papa from 'papaparse';
import { Employee, Equipment, Material, Site, TimeLog, User } from '../types';

interface AppendResult {
  success: boolean;
  message: string;
  recordCount?: number;
  error?: string;
}

interface CSVHeaders {
  [key: string]: string[];
}

// Define CSV headers for each entity type
const CSV_HEADERS: CSVHeaders = {
  employees: [
    'id', 'name', 'type', 'department', 'position', 'bloodGroup', 
    'site', 'qrCode', 'status', 'createdAt', 'lastUpdated', 
    'photo', 'email', 'phone'
  ],
  equipment: [
    'id', 'name', 'type', 'model', 'site', 'qrCode', 'status', 
    'createdAt', 'lastUpdated', 'serialNumber'
  ],
  materials: [
    'id', 'name', 'type', 'unit', 'site', 'qrCode', 'quantity', 
    'status', 'createdAt', 'lastUpdated', 'use'
  ],
  sites: [
    'id', 'name', 'province', 'coordinates', 'address', 'manager', 
    'lastUpdated', 'type'
  ],
  timeLogs: [
    'id', 'entityId', 'entityType', 'action', 'timestamp', 'site', 
    'notes', 'location', 'quantity'
  ],
  users: [
    'id', 'username', 'password', 'role', 'name', 'email', 'site', 
    'isFirstLogin', 'createdAt', 'lastLogin'
  ]
};

export class CSVAppendManager {
  private static readonly STORAGE_PREFIX = 'qr_system_';

  /**
   * Appends new data to existing CSV file in localStorage
   * @param entityType - Type of entity (employees, equipment, etc.)
   * @param newData - New data to append
   * @param validateUnique - Whether to check for duplicate IDs
   * @returns Promise with operation result
   */
  static async appendToCSV<T extends Record<string, any>>(
    entityType: keyof CSVHeaders,
    newData: T | T[],
    validateUnique: boolean = true
  ): Promise<AppendResult> {
    try {
      // Ensure newData is an array
      const dataArray = Array.isArray(newData) ? newData : [newData];
      
      if (dataArray.length === 0) {
        return {
          success: false,
          message: 'No data provided to append',
          error: 'Empty data array'
        };
      }

      // Validate data structure
      const validationResult = this.validateDataStructure(entityType, dataArray);
      if (!validationResult.success) {
        return validationResult;
      }

      // Get storage key
      const storageKey = `${this.STORAGE_PREFIX}${entityType}`;
      
      // Load existing data
      const existingData = this.loadExistingData<T>(storageKey);
      
      // Check for duplicates if validation is enabled
      if (validateUnique) {
        const duplicateCheck = this.checkForDuplicates(existingData, dataArray);
        if (!duplicateCheck.success) {
          return duplicateCheck;
        }
      }

      // Merge data
      const mergedData = [...existingData, ...dataArray];
      
      // Save merged data
      const saveResult = this.saveCSVData(storageKey, mergedData, entityType);
      if (!saveResult.success) {
        return saveResult;
      }

      // Verify data was saved correctly
      const verificationResult = this.verifyDataIntegrity(storageKey, mergedData);
      if (!verificationResult.success) {
        // Rollback on verification failure
        this.saveCSVData(storageKey, existingData, entityType);
        return {
          success: false,
          message: 'Data verification failed, changes rolled back',
          error: verificationResult.error
        };
      }

      // Log successful operation
      this.logOperation(entityType, 'append', dataArray.length);

      return {
        success: true,
        message: `Successfully appended ${dataArray.length} record(s) to ${entityType}`,
        recordCount: mergedData.length
      };

    } catch (error) {
      console.error(`Error appending to CSV for ${entityType}:`, error);
      return {
        success: false,
        message: `Failed to append data to ${entityType}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Creates a new CSV file with headers if it doesn't exist
   */
  static createCSVIfNotExists(entityType: keyof CSVHeaders): AppendResult {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${entityType}`;
      const existingData = localStorage.getItem(storageKey);
      
      if (!existingData) {
        // Create empty CSV with headers
        const headers = CSV_HEADERS[entityType];
        const csv = Papa.unparse([headers]);
        localStorage.setItem(storageKey, csv);
        
        return {
          success: true,
          message: `Created new CSV file for ${entityType} with headers`,
          recordCount: 0
        };
      }
      
      return {
        success: true,
        message: `CSV file for ${entityType} already exists`,
        recordCount: this.loadExistingData(storageKey).length
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create CSV file for ${entityType}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validates data structure against expected headers
   */
  private static validateDataStructure<T>(
    entityType: keyof CSVHeaders, 
    data: T[]
  ): AppendResult {
    const expectedHeaders = CSV_HEADERS[entityType];
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      // Check for required fields (id is always required)
      if (!record.id) {
        return {
          success: false,
          message: `Record ${i + 1} is missing required 'id' field`,
          error: 'Missing required field'
        };
      }

      // Check for unexpected fields
      const recordKeys = Object.keys(record);
      const unexpectedFields = recordKeys.filter(key => !expectedHeaders.includes(key));
      
      if (unexpectedFields.length > 0) {
        console.warn(`Record ${i + 1} contains unexpected fields: ${unexpectedFields.join(', ')}`);
      }
    }
    
    return { success: true, message: 'Data structure validation passed' };
  }

  /**
   * Checks for duplicate IDs in the data
   */
  private static checkForDuplicates<T extends { id: string }>(
    existingData: T[], 
    newData: T[]
  ): AppendResult {
    const existingIds = new Set(existingData.map(item => item.id));
    const newIds = newData.map(item => item.id);
    
    // Check for duplicates within new data
    const newIdSet = new Set(newIds);
    if (newIdSet.size !== newIds.length) {
      const duplicates = newIds.filter((id, index) => newIds.indexOf(id) !== index);
      return {
        success: false,
        message: `Duplicate IDs found in new data: ${duplicates.join(', ')}`,
        error: 'Duplicate IDs in new data'
      };
    }
    
    // Check for duplicates with existing data
    const conflictingIds = newIds.filter(id => existingIds.has(id));
    if (conflictingIds.length > 0) {
      return {
        success: false,
        message: `IDs already exist in database: ${conflictingIds.join(', ')}`,
        error: 'Duplicate IDs with existing data'
      };
    }
    
    return { success: true, message: 'No duplicate IDs found' };
  }

  /**
   * Loads existing data from localStorage
   */
  private static loadExistingData<T>(storageKey: string): T[] {
    try {
      const csv = localStorage.getItem(storageKey);
      if (!csv) return [];
      
      const result = Papa.parse(csv, { 
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      return result.data as T[];
    } catch (error) {
      console.error(`Error loading existing data from ${storageKey}:`, error);
      return [];
    }
  }

  /**
   * Saves CSV data to localStorage
   */
  private static saveCSVData<T>(
    storageKey: string, 
    data: T[], 
    entityType: keyof CSVHeaders
  ): AppendResult {
    try {
      // Ensure all records have the expected structure
      const headers = CSV_HEADERS[entityType];
      const normalizedData = data.map(record => {
        const normalizedRecord: any = {};
        headers.forEach(header => {
          normalizedRecord[header] = (record as any)[header] || '';
        });
        return normalizedRecord;
      });

      const csv = Papa.unparse(normalizedData);
      localStorage.setItem(storageKey, csv);
      
      return {
        success: true,
        message: 'Data saved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to save CSV data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verifies data integrity after save operation
   */
  private static verifyDataIntegrity<T>(storageKey: string, expectedData: T[]): AppendResult {
    try {
      const savedData = this.loadExistingData<T>(storageKey);
      
      if (savedData.length !== expectedData.length) {
        return {
          success: false,
          message: 'Data verification failed: record count mismatch',
          error: `Expected ${expectedData.length} records, found ${savedData.length}`
        };
      }
      
      // Verify last few records match
      const lastExpected = expectedData.slice(-3);
      const lastSaved = savedData.slice(-3);
      
      for (let i = 0; i < lastExpected.length; i++) {
        const expected = lastExpected[i] as any;
        const saved = lastSaved[i] as any;
        
        if (expected.id !== saved.id) {
          return {
            success: false,
            message: 'Data verification failed: ID mismatch in saved data',
            error: `Expected ID ${expected.id}, found ${saved.id}`
          };
        }
      }
      
      return {
        success: true,
        message: 'Data integrity verification passed'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Data verification failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Logs operation for audit trail
   */
  private static logOperation(entityType: string, operation: string, recordCount: number): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      entityType,
      operation,
      recordCount,
      user: this.getCurrentUserId()
    };
    
    console.log('CSV Operation:', logEntry);
    
    // Store in operation log if needed
    try {
      const existingLogs = JSON.parse(localStorage.getItem('qr_system_csv_operations') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 100 operations
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('qr_system_csv_operations', JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('Failed to log CSV operation:', error);
    }
  }

  /**
   * Gets current user ID for logging
   */
  private static getCurrentUserId(): string | undefined {
    try {
      const userStr = localStorage.getItem('qr_system_current_user');
      const user = userStr ? JSON.parse(userStr) : null;
      return user?.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Utility method to get CSV operation logs
   */
  static getOperationLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('qr_system_csv_operations') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Utility method to clear operation logs
   */
  static clearOperationLogs(): void {
    localStorage.removeItem('qr_system_csv_operations');
  }
}

// Convenience functions for each entity type
export const appendEmployee = (employee: Employee | Employee[]) => 
  CSVAppendManager.appendToCSV('employees', employee);

export const appendEquipment = (equipment: Equipment | Equipment[]) => 
  CSVAppendManager.appendToCSV('equipment', equipment);

export const appendMaterial = (material: Material | Material[]) => 
  CSVAppendManager.appendToCSV('materials', material);

export const appendSite = (site: Site | Site[]) => 
  CSVAppendManager.appendToCSV('sites', site);

export const appendTimeLog = (timeLog: TimeLog | TimeLog[]) => 
  CSVAppendManager.appendToCSV('timeLogs', timeLog, false); // Don't validate unique for time logs

export const appendUser = (user: User | User[]) => 
  CSVAppendManager.appendToCSV('users', user);