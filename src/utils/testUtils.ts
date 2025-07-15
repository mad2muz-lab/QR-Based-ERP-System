import { Employee, Equipment, Material, Site, User, TimeLog } from '../types';

export class TestUtils {
  // Generate mock data for testing
  static generateMockEmployee(overrides: Partial<Employee> = {}): Employee {
    return {
      id: `EMP-${Math.floor(Math.random() * 10000)}`,
      name: `Test Employee ${Math.floor(Math.random() * 1000)}`,
      type: 'full-time',
      department: 'Engineering',
      position: 'Developer',
      bloodGroup: 'A+',
      site: 'Main Office',
      status: 'active',
      photo: '',
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `+966${Math.floor(Math.random() * 900000000) + 100000000}`,
      qrCode: `EMP-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ...overrides
    };
  }

  static generateMockEquipment(overrides: Partial<Equipment> = {}): Equipment {
    return {
      id: `EQ-${Math.floor(Math.random() * 10000)}`,
      custom_equipment_id: `EQ-${Math.floor(Math.random() * 1000)}`,
      name: `Test Equipment ${Math.floor(Math.random() * 1000)}`,
      type: 'vehicle',
      model: 'Test Model',
      serialNumber: `SN${Math.floor(Math.random() * 1000000)}`,
      site: 'Main Office',
      status: 'available',
      qrCode: `EQ-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ...overrides
    };
  }

  static generateMockMaterial(overrides: Partial<Material> = {}): Material {
    return {
      id: `MAT-${Math.floor(Math.random() * 10000)}`,
      name: `Test Material ${Math.floor(Math.random() * 1000)}`,
      type: 'Cement',
      unit: 'pieces',
      quantity: Math.floor(Math.random() * 100),
      status: 'available',
      site: 'Main Office',
      qrCode: `MAT-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ...overrides
    };
  }

  static generateMockSite(overrides: Partial<Site> = {}): Site {
    return {
      id: `SITE-${Math.floor(Math.random() * 10000)}`,
      name: `Test Site ${Math.floor(Math.random() * 1000)}`,
      province: 'Riyadh',
      coordinates: [46.6753, 24.7136], // Riyadh coordinates
      address: 'Test Address',
      manager: 'Test Manager',
      lastUpdated: new Date().toISOString(),
      qrCode: `SITE-${Math.floor(Math.random() * 10000)}`,
      ...overrides
    };
  }

  static generateMockUser(overrides: Partial<User> = {}): User {
    return {
      id: `user-${Math.floor(Math.random() * 10000)}`,
      username: `testuser${Math.floor(Math.random() * 1000)}`,
      password: 'testpass123',
      role: 'operator',
      name: `Test User ${Math.floor(Math.random() * 1000)}`,
      email: `testuser${Math.floor(Math.random() * 1000)}@example.com`,
      site: 'Main Office',
      isFirstLogin: false,
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  static generateMockTimeLog(overrides: Partial<TimeLog> = {}): TimeLog {
    return {
      id: `log-${Math.floor(Math.random() * 10000)}`,
      entityId: `EMP-${Math.floor(Math.random() * 10000)}`,
      entityType: 'employee',
      action: 'clock-in',
      timestamp: new Date().toISOString(),
      site: 'Main Office',
      notes: 'Test log entry',
      location: undefined,
      quantity: undefined,
      ...overrides
    };
  }

  // Generate arrays of mock data
  static generateMockEmployees(count: number = 5): Employee[] {
    return Array.from({ length: count }, () => this.generateMockEmployee());
  }

  static generateMockEquipment(count: number = 5): Equipment[] {
    return Array.from({ length: count }, () => this.generateMockEquipment());
  }

  static generateMockMaterials(count: number = 5): Material[] {
    return Array.from({ length: count }, () => this.generateMockMaterial());
  }

  static generateMockSites(count: number = 5): Site[] {
    return Array.from({ length: count }, () => this.generateMockSite());
  }

  static generateMockUsers(count: number = 5): User[] {
    return Array.from({ length: count }, () => this.generateMockUser());
  }

  static generateMockTimeLogs(count: number = 10): TimeLog[] {
    return Array.from({ length: count }, () => this.generateMockTimeLog());
  }

  // Test helpers
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static mockLocalStorage(): void {
    const store: Record<string, string> = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          Object.keys(store).forEach(key => delete store[key]);
        }
      },
      writable: true
    });
  }

  static mockSupabase(): void {
    // Mock Supabase client - implementation would depend on testing framework
    console.log('Mock Supabase called - implement based on your testing framework');
  }

  // Validation helpers
  static isValidEmployee(employee: any): employee is Employee {
    return (
      employee &&
      typeof employee.id === 'string' &&
      typeof employee.name === 'string' &&
      typeof employee.type === 'string' &&
      typeof employee.department === 'string' &&
      typeof employee.position === 'string' &&
      typeof employee.site === 'string' &&
      typeof employee.status === 'string'
    );
  }

  static isValidEquipment(equipment: any): equipment is Equipment {
    return (
      equipment &&
      typeof equipment.id === 'string' &&
      typeof equipment.custom_equipment_id === 'string' &&
      typeof equipment.name === 'string' &&
      typeof equipment.type === 'string' &&
      typeof equipment.site === 'string' &&
      typeof equipment.status === 'string'
    );
  }

  static isValidMaterial(material: any): material is Material {
    return (
      material &&
      typeof material.id === 'string' &&
      typeof material.name === 'string' &&
      typeof material.category === 'string' &&
      typeof material.unit === 'string' &&
      typeof material.quantity === 'number' &&
      typeof material.status === 'string' &&
      typeof material.site === 'string'
    );
  }

  static isValidSite(site: any): site is Site {
    return (
      site &&
      typeof site.id === 'string' &&
      typeof site.name === 'string' &&
      typeof site.province === 'string' &&
      typeof site.city === 'string' &&
      typeof site.address === 'string' &&
      typeof site.status === 'string'
    );
  }

  // Performance testing helpers
  static measurePerformance<T>(fn: () => T): { result: T; duration: number } {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { result, duration: end - start };
  }

  static async measureAsyncPerformance<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  }
} 