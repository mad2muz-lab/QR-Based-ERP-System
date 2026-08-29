import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Edit, Plus, Eye, EyeOff } from 'lucide-react';
import { AuthManager } from '../../utils/authUtils';
import { DataStorage } from '../../utils/dataStorage';
import { SupabaseAuthManager } from '../../utils/supabaseAuthUtils';
import { supabase } from '../../utils/supabaseClient';
import { User } from '../../types';
import DepartmentManager from './DepartmentManager';
import UnauthorizedAccess from '../common/UnauthorizedAccess';
import AuditLogViewer from './AuditLogViewer';



interface AdminPanelProps {
  currentUser?: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  // Check if user has admin access
  const hasAdminAccess = currentUser?.role === 'admin' || currentUser?.role === 'developer';
  
  if (!hasAdminAccess) {
    return <UnauthorizedAccess requiredRole="admin" />;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'auditlog'>('users');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'operator' as User['role'],
    site: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    (async () => {
      await loadUsers();
    })();
  }, []);

  const loadUsers = async () => {
    if (await AuthManager.useSupabase()) {
      try {
        const { data, error } = await supabase!.from('users').select();
        if (error) throw error;
        if (data && data.length > 0) {
          setUsers(data);
          return;
        }
      } catch (error) {
        console.error('Error loading users from Supabase:', error);
      }
    }
    const loadedUsers = DataStorage.loadUsers();
    setUsers(loadedUsers);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await AuthManager.useSupabase()) {
      try {
        const result = await SupabaseAuthManager.createUser({
          ...formData,
          isFirstLogin: false
        });
        if (result.success && result.user) {
          await loadUsers();
          setShowCreateForm(false);
          resetForm();
          alert('User created in Supabase!');
        } else {
          alert('Failed to create user in Supabase: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Supabase createUser error:', error);
        alert('Supabase createUser error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
      return;
    }
    // Local fallback
    const newUser = AuthManager.createUser({
      ...formData,
      isFirstLogin: false
    });
    setUsers([...users, newUser]);
    setShowCreateForm(false);
    resetForm();
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (await AuthManager.useSupabase()) {
      try {
        const result = await SupabaseAuthManager.updateUser(editingUser.id, {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          site: formData.site,
          ...(formData.password && { password: formData.password, isFirstLogin: true })
        });
        if (result.success && result.user) {
          await loadUsers();
          setEditingUser(null);
          resetForm();
          alert('User updated in Supabase!');
        } else {
          alert('Failed to update user in Supabase: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Supabase updateUser error:', error);
        alert('Supabase updateUser error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
      return;
    }
    // Local fallback
    const success = AuthManager.updateUser(editingUser.id, {
      username: formData.username,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      site: formData.site,
      ...(formData.password && { password: formData.password, isFirstLogin: true })
    });
    if (success) {
      loadUsers();
      setEditingUser(null);
      resetForm();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && userToDelete.role === 'developer') {
      alert('Cannot delete the developer user.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    if (await AuthManager.useSupabase()) {
      try {
        const result = await SupabaseAuthManager.deleteUser(userId);
        if (result.success) {
          await loadUsers();
          alert('User deleted from Supabase!');
        } else {
          alert('Failed to delete user in Supabase: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Supabase deleteUser error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
      return;
    }
    // Local fallback
    const success = AuthManager.deleteUser(userId);
    if (success) {
      loadUsers();
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'operator',
      site: ''
    });
    setShowPassword(false);
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email,
      role: user.role,
      site: user.site || ''
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    resetForm();
  };

  const exportUsers = () => {
    DataStorage.downloadUsersCSV(users);
  };





  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'operator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'users', label: 'Users' },
    { id: 'departments', label: 'Departments' },
    { id: 'auditlog', label: 'Audit Log' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex space-x-1 p-1 bg-gray-50 rounded-t-xl overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 justify-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-800 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'departments' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <DepartmentManager />
        </div>
      )}

      {activeTab === 'users' && (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">User Management</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={exportUsers}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Users</span>
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">User</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Username</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Role</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Site</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Last Login</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-gray-600">{user.username}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-gray-600">{user.site || 'All Sites'}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isFirstLogin ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.isFirstLogin ? 'First Login' : 'Active'}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'auditlog' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <AuditLogViewer />
        </div>
      )}





      {/* Create/Edit User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!editingUser}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editingUser?.role === 'developer'}
                  required
                >
                  <option value="viewer">Viewer (Level 4)</option>
                  <option value="operator">Operator (Level 3)</option>
                  <option value="manager">Manager (Level 2)</option>
                  <option value="admin">Admin (Level 1)</option>
                  <option value="developer">Developer (Level 0)</option>
                </select>
                {editingUser?.role === 'developer' && (
                  <p className="text-xs text-gray-500 mt-1">Developer role cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site (Optional)</label>
                <input
                  type="text"
                  value={formData.site}
                  onChange={(e) => setFormData({...formData, site: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave blank for all sites"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;