import React, { useState, useEffect } from 'react';
import { supabase, testConnection, testAuthSetup, testDataRetrieval } from '../utils/supabaseClient';

const SupabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runConnectionTest = async () => {
    setLoading(true);
    try {
      const result = await testConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Test failed',
        error
      });
    }
    setLoading(false);
  };

  const runAuthTest = async () => {
    setLoading(true);
    try {
      const result = await testAuthSetup();
      setAuthStatus(result);
    } catch (error) {
      setAuthStatus({
        success: false,
        message: 'Auth test failed',
        error
      });
    }
    setLoading(false);
  };

  const runDataTest = async () => {
    setLoading(true);
    try {
      const result = await testDataRetrieval();
      setDataStatus(result);
    } catch (error) {
      setDataStatus({
        success: false,
        message: 'Data test failed',
        error
      });
    }
    setLoading(false);
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Supabase Connection Test</h2>
      
      {/* Environment Variables Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Environment Variables</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">VITE_SUPABASE_URL:</span>
            <span className={`ml-2 ${import.meta.env.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}`}>
              {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
            </span>
          </div>
          <div>
            <span className="font-medium">VITE_SUPABASE_ANON_KEY:</span>
            <span className={`ml-2 ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}`}>
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6 space-y-3">
        <button
          onClick={runConnectionTest}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Basic Connection
        </button>
        
        <button
          onClick={runAuthTest}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          Test Authentication
        </button>
        
        <button
          onClick={runDataTest}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 ml-2"
        >
          Test Data Retrieval
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {/* Connection Test Result */}
        {connectionStatus && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">
              {getStatusIcon(connectionStatus.success)} Connection Test
            </h4>
            <p className={`font-medium ${getStatusColor(connectionStatus.success)}`}>
              {connectionStatus.message}
            </p>
            {connectionStatus.error && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600">Error Details</summary>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(connectionStatus.error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Auth Test Result */}
        {authStatus && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">
              {getStatusIcon(authStatus.success)} Authentication Test
            </h4>
            <p className={`font-medium ${getStatusColor(authStatus.success)}`}>
              {authStatus.message}
            </p>
            {authStatus.data && (
              <div className="mt-2 text-sm text-gray-600">
                <pre>{JSON.stringify(authStatus.data, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Data Test Result */}
        {dataStatus && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">
              {getStatusIcon(dataStatus.success)} Data Retrieval Test
            </h4>
            <p className={`font-medium ${getStatusColor(dataStatus.success)}`}>
              {dataStatus.message}
            </p>
            {dataStatus.data && (
              <div className="mt-2 text-sm text-gray-600">
                <pre>{JSON.stringify(dataStatus.data, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      {!import.meta.env.VITE_SUPABASE_ANON_KEY && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Setup Required</h4>
          <p className="text-yellow-700 text-sm mb-3">
            To connect to Supabase, you need to create a `.env` file in the project root with your Supabase credentials.
          </p>
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Create a `.env` file with:</p>
            <pre className="mt-1 bg-yellow-100 p-2 rounded text-xs">
{`VITE_SUPABASE_URL=https://lzbvyptjirohluliiitp.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here`}
            </pre>
            <p className="mt-2">
              Get your anon key from your Supabase project dashboard under Settings → API
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseConnectionTest;
