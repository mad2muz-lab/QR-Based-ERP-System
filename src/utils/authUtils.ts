import { User, AuthState } from '../types';
import { DataStorage } from './dataStorage';
import { SupabaseAuthManager } from './supabaseAuthUtils';
import { supabase } from './supabaseClient';
import { Role, RolePageAccess } from '../types';

export class AuthManager {
  private static readonly AUTH_TOKEN_KEY = 'qr_system_auth_token';
  private static readonly CURRENT_USER_KEY = 'qr_system_current_user';
  private static readonly USE_SUPABASE_KEY = 'qr_system_use_supabase';

  // Check if we should use Supabase (now always true if Supabase is configured and reachable)
  static async useSupabase(): Promise<boolean> {
    if (!SupabaseAuthManager.isSupabaseConfigured()) {
      return false;
    }
    // Try a quick Supabase ping (e.g., getSession)
    try {
      const online = await SupabaseAuthManager.pingSupabase();
      return online;
    } catch {
      return false;
    }
  }

  // Login function that works with both authentication methods
  static async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (await this.useSupabase()) {
      try {
        const result = await SupabaseAuthManager.signIn(username, password);
        if (result.success && result.user) {
          localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(result.user));
          return result;
        }
      } catch (error) {
        // If Supabase is unreachable, fall back to local auth
        console.error('Supabase auth error, falling back to local:', error);
      }
    }
    // Local authentication fallback
    const users = DataStorage.loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }
    user.lastLogin = new Date().toISOString();
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    DataStorage.saveUsers(updatedUsers);
    const token = btoa(`${user.id}:${Date.now()}`);
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, user };
  }

  // Logout function that works with both authentication methods
  static async logout(): Promise<void> {
    if (await this.useSupabase()) {
      await SupabaseAuthManager.signOut();
    }
    
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  // Get current user from either Supabase or local storage
  static async getCurrentUser(): Promise<User | null> {
    if (await this.useSupabase()) {
      const user = await SupabaseAuthManager.getCurrentUser();
      if (user) return user;
    }
    try {
      const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Synchronous version for compatibility
  static getCurrentUserSync(): User | null {
    try {
      const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    if (await this.useSupabase()) {
      return await SupabaseAuthManager.isAuthenticated();
    }
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const user = this.getCurrentUserSync();
    return !!(token && user);
  }

  // Synchronous version for compatibility
  static isAuthenticatedSync(): boolean {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const user = this.getCurrentUserSync();
    return !!(token && user);
  }

  // The rest of your methods with Supabase support...
  // (hasPermission, changePassword, createUser, updateUser, deleteUser)
  
  static hasPermission(requiredRole: string): boolean {
    const user = this.getCurrentUserSync();
    if (!user) return false;

    const roleHierarchy = {
      'viewer': 4,      // Level 4 (lowest access)
      'operator': 3,    // Level 3
      'manager': 2,     // Level 2
      'admin': 1,       // Level 1
      'developer': 0    // Level 0 (highest access)
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    // Lower numbers have higher access (0 is highest)
    return userLevel <= requiredLevel;
  }

  // User management methods for local storage
  static createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = DataStorage.loadUsers();
    const newUser: User = {
      ...userData,
      id: this.generateUserId(),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    DataStorage.saveUsers(users);
    return newUser;
  }

  static updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): boolean {
    const users = DataStorage.loadUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return false;
    }
    
    users[userIndex] = { ...users[userIndex], ...updates };
    DataStorage.saveUsers(users);
    return true;
  }

  static deleteUser(userId: string): boolean {
    const users = DataStorage.loadUsers();
    const userToDelete = users.find(user => user.id === userId);
    
    if (!userToDelete) {
      return false;
    }
    
    // Don't allow deletion of the last admin
    if (userToDelete.role === 'admin') {
      const adminUsers = users.filter(user => user.role === 'admin');
      if (adminUsers.length <= 1) {
        alert('Cannot delete the last admin user');
        return false;
      }
    }
    
    const filteredUsers = users.filter(user => user.id !== userId);
    DataStorage.saveUsers(filteredUsers);
    return true;
  }

  private static generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // --- DB-driven Role & Permission Utilities ---

  /**
   * Fetch all roles (with hierarchy) for a user from the new roles table.
   * Returns a flat array of Role objects, including inherited roles (from parent_role_id).
   */
  static async getUserRolesWithHierarchy(userId: string): Promise<Role[]> {
    if (!supabase) return [];
    // 1. Get all direct roles for the user (use only 'role' text)
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (userRolesError || !userRoles) return [];
    // 2. Get all roles from roles table
    const { data: allRoles, error: allRolesError } = await supabase
      .from('roles')
      .select('*');
    if (allRolesError || !allRoles) return [];
    // 3. For each user role, walk up the parent_role_id chain to collect inherited roles
    const roleMap: Record<string, Role> = {};
    allRoles.forEach((r: Role) => { roleMap[r.id] = r; });
    const collected: Record<string, Role> = {};
    function collectRoleAndParents(roleId: string) {
      if (!roleId || collected[roleId]) return;
      const role = roleMap[roleId];
      if (role) {
        collected[roleId] = role;
        if (role.parent_role_id) collectRoleAndParents(role.parent_role_id);
      }
    }
    userRoles.forEach((ur: any) => {
      // Find the role in allRoles by name
      const roleObj = allRoles.find((r: Role) => r.name === ur.role);
      if (roleObj) collectRoleAndParents(roleObj.id);
    });
    return Object.values(collected);
  }

  /**
   * Fetch all accessible pages for a user (aggregate all their roles, including inherited roles).
   * Returns a Set of page names the user can access.
   */
  static async getAccessiblePagesForUser(userId: string): Promise<Set<string>> {
    if (!supabase) return new Set();
    const roles = await this.getUserRolesWithHierarchy(userId);
    if (!roles.length) return new Set();
    const roleIds = roles.map(r => r.id);
    const { data: pageAccess, error } = await supabase
      .from('role_page_access')
      .select('page_name, can_access, role_id')
      .in('role_id', roleIds);
    if (error || !pageAccess) return new Set();
    const accessiblePages = new Set<string>();
    pageAccess.forEach((pa: any) => {
      if (pa.can_access) accessiblePages.add(pa.page_name);
    });
    return accessiblePages;
  }

  /**
   * Utility: Check if a user can access a given page (using DB-driven permissions).
   */
  static async canUserAccessPage(userId: string, pageName: string): Promise<boolean> {
    const accessiblePages = await this.getAccessiblePagesForUser(userId);
    return accessiblePages.has(pageName);
  }

  // --- Role Management Utilities ---

  /**
   * List all roles (with parent/child info)
   */
  static async listRoles(): Promise<Role[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('roles').select('*');
    if (error || !data) return [];
    return data;
  }

  /**
   * Create a new role
   */
  static async createRole(role: Omit<Role, 'id'>, userId?: string): Promise<{ success: boolean; data?: Role; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase.from('roles').insert([role]).select().single();
    if (error) return { success: false, error: error.message };
    if (userId && data) await this.logAudit({ user_id: userId, action: 'create_role', entity_type: 'role', entity_id: data.id, details: data });
    return { success: true, data };
  }

  /**
   * Update an existing role
   */
  static async updateRole(roleId: string, updates: Partial<Omit<Role, 'id'>>, userId?: string): Promise<{ success: boolean; data?: Role; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase.from('roles').update(updates).eq('id', roleId).select().single();
    if (error) return { success: false, error: error.message };
    if (userId && data) await this.logAudit({ user_id: userId, action: 'update_role', entity_type: 'role', entity_id: roleId, details: updates });
    return { success: true, data };
  }

  /**
   * Delete a role
   */
  static async deleteRole(roleId: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { error } = await supabase.from('roles').delete().eq('id', roleId);
    if (error) return { success: false, error: error.message };
    if (userId) await this.logAudit({ user_id: userId, action: 'delete_role', entity_type: 'role', entity_id: roleId });
    return { success: true };
  }

  /**
   * Get all page permissions for a role (action-level)
   */
  static async getRolePermissions(roleId: string): Promise<{ page_name: string; can_access: boolean; can_edit: boolean; can_delete: boolean }[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('role_page_access').select('page_name, can_access, can_edit, can_delete').eq('role_id', roleId);
    if (error || !data) return [];
    return data;
  }

  /**
   * Update page permissions for a role (action-level, replace all)
   * Accepts an array of { page_name, can_access, can_edit, can_delete }
   */
  static async updateRolePermissions(roleId: string, permissions: { page_name: string; can_access: boolean; can_edit: boolean; can_delete: boolean }[], userId?: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    // Remove all existing permissions for this role
    const { error: delError } = await supabase.from('role_page_access').delete().eq('role_id', roleId);
    if (delError) return { success: false, error: delError.message };
    // Insert new permissions
    if (permissions.length > 0) {
      const inserts = permissions.map(p => ({ role_id: roleId, ...p }));
      const { error: insError } = await supabase.from('role_page_access').insert(inserts);
      if (insError) return { success: false, error: insError.message };
    }
    if (userId) await this.logAudit({ user_id: userId, action: 'update_role_permissions', entity_type: 'role_page_access', entity_id: roleId, details: permissions });
    return { success: true };
  }

  /**
   * Assign a role to a user (user_roles table)
   */
  static async assignRoleToUser(userId: string, roleId: string, adminId?: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    // Find role name for this roleId
    const { data: roleData, error: roleError } = await supabase.from('roles').select('name').eq('id', roleId).single();
    if (roleError || !roleData) return { success: false, error: 'Role not found' };
    const { error } = await supabase.from('user_roles').upsert([{ user_id: userId, role: roleData.name, is_active: true }], { onConflict: 'user_id,role' });
    if (error) return { success: false, error: error.message };
    if (adminId) await this.logAudit({ user_id: adminId, action: 'assign_role', entity_type: 'user_role', entity_id: userId, details: { roleId } });
    return { success: true };
  }

  /**
   * List all users (for admin UI)
   */
  static async listUsers(): Promise<any[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('id, name, email');
    if (error || !data) return [];
    return data;
  }

  /**
   * Write an audit log entry
   */
  static async logAudit({ user_id, action, entity_type, entity_id, details }: { user_id: string; action: string; entity_type: string; entity_id: string; details?: any }) {
    if (!supabase) return;
    await supabase.from('audit_log').insert([
      {
        user_id,
        action,
        entity_type,
        entity_id,
        details: details ? JSON.stringify(details) : null,
      },
    ]);
  }
}