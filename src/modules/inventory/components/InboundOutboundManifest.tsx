import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Truck, Package, CheckCircle, X, FileText, Plus, 
  Building2, UserCheck, ShieldCheck, AlertTriangle, Printer, 
  ClipboardList, Hash, Calendar, Tag, Shield, Search, ChevronDown
} from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem, Warehouse } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';
import { CostProfitCenterService } from '../../../utils/costProfitCenterService';
import { CostCenter, ProfitCenter } from '../../../types';

export interface EnterpriseVoucherItem {
  materialId: string;
  materialName: string;
  sku: string;
  unit: string;
  orderedQty: number;
  receivedQty: number; // or dispatchedQty
  acceptedQty: number;
  rejectedQty: number;
  varianceDisposition?: 'partial_backorder' | 'short_closed' | 'over_delivery' | 'none';
  rejectionReason?: string;
  batchNumber?: string;
  expiryDate?: string;
  remarks?: string;
}

export interface EnterpriseVoucherRecord {
  id: string;
  voucherNumber: string;
  type: 'inbound' | 'outbound';
  date: string;
  time: string;
  timestamp: string;
  // Warehouse & Parties
  warehouseId: string;
  warehouseName: string;
  // GRN specific
  supplierName?: string;
  supplierInvoiceNo?: string;
  poNumber?: string;
  // GDN specific
  customerOrProject?: string;
  soOrRequisitionNo?: string;
  destinationSite?: string;
  contactPerson?: string;
  contactPhone?: string;
  // Financial
  costCenterCode?: string;
  profitCenterCode?: string;
  // Logistics
  carrierName?: string;
  vehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
  // Items & Status
  items: EnterpriseVoucherItem[];
  totalAccepted: number;
  totalRejected: number;
  status: 'approved' | 'partially_accepted' | 'rejected' | 'dispatched';
  // Sign-offs
  issuedBy: string;
  receivedOrCheckedBy: string;
  notes?: string;
}

const InboundOutboundManifest: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const [manifestType, setManifestType] = useState<'inbound' | 'outbound'>('inbound');
  const [manifestNumber, setManifestNumber] = useState('');
  
  // Master Lists
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [profitCenters, setProfitCenters] = useState<ProfitCenter[]>([]);

  // Header State
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  
  // GRN Specific Header
  const [supplierName, setSupplierName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');

  // GDN Specific Header
  const [customerOrProject, setCustomerOrProject] = useState('');
  const [soOrRequisitionNo, setSoOrRequisitionNo] = useState('');
  const [destinationSite, setDestinationSite] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Financial
  const [costCenterCode, setCostCenterCode] = useState('');
  const [profitCenterCode, setProfitCenterCode] = useState('');

  // Logistics
  const [carrierName, setCarrierName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Items State
  const [items, setItems] = useState<EnterpriseVoucherItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [orderedQty, setOrderedQty] = useState<number>(1);
  const [receivedQty, setReceivedQty] = useState<number>(1);
  const [acceptedQty, setAcceptedQty] = useState<number>(1);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>('Damaged in transit');
  const [itemVarianceDisposition, setItemVarianceDisposition] = useState<'partial_backorder' | 'short_closed' | 'over_delivery' | 'none'>('none');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [itemRemarks, setItemRemarks] = useState('');

  // Sign-off
  const [issuedBy, setIssuedBy] = useState('Store Officer');
  const [receivedOrCheckedBy, setReceivedOrCheckedBy] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Process states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<EnterpriseVoucherRecord | null>(null);
  // Search & Combobox states for materials
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const materialDropdownRef = useRef<HTMLDivElement>(null);

  const filteredMaterials = materials.filter(item => {
    if (!materialSearchQuery.trim()) return true;
    const q = materialSearchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q))
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

  // Load initial data
  useEffect(() => {
    const allItems = inventoryStorage.getItems();
    setMaterials(allItems);
    const allWarehouses = inventoryStorage.getWarehouses();
    setWarehouses(allWarehouses);
    if (allWarehouses.length > 0) {
      setSelectedWarehouseId(allWarehouses[0].id);
    }

    // Load Cost & Profit centers
    const loadCenters = async () => {
      try {
        const [ccRes, pcRes] = await Promise.all([
          CostProfitCenterService.getCostCenters(),
          CostProfitCenterService.getProfitCenters()
        ]);
        if (ccRes.success && ccRes.data && ccRes.data.length > 0) {
          setCostCenters(ccRes.data);
        } else {
          setCostCenters(CostProfitCenterService.getMockCostCenters());
        }

        if (pcRes.success && pcRes.data && pcRes.data.length > 0) {
          setProfitCenters(pcRes.data);
        } else {
          setProfitCenters(CostProfitCenterService.getMockProfitCenters());
        }
      } catch {
        setCostCenters(CostProfitCenterService.getMockCostCenters());
        setProfitCenters(CostProfitCenterService.getMockProfitCenters());
      }
    };
    loadCenters();
  }, []);

  const generateManifestNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${manifestType === 'inbound' ? 'GRN' : 'GDN'}-${year}${month}${day}-${random}`;
  };

  // Keep acceptedQty + rejectedQty synced to receivedQty for GRN
  const handleReceivedQtyChange = (val: number) => {
    setReceivedQty(val);
    if (manifestType === 'inbound') {
      setAcceptedQty(val);
      setRejectedQty(0);
    } else {
      setAcceptedQty(val);
      setRejectedQty(0);
    }
  };

  const handleAcceptedQtyChange = (val: number) => {
    const accepted = Math.max(0, val);
    setAcceptedQty(accepted);
    if (manifestType === 'inbound') {
      setRejectedQty(Math.max(0, receivedQty - accepted));
    }
  };

  const handleRejectedQtyChange = (val: number) => {
    const rejected = Math.max(0, val);
    setRejectedQty(rejected);
    if (manifestType === 'inbound') {
      setAcceptedQty(Math.max(0, receivedQty - rejected));
    }
  };

  const handleAddItem = () => {
    if (!selectedMaterial) return;

    const newItem: EnterpriseVoucherItem = {
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.name,
      sku: selectedMaterial.sku,
      unit: selectedMaterial.unit,
      orderedQty,
      receivedQty,
      acceptedQty,
      rejectedQty,
      varianceDisposition: receivedQty !== orderedQty ? itemVarianceDisposition : 'none',
      rejectionReason: rejectedQty > 0 ? rejectionReason : undefined,
      batchNumber: batchNumber || selectedMaterial.batchNumber,
      expiryDate: expiryDate || selectedMaterial.expirationDate,
      remarks: itemRemarks
    };

    setItems(prev => [...prev, newItem]);
    
    // Reset item form
    setSelectedMaterial(null);
    setOrderedQty(1);
    setReceivedQty(1);
    setAcceptedQty(1);
    setRejectedQty(0);
    setItemVarianceDisposition('none');
    setBatchNumber('');
    setExpiryDate('');
    setItemRemarks('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Please add at least one material item to the document');
      return;
    }

    const wh = warehouses.find(w => w.id === selectedWarehouseId);
    if (!wh) {
      setError('Please select a valid facility / warehouse');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const docNo = manifestNumber || generateManifestNumber();
      const docTypeLabel = manifestType === 'inbound' ? 'Goods Receipt Note (GRN)' : 'Goods Dispatch / Delivery Note (GDN)';
      const now = new Date();

      let totalAccepted = 0;
      let totalRejected = 0;

      for (const item of items) {
        totalAccepted += item.acceptedQty;
        totalRejected += item.rejectedQty;

        const material = inventoryStorage.getItemById(item.materialId);
        if (!material) continue;

        // Create detailed audit log entry
        const materialLog = {
          id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          materialId: item.materialId,
          materialName: item.materialName,
          materialType: material.type,
          action: manifestType === 'inbound' ? 'material-in' as const : 'material-out' as const,
          quantity: manifestType === 'inbound' ? item.acceptedQty : item.acceptedQty,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0],
          timestamp: now.toISOString(),
          site: wh.name,
          status: material.status,
          notes: `${docTypeLabel} #${docNo} | Ordered: ${item.orderedQty} | Accepted: ${item.acceptedQty}${item.rejectedQty > 0 ? ` (Rejected: ${item.rejectedQty} - ${item.rejectionReason})` : ''} | Carrier: ${carrierName || 'Self'} | Plate: ${vehiclePlate || 'N/A'}${costCenterCode ? ` | CC: ${costCenterCode}` : ''}${profitCenterCode ? ` | PC: ${profitCenterCode}` : ''}`,
          oldId: material.id
        };

        await OfflineDataManager.createMaterialLog(materialLog);

        // Update inventory stock based strictly on ACCEPTED quantities
        if (manifestType === 'inbound') {
          const updatedMaterial = {
            ...material,
            quantity: material.quantity + item.acceptedQty,
            lastUpdated: now.toISOString(),
            lastReceived: now.toISOString().split('T')[0]
          };
          inventoryStorage.updateItem(material.id, updatedMaterial);
        } else {
          // Outbound dispatch reduces stock by dispatched/accepted quantity
          const updatedMaterial = {
            ...material,
            quantity: Math.max(0, material.quantity - item.acceptedQty),
            lastUpdated: now.toISOString(),
            lastIssued: now.toISOString().split('T')[0]
          };
          inventoryStorage.updateItem(material.id, updatedMaterial);
        }
      }

      // Build full permanent enterprise voucher record
      const voucherRecord: EnterpriseVoucherRecord = {
        id: `vch-${Date.now()}`,
        voucherNumber: docNo,
        type: manifestType,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        warehouseId: wh.id,
        warehouseName: wh.name,
        // Inbound details
        supplierName: manifestType === 'inbound' ? supplierName : undefined,
        supplierInvoiceNo: manifestType === 'inbound' ? supplierInvoiceNo : undefined,
        poNumber: manifestType === 'inbound' ? poNumber : undefined,
        // Outbound details
        customerOrProject: manifestType === 'outbound' ? customerOrProject : undefined,
        soOrRequisitionNo: manifestType === 'outbound' ? soOrRequisitionNo : undefined,
        destinationSite: manifestType === 'outbound' ? destinationSite : undefined,
        contactPerson: manifestType === 'outbound' ? contactPerson : undefined,
        contactPhone: manifestType === 'outbound' ? contactPhone : undefined,
        // Financial
        costCenterCode: costCenterCode || undefined,
        profitCenterCode: profitCenterCode || undefined,
        // Logistics
        carrierName: carrierName || undefined,
        vehiclePlate: vehiclePlate || undefined,
        driverName: driverName || undefined,
        driverPhone: driverPhone || undefined,
        // Items
        items: [...items],
        totalAccepted,
        totalRejected,
        status: manifestType === 'outbound' ? 'dispatched' : (totalRejected > 0 ? 'partially_accepted' : 'approved'),
        issuedBy,
        receivedOrCheckedBy: receivedOrCheckedBy || (manifestType === 'inbound' ? 'Quality Inspector' : 'Driver / Receiver'),
        notes: generalNotes || undefined
      };

      // Store in erp_grn_gdn_records
      const existingRecords: EnterpriseVoucherRecord[] = JSON.parse(localStorage.getItem('erp_grn_gdn_records') || '[]');
      existingRecords.unshift(voucherRecord);
      localStorage.setItem('erp_grn_gdn_records', JSON.stringify(existingRecords));

      setSuccess(`✅ ${docTypeLabel} #${docNo} officially generated and stock ledger updated!`);
      setShowPrintModal(voucherRecord);

      // Clean up form
      setItems([]);
      setManifestNumber('');
      setSupplierName('');
      setPoNumber('');
      setSupplierInvoiceNo('');
      setCustomerOrProject('');
      setSoOrRequisitionNo('');
      setDestinationSite('');
      setCarrierName('');
      setVehiclePlate('');
      setDriverName('');
      setDriverPhone('');
      setGeneralNotes('');

    } catch (err: any) {
      setError(err.message || 'Processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#131B2A] rounded-2xl shadow-sm border border-slate-200/90 dark:border-[#202C3F] overflow-hidden">
          
          {/* Header Banner */}
          <div className="p-6 border-b border-slate-100 dark:border-[#202C3F] bg-slate-50/70 dark:bg-[#182235]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => navigate('/scan')} 
                className="p-2.5 rounded-xl bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {manifestType === 'inbound' ? 'Goods Receipt Note (GRN)' : 'Goods Dispatch / Delivery Note (GDN)'}
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    ENTERPRISE VOUCHER
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {manifestType === 'inbound' 
                    ? 'Inward physical receipt, quality acceptance/rejection, supplier invoice & PO tracking'
                    : 'Outward dispatch, customer site gate pass, transporter details & proof of delivery'}
                </p>
              </div>
            </div>

            {/* Document Type Switcher */}
            <div className="flex items-center bg-slate-200/80 dark:bg-[#0e1624] p-1 rounded-xl border border-slate-300/80 dark:border-[#202C3F]">
              <button
                type="button"
                onClick={() => setManifestType('inbound')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  manifestType === 'inbound'
                    ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                Inbound GRN
              </button>
              <button
                type="button"
                onClick={() => setManifestType('outbound')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  manifestType === 'outbound'
                    ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                Outbound GDN
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-medium text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
                {showPrintModal && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Voucher
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: HEADER & COMMERCIAL REFERENCES */}
            <div className="bg-slate-50/50 dark:bg-[#0e1624] border border-slate-200 dark:border-[#202C3F] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm border-b border-slate-200/80 dark:border-[#202C3F] pb-2">
                <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>1. Header & Commercial Order Reference</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Voucher / Reference #
                  </label>
                  <input
                    type="text"
                    value={manifestNumber}
                    onChange={e => setManifestNumber(e.target.value)}
                    placeholder={`Auto (${manifestType === 'inbound' ? 'GRN' : 'GDN'}-YYYYMMDD-xxxx)`}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {manifestType === 'inbound' ? 'Receiving Warehouse *' : 'Dispatching Warehouse *'}
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={e => setSelectedWarehouseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                    required
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name} ({wh.city})</option>
                    ))}
                  </select>
                </div>

                {manifestType === 'inbound' ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Supplier / Vendor Name *
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={e => setSupplierName(e.target.value)}
                      placeholder="e.g. Saudi Cement Co. / SABIC"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                      required={manifestType === 'inbound'}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Customer / Client Project *
                    </label>
                    <input
                      type="text"
                      value={customerOrProject}
                      onChange={e => setCustomerOrProject(e.target.value)}
                      placeholder="e.g. Riyadh Metro Project Site #4"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                      required={manifestType === 'outbound'}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {manifestType === 'inbound' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Purchase Order (PO) #
                      </label>
                      <input
                        type="text"
                        value={poNumber}
                        onChange={e => setPoNumber(e.target.value)}
                        placeholder="e.g. PO-2026-0842"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Supplier Delivery Note / Invoice #
                      </label>
                      <input
                        type="text"
                        value={supplierInvoiceNo}
                        onChange={e => setSupplierInvoiceNo(e.target.value)}
                        placeholder="e.g. INV-99421-KSA"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Sales Order / Requisition #
                      </label>
                      <input
                        type="text"
                        value={soOrRequisitionNo}
                        onChange={e => setSoOrRequisitionNo(e.target.value)}
                        placeholder="e.g. REQ-2026-102"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Destination Site / Address
                      </label>
                      <input
                        type="text"
                        value={destinationSite}
                        onChange={e => setDestinationSite(e.target.value)}
                        placeholder="e.g. Gate 3, King Fahd Road Site"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                      />
                    </div>
                  </>
                )}

                {/* Financial Allocation: Cost Center or Profit Center */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {manifestType === 'inbound' ? 'Cost Center (CC)' : 'Profit Center (PC)'}
                  </label>
                  {manifestType === 'inbound' ? (
                    <select
                      value={costCenterCode}
                      onChange={e => setCostCenterCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                    >
                      <option value="">Select Cost Center (optional)</option>
                      {costCenters.map(cc => (
                        <option key={cc.id} value={cc.code}>{cc.code} - {cc.name}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={profitCenterCode}
                      onChange={e => setProfitCenterCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                    >
                      <option value="">Select Profit Center (optional)</option>
                      {profitCenters.map(pc => (
                        <option key={pc.id} value={pc.code}>{pc.code} - {pc.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: LOGISTICS & TRANSPORTATION */}
            <div className="bg-slate-50/50 dark:bg-[#0e1624] border border-slate-200 dark:border-[#202C3F] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm border-b border-slate-200/80 dark:border-[#202C3F] pb-2">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Logistics, Carrier & Gate Pass Handover</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Carrier / Transporter
                  </label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={e => setCarrierName(e.target.value)}
                    placeholder="e.g. Al-Majdouie Logistics"
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Vehicle Plate # *
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value)}
                    placeholder="e.g. 8421-BBD"
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="e.g. Tariq Mansoor"
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Driver Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    placeholder="e.g. +966 50 123 4567"
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: LINE ITEMS & QUALITY INSPECTION */}
            <div className="border border-slate-200 dark:border-[#202C3F] rounded-2xl p-5 bg-slate-50/70 dark:bg-[#0e1624] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#202C3F] pb-2">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>3. Add Line Items & Quality Inspection</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {manifestType === 'inbound' ? 'Accepted qty updates physical stock balance' : 'Stock reduced upon dispatch'}
                </span>
              </div>

              {/* Add item control row */}
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-2 relative" ref={materialDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Material SKU / Name *</label>
                    <span className="text-[10px] text-slate-400 font-medium">{filteredMaterials.length} available</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={materialSearchQuery}
                      onChange={e => {
                        setMaterialSearchQuery(e.target.value);
                        setIsMaterialDropdownOpen(true);
                        if (selectedMaterial && e.target.value !== `${selectedMaterial.name} (${selectedMaterial.sku})`) {
                          setSelectedMaterial(null);
                        }
                      }}
                      onFocus={() => setIsMaterialDropdownOpen(true)}
                      placeholder="Search material name, SKU..."
                      className="w-full pl-9 pr-14 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none shadow-sm"
                      autoComplete="off"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {materialSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setMaterialSearchQuery('');
                            setSelectedMaterial(null);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMaterialDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {isMaterialDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-[#202C3F]/60">
                      {filteredMaterials.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No materials found matching "{materialSearchQuery}"
                        </div>
                      ) : (
                        filteredMaterials.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedMaterial(item);
                              setMaterialSearchQuery(`${item.name} (${item.sku})`);
                              setIsMaterialDropdownOpen(false);
                              if (item.batchNumber) setBatchNumber(item.batchNumber);
                              if (item.expirationDate) setExpiryDate(item.expirationDate);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-[#182235] transition ${
                              selectedMaterial?.id === item.id ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                              <div className="text-[10px] font-mono text-slate-400">{item.sku} • {item.category || item.type}</div>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                              {item.quantity} {item.unit}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ordered Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={orderedQty}
                    onChange={e => setOrderedQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {manifestType === 'inbound' ? 'Received Qty' : 'Dispatch Qty'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={receivedQty}
                    onChange={e => handleReceivedQtyChange(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Accepted Qty</label>
                  <input
                    type="number"
                    min="0"
                    max={receivedQty}
                    value={acceptedQty}
                    onChange={e => handleAcceptedQtyChange(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">Rejected Qty</label>
                  <input
                    type="number"
                    min="0"
                    max={receivedQty}
                    value={rejectedQty}
                    onChange={e => handleRejectedQtyChange(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-bold rounded-xl focus:ring-2 focus:ring-rose-500/20 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Real-time Ordered vs Received Discrepancy Alert */}
              {selectedMaterial && orderedQty > 0 && receivedQty !== orderedQty && (
                <div className={`p-3.5 rounded-xl border ${
                  receivedQty < orderedQty 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
                } space-y-2 text-xs`}>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${receivedQty < orderedQty ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold">
                          {receivedQty < orderedQty
                            ? `⚠️ Short Delivery Alert: Ordered ${orderedQty}, Received only ${receivedQty} (${orderedQty - receivedQty} units missing • -${Math.round(((orderedQty - receivedQty) / orderedQty) * 100)}% Variance)`
                            : `ℹ️ Over-Delivery: Received ${receivedQty} against ordered ${orderedQty} (+${receivedQty - orderedQty} units)`}
                        </span>
                        <span className="font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px]">
                          {Math.round((Math.abs(orderedQty - receivedQty) / orderedQty) * 100)}% Variance
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {manifestType === 'inbound' 
                          ? 'Specify variance disposition below for supplier PO balancing and backorder tracking.' 
                          : 'Variance between sales requisition and dispatched quantity recorded.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap text-[11px]">
                      Shortfall / Variance Disposition:
                    </label>
                    <select
                      value={itemVarianceDisposition}
                      onChange={e => setItemVarianceDisposition(e.target.value as any)}
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-[#131B2A] border border-amber-400/50 dark:border-amber-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                    >
                      <option value="none">-- Select Disposition --</option>
                      <option value="partial_backorder">📦 Partial Delivery - Supplier will ship remainder on backorder</option>
                      <option value="short_closed">❌ Short Shipped / Closed - Supplier cannot fulfill remainder (PO Adjusted)</option>
                      <option value="over_delivery">➕ Excess / Sample Units - Accepted extra delivery</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Extra specifications row: Batch, Rejection Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                {rejectedQty > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">Rejection Reason</label>
                    <select
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 bg-rose-50/40 dark:bg-[#131B2A] border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 rounded-xl text-xs outline-none"
                    >
                      <option value="Damaged in transit">Damaged in transit</option>
                      <option value="Packaging torn / broken seal">Packaging torn / broken seal</option>
                      <option value="Expired / near expiry">Expired / near expiry</option>
                      <option value="Non-conforming specification">Non-conforming specification</option>
                      <option value="Missing QC certification">Missing QC certification</option>
                      <option value="Wrong item delivered">Wrong item delivered</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Batch / Lot #</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={e => setBatchNumber(e.target.value)}
                    placeholder="e.g. BATCH-2026-081"
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedMaterial}
                    className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Voucher
                  </button>
                </div>
              </div>
            </div>

            {/* TABLE OF ADDED ITEMS */}
            {items.length > 0 && (
              <div className="overflow-x-auto border border-slate-200 dark:border-[#202C3F] rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-[#182235]">
                    <tr className="border-b border-slate-200 dark:border-[#202C3F] text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <th className="text-left py-3 px-4">Item & SKU</th>
                      <th className="text-center py-3 px-3">Ordered</th>
                      <th className="text-center py-3 px-3">{manifestType === 'inbound' ? 'Received' : 'Dispatched'}</th>
                      <th className="text-center py-3 px-3 text-emerald-600 dark:text-emerald-400">Accepted</th>
                      <th className="text-center py-3 px-3 text-rose-600 dark:text-rose-400">Rejected</th>
                      <th className="text-left py-3 px-3">Batch & Notes</th>
                      <th className="text-center py-3 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#202C3F]">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-[#182235]/50 text-xs">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.materialName}</div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{item.sku}</div>
                          {item.receivedQty < item.orderedQty && (
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              Shortfall: -{item.orderedQty - item.receivedQty} units {item.varianceDisposition === 'partial_backorder' ? '(Backorder)' : ''}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                          {item.orderedQty} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                          <div>{item.receivedQty} {item.unit}</div>
                          {item.receivedQty !== item.orderedQty && (
                            <div className={`text-[10px] ${item.receivedQty < item.orderedQty ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600'}`}>
                              ({Math.round(((item.receivedQty - item.orderedQty) / item.orderedQty) * 100)}%)
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                          {item.acceptedQty} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-700 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20">
                          {item.rejectedQty > 0 ? (
                            <span title={item.rejectionReason} className="cursor-help">
                              {item.rejectedQty} {item.unit} ⚠️
                            </span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {item.batchNumber && <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">{item.batchNumber}</span>}
                          {item.rejectionReason && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{item.rejectionReason}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem(index)} 
                            className="p-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 4: SIGN-OFFS & ACKNOWLEDGMENT */}
            <div className="bg-slate-50/50 dark:bg-[#0e1624] border border-slate-200 dark:border-[#202C3F] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm border-b border-slate-200/80 dark:border-[#202C3F] pb-2">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>4. Sign-offs, Proof of Delivery (POD) & Remarks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Issued / Prepared By
                  </label>
                  <input
                    type="text"
                    value={issuedBy}
                    onChange={e => setIssuedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {manifestType === 'inbound' ? 'Inspected & Received By' : 'Receiver / Driver Handover By'}
                  </label>
                  <input
                    type="text"
                    value={receivedOrCheckedBy}
                    onChange={e => setReceivedOrCheckedBy(e.target.value)}
                    placeholder={manifestType === 'inbound' ? 'QC Inspector Name' : 'Driver / Recipient Name'}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Voucher Remarks / Gate Notes
                  </label>
                  <input
                    type="text"
                    value={generalNotes}
                    onChange={e => setGeneralNotes(e.target.value)}
                    placeholder="e.g. Cleared at South Security Gate"
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#202C3F]">
              <button 
                type="button" 
                onClick={() => navigate('/scan')} 
                className="px-4 py-2.5 border border-slate-300 dark:border-[#202C3F] text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || items.length === 0} 
                className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-950/20 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-sm flex items-center gap-2"
              >
                {isSubmitting ? (
                  'Recording Ledger...'
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    {manifestType === 'inbound' ? 'Confirm Goods Receipt (GRN)' : 'Issue Delivery Note (GDN)'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PRINTABLE VOUCHER / PROOF OF DELIVERY MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131B2A] rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-[#202C3F] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {showPrintModal.type === 'inbound' ? 'GOODS RECEIPT NOTE (GRN)' : 'GOODS DISPATCH NOTE (GDN)'}
                </h2>
                <p className="text-xs font-mono text-emerald-600 font-bold">Doc #: {showPrintModal.voucherNumber}</p>
              </div>
              <button 
                onClick={() => setShowPrintModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voucher Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Facility / Warehouse:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{showPrintModal.warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Date & Time:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{showPrintModal.date} {showPrintModal.time}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  {showPrintModal.type === 'inbound' ? 'Supplier / PO #' : 'Client / SO #'}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {showPrintModal.type === 'inbound' 
                    ? `${showPrintModal.supplierName || 'N/A'} (PO: ${showPrintModal.poNumber || 'N/A'})`
                    : `${showPrintModal.customerOrProject || 'N/A'} (SO: ${showPrintModal.soOrRequisitionNo || 'N/A'})`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Carrier & Vehicle:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {showPrintModal.carrierName || 'Direct'} | Plate: {showPrintModal.vehiclePlate || 'N/A'}
                </span>
              </div>
              {showPrintModal.costCenterCode && (
                <div>
                  <span className="text-slate-400 block font-medium">Cost Center:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{showPrintModal.costCenterCode}</span>
                </div>
              )}
              {showPrintModal.profitCenterCode && (
                <div>
                  <span className="text-slate-400 block font-medium">Profit Center:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{showPrintModal.profitCenterCode}</span>
                </div>
              )}
            </div>

            {/* Items Summary */}
            <div className="border rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                  <tr>
                    <th className="py-2 px-3 text-left">Item</th>
                    <th className="py-2 px-2 text-center">Ordered</th>
                    <th className="py-2 px-2 text-center">Accepted</th>
                    <th className="py-2 px-2 text-center">Rejected</th>
                    <th className="py-2 px-3 text-left">Variance / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {showPrintModal.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <div className="font-semibold">{it.materialName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{it.sku}</div>
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600">{it.orderedQty} {it.unit}</td>
                      <td className="py-2 px-2 text-center font-bold text-emerald-600">{it.acceptedQty} {it.unit}</td>
                      <td className="py-2 px-2 text-center text-rose-600">{it.rejectedQty}</td>
                      <td className="py-2 px-3 text-[11px]">
                        {it.receivedQty < it.orderedQty ? (
                          <span className="text-amber-600 font-semibold">
                            Short: -{it.orderedQty - it.receivedQty} {it.varianceDisposition === 'partial_backorder' ? '(Backorder)' : ''}
                          </span>
                        ) : it.receivedQty > it.orderedQty ? (
                          <span className="text-blue-600 font-semibold">
                            Over: +{it.receivedQty - it.orderedQty}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Complete (100%)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sign-off Stamps */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t text-center text-xs">
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-800 dark:text-slate-100">{showPrintModal.issuedBy}</p>
                <p className="text-slate-400">Store Officer / Dispatcher</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-800 dark:text-slate-100">{showPrintModal.receivedOrCheckedBy}</p>
                <p className="text-slate-400">Receiver / Transporter Sign & Stamp</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-sm hover:bg-emerald-700"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
              <button
                onClick={() => setShowPrintModal(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboundOutboundManifest;
