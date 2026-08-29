import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  hours?: number; // Added hours
  km?: number; // Added km
}

interface PMConfig {
  id: string;
  equipment_type: string;
  maintenance_class: string;
  maintenance_type: string;
  interval_hours: number;
  interval_km: number;
  interval_days: number;
  description: string;
  checklist_items: string; // Changed to string to allow JSON or comma-separated
  spare_parts: string; // Changed to string to allow JSON or comma-separated
  uom: string; // Added uom
}

interface PMChecklistFormProps {
  equipment: Equipment;
  onComplete: (data: any) => void;
}

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  notes: string;
  photos: string[];
  timestamp: string;
}

const PMChecklistForm: React.FC<PMChecklistFormProps> = ({ equipment, onComplete }) => {
  const [pmConfigs, setPmConfigs] = useState<PMConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<PMConfig | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [spareParts, setSpareParts] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [totalDuration, setTotalDuration] = useState<string>("");
  const [maintenanceClass, setMaintenanceClass] = useState<string>("");
  const [equipmentHours, setEquipmentHours] = useState<number>(0);
  const [equipmentKm, setEquipmentKm] = useState<number>(0);

  // Update totalDuration when startTime or endTime changes
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs >= 0) {
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setTotalDuration(`${hours}h ${mins}m`);
      } else {
        setTotalDuration("");
      }
    } else {
      setTotalDuration("");
    }
  }, [startTime, endTime]);

  useEffect(() => {
    fetchPMConfigs();
  }, [equipment]);

  const fetchPMConfigs = async () => {
    if (!supabase) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('preventive_maintenance_configs')
        .select('*')
        .eq('equipment_type', equipment.type);

      if (error) throw error;
      setPmConfigs(data || []);
    } catch (err) {
      console.error('Error fetching PM configs:', err);
      setError('Failed to load PM configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSelect = async (config: PMConfig) => {
    setSelectedConfig(config);
    // Prepopulate PM log fields
    const now = new Date().toISOString();
    setStartTime(now);
    setEndTime(now);
    setMaintenanceClass(config.maintenance_class || "");
    setEquipmentHours(equipment.hours || 0);
    setEquipmentKm(equipment.km || 0);
    // Fetch checklist_items, spare_parts, and uom directly from config
    try {
      setLoading(true);
      // Parse checklist_items and spare_parts as arrays (handle JSON or comma-separated strings)
      let checklistArr: string[] = [];
      let partsArr: string[] = [];
      if (config.checklist_items) {
        if (typeof config.checklist_items === 'string') {
          try {
            checklistArr = JSON.parse(config.checklist_items);
            if (!Array.isArray(checklistArr)) checklistArr = config.checklist_items.split(',').map((s: string) => s.trim());
          } catch {
            checklistArr = config.checklist_items.split(',').map((s: string) => s.trim());
          }
        } else if (Array.isArray(config.checklist_items)) {
          checklistArr = config.checklist_items;
        }
      }
      if (config.spare_parts) {
        if (typeof config.spare_parts === 'string') {
          try {
            partsArr = JSON.parse(config.spare_parts);
            if (!Array.isArray(partsArr)) partsArr = config.spare_parts.split(',').map((s: string) => s.trim());
          } catch {
            partsArr = config.spare_parts.split(',').map((s: string) => s.trim());
          }
        } else if (Array.isArray(config.spare_parts)) {
          partsArr = config.spare_parts;
        }
      }
      const items: ChecklistItem[] = checklistArr.map((item: string, index: number) => ({
        id: `item-${index}`,
        task: item,
        completed: false,
        notes: '',
        photos: [],
        timestamp: new Date().toISOString()
      }));
      setChecklistItems(items);
      setSpareParts(partsArr);
      setCurrentStep(0);
    } catch (err) {
      console.error('Error processing checklist or spare parts:', err);
      setError('Failed to load checklist or spare parts for this configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

  const handleItemNotes = (itemId: string, notes: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, notes }
          : item
      )
    );
  };

  const handlePhotoUpload = async (itemId: string, file: File) => {
    if (!supabase) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `pm-photos/${equipment.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-photos')
        .getPublicUrl(filePath);

      setChecklistItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, photos: [...item.photos, publicUrl] }
            : item
        )
      );
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo');
    }
  };

  const handleNextStep = () => {
    if (currentStep < checklistItems.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const completedItems = checklistItems.filter(item => item.completed);
    const incompleteItems = checklistItems.filter(item => !item.completed);

    const checklistData = {
      equipment_id: equipment.id,
      maintenance_class: maintenanceClass,
      maintenance_type: "Preventive", // Assuming a default or derived value
      start_time: startTime,
      end_time: endTime,
      total_duration: totalDuration,
      equipment_hours: equipmentHours,
      equipment_km: equipmentKm,
      total_items: checklistItems.length,
      completed_items: completedItems.length,
      incomplete_items: incompleteItems.length,
      items: checklistItems,
      completed_at: new Date().toISOString(),
      has_issues: incompleteItems.length > 0
    };

    onComplete(checklistData);
  };

  const getProgressPercentage = () => {
    if (checklistItems.length === 0) return 0;
    return Math.round((currentStep + 1) / checklistItems.length * 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading PM configurations...</span>
        </div>
      </div>
    );
  }

  if (!selectedConfig) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Select PM Configuration</h2>
        <p className="text-gray-600 mb-4">Choose the type of preventive maintenance to perform:</p>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pmConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => handleConfigSelect(config)}
              className="text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-800 mb-2">{config.maintenance_class}</div>
              <div className="text-sm text-gray-600 mb-2">{config.description}</div>
              <div className="text-xs text-gray-500">
                Interval: {config.interval_days} days
                {config.interval_hours > 0 && ` • ${config.interval_hours} hours`}
                {config.interval_km > 0 && ` • ${config.interval_km} km`}
              </div>
            </button>
          ))}
        </div>

        {pmConfigs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No PM configurations found for {equipment.type}</p>
          </div>
        )}
      </div>
    );
  }

  if (checklistItems.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-gray-500">No checklist items found for this configuration.</p>
      </div>
    );
  }

  const currentItem = checklistItems[currentStep];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* PM Log Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            type="datetime-local"
            value={startTime ? startTime.substring(0, 16) : ''}
            onChange={e => setStartTime(new Date(e.target.value).toISOString())}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="datetime-local"
            value={endTime ? endTime.substring(0, 16) : ''}
            onChange={e => setEndTime(new Date(e.target.value).toISOString())}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Duration</label>
          <input
            type="text"
            value={totalDuration}
            readOnly
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Class</label>
          <input
            type="text"
            value={maintenanceClass}
            readOnly
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Hours</label>
          <input
            type="number"
            value={equipmentHours}
            onChange={e => setEquipmentHours(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipment KM</label>
          <input
            type="number"
            value={equipmentKm}
            onChange={e => setEquipmentKm(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">PM Checklist: {selectedConfig.maintenance_class}</h2>
        <p className="text-gray-600 mb-4">{equipment.name} • {equipment.type}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">Step {currentStep + 1} of {checklistItems.length} ({getProgressPercentage()}%)</p>
      </div>

      {/* Required Spare Parts */}
      {spareParts.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Required Spare Parts</h3>
          <ul className="list-disc list-inside text-gray-700">
            {spareParts.map((part, idx) => (
              <li key={idx}>{part}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Checklist Item */}
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-medium text-gray-800 text-lg">{currentItem.task}</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={currentItem.completed}
                onChange={() => handleItemToggle(currentItem.id)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Completed</span>
            </label>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes:</label>
            <textarea
              value={currentItem.notes}
              onChange={(e) => handleItemNotes(currentItem.id, e.target.value)}
              placeholder="Add any notes or observations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Photo Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photos:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(currentItem.id, file);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {currentItem.photos.length > 0 && (
              <div className="mt-2 flex gap-2">
                {currentItem.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 0}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {currentStep < checklistItems.length - 1 ? (
          <button
            onClick={handleNextStep}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Complete PM
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Checklist Summary:</h4>
        <div className="text-sm text-blue-700">
          <p>Completed: {checklistItems.filter(item => item.completed).length} / {checklistItems.length}</p>
          <p>Remaining: {checklistItems.filter(item => !item.completed).length} items</p>
        </div>
      </div>
    </div>
  );
};

export default PMChecklistForm; 