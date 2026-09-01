import React, { useState, useEffect } from 'react';
import { DataStorage } from '../utils/dataStorage';
import { SupabaseDataService } from '../utils/supabaseDataService';
import { AuthManager } from '../utils/authUtils';

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastUpdated: string;
  type?: string;
}

const DebugDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'local' | 'supabase' | 'unknown'>('unknown');

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
        console.log('🔍 Loading departments from Supabase...');
        loadedDepartments = await SupabaseDataService.getDepartments();
        setDataSource('supabase');
      } else {
        console.log('🔍 Loading departments from local storage...');
        loadedDepartments = DataStorage.loadDepartments();
        setDataSource('local');
      }
      
      console.log('📋 Loaded departments:', loadedDepartments);
      setDepartments(loadedDepartments);
      
    } catch (error) {
      console.error('❌ Error loading departments:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to local storage
      try {
        console.log('🔄 Falling back to local storage...');
        const localDepartments = DataStorage.loadDepartments();
        setDepartments(localDepartments);
        setDataSource('local');
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        setError('Both Supabase and local storage failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetDepartments = () => {
    console.log('🔄 Resetting departments...');
    const defaultDepartments: Department[] = [
      {
        id: 'dept-construction',
        name: 'Construction',
        description: 'Construction and building operations',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'dept-operations',
        name: 'Operations',
        description: 'Daily operations and maintenance',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'dept-maintenance',
        name: 'Maintenance',
        description: 'Equipment maintenance and repair services (PM/CM)',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'dept-engineering',
        name: 'Engineering',
        description: 'Engineering and technical services',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'dept-safety',
        name: 'Safety',
        description: 'Health, safety, and environmental',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'dept-procurement',
        name: 'Procurement',
        description: 'Material procurement and supply chain management',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'dept-finance',
        name: 'Finance',
        description: 'Financial management and accounting services',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'dept-logistics',
        name: 'Logistics',
        description: 'Transportation, warehousing, and supply chain logistics',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'dept-hr',
        name: 'Human Resources',
        description: 'Human resources management and employee services',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'dept-admin',
        name: 'Administration',
        description: 'Administrative and support services',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    ];
    
    DataStorage.saveDepartments(defaultDepartments);
    setDepartments(defaultDepartments);
    setDataSource('local');
    console.log('✅ Departments reset successfully');
  };

  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Debug Departments</h2>
      
      {/* Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Status</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Data Source:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              dataSource === 'supabase' ? 'bg-blue-100 text-blue-800' :
              dataSource === 'local' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {dataSource === 'supabase' ? 'Supabase' : 
               dataSource === 'local' ? 'Local Storage' : 'Unknown'}
            </span>
          </div>
          <div>
            <span className="font-medium">Departments Found:</span>
            <span className="ml-2 font-bold text-blue-600">{departments.length}</span>
          </div>
          {error && (
            <div className="text-red-600">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
        </div>
      </div>

      {/* Departments List */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Departments ({departments.length})</h3>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-red-600 font-medium">No departments found!</p>
            <p className="text-gray-600 text-sm mt-1">This is why you can't see your PM/CM work.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {departments.map((dept, index) => (
              <div key={index} className="p-3 bg-white border rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {dept.id}
                  </div>
                  <div>
                    <span className="font-medium">Name:</span> {dept.name}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Description:</span> {dept.description || 'No description'}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {dept.type || 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(dept.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {dept.name.toLowerCase() === 'maintenance' && (
                  <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded">
                    <p className="text-green-800 text-sm font-medium">
                      ✅ This department contains your PM/CM work!
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={loadDepartments}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Reload Departments'}
        </button>
        
        <button
          onClick={resetDepartments}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-2"
        >
          Reset to Default Departments
        </button>
        
        <button
          onClick={clearStorage}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-2"
        >
          Clear Storage & Reload
        </button>
      </div>

      {/* Instructions */}
      {departments.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">How to Fix This</h4>
          <div className="text-yellow-700 text-sm space-y-2">
            <p>1. <strong>Click "Reset to Default Departments"</strong> to restore the default department list</p>
            <p>2. <strong>Go to Departments page</strong> - you should now see all departments including Maintenance</p>
            <p>3. <strong>Click on Maintenance</strong> to access your PM/CM work</p>
            <p>4. <strong>Your PM/CM functionality</strong> is in the Maintenance department tab</p>
          </div>
        </div>
      )}

      {departments.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Next Steps</h4>
          <div className="text-green-700 text-sm space-y-2">
            <p>✅ <strong>Departments are loaded!</strong> You should now be able to access your PM/CM work.</p>
            <p>1. <strong>Go to the main Departments page</strong> (`/departments`)</p>
            <p>2. <strong>Click on "Maintenance" tab</strong> to see your PM/CM functionality</p>
            <p>3. <strong>Your PM work includes:</strong> PM Dashboard, Configuration, Workflow, and Enrollment</p>
            <p>4. <strong>Your CM work includes:</strong> Corrective maintenance logs and management</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugDepartments;
