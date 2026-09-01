import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Equipment } from '../../types';
import CorrectiveMaintenanceForm from './CorrectiveMaintenanceForm';
import { supabase } from '../../utils/supabaseClient';
import { DataStorage } from '../../utils/dataStorage';

const DirectMaintenanceForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError('');
      
      const equipmentId = searchParams.get('equipment_id');
      if (!equipmentId) {
        setError('Equipment ID is required');
        setLoading(false);
        return;
      }

      // First try to find equipment in local storage
      const allEquipment = DataStorage.loadEquipment();
      let foundEquipment = allEquipment.find(eq => 
        eq.id === equipmentId || eq.custom_equipment_id === equipmentId
      );

      // If not found locally, fetch from Supabase
      if (!foundEquipment) {
        const { data, error: fetchError } = await supabase
          .from('equipment')
          .select('*')
          .eq('id', equipmentId)
          .single();

        if (fetchError || !data) {
          setError(`Equipment with ID ${equipmentId} not found`);
          setLoading(false);
          return;
        }

        // Normalize fields to match frontend Equipment interface
        foundEquipment = {
          id: data.id,
          custom_equipment_id: data.custom_equipment_id || data.customEquipmentId || '',
          name: data.name || '',
          type: data.type || '',
          model: data.model || '',
          site: data.site || '',
          qrCode: data.qr_code || data.qrCode || '',
          status: data.status || 'available',
          operational_status: data.operational_status || data.operationalStatus || 'working',
          createdAt: data.created_at || data.createdAt || '',
          lastUpdated: data.last_updated || data.lastUpdated || '',
          serialNumber: data.serial_number || data.serialNumber || '',
          oldId: data.old_id || data.oldId || '',
          companyId: data.company_id || data.companyId || '',
          costCenterCode: data.cost_center_code || data.costCenterCode || '',
          profitCenterCode: data.profit_center_code || data.profitCenterCode || '',
          hourly_rate: data.hourly_rate || 0,
        };
      }

      setEquipment(foundEquipment);
    } catch (error) {
      console.error('Error loading equipment:', error);
      setError('An unexpected error occurred while loading equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmitted = (request: any) => {
    console.log('Maintenance request submitted:', request);
    // Navigate back to maintenance page after form submission
    navigate('/maintenance');
  };

  const handleFormClose = () => {
    // Navigate back to maintenance page when form is closed
    navigate('/maintenance');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading equipment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Equipment Not Found</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => navigate('/maintenance')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go to Maintenance Page
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Equipment Not Found</h3>
            <p className="text-gray-600 mb-4">The requested equipment could not be found.</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => navigate('/maintenance')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go to Maintenance Page
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/maintenance')}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Maintenance</span>
          </button>
        </div>
      </div>

      {/* Corrective Maintenance Form */}
      <CorrectiveMaintenanceForm
        equipment={equipment}
        onClose={handleFormClose}
        onSubmitted={handleFormSubmitted}
      />
    </div>
  );
};

export default DirectMaintenanceForm; 