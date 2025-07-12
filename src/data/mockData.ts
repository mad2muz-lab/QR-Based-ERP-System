import { Employee, Equipment, Material, Site, TimeLog, Province } from '../types';

export const sites: Site[] = [
  {
    id: 'site-001',
    name: 'Al Khobar Construction Site',
    type: 'Construction Site',
    province: 'Eastern Province',
    coordinates: [50.2089, 26.2172] as [number, number],
    address: 'Al Khobar, Eastern Province',
    manager: 'Ahmed Al-Rashid'
  },
  {
    id: 'site-002',
    name: 'Riyadh Infrastructure Project',
    type: 'Infrastructure Project',
    province: 'Riyadh',
    coordinates: [46.6753, 24.7136] as [number, number],
    address: 'King Fahd Road, Riyadh',
    manager: 'Mohammed Al-Sabti'
  },
  {
    id: 'site-003',
    name: 'Jeddah Port Development',
    type: 'Port Development',
    province: 'Makkah',
    coordinates: [39.1975, 21.4858] as [number, number],
    address: 'Jeddah Port, Makkah Province',
    manager: 'Khalid Al-Ghamdi'
  }
];

export const employees: Employee[] = [
  {
    id: 'EMP-10234',
    name: 'Ali Hassan',
    department: 'Construction',
    position: 'Site Engineer',
    bloodGroup: 'B+',
    site: 'site-001',
    qrCode: 'EMP-10234',
    status: 'active',
    createdAt: '2024-01-15T08:00:00Z',
    accessLevel: 'basic'
  },
  {
    id: 'EMP-10235',
    name: 'Omar Abdullah',
    department: 'Operations',
    position: 'Equipment Operator',
    bloodGroup: 'A+',
    site: 'site-002',
    qrCode: 'EMP-10235',
    status: 'active',
    createdAt: '2024-01-16T09:00:00Z',
    accessLevel: 'basic'
  }
];

export const equipment: Equipment[] = [
  {
    id: 'EQP-PAVER-09',
    name: 'Asphalt Paver',
    type: 'Heavy Machinery',
    model: 'CAT AP655F',
    site: 'site-001',
    qrCode: 'EQP-PAVER-09',
    status: 'available',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'EQP-CRANE-15',
    name: 'Tower Crane',
    type: 'Lifting Equipment',
    model: 'Liebherr 280 EC-H',
    site: 'site-002',
    qrCode: 'EQP-CRANE-15',
    status: 'in-use',
    createdAt: '2024-01-12T11:00:00Z'
  }
];

export const materials: Material[] = [
  {
    id: 'MAT-BITUMEN',
    name: 'Bitumen',
    type: 'Asphalt Materials',
    unit: 'Tons',
    site: 'site-001',
    qrCode: 'MAT-BITUMEN',
    quantity: 150,
    status: 'available',
    createdAt: '2024-01-08T12:00:00Z'
  },
  {
    id: 'MAT-STEEL-BARS',
    name: 'Steel Reinforcement Bars',
    type: 'Construction Materials',
    unit: 'Tons',
    site: 'site-002',
    qrCode: 'MAT-STEEL-BARS',
    quantity: 25,
    status: 'low-stock',
    createdAt: '2024-01-09T13:00:00Z'
  }
];

export const timeLogs: TimeLog[] = [
  {
    id: 'log-001',
    entityId: 'EMP-10234',
    entityType: 'employee',
    action: 'clock-in',
    timestamp: '2024-01-20T07:30:00Z',
    site: 'site-001',
    notes: 'Morning shift start'
  },
  {
    id: 'log-002',
    entityId: 'EQP-PAVER-09',
    entityType: 'equipment',
    action: 'start-use',
    timestamp: '2024-01-20T08:00:00Z',
    site: 'site-001',
    notes: 'Road paving operation'
  },
  {
    id: 'log-003',
    entityId: 'EMP-10234',
    entityType: 'employee',
    action: 'clock-out',
    timestamp: '2024-01-20T17:30:00Z',
    site: 'site-001',
    notes: 'End of shift - Total: 10h 0m, Regular: 8h 0m, Overtime: 2h 0m'
  },
  {
    id: 'log-004',
    entityId: 'MAT-BITUMEN',
    entityType: 'material',
    action: 'material-in',
    timestamp: '2024-01-20T09:00:00Z',
    site: 'site-001',
    notes: 'material-in via QR scan - Quantity: 50',
    quantity: 50
  },
  {
    id: 'log-005',
    entityId: 'MAT-BITUMEN',
    entityType: 'material',
    action: 'material-out',
    timestamp: '2024-01-20T14:00:00Z',
    site: 'site-001',
    notes: 'material-out via QR scan - Quantity: 25',
    quantity: 25
  }
];

export const provinces: Province[] = [
  {
    name: 'Eastern Province',
    coordinates: [50.0, 26.0],
    sites: sites.filter(s => s.province === 'Eastern Province'),
    stats: { employees: 45, equipment: 12, materials: 8 }
  },
  {
    name: 'Riyadh',
    coordinates: [46.7, 24.7],
    sites: sites.filter(s => s.province === 'Riyadh'),
    stats: { employees: 78, equipment: 23, materials: 15 }
  },
  {
    name: 'Makkah',
    coordinates: [39.8, 21.4],
    sites: sites.filter(s => s.province === 'Makkah'),
    stats: { employees: 52, equipment: 18, materials: 11 }
  }
];