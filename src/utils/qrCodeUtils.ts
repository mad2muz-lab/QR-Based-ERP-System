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
  // Check for standard prefixes first
  if (qrData.startsWith('EMP-')) {
    return { type: 'employee', id: qrData };
  } else if (qrData.startsWith('EQP-')) {
    return { type: 'equipment', id: qrData };
  } else if (qrData.startsWith('MAT-')) {
    return { type: 'material', id: qrData };
  } else if (qrData.startsWith('SITE-')) {
    return { type: 'site', id: qrData };
  }
  
  // For custom equipment IDs, check against equipment database
  // Import modules dynamically to avoid circular dependencies
  try {
    const { DataStorage } = await import('./dataStorage');
    const equipment = DataStorage.loadEquipment();
    
    // Check if the QR data matches any custom_equipment_id or id
    const matchingEquipment = equipment.find(eq => 
      eq.custom_equipment_id === qrData || eq.id === qrData
    );
    
    if (matchingEquipment) {
      return { type: 'equipment', id: qrData };
    }
  } catch (error) {
    console.warn('Could not check equipment database for custom ID:', error);
  }
  
  // Return as unknown type so the scanner can check all entity types
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