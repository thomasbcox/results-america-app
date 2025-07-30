# API Response Structure

## Overview

All API endpoints in Results America follow a consistent response structure for both success and error cases.

## Success Response Format

```typescript
{
  "success": true,
  "data": T,  // The actual data (array, object, or primitive)
  "message"?: string  // Optional success message
}
```

### Examples

#### States API
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alabama",
      "abbreviation": "AL",
      "isActive": 1
    },
    {
      "id": 2,
      "name": "Alaska", 
      "abbreviation": "AK",
      "isActive": 1
    }
  ]
}
```

#### Categories API
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Education",
      "description": "Education statistics and metrics",
      "icon": "graduation-cap",
      "sortOrder": 1,
      "isActive": 1
    }
  ]
}
```

#### Statistics API
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "High School Graduation Rate",
      "description": "Percentage of students who graduate high school",
      "unit": "percentage",
      "categoryId": 1,
      "categoryName": "Education",
      "isActive": 1
    }
  ]
}
```

## Error Response Format

```typescript
{
  "success": false,
  "error": string,
  "code"?: string,
  "details"?: Record<string, unknown>
}
```

### Examples

#### Validation Error
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "page",
    "value": -1,
    "constraint": "must be >= 1"
  }
}
```

#### Not Found Error
```json
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND"
}
```

## Pagination (Optional)

When pagination is used, the response includes pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Frontend Usage

### TypeScript Types
```typescript
import { ApiResponse } from '@/types/api';

// For states endpoint
const response: ApiResponse<StateData[]> = await fetch('/api/states');
const states = response.data; // Direct access to array

// For single state endpoint  
const response: ApiResponse<StateData> = await fetch('/api/states/1');
const state = response.data; // Direct access to object
```

### JavaScript Usage
```javascript
const response = await fetch('/api/states');
const result = await response.json();

if (result.success) {
  const states = result.data; // Direct access
  console.log(`Found ${states.length} states`);
} else {
  console.error('API Error:', result.error);
}
```

## Migration Notes

### Before (Old Structure)
```json
{
  "success": true,
  "data": {
    "data": [...],  // ❌ Confusing nested structure
    "pagination": {...}
  }
}
```

### After (New Structure)
```json
{
  "success": true,
  "data": [...],  // ✅ Clean, flat structure
  "pagination": {...}  // ✅ Optional, only when needed
}
```

## Benefits

1. **Consistent**: All endpoints follow the same pattern
2. **Simple**: Direct access to data without nesting
3. **Type-safe**: Clear TypeScript interfaces
4. **RESTful**: Follows REST API best practices
5. **Flexible**: Optional pagination and metadata 