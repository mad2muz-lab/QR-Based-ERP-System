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

  // Company info
  const companyName = entityData.companyName || entityData.company || '';
  const companyLogo = entityData.companyLogo || entityData.logoUrl || '';

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
          background: #f4f6fa;
          color: #222;
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .card-container {
          width: 100%;
          height: 100%;
          background: #fff;
          border-radius: 3mm;
          box-shadow: 0 2px 8px rgba(30,58,138,0.10);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          position: relative;
          overflow: hidden;
        }
        .header-section {
          width: 100%;
          min-height: 13mm;
          background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
          color: #fff;
          text-align: center;
          font-size: 8pt;
          font-weight: bold;
          border-radius: 3mm 3mm 0 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1mm;
          padding: 2mm 0 1mm 0;
        }
        .company-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5mm;
        }
        .logo-img {
          width: 10mm;
          height: 10mm;
          object-fit: contain;
          border-radius: 2mm;
          background: #fff;
          margin-bottom: 1mm;
        }
        .company-name-text {
          font-size: 8pt;
          font-weight: bold;
          color: #fff;
          margin-bottom: 0.5mm;
          text-transform: uppercase;
          letter-spacing: 0.5mm;
        }
        .main-content {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 2mm 2mm 0 2mm;
        }
        .photo-section {
          width: 22mm;
          height: 26mm;
          background: #f3f4f6;
          border-radius: 2mm;
          overflow: hidden;
          border: 1.5px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2mm;
        }
        .employee-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .no-photo {
          color: #9ca3af;
          font-size: 7pt;
          text-align: center;
        }
        .qr-section {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 2mm 0 0 0;
        }
        .qr-code {
          width: 24mm;
          height: 24mm;
          background: #fff;
          padding: 1mm;
          border-radius: 2mm;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .info-section {
          width: 100%;
          margin: 2mm 0 0 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .employee-name {
          font-size: 9pt;
          font-weight: bold;
          color: #1f2937;
          text-align: center;
          margin-bottom: 1mm;
          text-transform: uppercase;
        }
        .employee-title {
          font-size: 7pt;
          color: #2563eb;
          text-align: center;
          margin-bottom: 1mm;
        }
        .employee-details {
          font-size: 6pt;
          color: #374151;
          margin-bottom: 1mm;
          width: 90%;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5mm;
        }
        .detail-label {
          font-weight: bold;
        }
        .detail-value {
          text-align: right;
        }
        .footer-section {
          width: 100%;
          text-align: center;
          font-size: 7pt;
          color: #2563eb;
          margin: 0.5mm 0 0 0;
          padding-bottom: 1mm;
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
      <div class="card-container">
        <div class="header-section">
          <div class="company-logo">
            ${companyLogo ? `<img src="${companyLogo}" class="logo-img" alt="Logo" />` : ''}
            <div class="company-name-text">${companyName || ''}</div>
          </div>
        </div>
        <div class="main-content">
          <div class="photo-section">
            ${entityData.photo ? `<img src="${entityData.photo}" alt="Employee Photo" class="employee-photo" />` : `<div class="no-photo">EMPLOYEE<br>PHOTO</div>`}
          </div>
          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrCodeImage}" alt="QR Code" />
            </div>
          </div>
          <div class="info-section">
            <div class="employee-name">${entityData.name}</div>
            <div class="employee-title">${entityData.position || ''}</div>
            <div class="employee-details">
              <div class="detail-row"><span class="detail-label">ID No</span><span class="detail-value">${entityData.oldId || entityData.id || ''}</span></div>
              <div class="detail-row"><span class="detail-label">Dept</span><span class="detail-value">${entityData.department || ''}</span></div>
              <div class="detail-row"><span class="detail-label">Blood</span><span class="detail-value">${entityData.bloodGroup || 'N/A'}</span></div>
              <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${entityData.email || 'Not provided'}</span></div>
              <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${entityData.phone || 'Not provided'}</span></div>
            </div>
          </div>
        </div>
        <div class="footer-section">
        </div>
      </div>
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