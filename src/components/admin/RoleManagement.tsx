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
import { Role } from '../../types';
import { EquipmentMaintenanceService } from '../../utils/equipmentMaintenanceService';
import { AuthManager } from '../../utils/authUtils';
import { Tooltip } from 'react-tooltip';
import UserAuditLogModal from './UserAuditLogModal';
import RoleHierarchyTree from './RoleHierarchyTree';

interface RoleManagementProps {
  onClose?: () => void;
}

// Remove local Role type and use only imported Role
// Remove all references to UserRole and pageAccess for now

const AVAILABLE_PAGES = [
  'dashboard',
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<any[]>([]); // TODO: Replace any with User type if available
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  // Form state for add/edit
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleParent, setRoleParent] = useState<string | null>(null);
  // Update rolePermissions state to store action-level permissions
  const [rolePermissions, setRolePermissions] = useState<Record<string, { [page: string]: { can_access: boolean; can_edit: boolean; can_delete: boolean } }>>({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState('');
  const [permissionsSuccess, setPermissionsSuccess] = useState('');
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string[]>>({}); // userId -> array of roleIds
  const [userRolesLoading, setUserRolesLoading] = useState(false);
  const [userRolesError, setUserRolesError] = useState('');
  const [userRolesSuccess, setUserRolesSuccess] = useState('');
  // Add state for confirmation dialog and success banner
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ open: boolean; roleId?: string }>({ open: false });
  const [showSuccessBanner, setShowSuccessBanner] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [auditLogModal, setAuditLogModal] = useState<{ open: boolean; userId?: string; userName?: string }>({ open: false });
  const [showHierarchy, setShowHierarchy] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!roles.length) return;
    // Update fetchPermissions to load action-level permissions
    const fetchPermissions = async () => {
      setPermissionsLoading(true);
      const perms: Record<string, { [page: string]: { can_access: boolean; can_edit: boolean; can_delete: boolean } }> = {};
      for (const role of roles) {
        const pagePerms = await AuthManager.getRolePermissions(role.id);
        perms[role.id] = {};
        for (const p of pagePerms) {
          perms[role.id][p.page_name] = {
            can_access: p.can_access,
            can_edit: p.can_edit,
            can_delete: p.can_delete,
          };
        }
        // Ensure all pages are present
        for (const page of AVAILABLE_PAGES) {
          if (!perms[role.id][page]) {
            perms[role.id][page] = { can_access: false, can_edit: false, can_delete: false };
          }
        }
      }
      setRolePermissions(perms);
      setPermissionsLoading(false);
    };
    fetchPermissions();
  }, [roles]);

  useEffect(() => {
    loadUsersAndRoles();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const rolesData = await AuthManager.listRoles();
      setRoles(rolesData);
    } catch (error: any) {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersAndRoles = async () => {
    setUserRolesLoading(true);
    setUserRolesError('');
    try {
      // Load users from Supabase (implement AuthManager.listUsers if needed)
      const usersData = await (AuthManager.listUsers ? AuthManager.listUsers() : []);
      setUsers(usersData);
      // Load user roles
      const map: Record<string, string[]> = {};
      for (const user of usersData) {
        const userRoles = await AuthManager.getUserRolesWithHierarchy(user.id);
        map[user.id] = userRoles.map(r => r.id);
      }
      setUserRolesMap(map);
    } catch (e) {
      setUserRolesError('Failed to load users or roles');
    } finally {
      setUserRolesLoading(false);
    }
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRoleParent(null);
    setShowRoleForm(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setRoleParent(role.parent_role_id || null);
    setShowRoleForm(true);
  };

  // Update handleDeleteRole to show confirmation dialog
  const handleDeleteRole = (roleId: string) => {
    setShowDeleteConfirm({ open: true, roleId });
  };
  const confirmDeleteRole = async () => {
    if (!showDeleteConfirm.roleId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await AuthManager.deleteRole(showDeleteConfirm.roleId);
      if (result.success) {
        setShowSuccessBanner('Role deleted');
        await loadData();
      } else {
        setError(result.error || 'Failed to delete role');
      }
    } catch (error: any) {
      setError('Failed to delete role');
    } finally {
      setLoading(false);
      setShowDeleteConfirm({ open: false });
    }
  };

  const handleRoleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingRole) {
        // Update
        const result = await AuthManager.updateRole(editingRole.id, {
          name: roleName,
          description: roleDescription,
          parent_role_id: roleParent || null,
        });
        if (result.success) {
          setSuccess('Role updated');
          setShowRoleForm(false);
          await loadData();
        } else {
          setError(result.error || 'Failed to update role');
        }
      } else {
        // Create
        const result = await AuthManager.createRole({
          name: roleName,
          description: roleDescription,
          parent_role_id: roleParent || null,
        });
        if (result.success) {
          setSuccess('Role created');
          setShowRoleForm(false);
          await loadData();
        } else {
          setError(result.error || 'Failed to create role');
        }
      }
    } catch (error: any) {
      setError('Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  // Update handlePermissionChange for action-level
  const handlePermissionChange = (roleId: string, page: string, perm: 'can_access' | 'can_edit' | 'can_delete', checked: boolean) => {
    setRolePermissions(prev => {
      const newPerms = { ...prev };
      if (!newPerms[roleId]) newPerms[roleId] = {};
      if (!newPerms[roleId][page]) newPerms[roleId][page] = { can_access: false, can_edit: false, can_delete: false };
      newPerms[roleId][page][perm] = checked;
      return newPerms;
    });
  };

  // Update handleSavePermissions for action-level
  const handleSavePermissions = async (roleId: string) => {
    setPermissionsLoading(true);
    setPermissionsError('');
    setPermissionsSuccess('');
    try {
      const permissions = Object.entries(rolePermissions[roleId] || {}).map(([page_name, perms]) => ({
        page_name,
        can_access: perms.can_access,
        can_edit: perms.can_edit,
        can_delete: perms.can_delete,
      }));
      const result = await AuthManager.updateRolePermissions(roleId, permissions);
      if (result.success) {
        setPermissionsSuccess('Permissions updated');
      } else {
        setPermissionsError(result.error || 'Failed to update permissions');
      }
    } catch (e) {
      setPermissionsError('Failed to update permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleUserRolesChange = async (userId: string, selectedRoleIds: string[]) => {
    setUserRolesLoading(true);
    setUserRolesError('');
    setUserRolesSuccess('');
    try {
      // Remove all roles for user, then add selected
      // (Assume AuthManager.assignRoleToUser adds if not present)
      for (const roleId of selectedRoleIds) {
        await AuthManager.assignRoleToUser(userId, roleId);
      }
      setUserRolesSuccess('User roles updated');
      await loadUsersAndRoles();
    } catch (e) {
      setUserRolesError('Failed to update user roles');
    } finally {
      setUserRolesLoading(false);
    }
  };

  // --- UI ---
  const permissionLabels = {
    can_access: 'View (can see this page)',
    can_edit: 'Edit (can modify content on this page)',
    can_delete: 'Delete (can remove content on this page)',
  };

  // Filtered roles and users
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
    (role.description || '').toLowerCase().includes(roleSearch.toLowerCase())
  );
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Role Management</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {showSuccessBanner && (
        <div className="bg-green-100 text-green-800 border border-green-200 rounded p-2 mb-2 text-center">
          {showSuccessBanner}
          <button className="ml-4 text-green-700 underline" onClick={() => setShowSuccessBanner('')}>Dismiss</button>
        </div>
      )}
      {showDeleteConfirm.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Confirm Delete</h3>
            <p>Are you sure you want to delete this role? This action cannot be undone.</p>
            <div className="flex space-x-2 mt-4">
              <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={confirmDeleteRole}>Delete</button>
              <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded" onClick={() => setShowDeleteConfirm({ open: false })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4" onClick={handleAddRole}>Add Role</button>
          <button
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded mb-4 ml-2"
            onClick={() => setShowHierarchy(true)}
          >
            View Hierarchy
          </button>
          {/* Search for roles */}
          <input
            type="text"
            placeholder="Search roles..."
            className="border p-2 rounded mb-4 w-full max-w-md"
            value={roleSearch}
            onChange={e => setRoleSearch(e.target.value)}
          />
          <table className="min-w-full border border-gray-200 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Parent</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map(role => (
                <tr key={role.id}>
                  <td className="p-2 border">{role.name}</td>
                  <td className="p-2 border">{role.description}</td>
                  <td className="p-2 border">{roles.find(r => r.id === role.parent_role_id)?.name || '-'}</td>
                  <td className="p-2 border space-x-2">
                    <button className="text-blue-600" onClick={() => handleEditRole(role)}>Edit</button>
                    <button className="text-red-600" onClick={() => handleDeleteRole(role.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showRoleForm && (
            <form onSubmit={handleRoleFormSubmit} className="bg-gray-50 p-4 rounded shadow mb-4">
              <h3 className="text-lg font-semibold mb-2">{editingRole ? 'Edit Role' : 'Add Role'}</h3>
              <div className="mb-2">
                <label className="block mb-1">Name</label>
                <input className="border p-2 rounded w-full" value={roleName} onChange={e => setRoleName(e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Description</label>
                <input className="border p-2 rounded w-full" value={roleDescription} onChange={e => setRoleDescription(e.target.value)} />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Parent Role</label>
                <select className="border p-2 rounded w-full" value={roleParent || ''} onChange={e => setRoleParent(e.target.value || null)}>
                  <option value="">None</option>
                  {roles.filter(r => !editingRole || r.id !== editingRole.id).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 mt-4">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" className="bg-gray-300 text-gray-800 px-4 py-2 rounded" onClick={() => setShowRoleForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          <h3 className="text-xl font-semibold mt-8 mb-2">Role Page Permissions</h3>
          {permissionsError && <div className="text-red-600 mb-2">{permissionsError}</div>}
          {permissionsSuccess && <div className="text-green-600 mb-2">{permissionsSuccess}</div>}
          {permissionsLoading ? (
            <div>Loading permissions...</div>
          ) : (
            <table className="min-w-full border border-gray-200 mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Page</th>
                  <th className="p-2 border">View</th>
                  <th className="p-2 border">Edit</th>
                  <th className="p-2 border">Delete</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  AVAILABLE_PAGES.map(page => (
                    <tr key={role.id + '-' + page}>
                      <td className="p-2 border font-semibold">{role.name}</td>
                      <td className="p-2 border">{page.replace('_', ' ')}</td>
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={rolePermissions[role.id]?.[page]?.can_access || false}
                          onChange={e => handlePermissionChange(role.id, page, 'can_access', e.target.checked)}
                          title={permissionLabels.can_access}
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={rolePermissions[role.id]?.[page]?.can_edit || false}
                          onChange={e => handlePermissionChange(role.id, page, 'can_edit', e.target.checked)}
                          title={permissionLabels.can_edit}
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={rolePermissions[role.id]?.[page]?.can_delete || false}
                          onChange={e => handlePermissionChange(role.id, page, 'can_delete', e.target.checked)}
                          title={permissionLabels.can_delete}
                        />
                      </td>
                      <td className="p-2 border">
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded"
                          onClick={() => handleSavePermissions(role.id)}
                          disabled={permissionsLoading}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          )}
          <h3 className="text-xl font-semibold mt-8 mb-2">Assign Roles to Users</h3>
          {/* Search for users */}
          <input
            type="text"
            placeholder="Search users..."
            className="border p-2 rounded mb-4 w-full max-w-md"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
          {userRolesError && <div className="text-red-600 mb-2">{userRolesError}</div>}
          {userRolesSuccess && (
            <div className="bg-green-100 text-green-800 border border-green-200 rounded p-2 mb-2 text-center">
              {userRolesSuccess}
              <button className="ml-4 text-green-700 underline" onClick={() => setUserRolesSuccess('')}>Dismiss</button>
            </div>
          )}
          {userRolesLoading ? (
            <div className="flex items-center justify-center py-4"><span className="animate-spin mr-2">🔄</span>Loading users and roles...</div>
          ) : (
            <table className="min-w-full border border-gray-200 mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">User</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Roles</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="p-2 border">{user.name}</td>
                    <td className="p-2 border">{user.email}</td>
                    <td className="p-2 border">
                      <select
                        multiple
                        className="border p-2 rounded w-full"
                        value={userRolesMap[user.id] || []}
                        onChange={e => {
                          const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                          handleUserRolesChange(user.id, selected);
                        }}
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                      <button
                        className="ml-2 text-blue-600 underline text-xs"
                        onClick={() => setAuditLogModal({ open: true, userId: user.id, userName: user.name })}
                      >
                        View Audit Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      {showHierarchy && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowHierarchy(false)}>✕</button>
            <RoleHierarchyTree roles={roles} />
          </div>
        </div>
      )}
      {auditLogModal.open && auditLogModal.userId && auditLogModal.userName && (
        <UserAuditLogModal
          open={auditLogModal.open}
          userId={auditLogModal.userId}
          userName={auditLogModal.userName}
          onClose={() => setAuditLogModal({ open: false })}
        />
      )}
    </div>
  );
};

export default RoleManagement; 