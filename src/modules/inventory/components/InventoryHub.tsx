import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Truck, ArrowLeftRight, FileCheck, AlertTriangle, CheckCircle,
  Settings, Building2, QrCode, DollarSign, Search, Plus, FileText, TrendingUp
} from 'lucide-react';

interface HubCard {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  path: string;
}

interface HubCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  cards: HubCard[];
}

const CATEGORIES: HubCategory[] = [
  {
    id: 'receiving',
    title: 'Receiving',
    description: 'Inbound materials and shipments',
    icon: Truck,
    cards: [
      { id: 'goods-receipt', label: 'Goods Receipt (GRN)', description: 'Receive materials from supplier', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'hover:border-blue-300', path: '/inventory/goods-receipt' },
      { id: 'inbound-manifest', label: 'Receiving Voucher / GRN', description: 'Shipment verification & dock intake', icon: FileCheck, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'hover:border-indigo-300', path: '/inventory/manifest' }
    ]
  },
  {
    id: 'issuing',
    title: 'Issuing',
    description: 'Outbound materials and returns',
    icon: ArrowLeftRight,
    cards: [
      { id: 'picking-packing', label: 'Picking / Packing', description: 'Pick and issue to project/warehouse', icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'hover:border-purple-300', path: '/inventory/picking' },
      { id: 'outbound-manifest', label: 'Delivery Note / Gate Pass', description: 'Vehicle loading, gate pass & delivery note', icon: FileCheck, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'hover:border-cyan-300', path: '/inventory/manifest' },
      { id: 'return-to-vendor', label: 'Return to Vendor', description: 'Return defective/excess materials', icon: ArrowLeftRight, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'hover:border-rose-300', path: '/inventory/return-to-vendor' }
    ]
  },
  {
    id: 'tracking',
    title: 'Tracking',
    description: 'Movements, batches, locations',
    icon: Search,
    cards: [
      { id: 'transfer-history', label: 'Transfer History', description: 'View stock transfers', icon: ArrowLeftRight, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'hover:border-blue-300', path: '/inventory/transfer-history' },
      { id: 'batch-lot', label: 'Batch / Lot Tracker', description: 'Track batch numbers and expiry', icon: FileCheck, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'hover:border-teal-300', path: '/inventory/batch-lot' },
      { id: 'zone-bin', label: 'Zone / Bin Tracking', description: 'Update storage location', icon: Building2, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'hover:border-indigo-300', path: '/inventory/zone-bin' },
      { id: 'reservation', label: 'Stock Reservation', description: 'Reserve stock for works', icon: CheckCircle, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'hover:border-purple-300', path: '/inventory/reservation' }
    ]
  },
  {
    id: 'quality',
    title: 'Quality',
    description: 'Counts, quarantine, reconciliation',
    icon: CheckCircle,
    cards: [
      { id: 'cycle-count', label: 'Cycle Count', description: 'Physical stock count & adjustment', icon: CheckCircle, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'hover:border-amber-300', path: '/inventory/cycle-count' },
      { id: 'quarantine', label: 'Quarantine / Hold', description: 'Flag material for quality review', icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'hover:border-yellow-300', path: '/inventory/quarantine' },
      { id: 'reconciliation', label: 'Reconciliation', description: 'Compare count vs system', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'hover:border-green-300', path: '/inventory/reconciliation' }
    ]
  },
  {
    id: 'reporting',
    title: 'Reporting',
    description: 'Quotations, invoices, payments, alerts',
    icon: FileText,
    cards: [
      { id: 'reports-center', label: 'Reports & Export Center', description: 'Centralized extraction & multi-format export', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'hover:border-blue-400', path: '/reports' },
      { id: 'quotations', label: 'Quotations', description: 'Create and manage quotations', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'hover:border-blue-300', path: '/inventory/quotations' },
      { id: 'proforma', label: 'Proforma Invoices', description: 'Create and manage proforma invoices', icon: FileText, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'hover:border-indigo-300', path: '/inventory/proforma' },
      { id: 'invoices', label: 'Invoices', description: 'Create and track tax invoices', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'hover:border-green-300', path: '/inventory/invoices' },
      { id: 'payments', label: 'Payments', description: 'Track payment collections', icon: TrendingUp, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'hover:border-teal-300', path: '/inventory/payments' },
      { id: 'stock-alerts', label: 'Stock Alerts', description: 'Low stock & threshold monitoring', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'hover:border-red-300', path: '/inventory/alerts' },
      { id: 'audit-trail', label: 'Audit Trail', description: 'Complete movement history', icon: FileCheck, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'hover:border-gray-300', path: '/inventory/audit-trail' },
      { id: 'valuation', label: 'Valuation Report', description: 'Stock value by warehouse', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'hover:border-emerald-300', path: '/inventory/valuation' }
    ]
  }
];

const InventoryHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Inventory Operations Hub</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SUITE ACTIVE
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">All inventory management tools organized by executive workflow</p>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {CATEGORIES.map(category => {
            const CategoryIcon = category.icon;
            return (
              <div key={category.id} className="bg-white dark:bg-[#131B2A] rounded-2xl shadow-sm border border-slate-200/90 dark:border-[#202C3F] overflow-hidden hover:shadow-md transition-all">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-[#202C3F]/80 bg-slate-50/70 dark:bg-[#182235]/60 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-[#0B0F17] border border-slate-800 dark:border-[#202C3F] flex items-center justify-center shadow-sm">
                      <CategoryIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{category.title}</h2>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{category.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-300/40 dark:border-slate-700">
                    {category.cards.length} tools
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.cards.map(card => {
                      const Icon = card.icon;
                      return (
                        <button
                          key={card.id}
                          onClick={() => navigate(card.path)}
                          className={`flex items-start gap-4 p-5 rounded-2xl border border-slate-200/90 dark:border-[#202C3F] bg-white dark:bg-[#0e1624] hover:bg-slate-50/50 dark:hover:bg-[#162134] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group`}
                        >
                          <div className={`w-12 h-12 p-2.5 rounded-xl ${card.bgColor} dark:bg-slate-800/90 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm border dark:border-slate-700/60`}>
                            <Icon className={`w-6 h-6 ${card.color} dark:text-emerald-400`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {card.label}
                            </div>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                              {card.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/scan')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 font-bold shadow-lg shadow-emerald-950/20"
          >
            <QrCode className="w-5 h-5" />
            Go to QR Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryHub;
