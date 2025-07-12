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
// Employee types for different employment categories
export const employeeTypes = [
  'Permanent Employee',
  'Contract Employee', 
  'Temporary Employee',
  'Consultant',
  'Rental/Outsourced',
  'Intern/Trainee',
  'Part-time Employee',
  'Seasonal Employee',
  'Freelancer',
  'Subcontractor',
  'Supervisor',
  'Manager',
  'Engineer',
  'Technician',
  'Operator',
  'Labor/Worker'
];

// Get all material types as flat array
export const getAllMaterialTypes = (): string[] => {
  return Object.keys(materialCategories);
};

// Get all equipment types as flat array  
export const getAllEquipmentTypes = (): string[] => {
  return Object.keys(equipmentCategories);
};