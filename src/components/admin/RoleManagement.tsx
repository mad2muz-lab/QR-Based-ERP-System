import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Check,
  X,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { UserRole, PageAccess } from '../../types';
import { EquipmentMaintenanceService } from '../../utils/equipmentMaintenanceService';
import { AuthManager } from '../../utils/authUtils';

interface RoleManagementProps {
  onClose?: () => void;
}

type Role = 'technician' | 'manager' | 'admin' | 'viewer';
type Permission = 'access' | 'edit' | 'delete';

const AVAILABLE_PAGES = [
  'equipment_scanner',
  'maintenance_dashboard',
  'reports',
  'admin_panel',
  'user_management',
  'registration_form',
  'map_view'
];

const ROLE_DESCRIPTIONS = {
  technician: 'Can perform maintenance tasks, complete repairs, and view maintenance logs',
  manager: 'Can manage maintenance schedules, assign technicians, and view all reports',
  admin: 'Full system access including user management and system configuration',
  viewer: 'Can view reports and equipment status, no editing capabilities'
};

const RoleManagement: React.FC<RoleManagementProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [pageAccess, setPageAccess] = useState<PageAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Permission editing
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [tempPermissions, setTempPermissions] = useState<Record<string, { access: boolean; edit: boolean; delete: boolean }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const currentUser = AuthManager.getCurrentUserSync();
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }

      // Check if current user is admin
      const userRole = await EquipmentMaintenanceService.getUserRole(currentUser.id);
      if (userRole !== 'admin') {
        setError('Access denied. Admin privileges required.');
        return;
      }

      // Load users from Supabase auth
      if (AuthManager.useSupabase()) {
        // Note: In a real implementation, you'd need to create a function to get users
        // For now, we'll use a placeholder
        const mockUsers = [
          { id: '1', email: 'admin@example.com', name: 'Admin User' },
          { id: '2', email: 'manager@example.com', name: 'Manager User' },
          { id: '3', email: 'technician@example.com', name: 'Technician User' },
          { id: '4', email: 'viewer@example.com', name: 'Viewer User' }
        ];
        setUsers(mockUsers);

        // Load user roles and page access
        const [rolesResult, accessResult] = await Promise.all([
          EquipmentMaintenanceService.getUserRoles(''), // Get all roles
          EquipmentMaintenanceService.getPageAccess('') // Get all page access
        ]);

        if (rolesResult.success) setUserRoles(rolesResult.data || []);
        if (accessResult.success) setPageAccess(accessResult.data || []);
      }
    } catch (error: any) {
      console.error('Error loading role management data:', error);
      setError('Failed to load role management data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      setError('Please select both a user and a role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUser = AuthManager.getCurrentUserSync();
      const newRole: Omit<UserRole, 'id' | 'assigned_at'> = {
        user_id: selectedUser.id,
        role: selectedRole,
        permissions: {},
        assigned_by: currentUser?.id,
        is_active: true
      };

      const result = await EquipmentMaintenanceService.assignUserRole(newRole);
      if (result.success) {
        setSuccess(`Role ${selectedRole} assigned to ${selectedUser.name} successfully`);
        setSelectedUser(null);
        setSelectedRole('');
        await loadData();
      } else {
        setError(result.error || 'Failed to assign role');
      }
    } catch (error: any) {
      console.error('Error assigning role:', error);
      setError('Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async (userId: string) => {
    setLoading(true);
    setError('');

    try {
      const currentUser = AuthManager.getCurrentUserSync();
      const updates = Object.entries(tempPermissions).map(([pageName, permissions]) => ({
        user_id: userId,
        page_name: pageName,
        can_access: permissions.access,
        can_edit: permissions.edit,
        can_delete: permissions.delete,
        assigned_by: currentUser?.id
      }));

      // Update each page access
      for (const update of updates) {
        await EquipmentMaintenanceService.updatePageAccess(update);
      }

      setSuccess('Permissions updated successfully');
      setEditingPermissions(null);
      setTempPermissions({});
      await loadData();
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      setError('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const startEditingPermissions = (userId: string) => {
    const userAccess = pageAccess.filter(pa => pa.user_id === userId);
    const permissions: Record<string, { access: boolean; edit: boolean; delete: boolean }> = {};

    AVAILABLE_PAGES.forEach(pageName => {
      const access = userAccess.find(pa => pa.page_name === pageName);
      permissions[pageName] = {
        access: access?.can_access || false,
        edit: access?.can_edit || false,
        delete: access?.can_delete || false
      };
    });

    setTempPermissions(permissions);
    setEditingPermissions(userId);
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter(ur => ur.user_id === userId && ur.is_active);
  };

  const getUserPageAccess = (userId: string) => {
    return pageAccess.filter(pa => pa.user_id === userId);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading role management data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
            <p className="text-gray-600">Manage user roles and permissions</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 text-green-800 border border-green-200 rounded-lg">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Roles
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Page Permissions
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Assign Role Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Role</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const user = users.find(u => u.id === e.target.value);
                    setSelectedUser(user || null);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a role...</option>
                  {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAssignRole}
                  disabled={!selectedUser || !selectedRole || loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Role'}
                </button>
              </div>
            </div>
            {selectedRole && (
              <p className="mt-2 text-sm text-gray-600">
                {ROLE_DESCRIPTIONS[selectedRole as Role]}
              </p>
            )}
          </div>

          {/* Users and Their Roles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Users and Roles</h3>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No users found</p>
              </div>
            ) : (
              filteredUsers.map(user => {
                const userRolesList = getUserRoles(user.id);
                return (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {userRolesList.length > 0 ? (
                            userRolesList.map(role => (
                              <span
                                key={role.id}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  role.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                                  role.role === 'manager' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                  role.role === 'technician' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  'bg-green-100 text-green-800 border-green-200'
                                }`}
                              >
                                {role.role.charAt(0).toUpperCase() + role.role.slice(1)}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No roles assigned</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditingPermissions(user.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Permissions</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Page Permissions</h3>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const userAccess = getUserPageAccess(user.id);
              const isEditing = editingPermissions === user.id;

              return (
                <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => startEditingPermissions(user.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {AVAILABLE_PAGES.map(pageName => (
                          <div key={pageName} className="border border-gray-200 rounded-lg p-3">
                            <h5 className="font-medium text-gray-900 mb-2 capitalize">
                              {pageName.replace('_', ' ')}
                            </h5>
                            <div className="space-y-2">
                              {(['access', 'edit', 'delete'] as Permission[]).map(permission => (
                                <label key={permission} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions[pageName]?.[permission] || false}
                                    onChange={(e) => setTempPermissions(prev => ({
                                      ...prev,
                                      [pageName]: {
                                        ...prev[pageName],
                                        [permission]: e.target.checked
                                      }
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700 capitalize">{permission}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingPermissions(null);
                            setTempPermissions({});
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdatePermissions(user.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Permissions'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {AVAILABLE_PAGES.map(pageName => {
                        const access = userAccess.find(pa => pa.page_name === pageName);
                        return (
                          <div key={pageName} className="border border-gray-200 rounded-lg p-3">
                            <h5 className="font-medium text-gray-900 mb-2 capitalize">
                              {pageName.replace('_', ' ')}
                            </h5>
                            <div className="space-y-1">
                              {(['access', 'edit', 'delete'] as Permission[]).map(permission => (
                                <div key={permission} className="flex items-center space-x-2">
                                  {access?.[`can_${permission}`] ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <X className="w-4 h-4 text-red-600" />
                                  )}
                                  <span className="text-sm text-gray-700 capitalize">{permission}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default RoleManagement; 