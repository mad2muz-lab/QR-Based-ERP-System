import QRCode from 'qrcode';

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const parseQRCode = async (qrData: string): Promise<{
  type: 'employee' | 'equipment' | 'material' | 'site' | 'unknown' | null;
  id: string;
}> => {
  console.log('🔍 Parsing QR code:', qrData);
  
  // For Honeywell device compatibility, treat all QR codes as potentially unknown first
  // This allows the scanner to check all entity databases regardless of prefix
  console.log('🔍 Treating as unknown for comprehensive database lookup');
  
  // For Honeywell device compatibility, always check databases first
  // This ensures we find entities even if there are slight differences in the scanned data
  try {
    const { DataStorage } = await import('./dataStorage');
    
    // Check all entity types regardless of prefix
    const employees = DataStorage.loadEmployees();
    const equipment = DataStorage.loadEquipment();
    const materials = DataStorage.loadMaterials();
    const sites = DataStorage.loadSites();
    
    // Check employees first (for EMP- prefixed codes)
    const matchingEmployee = employees.find(emp => emp.id === qrData);
    if (matchingEmployee) {
      console.log('✅ Found matching employee in database:', matchingEmployee.name);
      return { type: 'employee', id: qrData };
    }
    
    // Check materials (for MAT- prefixed codes)
    const matchingMaterial = materials.find(mat => mat.id === qrData);
    if (matchingMaterial) {
      console.log('✅ Found matching material in database:', matchingMaterial.name);
      return { type: 'material', id: qrData };
    }
    
    // Check equipment (for EQP- prefixed codes and UUIDs)
    const matchingEquipment = equipment.find(eq => 
      eq.custom_equipment_id === qrData || eq.id === qrData
    );
    if (matchingEquipment) {
      console.log('✅ Found matching equipment in database:', matchingEquipment.name);
      return { type: 'equipment', id: qrData };
    }
    
    // Check sites (for SITE- prefixed codes)
    const matchingSite = sites.find(site => site.id === qrData);
    if (matchingSite) {
      console.log('✅ Found matching site in database:', matchingSite.name);
      return { type: 'site', id: qrData };
    }
    
    console.log('❌ No matching entity found in any database');
  } catch (error) {
    console.warn('Could not check entity databases:', error);
  }
  
  // If not found in database, fall back to prefix-based identification
  if (qrData.startsWith('EMP-')) {
    console.log('✅ Identified as employee QR code (prefix only)');
    return { type: 'employee', id: qrData };
  } else if (qrData.startsWith('EQP-')) {
    console.log('✅ Identified as equipment QR code (prefix only)');
    return { type: 'equipment', id: qrData };
  } else if (qrData.startsWith('MAT-')) {
    console.log('✅ Identified as material QR code (prefix only)');
    return { type: 'material', id: qrData };
  } else if (qrData.startsWith('SITE-')) {
    console.log('✅ Identified as site QR code (prefix only)');
    return { type: 'site', id: qrData };
  }
  
  // Return as unknown type so the scanner can check all entity types
  console.log('🔍 Returning as unknown type for further processing');
  return { type: 'unknown', id: qrData };
};

export const generateEntityId = (type: 'employee' | 'equipment' | 'material' | 'site'): string => {
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  
  switch (type) {
    case 'employee':
      return `EMP-${timestamp}${random}`;
    case 'equipment':
      return `EQP-${timestamp}${random}`;
    case 'material':
      return `MAT-${timestamp}${random}`;
    case 'site':
      return `SITE-${timestamp}${random}`;
    default:
      return `${timestamp}${random}`;
  }
};