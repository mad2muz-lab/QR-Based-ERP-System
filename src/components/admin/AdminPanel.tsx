import React, { useState, useEffect, useRef } from 'react';
import { Shield, Download, Trash2, Edit, Plus, Eye, EyeOff, Building2, Users, Database, Activity, FileText, Settings } from 'lucide-react';
import { AuthManager } from '../../utils/authUtils';
import { DataStorage } from '../../utils/dataStorage';
import { SupabaseAuthManager } from '../../utils/supabaseAuthUtils';
import { supabase } from '../../utils/supabaseClient';
import { User } from '../../types';
import DepartmentManager from './DepartmentManager';
import UnauthorizedAccess from '../common/UnauthorizedAccess';
import AuditLogViewer from './AuditLogViewer';
import DataBackup from '../pages/DataBackup';
import ActivityTimeline from '../pages/ActivityTimeline';



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
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'auditlog' | 'company'>('users');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    city: '',
    country: 'Saudi Arabia',
    phone: '',
    email: '',
    taxId: '',
    website: '',
    logoUrl: ''
  });
  const [companySaved, setCompanySaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    // Load company data
    const storedCompany = localStorage.getItem('company_details');
    if (storedCompany) {
      try {
        setCompanyData(JSON.parse(storedCompany));
      } catch {}
    }
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

  const handleSaveCompany = () => {
    localStorage.setItem('company_details', JSON.stringify(companyData));
    localStorage.setItem('companies', JSON.stringify([{ name: companyData.name, logoUrl: companyData.logoUrl }]));
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCompanyData(prev => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setCompanyData(prev => ({ ...prev, logoUrl: '' }));
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
    { id: 'users', label: 'Users', icon: Users },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'departments', label: 'Departments', icon: Settings },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'auditlog', label: 'Audit Log', icon: FileText },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #002e17, #004d26)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          Admin Panel
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>Manage users, company settings, and system configuration</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '8px', padding: '16px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', overflowX: 'auto' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isActive ? '#002e17' : 'transparent',
                  color: isActive ? 'white' : '#475569',
                  boxShadow: isActive ? '0 4px 12px rgba(0,46,23,0.3)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon style={{ width: '20px', height: '20px' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '32px' }}>

      {activeTab === 'company' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
          </div>
          {companySaved && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 font-medium">
              Company details saved successfully!
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Logo Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {companyData.logoUrl ? (
                  <img src={companyData.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  {companyData.logoUrl ? 'Change' : 'Upload Logo'}
                </button>
                {companyData.logoUrl && (
                  <button onClick={removeLogo} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">Max 2MB (PNG, JPG)</p>
            </div>
            {/* Company Details */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" value={companyData.name} onChange={e => setCompanyData({...companyData, name: e.target.value})} placeholder="Enter company name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={companyData.email} onChange={e => setCompanyData({...companyData, email: e.target.value})} placeholder="company@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={companyData.phone} onChange={e => setCompanyData({...companyData, phone: e.target.value})} placeholder="+966 XX XXX XXXX" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="url" value={companyData.website} onChange={e => setCompanyData({...companyData, website: e.target.value})} placeholder="www.example.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / VAT Number</label>
                <input type="text" value={companyData.taxId} onChange={e => setCompanyData({...companyData, taxId: e.target.value})} placeholder="300000000000003" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" value={companyData.country} onChange={e => setCompanyData({...companyData, country: e.target.value})} placeholder="Saudi Arabia" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={companyData.city} onChange={e => setCompanyData({...companyData, city: e.target.value})} placeholder="Riyadh" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={companyData.address} onChange={e => setCompanyData({...companyData, address: e.target.value})} placeholder="Full company address" rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveCompany} className="flex items-center space-x-2 px-6 py-3 bg-blue-800 text-white rounded-lg font-medium hover:bg-blue-900 transition-colors">
              <Building2 className="w-4 h-4" />
              <span>Save Company Details</span>
            </button>
          </div>
        </div>
      )}

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

      {activeTab === 'backup' && (
        <DataBackup />
      )}

      {activeTab === 'activity' && (
        <ActivityTimeline />
      )}

      {activeTab === 'auditlog' && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '2px solid #e2e8f0' }}>
          <AuditLogViewer />
        </div>
      )}

        </div>
      </div>





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
                </select>
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