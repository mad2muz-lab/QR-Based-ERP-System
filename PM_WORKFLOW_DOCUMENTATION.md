# PM Workflow System Documentation

## Overview

The Preventive Maintenance (PM) Workflow System is a comprehensive QR-based solution that manages the complete lifecycle of PM tasks from assignment to completion. All actions are either QR scan-based or closed-ended options, ensuring a streamlined and error-free process.

## System Architecture

### Core Components

1. **PMWorkflowManager** - Main workflow orchestrator
2. **PMChecklistWorkflow** - Digital checklist execution
3. **PMDashboard** - Overview and monitoring
4. **PMConfigurationManager** - PM configuration management

### Database Tables

- `preventive_maintenance_logs` - PM task records
- `preventive_maintenance_configs` - PM configurations
- `pm_technician_performance` - Technician performance tracking
- `equipment` - Equipment information
- `employees` - Technician information

## Workflow Process

### 1. PM Assignment Process (Admin/Manager)

#### Step 1: Access PM Workflow
- Navigate to `/pm-workflow`
- Select "PM Assignment" mode
- System shows assignment interface

#### Step 2: Scan Equipment QR
- Admin scans equipment QR code using camera or hardware scanner
- System validates equipment and loads PM configuration
- System calculates available PM tasks based on usage hours

#### Step 3: Select PM Task
- System displays available PM tasks (Class A, B, C)
- Admin selects appropriate PM class
- System shows task details and requirements

#### Step 4: Assign to Technician
- Admin scans technician QR code
- System validates technician credentials
- System creates PM log entry with `status: 'assigned'`

#### Step 5: Confirmation
- System shows assignment confirmation
- PM task is now visible in technician's dashboard

### 2. Technician View and Execution

#### Step 1: Technician Login
- Technician navigates to `/pm-workflow`
- Selects "PM Execution" mode
- Scans their QR code to access their dashboard

#### Step 2: View Assigned Tasks
- System displays all assigned PM tasks
- Shows equipment, PM class, and due dates
- Tasks are color-coded by status (assigned/in progress)

#### Step 3: Start PM Task
- Technician selects a task
- Scans equipment QR to confirm
- System validates task assignment
- Shows safety preparation checklist

#### Step 4: Execute PM Checklist
- System loads digital checklist based on PM class
- Each item has closed-ended options: Pass/Fail/N/A
- Required items must be completed
- Photo documentation for critical items
- Notes required for failed items

#### Step 5: Complete PM Task
- All required items must be completed
- System calculates quality score
- Safety checks must pass
- PM log is updated with completion data

### 3. PM Closure Process

#### Step 1: Quality Verification
- System verifies all required items completed
- Checks safety protocols followed
- Validates photo documentation
- Calculates overall quality score

#### Step 2: Database Update
- Updates `preventive_maintenance_logs` with:
  - `status: 'completed'`
  - `completed_date: current_timestamp`
  - `checklist_completed: true`
  - `quality_score: calculated_score`
  - `safety_checks_passed: boolean`

#### Step 3: Next PM Scheduling
- System calculates next PM date based on:
  - Equipment usage hours
  - PM class intervals
  - Configuration settings

#### Step 4: Equipment Status Update
- Updates equipment status to 'available'
- Records last PM date
- Updates next PM due date

## QR Code Integration

### Equipment QR Codes
- Format: `EQ-{equipment_id}` or `equipment-{id}`
- Contains equipment identification
- Links to equipment database record
- Triggers PM task calculation

### Technician QR Codes
- Format: `EMP-{employee_id}` or `employee-{id}`
- Contains technician identification
- Links to employee database record
- Validates technician credentials

### Scanner Modes
1. **Camera Scanner** - Mobile device camera
2. **Hardware Scanner** - Dedicated QR scanner (EDA52)

## Closed-Ended Options

### PM Checklist Responses
- **Pass** - Item completed successfully
- **Fail** - Item failed, requires notes
- **N/A** - Not applicable for this task

### Safety Checks
- Equipment shutdown verification
- PPE compliance
- Work area isolation
- Tool availability

### Quality Metrics
- Completion percentage
- Required items completed
- Safety checks passed
- Photo documentation count

## PM Classes and Checklists

### Class A Maintenance (Basic)
**Threshold**: 32 hours
**Items**:
- Visual inspection
- Fluid level checks
- Air filter cleaning
- Basic function testing

### Class B Maintenance (Intermediate)
**Threshold**: 384 hours
**Items**:
- Detailed component inspection
- Oil and filter changes
- Lubrication of moving parts
- Comprehensive testing

### Class C Maintenance (Major)
**Threshold**: 1536 hours
**Items**:
- Complete disassembly
- Component replacement
- System calibration
- Full operational testing

## Data Flow

### Assignment Flow
```
Equipment QR Scan → PM Task Calculation → Technician QR Scan → Database Insert
```

### Execution Flow
```
Technician QR Scan → Task Dashboard → Equipment QR Scan → Checklist Execution → Database Update
```

### Completion Flow
```
Checklist Completion → Quality Calculation → Database Update → Next PM Scheduling
```

## Quality Assurance

### Safety Protocols
- Mandatory safety checklist
- Photo documentation for critical items
- PPE verification
- Work area isolation

### Quality Scoring
- Based on completion percentage
- Required items weighting
- Safety compliance
- Documentation completeness

### Audit Trail
- Complete action history
- Technician identification
- Timestamp tracking
- Photo documentation

## Integration Points

### PM Dashboard
- Real-time compliance tracking
- Technician performance metrics
- Equipment maintenance history
- Overdue task alerts

### Configuration Management
- PM class definitions
- Checklist customization
- Interval settings
- Equipment type mapping

### Notification System
- Task assignment notifications
- Due date reminders
- Completion confirmations
- Quality alerts

## Error Handling

### QR Code Errors
- Invalid QR format
- Equipment not found
- Technician not found
- Permission denied

### Workflow Errors
- Missing required information
- Incomplete checklists
- Safety violations
- Database connection issues

### Recovery Procedures
- Manual QR entry
- Workflow restart
- Data validation
- Error logging

## Security Features

### Access Control
- Technician authentication
- Role-based permissions
- Session management
- Audit logging

### Data Integrity
- Transaction management
- Validation checks
- Backup procedures
- Error recovery

## Performance Optimization

### Database Queries
- Indexed lookups
- Efficient joins
- Caching strategies
- Query optimization

### UI Responsiveness
- Lazy loading
- Progressive enhancement
- Offline capabilities
- Mobile optimization

## Future Enhancements

### Planned Features
- Mobile app development
- Offline checklist support
- Advanced analytics
- Predictive maintenance

### Integration Opportunities
- IoT sensor integration
- Automated scheduling
- Machine learning
- Predictive analytics

## Troubleshooting

### Common Issues
1. **QR Code Not Recognized**
   - Check QR code format
   - Verify database records
   - Test scanner functionality

2. **Checklist Not Loading**
   - Verify PM configuration
   - Check equipment type mapping
   - Validate database connections

3. **Completion Errors**
   - Ensure all required items completed
   - Verify safety checks passed
   - Check database permissions

### Support Procedures
- Error logging and reporting
- User feedback collection
- Performance monitoring
- Regular system maintenance

## Conclusion

The PM Workflow System provides a comprehensive, QR-based solution for managing preventive maintenance tasks. By using closed-ended options and QR scanning throughout the process, it ensures accuracy, efficiency, and compliance while maintaining a user-friendly interface for both administrators and technicians.

The system integrates seamlessly with existing PM configurations and provides real-time tracking, quality assurance, and performance monitoring capabilities.
