import { v4 as uuidv4 } from 'uuid';
import { DataStorage } from './dataStorage';
import { Equipment } from '../types';

/**
 * Migration script for updating equipment data structure
 * Changes equipment_id from user-provided to auto-generated UUID
 * Adds custom_equipment_id for user-defined identifiers
 */
export class EquipmentMigration {
  /**
   * Migrate existing equipment data to new structure
   * - Convert existing equipment_id to custom_equipment_id
   * - Generate new UUID for equipment_id (primary key)
   */
  static async migrateEquipmentData(): Promise<{ success: boolean; message: string; migratedCount: number }> {
    try {
      console.log('Starting equipment data migration...');
      
      // Load existing equipment data
      const existingEquipment = DataStorage.loadEquipment();
      
      if (existingEquipment.length === 0) {
        return {
          success: true,
          message: 'No equipment data to migrate',
          migratedCount: 0
        };
      }
      
      // Check if migration has already been performed
      const hasCustomEquipmentId = existingEquipment.some(eq => 'custom_equipment_id' in eq);
      if (hasCustomEquipmentId) {
        return {
          success: true,
          message: 'Equipment data already migrated',
          migratedCount: 0
        };
      }
      
      // Create backup before migration
      const backupKey = `equipment_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(existingEquipment));
      console.log(`Backup created with key: ${backupKey}`);
      
      // Migrate equipment data
      const migratedEquipment: Equipment[] = existingEquipment.map(equipment => {
        const oldId = equipment.id;
        
        return {
          ...equipment,
          id: uuidv4(), // Generate new UUID for primary key
          custom_equipment_id: oldId, // Move old ID to custom field
        } as Equipment;
      });
      
      // Save migrated data
      DataStorage.saveEquipment(migratedEquipment);
      
      // Migrate related logs if they exist
      await this.migrateEquipmentLogs(existingEquipment, migratedEquipment);
      
      console.log(`Successfully migrated ${migratedEquipment.length} equipment records`);
      
      return {
        success: true,
        message: `Successfully migrated ${migratedEquipment.length} equipment records`,
        migratedCount: migratedEquipment.length
      };
      
    } catch (error) {
      console.error('Equipment migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migratedCount: 0
      };
    }
  }
  
  /**
   * Migrate equipment logs to use new equipment IDs
   */
  private static async migrateEquipmentLogs(
    oldEquipment: Equipment[], 
    newEquipment: Equipment[]
  ): Promise<void> {
    try {
      // Create mapping from old ID to new ID
      const idMapping = new Map<string, string>();
      oldEquipment.forEach((oldEq, index) => {
        idMapping.set(oldEq.id, newEquipment[index].id);
      });
      
      // Load and update equipment logs
      const equipmentLogs = DataStorage.loadEquipmentLogs();
      if (equipmentLogs.length > 0) {
        const updatedLogs = equipmentLogs.map(log => {
          const newEquipmentId = idMapping.get(log.equipmentId);
          if (newEquipmentId) {
            return {
              ...log,
              equipmentId: newEquipmentId
            };
          }
          return log;
        });
        
        DataStorage.saveEquipmentLogs(updatedLogs);
        console.log(`Updated ${updatedLogs.length} equipment logs`);
      }
      
      // Load and update time logs
      const timeLogs = DataStorage.loadTimeLogs();
      if (timeLogs.length > 0) {
        const updatedTimeLogs = timeLogs.map(log => {
          if (log.entityType === 'equipment') {
            const newEquipmentId = idMapping.get(log.entityId);
            if (newEquipmentId) {
              return {
                ...log,
                entityId: newEquipmentId
              };
            }
          }
          return log;
        });
        
        DataStorage.saveTimeLogs(updatedTimeLogs);
        console.log(`Updated time logs for equipment references`);
      }
      
    } catch (error) {
      console.error('Failed to migrate equipment logs:', error);
      // Don't throw error here as main migration should still succeed
    }
  }
  
  /**
   * Rollback migration if needed
   */
  static async rollbackMigration(backupKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        return {
          success: false,
          message: 'Backup data not found'
        };
      }
      
      const originalEquipment = JSON.parse(backupData);
      DataStorage.saveEquipment(originalEquipment);
      
      // Remove backup after successful rollback
      localStorage.removeItem(backupKey);
      
      return {
        success: true,
        message: `Successfully rolled back ${originalEquipment.length} equipment records`
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Validate custom equipment ID format
   */
  static validateCustomEquipmentId(customId: string): { valid: boolean; error?: string } {
    if (!customId || customId.trim() === '') {
      return { valid: false, error: 'Custom Equipment ID is required' };
    }
    
    // Check format: alphanumeric and dashes only, max 10 characters
    const formatRegex = /^[A-Z0-9-]{1,10}$/;
    if (!formatRegex.test(customId)) {
      return { 
        valid: false, 
        error: 'Custom Equipment ID must be 1-10 characters, uppercase letters, numbers, and dashes only' 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Check if custom equipment ID is unique
   */
  static isCustomEquipmentIdUnique(customId: string, excludeId?: string): boolean {
    const equipment = DataStorage.loadEquipment();
    return !equipment.some(eq => 
      eq.custom_equipment_id === customId && eq.id !== excludeId
    );
  }
}