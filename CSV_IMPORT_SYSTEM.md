# CSV Import System

## Overview

The CSV Import System provides a comprehensive workflow for uploading, validating, staging, and publishing CSV data with full metadata tracking. This system replaces the need for external API integrations and gives you complete control over your data import process.

## Features

### ✅ **Complete Import Workflow**
- **Upload**: Drag-and-drop CSV file upload with template selection
- **Staging**: Data is parsed and stored in staging tables for review
- **Validation**: Multi-level validation (schema, business rules, data quality)
- **Publishing**: One-click publishing to make data available to users
- **History**: Complete audit trail of all imports

### ✅ **Template System**
- Pre-defined templates for common data sources (BEA, BLS, Census)
- Custom validation rules per template
- Sample data for testing
- Flexible column mapping

### ✅ **Data Quality Controls**
- Schema validation (column types, required fields)
- Business rule validation (state names, year ranges, value ranges)
- Duplicate detection
- Data quality warnings (negative values, outliers)

### ✅ **Metadata Tracking**
- Full import history with status tracking
- Source attribution and provenance
- User tracking (who uploaded what)
- Import session management

## Database Schema

### Core Tables

#### `csv_imports`
- Main import records with status tracking
- File metadata (name, size, hash for deduplication)
- Import metadata (source, year, description)

#### `csv_import_staging`
- Raw CSV data before processing
- Validation status per row
- Mapping to internal database entities

#### `csv_import_templates`
- Predefined templates for different data types
- Schema definitions and validation rules
- Sample data for testing

#### `csv_import_metadata`
- Flexible metadata storage for imports
- Key-value pairs for source attribution

#### `csv_import_validation`
- Validation results and error tracking
- Multiple validation types (schema, business rules, etc.)

## Usage Guide

### 1. Access the Admin Interface

Navigate to `/admin/data` in your browser. You'll see three tabs:

- **Upload Data**: Upload new CSV files
- **Import History**: View and manage previous imports
- **Templates**: Browse available import templates

### 2. Upload a CSV File

1. **Select Template**: Choose from available templates (BEA GDP, BLS Employment, Census Population, Generic)
2. **Upload File**: Select your CSV file (max 10MB)
3. **Add Metadata**: Provide import name, data source, year, and description
4. **Upload**: Click "Upload and Stage Data"

### 3. Validate Data

1. Go to **Import History** tab
2. Find your uploaded file (status: "staged")
3. Click **"Validate"** button
4. Review validation results and warnings

### 4. Publish Data

1. After successful validation (status: "validated")
2. Click **"Publish"** button
3. Confirm the action
4. Data becomes available to users

## Template System

### Available Templates

#### BEA GDP Template
- **Columns**: State, Year, GDP_Millions
- **Validation**: State names, years 2010-2030, positive GDP values
- **Sample**: California,2023,3500000

#### BLS Employment Template
- **Columns**: State, Year, Employment_Thousands
- **Validation**: State names, years 2010-2030, reasonable employment values
- **Sample**: California,2023,18500

#### Census Population Template
- **Columns**: State, Year, Population_Thousands
- **Validation**: State names, years 2010-2030, reasonable population values
- **Sample**: California,2023,39000

#### Generic Data Template
- **Columns**: State, Year, Value, Notes
- **Validation**: Flexible validation rules
- **Sample**: California,2023,100.5,Example metric

### Creating Custom Templates

Templates are stored in the `csv_import_templates` table with:

- **Schema Definition**: JSON defining expected columns and types
- **Validation Rules**: JSON defining validation logic
- **Sample Data**: CSV sample for testing

## API Endpoints

### Upload
```
POST /api/admin/csv-upload
Content-Type: multipart/form-data

- file: CSV file
- templateId: Template ID
- metadata: JSON metadata
```

### History
```
GET /api/admin/csv-imports
GET /api/admin/csv-imports?limit=50
```

### Validation
```
POST /api/admin/csv-imports/{id}/validate
```

### Publishing
```
POST /api/admin/csv-imports/{id}/publish
```

### Templates
```
GET /api/admin/csv-templates
```

## Validation System

### Validation Levels

1. **Schema Validation**
   - Column presence and types
   - Required field validation
   - Data type conversion

2. **Business Rule Validation**
   - State name matching
   - Year range validation
   - Value range validation

3. **Data Quality Validation**
   - Duplicate detection
   - Outlier detection
   - Negative value warnings

4. **Custom Validation**
   - Template-specific rules
   - Regex pattern matching
   - Enum value validation

### Validation Rules

```json
{
  "stateName": [
    {
      "type": "regex",
      "value": "^[A-Za-z\\s]+$",
      "message": "State name must contain only letters and spaces"
    }
  ],
  "year": [
    {
      "type": "range",
      "value": {"min": 2010, "max": 2030},
      "message": "Year must be between 2010 and 2030"
    }
  ],
  "value": [
    {
      "type": "range",
      "value": {"min": 0, "max": 10000000},
      "message": "GDP value must be positive and reasonable"
    }
  ]
}
```

## Import Status Flow

```
uploaded → staged → validated → published
    ↓         ↓         ↓
  failed   failed    failed
```

### Status Descriptions

- **uploaded**: File uploaded, processing started
- **staged**: Data parsed and stored in staging tables
- **validated**: All validations passed
- **published**: Data moved to production tables
- **failed**: Error occurred during processing

## Best Practices

### 1. Data Preparation
- Use consistent state names (match database exactly)
- Ensure years are in expected range
- Validate numeric values before upload
- Include all required columns

### 2. Template Selection
- Choose the most specific template for your data
- Use Generic template for custom data
- Review template validation rules before upload

### 3. Validation Review
- Always review validation results
- Address warnings before publishing
- Check for data quality issues

### 4. Metadata
- Provide clear, descriptive import names
- Include data source attribution
- Add meaningful descriptions

## Troubleshooting

### Common Issues

#### "State not found" Errors
- Ensure state names match exactly (e.g., "California" not "CA")
- Check for extra spaces or special characters

#### "Year out of range" Errors
- Ensure years are between 2010-2030
- Check for incorrect date formats

#### "Value validation failed" Errors
- Check for negative values where not expected
- Verify values are within reasonable ranges
- Look for non-numeric values in numeric columns

#### "Duplicate file detected"
- The system prevents duplicate uploads
- Use different file names or modify the data

### Getting Help

1. Check the validation results for specific error messages
2. Review the template requirements
3. Use the sample data as a reference
4. Contact system administrator for template modifications

## Security Considerations

- File size limits (10MB max)
- File type validation (CSV only)
- User authentication required
- Audit trail for all operations
- No direct database access

## Performance

- Bulk operations for staging and publishing
- Efficient validation with early termination
- Indexed queries for history and status checks
- File deduplication to prevent waste

## Future Enhancements

- **Batch Processing**: Multiple file uploads
- **Scheduled Imports**: Automated data updates
- **Advanced Validation**: Machine learning for outlier detection
- **Data Transformation**: Pre-processing rules
- **Export Templates**: Download data in various formats
- **API Integration**: Direct connections to data sources 