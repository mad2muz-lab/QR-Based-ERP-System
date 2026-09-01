import { DataStorage } from './dataStorage';
import { Employee, Equipment, Material, Site, EmployeeLog, EquipmentLog, MaterialLog } from '../types';

export class SampleDataInitializer {
  static initializeSampleData(): void {
    // Check if data already exists
    const employees = DataStorage.loadEmployees();
    const equipment = DataStorage.loadEquipment();
    const materials = DataStorage.loadMaterials();
    const sites = DataStorage.loadSites();
    
    // Only initialize if no data exists
    if (employees.length === 0 && equipment.length === 0 && materials.length === 0) {
      console.log('Initializing sample data...');
      
      this.createSampleSites();
      this.createSampleEmployees();
      this.createSampleEquipment();
      this.createSampleMaterials();
      this.createSampleLogs();
      
      console.log('Sample data initialized successfully!');
    }
  }
  
  private static createSampleSites(): void {
    const sampleSites: Site[] = [
      {
        id: 'SITE-001',
        name: 'Main Construction Site',
        address: 'Riyadh, Saudi Arabia',
        coordinates: [46.6753, 24.7136],
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'SITE-002',
        name: 'Secondary Site',
        address: 'Jeddah, Saudi Arabia',
        coordinates: [39.2082, 21.4858],
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    ];
    
    DataStorage.saveSites(sampleSites);
  }
  
  private static createSampleEmployees(): void {
    const sampleEmployees: Employee[] = [
      {
        id: 'EMP-001',
        name: 'Ahmed Al-Rashid',
        department: 'Construction',
        position: 'Site Supervisor',
        bloodGroup: 'O+',
        site: 'SITE-001',
        qrCode: 'EMP-001',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        email: 'ahmed@company.com',
        phone: '+966501234567',
        pin: '1234'
      },
      {
        id: 'EMP-002',
        name: 'Mohammed Al-Fahad',
        department: 'Operations',
        position: 'Equipment Operator',
        bloodGroup: 'A+',
        site: 'SITE-001',
        qrCode: 'EMP-002',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        email: 'mohammed@company.com',
        phone: '+966501234568',
        pin: '5678'
      },
      {
        id: 'EMP-003',
        name: 'Khalid Al-Mutairi',
        department: 'Safety',
        position: 'Safety Officer',
        bloodGroup: 'B+',
        site: 'SITE-002',
        qrCode: 'EMP-003',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        email: 'khalid@company.com',
        phone: '+966501234569',
        pin: '9012'
      }
    ];
    
    DataStorage.saveEmployees(sampleEmployees);
  }
  
  private static createSampleEquipment(): void {
    const sampleEquipment: Equipment[] = [
      {
        id: 'EQP-001',
        name: 'Caterpillar Excavator',
        type: 'Heavy Machinery',
        model: 'CAT 320D',
        site: 'SITE-001',
        qrCode: 'EQP-001',
        status: 'in-use',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        serialNumber: 'CAT320D001'
      },
      {
        id: 'EQP-002',
        name: 'Concrete Mixer',
        type: 'Construction Equipment',
        model: 'CM-500',
        site: 'SITE-001',
        qrCode: 'EQP-002',
        status: 'available',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        serialNumber: 'CM500002'
      },
      {
        id: 'EQP-003',
        name: 'Tower Crane',
        type: 'Heavy Machinery',
        model: 'TC-1200',
        site: 'SITE-002',
        qrCode: 'EQP-003',
        status: 'maintenance',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        serialNumber: 'TC1200003'
      }
    ];
    
    DataStorage.saveEquipment(sampleEquipment);
  }
  
  private static createSampleMaterials(): void {
    const sampleMaterials: Material[] = [
      {
        id: 'MAT-001',
        name: 'Steel Rebar',
        type: 'Construction Material',
        quantity: 500,
        unit: 'tons',
        site: 'SITE-001',
        qrCode: 'MAT-001',
        status: 'available',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'MAT-002',
        name: 'Concrete Mix',
        type: 'Construction Material',
        quantity: 8,
        unit: 'cubic meters',
        site: 'SITE-001',
        qrCode: 'MAT-002',
        status: 'low-stock',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'MAT-003',
        name: 'Safety Helmets',
        type: 'Safety Equipment',
        quantity: 0,
        unit: 'pieces',
        site: 'SITE-002',
        qrCode: 'MAT-003',
        status: 'out-of-stock',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    ];
    
    DataStorage.saveMaterials(sampleMaterials);
  }
  
  private static createSampleLogs(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Create sample employee logs
    const employeeLogs: EmployeeLog[] = [
      {
        id: 'EMP-LOG-001',
        employeeId: 'EMP-001',
        employeeName: 'Ahmed Al-Rashid',
        department: 'Construction',
        site: 'SITE-001',
        action: 'clock-in',
        date: today.toISOString().split('T')[0],
        time: '08:00:00',
        timestamp: new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        notes: 'Started morning shift'
      },
      {
        id: 'EMP-LOG-002',
        employeeId: 'EMP-002',
        employeeName: 'Mohammed Al-Fahad',
        department: 'Operations',
        site: 'SITE-001',
        action: 'clock-in',
        date: today.toISOString().split('T')[0],
        time: '08:30:00',
        timestamp: new Date(today.getTime() + 8.5 * 60 * 60 * 1000).toISOString(),
        notes: 'Equipment operation shift'
      },
      {
        id: 'EMP-LOG-003',
        employeeId: 'EMP-001',
        employeeName: 'Ahmed Al-Rashid',
        department: 'Construction',
        site: 'SITE-001',
        action: 'clock-out',
        date: yesterday.toISOString().split('T')[0],
        time: '17:00:00',
        timestamp: new Date(yesterday.getTime() + 17 * 60 * 60 * 1000).toISOString(),
        notes: 'End of shift'
      }
    ];
    
    // Create sample equipment logs
    const equipmentLogs: EquipmentLog[] = [
      {
        id: 'EQP-LOG-001',
        equipmentId: 'EQP-001',
        equipmentName: 'Caterpillar Excavator',
        equipmentType: 'Heavy Machinery',
        action: 'start-use',
        date: today.toISOString().split('T')[0],
        time: '09:00:00',
        timestamp: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(),
        site: 'SITE-001',
        status: 'in-use',
        notes: 'Foundation excavation work'
      },
      {
        id: 'EQP-LOG-002',
        equipmentId: 'EQP-002',
        equipmentName: 'Concrete Mixer',
        equipmentType: 'Construction Equipment',
        action: 'start-use',
        date: yesterday.toISOString().split('T')[0],
        time: '10:00:00',
        timestamp: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        site: 'SITE-001',
        status: 'in-use',
        notes: 'Concrete mixing for foundation'
      },
      {
        id: 'EQP-LOG-003',
        equipmentId: 'EQP-002',
        equipmentName: 'Concrete Mixer',
        equipmentType: 'Construction Equipment',
        action: 'stop-use',
        date: yesterday.toISOString().split('T')[0],
        time: '15:00:00',
        timestamp: new Date(yesterday.getTime() + 15 * 60 * 60 * 1000).toISOString(),
        site: 'SITE-001',
        status: 'available',
        notes: 'Completed concrete mixing'
      }
    ];
    
    // Create sample material logs
    const materialLogs: MaterialLog[] = [
      {
        id: 'MAT-LOG-001',
        materialId: 'MAT-001',
        materialName: 'Steel Rebar',
        materialType: 'Construction Material',
        action: 'material-in',
        quantity: 100,
        date: yesterday.toISOString().split('T')[0],
        time: '14:00:00',
        timestamp: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        site: 'SITE-001',
        status: 'available',
        notes: 'New shipment received'
      },
      {
        id: 'MAT-LOG-002',
        materialId: 'MAT-002',
        materialName: 'Concrete Mix',
        materialType: 'Construction Material',
        action: 'material-out',
        quantity: 5,
        date: today.toISOString().split('T')[0],
        time: '11:00:00',
        timestamp: new Date(today.getTime() + 11 * 60 * 60 * 1000).toISOString(),
        site: 'SITE-001',
        status: 'low-stock',
        notes: 'Used for foundation work'
      },
      {
        id: 'MAT-LOG-003',
        materialId: 'MAT-003',
        materialName: 'Safety Helmets',
        materialType: 'Safety Equipment',
        action: 'material-out',
        quantity: 15,
        date: yesterday.toISOString().split('T')[0],
        time: '08:00:00',
        timestamp: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        site: 'SITE-002',
        status: 'out-of-stock',
        notes: 'Distributed to new workers'
      }
    ];
    
    DataStorage.saveEmployeeLogs(employeeLogs);
    DataStorage.saveEquipmentLogs(equipmentLogs);
    DataStorage.saveMaterialLogs(materialLogs);
  }
}