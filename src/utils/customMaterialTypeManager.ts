export class CustomMaterialTypeManager {
  private static readonly CUSTOM_TYPES_KEY = 'qr_system_custom_material_types';

  // Get all custom material types
  static getCustomTypes(): string[] {
    try {
      const stored = localStorage.getItem(this.CUSTOM_TYPES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading custom material types:', error);
      return [];
    }
  }

  // Add a new custom material type
  static addCustomType(typeName: string): boolean {
    try {
      const customTypes = this.getCustomTypes();
      
      // Check if type already exists
      if (customTypes.includes(typeName)) {
        return false; // Type already exists
      }

      // Add the new type
      const updatedTypes = [...customTypes, typeName];
      localStorage.setItem(this.CUSTOM_TYPES_KEY, JSON.stringify(updatedTypes));
      
      return true;
    } catch (error) {
      console.error('Error adding custom material type:', error);
      return false;
    }
  }

  // Remove a custom material type
  static removeCustomType(typeName: string): boolean {
    try {
      const customTypes = this.getCustomTypes();
      const updatedTypes = customTypes.filter(type => type !== typeName);
      localStorage.setItem(this.CUSTOM_TYPES_KEY, JSON.stringify(updatedTypes));
      
      return true;
    } catch (error) {
      console.error('Error removing custom material type:', error);
      return false;
    }
  }

  // Check if a material type is custom
  static isCustomType(typeName: string): boolean {
    const customTypes = this.getCustomTypes();
    return customTypes.includes(typeName);
  }

  // Get all material types (built-in + custom)
  static getAllMaterialTypes(): string[] {
    const { materialCategories } = require('../data/materialTypes');
    const builtInTypes = Object.values(materialCategories).map((cat: any) => cat.name);
    const customTypes = this.getCustomTypes();
    
    return [...builtInTypes, ...customTypes];
  }

  // Validate material type name
  static validateTypeName(typeName: string): { isValid: boolean; error?: string } {
    if (!typeName || !typeName.trim()) {
      return { isValid: false, error: 'Material type name cannot be empty' };
    }

    if (typeName.length < 2) {
      return { isValid: false, error: 'Material type name must be at least 2 characters long' };
    }

    if (typeName.length > 50) {
      return { isValid: false, error: 'Material type name cannot exceed 50 characters' };
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(typeName)) {
      return { isValid: false, error: 'Material type name contains invalid characters' };
    }

    // Check if type already exists
    const allTypes = this.getAllMaterialTypes();
    if (allTypes.includes(typeName.trim())) {
      return { isValid: false, error: `Material type "${typeName}" already exists` };
    }

    return { isValid: true };
  }

  // Export custom types (for backup)
  static exportCustomTypes(): string {
    try {
      const customTypes = this.getCustomTypes();
      return JSON.stringify(customTypes, null, 2);
    } catch (error) {
      console.error('Error exporting custom material types:', error);
      return '[]';
    }
  }

  // Import custom types (for restore)
  static importCustomTypes(jsonData: string): boolean {
    try {
      const customTypes = JSON.parse(jsonData);
      if (Array.isArray(customTypes)) {
        localStorage.setItem(this.CUSTOM_TYPES_KEY, JSON.stringify(customTypes));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing custom material types:', error);
      return false;
    }
  }

  // Clear all custom types
  static clearAllCustomTypes(): boolean {
    try {
      localStorage.removeItem(this.CUSTOM_TYPES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing custom material types:', error);
      return false;
    }
  }
} 