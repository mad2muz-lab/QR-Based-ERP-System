import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Package, QrCode } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem } from '../data/ksaData';
import QRCode from 'qrcode';

// Helper to generate a crisp SVG Code 128 barcode
const generateCode128SVG = (text: string): string => {
  // Code 128 table B patterns
  const patterns: { [char: string]: string } = {
    ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
    '$': '10010001100', '%': '10001001100', '&': '10011001000', '\'': '10011000100',
    '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
    ',': '10110011100', '-': '10011011100', '.': '10011001110', '/': '10111001100',
    '0': '10011101100', '1': '10011100110', '2': '11001110010', '3': '11001011100',
    '4': '11001001110', '5': '11011100100', '6': '11001110100', '7': '11101101110',
    '8': '11101001100', '9': '11100101100', ':': '11100100110', ';': '11101100100',
    '<': '11100110100', '=': '11100110010', '>': '11011011000', '?': '11011000110',
    '@': '11000110110', 'A': '10100011000', 'B': '10001011000', 'C': '10001000110',
    'D': '10110001000', 'E': '10001101000', 'F': '10001100010', 'G': '11010001000',
    'H': '11000101000', 'I': '11000100010', 'J': '10110111000', 'K': '10110001110',
    'L': '10001101110', 'M': '10111011000', 'N': '10111000110', 'O': '10001110110',
    'P': '11101110110', 'Q': '11010001110', 'R': '11000101110', 'S': '11011101000',
    'T': '11011100010', 'U': '11011101110', 'V': '11101011000', 'W': '11101000110',
    'X': '11100010110', 'Y': '11101101000', 'Z': '11101100010', '[': '11100011010',
    '\\': '11101111010', ']': '11001000010', '^': '11110001010', '_': '10100110000'
  };
  // Fallback pattern
  const defaultPattern = '10011101100'; // '0'
  const startPattern = '11010010000'; // Start B
  const stopPattern = '1100011101011'; // Stop

  const cleanText = text.toUpperCase().replace(/[^A-Z0-9 \-_.]/g, '');
  let binary = startPattern;
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    binary += patterns[char] || defaultPattern;
  }
  binary += stopPattern;

  const barWidth = 2;
  const height = 45;
  const svgWidth = binary.length * barWidth;

  let rects = '';
  let x = 0;
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      rects += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="#0f172a" />`;
    }
    x += barWidth;
  }

  return `<svg width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">${rects}</svg>`;
};

const BarcodeLabelGenerator: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [labelFormat, setLabelFormat] = useState<'qr' | 'barcode' | 'both'>('both');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setItems(inventoryStorage.getItems());
  }, []);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedItems(items.map(i => i.id));
  };

  const clearAll = () => {
    setSelectedItems([]);
  };

  const handlePrint = async () => {
    const selected = items.filter(i => selectedItems.includes(i.id));
    if (selected.length === 0) {
      alert('Please select at least one item');
      return;
    }

    setIsGenerating(true);

    try {
      // Pre-generate QR Code Data URLs for all selected items
      const qrDataUrls: { [id: string]: string } = {};
      for (const item of selected) {
        try {
          qrDataUrls[item.id] = await QRCode.toDataURL(item.qrCode || item.sku || item.id, {
            width: 240,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
            errorCorrectionLevel: 'M'
          });
        } catch {
          qrDataUrls[item.id] = '';
        }
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print labels');
        setIsGenerating(false);
        return;
      }

      const html = selected.map(item => {
        const zoneObj = inventoryStorage.getZone(item.zoneId);
        const zoneName = zoneObj ? zoneObj.name : item.zoneId || 'General Storage';
        const binLoc = item.binLocation || item.location || 'Aisle 1, Bin 01';
        const qrImage = qrDataUrls[item.id];
        const barcodeSVG = generateCode128SVG(item.sku);

        return `
          <div class="label-card">
            <!-- Header -->
            <div class="label-header">
              <div class="brand">
                <span class="brand-title">KSA ERP INVENTORY</span>
                <span class="brand-sub">${item.warehouseId || 'CENTRAL DC'}</span>
              </div>
              <div class="status-tag">${item.status ? item.status.replace('_', ' ').toUpperCase() : 'ACTIVE'}</div>
            </div>

            <!-- Material Title -->
            <div class="material-name">${item.name}</div>
            ${item.arabicName ? `<div class="material-arabic">${item.arabicName}</div>` : ''}

            <!-- Location Information Box (Zone / Aisle / Bin) -->
            <div class="loc-box">
              <div class="loc-item">
                <span class="loc-label">ZONE</span>
                <span class="loc-value">${zoneName}</span>
              </div>
              <div class="loc-divider"></div>
              <div class="loc-item">
                <span class="loc-label">AISLE / BIN / RACK</span>
                <span class="loc-value highlight">${binLoc}</span>
              </div>
            </div>

            <!-- Codes Section (QR Code & 1D Barcode) -->
            <div class="codes-container ${labelFormat}">
              ${(labelFormat === 'qr' || labelFormat === 'both') && qrImage ? `
                <div class="qr-block">
                  <img src="${qrImage}" alt="QR Code" class="qr-img" />
                  <div class="code-caption">${item.qrCode}</div>
                </div>
              ` : ''}

              ${(labelFormat === 'barcode' || labelFormat === 'both') ? `
                <div class="barcode-block">
                  <div class="barcode-svg-wrap">${barcodeSVG}</div>
                  <div class="code-caption mono">*${item.sku}*</div>
                </div>
              ` : ''}
            </div>

            <!-- Footer Details -->
            <div class="footer-meta">
              <div class="meta-row">
                <span><strong>SKU:</strong> ${item.sku}</span>
                <span><strong>Category:</strong> ${item.category || 'General'}</span>
              </div>
              <div class="meta-row">
                <span><strong>Batch:</strong> ${item.batchNumber || 'N/A'}</span>
                <span><strong>Unit:</strong> ${item.unit || 'PCS'}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Inventory Barcode & QR Labels</title>
            <style>
              @page {
                size: 100mm 75mm;
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
                background: #f1f5f9;
                padding: 10px;
                color: #0f172a;
              }
              @media print {
                body {
                  background: #ffffff;
                  padding: 0;
                }
              }
              .label-card {
                width: 96mm;
                min-height: 70mm;
                margin: 0 auto 12px auto;
                padding: 3mm 4mm;
                background: #ffffff;
                border: 1.5px solid #0f172a;
                border-radius: 3mm;
                page-break-inside: avoid;
                page-break-after: always;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .label-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1.5px solid #0f172a;
                padding-bottom: 2mm;
                margin-bottom: 2mm;
              }
              .brand-title {
                display: block;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.5px;
                color: #0f172a;
              }
              .brand-sub {
                display: block;
                font-size: 8px;
                font-weight: 600;
                color: #475569;
                text-transform: uppercase;
              }
              .status-tag {
                background: #0f172a;
                color: #ffffff;
                font-size: 8px;
                font-weight: 700;
                padding: 2px 6px;
                border-radius: 2px;
                letter-spacing: 0.5px;
              }
              .material-name {
                font-size: 13px;
                font-weight: 800;
                color: #0f172a;
                line-height: 1.2;
                margin-bottom: 1mm;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              .material-arabic {
                font-size: 10px;
                color: #475569;
                direction: rtl;
                margin-bottom: 2mm;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .loc-box {
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 2mm;
                padding: 2mm 3mm;
                display: flex;
                align-items: center;
                margin-bottom: 2.5mm;
              }
              .loc-item {
                flex: 1;
              }
              .loc-divider {
                width: 1px;
                height: 20px;
                background: #cbd5e1;
                margin: 0 3mm;
              }
              .loc-label {
                display: block;
                font-size: 7.5px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.4px;
              }
              .loc-value {
                display: block;
                font-size: 10.5px;
                font-weight: 700;
                color: #0f172a;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              .loc-value.highlight {
                color: #1d4ed8;
              }
              .codes-container {
                display: flex;
                align-items: center;
                justify-content: space-around;
                background: #ffffff;
                border: 1px dashed #cbd5e1;
                border-radius: 2mm;
                padding: 2mm;
                margin-bottom: 2mm;
              }
              .codes-container.qr .barcode-block { display: none; }
              .codes-container.barcode .qr-block { display: none; }
              .qr-block {
                text-align: center;
              }
              .qr-img {
                width: 22mm;
                height: 22mm;
                display: block;
                margin: 0 auto;
              }
              .barcode-block {
                text-align: center;
                flex: 1;
                padding: 0 2mm;
              }
              .barcode-svg-wrap {
                margin: 0 auto 1mm auto;
              }
              .code-caption {
                font-size: 7.5px;
                font-weight: 600;
                color: #334155;
                margin-top: 1px;
              }
              .code-caption.mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                letter-spacing: 0.5px;
              }
              .footer-meta {
                border-top: 1px solid #e2e8f0;
                padding-top: 1.5mm;
                font-size: 8px;
                color: #334155;
              }
              .meta-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5mm;
              }
            </style>
          </head>
          <body>
            ${html}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err: any) {
      alert('Error generating labels: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/scan')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Barcode / QR Label Generator</h1>
                <p className="text-sm text-gray-500">Generate and print labels for inventory tagging</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label Format</label>
                <div className="flex gap-2">
                  {(['qr', 'barcode', 'both'] as const).map(format => (
                    <button
                      key={format}
                      onClick={() => setLabelFormat(format)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                        labelFormat === format ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={selectAll} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Select All</button>
                <button onClick={clearAll} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Clear</button>
                <button onClick={handlePrint} disabled={selectedItems.length === 0 || isGenerating} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : `Print Labels (${selectedItems.length})`}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-10">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === items.length && items.length > 0}
                        onChange={selectedItems.length === items.length ? clearAll : selectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Material</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">QR Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Warehouse</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Zone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Aisle / Bin</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const zoneObj = inventoryStorage.getZone(item.zoneId);
                    const zoneName = zoneObj ? zoneObj.name : item.zoneId || '-';
                    const binLoc = item.binLocation || item.location || '-';

                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => toggleItem(item.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">{item.name}</td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-xs">{item.sku}</td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-xs">{item.qrCode}</td>
                        <td className="py-3 px-4 text-gray-600">{item.warehouseId}</td>
                        <td className="py-3 px-4 text-gray-700 font-medium">{zoneName}</td>
                        <td className="py-3 px-4 text-blue-700 font-medium">{binLoc}</td>
                        <td className="py-3 px-4 text-gray-600">{item.batchNumber || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeLabelGenerator;
