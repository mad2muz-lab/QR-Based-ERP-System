import { User, AuthState } from '../types';
import { DataStorage } from './dataStorage';
import { SupabaseAuthManager } from './supabaseAuthUtils';

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
}