# Multi Year Export CSV Format

## Overview

The **Multi Year Export** format is designed to import data from legacy system exports that include foreign key columns. This format allows you to import data while ignoring the legacy system's internal IDs and foreign key references.

## CSV Format

### Required Columns (in order)

| Column | Description | Required | Notes |
|--------|-------------|----------|-------|
| ID | Legacy system record ID | No | **IGNORED** - Not used in import |
| State | State name (e.g., "Texas", "California") | Yes | Must match existing state names |
| Year | Data year (e.g., 2023, 2022) | Yes | Must be between 1990-2030 |
| Category | Category name (e.g., "Economy", "Education") | Yes | Must match existing category names |
| Measure Name | Statistic/measure name (e.g., "Net Job Growth") | Yes | Must match existing statistic names |
| Value | Numeric data value | Yes | Must be a valid number |
| state_id | Legacy system state ID | No | **IGNORED** - Not used in import |
| category_id | Legacy system category ID | No | **IGNORED** - Not used in import |
| measure_id | Legacy system measure ID | No | **IGNORED** - Not used in import |

### Example CSV

```csv
ID,State,Year,Category,Measure Name,Value,state_id,category_id,measure_id
1,Texas,2023,Economy,Net Job Growth,125000,1,2,15
2,California,2023,Economy,Net Job Growth,98000,2,2,15
3,Texas,2022,Economy,Net Job Growth,110000,1,2,15
4,California,2022,Economy,Net Job Growth,85000,2,2,15
5,Texas,2023,Education,Graduation Rate,89.1,1,1,8
6,California,2023,Education,Graduation Rate,85.2,2,1,8
```

## How to Use

### 1. Prepare Your Data

1. Export your data from the legacy system in the format shown above
2. Ensure state names match exactly (e.g., "Texas" not "TX")
3. Ensure category names match exactly (e.g., "Economy" not "Economic")
4. Ensure measure names match exactly (e.g., "Net Job Growth" not "Job Growth")

### 2. Import via Admin Interface

1. Go to the Admin Data page
2. Select "Multi Year Export" template
3. Upload your CSV file or paste the data
4. Fill in the import metadata:
   - **Name**: Descriptive name for this import
   - **Description**: Optional description
   - **Data Source**: Source of the data
   - **Statistic Name**: Optional statistic name

### 3. Validation Process

The system will:

1. **Validate Headers**: Ensure all required columns are present
2. **Validate Data Types**: Check that Year is numeric and Value is numeric
3. **Validate References**: Ensure State, Category, and Measure Name exist in the database
4. **Business Rules**: Check that Year is reasonable (1990-2030) and Value is positive
5. **Import Data**: Create data points for valid rows

### 4. Import Results

After import, you'll see:
- **Total Rows**: Number of rows in the CSV
- **Valid Rows**: Number of successfully imported rows
- **Error Rows**: Number of rows with validation errors
- **Error Details**: Specific validation errors for failed rows

## Validation Rules

### Required Fields
- State, Year, Category, Measure Name, Value must not be empty

### Data Type Validation
- **Year**: Must be a number between 1990-2030
- **Value**: Must be a valid numeric value
- **State**: Must match an existing state name (case-insensitive)
- **Category**: Must match an existing category name (case-insensitive)
- **Measure Name**: Must match an existing statistic name (case-insensitive)

### Business Rules
- Year cannot be in the future
- Value must be positive (negative values not allowed)
- State, Category, and Measure Name combinations must exist in the database

## Error Handling

### Common Errors

1. **Missing Required Field**: "Row X: Missing required field 'State'"
2. **Invalid Data Type**: "Row X: Invalid data type for 'value' - expected numeric, got 'abc'"
3. **Invalid Reference**: "Row X: Invalid state 'InvalidState' - not found in database"
4. **Business Rule Violation**: "Row X: Future year not allowed - got 2035"

### Error Categories

- **missing_required**: Required fields are empty
- **data_type**: Invalid data types (non-numeric values)
- **invalid_reference**: State/Category/Measure not found in database
- **business_rule**: Violations of business rules (future years, negative values)

## Legacy System Compatibility

This format is specifically designed for importing data from legacy systems that:

1. **Include Internal IDs**: The legacy system's internal record IDs
2. **Include Foreign Keys**: References to the legacy system's internal tables
3. **Use Text Names**: State, Category, and Measure names as text rather than IDs

The import process will:
- ✅ **Use**: State names, Category names, Measure names, Year, Value
- ❌ **Ignore**: ID, state_id, category_id, measure_id columns

## Example Use Cases

### Legacy System Migration
```csv
ID,State,Year,Category,Measure Name,Value,state_id,category_id,measure_id
1001,Texas,2023,Economy,GDP Growth,3.2,1,2,15
1002,California,2023,Economy,GDP Growth,2.8,2,2,15
```

### Multi-Year Data Import
```csv
ID,State,Year,Category,Measure Name,Value,state_id,category_id,measure_id
1,Texas,2020,Economy,Unemployment Rate,8.2,1,2,10
2,Texas,2021,Economy,Unemployment Rate,6.5,1,2,10
3,Texas,2022,Economy,Unemployment Rate,4.1,1,2,10
4,Texas,2023,Economy,Unemployment Rate,3.9,1,2,10
```

### Cross-Category Data
```csv
ID,State,Year,Category,Measure Name,Value,state_id,category_id,measure_id
1,Texas,2023,Economy,GDP Growth,3.2,1,2,15
2,Texas,2023,Education,Graduation Rate,89.1,1,1,8
3,Texas,2023,Health,Life Expectancy,78.5,1,3,12
```

## Troubleshooting

### State Name Issues
- Use full state names: "Texas" not "TX"
- Check for extra spaces: "Texas " vs "Texas"
- Use proper capitalization: "Texas" not "texas"

### Category Name Issues
- Use exact category names: "Economy" not "Economic"
- Check for typos: "Education" not "Eduction"

### Measure Name Issues
- Use exact statistic names: "Net Job Growth" not "Job Growth"
- Check for extra spaces or punctuation

### Data Type Issues
- Ensure Year is a number: "2023" not "2023.0" or "2023.5"
- Ensure Value is a number: "125000" not "125,000" or "125k" 