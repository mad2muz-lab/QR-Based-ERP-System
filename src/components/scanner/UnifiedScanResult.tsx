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

  // Reset quantity input dialog when processing starts
  useEffect(() => {
    if (isProcessing && showQuantityInput) {
      console.log('🔄 Resetting quantity input dialog due to processing state');
      setShowQuantityInput(null);
    }
  }, [isProcessing, showQuantityInput]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked-in':
      case 'in-use':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'clocked-out':
      case 'available':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'employee':
        return User;
      case 'equipment':
        return Wrench;
      case 'material':
        return Package;
      case 'site':
        return Building;
      default:
        return CheckCircle;
    }
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === 'register-employee') {
      // Redirect to registration page
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
      console.log('📦 Submitting material action:', actionId, 'with quantity:', materialQuantity);
      onAction(actionId, materialQuantity);
      setShowQuantityInput(null);
      setMaterialQuantity(1);
    } else {
      console.warn('⚠️ Invalid quantity:', materialQuantity);
    }
  };

  const EntityIcon = scanResult.icon || getEntityIcon(scanResult.type);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scanner</span>
        </button>
      </div>
      
      {/* Unregistered Employee Handler */}
      {scanResult.type === 'unregistered_employee' && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 sm:p-6 rounded-t-xl border-2 border-red-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg shadow-sm">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-red-900">Employee Not Registered</h3>
                <p className="text-xs sm:text-sm text-red-700">Employee ID: {scanResult.entityId}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entity Header */}
      {scanResult.type !== 'unregistered_employee' && (
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 rounded-t-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-white rounded-lg shadow-sm">
              <EntityIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-bold text-gray-900">{scanResult.entity.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 capitalize">{scanResult.type} • {scanResult.entity.site}</p>
            </div>
          </div>
          
          {scanResult.currentStatus && (
            <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(scanResult.currentStatus)}`}> 
              {scanResult.currentStatus.replace('-', ' ').toUpperCase()}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Entity Details */}
      {scanResult.type !== 'unregistered_employee' && (
      <div className="px-2 sm:px-6">
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            {scanResult.type === 'employee' && (
              <>
                <div>
                  <span className="font-medium text-gray-700">Department:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.department}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.position}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Employee ID:</span>
                  <span className="ml-2 text-gray-600 font-mono">{scanResult.entity.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.status}</span>
                </div>
              </>
            )}
            
            {scanResult.type === 'equipment' && (
              <>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Model:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.model}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Equipment ID:</span>
                  <span className="ml-2 text-gray-600 font-mono">{scanResult.entity.custom_equipment_id || scanResult.entity.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.status}</span>
                </div>
              </>
            )}
            
            {scanResult.type === 'material' && (
              <>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Unit:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.unit}</span>
                </div>
                <div className="mb-4">
                  <span className="font-medium text-gray-700">Current Stock:</span>
                  <span className={`ml-2 text-gray-600 font-semibold ${scanResult.entity.quantity <= 0 ? 'text-red-600' : scanResult.entity.quantity < 50 ? 'text-yellow-600' : 'text-green-600'}`}>{scanResult.entity.quantity} {scanResult.entity.unit}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Material ID:</span>
                  <span className="ml-2 text-gray-600 font-mono">{scanResult.entity.id}</span>
                </div>
              </>
            )}
            
            {scanResult.type === 'site' && (
              <>
                <div>
                  <span className="font-medium text-gray-700">Province:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.province}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Manager:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.manager}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Address:</span>
                  <span className="ml-2 text-gray-600">{scanResult.entity.address}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Current Shift Info for Employees */}
      {scanResult.type === 'employee' && scanResult.currentShift && (
        <div className="px-2 sm:px-6">
          <div className={`p-3 sm:p-4 rounded-lg border-2 ${scanResult.currentShift.isOvertime ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}> 
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
              <Clock className={`w-5 h-5 ${scanResult.currentShift.isOvertime ? 'text-orange-600' : 'text-green-600'}`} />
              <h4 className={`font-semibold text-xs sm:text-base ${scanResult.currentShift.isOvertime ? 'text-orange-900' : 'text-green-900'}`}>Current Shift Status</h4>
              {scanResult.currentShift.isOvertime && (
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="font-medium text-gray-700">Shift Start:</span>
                <span className="ml-2 text-gray-600">{scanResult.currentShift.startTime.toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Hours Worked:</span>
                <span className="ml-2 text-gray-600 font-semibold">{formatDuration(scanResult.currentShift.currentHours * 60)}</span>
              </div>
              {scanResult.currentShift.isOvertime && (
                <>
                  <div>
                    <span className="font-medium text-gray-700">Regular Hours:</span>
                    <span className="ml-2 text-gray-600">8:00</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Overtime:</span>
                    <span className="ml-2 text-orange-600 font-semibold">{formatDuration((scanResult.currentShift.currentHours - 8) * 60)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unregistered Employee Message */}
      {scanResult.type === 'unregistered_employee' && (
        <div className="px-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Employee Registration Required</h4>
                <p className="text-red-800 text-sm mb-3">
                  The scanned Employee ID <code className="bg-red-100 px-1 rounded font-mono">{scanResult.entityId}</code> is not registered in the system.
                </p>
                <p className="text-red-700 text-sm">
                  Before this employee can clock in/out, they must be registered with their personal information, 
                  department assignment, and site allocation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Actions */}
      <div className="px-2 sm:px-6 pb-24 sm:pb-6"> {/* Extra bottom padding for mobile safe area */}
        <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">
          {scanResult.type === 'unregistered_employee' ? 'Required Action:' : 'Available Actions:'}
        </h4>
        
        {showQuantityInput ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h5 className="font-medium text-blue-900 mb-2 sm:mb-3 text-base sm:text-lg">
              {showQuantityInput === 'material-in' ? 'Add to Inventory' : 'Issue from Inventory'}
            </h5>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3">
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Quantity ({scanResult.entity.unit})</label>
                <input
                  type="number"
                  min="1"
                  value={materialQuantity}
                  onChange={(e) => setMaterialQuantity(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter quantity"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleQuantitySubmit(showQuantityInput)}
                  disabled={isProcessing}
                  className={`w-full sm:w-auto px-4 py-2 text-white rounded-lg transition-colors text-base font-semibold ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowQuantityInput(null)}
                  disabled={isProcessing}
                  className={`w-full sm:w-auto px-4 py-2 text-white rounded-lg transition-colors text-base font-semibold ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {scanResult.actions.map((action: any) => (
              <button
                key={action.id}
                onClick={() => {
                  if (action.id === 'material-out' && scanResult.entity.quantity <= 0) {
                    alert('Cannot issue material: Stock is zero. Please add inventory first.');
                    return;
                  }
                  handleActionClick(action.id);
                }}
                disabled={action.id === 'material-out' && scanResult.entity.quantity <= 0}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-lg font-semibold text-lg transition-colors
                  ${action.id === 'material-in' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                  ${action.id === 'material-out' ? (scanResult.entity.quantity <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white') : ''}
                  ${action.id !== 'material-in' && action.id !== 'material-out' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                `}
              >
                <span className="flex items-center space-x-3">
                  {action.icon && <action.icon className="w-6 h-6" />}
                  <span>{action.label}</span>
                </span>
                <span className="text-sm font-normal">{action.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedScanResult;