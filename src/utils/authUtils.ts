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
      console.log('❌ Supabase not configured');
      return false;
    }
    
    // Try a quick Supabase ping (e.g., getSession)
    try {
      const online = await SupabaseAuthManager.pingSupabase();
      console.log('🔍 Supabase ping result:', online);
      return online;
    } catch (error) {
      console.error('❌ Supabase ping failed:', error);
      return false;
    }
  }

  // Enhanced authentication check with better logging
  static async isAuthenticated(): Promise<boolean> {
    try {
      const useSupabase = await this.useSupabase();
      console.log('🔍 Authentication check - useSupabase:', useSupabase);
      
      if (useSupabase) {
        const authenticated = await SupabaseAuthManager.isAuthenticated();
        console.log('🔍 Supabase authentication result:', authenticated);
        return authenticated;
      } else {
        const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
        const user = this.getCurrentUserSync();
        const authenticated = !!(token && user);
        console.log('🔍 Local authentication result:', authenticated);
        return authenticated;
      }
    } catch (error) {
      console.error('❌ Authentication check error:', error);
      return false;
    }
  }

  // Enhanced current user retrieval
  static async getCurrentUser(): Promise<User | null> {
    try {
      const useSupabase = await this.useSupabase();
      console.log('🔍 Getting current user - useSupabase:', useSupabase);
      
      if (useSupabase) {
        const user = await SupabaseAuthManager.getCurrentUser();
        console.log('🔍 Supabase current user:', user ? user.id : 'null');
        if (user) {
          // Store in localStorage for compatibility
          localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
          return user;
        }
      }
      
      // Fallback to local storage
      const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;
      console.log('🔍 Local current user:', user ? user.id : 'null');
      return user;
    } catch (error) {
      console.error('❌ Get current user error:', error);
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

  // Login function that works with both authentication methods
  static async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    console.log('🔐 Starting login process...');
    
    if (await this.useSupabase()) {
      try {
        console.log('🔐 Attempting Supabase login...');
        const result = await SupabaseAuthManager.signIn(username, password);
        if (result.success && result.user) {
          console.log('✅ Supabase login successful:', result.user.id);
          localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(result.user));
          return result;
        } else {
          console.error('❌ Supabase login failed:', result.error);
          return result;
        }
      } catch (error) {
        console.error('❌ Supabase auth error, falling back to local:', error);
      }
    }
    
    // Local authentication fallback
    console.log('🔐 Attempting local login...');
    const users = DataStorage.loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      console.log('❌ Local login failed - invalid credentials');
      return { success: false, error: 'Invalid username or password' };
    }
    
    user.lastLogin = new Date().toISOString();
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    DataStorage.saveUsers(updatedUsers);
    const token = btoa(`${user.id}:${Date.now()}`);
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    console.log('✅ Local login successful:', user.id);
    return { success: true, user };
  }

  // Logout function that works with both authentication methods
  static async logout(): Promise<void> {
    console.log('🚪 Starting logout process...');
    
    if (await this.useSupabase()) {
      try {
        await SupabaseAuthManager.signOut();
        console.log('✅ Supabase logout successful');
      } catch (error) {
        console.error('❌ Supabase logout error:', error);
      }
    }
    
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
    console.log('✅ Local logout successful');
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
   * Check if a user can access a specific page
   */
  static async canUserAccessPage(userId: string, pageName: string): Promise<boolean> {
    if (!supabase) return true; // Fallback to allow access if no Supabase
    const accessiblePages = await this.getAccessiblePagesForUser(userId);
    return accessiblePages.has(pageName);
  }

  /**
   * List all roles from the database
   */
  static async listRoles(): Promise<Role[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('roles').select('*').order('name');
    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Create a new role
   */
  static async createRole(role: Omit<Role, 'id'>, userId?: string): Promise<{ success: boolean; data?: Role; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase.from('roles').insert([role]).select().single();
      if (error) throw error;
      if (userId) await this.logAudit({ user_id: userId, action: 'create', entity_type: 'role', entity_id: data.id });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing role
   */
  static async updateRole(roleId: string, updates: Partial<Omit<Role, 'id'>>, userId?: string): Promise<{ success: boolean; data?: Role; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase.from('roles').update(updates).eq('id', roleId).select().single();
      if (error) throw error;
      if (userId) await this.logAudit({ user_id: userId, action: 'update', entity_type: 'role', entity_id: roleId });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a role
   */
  static async deleteRole(roleId: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const { error } = await supabase.from('roles').delete().eq('id', roleId);
      if (error) throw error;
      if (userId) await this.logAudit({ user_id: userId, action: 'delete', entity_type: 'role', entity_id: roleId });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get permissions for a specific role
   */
  static async getRolePermissions(roleId: string): Promise<{ page_name: string; can_access: boolean; can_edit: boolean; can_delete: boolean }[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('role_page_access')
      .select('page_name, can_access, can_edit, can_delete')
      .eq('role_id', roleId);
    if (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Update permissions for a specific role
   */
  static async updateRolePermissions(roleId: string, permissions: { page_name: string; can_access: boolean; can_edit: boolean; can_delete: boolean }[], userId?: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      // Delete existing permissions
      await supabase.from('role_page_access').delete().eq('role_id', roleId);
      
      // Insert new permissions
      const { error } = await supabase.from('role_page_access').insert(
        permissions.map(p => ({ ...p, role_id: roleId }))
      );
      if (error) throw error;
      
      if (userId) await this.logAudit({ user_id: userId, action: 'update_permissions', entity_type: 'role', entity_id: roleId });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign a role to a user
   */
  static async assignRoleToUser(userId: string, roleId: string, adminId?: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role_id: roleId,
        is_active: true
      });
      if (error) throw error;
      if (adminId) await this.logAudit({ user_id: adminId, action: 'assign_role', entity_type: 'user_role', entity_id: userId });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List all users from the database
   */
  static async listUsers(): Promise<any[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*').order('created_at');
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Log audit events
   */
  static async logAudit({ user_id, action, entity_type, entity_id, details }: { user_id: string; action: string; entity_type: string; entity_id: string; details?: any }) {
    if (!supabase) return;
    try {
      await supabase.from('audit_logs').insert({
        user_id,
        action,
        entity_type,
        entity_id,
        details: details ? JSON.stringify(details) : null
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }
}