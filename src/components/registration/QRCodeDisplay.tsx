import React, { useState, useEffect } from 'react';
import { X, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const generateQR = async (entity: any) => {
    setIsLoading(true);
    try {
      const qrData = entity.qrCode || entity.id;
      const qrImage = await generateQRCode(qrData);
      setQrCodeImage(qrImage);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (entityType === 'employee') {
      generateEmployeeIDCard(currentEntity, qrCodeImage);
      // Ensure the ID card is generated with the correct dimensions (85.60mm x 53.98mm)
    } else {
      generateIDCardPDF(currentEntity, qrCodeImage, entityType);
    }
  };

  const handleDownload = () => {
    if (entityType === 'employee') {
      // Download employee ID card with proper dimensions
      downloadEmployeeIDCard(currentEntity, qrCodeImage);
    } else {
      // Download QR code for other entity types
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
      default: return 'Item';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {getEntityTypeLabel(entityType)} QR Code
            {showMultiple && ` (${currentIndex + 1}/${itemsToShow.length})`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Entity Info */}
          <div className="text-center">
            <h4 className="font-medium text-gray-900 text-lg">{currentEntity.name}</h4>
            <p className="text-gray-600">
              {entityType === 'employee' ? currentEntity.position :
               entityType === 'equipment' ? currentEntity.model :
               entityType === 'material' ? `${currentEntity.quantity} ${currentEntity.unit}` : 
               currentEntity.province}
            </p>
            <p className="text-sm text-gray-500 mt-1">ID: {currentEntity.id}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            {isLoading ? (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                <img 
                  src={qrCodeImage} 
                  alt={`QR Code for ${currentEntity.name}`} 
                  className="w-64 h-64"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls (for multiple items) */}
          {showMultiple && itemsToShow.length > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-2 bg-gray-100 rounded-full disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                {currentIndex + 1} of {itemsToShow.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex === itemsToShow.length - 1}
                className="p-2 bg-gray-100 rounded-full disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{entityType === 'employee' ? 'Print ID Card' : 'Print QR Label'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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