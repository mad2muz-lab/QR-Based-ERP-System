// PDF generation utility for ID cards and Asset Labels
export const generateIDCardPDF = (entityData: any, qrCodeImage: string, entityType: string = 'employee') => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print ID cards or labels');
    return;
  }

  const isEmployee = entityType === 'employee';
  const isMaterial = entityType === 'material';
  const isEquipment = entityType === 'equipment';

  // Company info
  const companyName = entityData.companyName || entityData.company || 'ERP SYSTEM';
  const companyLogo = entityData.companyLogo || entityData.logoUrl || '';

  let printContent = '';

  if (isMaterial) {
    // Dedicated Professional Material Asset Tag
    const pageWidth = '100mm';
    const pageHeight = '72mm';
    const materialCode = entityData.qrCode || entityData.id || 'N/A';
    const formattedDate = entityData.createdAt ? new Date(entityData.createdAt).toLocaleDateString() : new Date().toLocaleDateString();

    printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Material Label - ${entityData.name || 'Item'}</title>
        <style>
          @page {
            size: ${pageWidth} ${pageHeight};
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            width: ${pageWidth};
            height: ${pageHeight};
            background: #ffffff;
            color: #0f172a;
            position: relative;
            padding: 2.5mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .label-container {
            width: 100%;
            height: 100%;
            border: 1.5px solid #0f172a;
            border-radius: 3mm;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #ffffff;
          }
          .header-bar {
            background: linear-gradient(135deg, #002e17 0%, #004d26 100%);
            color: #ffffff;
            padding: 1.8mm 3mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .header-title {
            font-size: 8.5pt;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 1.5mm;
          }
          .header-badge {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.4);
            font-size: 6.5pt;
            padding: 0.5mm 2mm;
            border-radius: 2mm;
            font-weight: 700;
            text-transform: uppercase;
          }
          .main-body {
            flex: 1;
            display: flex;
            padding: 2.5mm 3mm 1.5mm 3mm;
            gap: 3mm;
          }
          .qr-column {
            width: 32mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-box {
            width: 28mm;
            height: 28mm;
            padding: 1mm;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 2mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .qr-code-text {
            font-family: 'Courier New', Courier, monospace;
            font-size: 5.5pt;
            font-weight: 700;
            color: #334155;
            margin-top: 1mm;
            text-align: center;
            word-break: break-all;
            max-width: 30mm;
          }
          .scan-hint {
            font-size: 5pt;
            color: #059669;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .details-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .item-name {
            font-size: 9.5pt;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
            margin-bottom: 1.5mm;
            text-transform: uppercase;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.7mm 0;
            border-bottom: 0.5px solid #f1f5f9;
            font-size: 6.5pt;
          }
          .info-label {
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
          }
          .info-val {
            color: #0f172a;
            font-weight: 700;
            text-align: right;
            max-width: 36mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .stock-badge {
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
            padding: 0.3mm 1.5mm;
            border-radius: 1.5mm;
            font-weight: 800;
          }
          .footer-bar {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 1mm 3mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 5.5pt;
            color: #64748b;
          }
          .footer-instruction {
            font-weight: 600;
            color: #334155;
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
        <div class="label-container">
          <div class="header-bar">
            <div class="header-title">
              ${companyLogo ? `<img src="${companyLogo}" style="height: 4mm; object-fit: contain;" />` : ''}
              <span>${companyName} • ASSET TAG</span>
            </div>
            <div class="header-badge">${entityData.type || 'MATERIAL'}</div>
          </div>
          <div class="main-body">
            <div class="qr-column">
              <div class="qr-box">
                <img src="${qrCodeImage}" alt="QR Code" />
              </div>
              <div class="qr-code-text">${materialCode}</div>
              <div class="scan-hint">SCAN TO AUDIT / LOG</div>
            </div>
            <div class="details-column">
              <div>
                <div class="item-name">${entityData.name || 'Untitled Material'}</div>
                <div class="info-table">
                  <div class="info-row">
                    <span class="info-label">Material ID:</span>
                    <span class="info-val" style="font-family: monospace;">${entityData.oldId || entityData.id || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Stock Quantity:</span>
                    <span class="info-val"><span class="stock-badge">${entityData.quantity ?? 0} ${entityData.unit || 'Units'}</span></span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Site / Warehouse:</span>
                    <span class="info-val">${entityData.site || 'Main Warehouse'}</span>
                  </div>
                  ${entityData.batchNumber || entityData.lotNumber ? `
                  <div class="info-row">
                    <span class="info-label">Batch/Lot:</span>
                    <span class="info-val">${entityData.batchNumber || entityData.lotNumber}</span>
                  </div>` : ''}
                  <div class="info-row">
                    <span class="info-label">Tagged Date:</span>
                    <span class="info-val">${formattedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer-bar">
            <span class="footer-instruction">Scan with ERP QR Scanner for In / Out / Transfer</span>
            <span>ERP ASSET IDENTIFIER</span>
          </div>
        </div>
      </body>
      </html>
    `;
  } else if (isEquipment) {
    // Dedicated Equipment Asset Tag
    const pageWidth = '100mm';
    const pageHeight = '72mm';
    const equipmentCode = entityData.custom_equipment_id || entityData.qrCode || entityData.id || 'N/A';

    printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Equipment Label - ${entityData.name || 'Equipment'}</title>
        <style>
          @page {
            size: ${pageWidth} ${pageHeight};
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            width: ${pageWidth};
            height: ${pageHeight};
            background: #ffffff;
            color: #0f172a;
            position: relative;
            padding: 2.5mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .label-container {
            width: 100%;
            height: 100%;
            border: 1.5px solid #0f172a;
            border-radius: 3mm;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #ffffff;
          }
          .header-bar {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            color: #ffffff;
            padding: 1.8mm 3mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .header-title {
            font-size: 8.5pt;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 1.5mm;
          }
          .header-badge {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.4);
            font-size: 6.5pt;
            padding: 0.5mm 2mm;
            border-radius: 2mm;
            font-weight: 700;
            text-transform: uppercase;
          }
          .main-body {
            flex: 1;
            display: flex;
            padding: 2.5mm 3mm 1.5mm 3mm;
            gap: 3mm;
          }
          .qr-column {
            width: 32mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-box {
            width: 28mm;
            height: 28mm;
            padding: 1mm;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 2mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .qr-code-text {
            font-family: 'Courier New', Courier, monospace;
            font-size: 5.5pt;
            font-weight: 700;
            color: #334155;
            margin-top: 1mm;
            text-align: center;
            word-break: break-all;
            max-width: 30mm;
          }
          .scan-hint {
            font-size: 5pt;
            color: #2563eb;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .details-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .item-name {
            font-size: 9.5pt;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
            margin-bottom: 1.5mm;
            text-transform: uppercase;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.7mm 0;
            border-bottom: 0.5px solid #f1f5f9;
            font-size: 6.5pt;
          }
          .info-label {
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
          }
          .info-val {
            color: #0f172a;
            font-weight: 700;
            text-align: right;
            max-width: 36mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .footer-bar {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 1mm 3mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 5.5pt;
            color: #64748b;
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
        <div class="label-container">
          <div class="header-bar">
            <div class="header-title">
              ${companyLogo ? `<img src="${companyLogo}" style="height: 4mm; object-fit: contain;" />` : ''}
              <span>${companyName} • EQUIPMENT TAG</span>
            </div>
            <div class="header-badge">${entityData.status || 'ACTIVE'}</div>
          </div>
          <div class="main-body">
            <div class="qr-column">
              <div class="qr-box">
                <img src="${qrCodeImage}" alt="QR Code" />
              </div>
              <div class="qr-code-text">${equipmentCode}</div>
              <div class="scan-hint">SCAN FOR USAGE LOGS</div>
            </div>
            <div class="details-column">
              <div>
                <div class="item-name">${entityData.name || 'Equipment'}</div>
                <div class="info-table">
                  <div class="info-row">
                    <span class="info-label">Equipment ID:</span>
                    <span class="info-val" style="font-family: monospace;">${equipmentCode}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Type / Category:</span>
                    <span class="info-val">${entityData.type || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Model:</span>
                    <span class="info-val">${entityData.model || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Site / Location:</span>
                    <span class="info-val">${entityData.site || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer-bar">
            <span>Scan to Clock-In / Start Use / Stop Use / Maintenance</span>
            <span>EQUIPMENT ASSET TAG</span>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    // Standard Employee ID Card (CR80 standard dimensions)
    const pageWidth = '85.60mm';
    const pageHeight = '53.98mm';

    printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee ID Card - ${entityData.name}</title>
        <style>
          @page {
            size: ${pageWidth} ${pageHeight};
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            width: ${pageWidth};
            height: ${pageHeight};
            background: #f4f6fa;
            color: #222;
            position: relative;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .card-container {
            width: 100%;
            height: 100%;
            background: #fff;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
          }
          .header-section {
            width: 100%;
            height: 11mm;
            background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 4mm;
          }
          .company-name-text {
            font-size: 7.5pt;
            font-weight: bold;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .main-content {
            flex: 1;
            display: flex;
            align-items: center;
            padding: 2mm 3mm;
            gap: 3mm;
          }
          .photo-section {
            width: 20mm;
            height: 24mm;
            background: #f3f4f6;
            border-radius: 1.5mm;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .employee-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .no-photo {
            color: #9ca3af;
            font-size: 6pt;
            text-align: center;
            font-weight: 600;
          }
          .info-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .employee-name {
            font-size: 8.5pt;
            font-weight: 800;
            color: #1f2937;
            text-transform: uppercase;
            margin-bottom: 0.5mm;
          }
          .employee-title {
            font-size: 6.5pt;
            color: #2563eb;
            font-weight: 600;
            margin-bottom: 1.5mm;
          }
          .employee-details {
            font-size: 5.5pt;
            color: #374151;
            width: 100%;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5mm;
          }
          .detail-label {
            font-weight: bold;
            color: #64748b;
          }
          .detail-value {
            text-align: right;
            font-weight: 600;
          }
          .qr-section {
            width: 18mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .qr-code {
            width: 16mm;
            height: 16mm;
            background: #fff;
            padding: 0.5mm;
            border-radius: 1.5mm;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-code img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .footer-section {
            width: 100%;
            height: 4mm;
            background: #f8fafc;
            border-top: 0.5px solid #e2e8f0;
            text-align: center;
            font-size: 5pt;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
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
            <span class="company-name-text">${companyName}</span>
            <span style="font-size: 6pt; opacity: 0.9;">STAFF ID</span>
          </div>
          <div class="main-content">
            <div class="photo-section">
              ${entityData.photo ? `<img src="${entityData.photo}" alt="Employee Photo" class="employee-photo" />` : `<div class="no-photo">PHOTO</div>`}
            </div>
            <div class="info-section">
              <div class="employee-name">${entityData.name}</div>
              <div class="employee-title">${entityData.position || 'Staff'}</div>
              <div class="employee-details">
                <div class="detail-row"><span class="detail-label">ID No</span><span class="detail-value">${entityData.oldId || entityData.id || ''}</span></div>
                <div class="detail-row"><span class="detail-label">Dept</span><span class="detail-value">${entityData.department || 'Operations'}</span></div>
                ${entityData.bloodGroup ? `<div class="detail-row"><span class="detail-label">Blood</span><span class="detail-value">${entityData.bloodGroup}</span></div>` : ''}
                ${entityData.phone ? `<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${entityData.phone}</span></div>` : ''}
              </div>
            </div>
            <div class="qr-section">
              <div class="qr-code">
                <img src="${qrCodeImage}" alt="QR Code" />
              </div>
            </div>
          </div>
          <div class="footer-section">
            Authorized Personnel Identification Card
          </div>
        </div>
      </body>
      </html>
    `;
  }

  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for images to load before printing
  const handleLoad = () => {
    setTimeout(() => {
      printWindow.print();
      // Don't auto-close immediately to allow user to save as PDF
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 800);
  };
  
  if (printWindow.document.readyState === 'complete') {
    handleLoad();
  } else {
    printWindow.onload = handleLoad;
  }
};

export const downloadIDCardAsPDF = (entityData: any, qrCodeImage: string, entityType: string = 'employee') => {
  generateIDCardPDF(entityData, qrCodeImage, entityType);
};