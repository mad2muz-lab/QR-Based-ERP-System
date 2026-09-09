import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Search, X, Package, ChevronDown } from 'lucide-react';
import { REGIONS, Warehouse, MaterialItem } from '../data/ksaData';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { OfflineDataManager } from '../../../utils/offlineDataManager';

const InterWarehouseTransfer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const materialId = searchParams.get('materialId');
  const preselectedWarehouseId = searchParams.get('warehouseId');

  const inventoryStorage = InventoryStorageService.getInstance();
  const warehouses = REGIONS.flatMap(r => r.warehouses);
  
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [sourceWarehouse, setSourceWarehouse] = useState<Warehouse | null>(null);
  const [destinationWarehouse, setDestinationWarehouse] = useState<Warehouse | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search & Combobox states for materials
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const materialDropdownRef = useRef<HTMLDivElement>(null);

  const allMaterials = inventoryStorage.getItems();

  const filteredMaterials = allMaterials.filter(item => {
    if (!materialSearchQuery) return true;
    const q = materialSearchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.type && item.type.toLowerCase().includes(q))
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(e.target as Node)) {
        setIsMaterialDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const items = inventoryStorage.getItems();
    
    if (materialId) {
      const material = items.find(m => m.id === materialId);
      if (material) {
        setSelectedMaterial(material);
        setMaterialSearchQuery(`${material.name} (${material.sku})`);
        const source = warehouses.find(w => w.id === material.warehouseId);
        setSourceWarehouse(source || null);
      }
    }

    if (preselectedWarehouseId) {
      const destination = warehouses.find(w => w.id === preselectedWarehouseId);
      setDestinationWarehouse(destination || null);
    }
  }, [materialId, preselectedWarehouseId]);

  const generateReference = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TRF-${year}${month}${day}-${random}`;
  };

  const handleSelectMaterial = (item: MaterialItem) => {
    setSelectedMaterial(item);
    setMaterialSearchQuery(`${item.name} (${item.sku})`);
    setIsMaterialDropdownOpen(false);
    const source = warehouses.find(w => w.id === item.warehouseId);
    setSourceWarehouse(source || null);
    setError(null);
  };

  const handleClearMaterial = () => {
    setSelectedMaterial(null);
    setMaterialSearchQuery('');
    setSourceWarehouse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !sourceWarehouse || !destinationWarehouse) {
      setError('Please select material, source, and destination warehouse');
      return;
    }
    if (sourceWarehouse.id === destinationWarehouse.id) {
      setError('Source and destination warehouses cannot be the same');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (quantity > selectedMaterial.quantity) {
      setError(`Insufficient stock. Available: ${selectedMaterial.quantity} ${selectedMaterial.unit}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const reference = generateReference();
      const transferNotes = `Inter-warehouse transfer | Ref: ${reference} | From: ${sourceWarehouse.name} | To: ${destinationWarehouse.name} | Date: ${transferDate} | ${notes}`;
      
      const now = new Date();
      const materialLogOut = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        materialType: selectedMaterial.type,
        action: 'material-out' as const,
        quantity,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        site: sourceWarehouse.name,
        status: selectedMaterial.status,
        notes: transferNotes,
        oldId: selectedMaterial.id
      };

      const materialLogIn = {
        ...materialLogOut,
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'material-in' as const,
        site: destinationWarehouse.name
      };

      await OfflineDataManager.createMaterialLog(materialLogOut);
      await OfflineDataManager.createMaterialLog(materialLogIn);

      const updatedMaterial = {
        ...selectedMaterial,
        warehouseId: destinationWarehouse.id,
        lastUpdated: new Date().toISOString()
      };
      inventoryStorage.updateItem(selectedMaterial.id, updatedMaterial);

      setSuccess(`✅ Transfer completed: ${quantity} ${selectedMaterial.unit} of ${selectedMaterial.name} moved from ${sourceWarehouse.name} to ${destinationWarehouse.name}`);
      setTimeout(() => {
        navigate('/scan');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] py-8 transition-colors duration-150">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-[#131B2A] rounded-2xl shadow-sm border border-slate-200/90 dark:border-[#202C3F] overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-[#202C3F] bg-slate-50/70 dark:bg-[#182235]/60">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/scan')}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Inter-Warehouse Transfer</h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    TRANSFER ENGINE
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Relocate materials between regional warehouses with live ledger updates</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-sm font-semibold">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Searchable Material Selector */}
              <div className="relative" ref={materialDropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Material to Transfer <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {allMaterials.length} items cataloged
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={materialSearchQuery}
                    onChange={e => {
                      setMaterialSearchQuery(e.target.value);
                      setIsMaterialDropdownOpen(true);
                      if (selectedMaterial && e.target.value !== `${selectedMaterial.name} (${selectedMaterial.sku})`) {
                        setSelectedMaterial(null);
                        setSourceWarehouse(null);
                      }
                    }}
                    onFocus={() => setIsMaterialDropdownOpen(true)}
                    placeholder="Search by material name, SKU, or category..."
                    className="w-full pl-10 pr-16 py-2.5 bg-white dark:bg-[#0e1624] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                    autoComplete="off"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {materialSearchQuery && (
                      <button
                        type="button"
                        onClick={handleClearMaterial}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dropdown Results List */}
                {isMaterialDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 max-h-64 overflow-y-auto bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] rounded-2xl shadow-xl z-50 divide-y divide-slate-100 dark:divide-[#202C3F]/60 animate-in fade-in slide-in-from-top-1 duration-150">
                    {filteredMaterials.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 font-medium">
                        No materials found matching "{materialSearchQuery}"
                      </div>
                    ) : (
                      filteredMaterials.map(m => {
                        const isSelected = selectedMaterial?.id === m.id;
                        const wh = warehouses.find(w => w.id === m.warehouseId);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectMaterial(m)}
                            className={`w-full text-left p-3.5 transition flex items-center justify-between gap-3 text-xs ${
                              isSelected
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-[#182235] text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {m.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="font-mono">{m.sku}</span>
                                  {m.category && <span>• {m.category}</span>}
                                  {wh && <span>• At: {wh.name}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-black text-sm text-slate-900 dark:text-white">
                                {m.quantity} {m.unit}
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                m.quantity <= 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : m.quantity < 50
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {m.quantity <= 0 ? 'Out of Stock' : m.quantity < 50 ? 'Low Stock' : 'In Stock'}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Selected Material Quick Badge */}
                {selectedMaterial && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">Selected:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{selectedMaterial.name} ({selectedMaterial.sku})</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 font-medium">
                      Available: <strong className="text-slate-900 dark:text-white">{selectedMaterial.quantity} {selectedMaterial.unit}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Source & Destination Warehouses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    From Warehouse (Source) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={sourceWarehouse?.id || ''}
                    onChange={e => {
                      const wh = warehouses.find(w => w.id === e.target.value);
                      setSourceWarehouse(wh || null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0e1624] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                    required
                  >
                    <option value="">Select source warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code}) - {w.city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    To Warehouse (Destination) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={destinationWarehouse?.id || ''}
                    onChange={e => {
                      const wh = warehouses.find(w => w.id === e.target.value);
                      setDestinationWarehouse(wh || null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0e1624] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                    required
                  >
                    <option value="">Select destination warehouse</option>
                    {warehouses.filter(w => w.id !== sourceWarehouse?.id).map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code}) - {w.city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity & Transfer Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Transfer Quantity <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={selectedMaterial?.quantity}
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0e1624] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                      required
                    />
                    {selectedMaterial && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                        {selectedMaterial.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Transfer Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={e => setTransferDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0e1624] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Transfer Reference #
                </label>
                <input
                  type="text"
                  value={generateReference()}
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#0e1624] border border-slate-200 dark:border-[#202C3F] rounded-xl text-sm font-mono text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Operational Notes & Reason
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Transfer notes, project site reason, gate pass reference, or special handling instructions..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0e1624] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#202C3F]">
              <button
                type="button"
                onClick={() => navigate('/scan')}
                className="px-4 py-2.5 border border-slate-300 dark:border-[#202C3F] text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedMaterial || !sourceWarehouse || !destinationWarehouse}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-md shadow-emerald-950/20 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Recording Movement...' : 'Confirm Inter-Warehouse Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterWarehouseTransfer;

