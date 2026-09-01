import React from 'react';
import { MaterialItem } from '../data/ksaData';
import { AlertTriangle, TrendingDown, Package, CheckCircle } from 'lucide-react';

interface LowStockAlertsProps {
  items: MaterialItem[];
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ items }) => {
  const criticalItems = items.filter(item => item.status === 'out_of_stock');
  const lowItems = items.filter(item => item.status === 'low_stock');
  const total = items.length;
  const alertPercent = Math.round(((criticalItems.length + lowItems.length) / total) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-rose-100 text-rose-800';
      case 'low_stock': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Low Stock Alerts</h3>
            <p className="text-base text-gray-600 font-medium">
              {criticalItems.length + lowItems.length} items need attention
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-700 font-semibold">
          {alertPercent}% of inventory
        </div>
      </div>
      
      {criticalItems.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-rose-800 text-base">Out of Stock ({criticalItems.length})</span>
          </div>
          <div className="space-y-2">
            {criticalItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-rose-50 rounded-xl text-base">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-rose-900">{item.name}</p>
                  <p className="text-sm text-rose-700 font-medium">{item.sku}</p>
                </div>
                <span className="text-sm font-semibold text-rose-700">0 {item.unit}</span>
              </div>
            ))}
            {criticalItems.length > 5 && (
              <div className="text-center text-sm text-rose-600 font-medium pt-2">
                and {criticalItems.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}

      {lowItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-amber-800 text-base">Low Stock ({lowItems.length})</span>
          </div>
          <div className="space-y-2">
            {lowItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-amber-50 rounded-xl text-base">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-900">{item.name}</p>
                  <p className="text-sm text-amber-700 font-medium">{item.sku}</p>
                </div>
                <span className="text-sm font-semibold text-amber-700">
                  {item.quantity} {item.unit} (min: {item.minStock})
                </span>
              </div>
            ))}
            {lowItems.length > 5 && (
              <div className="text-center text-sm text-amber-600 font-medium pt-2">
                and {lowItems.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}

      {(criticalItems.length + lowItems.length) === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-800">All items are adequately stocked</p>
        </div>
      )}
    </div>
  );
};

