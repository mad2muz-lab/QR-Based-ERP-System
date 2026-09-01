import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { CustomUnitManager } from '../../utils/customUnitManager';
import { UNITS_OF_MEASUREMENT } from '../../types/constants';

interface UnitManagementProps {
  className?: string;
}

export default function UnitManagement({ className = '' }: UnitManagementProps) {
  const [standardUnits, setStandardUnits] = useState<string[]>([]);
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [newUnitInput, setNewUnitInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = () => {
    setStandardUnits([...UNITS_OF_MEASUREMENT]);
    setCustomUnits(CustomUnitManager.getCustomUnits());
  };

  const handleAddUnit = () => {
    if (!newUnitInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter a unit name' });
      return;
    }

    if (CustomUnitManager.addCustomUnit(newUnitInput.trim())) {
      setMessage({ type: 'success', text: `Unit "${newUnitInput.trim()}" added successfully` });
      setNewUnitInput('');
      setShowAddForm(false);
      loadUnits();
    } else {
      setMessage({ type: 'error', text: `Unit "${newUnitInput.trim()}" already exists` });
    }
  };

  const handleRemoveUnit = (unitName: string) => {
    if (window.confirm(`Are you sure you want to remove the unit "${unitName}"?`)) {
      if (CustomUnitManager.removeCustomUnit(unitName)) {
        setMessage({ type: 'success', text: `Unit "${unitName}" removed successfully` });
        loadUnits();
      } else {
        setMessage({ type: 'error', text: `Failed to remove unit "${unitName}"` });
      }
    }
  };

  const handleClearAllCustomUnits = () => {
    if (window.confirm('Are you sure you want to remove all custom units? This action cannot be undone.')) {
      CustomUnitManager.clearCustomUnits();
      setMessage({ type: 'success', text: 'All custom units cleared successfully' });
      loadUnits();
    }
  };

  const handleExportUnits = () => {
    const exportData = {
      standardUnits: standardUnits,
      customUnits: customUnits,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `units_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: 'Units exported successfully' });
  };

  const handleImportUnits = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.customUnits && Array.isArray(data.customUnits)) {
          // Clear existing custom units and import new ones
          CustomUnitManager.clearCustomUnits();
          data.customUnits.forEach((unit: string) => {
            CustomUnitManager.addCustomUnit(unit);
          });
          setMessage({ type: 'success', text: `${data.customUnits.length} custom units imported successfully` });
          loadUnits();
        } else {
          setMessage({ type: 'error', text: 'Invalid file format' });
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to parse import file' });
      }
    };
    reader.readAsText(file);
  };

  const clearMessage = () => {
    setMessage(null);
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(clearMessage, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Unit Management</h2>
            <p className="text-sm text-gray-600">Manage units of measurement for materials</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadUnits}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh units"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}

      {/* Standard Units */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Standard Units</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {standardUnits.map((unit) => (
            <div
              key={unit}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <span className="text-sm font-medium text-gray-700">{unit}</span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Standard</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Units */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Custom Units</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportUnits}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
            <label className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 cursor-pointer">
              <Upload className="w-3 h-3" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportUnits}
                className="hidden"
              />
            </label>
            {customUnits.length > 0 && (
              <button
                onClick={handleClearAllCustomUnits}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {customUnits.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No custom units defined</p>
            <p className="text-sm text-gray-400 mt-1">Add custom units to extend the available options</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {customUnits.map((unit) => (
              <div
                key={unit}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <span className="text-sm font-medium text-blue-700">{unit}</span>
                <button
                  onClick={() => handleRemoveUnit(unit)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title={`Remove ${unit}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Unit */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Add Custom Unit</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>{showAddForm ? 'Cancel' : 'Add Unit'}</span>
          </button>
        </div>

        {showAddForm && (
          <div className="flex space-x-2">
            <input
              type="text"
              value={newUnitInput}
              onChange={(e) => setNewUnitInput(e.target.value)}
              placeholder="Enter unit name (e.g., Cartridges, Boxes, etc.)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddUnit()}
            />
            <button
              onClick={handleAddUnit}
              disabled={!newUnitInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Units:</span>
            <span className="font-medium ml-1">{standardUnits.length + customUnits.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Standard Units:</span>
            <span className="font-medium ml-1">{standardUnits.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Custom Units:</span>
            <span className="font-medium ml-1">{customUnits.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Available for Materials:</span>
            <span className="font-medium ml-1 text-green-600">Yes</span>
          </div>
        </div>
      </div>
    </div>
  );
} 