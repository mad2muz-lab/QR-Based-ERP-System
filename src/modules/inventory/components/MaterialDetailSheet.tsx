import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MaterialItem } from '../data/ksaData';
import { useInventory } from '../hooks/useInventory';
import { TrendingUp, CheckCircle, X, AlertTriangle, Package } from 'lucide-react';

interface MaterialDetailSheetProps {
  material: MaterialItem;
  onClose: () => void;
  onUpdate: () => void;
}

export const MaterialDetailSheet: React.FC<MaterialDetailSheetProps> = ({ material, onClose, onUpdate }) => {
  const { updateQuantity } = useInventory();
  const [formData, setFormData] = useState({
    quantity: material.quantity,
    reserved: material.reserved,
    minStock: material.minStock,
    maxStock: material.maxStock,
    safetyStock: material.safetyStock,
    unitCost: material.unitCost,
    sellingPrice: material.sellingPrice,
    taxRate: material.taxRate,
    supplier: material.supplier || '',
    location: material.location,
    batchNumber: material.batchNumber || '',
    expirationDate: material.expirationDate || '',
    manufacturingDate: material.manufacturingDate || '',
    serialNumber: material.serialNumber || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsUpdating(true);
    try {
      const oldQuantity = material.quantity;
      const newQuantity = parseInt(String(formData.quantity)) || 0;
      if (newQuantity !== oldQuantity) {
        await updateQuantity(material.id, newQuantity, 'adjusted');
      }
      setTimeout(() => {
        setIsUpdating(false);
        setNotification({ type: 'success', message: 'Material updated successfully!' });
        onUpdate();
        setTimeout(() => setNotification(null), 3000);
      }, 500);
    } catch (err) {
      setIsUpdating(false);
      setNotification({ type: 'error', message: 'Failed to update material.' });
    }
  };

  const handleClose = () => {
    setNotification(null);
    onClose();
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, []);

  const statusColors: Record<string, string> = {
    in_stock: 'bg-emerald-100 text-emerald-700',
    low_stock: 'bg-amber-100 text-amber-700',
    out_of_stock: 'bg-rose-100 text-rose-700',
    reserved: 'bg-blue-100 text-blue-700',
    quarantine: 'bg-gray-100 text-gray-700'
  };

  const formatCurrency = (num: number) => new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(num);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleClose}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{material.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{material.sku} - {material.category}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5">
            {notification && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{notification.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Stock</h3>
                  <div className="text-3xl font-bold text-slate-900">
                    {formData.quantity.toLocaleString()} <span className="text-base font-normal text-slate-500">{material.unit}</span>
                  </div>
                  {formData.reserved > 0 && (
                    <div className="text-sm text-blue-600 mt-1">{formData.reserved} reserved</div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Stock Status</h3>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColors[material.status] || statusColors.in_stock}`}>
                      {material.status === 'low_stock' ? <AlertTriangle className="w-4 h-4" />
                        : material.status === 'out_of_stock' ? <X className="w-4 h-4" />
                        : material.status === 'in_stock' ? <CheckCircle className="w-4 h-4" />
                        : material.status === 'reserved' ? <Package className="w-4 h-4" />
                        : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 capitalize">{material.status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Min: {formData.minStock} {material.unit} - Reorder: {formData.minStock * 2} {material.unit}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Financials</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Unit Cost</span>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(formData.unitCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Selling Price</span>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(formData.sellingPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Profit Margin</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formData.sellingPrice && formData.unitCost ? 
                          `${(((formData.sellingPrice - formData.unitCost) / formData.sellingPrice) * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Stock Value</span>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(formData.quantity * formData.unitCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Reserved Value</span>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(formData.reserved * formData.unitCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Stock Value @ Sale</span>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(formData.quantity * (formData.sellingPrice || 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Supplier & Location</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Supplier</p>
                      <p className="text-sm font-semibold text-slate-900">{material.supplier || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-sm font-semibold text-slate-900">{formData.location || 'N/A'}</p>
                    </div>
                  </div>
</div>
 
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">QR Code</h3>
                  <p className="text-sm font-mono text-slate-700 break-all">{material.qrCode}</p>
                </div>
 
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Batch Information</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Batch Number</p>
                      <p className="text-sm font-semibold text-slate-900">{formData.batchNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Manufacturing Date</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formData.manufacturingDate ? new Date(formData.manufacturingDate).toLocaleDateString('en-SA') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Expiration Date</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formData.expirationDate ? (
                          <span className={new Date(formData.expirationDate) < new Date() 
                            ? 'text-red-600' 
                            : new Date(formData.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                              ? 'text-amber-600' 
                              : 'text-green-600'}>
                            {new Date(formData.expirationDate).toLocaleDateString('en-SA')}
                          </span>
                        ) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
 
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Serial Number</h3>
                  <p className="text-sm font-mono text-slate-700 break-all">{formData.serialNumber || 'N/A'}</p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Stock Health</span>
                  </div>
                  <p className="text-sm text-emerald-800">
                    {material.quantity > material.minStock ? 'Stock level is healthy' : 'Stock level is below minimum'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Edit Material</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
                  <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Min Stock</label>
                  <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} min="0" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit Cost (SAR)</label>
                  <input type="number" name="unitCost" value={formData.unitCost} onChange={handleChange} min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Location (Aisle-Rack-Shelf)</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Supplier</label>
                  <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Stock</label>
                  <input type="number" name="maxStock" value={formData.maxStock || ''} onChange={handleChange} min="0" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Safety Stock</label>
                  <input type="number" name="safetyStock" value={formData.safetyStock || ''} onChange={handleChange} min="0" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Selling Price (SAR)</label>
                  <input type="number" name="sellingPrice" value={formData.sellingPrice || ''} onChange={handleChange} min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                  <input type="number" name="taxRate" value={formData.taxRate || ''} onChange={handleChange} min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Batch Number</label>
                  <input type="text" name="batchNumber" value={formData.batchNumber} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Manufacturing Date</label>
                  <input type="date" name="manufacturingDate" value={formData.manufacturingDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expiration Date</label>
                  <input type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Serial Number</label>
                  <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </form>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isUpdating}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${isUpdating ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
