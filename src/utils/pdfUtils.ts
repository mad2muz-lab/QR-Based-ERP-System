// PDF generation utility for ID cards
export const generateIDCardPDF = (entityData: any, qrCodeImage: string, entityType: string = 'employee') => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print ID cards');
    return;
  }

  // A4 page with multiple cards or single card
  const isIDCard = entityType === 'employee';
  const pageWidth = isIDCard ? '85.60mm' : '210mm';
  const pageHeight = isIDCard ? '53.98mm' : '297mm';

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${isIDCard ? 'Employee ID Card' : 'QR Label'} - ${entityData.name}</title>
      <style>
        @page {
          size: ${pageWidth} ${pageHeight};
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          width: ${pageWidth};
          height: ${pageHeight};
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: ${isIDCard ? 'white' : 'black'};
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        ${isIDCard ? `
        .card-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .header {
          background: rgba(255, 255, 255, 0.15);
          padding: 2mm;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .company-logo {
          font-size: 8px;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .main-content {
          flex: 1;
          display: flex;
          padding: 2mm;
          gap: 2mm;
        }
        
        .photo-section {
          flex: 0 0 18mm;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .employee-photo {
          width: 16mm;
          height: 20mm;
          background: white;
          border-radius: 1mm;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .employee-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-photo {
          color: #666;
          font-size: 6px;
          text-align: center;
        }
        
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-left: 1mm;
        }
        
        .employee-details {
          font-size: 6px;
          line-height: 1.4;
        }
        
        .detail-row {
          margin: 0.5mm 0;
          display: flex;
        }
        
        .detail-label {
          font-weight: bold;
          width: 12mm;
          opacity: 0.9;
        }
        
        .detail-value {
          font-weight: normal;
          flex: 1;
        }
        
        .employee-name {
          font-size: 7px;
          font-weight: bold;
          margin-bottom: 1mm;
          text-transform: uppercase;
        }
        
        .qr-section {
          position: absolute;
          bottom: 2mm;
          right: 2mm;
          width: 15mm;
          height: 15mm;
        }
        
        .qr-code {
          width: 100%;
          height: 100%;
          background: white;
          padding: 0.5mm;
          border-radius: 1mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        ` : `
        .label-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20mm;
          text-align: center;
        }
        
        .label-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10mm;
          color: #1e3a8a;
        }
        
        .label-qr {
          width: 80mm;
          height: 80mm;
          margin: 10mm 0;
          border: 2px solid #1e3a8a;
          padding: 5mm;
        }
        
        .label-qr img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .label-info {
          font-size: 14px;
          margin-top: 10mm;
        }
        
        .label-id {
          font-family: monospace;
          font-size: 16px;
          font-weight: bold;
          margin: 5mm 0;
          color: #1e3a8a;
        }
        `}
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      ${isIDCard ? `
      <div class="card-container">
        <div class="header">
          <div class="company-logo">QR Timecard System</div>
        </div>
        
        <div class="main-content">
          <div class="photo-section">
            <div class="employee-photo">
              ${entityData.photo ? 
                `<img src="${entityData.photo}" alt="Employee Photo" />` : 
                `<div class="no-photo">No Photo</div>`
              }
            </div>
          </div>
          
          <div class="info-section">
            <div class="employee-name">${entityData.name}</div>
            <div class="employee-details">
              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${entityData.id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Dept:</span>
                <span class="detail-value">${entityData.department || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">${entityData.position || 'N/A'}</span>
              </div>
              ${entityData.bloodGroup ? `
              <div class="detail-row">
                <span class="detail-label">Blood:</span>
                <span class="detail-value">${entityData.bloodGroup}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="qr-section">
          <div class="qr-code">
            <img src="${qrCodeImage}" alt="QR Code" />
          </div>
        </div>
      </div>
      ` : `
      <div class="label-container">
        <div class="label-title">${entityData.name}</div>
        <div class="label-qr">
          <img src="${qrCodeImage}" alt="QR Code" />
        </div>
        <div class="label-id">${entityData.id}</div>
        <div class="label-info">
          ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} QR Code<br>
          Scan for ${entityType} operations
        </div>
      </div>
      `}
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for images to load before printing
  const handleLoad = () => {
    setTimeout(() => {
      printWindow.print();
      // Don't auto-close to allow user to save as PDF
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 1000);
  };
  
  if (printWindow.document.readyState === 'complete') {
    handleLoad();
  } else {
    printWindow.onload = handleLoad;
  }
};

export const downloadIDCardAsPDF = (entityData: any, qrCodeImage: string, entityType: string = 'employee') => {
  // For now, we'll use the print functionality which allows "Save as PDF"
  // In a real application, you would use a library like jsPDF or Puppeteer
  generateIDCardPDF(entityData, qrCodeImage, entityType);
};