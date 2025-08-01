# Hydration Mismatch Prevention Guide

## Overview

This document outlines the systematic approach to prevent hydration mismatches in our Next.js application. Hydration mismatches occur when the server-rendered HTML doesn't match what the client renders, causing React to throw errors and potentially break the user experience.

## Root Causes

### 1. Context Values Differ Between Server and Client
- **Problem**: Context values (like `selectedStates`, `selectedCategory`, `selectedMeasure`) are `null` during SSR but populated from `sessionStorage` on the client
- **Impact**: High - causes immediate hydration failures
- **Files Affected**: All pages using `useSelection()` context

### 2. Browser-Only APIs Used During SSR
- **Problem**: `window`, `localStorage`, `sessionStorage`, `document` are not available during SSR
- **Impact**: High - causes runtime errors
- **Files Affected**: Context provider, admin layout, various components

### 3. Dynamic Values in JSX
- **Problem**: `Date.now()`, `Math.random()`, or other dynamic values that differ between server/client
- **Impact**: Medium - causes hydration mismatches
- **Files Affected**: Any component using dynamic values

## Prevention Strategy

### 1. Use Hydration Utilities

We've created utilities in `src/lib/utils/hydrationUtils.ts`:

```typescript
// For components that depend on context values
import { ClientOnly, useSafeContextValue } from "@/lib/utils/hydrationUtils"

// Use safe context values
const safeSelectedStates = useSafeContextValue(selectedStates)
const safeSelectedCategory = useSafeContextValue(selectedCategory)

// Wrap problematic JSX
<ClientOnly fallback={<div>Loading...</div>}>
  <span>{safeSelectedCategory || 'Select Category'}</span>
</ClientOnly>
```

### 2. Safe Context Access Pattern

```typescript
// ❌ Bad - direct context usage
const { selectedStates, selectedCategory } = useSelection()
return <span>{selectedCategory}</span>

// ✅ Good - safe context usage
const { selectedStates, selectedCategory } = useSelection()
const safeSelectedCategory = useSafeContextValue(selectedCategory)
return (
  <ClientOnly fallback={<span>Loading...</span>}>
    <span>{safeSelectedCategory || 'Select Category'}</span>
  </ClientOnly>
)
```

### 3. Browser API Safety

```typescript
// ❌ Bad - direct browser API usage
const user = localStorage.getItem('user')

// ✅ Good - safe browser API usage
const [user, setUser] = useState(null)
useEffect(() => {
  const savedUser = localStorage.getItem('user')
  setUser(savedUser)
}, [])
```

## Implementation Status

### ✅ Fixed
- `src/app/results/page.tsx` - Updated to use `ClientOnly` and `useSafeContextValue`

### 🔴 High Priority - Need Fixing
- `src/app/states/page.tsx` - Uses `selectedStates.length` directly in JSX
- `src/app/category/page.tsx` - Uses `selectedCategory` directly in JSX  
- `src/app/measure/page.tsx` - Uses `selectedMeasure` directly in JSX
- `src/lib/context.tsx` - Uses `sessionStorage`/`localStorage` during SSR
- `src/app/admin/layout.tsx` - Uses `window` and `document` during SSR

### 🟡 Medium Priority
- Various test files using browser APIs
- Admin data page using context values

## Testing Strategy

### 1. Automated Detection
Run the hydration audit script:
```bash
npm run audit:hydration
```

### 2. Manual Testing
1. Open browser dev tools
2. Navigate to pages using context
3. Check console for hydration errors
4. Verify no "Hydration failed" messages

### 3. Test Coverage
- Unit tests for hydration utilities
- Integration tests for pages with context
- E2E tests for user flows

## Prevention Checklist

### For New Components
- [ ] Does the component use context values?
- [ ] Are context values wrapped in `ClientOnly`?
- [ ] Are context values accessed via `useSafeContextValue`?
- [ ] Are browser APIs used safely (in `useEffect`)?

### For Existing Components
- [ ] Audit for direct context usage in JSX
- [ ] Replace with `ClientOnly` wrapper
- [ ] Use `useSafeContextValue` for context access
- [ ] Move browser API calls to `useEffect`

### For Context Providers
- [ ] Are browser APIs used during SSR?
- [ ] Are they wrapped in `useEffect`?
- [ ] Do they have proper fallbacks?

## Quick Fix Template

For any component with hydration issues:

```typescript
import { ClientOnly, useSafeContextValue } from "@/lib/utils/hydrationUtils"

export default function MyComponent() {
  const { selectedStates, selectedCategory } = useSelection()
  
  // Use safe context values
  const safeSelectedStates = useSafeContextValue(selectedStates)
  const safeSelectedCategory = useSafeContextValue(selectedCategory)
  
  return (
    <div>
      {/* Wrap problematic content */}
      <ClientOnly fallback={<div>Loading...</div>}>
        <span>{safeSelectedCategory || 'Select Category'}</span>
        <span>{safeSelectedStates?.length || 0} states selected</span>
      </ClientOnly>
    </div>
  )
}
```

## Monitoring

### 1. Development
- Watch browser console for hydration errors
- Run audit script regularly
- Test on different devices/browsers

### 2. Production
- Monitor error tracking for hydration failures
- Set up alerts for hydration mismatches
- Regular audits of new code

## Future Improvements

1. **ESLint Rules**: Add custom rules to detect hydration issues
2. **TypeScript**: Add types to prevent unsafe context usage
3. **Pre-commit Hooks**: Run hydration audit before commits
4. **CI/CD**: Include hydration tests in build pipeline

## Resources

- [Next.js Hydration Documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Guide](https://react.dev/reference/react-dom/hydrate)
- [Our Hydration Utilities](../src/lib/utils/hydrationUtils.ts)
- [Hydration Audit Script](../scripts/audit-hydration-mismatches.ts) 