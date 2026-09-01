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
      { id: 'goods-receipt', label: 'Goods Receipt', description: 'Receive materials from supplier', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'hover:border-blue-300', path: '/inventory/goods-receipt' },
      { id: 'inbound-manifest', label: 'Inbound Manifest', description: 'Shipment verification & loading', icon: FileCheck, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'hover:border-indigo-300', path: '/inventory/manifest' }
    ]
  },
  {
    id: 'issuing',
    title: 'Issuing',
    description: 'Outbound materials and returns',
    icon: ArrowLeftRight,
    cards: [
      { id: 'picking-packing', label: 'Picking / Packing', description: 'Pick and issue to project/warehouse', icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'hover:border-purple-300', path: '/inventory/picking' },
      { id: 'return-to-vendor', label: 'Return to Vendor', description: 'Return defective/excess materials', icon: ArrowLeftRight, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'hover:border-rose-300', path: '/inventory/return-to-vendor' },
      { id: 'outbound-manifest', label: 'Outbound Manifest', description: 'Shipment dispatch & loading', icon: FileCheck, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'hover:border-cyan-300', path: '/inventory/manifest' }
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory Operations Hub</h1>
              <p className="text-sm text-gray-500">All inventory management tools organized by workflow</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {CATEGORIES.map(category => {
            const CategoryIcon = category.icon;
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.cards.map(card => {
                      const Icon = card.icon;
                      return (
                        <button
                          key={card.id}
                          onClick={() => navigate(card.path)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 ${card.borderColor} hover:shadow-md transition-all duration-200 text-left group`}
                        >
                          <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-6 h-6 ${card.color}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{card.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{card.description}</div>
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
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-lg shadow-blue-600/20"
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
