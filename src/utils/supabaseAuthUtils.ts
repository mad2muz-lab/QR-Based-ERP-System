import { User } from '../types';
import { supabase } from './supabaseClient';
import { DataStorage } from './dataStorage';

export class SupabaseAuthManager {
  // Check if Supabase is configured
  static isSupabaseConfigured(): boolean {
    return !!supabase;
  }

  // Sign in with username and password
  static async signIn(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // First try to sign in with email/password (assuming username is email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed');
      }

      // Get user profile from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      if (!userData) {
        throw new Error('User profile not found');
      }

      // Convert to application User format
      const user: User = {
        id: userData.id,
        username: userData.username,
        password: '', // We don't store or return passwords
        role: userData.role,
        name: userData.name,
        email: userData.email || '',
        site: userData.site,
        isFirstLogin: false, // This would be handled differently with Supabase
        createdAt: userData.created_at,
        lastLogin: userData.last_login || undefined,
      };

      return { success: true, user };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message || 'Authentication failed' };
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      if (!supabase) {
        return null;
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        return null;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (error || !userData) {
        return null;
      }

      return {
        id: userData.id,
        username: userData.username,
        password: '', // We don't store or return passwords
        role: userData.role,
        name: userData.name,
        email: userData.email || '',
        site: userData.site,
        isFirstLogin: false,
        createdAt: userData.created_at,
        lastLogin: userData.last_login || undefined,
      };
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      if (!supabase) {
        return false;
      }

      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch {
      return false;
    }
  }

  // Create a new user
  static async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Then create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            username: userData.username,
            role: userData.role,
            name: userData.name,
            email: userData.email,
            site: userData.site,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      const newUser: User = {
        id: profileData.id,
        username: profileData.username,
        password: '', // We don't store or return passwords
        role: profileData.role,
        name: profileData.name,
        email: profileData.email || '',
        site: profileData.site,
        isFirstLogin: true,
        createdAt: profileData.created_at,
      };

      return { success: true, user: newUser };
    } catch (error: any) {
      console.error('Create user error:', error);
      return { success: false, error: error.message || 'Failed to create user' };
    }
  }
}