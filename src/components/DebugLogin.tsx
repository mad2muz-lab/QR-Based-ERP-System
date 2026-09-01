import React, { useState, useEffect } from 'react';
import { DataStorage } from '../utils/dataStorage';
import { AuthManager } from '../utils/authUtils';
import { User } from '../types';

const DebugLogin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginResult, setLoginResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load users from local storage
    const localUsers = DataStorage.loadUsers();
    setUsers(localUsers);
    console.log('Local users found:', localUsers);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setLoginResult(null);
    
    try {
      const result = await AuthManager.login(username, password);
      setLoginResult(result);
      console.log('Login result:', result);
    } catch (error) {
      setLoginResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Debug Login</h2>
      
      {/* Local Users Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Local Users ({users.length})</h3>
        {users.length === 0 ? (
          <p className="text-red-600">No users found in local storage</p>
        ) : (
          <div className="space-y-2">
            {users.map((user, index) => (
              <div key={index} className="p-3 bg-white border rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Username:</span> {user.username}
                  </div>
                  <div>
                    <span className="font-medium">Password:</span> {user.password}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {user.role}
                  </div>
                  <div>
                    <span className="font-medium">Name:</span> {user.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login Test */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Test Login</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </button>
        </div>
      </div>

      {/* Login Result */}
      {loginResult && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Login Result</h3>
          <div className={`p-3 rounded ${loginResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="font-medium">
              {loginResult.success ? '✅ Success' : '❌ Failed'}
            </p>
            <p className="text-sm mt-1">{loginResult.message || loginResult.error}</p>
            {loginResult.user && (
              <div className="mt-2 text-sm">
                <pre className="bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(loginResult.user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Login Buttons */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Quick Login</h3>
        <div className="space-y-2">
          {users.map((user, index) => (
            <button
              key={index}
              onClick={() => {
                setUsername(user.username);
                setPassword(user.password);
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Login as {user.username} ({user.role})
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Refresh Page
        </button>
        <button
          onClick={clearStorage}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-2"
        >
          Clear Storage & Reload
        </button>
      </div>
    </div>
  );
};

export default DebugLogin;
