import React, { useState } from 'react';
import { StockMovement } from '../data/ksaData';
import { X, Package, ArrowDown, ArrowUp, RefreshCw, Edit, RotateCcw, Search } from 'lucide-react';

interface StockMovementLogProps {
  movements: StockMovement[];
  onClose: () => void;
}

export const StockMovementLog: React.FC<StockMovementLogProps> = ({ movements, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredMovements = movements.filter(movement => {
    const matchesQuery = searchQuery === '' || 
      movement.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.reference.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || movement.type === filterType;
    
    return matchesQuery && matchesType;
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'received': return <ArrowUp className="w-4 h-4 text-emerald-600" />;
      case 'issued': return <ArrowDown className="w-4 h-4 text-rose-600" />;
      case 'transferred': return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'adjusted': return <Edit className="w-4 h-4 text-amber-600" />;
      case 'returned': return <RotateCcw className="w-4 h-4 text-violet-600" />;
      default: return <Package className="w-4 h-4 text-slate-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'received': return 'bg-emerald-100 text-emerald-800';
      case 'issued': return 'bg-rose-100 text-rose-800';
      case 'transferred': return 'bg-blue-100 text-blue-800';
      case 'adjusted': return 'bg-amber-100 text-amber-800';
      case 'returned': return 'bg-violet-100 text-violet-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const movementTypes = [
    { value: 'all', label: 'All' },
    { value: 'received', label: 'Received' },
    { value: 'issued', label: 'Issued' },
    { value: 'transferred', label: 'Transferred' },
    { value: 'adjusted', label: 'Adjusted' },
    { value: 'returned', label: 'Returned' }
  ];

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl h-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stock Movement Log</h2>
            <p className="text-sm text-slate-500 mt-1">
              {filteredMovements.length} movements {searchQuery && `(filtered from ${movements.length})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by item name, SKU, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-1">
            {movementTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Movements List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No movements found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMovements.map(movement => (
                <div 
                  key={movement.id} 
                  className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getMovementIcon(movement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getMovementColor(movement.type)}`}>
                        {movement.type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity} units
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{movement.itemName}</span> 
                      <span className="text-slate-500 ml-1.5">({movement.sku})</span>
                    </p>
                    {movement.fromLocation && (
                      <p className="text-xs text-slate-500">
                        From: <span className="font-medium">{movement.fromLocation}</span>
                      </p>
                    )}
                    {movement.toLocation && (
                      <p className="text-xs text-slate-500">
                        To: <span className="font-medium">{movement.toLocation}</span>
                      </p>
                    )}
                    {movement.notes && (
                      <p className="text-xs text-slate-500 italic mt-1">
                        Note: {movement.notes}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>By {movement.performedBy}</span>
                      <span>{new Date(movement.timestamp).toLocaleString('en-SA')}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Ref: {movement.reference}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

