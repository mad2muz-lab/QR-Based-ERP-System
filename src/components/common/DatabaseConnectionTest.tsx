import React, { useState, useEffect } from 'react';
import { testConnection, testDataInsertion, testDataRetrieval, testAuthSetup } from '../../utils/supabaseClient';
import { AlertCircle, CheckCircle, Database, RefreshCw, Save, List, Shield } from 'lucide-react';
import { AuthManager } from '../../utils/authUtils';
import UnauthorizedAccess from './UnauthorizedAccess';

const DatabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    data?: any;
  }>({
    loading: true
  });

  const [authStatus, setAuthStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    data?: any;
  }>({
    loading: false
  });
  const [insertionStatus, setInsertionStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    data?: any;
  }>({
    loading: false
  });

  const [retrievalStatus, setRetrievalStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    data?: any;
  }>({
    loading: false
  });

  // Check if user has admin access
  const hasAdminAccess = AuthManager.hasPermission('admin');
  
  if (!hasAdminAccess) {
    return <UnauthorizedAccess requiredRole="admin" />;
  }

  useEffect(() => {
    checkConnection();
    // Delay auth check to ensure connection is established first
    if (connectionStatus.success) {
      setTimeout(() => {
        checkAuth();
      }, 1000);
    }
  }, []);

  // When connection status changes to success, check auth
  useEffect(() => {
    if (connectionStatus.success) {
      setTimeout(() => {
        checkAuth();
      }, 1000);
    }
  }, [connectionStatus.success]);

  const checkConnection = async () => {
    setConnectionStatus({ loading: true });
    const result = await testConnection();
    setConnectionStatus({
      loading: false,
      success: result.success,
      message: result.message,
      data: result.data
    });
  };

  const checkAuth = async () => {
    setAuthStatus({ loading: true });
    const result = await testAuthSetup();
    setAuthStatus({
      loading: false,
      success: result.success,
      message: result.message,
      data: result.data
    });
  };
  const insertTestData = async () => {
    setInsertionStatus({ loading: true });
    const result = await testDataInsertion();
    setInsertionStatus({
      loading: false,
      success: result.success,
      message: result.message,
      data: result.data
    });
    
    // Refresh data retrieval if insertion was successful
    if (result.success) {
      retrieveData();
    }
  };

  const retrieveData = async () => {
    setRetrievalStatus({ loading: true });
    const result = await testDataRetrieval();
    setRetrievalStatus({
      loading: false,
      success: result.success,
      message: result.message,
      data: result.data
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Database Connection Test</h2>
      </div>

      {/* Connection Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Connection Status</h3>
          <button
            onClick={checkConnection}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className={`p-4 rounded-lg border ${
          connectionStatus.loading ? 'bg-gray-50 border-gray-200' :
          connectionStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {connectionStatus.loading ? (
              <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
            ) : connectionStatus.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className={`font-medium ${
                connectionStatus.loading ? 'text-gray-700' :
                connectionStatus.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {connectionStatus.loading ? 'Checking connection...' : connectionStatus.message}
              </p>
              {!connectionStatus.loading && !connectionStatus.success && (
                <p className="text-sm text-red-600 mt-1">
                  Make sure you've connected to Supabase and set up your environment variables.
                </p>
              )}
              {!connectionStatus.loading && connectionStatus.success && (
                <p className="text-sm text-green-600 mt-1">
                  Your application is successfully connected to Supabase!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Status */}
      {connectionStatus.success && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Authentication Status</h3>
            <button
              onClick={checkAuth}
              className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Auth</span>
            </button>
          </div>

          <div className={`p-4 rounded-lg border ${
            authStatus.loading ? 'bg-gray-50 border-gray-200' :
            authStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-3">
              {authStatus.loading ? (
                <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
              ) : authStatus.success ? (
                <Shield className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${
                  authStatus.loading ? 'text-gray-700' :
                  authStatus.success ? 'text-green-800' : 'text-red-800'
                }`}> 
                  {authStatus.loading ? 'Checking authentication...' : authStatus.message}
                </p>
                {authStatus.data && (
                  <p className="text-sm text-gray-600 mt-1">
                    {authStatus.data.authenticated ? 
                      `Signed in as: ${authStatus.data.user?.email}` : 
                      'Using anonymous access - sign in for full functionality'
                    }
                  </p>
                )}
                {!authStatus.success && !authStatus.loading && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                    <p>To fix this issue:</p>
                    <ol className="list-decimal list-inside mt-1 ml-2 space-y-1">
                      <li>Make sure you've connected to Supabase using the "Connect to Supabase" button</li>
                      <li>Refresh the page after connecting to load the environment variables</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Data Operations */}
      {connectionStatus.success && (
        <>
          {/* Data Insertion Test */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Test Data Insertion</h3>
              <button
                onClick={insertTestData}
                disabled={insertionStatus.loading}
                className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
              >
                {insertionStatus.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{insertionStatus.loading ? 'Inserting...' : 'Insert Test Data'}</span>
              </button>
            </div>

            {insertionStatus.message && (
              <div className={`p-4 rounded-lg border ${
                insertionStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-3">
                  {insertionStatus.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      insertionStatus.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {insertionStatus.message}
                    </p>
                    {!insertionStatus.success && (
                      <p className="text-sm text-red-600 mt-1">
                        Note: Data insertion requires authentication. Please sign in to test this feature.
                      </p>
                    )}
                    {insertionStatus.success && insertionStatus.data && (
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(insertionStatus.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Retrieval Test */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Test Data Retrieval</h3>
              <button
                onClick={retrieveData}
                disabled={retrievalStatus.loading}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                {retrievalStatus.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <List className="w-4 h-4" />
                )}
                <span>{retrievalStatus.loading ? 'Retrieving...' : 'Retrieve Data'}</span>
              </button>
            </div>

            {retrievalStatus.message && (
              <div className={`p-4 rounded-lg border ${
                retrievalStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-3">
                  {retrievalStatus.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className="w-full">
                    <p className={`font-medium ${
                      retrievalStatus.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {retrievalStatus.message}
                    </p>
                    {!retrievalStatus.success && (
                      <p className="text-sm text-red-600 mt-1">
                        Note: Data retrieval may require authentication depending on your RLS policies.
                      </p>
                    )}
                    {retrievalStatus.success && retrievalStatus.data && (
                      <div className="mt-2 overflow-auto max-h-64">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {retrievalStatus.data.map((item: any) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{item.id}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{item.name}</td>
                                <td className="px-3 py-2">{item.description || 'N/A'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                  {new Date(item.created_at).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Authentication Setup Instructions */}
      {connectionStatus.success && authStatus.success && !authStatus.data?.authenticated && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Authentication Setup Required</h3>
          <p className="text-sm text-yellow-700 mb-2">
            To test data insertion and full functionality, you need to set up authentication in your Supabase project:
          </p>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Go to your Supabase project dashboard</li>
            <li>Navigate to Authentication → Settings</li>
            <li>Enable "Email Signups"</li>
            <li>Disable "Email Confirmations" for testing (optional)</li>
            <li>Check your RLS policies allow authenticated users to insert data</li>
          </ol>
        </div>
      )}
      {/* Connection Instructions */}
      {!connectionStatus.success && !connectionStatus.loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">How to Connect to Supabase</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-2">
            <li>Click the "Connect to Supabase" button in the top right corner of the editor</li>
            <li>Create a new Supabase project or connect to an existing one</li>
            <li>Wait for the connection to be established</li>
            <li>Refresh this page to test the connection again</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectionTest;