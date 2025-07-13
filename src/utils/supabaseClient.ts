import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly set
const isSupabaseConfigured = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('Supabase configuration missing! Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
}

// Create a single supabase client for the entire app
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

// Function to test connection
export const testConnection = async () => {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase not configured. Please check your .env file.',
        error: 'Missing Supabase configuration'
      };
    }
    
    // Test basic connection by checking if we can reach the database
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      // If we get a permission error, the connection is working but RLS is blocking
      if (error.code === 'PGRST301' || error.code === '42501') {
        return {
          success: true,
          message: 'Connected to Supabase (RLS policies active)',
          data: { note: 'Database connection successful, but authentication required for data operations' }
        };
      }
      throw error;
    }
    
    return {
      success: true,
      message: 'Successfully connected to Supabase',
      data
    };
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    return {
      success: false,
      message: error.message || 'Failed to connect to Supabase',
      error
    };
  }
};

// Function to test authentication
export const testAuthSetup = async () => {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase not configured. Please check your .env file.',
        error: 'Missing Supabase configuration'
      };
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    const user = data?.session?.user;
    
    return {
      success: true,
      message: user ? 'User is authenticated' : 'No authenticated user (anonymous access)',
      data: { 
        authenticated: !!user,
        user: user ? { id: user.id, email: user.email } : null
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to test authentication',
      error
    };
  }
};

// Function to test data insertion
export const testDataInsertion = async () => {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase not configured. Please check your .env file.',
        error: 'Missing Supabase configuration'
      };
    }
    
    // Check if user is authenticated first
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      return {
        success: false,
        message: 'Authentication required for data insertion. Please sign in first.',
        error: 'Not authenticated'
      };
    }
    
    // Try to insert a test record
    const testData = {
      name: `Test Department ${new Date().toISOString()}`,
      description: 'Test department created for connection testing',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('departments').insert([testData]).select();
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Successfully inserted test data',
      data
    };
  } catch (error: any) {
    console.error('Data insertion error:', error);
    return {
      success: false,
      message: error.message || 'Failed to insert test data',
      error
    };
  }
};

// Function to test data retrieval
export const testDataRetrieval = async () => {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase not configured. Please check your .env file.',
        error: 'Missing Supabase configuration'
      };
    }
    
    // Try to retrieve data
    const { data, error } = await supabase.from('departments').select('*').limit(5);
    
    if (error) {
      // If we get a permission error, it might be due to RLS
      if (error.code === 'PGRST301' || error.code === '42501') {
        return {
          success: false,
          message: 'Unable to retrieve data due to permissions (RLS). Try authenticating first.',
          error
        };
      }
      throw error;
    }
    
    return {
      success: true,
      message: `Successfully retrieved ${data.length} records`,
      data
    };
  } catch (error: any) {
    console.error('Data retrieval error:', error);
    return {
      success: false,
      message: error.message || 'Failed to retrieve data',
      error
    };
  }
};