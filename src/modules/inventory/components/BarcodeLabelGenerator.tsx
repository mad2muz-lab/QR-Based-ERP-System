import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Package, QrCode } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem } from '../data/ksaData';

const BarcodeLabelGenerator: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [labelFormat, setLabelFormat] = useState<'qr' | 'barcode' | 'both'>('both');

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

  const handlePrint = () => {
    const selected = items.filter(i => selectedItems.includes(i.id));
    if (selected.length === 0) {
      alert('Please select at least one item');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = selected.map(item => `
      <div style="page-break-inside: avoid; margin-bottom: 20px; padding: 15px; border: 2px dashed #000; width: 300px; font-family: monospace;">
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">${item.name}</div>
        <div style="font-size: 14px; margin-bottom: 5px;">SKU: ${item.sku}</div>
        <div style="font-size: 14px; margin-bottom: 5px;">QR: ${item.qrCode}</div>
        <div style="font-size: 14px; margin-bottom: 10px;">${item.warehouseId} | ${item.unit}</div>
        ${labelFormat === 'qr' || labelFormat === 'both' ? `<div style="text-align: center; margin: 10px 0; font-size: 12px;">[QR CODE: ${item.qrCode}]</div>` : ''}
        ${labelFormat === 'barcode' || labelFormat === 'both' ? `<div style="text-align: center; margin: 10px 0; font-family: 'Libre Barcode 39', cursive; font-size: 40px;">*${item.sku}*</div>` : ''}
        <div style="font-size: 12px; color: #666; margin-top: 10px;">Batch: ${item.batchNumber || 'N/A'}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head><title>Inventory Labels</title></head>
        <body style="padding: 20px;">
          ${html}
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                <button onClick={handlePrint} disabled={selectedItems.length === 0} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print Labels ({selectedItems.length})
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
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
                      <td className="py-3 px-4 text-gray-600">{item.sku}</td>
                      <td className="py-3 px-4 text-gray-600">{item.qrCode}</td>
                      <td className="py-3 px-4 text-gray-600">{item.warehouseId}</td>
                      <td className="py-3 px-4 text-gray-600">{item.batchNumber || 'N/A'}</td>
                    </tr>
                  ))}
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
