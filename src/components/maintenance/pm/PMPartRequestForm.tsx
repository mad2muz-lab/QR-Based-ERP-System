import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
}

interface PMPartRequestFormProps {
  equipment: Equipment;
  onSubmit: (request: any) => void;
}

interface PartRequest {
  id: string;
  part_name: string;
  part_number: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  remarks: string;
  photos: string[];
  estimated_cost: number;
  requested_by: string;
  requested_at: string;
}

const PMPartRequestForm: React.FC<PMPartRequestFormProps> = ({ equipment, onSubmit }) => {
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [currentPart, setCurrentPart] = useState<PartRequest>({
    id: '',
    part_name: '',
    part_number: '',
    quantity: 1,
    priority: 'medium',
    remarks: '',
    photos: [],
    estimated_cost: 0,
    requested_by: '',
    requested_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Set default requested_by (in real app, this would be the current user)
    setCurrentPart(prev => ({
      ...prev,
      requested_by: 'Technician',
      requested_at: new Date().toISOString()
    }));
  }, []);

  const handleInputChange = (field: keyof PartRequest, value: any) => {
    setCurrentPart(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (file: File) => {
    if (!supabase) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `part-requests/${equipment.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-photos')
        .getPublicUrl(filePath);

      setCurrentPart(prev => ({
        ...prev,
        photos: [...prev.photos, publicUrl]
      }));
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo');
    }
  };

  const handleAddPart = () => {
    if (!currentPart.part_name.trim()) {
      setError('Part name is required');
      return;
    }

    const newPart: PartRequest = {
      ...currentPart,
      id: `part-${Date.now()}-${Math.random()}`
    };

    setPartRequests(prev => [...prev, newPart]);
    setCurrentPart({
      id: '',
      part_name: '',
      part_number: '',
      quantity: 1,
      priority: 'medium',
      remarks: '',
      photos: [],
      estimated_cost: 0,
      requested_by: 'Technician',
      requested_at: new Date().toISOString()
    });
    setShowAddForm(false);
    setError(null);
  };

  const handleRemovePart = (partId: string) => {
    setPartRequests(prev => prev.filter(part => part.id !== partId));
  };

  const handleSubmit = () => {
    if (partRequests.length === 0) {
      setError('Please add at least one part request');
      return;
    }

    const requestData = {
      equipment_id: equipment.id,
      equipment_name: equipment.name,
      parts: partRequests,
      total_parts: partRequests.length,
      total_estimated_cost: partRequests.reduce((sum, part) => sum + part.estimated_cost, 0),
      submitted_at: new Date().toISOString(),
      status: 'pending'
    };

    onSubmit(requestData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Part Request Form</h2>
        <p className="text-gray-600 mb-4">
          Request parts needed for {equipment.name} ({equipment.type})
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Current Parts List */}
      {partRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Requested Parts ({partRequests.length})</h3>
          <div className="space-y-3">
            {partRequests.map((part) => (
              <div key={part.id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-800">{part.part_name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(part.priority)}`}>
                        {part.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {part.part_number && <div>Part #: {part.part_number}</div>}
                      <div>Quantity: {part.quantity}</div>
                      {part.estimated_cost > 0 && <div>Est. Cost: ${part.estimated_cost.toFixed(2)}</div>}
                      {part.remarks && <div>Remarks: {part.remarks}</div>}
                    </div>
                    {part.photos.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {part.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Part photo ${index + 1}`}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemovePart(part.id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Part Form */}
      {showAddForm ? (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Add New Part</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Name *</label>
              <input
                type="text"
                value={currentPart.part_name}
                onChange={(e) => handleInputChange('part_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Oil Filter, Air Filter"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
              <input
                type="text"
                value={currentPart.part_number}
                onChange={(e) => handleInputChange('part_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., OF-12345"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={currentPart.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={currentPart.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={currentPart.estimated_cost}
                onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              value={currentPart.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Additional notes about the part request..."
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {currentPart.photos.length > 0 && (
              <div className="mt-2 flex gap-2">
                {currentPart.photos.map((photo, index) => (
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
          
          <div className="flex gap-3">
            <button
              onClick={handleAddPart}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Part
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Add Part Request
          </button>
        </div>
      )}

      {/* Summary */}
      {partRequests.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Request Summary:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>Total Parts: {partRequests.length}</p>
            <p>Total Estimated Cost: ${partRequests.reduce((sum, part) => sum + part.estimated_cost, 0).toFixed(2)}</p>
            <p>High Priority Items: {partRequests.filter(part => part.priority === 'high' || part.priority === 'urgent').length}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={partRequests.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Part Request
        </button>
        <button
          onClick={() => onSubmit({ skip: true })}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Skip Part Request
        </button>
      </div>
    </div>
  );
};

export default PMPartRequestForm; 