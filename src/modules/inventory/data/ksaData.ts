// KSA Inventory Management - Data Models and Sample Data

export type MaterialType = 'raw' | 'finished' | 'consumable' | 'spare' | 'tool';
export type ItemStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved' | 'quarantine';
export type ZoneCategory = 'receiving' | 'storage' | 'picking' | 'shipping' | 'cold' | 'hazmat' | 'quarantine';
export type MovementType = 'received' | 'issued' | 'transferred' | 'adjusted' | 'returned';
export type WarehouseStatus = 'active' | 'maintenance' | 'full';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  coordinates: { lat: number; lng: number };
  manager: string;
  capacity: number;
  established: string;
  status: WarehouseStatus;
}

export interface Region {
  id: string;
  name: string;
  arabicName: string;
  capital: string;
  color: string;
  warehouses: Warehouse[];
}

export interface Zone {
  id: string;
  warehouseId: string;
  name: string;
  category: ZoneCategory;
  capacity: number;
  usedCapacity: number;
}

export interface MaterialItem {
  id: string;
  sku: string;
  name: string;
  arabicName?: string;
  description?: string;
  category: string;
  type: MaterialType;
  unit: string;
  quantity: number;
  reserved: number;
  minStock: number;
  maxStock?: number;
  reorderLevel: number;
  safetyStock?: number;
  unitCost: number;
  sellingPrice?: number;
  taxRate?: number;
  location: string;
  zoneId: string;
  warehouseId: string;
  qrCode: string;
  supplier?: string;
  supplierLeadTime?: number;
  lastReceived: string;
  lastIssued?: string;
  status: ItemStatus;
  batchNumber?: string;
  manufacturingDate?: string;
  expirationDate?: string;
  serialNumber?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reference: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
  color: string;
  unit: string;
}

const CATEGORIES: MaterialCategory[] = [
  { id: 'cement', name: 'Cement & Concrete', arabicName: 'أسمنت وخرسانة', icon: '🏗️', color: '#6b4722', unit: 'kg' },
  { id: 'steel', name: 'Steel & Metals', arabicName: 'معادن وفولاذ', icon: '🔩', color: '#4b5563', unit: 'kg' },
  { id: 'aggregates', name: 'Aggregates', arabicName: 'وسائط حجرية', icon: '🪨', color: '#94a3b8', unit: 'kg' },
  { id: 'tools', name: 'Tools & Equipment', arabicName: 'أدوات ومعدات', icon: '🔧', color: '#3b82f6', unit: 'pcs' },
  { id: 'safety', name: 'Safety Equipment', arabicName: 'معدات السلامة', icon: '🦺', color: '#ef4444', unit: 'pcs' },
  { id: 'electrical', name: 'Electrical', arabicName: 'كهربائيات', icon: '💡', color: '#eab308', unit: 'pcs' },
  { id: 'plumbing', name: 'Plumbing', arabicName: 'سباكة', icon: '🚰', color: '#06b6d4', unit: 'pcs' },
  { id: 'painting', name: 'Paint & Finishing', arabicName: 'دهان وتشطيق', icon: '🎨', color: '#ec4899', unit: 'pcs' },
];

function generateItems(warehouse: Warehouse, count: number): MaterialItem[] {
  const items: MaterialItem[] = [];
  const zones = ZONES.filter(z => z.warehouseId === warehouse.id && z.category !== 'shipping');
  const allItems = [
    'Portland Cement 50kg', 'Ready Mix Concrete', 'Mortar Mix', 'Cement Bags', 'Concrete Blocks', 'Reinforcement Bars',
    'Steel Rebar 12mm', 'Steel Rebar 16mm', 'I-Beams', 'Steel Plates', 'Wire Mesh', 'Galvanized Pipes',
    'Sand (Cubic Meter)', 'Gravel 20mm', 'Crushed Stone', 'Limestone', 'White Sand', 'Decorative Stone',
    'Power Drill', 'Angle Grinder', 'Circular Saw', 'Welding Machine', 'Concrete Mixer', 'Tower Crane Parts',
    'Hard Hats', 'Safety Vests', 'Safety Gloves', 'Safety Goggles', 'Harnesses', 'Respirators',
    'Cables 2.5mm', 'Circuit Breakers', 'LED Lights', 'Conduits', 'Junction Boxes', 'Switches',
    'PVC Pipes 4"', 'Copper Pipes', 'Valves', 'Faucets', 'Drainage Pipes', 'Water Tanks',
    'White Paint 20L', 'Primer', 'Wall Putty', 'Sandpaper', 'Brushes', 'Rollers'
  ];

  for (let i = 0; i < count; i++) {
    const itemName = allItems[i % allItems.length];
    const catIdx = Math.floor(i / 6) % CATEGORIES.length;
    const category = CATEGORIES[catIdx];
    const zone = zones[i % zones.length] || zones[0];
    const quantity = Math.floor(Math.random() * 5000) + 50;
    const reorderLevel = Math.floor(quantity * 0.2);
    const unitCost = Math.floor(Math.random() * 200) + 5;
    const status: ItemStatus = quantity === 0 ? 'out_of_stock' : quantity <= reorderLevel ? 'low_stock' : 'in_stock';
    
    items.push({
      id: `item-${warehouse.id}-${i + 1}`,
      sku: `${warehouse.code}-${String(i + 1).padStart(4, '0')}`,
      name: itemName,
      arabicName: itemName,
      category: category.name,
      type: ['raw', 'spare', 'tool'].includes(category.type) ? category.type as MaterialType : 
            category.id === 'safety' || category.id === 'electrical' || category.id === 'plumbing' ? 'consumable' : 'raw',
      unit: category.unit,
      quantity,
      reserved: Math.floor(quantity * (Math.random() * 0.15)),
      minStock: Math.floor(quantity * 0.1),
      maxStock: Math.ceil(quantity * 2.5),
      reorderLevel,
      safetyStock: Math.floor(quantity * 0.05),
      unitCost,
      sellingPrice: unitCost * (1 + Math.random() * 1.5),
      taxRate: 15, // VAT in KSA
      location: `${String.fromCharCode(65 + (i % 8))}${(Math.floor(i / 8) % 12) + 1}-${(i % 6) + 1}-${(i % 4) + 1}`,
      zoneId: zone?.id || '',
      warehouseId: warehouse.id,
      qrCode: `INV-${warehouse.code}-${String(i + 1).padStart(4, '0')}`,
      supplier: ['Saudi Cement Co.', 'SABIC Steel', 'Al-Kifah Construction', 'Bin Harkil', 'Al-Bawani Steel', 'Al-Mushrif'][i % 6],
      supplierLeadTime: [7, 14, 21, 30][i % 4],
      lastReceived: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().split('T')[0],
      lastIssued: Math.random() > 0.4 ? new Date(Date.now() - Math.random() * 14 * 86400000).toISOString().split('T')[0] : undefined,
      batchNumber: `BATCH-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      manufacturingDate: new Date(Date.now() - Math.random() * 180 * 86400000).toISOString().split('T')[0],
      expirationDate: i % 5 === 0 ? new Date(Date.now() + Math.random() * 90 * 86400000).toISOString().split('T')[0] : undefined,
      serialNumber: i % 8 === 0 ? `SN-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}` : undefined,
      status
    });
  }
  return items;
}

// Define warehouse data with KSA region mapping
export const REGIONS: Region[] = [
  {
    id: 'central',
    name: 'Central Region',
    arabicName: 'المنطقة الوسطى',
    capital: 'Riyadh',
    color: '#3b82f6',
    warehouses: [
      { id: 'wh-ryd-001', name: 'Riyadh Main Warehouse', code: 'RYD-01', city: 'Riyadh', address: 'Industrial Area 2, Riyadh 11564', coordinates: { lat: 24.7136, lng: 46.6753 }, manager: 'Ahmed Al-Saud', capacity: 50000, established: '2018-03-15', status: 'active' },
      { id: 'wh-ryd-002', name: 'Al-Kharj Distribution Center', code: 'RYD-02', city: 'Al-Kharj', address: 'Al-Kharj Industrial Zone, 11942', coordinates: { lat: 24.1486, lng: 47.3050 }, manager: 'Mohammed Al-Otaibi', capacity: 25000, established: '2019-08-22', status: 'active' },
      { id: 'wh-ryd-003', name: 'Riyadh Cold Storage', code: 'RYD-03', city: 'Riyadh', address: 'Second Industrial City, Riyadh 14334', coordinates: { lat: 24.8232, lng: 46.7712 }, manager: 'Khalid Al-Ghamdi', capacity: 15000, established: '2020-11-10', status: 'active' },
      { id: 'wh-ryd-004', name: 'Dawadmi Warehouse', code: 'RYD-04', city: 'Dawadmi', address: 'King Fahd Road, Dawadmi 17411', coordinates: { lat: 24.5072, lng: 44.3924 }, manager: 'Faisal Al-Dosari', capacity: 12000, established: '2021-05-18', status: 'active' },
      { id: 'wh-ryd-005', name: 'Riyadh Hazm Stockyard', code: 'RYD-05', city: 'Riyadh', address: 'Hazm Al-Mulaihim, Riyadh 11564', coordinates: { lat: 24.5401, lng: 46.8231 }, manager: 'Saeed Al-Sharif', capacity: 20000, established: '2022-01-25', status: 'maintenance' }
    ]
  },
  {
    id: 'western',
    name: 'Western Region',
    arabicName: 'المنطقة الغربية',
    capital: 'Jeddah',
    color: '#10b981',
    warehouses: [
      { id: 'wh-jed-001', name: 'Jeddah Main Port Warehouse', code: 'JED-01', city: 'Jeddah', address: 'Port Industrial Area, Jeddah 21577', coordinates: { lat: 21.4858, lng: 39.1925 }, manager: 'Omar Al-Harbi', capacity: 45000, established: '2017-06-20', status: 'active' },
      { id: 'wh-jed-002', name: 'Makkah Storage Facility', code: 'JED-02', city: 'Makkah', address: 'Aisha Road, Makkah 24231', coordinates: { lat: 21.4225, lng: 39.8262 }, manager: 'Tariq Al-Mutairi', capacity: 30000, established: '2018-12-05', status: 'active' },
      { id: 'wh-jed-003', name: 'Taif Cold Storage', code: 'JED-03', city: 'Taif', address: 'King Abdulaziz Road, Taif 26513', coordinates: { lat: 21.4373, lng: 40.5127 }, manager: 'Nasser Al-Zahrani', capacity: 18000, established: '2019-09-14', status: 'active' },
      { id: 'wh-mdn-001', name: 'Madinah Warehouse', code: 'MDN-01', city: 'Madinah', address: 'Al-Hijrah Road, Madinah 42313', coordinates: { lat: 24.4708, lng: 39.6112 }, manager: 'Hassan Al-Balawi', capacity: 22000, established: '2020-04-08', status: 'active' }
    ]
  },
  {
    id: 'eastern',
    name: 'Eastern Region',
    arabicName: 'المنطقة الشرقية',
    capital: 'Dammam',
    color: '#f59e0b',
    warehouses: [
      { id: 'wh-dmm-001', name: 'Dammam Main Warehouse', code: 'DMM-01', city: 'Dammam', address: 'Second Industrial City, Dammam 34332', coordinates: { lat: 26.4207, lng: 50.0888 }, manager: 'Salem Al-Mansoori', capacity: 40000, established: '2018-02-12', status: 'active' },
      { id: 'wh-dmm-002', name: 'Al-Khobar Warehouse', code: 'DMM-02', city: 'Al-Khobar', address: 'King Abdulaziz Road, Al-Khobar 31952', coordinates: { lat: 26.2794, lng: 50.2083 }, manager: 'Majed Al-Dossary', capacity: 28000, established: '2019-07-30', status: 'active' },
      { id: 'wh-dmm-003', name: 'Jubail Industrial Warehouse', code: 'DMM-03', city: 'Jubail', address: 'Jubail Industrial City, 31961', coordinates: { lat: 27.0046, lng: 49.6225 }, manager: 'Bandar Al-Mutlaq', capacity: 35000, established: '2020-11-22', status: 'full' }
    ]
  },
  {
    id: 'southern',
    name: 'Southern Region',
    arabicName: 'المنطقة الجنوبية',
    capital: 'Abha',
    color: '#8b5cf6',
    warehouses: [
      { id: 'wh-abh-001', name: 'Abha Main Warehouse', code: 'ABH-01', city: 'Abha', address: 'Industrial Area, Abha 61411', coordinates: { lat: 18.2164, lng: 42.5053 }, manager: 'Yahya Al-Qahtani', capacity: 25000, established: '2019-05-15', status: 'active' },
      { id: 'wh-njn-001', name: 'Najran Warehouse', code: 'NJN-01', city: 'Najran', address: 'King Abdulaziz Road, Najran 61441', coordinates: { lat: 17.5650, lng: 44.2283 }, manager: 'Saud Al-Malki', capacity: 18000, established: '2020-08-30', status: 'active' }
    ]
  },
  {
    id: 'northern',
    name: 'Northern Region',
    arabicName: 'المنطقة الشمالية',
    capital: 'Tabuk',
    color: '#06b6d4',
    warehouses: [
      { id: 'wh-tbk-001', name: 'Tabuk Main Warehouse', code: 'TBK-01', city: 'Tabuk', address: 'Industrial City, Tabuk 71411', coordinates: { lat: 28.3835, lng: 36.5662 }, manager: 'Mishaal Al-Suwailem', capacity: 20000, established: '2019-10-12', status: 'active' },
      { id: 'wh-hfl-001', name: 'Hail Warehouse', code: 'HFL-01', city: 'Hail', address: 'King Salman Road, Hail 55411', coordinates: { lat: 27.5114, lng: 41.7208 }, manager: 'Abdulrahman Al-Anzi', capacity: 15000, established: '2020-06-25', status: 'active' }
    ]
  },
  {
    id: 'qassim',
    name: 'Qassim Region',
    arabicName: 'منطقة القصيم',
    capital: 'Buraidah',
    color: '#6366f1',
    warehouses: [
      { id: 'wh-brd-001', name: 'Buraidah Main Warehouse', code: 'BRD-01', city: 'Buraidah', address: 'Industrial Area, Buraidah 51411', coordinates: { lat: 26.3592, lng: 43.9738 }, manager: 'Fahad Al-Rashidi', capacity: 22000, established: '2019-03-08', status: 'active' },
      { id: 'wh-brd-002', name: 'Unaizah Warehouse', code: 'BRD-02', city: 'Unaizah', address: 'King Abdulaziz Road, Unaizah 56211', coordinates: { lat: 26.0840, lng: 43.9930 }, manager: 'Othman Al-Mutairi', capacity: 16000, established: '2020-09-15', status: 'active' }
    ]
  }
];

export const ZONES: Zone[] = [];

REGIONS.forEach(region => {
  region.warehouses.forEach(wh => {
    const zoneCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < zoneCount; i++) {
      const categories: ZoneCategory[] = ['storage', 'storage', 'storage', 'receiving', 'picking', 'shipping', 'cold', 'hazmat'];
      ZONES.push({
        id: `zone-${wh.id}-${i + 1}`,
        warehouseId: wh.id,
        name: ['Main Storage', 'Cold Storage', 'Receiving Bay', 'Picking Area', 'Shipping Dock', 'Hazmat Zone', 'Quarantine', 'Bulk Yard'][i % 8],
        category: categories[i % categories.length],
        capacity: Math.floor(Math.random() * 5000) + 2000,
        usedCapacity: Math.floor(Math.random() * 800) + 200,
      });
    }
  });
});

// Generate all inventory items
export const INVENTORY_ITEMS: MaterialItem[] = [];
REGIONS.forEach(region => {
  region.warehouses.forEach(wh => {
    INVENTORY_ITEMS.push(...generateItems(wh, 30));
  });
});

export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'mv-001', itemId: 'item-wh-ryd-001-0001', itemName: 'Portland Cement 50kg', sku: 'RYD-01-0001', type: 'received', quantity: 500, fromLocation: 'Saudi Cement Co.', toLocation: 'RYD-01-1', reference: 'PO-2024-1234', performedBy: 'Ahmed Al-Saud', timestamp: '2025-08-25T09:30:00Z' },
  { id: 'mv-002', itemId: 'item-wh-ryd-001-0002', itemName: 'Steel Rebar 12mm', sku: 'RYD-01-0002', type: 'issued', quantity: 50, fromLocation: 'RYD-01-2', toLocation: 'Site-1234', reference: 'REQ-2024-5678', performedBy: 'Mohammed Khan', timestamp: '2025-08-25T11:15:00Z', notes: 'Construction project A' },
  { id: 'mv-003', itemId: 'item-wh-ryd-001-0003', itemName: 'Safety Helmets', sku: 'RYD-01-0003', type: 'transferred', quantity: 100, fromLocation: 'RYD-01-3', toLocation: 'JED-01-1', reference: 'TR-2024-0045', performedBy: 'Khalid Al-Ghamdi', timestamp: '2025-08-25T14:20:00Z' },
  { id: 'mv-004', itemId: 'item-wh-ryd-001-0004', itemName: 'White Paint 20L', sku: 'RYD-01-0004', type: 'adjusted', quantity: -5, reference: 'ADJ-2024-0012', performedBy: 'Faisal Al-Dosari', timestamp: '2025-08-25T15:45:00Z', notes: 'Damaged during transit' },
  { id: 'mv-005', itemId: 'item-wh-ryd-001-0005', itemName: 'PVC Pipes 4"', sku: 'RYD-01-0005', type: 'returned', quantity: 25, fromLocation: 'Site-5678', toLocation: 'RYD-01-4', reference: 'RET-2024-0023', performedBy: 'Saeed Al-Sharif', timestamp: '2025-08-25T16:30:00Z' },
  { id: 'mv-006', itemId: 'item-wh-ryd-001-0006', itemName: 'Power Drill', sku: 'RYD-01-0006', type: 'issued', quantity: 3, fromLocation: 'RYD-01-5', toLocation: 'Site-9012', reference: 'REQ-2024-5679', performedBy: 'Omar Al-Harbi', timestamp: '2025-08-25T17:00:00Z' },
  { id: 'mv-007', itemId: 'item-wh-jed-001-0007', itemName: 'Sand (Cubic Meter)', sku: 'JED-01-0007', type: 'received', quantity: 1000, fromLocation: 'Local Quarry', toLocation: 'JED-01-1', reference: 'PO-2024-1235', performedBy: 'Tariq Al-Mutairi', timestamp: '2025-08-25T08:00:00Z' },
  { id: 'mv-008', itemId: 'item-wh-jed-001-0008', itemName: 'LED Lights', sku: 'JED-01-0008', type: 'issued', quantity: 200, fromLocation: 'JED-01-2', toLocation: 'Site-3456', reference: 'REQ-2024-5680', performedBy: 'Nasser Al-Zahrani', timestamp: '2025-08-25T10:30:00Z' },
  { id: 'mv-009', itemId: 'item-wh-dmm-001-0009', itemName: 'Cables 2.5mm', sku: 'DMM-01-0009', type: 'transferred', quantity: 500, fromLocation: 'DMM-01-2', toLocation: 'RYD-01-3', reference: 'TR-2024-0046', performedBy: 'Salem Al-Mansoori', timestamp: '2025-08-25T12:00:00Z' },
  { id: 'mv-010', itemId: 'item-wh-abh-001-0010', itemName: 'Safety Vests', sku: 'ABH-01-0010', type: 'received', quantity: 300, fromLocation: 'Safety First Co.', toLocation: 'ABH-01-1', reference: 'PO-2024-1236', performedBy: 'Yahya Al-Qahtani', timestamp: '2025-08-25T13:00:00Z' }
];

export { CATEGORIES };
