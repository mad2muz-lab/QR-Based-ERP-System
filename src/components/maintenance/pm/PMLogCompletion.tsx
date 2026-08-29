import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
}

interface PMLogCompletionProps {
  equipment: Equipment;
  checklist: any;
  onComplete: (logData: any) => void;
}

interface CompletionData {
  maintenance_class: string;
  maintenance_type: string;
  scheduled_date: string;
  technician_id: string;
  technician_name: string;
  start_time: string;
  end_time: string;
  total_duration: number; // in minutes
  notes: string;
  issues_found: string;
  recommendations: string;
  digital_signature: string;
  invoice_upload: File | null;
  invoice_url: string;
  equipment_hours: number;
  equipment_km: number;
  next_pm_date: string;
}

const PMLogCompletion: React.FC<PMLogCompletionProps> = ({ equipment, checklist, onComplete }) => {
  const [completionData, setCompletionData] = useState<CompletionData>({
    maintenance_class: checklist?.maintenance_class || '',
    maintenance_type: checklist?.maintenance_type || '',
    scheduled_date: new Date().toISOString().split('T')[0],
    technician_id: '',
    technician_name: '',
    start_time: '',
    end_time: '',
    total_duration: 0,
    notes: '',
    issues_found: '',
    recommendations: '',
    digital_signature: '',
    invoice_upload: null,
    invoice_url: '',
    equipment_hours: 0,
    equipment_km: 0,
    next_pm_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Set default start time when component mounts
    setCompletionData(prev => ({
      ...prev,
      start_time: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
      end_time: new Date().toISOString().slice(0, 16)
    }));
  }, []);

  useEffect(() => {
    // Calculate duration when start/end times change
    if (completionData.start_time && completionData.end_time) {
      const start = new Date(completionData.start_time);
      const end = new Date(completionData.end_time);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
      setCompletionData(prev => ({
        ...prev,
        total_duration: duration > 0 ? duration : 0
      }));
    }
  }, [completionData.start_time, completionData.end_time]);

  const handleInputChange = (field: keyof CompletionData, value: any) => {
    setCompletionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInvoiceUpload = async (file: File) => {
    if (!supabase) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `pm-invoices/${equipment.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-photos')
        .getPublicUrl(filePath);

      setCompletionData(prev => ({
        ...prev,
        invoice_url: publicUrl,
        invoice_upload: file
      }));
    } catch (err) {
      console.error('Error uploading invoice:', err);
      setError('Failed to upload invoice');
    }
  };

  const handleSignatureStart = () => {
    setIsDrawing(true);
  };

  const handleSignatureMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !signatureCanvas) return;

    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = signatureCanvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleSignatureEnd = () => {
    setIsDrawing(false);
    if (signatureCanvas) {
      const signatureData = signatureCanvas.toDataURL();
      setCompletionData(prev => ({
        ...prev,
        digital_signature: signatureData
      }));
    }
  };

  const clearSignature = () => {
    if (signatureCanvas) {
      const ctx = signatureCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
      }
    }
    setCompletionData(prev => ({
      ...prev,
      digital_signature: ''
    }));
  };

  const calculateNextPMDate = () => {
    // This would typically use the PM config interval
    // For now, we'll add 30 days as a default
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    return nextDate.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!completionData.technician_name.trim()) {
      setError('Technician name is required');
      return;
    }

    if (!completionData.digital_signature) {
      setError('Digital signature is required');
      return;
    }

    try {
      setLoading(true);

      const logData = {
        equipment_id: equipment.id,
        maintenance_class: completionData.maintenance_class,
        maintenance_type: completionData.maintenance_type,
        scheduled_date: completionData.scheduled_date,
        completed_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        technician_id: completionData.technician_id || 'unknown',
        notes: completionData.notes,
        start_time: completionData.start_time,
        end_time: completionData.end_time,
        total_duration: completionData.total_duration,
        issues_found: completionData.issues_found,
        recommendations: completionData.recommendations,
        digital_signature: completionData.digital_signature,
        invoice_url: completionData.invoice_url,
        equipment_hours: completionData.equipment_hours,
        equipment_km: completionData.equipment_km,
        next_pm_date: calculateNextPMDate(),
        checklist_data: checklist,
        completed_at: new Date().toISOString()
      };

      onComplete(logData);
    } catch (err) {
      console.error('Error completing PM:', err);
      setError('Failed to complete PM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">PM Completion & Log</h2>
        <p className="text-gray-600 mb-4">
          Complete the preventive maintenance for {equipment.name} and log the results.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technician Name *</label>
            <input
              type="text"
              value={completionData.technician_name}
              onChange={(e) => handleInputChange('technician_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter technician name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Class</label>
            <input
              type="text"
              value={completionData.maintenance_class}
              onChange={(e) => handleInputChange('maintenance_class', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Type</label>
            <input
              type="text"
              value={completionData.maintenance_type}
              onChange={(e) => handleInputChange('maintenance_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
          </div>
        </div>

        {/* Time Tracking */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={completionData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="datetime-local"
              value={completionData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Duration</label>
            <input
              type="text"
              value={`${completionData.total_duration} minutes`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Equipment Usage */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Hours</label>
          <input
            type="number"
            min="0"
            value={completionData.equipment_hours}
            onChange={(e) => handleInputChange('equipment_hours', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Current hours"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipment KM</label>
          <input
            type="number"
            min="0"
            value={completionData.equipment_km}
            onChange={(e) => handleInputChange('equipment_km', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Current kilometers"
          />
        </div>
      </div>

      {/* Notes and Issues */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
          <textarea
            value={completionData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="General observations and notes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issues Found</label>
          <textarea
            value={completionData.issues_found}
            onChange={(e) => handleInputChange('issues_found', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Any issues or problems discovered during PM..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
          <textarea
            value={completionData.recommendations}
            onChange={(e) => handleInputChange('recommendations', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Recommendations for future maintenance..."
          />
        </div>
      </div>

      {/* Digital Signature */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature *</label>
        <div className="border border-gray-300 rounded-lg p-4">
          <canvas
            ref={(canvas) => setSignatureCanvas(canvas)}
            width={400}
            height={150}
            className="border border-gray-200 rounded cursor-crosshair"
            onMouseDown={handleSignatureStart}
            onMouseMove={handleSignatureMove}
            onMouseUp={handleSignatureEnd}
            onMouseLeave={handleSignatureEnd}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={clearSignature}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear Signature
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Upload */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Upload (Optional)</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleInvoiceUpload(file);
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {completionData.invoice_url && (
          <p className="text-sm text-green-600 mt-1">✓ Invoice uploaded successfully</p>
        )}
      </div>

      {/* Checklist Summary */}
      {checklist && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Checklist Summary:</h4>
          <div className="text-sm text-blue-700">
            <p>Total Items: {checklist.total_items || 0}</p>
            <p>Completed: {checklist.completed_items || 0}</p>
            <p>Issues Found: {checklist.incomplete_items || 0}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={loading || !completionData.technician_name || !completionData.digital_signature}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Completing...' : 'Complete PM & Save Log'}
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default PMLogCompletion; 