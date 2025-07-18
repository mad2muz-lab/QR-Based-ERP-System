import React, { useState, useEffect } from 'react';
import { DataStorage } from '../../utils/dataStorage';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { AuthManager } from '../../utils/authUtils';
import { Department } from '../../types';

const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedDept = departments.find((dept) => dept.id === selectedDeptId);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const useSupabase = await AuthManager.useSupabase();
      let loadedDepartments: Department[] = [];
      
      if (useSupabase) {
        // Load from Supabase
        loadedDepartments = await SupabaseDataService.getDepartments();
      } else {
        // Load from local storage
        loadedDepartments = DataStorage.loadDepartments();
      }
      
      setDepartments(loadedDepartments);
      
      // Set first department as selected if available
      if (loadedDepartments.length > 0 && !selectedDeptId) {
        setSelectedDeptId(loadedDepartments[0].id);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading departments...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
          <button 
            onClick={loadDepartments}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Departments</h2>
      
      {departments.length === 0 ? (
        <div className="bg-white border rounded-md p-8 min-h-[200px] flex items-center justify-center text-gray-500 italic">
          No departments found. Please add departments through the Admin Panel.
        </div>
      ) : (
        <>
          {/* Horizontal Tabs */}
          <div className="flex space-x-2 mb-6 overflow-x-auto">
            {departments.map((dept) => (
              <button
                key={dept.id}
                className={`px-4 py-2 rounded-t-md border-b-2 focus:outline-none transition-colors duration-150 whitespace-nowrap ${
                  selectedDeptId === dept.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-transparent hover:bg-blue-100'
                }`}
                onClick={() => setSelectedDeptId(dept.id)}
              >
                {dept.name}
              </button>
            ))}
          </div>
          
          {/* Department Details Placeholder */}
          <div className="bg-white border rounded-md p-8 min-h-[200px] flex items-center justify-center text-gray-500 italic">
            {selectedDept ? `${selectedDept.name} department details will appear here.` : 'Select a department.'}
          </div>
        </>
      )}
    </div>
  );
};

export default DepartmentsPage; 