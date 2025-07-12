import { createClient } from '@supabase/supabase-js';

// These environment variables will be set after connecting to Supabase
// For now, we'll use empty strings as placeholders
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly set
const isSupabaseConfigured = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('Supabase configuration missing! Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
}

// Create a single supabase client for the entire app
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;


// Function to test connection
export const testConnection = async () => {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase not configured. Please connect to Supabase first.',
        error: 'Missing Supabase configuration'
      };
    }
    
    // Test basic connection by checking if we can reach the database
    // This uses a simple query that should work with anonymous access
    const { data, error, status } = await supabase
      .from('departments')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      // If we get a permission error, the connection is working but RLS is blocking
      if (error.code === '42501' || status === 401) {
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

// Function to test data insertion
export const testDataInsertion = async () => {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase not configured. Please connect to Supabase first.',
        error: 'Missing Supabase configuration'
      };
    }
    
    // Check if user is already authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: 'Authentication required for data insertion. Please sign in first.',
        error: 'No authenticated user found'
      };
    }
    
    const testData = {
      name: `Test Department ${Date.now()}`,
      description: 'This is a test department created to verify database connection',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('departments')
      .insert(testData)
      .select();
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Successfully inserted test data',
      data
    };
  } catch (error: any) {
    console.error('Supabase data insertion error:', error);
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
        message: 'Supabase not configured. Please connect to Supabase first.',
        error: 'Missing Supabase configuration'
      };
    }
    
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      // If we get a permission error, provide helpful message
      if (error.code === '42501') {
        return {
          success: false,
          message: 'Authentication required to retrieve data. Please sign in first.',
          error: error.message
        };
      }
      throw error;
    }
    
    return {
      success: true,
      message: 'Successfully retrieved data',
      data
    };
  } catch (error: any) {
    console.error('Supabase data retrieval error:', error);
    return {
      success: false,
      message: error.message || 'Failed to retrieve data',
      error
    };
  }
};
// Function to test authentication setup
export const testAuthSetup = async () => {
  try {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Supabase not configured. Please connect to Supabase first.',
        error: 'Missing Supabase configuration'
      };
    }
    
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase client not initialized. Please refresh the page and try again.',
        error: 'Supabase client not initialized'
      };
    }
    
    try {
      // Test if we can check auth status without errors
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        return {
          success: false,
          message: `Authentication test failed: ${error.message}`,
          error: error.message
        };
      }
      
      const user = data?.session?.user;
      
      return {
        success: true,
        message: user ? 'User is authenticated' : 'No authenticated user (anonymous access)',
        data: { 
          authenticated: !!user,
          user: user ? { id: user.id, email: user.email } : null
        }
      };
    } catch (authError) {
      // Handle specific auth errors gracefully
      console.error('Auth check error:', authError);
      return {
        success: false,
        message: 'Authentication check failed: ' + (authError instanceof Error ? authError.message : 'Unknown error'),
        error: authError instanceof Error ? authError.message : 'Unknown auth error'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to test authentication',
      error
    };
  }
};