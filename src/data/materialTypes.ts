export const materialCategories = {
  aggregates: {
    name: 'Aggregates',
    icon: '🧱',
    items: [
      { name: 'Crushed Stone (3/4")', use: 'Base course, asphalt mix' },
      { name: 'Crushed Stone (1/2")', use: 'Base course, asphalt mix' },
      { name: 'Coarse Aggregates', use: 'Asphalt and concrete mixes' },
      { name: 'Fine Aggregates (Sand)', use: 'Filler, subbase, plastering' },
      { name: 'Sub-base Material (ABC)', use: 'Road substructure/stabilization' },
      { name: 'Quarry Dust', use: 'Filler in asphalt or base' }
    ]
  },
  bituminous: {
    name: 'Bituminous Materials',
    icon: '🛢',
    items: [
      { name: 'Bitumen (60/70)', use: 'Main binder in asphalt mix' },
      { name: 'Bitumen (80/100)', use: 'Main binder in asphalt mix' },
      { name: 'Cutback Bitumen', use: 'Temporary patching or cold mix' },
      { name: 'Bitumen Emulsion (CRS/RS)', use: 'Prime coat, tack coat' },
      { name: 'Polymer Modified Bitumen', use: 'High-performance asphalt for expressways' },
      { name: 'Asphalt Premix', use: 'Ready asphalt for patch work' }
    ]
  },
  concrete: {
    name: 'Concrete & Cementitious Materials',
    icon: '🏗',
    items: [
      { name: 'Ordinary Portland Cement', use: 'Concrete structures, kerbs, channels' },
      { name: 'Ready-Mix Concrete', use: 'Sidewalks, drains, structures' },
      { name: 'Precast Elements', use: 'Manholes, barriers, kerbs' },
      { name: 'Fly Ash', use: 'Additives to improve strength' },
      { name: 'Silica Fume', use: 'Additives to improve strength' }
    ]
  },
  roadFurniture: {
    name: 'Road Furniture & Fixtures',
    icon: '🚧',
    items: [
      { name: 'Traffic Signs', use: 'Directional and safety signage' },
      { name: 'Road Marking Paint', use: 'Lane and boundary marking' },
      { name: 'Guard Rails', use: 'Edge safety' },
      { name: 'Barriers', use: 'Edge safety' },
      { name: 'Delineators', use: 'Night visibility' },
      { name: 'Reflectors', use: 'Night visibility' },
      { name: 'Sign Posts', use: 'Sign installations' },
      { name: 'Sign Mounts', use: 'Sign installations' }
    ]
  },
  reinforcement: {
    name: 'Reinforcement & Metals',
    icon: '🔩',
    items: [
      { name: 'Rebar (Steel Rods)', use: 'Concrete reinforcement' },
      { name: 'Binding Wire', use: 'Tying reinforcement bars' },
      { name: 'Steel Mesh', use: 'Pavement and slab reinforcement' },
      { name: 'Manhole Covers', use: 'Drainage systems' }
    ]
  },
  waterInfrastructure: {
    name: 'Water Infrastructure',
    icon: '💧',
    items: [
      { name: 'PVC Pipes', use: 'Drainage & stormwater' },
      { name: 'HDPE Pipes', use: 'Drainage & stormwater' },
      { name: 'Concrete Drain Channels', use: 'Side drains' },
      { name: 'Gully Gratings', use: 'Surface water entry points' },
      { name: 'Valve Boxes', use: 'Utility access' },
      { name: 'Chambers', use: 'Utility access' }
    ]
  },
  chemicals: {
    name: 'Construction Chemicals',
    icon: '🧴',
    items: [
      { name: 'Curing Compounds', use: 'Concrete curing' },
      { name: 'Adhesives', use: 'Joint sealing and tile fixing' },
      { name: 'Sealants', use: 'Joint sealing and tile fixing' },
      { name: 'Surface Retarders', use: 'Concrete finishing' }
    ]
  },
  spareParts: {
    name: 'Spare Parts',
    icon: '🔧',
    items: [
      { name: 'Engine Oil Filter', use: 'Engine maintenance and lubrication' },
      { name: 'Air Filter', use: 'Engine air intake filtration' },
      { name: 'Fuel Filter', use: 'Fuel system filtration' },
      { name: 'Hydraulic Oil', use: 'Hydraulic system operation' },
      { name: 'Brake Pads', use: 'Brake system maintenance' },
      { name: 'Brake Discs', use: 'Brake system maintenance' },
      { name: 'Tire Tubes', use: 'Tire maintenance and repair' },
      { name: 'Battery', use: 'Electrical system power' },
      { name: 'Alternator', use: 'Electrical system charging' },
      { name: 'Starter Motor', use: 'Engine starting system' },
      { name: 'Water Pump', use: 'Cooling system operation' },
      { name: 'Thermostat', use: 'Engine temperature control' },
      { name: 'Radiator Hose', use: 'Cooling system connections' },
      { name: 'Fan Belt', use: 'Engine accessory drive' },
      { name: 'Timing Belt', use: 'Engine timing system' },
      { name: 'Spark Plugs', use: 'Engine ignition system' },
      { name: 'Glow Plugs', use: 'Diesel engine starting' },
      { name: 'Injector Nozzles', use: 'Fuel injection system' },
      { name: 'Fuel Pump', use: 'Fuel delivery system' },
      { name: 'Oil Pump', use: 'Engine lubrication system' },
      { name: 'Gear Oil', use: 'Transmission and differential lubrication' },
      { name: 'Grease Fittings', use: 'Lubrication points' },
      { name: 'Seals & Gaskets', use: 'Fluid containment and sealing' },
      { name: 'Bearings', use: 'Rotating component support' },
      { name: 'Bushings', use: 'Component mounting and isolation' },
      { name: 'Bolts & Nuts', use: 'Component fastening' },
      { name: 'Washers', use: 'Fastener load distribution' },
      { name: 'O-Rings', use: 'Fluid sealing' },
      { name: 'Hoses & Pipes', use: 'Fluid and air transfer' },
      { name: 'Electrical Wires', use: 'Electrical system connections' },
      { name: 'Fuses', use: 'Electrical circuit protection' },
      { name: 'Relays', use: 'Electrical system control' },
      { name: 'Sensors', use: 'System monitoring and control' },
      { name: 'Actuators', use: 'System control and operation' },
      { name: 'Control Modules', use: 'Electronic system management' },
      { name: 'Display Units', use: 'Operator interface' },
      { name: 'Switches', use: 'System control' },
      { name: 'Lights & Indicators', use: 'System status indication' },
      { name: 'Mirrors', use: 'Visibility and safety' },
      { name: 'Wipers', use: 'Windshield maintenance' },
      { name: 'Horn', use: 'Safety signaling' },
      { name: 'Seat Belts', use: 'Operator safety' },
      { name: 'Safety Guards', use: 'Equipment protection' },
      { name: 'Warning Labels', use: 'Safety information' },
      { name: 'Tool Kit', use: 'Maintenance and repair tools' },
      { name: 'First Aid Kit', use: 'Emergency medical supplies' },
      { name: 'Fire Extinguisher', use: 'Fire safety equipment' }
    ]
  },
  safety: {
    name: 'Safety & Support Materials',
    icon: '🧯',
    items: [
      { name: 'PPE (Helmets)', use: 'Site safety for manpower' },
      { name: 'PPE (Safety Vests)', use: 'Site safety for manpower' },
      { name: 'Temporary Barricades', use: 'Traffic control' },
      { name: 'Warning Tape', use: 'Site boundary and alerts' },
      { name: 'Traffic Cones', use: 'Site boundary and alerts' }
    ]
  },
  fuel: {
    name: 'Fuel & Consumables',
    icon: '🧃',
    items: [
      { name: 'Diesel', use: 'Running equipment/machinery' },
      { name: 'Lubricants', use: 'Equipment maintenance' },
      { name: 'Grease', use: 'Equipment maintenance' },
      { name: 'Engine Oil', use: 'Routine service for machinery' }
    ]
  },
  miscellaneous: {
    name: 'Miscellaneous',
    icon: '📦',
    items: [
      { name: 'Surveying Equipment', use: 'Site layout and quality control' },
      { name: 'Calibration Sand (Lab use)', use: 'Asphalt/bitumen testing' },
      { name: 'Wooden Formwork', use: 'Concrete structure molds' },
      { name: 'Plyboard', use: 'Concrete structure molds' },
      { name: 'Tarp', use: 'Material cover and curing' },
      { name: 'Plastic Sheet', use: 'Material cover and curing' }
    ]
  }
};

export const equipmentCategories = {
  heavyMachinery: {
    name: 'Heavy Machinery',
    icon: '🚜',
    items: [
      'Excavator', 'Bulldozer', 'Motor Grader', 'Wheel Loader', 'Backhoe Loader',
      'Asphalt Paver', 'Road Roller', 'Compactor', 'Scraper', 'Trencher'
    ]
  },
  liftingEquipment: {
    name: 'Lifting Equipment',
    icon: '🏗️',
    items: [
      'Tower Crane', 'Mobile Crane', 'Overhead Crane', 'Forklift', 'Telehandler',
      'Boom Lift', 'Scissor Lift', 'Chain Hoist', 'Wire Rope Hoist'
    ]
  },
  transportVehicles: {
    name: 'Transport Vehicles',
    icon: '🚛',
    items: [
      'Dump Truck', 'Concrete Mixer Truck', 'Water Tanker', 'Fuel Tanker',
      'Flatbed Truck', 'Pickup Truck', 'Service Van', 'Bus'
    ]
  },
  powerTools: {
    name: 'Power Tools',
    icon: '🔧',
    items: [
      'Concrete Mixer', 'Welding Machine', 'Generator', 'Air Compressor',
      'Jackhammer', 'Concrete Saw', 'Angle Grinder', 'Drill Press'
    ]
  },
  testingEquipment: {
    name: 'Testing Equipment',
    icon: '🔬',
    items: [
      'Core Drilling Machine', 'Concrete Test Hammer', 'Rebar Locator',
      'Soil Compaction Tester', 'Asphalt Thickness Gauge', 'Survey Equipment'
    ]
  },
  safetyEquipment: {
    name: 'Safety Equipment',
    icon: '🦺',
    items: [
      'Safety Barriers', 'Warning Lights', 'Traffic Control Signs',
      'First Aid Station', 'Fire Extinguisher', 'Emergency Shower'
    ]
  }
};

export const siteTypes = [
  'Construction Site',
  'Infrastructure Project',
  'Road Construction',
  'Bridge Construction',
  'Port Development',
  'Airport Development',
  'Industrial Complex',
  'Residential Development',
  'Commercial Development',
  'Maintenance Facility',
  'Storage Facility',
  'Office Complex'
];
// Employee types for different employment categories with sequential codes
export const employeeTypesWithCodes = [
  { code: '01', name: 'Permanent Employee' },
  { code: '02', name: 'Contract Employee' },
  { code: '03', name: 'Temporary Employee' },
  { code: '04', name: 'Consultant' },
  { code: '05', name: 'Rental/Outsourced' },
  { code: '06', name: 'Intern/Trainee' },
  { code: '07', name: 'Part-time Employee' },
  { code: '08', name: 'Seasonal Employee' },
  { code: '09', name: 'Freelancer' },
  { code: '10', name: 'Subcontractor' },
  { code: '11', name: 'Supervisor' },
  { code: '12', name: 'Manager' },
  { code: '13', name: 'Engineer' },
  { code: '14', name: 'Technician' },
  { code: '15', name: 'Operator' },
  { code: '16', name: 'Labor/Worker' }
];

// Legacy employee types array for backward compatibility
export const employeeTypes = employeeTypesWithCodes.map(type => type.name);

// Employee type management utilities
export class EmployeeTypeManager {
  private static readonly CUSTOM_TYPES_KEY = 'qr_system_custom_employee_types';
  private static readonly NEXT_CODE_KEY = 'qr_system_next_employee_type_code';

  // Get all employee types with codes (predefined + custom)
  static getAllEmployeeTypesWithCodes(): { code: string; name: string }[] {
    const customTypes = this.getCustomTypes();
    return [...employeeTypesWithCodes, ...customTypes];
  }

  // Get custom employee types from storage
  static getCustomTypes(): { code: string; name: string }[] {
    try {
      const stored = localStorage.getItem(this.CUSTOM_TYPES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Add a new custom employee type
  static addCustomType(typeName: string): { code: string; name: string } {
    const customTypes = this.getCustomTypes();
    
    // Check if type already exists
    const allTypes = this.getAllEmployeeTypesWithCodes();
    const existingType = allTypes.find(type => type.name.toLowerCase() === typeName.toLowerCase());
    if (existingType) {
      return existingType;
    }

    // Generate next sequential code
    const nextCode = this.getNextCode();
    const newType = { code: nextCode, name: typeName };
    
    // Save to storage
    customTypes.push(newType);
    localStorage.setItem(this.CUSTOM_TYPES_KEY, JSON.stringify(customTypes));
    
    // Update next code counter
    this.incrementNextCode();
    
    return newType;
  }

  // Get the next available code
  private static getNextCode(): string {
    try {
      const stored = localStorage.getItem(this.NEXT_CODE_KEY);
      const nextCode = stored ? parseInt(stored) : 17; // Start after predefined types
      return nextCode.toString().padStart(2, '0');
    } catch {
      return '17';
    }
  }

  // Increment the next code counter
  private static incrementNextCode(): void {
    try {
      const stored = localStorage.getItem(this.NEXT_CODE_KEY);
      const currentCode = stored ? parseInt(stored) : 17;
      localStorage.setItem(this.NEXT_CODE_KEY, (currentCode + 1).toString());
    } catch {
      localStorage.setItem(this.NEXT_CODE_KEY, '18');
    }
  }

  // Get employee type by code
  static getTypeByCode(code: string): { code: string; name: string } | undefined {
    return this.getAllEmployeeTypesWithCodes().find(type => type.code === code);
  }

  // Get employee type by name
  static getTypeByName(name: string): { code: string; name: string } | undefined {
    return this.getAllEmployeeTypesWithCodes().find(type => type.name === name);
  }

  // Format type for display (code-name)
  static formatTypeForDisplay(type: { code: string; name: string }): string {
    return `${type.code}-${type.name}`;
  }

  // Parse formatted type string back to code and name
  static parseFormattedType(formattedType: string): { code: string; name: string } | null {
    const match = formattedType.match(/^(\d{2})-(.+)$/);
    if (match) {
      return { code: match[1], name: match[2] };
    }
    return null;
  }
}

// Get all material types as flat array
export const getAllMaterialTypes = (): string[] => {
  return Object.keys(materialCategories);
};

// Get all equipment types as flat array  
export const getAllEquipmentTypes = (): string[] => {
  return Object.keys(equipmentCategories);
};