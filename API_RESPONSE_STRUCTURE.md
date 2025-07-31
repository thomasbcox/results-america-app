# API Response Structure Guidelines

## ✅ Correct Response Structure

### Success Responses
```typescript
// ✅ Good - Flattened structure
{
  "success": true,
  "message": "Operation completed successfully",
  "users": [...],
  "pagination": {...}
}

// ✅ Good - Single entity
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Error Responses
```typescript
// ✅ Good - Consistent error structure
{
  "success": false,
  "error": "Error message",
  "code": "VALIDATION_ERROR",
  "statusCode": 400
}
```

## ❌ Incorrect Response Structure

### Avoid Double Nesting
```typescript
// ❌ Bad - Double nesting with data.data
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {...}
  }
}
```

## Implementation Guidelines

### 1. Use `createSuccessResponse` with explicit properties
```typescript
// ✅ Good
return createSuccessResponse({
  users: result.users,
  pagination: result.pagination,
});

// ❌ Bad - Don't pass raw objects
return createSuccessResponse(result);
```

### 2. Frontend Access Pattern
```typescript
// ✅ Good - Direct access
const users = data.users;
const pagination = data.pagination;

// ❌ Bad - Double access
const users = data.data.users;
const pagination = data.data.pagination;
```

### 3. TypeScript Types
```typescript
// ✅ Good - Use FlattenedResponse type
const response: FlattenedResponse<UserData> = {
  success: true,
  user: userData
};

// ❌ Bad - Avoid nested data structures
const response = {
  success: true,
  data: { user: userData }
};
```

## ESLint Rules

The project includes ESLint rules to prevent `data.data` patterns:
- `no-restricted-properties` rule prevents `data.data` access
- Pre-commit hooks check for `data.data` patterns
- TypeScript types enforce flattened structures

## Migration Checklist

When updating APIs:
1. ✅ Use explicit property spreading in `createSuccessResponse`
2. ✅ Update frontend to access properties directly
3. ✅ Add TypeScript types for response structure
4. ✅ Test with curl to verify structure
5. ✅ Update tests to expect flattened structure 