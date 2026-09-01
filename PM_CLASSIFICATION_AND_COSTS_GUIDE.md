# PM Classification System and Cost Sources Guide

## 📋 Overview

This document explains the Preventive Maintenance (PM) classification system and how cost estimates are calculated in the QR-Based ERP System.

## 🏷️ PM Classification System

### **Class A: Basic Service**
- **Description**: Basic Service - Oil changes, filter replacements, inspections, minor adjustments
- **Standard Cost**: $500
- **Frequency**: Every 90 days (3 months)
- **Estimated Hours**: 2 hours
- **Scope**: 
  - Check and top up engine oil
  - Replace oil filter
  - Check and clean air filter
  - Inspect belts and hoses
  - Check tire pressure and condition
  - Inspect lights and signals
  - Check fluid levels (brake, coolant, transmission)
  - Lubricate moving parts
  - Inspect electrical connections
  - Check safety equipment

### **Class B: Standard Service**
- **Description**: Standard Service - Fluid changes, belt replacements, minor repairs, system checks
- **Standard Cost**: $1,500
- **Frequency**: Every 365 days (1 year)
- **Estimated Hours**: 4 hours
- **Scope**:
  - Complete Class A service
  - Replace hydraulic fluid
  - Replace transmission fluid
  - Replace drive belts
  - Inspect and adjust brakes
  - Check wheel alignment
  - Inspect suspension components
  - Test hydraulic systems
  - Check engine performance
  - Inspect transmission
  - Test electrical systems
  - Check emission systems

### **Class C: Major Service**
- **Description**: Major Service - Overhauls, major component replacements, complete system inspection
- **Standard Cost**: $3,000
- **Frequency**: Every 730 days (2 years)
- **Estimated Hours**: 8 hours
- **Scope**:
  - Complete Class B service
  - Engine tune-up and adjustment
  - Transmission service
  - Hydraulic system overhaul
  - Electrical system inspection
  - Safety system certification
  - Structural integrity check
  - Performance testing
  - Calibration of instruments
  - Complete lubrication service
  - Cooling system service
  - Fuel system inspection

## 💰 Cost Sources and Calculation

### **1. Database-Driven Costs (Primary Source)**
- **Field**: `pm_cost_estimate` in `equipment` table
- **Source**: Direct cost estimate stored per equipment
- **Priority**: Highest - used if available

### **2. Equipment Type Multipliers**
- **Field**: `pm_cost_multiplier` in `equipment` table
- **Multipliers**:
  - **Heavy Machinery** (Excavator, Bulldozer, Crane, Forklift): 1.50x
  - **Transport Vehicles** (Truck, Car, Van, Bus): 1.25x
  - **Light Equipment** (Generator, Compressor, Pump): 1.00x
  - **Tools & Small Equipment** (Drill, Saw, Welder): 0.75x

### **3. PM Class Default Costs (Fallback)**
- **Class A**: $500
- **Class B**: $1,500
- **Class C**: $3,000
- **Default**: $800

### **4. Cost Calculation Formula**
```
Final Cost = (Database Cost OR PM Class Default) × Equipment Type Multiplier
```

## 📊 Data Flow

### **Database Tables**
1. **`equipment`** - Main equipment data with PM fields
2. **`preventive_maintenance_types`** - PM class definitions and standard costs
3. **`preventive_maintenance_configs`** - Equipment type-specific configurations

### **Frontend Processing**
1. **Fetch Equipment**: Query equipment with PM fields
2. **Calculate Costs**: Apply cost calculation formula
3. **Display**: Show costs with source indicators

## 🔧 Database Schema

### **Equipment Table PM Fields**
```sql
-- PM Classification
pm_class TEXT -- 'Class A', 'Class B', 'Class C'
pm_frequency_days INTEGER -- Days between PM cycles
pm_frequency_hours INTEGER -- Hours between PM cycles

-- Cost Fields
pm_cost_estimate DECIMAL(10,2) -- Direct cost estimate
pm_cost_multiplier DECIMAL(3,2) -- Equipment type multiplier

-- Schedule Fields
last_pm_date TIMESTAMP -- Last PM completion date
next_pm_date TIMESTAMP -- Next PM due date

-- PM Status
is_pm BOOLEAN -- Whether equipment is enrolled in PM
```

### **PM Types Table**
```sql
CREATE TABLE preventive_maintenance_types (
  maintenance_type TEXT PRIMARY KEY, -- 'Class A', 'Class B', 'Class C'
  description TEXT NOT NULL,
  standard_cost DECIMAL(10,2) NOT NULL,
  estimated_hours INTEGER NOT NULL,
  frequency_days INTEGER NOT NULL,
  checklist_items TEXT[] NOT NULL,
  spare_parts TEXT[] NOT NULL
);
```

## 🎯 Implementation Steps

### **1. Run Database Enhancement Script**
```sql
-- Execute: fix_pm_classification_and_costs.sql
-- This will:
-- - Create PM type definitions
-- - Add missing fields to equipment table
-- - Set default PM classifications
-- - Calculate cost estimates
-- - Create performance indexes
```

### **2. Update Frontend**
- Enhanced PM Dashboard shows:
  - PM class descriptions
  - Cost source indicators (Database vs Default)
  - Equipment type multipliers
  - Detailed service scopes

### **3. Verification**
- Run verification queries to ensure:
  - All PM equipment have classifications
  - Cost estimates are calculated
  - Next PM dates are set

## 📈 PM Forecasting Features

### **Time Periods**
- **Week**: Next 7 days
- **Month**: Next 30 days  
- **Quarter**: Next 90 days
- **Year**: Next 365 days

### **Forecast Data**
- Equipment due for PM in each period
- Total estimated costs
- Average cost per equipment
- PM class distribution

### **Business Planning**
- **Procurement**: Plan spare parts and materials
- **Budgeting**: Estimate cash flow requirements
- **Replacement**: Identify equipment needing major service

## 🔍 Troubleshooting

### **Missing PM Classifications**
```sql
-- Check equipment without PM class
SELECT COUNT(*) FROM equipment 
WHERE is_pm = true AND (pm_class IS NULL OR pm_class = '');
```

### **Missing Cost Estimates**
```sql
-- Check equipment without cost estimates
SELECT COUNT(*) FROM equipment 
WHERE is_pm = true AND pm_cost_estimate IS NULL;
```

### **Cost Source Verification**
```sql
-- Check cost sources
SELECT 
  name,
  pm_class,
  pm_cost_estimate,
  CASE 
    WHEN pm_cost_estimate IS NOT NULL THEN 'Database'
    ELSE 'Default'
  END as cost_source
FROM equipment 
WHERE is_pm = true;
```

## 📝 Notes

- **Cost Accuracy**: Database costs are more accurate than defaults
- **Equipment Types**: Different equipment types have different cost multipliers
- **PM Classes**: Each class represents a different service level and scope
- **Forecasting**: Helps with procurement, budgeting, and replacement planning
- **Flexibility**: System supports both standard and custom cost estimates 