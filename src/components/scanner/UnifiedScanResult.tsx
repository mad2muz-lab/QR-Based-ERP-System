import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, User, Wrench, Package, Building, AlertTriangle, UserPlus, ArrowLeft, Search, X } from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

interface UnifiedScanResultProps {
  scanResult: any;
  onAction: (actionId: string, quantity?: number, destination?: any) => void;
  onBack: () => void;
  isProcessing?: boolean;
  sites?: any[];
  onNavigateToTransfer?: (materialId: string, destinationId?: string) => void;
  navigate?: (path: string) => void;
}

const UnifiedScanResult: React.FC<UnifiedScanResultProps> = ({ scanResult, onAction, onBack, isProcessing = false, sites = [], onNavigateToTransfer, navigate }) => {
  const [materialQuantity, setMaterialQuantity] = useState<number>(1);
  const [showQuantityInput, setShowQuantityInput] = useState<string | null>(null);
  const [showDestinationSelect, setShowDestinationSelect] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);

  // Search filter states
  const [actionSearchQuery, setActionSearchQuery] = useState('');
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');

  // Filter actions based on query
  const filteredActions = (scanResult?.actions || []).filter((action: any) => {
    if (!actionSearchQuery.trim()) return true;
    const q = actionSearchQuery.toLowerCase();
    return (
      action.label?.toLowerCase().includes(q) ||
      action.description?.toLowerCase().includes(q) ||
      action.id?.toLowerCase().includes(q)
    );
  });

  // Filter destination sites based on query
  const filteredSites = sites.filter((site: any) => {
    if (!destinationSearchQuery.trim()) return true;
    const q = destinationSearchQuery.toLowerCase();
    return (
      site.name?.toLowerCase().includes(q) ||
      site.province?.toLowerCase().includes(q) ||
      site.address?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isProcessing && showQuantityInput) {
      setShowQuantityInput(null);
    }
  }, [isProcessing, showQuantityInput]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked-in':
      case 'in-use':
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'clocked-out':
      case 'available':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'low-stock':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'out-of-stock':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'employee': return User;
      case 'equipment': return Wrench;
      case 'material': return Package;
      case 'site': return Building;
      default: return CheckCircle;
    }
  };

  const getEntityAccent = (type: string) => {
    switch (type) {
      case 'employee': return 'from-indigo-500 via-blue-500 to-cyan-500';
      case 'equipment': return 'from-emerald-500 via-teal-500 to-cyan-600';
      case 'material': return 'from-amber-500 via-orange-500 to-rose-500';
      case 'site': return 'from-fuchsia-500 via-purple-500 to-indigo-500';
      default: return 'from-slate-700 via-slate-800 to-slate-900';
    }
  };

  const getEntityIconBg = (type: string) => {
    switch (type) {
      case 'employee': return 'bg-indigo-50 text-indigo-600';
      case 'equipment': return 'bg-emerald-50 text-emerald-600';
      case 'material': return 'bg-amber-50 text-amber-600';
      case 'site': return 'bg-fuchsia-50 text-fuchsia-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === 'register-employee') {
      if (navigate) navigate('/admin?tab=employees');
      else window.location.hash = '#admin?tab=employees';
      return;
    }
    if (actionId === 'register-material') {
      if (navigate) navigate('/admin?tab=materials');
      else window.location.hash = '#admin?tab=materials';
      return;
    }
    if (actionId === 'transfer-material') {
      if (onNavigateToTransfer && scanResult.entity?.id) {
        onNavigateToTransfer(scanResult.entity.id, selectedDestination?.id);
      } else {
        setShowDestinationSelect(true);
      }
    } else if (actionId === 'material-in' || actionId === 'material-out') {
      setShowQuantityInput(actionId);
    } else {
      onAction(actionId);
    }
  };

  const handleDestinationSelect = (destination: any) => {
    setSelectedDestination(destination);
    setShowDestinationSelect(false);
    setShowQuantityInput('transfer-material');
  };

  const handleQuantitySubmit = (actionId: string) => {
    if (materialQuantity > 0) {
      onAction(actionId, materialQuantity, selectedDestination);
      setShowQuantityInput(null);
      setMaterialQuantity(1);
      setSelectedDestination(null);
    }
  };

  const EntityIcon = scanResult.icon || getEntityIcon(scanResult.type);
  const accent = getEntityAccent(scanResult.type);
  const iconBg = getEntityIconBg(scanResult.type);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scanner
      </button>

      {/* Unregistered employee */}
      {scanResult.type === 'unregistered_employee' ? (
        <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-rose-900">Employee Not Registered</h3>
              <p className="text-sm text-rose-700 mt-0.5 font-mono">{scanResult.entityId}</p>
              <p className="text-sm text-rose-800 mt-3">
                This employee ID is not registered in the system. They must be registered with personal information, department, and site allocation before clocking in/out.
              </p>
              <button
                onClick={() => handleActionClick('register-employee')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition"
              >
                <UserPlus className="w-4 h-4" />
                Register Employee
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Entity header banner */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent} text-white p-6 shadow-lg`}>
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <EntityIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{scanResult.type}</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{scanResult.entity.name}</h2>
                  <p className="text-sm text-white/80 mt-0.5">{scanResult.entity.site || scanResult.entity.position || '—'}</p>
                </div>
              </div>
              {scanResult.currentStatus && (
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 backdrop-blur text-white border border-white/20">
                  {scanResult.currentStatus.replace('-', ' ').toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Entity details */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-[#202C3F] bg-white dark:bg-[#131B2A] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#202C3F] bg-slate-50/50 dark:bg-[#182235]/60 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} dark:bg-slate-800 dark:text-emerald-400`}>
                <EntityIcon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Entity Specifications</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {scanResult.type === 'employee' && (
                <>
                  <DetailRow label="Department" value={scanResult.entity.department} />
                  <DetailRow label="Position" value={scanResult.entity.position} />
                  <DetailRow label="Employee ID" value={scanResult.entity.id} mono />
                  <DetailRow label="Status" value={scanResult.entity.status} capitalize />
                </>
              )}
              {scanResult.type === 'equipment' && (
                <>
                  <DetailRow label="Type" value={scanResult.entity.type} />
                  <DetailRow label="Model" value={scanResult.entity.model} />
                  <DetailRow label="Equipment ID" value={scanResult.entity.custom_equipment_id || scanResult.entity.id} mono />
                  <DetailRow label="Status" value={scanResult.entity.status} capitalize />
                </>
              )}
              {scanResult.type === 'material' && (
                <>
                  <DetailRow label="Type" value={scanResult.entity.type} />
                  <DetailRow label="Unit" value={scanResult.entity.unit} />
                  <DetailRow
                    label="Current Stock"
                    value={`${scanResult.entity.quantity} ${scanResult.entity.unit}`}
                    accent={scanResult.entity.quantity <= 0 ? 'text-rose-600 dark:text-rose-400' : scanResult.entity.quantity < 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
                    bold
                  />
                  <DetailRow label="Material ID" value={scanResult.entity.id} mono />
                </>
              )}
              {scanResult.type === 'site' && (
                <>
                  <DetailRow label="Province" value={scanResult.entity.province} />
                  <DetailRow label="Manager" value={scanResult.entity.manager} />
                  <div className="sm:col-span-2">
                    <DetailRow label="Address" value={scanResult.entity.address} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Current shift info */}
          {scanResult.type === 'employee' && scanResult.currentShift && (
            <div className={`rounded-2xl border p-5 shadow-sm ${
              scanResult.currentShift.isOvertime
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/60'
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800/60'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${scanResult.currentShift.isOvertime ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className={`font-bold ${scanResult.currentShift.isOvertime ? 'text-amber-900 dark:text-amber-200' : 'text-emerald-900 dark:text-emerald-200'}`}>Current Shift</h4>
                {scanResult.currentShift.isOvertime && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-semibold">OVERTIME</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Started</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{scanResult.currentShift.startTime.toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hours Worked</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{formatDuration(scanResult.currentShift.currentHours * 60)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Regular</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">8:00</p>
                </div>
                {scanResult.currentShift.isOvertime && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Overtime</p>
                    <p className="font-semibold text-amber-700 dark:text-amber-300 mt-0.5">{formatDuration((scanResult.currentShift.currentHours - 8) * 60)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-[#202C3F] bg-white dark:bg-[#131B2A] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#202C3F] bg-slate-50/50 dark:bg-[#182235]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Available Actions</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select an operational action for this scanned material</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search Bar across all available action items */}
                {!showDestinationSelect && !showQuantityInput && (
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      value={actionSearchQuery}
                      onChange={e => setActionSearchQuery(e.target.value)}
                      placeholder="Search action items..."
                      className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-[#0e1624] border border-slate-200 dark:border-[#202C3F] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                    />
                    {actionSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setActionSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <span className="hidden sm:inline-block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {filteredActions.length} of {scanResult.actions?.length || 0} Flows
                </span>
              </div>
            </div>
            <div className="p-6">
              {showDestinationSelect ? (
                <div className="rounded-xl border border-slate-200 dark:border-[#202C3F] bg-slate-50 dark:bg-[#0e1624] p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h5 className="font-semibold text-slate-900 dark:text-white mb-0.5">Select Destination</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Choose where to transfer this material.</p>
                    </div>
                    {/* Destination Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={destinationSearchQuery}
                        onChange={e => setDestinationSearchQuery(e.target.value)}
                        placeholder="Filter sites/warehouses..."
                        className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                      />
                      {destinationSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setDestinationSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredSites.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4 text-center">No destination facilities match your search query.</p>
                    ) : (
                      filteredSites.map((site: any) => (
                        <button
                          key={site.id}
                          onClick={() => handleDestinationSelect(site)}
                          className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-[#202C3F] bg-white dark:bg-[#131B2A] hover:bg-emerald-50/50 dark:hover:bg-[#182235] hover:border-emerald-500/40 transition flex items-center gap-3 shadow-sm"
                        >
                          <Building className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-sm">{site.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{site.province} • {site.address || 'Standard Location'}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowDestinationSelect(false);
                      setDestinationSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : showQuantityInput ? (
                <div className="rounded-xl border border-slate-200 dark:border-[#202C3F] bg-slate-50 dark:bg-[#0e1624] p-5">
                  <h5 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {showQuantityInput === 'material-in' ? 'Add to Inventory' : showQuantityInput === 'material-out' ? 'Issue from Inventory' : 'Transfer Material'}
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Enter the quantity to {showQuantityInput === 'material-in' ? 'add to' : showQuantityInput === 'material-out' ? 'remove from' : 'transfer'} stock.
                    {selectedDestination && (
                      <span className="block mt-1 text-emerald-600 dark:text-emerald-400">
                        Destination: {selectedDestination.name} ({selectedDestination.province})
                      </span>
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity ({scanResult.entity.unit})</label>
                      <input
                        type="number"
                        min="1"
                        value={materialQuantity}
                        onChange={(e) => setMaterialQuantity(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none"
                        placeholder="Enter quantity"
                      />
                    </div>
                    <button
                      onClick={() => handleQuantitySubmit(showQuantityInput)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition disabled:bg-slate-300 dark:disabled:bg-slate-800"
                    >
                      {isProcessing ? 'Processing…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowQuantityInput(null)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {filteredActions.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-[#202C3F]">
                      <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching action items found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try typing another keyword (e.g., "Transfer", "Receipt", "Quarantine", "Stock")</p>
                      <button
                        type="button"
                        onClick={() => setActionSearchQuery('')}
                        className="mt-3 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredActions.map((action: any) => {
                        const isMaterialIn = action.id === 'material-in';
                    const isMaterialOut = action.id === 'material-out';
                    const isDisabled = isMaterialOut && scanResult.entity.quantity <= 0;
                    return (
                      <button
                        key={action.id}
                        onClick={() => {
                          if (isDisabled) return;
                          handleActionClick(action.id);
                        }}
                        disabled={isDisabled}
                        className={`flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border transition-all duration-150 min-h-[120px] ${
                          isDisabled
                            ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/60 opacity-60 cursor-not-allowed text-slate-400'
                            : isMaterialIn
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-sm'
                            : isMaterialOut
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-sm'
                            : 'bg-white dark:bg-[#0e1624] border-slate-200/90 dark:border-[#202C3F] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-slate-50/60 dark:hover:bg-[#182235] shadow-sm'
                        }`}
                      >
                        {action.icon && (
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                            isMaterialIn
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                              : isMaterialOut
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            <action.icon className="w-5 h-5" />
                          </div>
                        )}
                        <span className="font-bold text-sm text-slate-900 dark:text-white text-center leading-snug">{action.label}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 text-center leading-snug line-clamp-2">{action.description}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )}
</div>
  );
};

const DetailRow: React.FC<{ label: string; value: any; mono?: boolean; bold?: boolean; capitalize?: boolean; accent?: string }> = ({ label, value, mono, bold, capitalize, accent }) => (
  <div>
    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
    <p className={`mt-0.5 ${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : 'font-medium'} ${capitalize ? 'capitalize' : ''} ${accent || 'text-slate-900 dark:text-white'}`}>
      {value || '—'}
    </p>
  </div>
);

export default UnifiedScanResult;