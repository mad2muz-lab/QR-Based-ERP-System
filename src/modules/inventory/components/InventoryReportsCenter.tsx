import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, DollarSign,
  AlertTriangle, ArrowLeftRight, CheckCircle,
  Layers, Search, Building2, Eye
} from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { REGIONS, MaterialItem, StockMovement } from '../data/ksaData';

interface ReportChoice {
  id: string;
  title: string;
  category: 'valuation' | 'audit' | 'compliance' | 'discrepancy';
  description: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  formats: ('CSV' | 'Print' | 'View')[];
  viewPath?: string;
}

export const InventoryReportsCenter: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();

  const [items, setItems] = useState<MaterialItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'valuation' | 'audit' | 'compliance'>('all');

  useEffect(() => {
    setItems(inventoryStorage.getItems());
    setMovements(inventoryStorage.getMovements());
  }, []);

  const warehouses = REGIONS.flatMap(r => r.warehouses);
  const categories = Array.from(new Set(items.map(i => i.category)));

  // Filtered items based on user selection
  const filteredItems = items.filter(item => {
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouseId === selectedWarehouse;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesCategory && matchesSearch;
  });

  // Calculate high-level stats
  const totalStockValue = filteredItems.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);
  const lowStockCount = filteredItems.filter(i => i.quantity <= (i.reorderLevel || 0)).length;
  const outOfStockCount = filteredItems.filter(i => i.quantity === 0).length;

  // Helper download trigger
  const downloadCSV = (filename: string, dataRows: (string | number)[][]) => {
    const csvContent = dataRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export 1: Inventory Valuation CSV
  const exportValuationCSV = () => {
    const headers = ['SKU', 'Item Name', 'Category', 'Quantity On Hand', 'Unit Cost (SAR)', 'Total Valuation (SAR)', 'Facility / Warehouse', 'Status'];
    const rows = filteredItems.map(item => [
      item.sku,
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.quantity,
      item.unitCost.toFixed(2),
      (item.quantity * item.unitCost).toFixed(2),
      item.warehouseId,
      item.status
    ]);
    downloadCSV(`inventory-valuation-report-${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  // Export 2: Stock Movement Ledger CSV
  const exportMovementsCSV = () => {
    const headers = ['Reference ID', 'Item Name', 'SKU', 'Movement Type', 'Quantity', 'From Facility', 'To Facility', 'Timestamp', 'Operator'];
    const rows = movements.map(m => [
      m.reference,
      `"${m.itemName.replace(/"/g, '""')}"`,
      m.sku,
      m.type,
      m.quantity,
      m.fromLocation || 'N/A',
      m.toLocation || 'N/A',
      m.timestamp,
      m.performedBy
    ]);
    downloadCSV(`stock-movements-ledger-${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  // Export 3: Stock Alerts & Reorder Level CSV
  const exportStockAlertsCSV = () => {
    const alertItems = filteredItems.filter(i => i.quantity <= (i.reorderLevel || 0));
    const headers = ['SKU', 'Item Name', 'Category', 'Current Qty', 'Reorder Level', 'Deficit', 'Unit Cost (SAR)', 'Warehouse', 'Urgency'];
    const rows = alertItems.map(item => [
      item.sku,
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.quantity,
      item.reorderLevel || 0,
      Math.max(0, (item.reorderLevel || 0) - item.quantity),
      item.unitCost.toFixed(2),
      item.warehouseId,
      item.quantity === 0 ? 'CRITICAL - OUT OF STOCK' : 'WARNING - LOW STOCK'
    ]);
    downloadCSV(`stock-alerts-reorder-report-${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  // Export 4: Physical Count Blank Sheet CSV
  const exportCountSheetCSV = () => {
    const headers = ['SKU', 'Material Name', 'Warehouse Facility', 'Storage Zone/Bin', 'Book Quantity', 'Physical Count', 'Counted By', 'Notes / Discrepancy Reason'];
    const rows = filteredItems.map(item => [
      item.sku,
      `"${item.name.replace(/"/g, '""')}"`,
      item.warehouseId,
      item.location || 'Default Bin',
      item.quantity,
      '',
      '',
      ''
    ]);
    downloadCSV(`physical-cycle-count-sheet-${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  const REPORT_CHOICES: ReportChoice[] = [
    {
      id: 'valuation',
      title: 'Inventory Valuation Report',
      category: 'valuation',
      description: 'Total capitalized stock value across facilities with unit cost, category breakdown, and balance sheet valuations.',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: `SAR ${(totalStockValue / 1000).toFixed(1)}k Total`,
      formats: ['CSV', 'View'],
      viewPath: '/inventory/valuation'
    },
    {
      id: 'reconciliation',
      title: 'Physical Reconciliation & Discrepancies',
      category: 'discrepancy',
      description: 'Audit variance between physical stock takes and ERP book balances. Export physical count blank sheets for stocktakes.',
      icon: CheckCircle,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'Audit Ready',
      formats: ['CSV', 'View'],
      viewPath: '/inventory/reconciliation'
    },
    {
      id: 'movement',
      title: 'Stock Movement & Transaction Ledger',
      category: 'audit',
      description: 'Complete chronological audit log of all inbound goods receipts, outbound dispatches, and warehouse transfers.',
      icon: ArrowLeftRight,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badge: `${movements.length} Transactions`,
      formats: ['CSV', 'View'],
      viewPath: '/inventory/audit-trail'
    },
    {
      id: 'alerts',
      title: 'Stock Alerts & Reorder Level List',
      category: 'valuation',
      description: 'List of materials below safety thresholds, zero-inventory items, and replenishment order suggestions.',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: `${lowStockCount} Items Low`,
      formats: ['CSV', 'View'],
      viewPath: '/inventory/alerts'
    },
    {
      id: 'manifest',
      title: 'Delivery Notes & Receiving Vouchers',
      category: 'compliance',
      description: 'Official Delivery Notes, Gate Passes, and Inbound Goods Receiving Notes (GRN) across all facilities.',
      icon: FileText,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      badge: 'Printable Sheet',
      formats: ['Print', 'View'],
      viewPath: '/inventory/manifest'
    },
    {
      id: 'batch',
      title: 'Batch, Lot & Expiry Date Tracker',
      category: 'compliance',
      description: 'Supplier batches, production lots, and expiration dates with shelf-life risk alerts for perishable goods.',
      icon: Layers,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      badge: 'Traceability',
      formats: ['View'],
      viewPath: '/inventory/batch-lot'
    }
  ];

  const filteredReports = REPORT_CHOICES.filter(report => {
    if (activeTab === 'all') return true;
    return report.category === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0B0F17] py-8 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header Title Banner */}
        <div className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-slate-900 dark:bg-[#1E293B] border border-slate-800 dark:border-slate-700 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Inventory Reports Center
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                  LIVE STREAM ACTIVE
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Extract live inventory valuations, audit ledgers, variance logs, and reorder lists across all KSA facilities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={exportValuationCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Quick Export All (CSV)
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by SKU or item name..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Warehouse Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <select
                  value={selectedWarehouse}
                  onChange={e => setSelectedWarehouse(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Facilities ({warehouses.length} DCs)</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name} ({wh.city})</option>
                  ))}
                </select>
              </div>

              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3.5 bg-slate-50 dark:bg-[#0B0F17]/70 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Scoped Catalog</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{filteredItems.length} Materials</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-[#0B0F17]/70 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Valuation Total</span>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">SAR {totalStockValue.toLocaleString()}</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-[#0B0F17]/70 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Low Stock Breaches</span>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{lowStockCount} Items</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-[#0B0F17]/70 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Stockout (Zero)</span>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{outOfStockCount} Items</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'valuation', label: 'Valuation & Assets' },
            { id: 'discrepancy', label: 'Physical Reconciliation' },
            { id: 'audit', label: 'Movements & Ledger' },
            { id: 'compliance', label: 'Delivery Notes & GRN' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap shadow-sm ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                  : 'bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(report => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] hover:border-emerald-500/50 dark:hover:border-emerald-500/40 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform text-slate-700 dark:text-slate-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {report.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {report.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    <span>Formats:</span>
                    {report.formats.map(f => (
                      <span key={f} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Direct CSV triggers for immediate export */}
                    {report.id === 'valuation' && (
                      <button
                        onClick={exportValuationCSV}
                        title="Download CSV"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    {report.id === 'movement' && (
                      <button
                        onClick={exportMovementsCSV}
                        title="Download CSV"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    {report.id === 'alerts' && (
                      <button
                        onClick={exportStockAlertsCSV}
                        title="Download CSV"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    {report.id === 'reconciliation' && (
                      <button
                        onClick={exportCountSheetCSV}
                        title="Download Physical Count Sheet (CSV)"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    {report.viewPath && (
                      <button
                        onClick={() => navigate(report.viewPath!)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Open
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Data Table Preview */}
        <div className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Live Inventory Valuation Table Preview</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Showing live data based on your selected warehouse and category filters</p>
            </div>
            <button
              onClick={exportValuationCSV}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Export Filtered CSV
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50/90 dark:bg-[#0B0F17]/90 sticky top-0">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Material</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Facility</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Qty On Hand</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Unit Cost</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Total Valuation</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#131B2A] divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredItems.slice(0, 8).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-xs font-mono text-slate-400 dark:text-slate-500">{item.sku}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs font-medium">{item.category}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">{item.warehouseId}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{item.quantity.toLocaleString()} {item.unit}</td>
                    <td className="px-5 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">SAR {item.unitCost.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-black text-slate-900 dark:text-white">SAR {(item.quantity * item.unitCost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length > 8 && (
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing 8 of {filteredItems.length} records. Click "Export Filtered CSV" above for the complete dataset.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InventoryReportsCenter;
