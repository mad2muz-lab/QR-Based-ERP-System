# Supabase Connection Setup Guide

## Overview
Your QR-Based ERP System is already configured to work with Supabase. This guide will help you connect to your existing Supabase project.

## Current Configuration
- **Project Reference**: `lzbvyptjirohluliiitp`
- **Project URL**: `https://lzbvyptjirohluliiitp.supabase.co`
- **Supabase Client**: Already configured in `src/utils/supabaseClient.ts`

## Step 1: Get Your Supabase Anon Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project (reference: `lzbvyptjirohluliiitp`)
3. Navigate to **Settings** → **API**
4. Copy the **anon public** key (not the service_role key)

## Step 2: Create Environment File

1. Create a `.env` file in the project root directory (same level as `package.json`)
2. Add the following content:

```env
VITE_SUPABASE_URL=https://lzbvyptjirohluliiitp.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

3. Replace `your_actual_anon_key_here` with the anon key you copied from Step 1

## Step 3: Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Supabase test page:
   ```
   http://localhost:5173/supabase-test
   ```

3. Click the test buttons to verify:
   - **Test Basic Connection**: Verifies connectivity to Supabase
   - **Test Authentication**: Checks auth setup
   - **Test Data Retrieval**: Tests database access

## Step 4: Verify Database Schema

Your Supabase project should already have the necessary database schema. The migrations are located in:
- `supabase/migrations/` - Database schema files

## Troubleshooting

### Environment Variables Not Loading
- Make sure the `.env` file is in the project root
- Restart the development server after creating the `.env` file
- Check that variable names start with `VITE_`

### Connection Errors
- Verify your anon key is correct
- Check that your Supabase project is active
- Ensure your IP is not blocked by Supabase

### Authentication Issues
- The system uses Row Level Security (RLS)
- You may need to authenticate first before accessing data
- Check the auth test results for more details

### Data Access Issues
- Verify that the database tables exist
- Check RLS policies are configured correctly
- Ensure you have the necessary permissions

## Next Steps

Once connected successfully:
1. The system will automatically sync with Supabase
2. All QR scanning and data operations will be stored in the cloud
3. Multiple users can access the same data
4. Real-time updates will work across devices

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Only use the anon key, never the service_role key in the frontend
- Row Level Security (RLS) is enabled for data protection

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Test the connection using the `/supabase-test` page
4. Check the Supabase dashboard for any service issues
