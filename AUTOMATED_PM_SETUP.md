# Automated PM Schedule Generation Setup

## 🚀 Overview

This document explains how to set up the automated Preventive Maintenance (PM) schedule generation system that runs in the backend and notifies users automatically.

## 📋 Prerequisites

- Supabase project with database access
- Supabase CLI installed
- Node.js and npm/yarn

## 🔧 Setup Steps

### Step 1: Run Database Functions

Execute the SQL script to create the backend automation functions:

```bash
# Run this in your Supabase SQL Editor
# Copy and paste the contents of: automated_pm_generation.sql
```

This creates:
- `calculate_equipment_usage()` - Calculates equipment usage from logs
- `generate_automatic_pm_schedules()` - Generates PM schedules
- `create_pm_logs_from_schedules()` - Creates PM logs from schedules
- `send_pm_notifications()` - Creates notifications
- `run_daily_pm_generation()` - Main function that runs everything
- Supporting tables: `pm_notifications`, `pm_generation_logs`

### Step 2: Deploy Supabase Edge Function

Deploy the PM scheduler edge function:

```bash
# Navigate to your project directory
cd your-project-directory

# Deploy the edge function
supabase functions deploy pm-scheduler

# Set up environment variables (if needed)
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Set Up Scheduled Execution

#### Option A: Using Supabase Cron Jobs (Recommended)

Add this to your Supabase dashboard:

1. Go to **Database** → **Functions**
2. Create a new cron job:
   - **Name**: `pm_schedule_generator`
   - **Schedule**: `0 2 * * *` (runs daily at 2 AM)
   - **Function**: Call your edge function URL

#### Option B: Using External Cron Service

Set up a cron job to call your edge function:

```bash
# Example cron job (runs daily at 2 AM)
0 2 * * * curl -X POST https://your-project.supabase.co/functions/v1/pm-scheduler
```

#### Option C: Using GitHub Actions

Create `.github/workflows/pm-scheduler.yml`:

```yaml
name: PM Schedule Generator

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  pm-generation:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger PM Generation
        run: |
          curl -X POST ${{ secrets.SUPABASE_FUNCTION_URL }} \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

### Step 4: Test the System

#### Manual Testing

1. **Test the database function**:
   ```sql
   -- Run this in SQL Editor
   SELECT * FROM run_daily_pm_generation();
   ```

2. **Test the edge function**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/pm-scheduler
   ```

3. **Check notifications**:
   ```sql
   -- View generated notifications
   SELECT * FROM pm_notifications ORDER BY created_at DESC LIMIT 10;
   
   -- View generation logs
   SELECT * FROM pm_generation_logs ORDER BY created_at DESC LIMIT 5;
   ```

#### Frontend Testing

1. **Check notification badge** in the header
2. **View PM dashboard** for generated tasks
3. **Test real-time notifications** by creating a test PM schedule

## 🔄 How It Works

### Daily Execution Flow

1. **2 AM Daily**: Cron job triggers the edge function
2. **Equipment Analysis**: System analyzes all PM-enrolled equipment
3. **Usage Calculation**: Calculates usage from equipment logs
4. **Schedule Generation**: Creates PM schedules based on thresholds
5. **PM Log Creation**: Creates PM log entries in the database
6. **Notification Creation**: Generates notifications for users
7. **Logging**: Records the generation run for audit purposes

### Real-time Notifications

- **Frontend**: Notification badge shows unread count
- **Real-time**: WebSocket subscriptions update notifications instantly
- **Priority-based**: Critical alerts are highlighted
- **Actionable**: Click notifications to view PM tasks

## 📊 Monitoring and Maintenance

### Check System Health

```sql
-- Check recent generation runs
SELECT * FROM pm_generation_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for errors
SELECT * FROM pm_generation_logs 
WHERE pm_logs_errors > 0 
ORDER BY created_at DESC;

-- Check notification delivery
SELECT 
  notification_type,
  COUNT(*) as count,
  COUNT(CASE WHEN is_read = true THEN 1 END) as read_count
FROM pm_notifications 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY notification_type;
```

### Cleanup Tasks

```sql
-- Clean up old notifications (run monthly)
DELETE FROM pm_notifications 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Clean up old generation logs (run quarterly)
DELETE FROM pm_generation_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 🛠️ Troubleshooting

### Common Issues

1. **No schedules generated**:
   - Check if equipment has `is_pm = true`
   - Verify PM configurations exist
   - Check equipment usage logs

2. **Notifications not showing**:
   - Verify RLS policies are correct
   - Check if user is authenticated
   - Verify real-time subscriptions

3. **Edge function errors**:
   - Check Supabase logs
   - Verify environment variables
   - Test function manually

### Debug Commands

```sql
-- Check PM-enrolled equipment
SELECT * FROM equipment WHERE is_pm = true;

-- Check PM configurations
SELECT * FROM preventive_maintenance_configs WHERE is_active = true;

-- Check equipment usage
SELECT * FROM calculate_equipment_usage('equipment-id-here');

-- Test schedule generation
SELECT * FROM generate_automatic_pm_schedules();
```

## 🔐 Security Considerations

- **RLS Policies**: Ensure proper row-level security
- **Service Role**: Edge function uses service role for database access
- **Environment Variables**: Keep secrets secure
- **Audit Logging**: All generation runs are logged

## 📈 Performance Optimization

- **Indexes**: Database indexes are created for performance
- **Batch Processing**: Functions process equipment in batches
- **Error Handling**: Graceful error handling prevents system crashes
- **Logging**: Minimal logging to avoid performance impact

## 🎯 Next Steps

1. **Email Notifications**: Extend to send email alerts
2. **SMS Notifications**: Add SMS for critical alerts
3. **Mobile Push**: Implement mobile push notifications
4. **Advanced Analytics**: Add PM performance analytics
5. **Predictive Maintenance**: Implement ML-based predictions

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase logs
3. Test individual components
4. Contact the development team

---

**Note**: This system replaces the manual schedule generator with a fully automated backend solution that runs daily and provides real-time notifications to users. 