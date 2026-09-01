import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Calendar, MapPin, Package, User } from 'lucide-react';
import { DataStorage } from '../../../utils/dataStorage';
import { MaterialLog } from '../../types';

type FilterType = 'all' | 'material-in' | 'material-out' | 'transfer';

const TransferHistory: React.FC = () => {
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<MaterialLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const allLogs = DataStorage.loadMaterialLogs();
    setLogs(allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  useEffect(() => {
    let result = logs;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.materialName.toLowerCase().includes(q) ||
        log.materialId.toLowerCase().includes(q) ||
        log.notes?.toLowerCase().includes(q) ||
        log.site.toLowerCase().includes(q)
      );
    }

    if (filterType !== 'all') {
      result = result.filter(log => log.action === filterType);
    }

    if (dateFrom) {
      result = result.filter(log => log.date >= dateFrom);
    }

    if (dateTo) {
      result = result.filter(log => log.date <= dateTo);
    }

    setFilteredLogs(result);
  }, [logs, searchQuery, filterType, dateFrom, dateTo]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'material-in': return 'bg-green-100 text-green-800';
      case 'material-out': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'material-in': return 'Material In';
      case 'material-out': return 'Material Out';
      default: return 'Transfer';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Transfer History</h1>
                <p className="text-sm text-gray-500">View all material movements and transfers</p>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search material, ID, notes..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value as FilterType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                <option value="all">All Actions</option>
                <option value="material-in">Material In</option>
                <option value="material-out">Material Out</option>
                <option value="transfer">Transfer</option>
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
            </div>
          </div>

          <div className="p-6">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No transfer history found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map(log => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="font-semibold text-gray-900">{log.materialName}</span>
                          <span className="text-sm text-gray-500">({log.materialId})</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span>Qty: {log.quantity}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{log.site}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{log.date} {log.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>System</span>
                          </div>
                        </div>
                        {log.notes && (
                          <div className="mt-2 text-sm text-gray-500 bg-gray-50 rounded p-2">
                            <FileText className="w-3 h-3 inline mr-1" />
                            {log.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferHistory;

