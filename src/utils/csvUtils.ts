import Papa from 'papaparse';
import { Employee, Equipment, Material, TimeLog } from '../types';

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importFromCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const formatTimeLogForCSV = (logs: TimeLog[]) => {
  return logs.map(log => ({
    ID: log.id,
    'Entity ID': log.entityId,
    'Entity Type': log.entityType,
    Action: log.action,
    Timestamp: new Date(log.timestamp).toLocaleString(),
    Site: log.site,
    Notes: log.notes || '',
    Location: log.location ? `${log.location[0]}, ${log.location[1]}` : ''
  }));
};