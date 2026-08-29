import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, User, Wrench, Package, Building, AlertTriangle, UserPlus, ArrowLeft } from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

interface UnifiedScanResultProps {
  scanResult: any;
  onAction: (actionId: string, quantity?: number) => void;
  onBack: () => void;
  isProcessing?: boolean;
}

const UnifiedScanResult: React.FC<UnifiedScanResultProps> = ({ scanResult, onAction, onBack, isProcessing = false }) => {
  const [materialQuantity, setMaterialQuantity] = useState<number>(1);
  const [showQuantityInput, setShowQuantityInput] = useState<string | null>(null);

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
      window.location.hash = '#register';
      return;
    }
    if (actionId === 'material-in' || actionId === 'material-out') {
      setShowQuantityInput(actionId);
    } else {
      onAction(actionId);
    }
  };

  const handleQuantitySubmit = (actionId: string) => {
    if (materialQuantity > 0) {
      onAction(actionId, materialQuantity);
      setShowQuantityInput(null);
      setMaterialQuantity(1);
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
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                <EntityIcon className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900">Details</h3>
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
                    accent={scanResult.entity.quantity <= 0 ? 'text-rose-600' : scanResult.entity.quantity < 50 ? 'text-amber-600' : 'text-emerald-600'}
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
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${scanResult.currentShift.isOvertime ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className={`font-bold ${scanResult.currentShift.isOvertime ? 'text-amber-900' : 'text-emerald-900'}`}>Current Shift</h4>
                {scanResult.currentShift.isOvertime && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-semibold">OVERTIME</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Started</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{scanResult.currentShift.startTime.toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Hours Worked</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{formatDuration(scanResult.currentShift.currentHours * 60)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Regular</p>
                  <p className="font-semibold text-slate-900 mt-0.5">8:00</p>
                </div>
                {scanResult.currentShift.isOvertime && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Overtime</p>
                    <p className="font-semibold text-amber-700 mt-0.5">{formatDuration((scanResult.currentShift.currentHours - 8) * 60)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h4 className="font-semibold text-slate-900">Available Actions</h4>
              <p className="text-xs text-slate-500 mt-0.5">Choose an action to perform on this {scanResult.type}</p>
            </div>
            <div className="p-6">
              {showQuantityInput ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h5 className="font-semibold text-slate-900 mb-1">
                    {showQuantityInput === 'material-in' ? 'Add to Inventory' : 'Issue from Inventory'}
                  </h5>
                  <p className="text-xs text-slate-500 mb-4">Enter the quantity to {showQuantityInput === 'material-in' ? 'add to' : 'remove from'} stock.</p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Quantity ({scanResult.entity.unit})</label>
                      <input
                        type="number"
                        min="1"
                        value={materialQuantity}
                        onChange={(e) => setMaterialQuantity(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                        placeholder="Enter quantity"
                      />
                    </div>
                    <button
                      onClick={() => handleQuantitySubmit(showQuantityInput)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition disabled:bg-slate-300"
                    >
                      {isProcessing ? 'Processing…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowQuantityInput(null)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanResult.actions.map((action: any) => {
                    const isMaterialIn = action.id === 'material-in';
                    const isMaterialOut = action.id === 'material-out';
                    const isDisabled = isMaterialOut && scanResult.entity.quantity <= 0;
                    const gradient = isMaterialIn
                      ? 'from-emerald-500 to-teal-600 hover:shadow-emerald-500/30'
                      : isMaterialOut
                      ? isDisabled
                        ? 'from-slate-200 to-slate-300 cursor-not-allowed'
                        : 'from-amber-500 to-orange-600 hover:shadow-amber-500/30'
                      : 'from-slate-700 to-slate-900 hover:shadow-slate-900/30';
                    return (
                      <button
                        key={action.id}
                        onClick={() => {
                          if (isDisabled) return;
                          handleActionClick(action.id);
                        }}
                        disabled={isDisabled}
                        className={`group w-full flex items-center justify-between px-5 py-4 rounded-xl font-semibold text-white transition-all bg-gradient-to-r shadow-sm hover:shadow-lg ${gradient}`}
                      >
                        <span className="flex items-center gap-3">
                          {action.icon && <action.icon className="w-5 h-5" />}
                          <span>{action.label}</span>
                        </span>
                        <span className="text-xs font-normal text-white/80 hidden sm:inline">{action.description}</span>
                      </button>
                    );
                  })}
                </div>
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
    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`mt-0.5 ${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : 'font-medium'} ${capitalize ? 'capitalize' : ''} ${accent || 'text-slate-900'}`}>
      {value || '—'}
    </p>
  </div>
);

export default UnifiedScanResult;