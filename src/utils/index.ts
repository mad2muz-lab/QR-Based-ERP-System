// Centralized utility exports for better organization
export { AuthManager } from './authUtils';
export { SupabaseAuthManager } from './supabaseAuthUtils';
export { DataStorage } from './dataStorage';
export { OfflineSyncManager } from './offlineSync';
export { LogManager } from './logManager';
export { SupabaseRegistrationService } from './supabaseRegistrationService';
export { SupabaseDataService } from './supabaseDataService';
export { fetchData, saveData, getAllLogs } from './dataProxy';
export { generateQRCode, parseQRCode } from './qrCodeUtils';
export { exportToCSV } from './csvUtils';
export { 
  exportEmployeesToExcel, 
  exportEquipmentToExcel, 
  exportMaterialsToExcel, 
  exportSitesToExcel 
} from './excelUtils';
export { generateIDCardPDF, downloadIDCardAsPDF } from './pdfUtils';
export { printQRCode } from './printUtils';
export { 
  calculateWorkingHours, 
  formatDuration, 
  formatTimeRange 
} from './timeUtils'; 

// Universal UUID generator for browser and Node.js
export function generateUUID() {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    // Polyfill for UUID v4
    return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, (c: string) =>
      ((parseInt(c) ^ globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> (parseInt(c) / 4)).toString(16))
    );
  }
  // Last resort fallback (not cryptographically secure)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c: string) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 