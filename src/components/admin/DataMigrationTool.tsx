import React, { useState } from 'react';
import { migrateDataToSupabase } from '../../utils/dataMigrationUtils';
import { Database, AlertCircle, CheckCircle, ArrowUpFromLine } from 'lucide-react';

const DataMigrationTool: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    details?: any;
  }>({ loading: false });

  const handleMigration = async () => {
    if (window.confirm('Are you sure you want to migrate all local data to Supabase? This operation cannot be undone.')) {
      setMigrationStatus({ loading: true });
      const result = await migrateDataToSupabase();
      setMigrationStatus({
        loading: false,
        success: result.success,
        message: result.message,
        details: result.details
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <Database className="w-6 h-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold">Data Migration Tool</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        This tool will migrate all your local data to Supabase. Make sure you have set up your Supabase
        database and are authenticated before proceeding.
      </p>
      
      {migrationStatus.message && (
        <div className={`mb-6 p-4 ${migrationStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg flex items-start space-x-3`}>
          {migrationStatus.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          )}
          <div>
            <p className={`${migrationStatus.success ? 'text-green-800' : 'text-red-800'} text-sm font-medium`}>
              {migrationStatus.message}
            </p>
            {migrationStatus.success && migrationStatus.details && (
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                <li>Users: {migrationStatus.details.users}</li>
                <li>Employees: {migrationStatus.details.employees}</li>
                <li>Equipment: {migrationStatus.details.equipment}</li>
                <li>Materials: {migrationStatus.details.materials}</li>
                <li>Sites: {migrationStatus.details.sites}</li>
                <li>Time Logs: {migrationStatus.details.timeLogs}</li>
              </ul>
            )}
          </div>
        </div>
      )}
      
      <button
        onClick={handleMigration}
        disabled={migrationStatus.loading}
        className="flex items-center justify-center w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {migrationStatus.loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Migrating Data...
          </>
        ) : (
          <>
            <ArrowUpFromLine className="w-5 h-5 mr-2" />
            Migrate Data to Supabase
          </>
        )}
      </button>
    </div>
  );
};

export default DataMigrationTool;