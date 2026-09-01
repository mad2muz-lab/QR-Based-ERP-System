import { UNITS_OF_MEASUREMENT } from '../types/constants';

export class CustomUnitManager {
  private static readonly CUSTOM_UNITS_KEY = 'qr_system_custom_units';

  // Get all available units (standard + custom)
  static getAllUnits(): string[] {
    const standardUnits = [...UNITS_OF_MEASUREMENT];
    const customUnits = this.getCustomUnits();
    return [...standardUnits, ...customUnits];
  }

  // Get only custom units
  static getCustomUnits(): string[] {
    try {
      const customUnits = localStorage.getItem(this.CUSTOM_UNITS_KEY);
      return customUnits ? JSON.parse(customUnits) : [];
    } catch (error) {
      console.error('Error loading custom units:', error);
      return [];
    }
  }

  // Add a new custom unit
  static addCustomUnit(unitName: string): boolean {
    try {
      const customUnits = this.getCustomUnits();
      
      // Check if unit already exists (case-insensitive)
      const normalizedUnitName = unitName.trim();
      const exists = [...UNITS_OF_MEASUREMENT, ...customUnits].some(
        unit => unit.toLowerCase() === normalizedUnitName.toLowerCase()
      );
      
      if (exists) {
        console.warn(`Unit "${unitName}" already exists`);
        return false;
      }

      // Add new custom unit
      const updatedCustomUnits = [...customUnits, normalizedUnitName];
      localStorage.setItem(this.CUSTOM_UNITS_KEY, JSON.stringify(updatedCustomUnits));
      
      console.log(`Custom unit "${unitName}" added successfully`);
      return true;
    } catch (error) {
      console.error('Error adding custom unit:', error);
      return false;
    }
  }

  // Remove a custom unit
  static removeCustomUnit(unitName: string): boolean {
    try {
      const customUnits = this.getCustomUnits();
      const updatedCustomUnits = customUnits.filter(unit => unit !== unitName);
      
      localStorage.setItem(this.CUSTOM_UNITS_KEY, JSON.stringify(updatedCustomUnits));
      
      console.log(`Custom unit "${unitName}" removed successfully`);
      return true;
    } catch (error) {
      console.error('Error removing custom unit:', error);
      return false;
    }
  }

  // Check if a unit is custom
  static isCustomUnit(unitName: string): boolean {
    const customUnits = this.getCustomUnits();
    return customUnits.includes(unitName);
  }

  // Check if a unit exists (standard or custom)
  static unitExists(unitName: string): boolean {
    const allUnits = this.getAllUnits();
    return allUnits.some(unit => unit.toLowerCase() === unitName.toLowerCase());
  }

  // Clear all custom units
  static clearCustomUnits(): void {
    try {
      localStorage.removeItem(this.CUSTOM_UNITS_KEY);
      console.log('All custom units cleared');
    } catch (error) {
      console.error('Error clearing custom units:', error);
    }
  }

  // Export custom units for backup
  static exportCustomUnits(): string {
    try {
      const customUnits = this.getCustomUnits();
      return JSON.stringify(customUnits, null, 2);
    } catch (error) {
      console.error('Error exporting custom units:', error);
      return '[]';
    }
  }

  // Import custom units from backup
  static importCustomUnits(unitsJson: string): boolean {
    try {
      const units = JSON.parse(unitsJson);
      if (Array.isArray(units)) {
        localStorage.setItem(this.CUSTOM_UNITS_KEY, unitsJson);
        console.log('Custom units imported successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing custom units:', error);
      return false;
    }
  }
} 