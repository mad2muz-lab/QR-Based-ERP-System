import React from 'react';
import { MaterialItem } from '../data/ksaData';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';

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
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <div>
            <h3 className="font-semibold text-slate-900">Low Stock Alerts</h3>
            <p className="text-sm text-slate-500">
              {criticalItems.length + lowItems.length} items need attention
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {alertPercent}% of inventory
        </div>
      </div>
      
      {criticalItems.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-rose-800">Out of Stock ({criticalItems.length})</span>
          </div>
          <div className="space-y-1">
            {criticalItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-rose-50 rounded-md text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-rose-800">{item.name}</p>
                  <p className="text-xs text-rose-600">{item.sku}</p>
                </div>
                <span className="text-xs font-medium text-rose-600">0 {item.unit}</span>
              </div>
            ))}
            {criticalItems.length > 5 && (
              <div className="text-center text-xs text-rose-500 italic pt-2">
                and {criticalItems.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}

      {lowItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-amber-800">Low Stock ({lowItems.length})</span>
          </div>
          <div className="space-y-1">
            {lowItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-md text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-800">{item.name}</p>
                  <p className="text-xs text-amber-600">{item.sku}</p>
                </div>
                <span className="text-xs font-medium text-amber-600">
                  {item.quantity} {item.unit} (min: {item.minStock})
                </span>
              </div>
            ))}
            {lowItems.length > 5 && (
              <div className="text-center text-xs text-amber-500 italic pt-2">
                and {lowItems.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}

      {(criticalItems.length + lowItems.length) === 0 && (
        <div className="text-center py-6">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">All items are adequately stocked</p>
        </div>
      )}
    </div>
  );
};