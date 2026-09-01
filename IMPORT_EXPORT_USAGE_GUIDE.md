# Import/Export Usage Guide - QR-Based ERP System

## Overview
This guide provides step-by-step instructions for using the corrected import/export functionality for Employee, Equipment, Materials, and Sites registration.

## Quick Start

### 1. Download Templates
1. Navigate to the Registration page
2. Select the entity type (Employee, Equipment, Materials, or Sites)
3. Click the "Download Template" button
4. Save the Excel file to your computer

### 2. Fill Template
1. Open the downloaded Excel file
2. Fill in the required fields (marked with * in the template)
3. Follow the data format guidelines below
4. Save the file

### 3. Import Data
1. Click the "Import Data" button
2. Select your filled Excel file
3. Review the validation results
4. Confirm the import

## Data Format Guidelines

### Employee Template Fields

| Field | Required | Type | Description | Example |
|-------|----------|------|-------------|---------|
| name | Yes | Text | Full name of employee | "John Doe" |
| type | No | Text | Employment type | "full-time", "part-time", "contract" |
| department | Yes | Text | Department name | "Construction", "Engineering" |
| position | Yes | Text | Job position | "Site Engineer", "Foreman" |
| blood_group | No | Text | Blood group | "O+", "A-", "B+" |
| site | Yes | Text | Site ID | "site-001" |
| email | No | Email | Email address | "john.doe@company.com" |
| phone | No | Text | Phone number | "+966501234567" |
| hourly_rate | No | Number | Hourly rate | 25.00 |

### Equipment Template Fields

| Field | Required | Type | Description | Example |
|-------|----------|------|-------------|---------|
| name | Yes | Text | Equipment name | "Asphalt Paver" |
| type | Yes | Text | Equipment type | "Heavy Machinery", "Tools" |
| model | Yes | Text | Model number | "CAT AP655F" |
| site | Yes | Text | Site ID | "site-001" |
| serial_number | No | Text | Serial number | "AP655F-2024-001" |
| operational_status | No | Text | Status | "working", "maintenance", "broken" |
| hourly_rate | No | Number | Hourly rate | 150.00 |

### Materials Template Fields

| Field | Required | Type | Description | Example |
|-------|----------|------|-------------|---------|
| name | Yes | Text | Material name | "Bitumen (60/70)" |
| type | Yes | Text | Material type | "Bituminous Materials", "Aggregates" |
| unit | Yes | Text | Unit of measurement | "Tons", "Cubic Meters" |
| site | Yes | Text | Site ID | "site-001" |
| quantity | No | Number | Available quantity | 150 |
| use | No | Text | Material usage | "Main binder in asphalt mix" |
| cost | No | Number | Unit cost | 2500.00 |

### Sites Template Fields

| Field | Required | Type | Description | Example |
|-------|----------|------|-------------|---------|
| name | Yes | Text | Site name | "Al Khobar Construction Site" |
| province | Yes | Text | Province name | "Eastern Province" |
| address | Yes | Text | Full address | "Al Khobar, Eastern Province" |
| manager | Yes | Text | Site manager name | "Ahmed Al-Rashid" |
| coordinates | No | Text | GPS coordinates | "(50.2089,26.2172)" |
| type | No | Text | Site type | "Construction Site", "Office" |

## Validation Rules

### General Rules
- **Required Fields**: Must not be empty
- **Text Fields**: Maximum 255 characters
- **Email Fields**: Must be valid email format
- **Phone Fields**: Should include country code
- **Number Fields**: Must be numeric values
- **Date Fields**: Use ISO format (YYYY-MM-DDTHH:mm:ssZ)

### Specific Validation Rules

#### Employees
- `name`: Required, 2-100 characters
- `department`: Required, must exist in departments table
- `position`: Required, 2-100 characters
- `site`: Required, must exist in sites table
- `email`: Optional, must be unique if provided
- `phone`: Optional, must be unique if provided

#### Equipment
- `name`: Required, 2-100 characters
- `type`: Required, must be valid equipment type
- `model`: Required, 2-100 characters
- `site`: Required, must exist in sites table
- `serial_number`: Optional, must be unique if provided

#### Materials
- `name`: Required, 2-100 characters
- `type`: Required, must be valid material type
- `unit`: Required, must be valid unit
- `site`: Required, must exist in sites table
- `quantity`: Optional, must be non-negative number

#### Sites
- `name`: Required, 2-100 characters
- `province`: Required, must be valid Saudi province
- `address`: Required, 5-500 characters
- `manager`: Required, 2-100 characters

## Error Handling

### Common Import Errors

#### 1. Missing Required Fields
```
Error: Required field 'name' is missing in row 3
Solution: Fill in the missing field and re-import
```

#### 2. Invalid Data Types
```
Error: Field 'hourly_rate' must be a number in row 5
Solution: Ensure the field contains only numeric values
```

#### 3. Duplicate Values
```
Error: Email 'john.doe@company.com' already exists
Solution: Use a unique email address or update existing record
```

#### 4. Foreign Key Violations
```
Error: Site 'invalid-site' does not exist
Solution: Use a valid site ID that exists in the system
```

### Error Resolution Steps

1. **Review Error Messages**: Check the import results for specific error details
2. **Fix Data Issues**: Correct the data in your Excel file
3. **Re-import**: Try importing again with corrected data
4. **Partial Import**: If some rows fail, the successful rows will still be imported

## Best Practices

### Data Preparation
1. **Use Templates**: Always start with the provided templates
2. **Validate Data**: Check your data before importing
3. **Backup**: Keep a backup of your original data
4. **Test Import**: Test with a small dataset first

### File Management
1. **File Format**: Use Excel (.xlsx) format only
2. **File Size**: Keep files under 10MB for better performance
3. **Encoding**: Use UTF-8 encoding for special characters
4. **Naming**: Use descriptive file names with dates

### Import Process
1. **Review Data**: Check all data before importing
2. **Validate**: Use the validation feature before final import
3. **Monitor**: Watch the import progress
4. **Verify**: Check the imported data after completion

## Troubleshooting

### Import Fails Completely
1. Check file format (must be .xlsx)
2. Verify file size (under 10MB)
3. Ensure all required fields are filled
4. Check for special characters in data

### Partial Import Success
1. Review error messages for failed rows
2. Fix the data issues in those rows
3. Re-import only the failed rows
4. Or re-import the entire file after fixes

### Performance Issues
1. Reduce file size by splitting large imports
2. Close other applications to free memory
3. Use a stable internet connection
4. Try importing during off-peak hours

### Data Not Appearing
1. Check if import completed successfully
2. Refresh the page to see new data
3. Check filters and search settings
4. Verify you're looking at the correct entity type

## Support

If you encounter issues not covered in this guide:

1. **Check Error Messages**: Look for specific error details
2. **Review Data**: Ensure your data follows the format guidelines
3. **Test with Template**: Try importing the template file to verify functionality
4. **Contact Support**: Provide error messages and sample data for assistance

## Example Files

### Sample Employee Data
```csv
name,type,department,position,blood_group,site,email,phone,hourly_rate
John Doe,full-time,Construction,Site Engineer,O+,site-001,john.doe@company.com,+966501234567,25.00
Jane Smith,part-time,Engineering,Assistant Engineer,A-,site-002,jane.smith@company.com,+966502345678,20.00
```

### Sample Equipment Data
```csv
name,type,model,site,serial_number,operational_status,hourly_rate
Asphalt Paver,Heavy Machinery,CAT AP655F,site-001,AP655F-2024-001,working,150.00
Excavator,Heavy Machinery,Komatsu PC200,site-002,PC200-2024-002,working,120.00
```

### Sample Materials Data
```csv
name,type,unit,site,quantity,use,cost
Bitumen (60/70),Bituminous Materials,Tons,site-001,150,Main binder in asphalt mix,2500.00
Aggregate 3/4",Aggregates,Cubic Meters,site-002,500,Base material for roads,180.00
```

### Sample Sites Data
```csv
name,province,address,manager,coordinates,type
Al Khobar Construction Site,Eastern Province,Al Khobar Eastern Province,Ahmed Al-Rashid,"(50.2089,26.2172)",Construction Site
Riyadh Office Site,Riyadh Province,Riyadh Central District,Sarah Johnson,"(46.6753,24.7136)",Office
``` 