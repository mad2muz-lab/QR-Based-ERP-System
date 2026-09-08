import React, { useState, useEffect } from 'react';
import { X, Download, Printer, ChevronLeft, ChevronRight, User, CreditCard, QrCode, Building, Package, ShieldCheck } from 'lucide-react';
import { generateQRCode } from '../../utils/qrCodeUtils';
import { generateIDCardPDF } from '../../utils/pdfUtils';
import { generateEmployeeIDCard, downloadEmployeeIDCard } from '../../utils/employeeIDCardGenerator';

interface QRCodeDisplayProps {
  entity: any;
  entityType: string;
  onClose: () => void;
  showMultiple?: boolean;
  entities?: any[];
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  entity, 
  entityType, 
  onClose, 
  showMultiple = false,
  entities = []
}) => {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEntity, setCurrentEntity] = useState(entity);
  const [allQRCodes, setAllQRCodes] = useState<string[]>([]);
  const [previewTab, setPreviewTab] = useState<'badge' | 'qr'>('badge');
  
  const itemsToShow = showMultiple ? entities : [entity];
  
  useEffect(() => {
    generateQR(currentEntity);
  }, [currentEntity]);
  
  useEffect(() => {
    if (showMultiple && entities.length > 0) {
      setCurrentEntity(entities[currentIndex]);
    } else {
      setCurrentEntity(entity);
    }
  }, [currentIndex, entity, entities, showMultiple]);

  // Generate QR codes for all entities when in bulk mode
  useEffect(() => {
    if (showMultiple && entities && entities.length > 0) {
      const generateAllQRs = async () => {
        const codes: string[] = [];
        for (const ent of entities) {
          try {
            const qrData = ent.qrCode || ent.id;
            const qrImage = await generateQRCode(qrData);
            codes.push(qrImage);
          } catch (error) {
            console.error('Error generating QR code:', error);
            codes.push('');
          }
        }
        setAllQRCodes(codes);
      };
      
      generateAllQRs();
    }
  }, [showMultiple, entities]);

  const generateQR = async (targetEntity: any) => {
    setIsLoading(true);
    try {
      // For equipment, prioritize custom_equipment_id for QR codes
      let qrData;
      if (entityType === 'equipment' && targetEntity.custom_equipment_id) {
        qrData = targetEntity.custom_equipment_id;
      } else {
        qrData = targetEntity.qrCode || targetEntity.id;
      }
      const qrImage = await generateQRCode(qrData);
      setQrCodeImage(qrImage);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintAll = () => {
    if (!showMultiple || entities.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print QR codes');
      return;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk QR Codes</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .qr-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .qr-item {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .qr-image {
            width: 150px;
            height: 150px;
            margin: 0 auto;
          }
          .qr-name {
            font-weight: bold;
            margin-top: 10px;
          }
          .qr-id {
            font-family: monospace;
            margin-top: 5px;
            color: #666;
          }
          @media print {
            .qr-grid {
              page-break-inside: avoid;
            }
            .qr-item {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <h1>Bulk QR Codes - ${getEntityTypeLabel(entityType)}s</h1>
        <div class="qr-grid">
          ${entities.map((ent, index) => `
            <div class="qr-item">
              <img class="qr-image" src="${allQRCodes[index] || ''}" alt="QR Code">
              <div class="qr-name">${ent.name}</div>
              <div class="qr-id">${ent.id}</div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    };
  };

  const handlePrint = () => {
    if (entityType === 'employee') {
      generateEmployeeIDCard(currentEntity, qrCodeImage);
    } else {
      generateIDCardPDF(currentEntity, qrCodeImage, entityType);
    }
  };

  const handleDownload = () => {
    if (entityType === 'employee') {
      downloadEmployeeIDCard(currentEntity, qrCodeImage);
    } else {
      const link = document.createElement('a');
      link.href = qrCodeImage;
      link.download = `${entityType}-${currentEntity.id}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleNext = () => {
    if (currentIndex < itemsToShow.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'employee': return 'Employee';
      case 'equipment': return 'Equipment';
      case 'material': return 'Material';
      case 'site': return 'Site';
      case 'warehouse': return 'Warehouse';
      default: return 'Item';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-7 border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              entityType === 'employee' ? 'bg-blue-100 text-blue-700' :
              entityType === 'material' ? 'bg-emerald-100 text-emerald-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {entityType === 'employee' ? <User className="w-5 h-5" /> :
               entityType === 'material' ? <Package className="w-5 h-5" /> :
               <Building className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {entityType === 'employee' ? 'Employee Registered — ID Badge' : `${getEntityTypeLabel(entityType)} QR Code`}
                {showMultiple && ` (${currentIndex + 1}/${itemsToShow.length})`}
              </h3>
              <p className="text-xs text-slate-500">Official credential and QR tracking asset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Tab Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setPreviewTab('badge')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  previewTab === 'badge' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{entityType === 'employee' ? 'ID Badge Preview' : 'Asset Tag Preview'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('qr')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  previewTab === 'qr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code Only</span>
              </button>
            </div>
          </div>

          {/* Main Preview Area */}
          {isLoading ? (
            <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : previewTab === 'badge' && entityType === 'employee' ? (
            /* Employee Badge Preview */
            <div className="rounded-2xl border-2 border-slate-300 bg-white shadow-md overflow-hidden max-w-sm mx-auto transition-all">
              {/* Badge Header Banner */}
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase font-bold tracking-widest text-blue-200">ERP CREDENTIAL</div>
                  <div className="text-sm font-extrabold tracking-wide">STAFF IDENTIFICATION</div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-[10px] text-white">
                  ID
                </div>
              </div>

              {/* Badge Body */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  {/* Employee Photo */}
                  <div className="w-20 h-24 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                    {currentEntity.photo ? (
                      <img src={currentEntity.photo} alt={currentEntity.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-1">
                        <User className="w-9 h-9 text-slate-400 mx-auto" />
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">PHOTO</span>
                      </div>
                    )}
                  </div>

                  {/* Employee Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate uppercase">
                      {currentEntity.name}
                    </h4>
                    <p className="text-xs font-semibold text-blue-600 mt-0.5 truncate">
                      {currentEntity.position || 'Staff Member'}
                    </p>

                    <div className="mt-2.5 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">ID No:</span>
                        <span className="font-mono font-bold text-slate-800">{currentEntity.oldId || currentEntity.id?.slice(0, 10)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Dept:</span>
                        <span className="font-semibold text-slate-800">{currentEntity.department || 'Operations'}</span>
                      </div>
                      {currentEntity.bloodGroup && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Blood:</span>
                          <span className="font-bold text-rose-600">{currentEntity.bloodGroup}</span>
                        </div>
                      )}
                      {currentEntity.site && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Site:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[110px]">{currentEntity.site}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Embedded QR Strip */}
                <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification QR</div>
                    <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Active • Authorized
                    </div>
                  </div>
                  <div className="w-16 h-16 p-1 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center">
                    <img src={qrCodeImage} alt="QR" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>

              {/* Badge Footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 text-center text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
                Official Company Identification Card
              </div>
            </div>
          ) : previewTab === 'badge' && entityType === 'material' ? (
            /* Material Asset Tag Preview */
            <div className="rounded-2xl border-2 border-slate-300 bg-white shadow-md overflow-hidden max-w-sm mx-auto transition-all">
              {/* Tag Header Banner */}
              <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase font-bold tracking-widest text-emerald-200">INVENTORY TRACKING</div>
                  <div className="text-sm font-extrabold tracking-wide">MATERIAL ASSET TAG</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase">{currentEntity.type || 'MATERIAL'}</span>
              </div>

              {/* Tag Body */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 p-1.5 bg-white border-2 border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center flex-shrink-0">
                    <img src={qrCodeImage} alt="QR" className="w-18 h-18 object-contain" />
                    <span className="text-[8px] font-mono font-bold text-slate-600 mt-1 truncate max-w-[85px]">{currentEntity.oldId || currentEntity.id?.slice(0, 10)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate uppercase">
                      {currentEntity.name}
                    </h4>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Stock:</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {currentEntity.quantity} {currentEntity.unit || 'Units'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Warehouse:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[110px]">{currentEntity.site || currentEntity.warehouseId || 'Main Site'}</span>
                      </div>
                      {currentEntity.sku && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">SKU:</span>
                          <span className="font-mono text-slate-800">{currentEntity.sku}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Status:</span>
                        <span className="font-bold text-blue-600 capitalize">{currentEntity.status || 'Available'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 text-center text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
                Scan via QR Scanner for In / Out / Transfer
              </div>
            </div>
          ) : (
            /* Standalone Raw QR Code Box */
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-bold text-slate-900 text-lg uppercase">{currentEntity.name}</h4>
                <p className="text-slate-600 text-xs">
                  {entityType === 'employee' ? currentEntity.position :
                   entityType === 'equipment' ? currentEntity.model :
                   entityType === 'material' ? `${currentEntity.quantity} ${currentEntity.unit || 'Units'}` : 
                   currentEntity.province || currentEntity.address}
                </p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">ID: {currentEntity.oldId || currentEntity.id}</p>
              </div>

              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                  <img 
                    src={qrCodeImage} 
                    alt={`QR Code for ${currentEntity.name}`} 
                    className="w-56 h-56 object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls (for multiple items) */}
          {showMultiple && itemsToShow.length > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-2 bg-slate-100 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <span className="text-xs font-semibold text-slate-600">
                {currentIndex + 1} of {itemsToShow.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex === itemsToShow.length - 1}
                className="p-2 bg-slate-100 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          )}

          {/* Bulk Actions */}
          {showMultiple && itemsToShow.length > 1 && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handlePrintAll}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold text-sm shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print All QR Codes ({itemsToShow.length})</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-sm shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{entityType === 'employee' ? 'Print ID Badge' : 'Print QR Label'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition font-semibold text-sm shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;