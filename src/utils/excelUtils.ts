import * as XLSX from 'xlsx';
import { Employee, Equipment, Material, Site } from '../types';

// Excel template generators
export const generateEmployeeTemplate = () => {
  const template = [
    {
      'Employee ID': 'EMP-001',
      'Employee Name': 'John Doe',
      'Department': 'Construction',
      'Position': 'Site Engineer',
      'Site ID': 'site-001',
      'Status': 'active'
    },
    {
      'Employee ID': 'EMP-002',
      'Employee Name': 'Jane Smith',
      'Department': 'Operations',
      'Position': 'Equipment Operator',
      'Site ID': 'site-002',
      'Status': 'active'
    }
  ];
  return template;
};

export const generateEquipmentTemplate = () => {
  const template = [
    {
      'Equipment ID': 'EQP-001',
      'Equipment Name': 'Asphalt Paver',
      'Type': 'Heavy Machinery',
      'Model': 'CAT AP655F',
      'Serial Number': 'AP655F-2024-001',
      'Site ID': 'site-001',
      'Status': 'available'
    },
    {
      'Equipment ID': 'EQP-002',
      'Equipment Name': 'Tower Crane',
      'Type': 'Lifting Equipment',
      'Model': 'Liebherr 280 EC-H',
      'Serial Number': 'LH280-2024-002',
      'Site ID': 'site-002',
      'Status': 'available'
    }
  ];
  return template;
};

export const generateMaterialTemplate = () => {
  const template = [
    {
      'Material ID': 'MAT-001',
      'Material Name': 'Bitumen (60/70)',
      'Type': 'Bituminous Materials',
      'Unit': 'Tons',
      'Initial Quantity': 150,
      'Site ID': 'site-001',
      'Usage Description': 'Main binder in asphalt mix',
      'Status': 'available'
    },
    {
      'Material ID': 'MAT-002',
      'Material Name': 'Steel Reinforcement Bars',
      'Type': 'Reinforcement & Metals',
      'Unit': 'Tons',
      'Initial Quantity': 25,
      'Site ID': 'site-002',
      'Usage Description': 'Concrete reinforcement',
      'Status': 'available'
    }
  ];
  return template;
};

export const generateSiteTemplate = () => {
  const template = [
    {
      'Site ID': 'SITE-001',
      'Site Name': 'Al Khobar Construction Site',
      'Site Type': 'Construction Site',
      'Province': 'Eastern Province',
      'Address': 'Al Khobar, Eastern Province',
      'Site Manager': 'Ahmed Al-Rashid',
      'Latitude': 26.2172,
      'Longitude': 50.2089
    },
    {
      'Site ID': 'SITE-002',
      'Site Name': 'Riyadh Infrastructure Project',
      'Site Type': 'Infrastructure Project',
      'Province': 'Riyadh',
      'Address': 'King Fahd Road, Riyadh',
      'Site Manager': 'Mohammed Al-Sabti',
      'Latitude': 24.7136,
      'Longitude': 46.6753
    }
  ];
  return template;
};

// Export functions
export const exportEmployeesToExcel = (employees: Employee[], filename: string = 'employees.xlsx') => {
  const data = employees.map(emp => ({
    'Employee ID': emp.id,
    'Employee Name': emp.name,
    'Department': emp.department,
    'Position': emp.position,
    'Site ID': emp.site,
    'Status': emp.status,
    'Created Date': new Date(emp.createdAt).toLocaleDateString(),
    'QR Code': emp.qrCode
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
  XLSX.writeFile(workbook, filename);
};

export const exportEquipmentToExcel = (equipment: Equipment[], filename: string = 'equipment.xlsx') => {
  const data = equipment.map(eq => ({
    'Equipment ID': eq.id,
    'Equipment Name': eq.name,
    'Type': eq.type,
    'Model': eq.model,
    'Serial Number': eq.serialNumber || '',
    'Site ID': eq.site,
    'Status': eq.status,
    'Created Date': new Date(eq.createdAt).toLocaleDateString(),
    'QR Code': eq.qrCode
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment');
  XLSX.writeFile(workbook, filename);
};

export const exportMaterialsToExcel = (materials: Material[], filename: string = 'materials.xlsx') => {
  const data = materials.map(mat => ({
    'Material ID': mat.id,
    'Material Name': mat.name,
    'Type': mat.type,
    'Unit': mat.unit,
    'Current Quantity': mat.quantity,
    'Site ID': mat.site,
    'Status': mat.status,
    'Usage Description': mat.use || '',
    'Created Date': new Date(mat.createdAt).toLocaleDateString(),
    'QR Code': mat.qrCode
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials');
  XLSX.writeFile(workbook, filename);
};

export const exportSitesToExcel = (sites: Site[], filename: string = 'sites.xlsx') => {
  const data = sites.map(site => ({
    'Site ID': site.id,
    'Site Name': site.name,
    'Site Type': site.type || '',
    'Province': site.province,
    'Address': site.address,
    'Site Manager': site.manager,
    'Latitude': site.coordinates[1],
    'Longitude': site.coordinates[0]
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites');
  XLSX.writeFile(workbook, filename);
};

// Template download functions
export const downloadEmployeeTemplate = () => {
  const template = generateEmployeeTemplate();
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');
  
  // Add instructions sheet
  const instructions = [
    { 'Field': 'Employee ID', 'Description': 'Unique identifier for employee (leave blank for auto-generation)', 'Required': 'No', 'Example': 'EMP-001' },
    { 'Field': 'Employee Name', 'Description': 'Full name of the employee', 'Required': 'Yes', 'Example': 'John Doe' },
    { 'Field': 'Department', 'Description': 'Employee department', 'Required': 'Yes', 'Example': 'Construction, Operations, Maintenance' },
    { 'Field': 'Position', 'Description': 'Job position/title', 'Required': 'Yes', 'Example': 'Site Engineer, Operator' },
    { 'Field': 'Site ID', 'Description': 'ID of the site where employee works', 'Required': 'Yes', 'Example': 'site-001' },
    { 'Field': 'Status', 'Description': 'Employee status', 'Required': 'Yes', 'Example': 'active, inactive' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  
  XLSX.writeFile(workbook, 'employee_template.xlsx');
};

export const downloadEquipmentTemplate = () => {
  const template = generateEquipmentTemplate();
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment Template');
  
  const instructions = [
    { 'Field': 'Equipment ID', 'Description': 'Unique identifier for equipment (leave blank for auto-generation)', 'Required': 'No', 'Example': 'EQP-001' },
    { 'Field': 'Equipment Name', 'Description': 'Name of the equipment', 'Required': 'Yes', 'Example': 'Asphalt Paver' },
    { 'Field': 'Type', 'Description': 'Equipment category', 'Required': 'Yes', 'Example': 'Heavy Machinery, Lifting Equipment' },
    { 'Field': 'Model', 'Description': 'Equipment model', 'Required': 'Yes', 'Example': 'CAT AP655F' },
    { 'Field': 'Serial Number', 'Description': 'Equipment serial number', 'Required': 'No', 'Example': 'AP655F-2024-001' },
    { 'Field': 'Site ID', 'Description': 'ID of the site where equipment is located', 'Required': 'Yes', 'Example': 'site-001' },
    { 'Field': 'Status', 'Description': 'Equipment status', 'Required': 'Yes', 'Example': 'available, in-use, maintenance' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  
  XLSX.writeFile(workbook, 'equipment_template.xlsx');
};

export const downloadMaterialTemplate = () => {
  const template = generateMaterialTemplate();
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Material Template');
  
  const instructions = [
    { 'Field': 'Material ID', 'Description': 'Unique identifier for material (leave blank for auto-generation)', 'Required': 'No', 'Example': 'MAT-001' },
    { 'Field': 'Material Name', 'Description': 'Name of the material', 'Required': 'Yes', 'Example': 'Bitumen (60/70)' },
    { 'Field': 'Type', 'Description': 'Material category', 'Required': 'Yes', 'Example': 'Bituminous Materials, Aggregates' },
    { 'Field': 'Unit', 'Description': 'Unit of measurement', 'Required': 'Yes', 'Example': 'Tons, Pieces, Liters' },
    { 'Field': 'Initial Quantity', 'Description': 'Starting quantity', 'Required': 'Yes', 'Example': '150' },
    { 'Field': 'Site ID', 'Description': 'ID of the site where material is stored', 'Required': 'Yes', 'Example': 'site-001' },
    { 'Field': 'Usage Description', 'Description': 'How the material is used', 'Required': 'No', 'Example': 'Main binder in asphalt mix' },
    { 'Field': 'Status', 'Description': 'Material status', 'Required': 'Yes', 'Example': 'available, low-stock, out-of-stock' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  
  XLSX.writeFile(workbook, 'material_template.xlsx');
};

export const downloadSiteTemplate = () => {
  const template = generateSiteTemplate();
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Site Template');
  
  const instructions = [
    { 'Field': 'Site ID', 'Description': 'Unique identifier for the site', 'Required': 'Yes', 'Example': 'site-001, site-002' },
    { 'Field': 'Site Name', 'Description': 'Name of the site', 'Required': 'Yes', 'Example': 'Al Khobar Construction Site' },
    { 'Field': 'Site Type', 'Description': 'Type of site', 'Required': 'Yes', 'Example': 'Construction Site, Infrastructure Project' },
    { 'Field': 'Province', 'Description': 'KSA Province', 'Required': 'Yes', 'Example': 'Riyadh, Eastern Province, Makkah' },
    { 'Field': 'Address', 'Description': 'Site address', 'Required': 'Yes', 'Example': 'Al Khobar, Eastern Province' },
    { 'Field': 'Site Manager', 'Description': 'Name of site manager', 'Required': 'Yes', 'Example': 'Ahmed Al-Rashid' },
    { 'Field': 'Latitude', 'Description': 'GPS latitude coordinate', 'Required': 'Yes', 'Example': '26.2172' },
    { 'Field': 'Longitude', 'Description': 'GPS longitude coordinate', 'Required': 'Yes', 'Example': '50.2089' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  
  XLSX.writeFile(workbook, 'site_template.xlsx');
};

// Import functions
export const importEmployeesFromExcel = (file: File): Promise<Partial<Employee>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const employees = jsonData.map((row: any) => ({
          id: row['Employee ID'] || undefined,
          name: row['Employee Name'],
          department: row['Department'],
          position: row['Position'],
          site: row['Site ID'],
          status: row['Status'] || 'active'
        }));
        
        resolve(employees);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const importEquipmentFromExcel = (file: File): Promise<Partial<Equipment>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const equipment = jsonData.map((row: any) => ({
          id: row['Equipment ID'] || undefined,
          name: row['Equipment Name'],
          type: row['Type'],
          model: row['Model'],
          serialNumber: row['Serial Number'],
          site: row['Site ID'],
          status: row['Status'] || 'available'
        }));
        
        resolve(equipment);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const importMaterialsFromExcel = (file: File): Promise<Partial<Material>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const materials = jsonData.map((row: any) => ({
          id: row['Material ID'] || undefined,
          name: row['Material Name'],
          type: row['Type'],
          unit: row['Unit'],
          quantity: row['Initial Quantity'],
          site: row['Site ID'],
          use: row['Usage Description'],
          status: row['Status'] || 'available'
        }));
        
        resolve(materials);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const importSitesFromExcel = (file: File): Promise<Partial<Site>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const sites = jsonData.map((row: any) => ({
          id: row['Site ID'] || undefined,
          name: row['Site Name'],
          type: row['Site Type'],
          province: row['Province'],
          address: row['Address'],
          manager: row['Site Manager'],
          coordinates: [parseFloat(row['Longitude']) || 0, parseFloat(row['Latitude']) || 0] as [number, number]
        }));
        
        resolve(sites);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};