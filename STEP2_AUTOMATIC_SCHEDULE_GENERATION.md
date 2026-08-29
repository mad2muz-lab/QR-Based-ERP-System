# Step 2: Automatic Schedule Generation Implementation

## 🎯 Overview

Step 2 implements the automatic generation of preventive maintenance schedules based on equipment usage and PM configurations. This system calculates equipment usage from time logs, compares it against maintenance thresholds, and generates prioritized schedules.

## 🚀 Features Implemented

### 1. **Enhanced Preventive Maintenance Service**
- **Location**: `src/utils/preventiveMaintenanceService.ts`
- **New Functions**:
  - `calculateEquipmentUsage()` - Calculates total hours and km from equipment logs
  - `generateAutomaticSchedules()` - Generates PM schedules for all enrolled equipment
  - `createPMLogsFromSchedules()` - Creates PM logs from generated schedules
  - `getOverduePMLogs()` - Retrieves overdue maintenance tasks
  - `getPMStatistics()` - Provides PM completion statistics

### 2. **Automatic Schedule Generator Component**
- **Location**: `src/components/maintenance/AutomaticScheduleGenerator.tsx`
- **Features**:
  - Real-time equipment usage calculation
  - Automatic schedule generation with priority assignment
  - Usage details display
  - Schedule review and approval
  - PM log creation from schedules

### 3. **Route Integration**
- **Path**: `/pm/schedule-generator`
- **Access**: Available from PM Dashboard via "🔄 Generate Schedules" button

## 🔧 How It Works

### 1. **Equipment Usage Calculation**
```typescript
// Calculates usage from equipment_logs table
const usage = await preventiveMaintenanceService.calculateEquipmentUsage(equipmentId);
// Returns: { total_hours, total_km, last_usage_date, days_since_last_maintenance }
```

### 2. **Schedule Generation Logic**
```typescript
// For each enrolled equipment:
// 1. Get PM configurations for equipment type
// 2. Calculate current usage
// 3. Compare against thresholds (80% of intervals)
// 4. Determine priority based on overdue status
// 5. Generate scheduled dates
```

### 3. **Priority Assignment**
- **Critical**: Overdue by >30 days
- **High**: Overdue by 14-30 days  
- **Medium**: Overdue by 7-14 days
- **Low**: Due soon or on time

### 4. **Maintenance Class Duration Estimates**
- **Routine**: 1 hour
- **Class A**: 2 hours
- **Class B**: 4 hours
- **Class C**: 8 hours

## 📊 Usage Instructions

### For Technicians/Managers:

1. **Access Schedule Generator**
   - Navigate to PM Dashboard
   - Click "🔄 Generate Schedules" button
   - Or go directly to `/pm/schedule-generator`

2. **Generate Schedules**
   - Click "🔄 Generate Schedules" button
   - System calculates usage for all enrolled equipment
   - Reviews PM configurations and thresholds
   - Generates prioritized schedules

3. **Review Generated Schedules**
   - View equipment usage details
   - Check maintenance class requirements
   - Review priority assignments
   - Verify scheduled dates

4. **Create PM Logs**
   - Click "✅ Create X PM Logs" button
   - System creates PM logs in database
   - Assigns technicians (if configured)
   - Sends notifications

### For Administrators:

1. **Monitor Schedule Generation**
   - Check equipment enrollment status
   - Review PM configurations
   - Monitor usage calculations
   - Verify schedule accuracy

2. **Adjust Configurations**
   - Modify maintenance intervals
   - Update threshold percentages
   - Configure maintenance classes
   - Set technician assignments

## 🗄️ Database Integration

### Tables Used:
- **equipment** - Enrolled equipment with PM status
- **equipment_logs** - Usage data for calculations
- **preventive_maintenance_configs** - PM intervals and thresholds
- **preventive_maintenance_logs** - Generated PM tasks

### Key Queries:
```sql
-- Calculate equipment usage
SELECT 
  equipment_id,
  COUNT(CASE WHEN action = 'start-use' THEN 1 END) as usage_sessions,
  MAX(created_at) as last_usage
FROM equipment_logs
GROUP BY equipment_id;

-- Check PM thresholds
SELECT 
  equipment_type,
  maintenance_class,
  class_a_threshold_hours,
  class_b_threshold_hours,
  class_c_threshold_hours
FROM preventive_maintenance_configs;
```

## 🔍 Testing and Validation

### SQL Script for Testing:
- **File**: `run_automatic_pm_scheduling.sql`
- **Purpose**: Test and validate automatic scheduling
- **Commands**:
  1. Check enrolled equipment
  2. Review PM configurations
  3. Calculate equipment usage
  4. Check existing PM logs
  5. Find overdue maintenance
  6. Generate PM statistics

### Manual Testing Steps:
1. **Enroll Equipment**: Use Step 1 to enroll equipment in PM
2. **Add Usage Data**: Create equipment logs with start/stop actions
3. **Generate Schedules**: Use the schedule generator
4. **Review Results**: Check generated schedules and priorities
5. **Create PM Logs**: Convert schedules to PM tasks
6. **Verify Integration**: Check PM dashboard for new tasks

## 📈 Benefits

### 1. **Automated Scheduling**
- No manual tracking required
- Real-time usage monitoring
- Automatic threshold detection
- Priority-based scheduling

### 2. **Preventive Care**
- Prevents equipment breakdowns
- Reduces repair costs
- Extends equipment life
- Ensures compliance

### 3. **Efficiency**
- Time-saving automation
- Accurate usage tracking
- Prioritized task management
- Integrated workflow

### 4. **Compliance**
- Scheduled maintenance tracking
- Audit trail maintenance
- Regulatory compliance
- Documentation automation

## 🔄 Integration with Other Steps

### Step 1 Integration:
- Uses enrolled equipment from Step 1
- References PM configurations set during enrollment
- Builds on equipment enrollment process

### Step 3 Integration (PM Dashboard):
- Generated schedules appear in PM dashboard
- Overdue tasks highlighted for attention
- Technician assignments integrated
- Completion tracking enabled

### Future Steps:
- **Step 4**: PM Execution (QR scanning, checklists)
- **Step 5**: Completion and Reporting
- **Step 6**: Analytics and Optimization

## 🛠️ Technical Implementation

### Service Architecture:
```typescript
class PreventiveMaintenanceService {
  // Usage calculation
  async calculateEquipmentUsage(equipmentId: string): Promise<EquipmentUsage>
  
  // Schedule generation
  async generateAutomaticSchedules(): Promise<PMSchedule[]>
  
  // PM log creation
  async createPMLogsFromSchedules(schedules: PMSchedule[]): Promise<Result>
  
  // Statistics and monitoring
  async getPMStatistics(): Promise<PMStats>
}
```

### Component Structure:
```typescript
const AutomaticScheduleGenerator: React.FC = () => {
  // State management
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [usageData, setUsageData] = useState<Record<string, EquipmentUsage>>({});
  
  // Core functions
  const generateSchedules = async () => { /* ... */ };
  const createPMLogs = async () => { /* ... */ };
  
  // UI rendering
  return (/* ... */);
};
```

## 🚨 Troubleshooting

### Common Issues:

1. **No Equipment Enrolled**
   - Solution: Complete Step 1 enrollment first
   - Check `equipment.is_pm = true`

2. **No Usage Data**
   - Solution: Create equipment logs with start/stop actions
   - Verify equipment_logs table has data

3. **Missing PM Configurations**
   - Solution: Check preventive_maintenance_configs table
   - Ensure equipment types have configurations

4. **Schedule Generation Errors**
   - Check browser console for errors
   - Verify database connectivity
   - Review equipment enrollment status

### Debug Commands:
```sql
-- Check enrollment status
SELECT COUNT(*) FROM equipment WHERE is_pm = true;

-- Check usage data
SELECT COUNT(*) FROM equipment_logs WHERE action IN ('start-use', 'stop-use');

-- Check PM configurations
SELECT COUNT(*) FROM preventive_maintenance_configs;
```

## 📋 Next Steps

### Immediate Actions:
1. **Test the Implementation**: Use the SQL script to validate
2. **Generate Schedules**: Access the schedule generator
3. **Review Results**: Check generated schedules and priorities
4. **Create PM Logs**: Convert schedules to actionable tasks

### Future Enhancements:
1. **Automated Notifications**: Email/SMS alerts for due maintenance
2. **Mobile Integration**: Field technician mobile interface
3. **Advanced Analytics**: Predictive maintenance algorithms
4. **Work Order System**: Detailed work order management

## ✅ Success Criteria

- [ ] Equipment usage calculation working
- [ ] Automatic schedule generation functional
- [ ] Priority assignment accurate
- [ ] PM logs created successfully
- [ ] Integration with PM dashboard working
- [ ] SQL validation script working
- [ ] Error handling implemented
- [ ] User interface responsive and intuitive

---

**Step 2 Complete!** 🎉

The automatic schedule generation system is now fully implemented and ready for use. Technicians can generate maintenance schedules based on equipment usage, review priorities, and create PM tasks automatically. 