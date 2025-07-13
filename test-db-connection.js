import { supabase } from './src/utils/supabaseClient.js';

async function testDatabaseConnection() {
  console.log('Testing Supabase connection...');
  
  if (!supabase) {
    console.error('Supabase not configured!');
    return;
  }

  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const { data: users, error: usersError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (usersError) {
      console.log('Users table connection:', usersError.message);
    } else {
      console.log('✓ Connected to Supabase successfully');
    }

    // Check if separate log tables exist
    console.log('\n2. Checking separate log tables...');
    
    // Test employee_logs table
    const { data: empLogs, error: empError } = await supabase.from('employee_logs').select('count', { count: 'exact', head: true });
    if (empError) {
      console.log('❌ employee_logs table:', empError.message);
    } else {
      console.log('✓ employee_logs table exists');
    }

    // Test equipment_logs table
    const { data: eqLogs, error: eqError } = await supabase.from('equipment_logs').select('count', { count: 'exact', head: true });
    if (eqError) {
      console.log('❌ equipment_logs table:', eqError.message);
    } else {
      console.log('✓ equipment_logs table exists');
    }

    // Test material_logs table
    const { data: matLogs, error: matError } = await supabase.from('material_logs').select('count', { count: 'exact', head: true });
    if (matError) {
      console.log('❌ material_logs table:', matError.message);
    } else {
      console.log('✓ material_logs table exists');
    }

    // Test existing tables
    console.log('\n3. Checking existing tables...');
    const { data: employees, error: empTableError } = await supabase.from('employees').select('count', { count: 'exact', head: true });
    if (empTableError) {
      console.log('❌ employees table:', empTableError.message);
    } else {
      console.log('✓ employees table exists');
    }

    const { data: equipment, error: eqTableError } = await supabase.from('equipment').select('count', { count: 'exact', head: true });
    if (eqTableError) {
      console.log('❌ equipment table:', eqTableError.message);
    } else {
      console.log('✓ equipment table exists');
    }

    const { data: materials, error: matTableError } = await supabase.from('materials').select('count', { count: 'exact', head: true });
    if (matTableError) {
      console.log('❌ materials table:', matTableError.message);
    } else {
      console.log('✓ materials table exists');
    }

    const { data: timeLogs, error: timeLogsError } = await supabase.from('time_logs').select('count', { count: 'exact', head: true });
    if (timeLogsError) {
      console.log('❌ time_logs table:', timeLogsError.message);
    } else {
      console.log('✓ time_logs table exists');
    }

  } catch (error) {
    console.error('Error testing database:', error);
  }
}

testDatabaseConnection();