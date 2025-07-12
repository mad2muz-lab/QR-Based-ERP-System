// Employee ID Card Generator - Matches the provided sample design
import { Employee } from '../types';

/**
 * Generates and displays an employee ID card with the exact dimensions of 85.60mm x 53.98mm
 * @param employee Employee data
 * @param qrCodeImage QR code image data URL
 */
export const generateEmployeeIDCard = (employee: Employee, qrCodeImage: string) => {
  // Create a new window for the employee ID card
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to generate employee ID card');
    return;
  }

  // Standard ID card dimensions: 85.60mm x 53.98mm (3.370" x 2.125")
  const cardWidth = '85.60mm';
  const cardHeight = '53.98mm';
  
  // Ensure exact dimensions for printing
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee ID Card - ${employee.name}</title>
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
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          color: #1f2937;
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          overflow: hidden;
        }
        
        .card-container {
          width: 100%;
          height: 100%;
          background: white;
          margin: 2mm;
          width: calc(100% - 4mm);
          height: calc(100% - 4mm);
          border-radius: 3mm;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .header-section {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          height: 12mm;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          color: white;
          border-radius: 3mm 3mm 0 0;
        }
        
        .company-logo {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .logo-icon {
          width: 6mm;
          height: 6mm;
          background: white;
          border-radius: 1mm;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e40af;
          font-weight: bold;
          font-size: 8px;
        }
        
        .company-text {
          font-size: 7px;
          font-weight: bold;
          line-height: 1.2;
        }
        
        .tagline {
          font-size: 5px;
          opacity: 0.9;
        }
        
        .geometric-pattern {
          position: absolute;
          right: 0;
          top: 0;
          width: 15mm;
          height: 12mm;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%);
          clip-path: polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
        
        .main-content {
          padding: 2mm 3mm;
          display: flex;
          gap: 2mm;
          height: calc(100% - 20mm);
        }
        
        .photo-section {
          flex: 0 0 18mm;
        }
        
        .employee-photo {
          width: 18mm;
          height: 22mm;
          background: #f3f4f6;
          border-radius: 2mm;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .employee-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-photo {
          color: #9ca3af;
          font-size: 6px;
          text-align: center;
          line-height: 1.2;
        }
        
        .photo-frame {
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          border: 2px solid #3b82f6;
          border-radius: 2mm;
          pointer-events: none;
        }
        
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .employee-name {
          font-size: 9px;
          font-weight: bold;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 1mm;
          line-height: 1.1;
        }
        
        .employee-title {
          font-size: 6px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          margin-bottom: 2mm;
        }
        
        .employee-details {
          font-size: 5.5px;
          line-height: 1.4;
          color: #374151;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 0.8mm;
        }
        
        .detail-label {
          font-weight: bold;
          width: 8mm;
          color: #1f2937;
        }
        
        .detail-value {
          flex: 1;
          color: #4b5563;
        }
        
        .id-number {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #1e40af;
        }
        
        .footer-section {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 8mm;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          border-radius: 0 0 3mm 3mm;
        }
        
        .qr-section {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .qr-code {
          width: 6mm;
          height: 6mm;
          background: white;
          padding: 0.3mm;
          border-radius: 0.5mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .website {
          color: white;
          font-size: 5px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        
        .decorative-elements {
          position: absolute;
          top: 15mm;
          right: 1mm;
          width: 8mm;
          height: 15mm;
          opacity: 0.1;
        }
        
        .diamond {
          width: 3mm;
          height: 3mm;
          background: #3b82f6;
          transform: rotate(45deg);
          margin: 1mm;
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
        <!-- Header Section -->
        <div class="header-section">
          <div class="company-logo">
            <div class="logo-icon">QR</div>
            <div>
              <div class="company-text">QR TIMECARD SYSTEM</div>
              <div class="tagline">EMPLOYEE IDENTIFICATION</div>
            </div>
          </div>
          <div class="geometric-pattern"></div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
          <!-- Photo Section -->
          <div class="photo-section">
            <div class="employee-photo">
              ${employee.photo ? 
                `<img src="${employee.photo}" alt="Employee Photo" />` : 
                `<div class="no-photo">EMPLOYEE<br>PHOTO</div>`
              }
              <div class="photo-frame"></div>
            </div>
          </div>
          
          <!-- Info Section -->
          <div class="info-section">
            <div>
              <div class="employee-name">${employee.name}</div>
              <div class="employee-title">${employee.position}</div>
              
              <div class="employee-details">
                <div class="detail-row">
                  <span class="detail-label">ID No</span>
                  <span class="detail-value id-number">${employee.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Dept</span>
                  <span class="detail-value">${employee.department}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Blood</span>
                  <span class="detail-value">${employee.bloodGroup || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">${employee.email || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">${employee.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Decorative Elements -->
        <div class="decorative-elements">
          <div class="diamond"></div>
          <div class="diamond"></div>
          <div class="diamond"></div>
        </div>
        
        <!-- Footer Section with QR Code -->
        <div class="footer-section">
          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrCodeImage}" alt="QR Code" />
            </div>
          </div>
          <div class="website">WWW.QRTIMECARD.COM</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const cardContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee ID Card - ${employee.name}</title>
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
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          color: #1f2937;
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          overflow: hidden;
        }
        
        .card-container {
          width: 100%;
          height: 100%;
          background: white;
          margin: 2mm;
          width: calc(100% - 4mm);
          height: calc(100% - 4mm);
          border-radius: 3mm;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .header-section {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          height: 12mm;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          color: white;
          border-radius: 3mm 3mm 0 0;
        }
        
        .company-logo {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .logo-icon {
          width: 6mm;
          height: 6mm;
          background: white;
          border-radius: 1mm;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e40af;
          font-weight: bold;
          font-size: 8px;
        }
        
        .company-text {
          font-size: 7px;
          font-weight: bold;
          line-height: 1.2;
        }
        
        .tagline {
          font-size: 5px;
          opacity: 0.9;
        }
        
        .geometric-pattern {
          position: absolute;
          right: 0;
          top: 0;
          width: 15mm;
          height: 12mm;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%);
          clip-path: polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
        
        .main-content {
          padding: 2mm 3mm;
          display: flex;
          gap: 2mm;
          height: calc(100% - 20mm);
        }
        
        .photo-section {
          flex: 0 0 18mm;
        }
        
        .employee-photo {
          width: 18mm;
          height: 22mm;
          background: #f3f4f6;
          border-radius: 2mm;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .employee-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-photo {
          color: #9ca3af;
          font-size: 6px;
          text-align: center;
          line-height: 1.2;
        }
        
        .photo-frame {
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          border: 2px solid #3b82f6;
          border-radius: 2mm;
          pointer-events: none;
        }
        
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .employee-name {
          font-size: 9px;
          font-weight: bold;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 1mm;
          line-height: 1.1;
        }
        
        .employee-title {
          font-size: 6px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          margin-bottom: 2mm;
        }
        
        .employee-details {
          font-size: 5.5px;
          line-height: 1.4;
          color: #374151;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 0.8mm;
        }
        
        .detail-label {
          font-weight: bold;
          width: 8mm;
          color: #1f2937;
        }
        
        .detail-value {
          flex: 1;
          color: #4b5563;
        }
        
        .id-number {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #1e40af;
        }
        
        .footer-section {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 8mm;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          border-radius: 0 0 3mm 3mm;
        }
        
        .qr-section {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .qr-code {
          width: 6mm;
          height: 6mm;
          background: white;
          padding: 0.3mm;
          border-radius: 0.5mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .website {
          color: white;
          font-size: 5px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        
        .decorative-elements {
          position: absolute;
          top: 15mm;
          right: 1mm;
          width: 8mm;
          height: 15mm;
          opacity: 0.1;
        }
        
        .diamond {
          width: 3mm;
          height: 3mm;
          background: #3b82f6;
          transform: rotate(45deg);
          margin: 1mm;
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
        <!-- Header Section -->
        <div class="header-section">
          <div class="company-logo">
            <div class="logo-icon">QR</div>
            <div>
              <div class="company-text">QR TIMECARD SYSTEM</div>
              <div class="tagline">EMPLOYEE IDENTIFICATION</div>
            </div>
          </div>
          <div class="geometric-pattern"></div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
          <!-- Photo Section -->
          <div class="photo-section">
            <div class="employee-photo">
              ${employee.photo ? 
                `<img src="${employee.photo}" alt="Employee Photo" />` : 
                `<div class="no-photo">EMPLOYEE<br>PHOTO</div>`
              }
              <div class="photo-frame"></div>
            </div>
          </div>
          
          <!-- Info Section -->
          <div class="info-section">
            <div>
              <div class="employee-name">${employee.name}</div>
              <div class="employee-title">${employee.position}</div>
              
              <div class="employee-details">
                <div class="detail-row">
                  <span class="detail-label">ID No</span>
                  <span class="detail-value id-number">${employee.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Blood</span>
                  <span class="detail-value">${employee.bloodGroup || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">${employee.email || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">${employee.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Decorative Elements -->
        <div class="decorative-elements">
          <div class="diamond"></div>
          <div class="diamond"></div>
          <div class="diamond"></div>
        </div>
        
        <!-- Footer Section -->
        <div class="footer-section">
          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrCodeImage}" alt="QR Code" />
            </div>
          </div>
          <div class="website">WWW.QRTIMECARD.COM</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(cardContent);
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

export const downloadEmployeeIDCard = (employee: Employee, qrCodeImage: string) => {
  // For now, we'll use the print functionality which allows "Save as PDF"
  // In a real application, you would use a library like jsPDF or Puppeteer
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to download employee ID card');
    return;
  }

  // Standard ID card dimensions: 85.60mm x 53.98mm (3.370" x 2.125")
  const cardWidth = '85.60mm';
  const cardHeight = '53.98mm';

  const cardContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee ID Card - ${employee.name}</title>
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
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          color: #1f2937;
          box-sizing: border-box;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          overflow: hidden;
        }
        
        .card-container {
          width: 100%;
          height: 100%;
          background: white;
          margin: 2mm;
          width: calc(100% - 4mm);
          height: calc(100% - 4mm);
          border-radius: 3mm;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .header-section {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          height: 12mm;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          color: white;
          border-radius: 3mm 3mm 0 0;
        }
        
        .company-logo {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .logo-icon {
          width: 6mm;
          height: 6mm;
          background: white;
          border-radius: 1mm;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e40af;
          font-weight: bold;
          font-size: 8px;
        }
        
        .company-text {
          font-size: 7px;
          font-weight: bold;
          line-height: 1.2;
        }
        
        .tagline {
          font-size: 5px;
          opacity: 0.9;
        }
        
        .geometric-pattern {
          position: absolute;
          right: 0;
          top: 0;
          width: 15mm;
          height: 12mm;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%);
          clip-path: polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
        
        .main-content {
          padding: 2mm 3mm;
          display: flex;
          gap: 2mm;
          height: calc(100% - 20mm);
        }
        
        .photo-section {
          flex: 0 0 18mm;
        }
        
        .employee-photo {
          width: 18mm;
          height: 22mm;
          background: #f3f4f6;
          border-radius: 2mm;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .employee-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-photo {
          color: #9ca3af;
          font-size: 6px;
          text-align: center;
          line-height: 1.2;
        }
        
        .photo-frame {
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          border: 2px solid #3b82f6;
          border-radius: 2mm;
          pointer-events: none;
        }
        
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .employee-name {
          font-size: 9px;
          font-weight: bold;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 1mm;
          line-height: 1.1;
        }
        
        .employee-title {
          font-size: 6px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          margin-bottom: 2mm;
        }
        
        .employee-details {
          font-size: 5.5px;
          line-height: 1.4;
          color: #374151;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 0.8mm;
        }
        
        .detail-label {
          font-weight: bold;
          width: 8mm;
          color: #1f2937;
        }
        
        .detail-value {
          flex: 1;
          color: #4b5563;
        }
        
        .id-number {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #1e40af;
        }
        
        .footer-section {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 8mm;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          border-radius: 0 0 3mm 3mm;
        }
        
        .qr-section {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        .qr-code {
          width: 6mm;
          height: 6mm;
          background: white;
          padding: 0.3mm;
          border-radius: 0.5mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .website {
          color: white;
          font-size: 5px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        
        .decorative-elements {
          position: absolute;
          top: 15mm;
          right: 1mm;
          width: 8mm;
          height: 15mm;
          opacity: 0.1;
        }
        
        .diamond {
          width: 3mm;
          height: 3mm;
          background: #3b82f6;
          transform: rotate(45deg);
          margin: 1mm;
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
        <!-- Header Section -->
        <div class="header-section">
          <div class="company-logo">
            <div class="logo-icon">QR</div>
            <div>
              <div class="company-text">QR TIMECARD SYSTEM</div>
              <div class="tagline">EMPLOYEE IDENTIFICATION</div>
            </div>
          </div>
          <div class="geometric-pattern"></div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
          <!-- Photo Section -->
          <div class="photo-section">
            <div class="employee-photo">
              ${employee.photo ? 
                `<img src="${employee.photo}" alt="Employee Photo" />` : 
                `<div class="no-photo">EMPLOYEE<br>PHOTO</div>`
              }
              <div class="photo-frame"></div>
            </div>
          </div>
          
          <!-- Info Section -->
          <div class="info-section">
            <div>
              <div class="employee-name">${employee.name}</div>
              <div class="employee-title">${employee.position}</div>
              
              <div class="employee-details">
                <div class="detail-row">
                  <span class="detail-label">ID No</span>
                  <span class="detail-value id-number">${employee.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Dept</span>
                  <span class="detail-value">${employee.department}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Blood</span>
                  <span class="detail-value">${employee.bloodGroup || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">${employee.email || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">${employee.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Decorative Elements -->
        <div class="decorative-elements">
          <div class="diamond"></div>
          <div class="diamond"></div>
          <div class="diamond"></div>
        </div>
        
        <!-- Footer Section with QR Code -->
        <div class="footer-section">
          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrCodeImage}" alt="QR Code" />
            </div>
          </div>
          <div class="website">WWW.QRTIMECARD.COM</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(cardContent);
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