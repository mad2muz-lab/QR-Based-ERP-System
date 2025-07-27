import { useState, useEffect } from 'react';
import { User } from '../../../types';
import { AuthManager } from '../../../utils/authUtils';
import { DataStorage } from '../../../utils/dataStorage';
import { SupabaseAuthManager } from '../../../utils/supabaseAuthUtils';
import { supabase } from '../../../utils/supabaseClient';

interface UserFormData {
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
  site: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'operator',
    site: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'operator',
      site: ''
    });
  };

  const trySupabase = async <T>(fn: () => Promise<T>, fallback: () => T) => {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      return fallback();
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    await trySupabase(
      async () => {
        const { data, error } = await supabase!
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setUsers(data || []);
      },
      () => {
        const localUsers = DataStorage.loadUsers();
        setUsers(localUsers);
      }
    );
    setIsLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        await trySupabase(
          async () => {
            const updateData: any = {
              username: formData.username,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              site: formData.site || null,
              updated_at: new Date().toISOString()
            };
            if (formData.password) {
              updateData.password = formData.password;
            }
            const { error } = await supabase!
              .from('users')
              .update(updateData)
              .eq('id', editingUser.id);
            if (error) throw error;
          },
          () => {
            const updatedUser: User = {
              ...editingUser,
              username: formData.username,
              name: formData.name,
              email: formData.email,
              role: formData.role as User['role'],
              site: formData.site || undefined,
              ...(formData.password && { password: formData.password })
            };
            AuthManager.updateUser(editingUser.id, updatedUser);
          }
        );
        alert('User updated successfully!');
      } else {
        // Create new user
        await trySupabase(
          async () => {
            const result = await SupabaseAuthManager.createUser({
              username: formData.username,
              password: formData.password,
              name: formData.name,
              email: formData.email,
              role: formData.role as User['role'],
              site: formData.site || undefined,
              isFirstLogin: false
            });
            if (!result.success) {
              throw new Error(result.error || 'Failed to create user');
            }
          },
          () => {
            const result = AuthManager.createUser({
              username: formData.username,
              password: formData.password,
              name: formData.name,
              email: formData.email,
              role: formData.role as User['role'],
              site: formData.site || undefined,
              isFirstLogin: false
            });
            if (!result) {
              throw new Error('Failed to create user');
            }
          }
        );
        alert('User created successfully!');
      }
      await loadUsers();
      setShowCreateForm(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      console.error('Error creating/updating user:', error);
      alert(`Failed to ${editingUser ? 'update' : 'create'} user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setIsLoading(true);
    try {
      // Find the user object by ID to get the email
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) throw new Error('User not found');
      // Call backend API to delete user from Auth and users table
      const response = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userToDelete.email }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      await loadUsers();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    editingUser,
    formData,
    setFormData,
    showCreateForm,
    setShowCreateForm,
    showPassword,
    setShowPassword,
    isLoading,
    resetForm,
    loadUsers,
    handleCreateUser,
    handleDeleteUser,
    startEdit,
    cancelEdit,
    exportUsers,
    getRoleBadgeColor
  };
};