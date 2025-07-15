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