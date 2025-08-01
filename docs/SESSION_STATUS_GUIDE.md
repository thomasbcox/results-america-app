# Session Status Guide

## Overview

The Import Sessions system uses a coherent status system to track the state of data imports and their visibility to users.

## Status Definitions

### 🟢 Active
- **Meaning**: Data is successfully imported and visible to users in charts and comparisons
- **Conditions**: Has data points AND `isActive = 1`
- **Icon**: ✅ CheckCircle (green)
- **Badge**: "Active" (default variant)
- **Actions Available**: Deactivate, Delete

### 🟡 Inactive  
- **Meaning**: Data is successfully imported but hidden from users
- **Conditions**: Has data points AND `isActive = 0`
- **Icon**: ⏸️ Pause (yellow)
- **Badge**: "Inactive" (secondary variant)
- **Actions Available**: Activate, Delete

### 🔴 Failed
- **Meaning**: Import failed - no data was stored despite expecting data
- **Conditions**: Expected data points > 0, but actual data points = 0
- **Icon**: ❌ XCircle (red)
- **Badge**: "Failed" (destructive variant)
- **Actions Available**: Delete only

### ⚪ Empty
- **Meaning**: No data expected or imported
- **Conditions**: Expected data points = 0, actual data points = 0
- **Icon**: ⚠️ AlertCircle (gray)
- **Badge**: "Empty" (outline variant)
- **Actions Available**: Delete only

## Status Logic

```typescript
if (actualDataPoints > 0) {
  sessionStatus = isActive === 1 ? 'active' : 'inactive';
} else if (expectedData > 0) {
  sessionStatus = 'failed';  // Expected data but none imported
} else {
  sessionStatus = 'empty';   // No data expected
}
```

## Data Point Information

### Display Fields
- **Data Points**: Actual count of data points in database
- **Expected**: Expected count from import metadata (shown if different from actual)
- **View Button**: Click to inspect actual data rows

### Discrepancies
When "Expected" differs from "Data Points":
- **Expected > Data Points**: Partial import or import failure
- **Expected = Data Points**: Successful import
- **Expected = 0**: No metadata available

## Action Buttons

### Activate ▶️
- **Purpose**: Make data visible to users
- **Available**: Only for "inactive" sessions
- **Effect**: Sets `isActive = 1`

### Deactivate ⏸️
- **Purpose**: Hide data from users (preserves data)
- **Available**: Only for "active" sessions  
- **Effect**: Sets `isActive = 0`

### Delete 🗑️
- **Purpose**: Permanently remove data and session
- **Available**: All sessions
- **Effect**: Deletes all data points and session record
- **Confirmation**: Shows count of data points to be deleted

## User Impact

### Active Sessions
- Data appears in charts and comparisons
- Users can see and compare this data
- Affects aggregation calculations

### Inactive Sessions
- Data is preserved but hidden from users
- No impact on user-facing features
- Can be reactivated later

### Failed/Empty Sessions
- No impact on user experience
- Can be safely deleted
- May indicate import issues to investigate

## Technical Implementation

### Database Schema
```sql
import_sessions (
  id,
  name,
  description,
  isActive,        -- 1 = active, 0 = inactive
  recordCount,     -- Expected data points
  importDate,
  ...
)

data_points (
  id,
  importSessionId, -- Links to import_sessions
  value,
  stateId,
  statisticId,
  year,
  ...
)
```

### API Endpoints
- `GET /api/admin/import-sessions` - List all sessions with status
- `PATCH /api/admin/import-sessions` - Activate/deactivate/delete
- `GET /api/admin/import-sessions/[id]/data-points` - View session data

### Frontend Components
- Status icons and badges
- Action buttons based on status
- Data point count with view modal
- Help section explaining statuses 