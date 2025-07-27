import { useState, useEffect } from 'react';
import { Material } from '../../../types';
import { DataStorage } from '../../../utils/dataStorage';
import { supabase } from '../../../utils/supabaseClient';

interface MaterialLogFormData {
  material_id: string;
  transaction_type: 'add' | 'remove';
  quantity: number;
}

export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialLogFormData, setMaterialLogFormData] = useState<MaterialLogFormData>({
    material_id: '',
    transaction_type: 'add',
    quantity: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadMaterials = async () => {
    try {
      const isSupabaseEnabled = localStorage.getItem('useSupabase') === 'true';
      
      if (isSupabaseEnabled) {
        const { data, error } = await supabase!
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setMaterials(data || []);
      } else {
        const localMaterials = DataStorage.loadMaterials();
        setMaterials(localMaterials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      alert(`Failed to load materials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLogMaterial = async (formData: MaterialLogFormData) => {
    if (!formData.material_id || formData.quantity <= 0) {
      throw new Error('Invalid input');
    }
    
    const material = materials.find(m => m.id === formData.material_id);
    if (!material) {
      throw new Error('Material not found');
    }
    
    if (formData.transaction_type === 'remove' && material.quantity < formData.quantity) {
      throw new Error('Insufficient quantity');
    }
    
    const isSupabaseEnabled = localStorage.getItem('useSupabase') === 'true';
    
    const logData = {
      material_id: formData.material_id,
      transaction_type: formData.transaction_type,
      quantity: formData.quantity,
      timestamp: new Date().toISOString(),
      notes: `Material ${formData.transaction_type} via Admin Panel`
    };
    
    try {
      if (isSupabaseEnabled) {
        const { error } = await supabase!
          .from('material_logs')
          .insert([logData]);
        
        if (error) throw error;
      } else {
        DataStorage.logMaterial(logData);
      }
    } catch (error) {
      console.error('Error logging material:', error);
      throw error;
    }
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await handleLogMaterial(materialLogFormData);
      await loadMaterials();
      setMaterialLogFormData({ material_id: '', transaction_type: 'add', quantity: 0 });
      alert('Material log created successfully!');
    } catch (error) {
      console.error('Error creating material log:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetMaterialLogForm = () => {
    setMaterialLogFormData({
      material_id: '',
      transaction_type: 'add',
      quantity: 0
    });
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  return {
    materials,
    materialLogFormData,
    setMaterialLogFormData,
    isLoading,
    loadMaterials,
    handleSubmitLog,
    resetMaterialLogForm
  };
};