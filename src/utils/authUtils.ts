import { User, AuthState } from '../types';
import { DataStorage } from './dataStorage';

export class AuthManager {
  private static readonly AUTH_TOKEN_KEY = 'qr_system_auth_token';
  private static readonly CURRENT_USER_KEY = 'qr_system_current_user';

  static login(username: string, password: string): { success: boolean; user?: User; error?: string } {
    const users = DataStorage.loadUsers();
    console.log('Available users:', users.map(u => ({ username: u.username, password: u.password, role: u.role })));
    console.log('Attempting login with:', { username, password });
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      console.log('Login failed: User not found or password incorrect');
      console.log('Exact user check - looking for username:', username, 'password:', password);
      console.log('Users found with username "admin":', users.filter(u => u.username === 'admin'));
      return { success: false, error: 'Invalid username or password' };
    }

    console.log('Login successful for user:', user.username);
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    DataStorage.saveUsers(updatedUsers);

    // Generate token (simple implementation)
    const token = btoa(`${user.id}:${Date.now()}`);
    
    // Store auth data
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));

    return { success: true, user };
  }

  static logout(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  static hasPermission(requiredRole: string): boolean {
    const user = this.getCurrentUser();
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

  static changePassword(userId: string, newPassword: string): boolean {
    const users = DataStorage.loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;

    users[userIndex].password = newPassword;
    users[userIndex].isFirstLogin = false;
    
    DataStorage.saveUsers(users);
    
    // Update current user in localStorage
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.password = newPassword;
      currentUser.isFirstLogin = false;
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(currentUser));
    }

    return true;
  }

  static createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = DataStorage.loadUsers();
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    DataStorage.saveUsers(users);
    
    return newUser;
  }

  static updateUser(userId: string, updates: Partial<User>): boolean {
    const users = DataStorage.loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    const currentUser = this.getCurrentUser();
    
    if (userIndex === -1) return false;

    // Prevent tampering with developer role - only developer can modify developer accounts
    if (users[userIndex].role === 'developer' && currentUser?.role !== 'developer') {
      console.log('Only developer can modify developer accounts');
      return false;
    }
    
    // Prevent changing developer role to anything else
    if (users[userIndex].role === 'developer' && updates.role && updates.role !== 'developer') {
      console.log('Developer role cannot be changed');
      return false;
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    DataStorage.saveUsers(users);
    
    return true;
  }

  static deleteUser(userId: string): boolean {
    const currentUser = this.getCurrentUser();
    const users = DataStorage.loadUsers();
    const userToDelete = users.find(u => u.id === userId);
    
    // Prevent deletion of developer user
    if (userToDelete?.role === 'developer') {
      console.log('Cannot delete developer user');
      return false;
    }
    
    // Only developer can delete admin users
    if (userToDelete?.role === 'admin' && currentUser?.role !== 'developer') {
      console.log('Only developer can delete admin users');
      return false;
    }
    
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (filteredUsers.length === users.length) return false;

    DataStorage.saveUsers(filteredUsers);
    return true;
  }
}