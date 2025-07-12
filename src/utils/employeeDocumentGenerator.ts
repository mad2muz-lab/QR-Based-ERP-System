// Employee Registration Document Generator
export const generateEmployeeRegistrationDocument = (employee: any, qrCodeImage: string) => {
  // Create a new window for the employee registration document
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to generate employee registration document');
    return;
  }

  // Standard ID card dimensions: 85.60mm x 53.98mm
  const cardWidth = '85.60mm';
  const cardHeight = '53.98mm';

  const documentContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee Registration Document - ${employee.name}</title>
      <style>
        @page {
          size: ${cardWidth} ${cardHeight};
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          width: ${cardWidth};
          height: ${cardHeight};
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
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
        
        .footer {
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
        <div class="header">
          <div class="company-logo">QR Timecard System</div>
        </div>
        
        <div class="main-content">
          <div class="photo-section">
            <div class="employee-photo">
              ${employee.photo ? 
                `<img src="${employee.photo}" alt="Employee Photo" />` : 
                `<div class="no-photo">No Photo</div>`
              }
            </div>
          </div>
          
          <div class="info-section">
            <div class="employee-name">${employee.name}</div>
            <div class="employee-details">
              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${employee.id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Dept:</span>
                <span class="detail-value">${employee.department || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">${employee.position || 'N/A'}</span>
              </div>
              ${employee.bloodGroup ? `
              <div class="detail-row">
                <span class="detail-label">Blood:</span>
                <span class="detail-value">${employee.bloodGroup}</span>
              </div>
              ` : ''}
              ${employee.email ? `
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${employee.email}</span>
              </div>
              ` : ''}
              ${employee.phone ? `
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${employee.phone}</span>
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
        
        <div class="footer">
          <div class="footer-text">Employee Registration Document • Generated: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(documentContent);
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

export const downloadEmployeeRegistrationDocument = (employee: any, qrCodeImage: string) => {
  // For now, we'll use the print functionality which allows "Save as PDF"
  // In a real application, you would use a library like jsPDF or Puppeteer
  generateEmployeeRegistrationDocument(employee, qrCodeImage);
};