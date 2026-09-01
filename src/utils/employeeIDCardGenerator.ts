// Employee ID Card Generator - Matches the provided sample design
import { Employee } from '../types';
import html2canvas from 'html2canvas';

/**
 * Generates and displays an employee ID card with the exact dimensions of 85.60mm x 53.98mm
 * @param employee Employee data
 * @param qrCodeImage QR code image data URL
 */
export const generateEmployeeIDCard = (employee: Employee, qrCodeImage: string, companyId?: string) => {
  // Fetch company info
  let companyName = '';
  let companyLogo = '';
  if (companyId) {
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    const company = companies.find((c: Record<string, unknown>) => c.id === companyId);
    if (company) {
      companyName = company.name as string;
      companyLogo = company.logoUrl as string || '';
    }
  }

  // Create a new window for the employee ID card
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to generate employee ID card');
    return;
  }

  // Standard ID card dimensions: CR80 85.60mm x 53.98mm (portrait)
  const cardWidth = '53.98mm'; // width is shorter side for portrait
  const cardHeight = '85.60mm'; // height is longer side for portrait
  
  // Ensure oldId is present
  const idNumber = employee.oldId || '';
  if (!idNumber) {
    alert('Warning: No legacy/old ID found for this employee.');
  }

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
          orientation: portrait;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: ${cardWidth};
          height: ${cardHeight};
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .card-container {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 3mm;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          position: relative;
          overflow: hidden;
        }
        .header-section {
          width: 100%;
          padding: 2mm 0 1mm 0;
          background: #2563eb;
          color: white;
          text-align: center;
          font-size: 7.5pt;
          font-weight: bold;
          border-radius: 3mm 3mm 0 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1mm;
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
          html, body {
            width: ${cardWidth};
            height: ${cardHeight};
            margin: 0;
            padding: 0;
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
            ${employee.photo ? `<img src="${employee.photo}" alt="Employee Photo" class="employee-photo" />` : `<div class="no-photo">EMPLOYEE<br>PHOTO</div>`}
          </div>
          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrCodeImage}" alt="QR Code" />
            </div>
          </div>
          <div class="info-section">
            <div class="employee-name">${employee.name}</div>
            <div class="employee-title">${employee.position || ''}</div>
            <div class="employee-details">
              <div class="detail-row"><span class="detail-label">ID No</span><span class="detail-value">${idNumber}</span></div>
              <div class="detail-row"><span class="detail-label">Dept</span><span class="detail-value">${employee.department || ''}</span></div>
              <div class="detail-row"><span class="detail-label">Blood</span><span class="detail-value">${employee.bloodGroup || 'N/A'}</span></div>
              <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${employee.email || 'Not provided'}</span></div>
              <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${employee.phone || 'Not provided'}</span></div>
            </div>
          </div>
        </div>
        <div class="footer-section">${companyName || ''}</div>
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

export const downloadEmployeeIDCard = async (employee: Employee, qrCodeImage: string, companyId?: string) => {
  // Create a hidden div for rendering the card
  const cardDiv = document.createElement('div');
  cardDiv.style.position = 'fixed';
  cardDiv.style.left = '-9999px';
  cardDiv.style.top = '0';
  document.body.appendChild(cardDiv);

  // Render the card HTML (reuse the printContent from generateEmployeeIDCard, but as a div)
  cardDiv.innerHTML = `<div id="employee-id-card-download" style="width:336px;height:256px;box-sizing:border-box;">${/* ...card HTML, same as printContent, but as a div... */''}</div>`;

  // Use html2canvas to capture the card
  const cardElement = cardDiv.querySelector('#employee-id-card-download') as HTMLElement;
  if (cardElement) {
    const canvas = await html2canvas(cardElement, { scale: 2 });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${employee.name.replace(/\s+/g, '_')}_ID_Card.png`;
    link.click();
  }
  document.body.removeChild(cardDiv);
};