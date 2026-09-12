import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, X, FileText, Truck, Package, AlertTriangle } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { REGIONS, MaterialItem, Warehouse } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';
import { SearchableSelect } from '../../../components/common/SearchableSelect';

const GoodsReceipt: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const warehouses = REGIONS.flatMap(r => r.warehouses);
  
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [orderedQuantity, setOrderedQuantity] = useState<number>(1);
  const [varianceDisposition, setVarianceDisposition] = useState<'partial_backorder' | 'short_closed' | 'over_delivery' | 'none'>('none');
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [supplier, setSupplier] = useState('');
  const [grnNumber, setGrnNumber] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateGRN = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GRN-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !warehouse || quantity <= 0) {
      setError('Please select material, warehouse, and quantity');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const grn = grnNumber || generateGRN();
      const varianceDiff = orderedQuantity - quantity;
      const varianceText = varianceDiff !== 0
        ? ` | Ordered: ${orderedQuantity}, Received: ${quantity} (${varianceDiff > 0 ? `Shortfall: ${varianceDiff}` : `Over: ${Math.abs(varianceDiff)}`}, Disp: ${varianceDisposition})`
        : ` | Ordered: ${orderedQuantity}, Received: ${quantity}`;
      const receiptNotes = `Goods Receipt | GRN: ${grn} | PO: ${purchaseOrder || 'N/A'} | Supplier: ${supplier || 'N/A'}${varianceText} | ${notes}`;
      
      const now = new Date();
      const materialLog = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        materialType: selectedMaterial.type,
        action: 'material-in' as const,
        quantity,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        site: warehouse.name,
        status: selectedMaterial.status,
        notes: receiptNotes,
        oldId: selectedMaterial.id
      };

      await OfflineDataManager.createMaterialLog(materialLog);

      const updatedMaterial = {
        ...selectedMaterial,
        warehouseId: warehouse.id,
        quantity: selectedMaterial.quantity + quantity,
        lastReceived: now.toISOString().split('T')[0],
        lastUpdated: now.toISOString()
      };
      inventoryStorage.updateItem(selectedMaterial.id, updatedMaterial);

      setSuccess(`Goods receipt completed: ${quantity} ${selectedMaterial.unit} of ${selectedMaterial.name} received at ${warehouse.name}`);
      setTimeout(() => {
        navigate('/scan');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Goods receipt failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/scan')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Goods Receipt</h1>
                <p className="text-sm text-gray-500">Receive materials into warehouse</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Receiving a delivery shipment with <strong>multiple goods</strong>, supplier PO, or QC inspection?</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/inventory/manifest')}
                className="font-bold text-blue-700 hover:text-blue-900 underline whitespace-nowrap ml-2"
              >
                Use Multi-Item GRN &rarr;
              </button>
            </div>
            {success && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">{error}</div>
            )}

            <div className="space-y-4">
              <SearchableSelect
                label="Material"
                required
                placeholder="Select material from inventory..."
                searchPlaceholder="Search material by name, SKU..."
                value={selectedMaterial?.id || ''}
                onChange={val => {
                  const item = inventoryStorage.getItemById(val);
                  setSelectedMaterial(item || null);
                }}
                options={inventoryStorage.getItems().map(m => ({
                  value: m.id,
                  label: m.name,
                  sublabel: m.sku,
                  badge: `${m.quantity} ${m.unit}`
                }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <SearchableSelect
                    label="Warehouse"
                    required
                    placeholder="Select warehouse..."
                    searchPlaceholder="Search warehouse, city, code..."
                    value={warehouse?.id || ''}
                    onChange={val => {
                      const wh = warehouses.find(w => w.id === val);
                      setWarehouse(wh || null);
                    }}
                    options={warehouses.map(w => ({
                      value: w.id,
                      label: w.name,
                      sublabel: `${w.city} • Code: ${w.code}`,
                      badge: w.status
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Ordered (PO)</label>
                  <input
                    type="number"
                    min="1"
                    value={orderedQuantity}
                    onChange={e => setOrderedQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Real-time Discrepancy & Shortfall Warning Banner */}
              {orderedQuantity > 0 && quantity !== orderedQuantity && (
                <div className={`p-4 rounded-xl border ${
                  quantity < orderedQuantity
                    ? 'bg-amber-50/90 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
                    : 'bg-blue-50/90 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800'
                } transition-all space-y-3`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${quantity < orderedQuantity ? 'text-amber-600' : 'text-blue-600'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {quantity < orderedQuantity
                            ? `Short Delivery Detected: Missing ${orderedQuantity - quantity} ${selectedMaterial?.unit || 'units'} (-${Math.round(((orderedQuantity - quantity) / orderedQuantity) * 100)}% Variance)`
                            : `Over-Delivery: Received +${quantity - orderedQuantity} ${selectedMaterial?.unit || 'units'} above PO ordered quantity`}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                          {Math.round((Math.abs(orderedQuantity - quantity) / orderedQuantity) * 100)}% Variance
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Ordered: <strong>{orderedQuantity}</strong> | Delivered: <strong>{quantity}</strong>. Please record the disposition reason for backorder or supplier reconciliation:
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                    <label className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      Variance Disposition:
                    </label>
                    <select
                      value={varianceDisposition}
                      onChange={e => setVarianceDisposition(e.target.value as any)}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                    >
                      <option value="none">-- Select Action / Reason --</option>
                      <option value="partial_backorder">📦 Partial Delivery - Remaining balance expected on backorder</option>
                      <option value="short_closed">❌ Short Shipped / Closed - Supplier cannot fulfill remainder</option>
                      <option value="over_delivery">➕ Excess / Sample - Accepted extra units from supplier</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GRN Number</label>
                  <input type="text" value={grnNumber} onChange={e => setGrnNumber(e.target.value)} placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order</label>
                  <input type="text" value={purchaseOrder} onChange={e => setPurchaseOrder(e.target.value)} placeholder="PO-2024-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Receiving notes, condition, remarks..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/scan')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting || !selectedMaterial || !warehouse} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isSubmitting ? 'Processing...' : 'Complete Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GoodsReceipt;

