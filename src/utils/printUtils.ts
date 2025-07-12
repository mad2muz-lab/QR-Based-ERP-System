export const printQRCode = (qrCodeImage: string, entityData: any, entityType: string) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print QR codes');
    return;
  }

  // Standard ID card dimensions: 85.60mm x 53.98mm (3.370" x 2.125")
  const cardWidth = '85.60mm';
  const cardHeight = '53.98mm';

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code - ${entityData.name}</title>
      <style>
        @page {
          size: ${cardWidth} ${cardHeight};
          margin: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          width: ${cardWidth};
          height: ${cardHeight};
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          box-sizing: border-box;
        }
        
        .card-header {
          background: rgba(255, 255, 255, 0.1);
          padding: 2mm;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .card-title {
          font-size: 8px;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .card-body {
          flex: 1;
          display: flex;
          padding: 2mm;
          gap: 2mm;
        }
        
        .qr-section {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code {
          width: 20mm;
          height: 20mm;
          background: white;
          padding: 1mm;
          border-radius: 2mm;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .qr-id {
          font-size: 6px;
          margin-top: 1mm;
          text-align: center;
          font-family: monospace;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5mm 1mm;
          border-radius: 1mm;
        }
        
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-left: 1mm;
        }
        
        .entity-name {
          font-size: 9px;
          font-weight: bold;
          margin: 0 0 1mm 0;
          line-height: 1.2;
          word-wrap: break-word;
        }
        
        .entity-details {
          font-size: 6px;
          line-height: 1.3;
          opacity: 0.9;
        }
        
        .detail-row {
          margin: 0.5mm 0;
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-weight: bold;
          opacity: 0.8;
        }
        
        .detail-value {
          margin-left: 1mm;
        }
        
        .card-footer {
          background: rgba(255, 255, 255, 0.1);
          padding: 1mm 2mm;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .footer-text {
          font-size: 5px;
          margin: 0;
          opacity: 0.8;
        }
        
        .access-level {
          display: inline-block;
          background: rgba(255, 255, 255, 0.3);
          padding: 0.5mm 1mm;
          border-radius: 1mm;
          font-size: 5px;
          font-weight: bold;
          margin-top: 0.5mm;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="card-header">
        <h1 class="card-title">QR Timecard System</h1>
      </div>
      
      <div class="card-body">
        <div class="qr-section">
          <div class="qr-code">
            <img src="${qrCodeImage}" alt="QR Code" />
          </div>
          <div class="qr-id">${entityData.id}</div>
        </div>
        
        <div class="info-section">
          <h2 class="entity-name">${entityData.name}</h2>
          <div class="entity-details">
            ${getEntityDetails(entityData, entityType)}
            ${entityData.accessLevel ? `<div class="access-level">${entityData.accessLevel.toUpperCase()} ACCESS</div>` : ''}
          </div>
        </div>
      </div>
      
      <div class="card-footer">
        <p class="footer-text">Scan for ${entityType} operations • Generated: ${new Date().toLocaleDateString()}</p>
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
      printWindow.close();
    }, 500);
  };
};

function getEntityDetails(entityData: any, entityType: string): string {
  switch (entityType) {
    case 'employee':
      return `
        <div class="detail-row">
          <span class="detail-label">Department:</span>
          <span class="detail-value">${entityData.department}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Position:</span>
          <span class="detail-value">${entityData.position}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Site:</span>
          <span class="detail-value">${entityData.site}</span>
        </div>
      `;
    case 'equipment':
      return `
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${entityData.type}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Model:</span>
          <span class="detail-value">${entityData.model}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Site:</span>
          <span class="detail-value">${entityData.site}</span>
        </div>
      `;
    case 'material':
      return `
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${entityData.type}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Unit:</span>
          <span class="detail-value">${entityData.unit}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Site:</span>
          <span class="detail-value">${entityData.site}</span>
        </div>
      `;
    case 'site':
      return `
        <div class="detail-row">
          <span class="detail-label">Province:</span>
          <span class="detail-value">${entityData.province}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Manager:</span>
          <span class="detail-value">${entityData.manager}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${entityData.type}</span>
        </div>
      `;
    default:
      return '';
  }
}