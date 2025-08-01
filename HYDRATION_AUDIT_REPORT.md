# Hydration Mismatch Audit Report

Generated: 2025-08-01T13:59:37.617Z

## Summary
- High Priority Issues: 123
- Medium Priority Issues: 204
- Low Priority Issues: 0
- Total Issues: 327

## 🔴 High Priority Issues

### src/app/admin/data/page.tsx:72
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const [selectedCategory, setSelectedCategory] = useState<number | null>(null);`

### src/app/admin/data/page.tsx:73
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null);`

### src/app/admin/data/page.tsx:76
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const safeSelectedCategory = useSafeContextValue(selectedCategory);`

### src/app/admin/data/page.tsx:77
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const safeSelectedMeasure = useSafeContextValue(selectedMeasure);`

### src/app/admin/data/page.tsx:314
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const selectedCategoryName = categories.find(c => c.id === safeSelectedCategory)?.name || '';`

### src/app/admin/data/page.tsx:315
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const selectedMeasureName = measures.find(m => m.id === safeSelectedMeasure)?.name || '';`

### src/app/admin/data/page.tsx:321
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `categoryName: selectedCategoryName,`

### src/app/admin/data/page.tsx:323
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `measureName: selectedMeasureName`

### src/app/admin/layout.tsx:43
**Issue:** Browser API used - not available during SSR
**Code:** `console.log('🔍 Admin layout: Current URL:', window.location.href)`

### src/app/admin/layout.tsx:44
**Issue:** DOM API used - not available during SSR
**Code:** `console.log('🔍 Admin layout: Document cookies:', document.cookie)`

### src/app/admin/layout.tsx:67
**Issue:** Browser API used - not available during SSR
**Code:** `window.location.href = '/auth/login';`

### src/app/admin/layout.tsx:73
**Issue:** Browser API used - not available during SSR
**Code:** `window.location.href = '/auth/login';`

### src/app/admin/layout.tsx:80
**Issue:** Browser API used - not available during SSR
**Code:** `window.location.href = '/auth/login';`

### src/app/admin/layout.tsx:86
**Issue:** Browser API used - not available during SSR
**Code:** `window.location.href = '/auth/login';`

### src/app/admin/layout.tsx:97
**Issue:** Browser API used - not available during SSR
**Code:** `window.location.href = '/auth/login';`

### src/app/auth/login/page.tsx:40
**Issue:** Browser API used - not available during SSR
**Code:** `window.location.href = data.magicLink;`

### src/app/category/page.tsx:30
**Issue:** Context hook used - may cause hydration mismatch if values differ between server/client
**Code:** `const { selectedCategory, setSelectedCategory, user } = useSelection()`

### src/app/category/page.tsx:30
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const { selectedCategory, setSelectedCategory, user } = useSelection()`

### src/app/category/page.tsx:38
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const safeSelectedCategory = useSafeContextValue(selectedCategory)`

### src/app/measure/page.tsx:25
**Issue:** Context hook used - may cause hydration mismatch if values differ between server/client
**Code:** `const { selectedMeasure, setSelectedMeasure, favorites, toggleFavorite, selectedStates } = useSelection();`

### src/app/measure/page.tsx:25
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const { selectedMeasure, setSelectedMeasure, favorites, toggleFavorite, selectedStates } = useSelection();`

### src/app/measure/page.tsx:31
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const safeSelectedMeasure = useSafeContextValue(selectedMeasure);`

### src/app/measure/page.tsx:166
**Issue:** Browser API used - not available during SSR
**Code:** `window.location.reload()`

### src/app/page.tsx:9
**Issue:** Context hook used - may cause hydration mismatch if values differ between server/client
**Code:** `const { user, signIn, signOut } = useSelection()`

### src/app/results/page.tsx:32
**Issue:** Context hook used - may cause hydration mismatch if values differ between server/client
**Code:** `const { selectedStates, selectedMeasure, selectedCategory } = useSelection()`

### src/app/results/page.tsx:32
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const { selectedStates, selectedMeasure, selectedCategory } = useSelection()`

### src/app/results/page.tsx:32
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const { selectedStates, selectedMeasure, selectedCategory } = useSelection()`

### src/app/results/page.tsx:36
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const safeSelectedMeasure = useSafeContextValue(selectedMeasure)`

### src/app/results/page.tsx:37
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const safeSelectedCategory = useSafeContextValue(selectedCategory)`

### src/app/results/page.tsx:189
**Issue:** Browser API used - not available during SSR
**Code:** `window.location.reload()`

### src/app/states/page.tsx:17
**Issue:** Context hook used - may cause hydration mismatch if values differ between server/client
**Code:** `const { selectedStates, setSelectedStates, user } = useSelection()`

### src/components/AuthStatus.test.tsx:30
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.clear();`

### src/components/AuthStatus.test.tsx:31
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.clear();`

### src/components/AuthStatus.test.tsx:75
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', JSON.stringify(mockUser));`

### src/components/AuthStatus.test.tsx:89
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', JSON.stringify(mockUser));`

### src/components/AuthStatus.test.tsx:103
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', JSON.stringify(mockUser));`

### src/components/AuthStatus.test.tsx:121
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', JSON.stringify(mockUser));`

### src/components/AuthStatus.test.tsx:126
**Issue:** DOM API used - not available during SSR
**Code:** `const userIcon = document.querySelector('[data-lucide="user"]');`

### src/components/AuthStatus.test.tsx:170
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', JSON.stringify(mockUser));`

### src/components/AuthStatus.test.tsx:194
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', JSON.stringify(mockUser));`

### src/components/AuthStatus.test.tsx:204
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', 'invalid-json');`

### src/components/AuthStatus.tsx:12
**Issue:** Context hook used - may cause hydration mismatch if values differ between server/client
**Code:** `const { user, signOut } = useSelection()`

### src/components/DataQualityIndicator.tsx:118
**Issue:** Browser API used - not available during SSR
**Code:** `window.open(sourceUrl, '_blank')`

### src/components/ui/toast.tsx:104
**Issue:** DOM API used - not available during SSR
**Code:** `document.body`

### src/lib/context.test.tsx:19
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedCategory,`

### src/lib/context.test.tsx:20
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedMeasure,`

### src/lib/context.test.tsx:29
**Issue:** Context hook used - may cause hydration mismatch if values differ between server/client
**Code:** `} = useSelection();`

### src/lib/context.test.tsx:34
**Issue:** Context array length used in JSX - server/client may have different values
**Code:** `<div data-testid="selected-states">{selectedStates.length}</div>`

### src/lib/context.test.tsx:35
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `<div data-testid="selected-category">{selectedCategory?.name || 'no-category'}</div>`

### src/lib/context.test.tsx:36
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `<div data-testid="selected-measure">{selectedMeasure?.name || 'no-measure'}</div>`

### src/lib/context.test.tsx:70
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.clear();`

### src/lib/context.test.tsx:71
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.clear();`

### src/lib/context.test.tsx:75
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.clear();`

### src/lib/context.test.tsx:76
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.clear();`

### src/lib/context.test.tsx:95
**Issue:** Browser storage used - not available during SSR
**Code:** `const sessionData = sessionStorage.getItem('selectedStates');`

### src/lib/context.test.tsx:96
**Issue:** Browser storage used - not available during SSR
**Code:** `const localData = localStorage.getItem('selectedStates');`

### src/lib/context.test.tsx:124
**Issue:** Browser storage used - not available during SSR
**Code:** `const localData = localStorage.getItem('selectedStates');`

### src/lib/context.test.tsx:125
**Issue:** Browser storage used - not available during SSR
**Code:** `const sessionData = sessionStorage.getItem('selectedStates');`

### src/lib/context.test.tsx:146
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(sessionStorage.getItem('selectedStates')).toBeTruthy();`

### src/lib/context.test.tsx:147
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(localStorage.getItem('selectedStates')).toBeFalsy();`

### src/lib/context.test.tsx:157
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(localStorage.getItem('selectedStates')).toBeTruthy();`

### src/lib/context.test.tsx:158
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(sessionStorage.getItem('selectedStates')).toBeFalsy();`

### src/lib/context.test.tsx:186
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(localStorage.getItem('selectedStates')).toBeTruthy();`

### src/lib/context.test.tsx:187
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(sessionStorage.getItem('selectedStates')).toBeFalsy();`

### src/lib/context.test.tsx:197
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(sessionStorage.getItem('selectedStates')).toBeTruthy();`

### src/lib/context.test.tsx:198
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(localStorage.getItem('selectedStates')).toBeFalsy();`

### src/lib/context.test.tsx:220
**Issue:** Browser storage used - not available during SSR
**Code:** `const userData = localStorage.getItem('user');`

### src/lib/context.test.tsx:247
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(localStorage.getItem('user')).toBeFalsy();`

### src/lib/context.test.tsx:257
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', JSON.stringify(mockUser));`

### src/lib/context.test.tsx:273
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', JSON.stringify(mockUser));`

### src/lib/context.test.tsx:282
**Issue:** Browser storage used - not available during SSR
**Code:** `expect(localStorage.getItem('user')).toBeFalsy();`

### src/lib/context.test.tsx:299
**Issue:** Browser storage used - not available during SSR
**Code:** `const sessionFavorites = sessionStorage.getItem('favorites');`

### src/lib/context.test.tsx:324
**Issue:** Browser storage used - not available during SSR
**Code:** `const localFavorites = localStorage.getItem('favorites');`

### src/lib/context.test.tsx:420
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', 'invalid-json');`

### src/lib/context.test.tsx:421
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('selectedStates', 'invalid-json');`

### src/lib/context.test.tsx:433
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.setItem('selectedStates', 'invalid-json');`

### src/lib/context.test.tsx:444
**Issue:** Browser storage used - not available during SSR
**Code:** `const originalSetItem = localStorage.setItem;`

### src/lib/context.test.tsx:445
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem = vi.fn().mockImplementation(() => {`

### src/lib/context.test.tsx:459
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem = originalSetItem;`

### src/lib/context.tsx:14
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedCategory: string | null`

### src/lib/context.tsx:15
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedMeasure: number | null`

### src/lib/context.tsx:52
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedCategory: null,`

### src/lib/context.tsx:53
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedMeasure: null,`

### src/lib/context.tsx:59
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const [selectedCategory, setSelectedCategory] = useState<string | null>(initialState.selectedCategory)`

### src/lib/context.tsx:60
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const [selectedMeasure, setSelectedMeasure] = useState<number | null>(initialState.selectedMeasure)`

### src/lib/context.tsx:72
**Issue:** Browser storage used - not available during SSR
**Code:** `const savedStates = sessionStorage.getItem('selectedStates')`

### src/lib/context.tsx:73
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const savedCategory = sessionStorage.getItem('selectedCategory')`

### src/lib/context.tsx:73
**Issue:** Browser storage used - not available during SSR
**Code:** `const savedCategory = sessionStorage.getItem('selectedCategory')`

### src/lib/context.tsx:74
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `const savedMeasure = sessionStorage.getItem('selectedMeasure')`

### src/lib/context.tsx:74
**Issue:** Browser storage used - not available during SSR
**Code:** `const savedMeasure = sessionStorage.getItem('selectedMeasure')`

### src/lib/context.tsx:75
**Issue:** Browser storage used - not available during SSR
**Code:** `const savedFavorites = sessionStorage.getItem('favorites')`

### src/lib/context.tsx:96
**Issue:** Browser storage used - not available during SSR
**Code:** `console.log(`🔄 Context: Loading user from localStorage...`)`

### src/lib/context.tsx:98
**Issue:** Browser storage used - not available during SSR
**Code:** `const savedUser = localStorage.getItem('user')`

### src/lib/context.tsx:111
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.removeItem('user')`

### src/lib/context.tsx:115
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.removeItem('user')`

### src/lib/context.tsx:123
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.setItem('user', JSON.stringify(user))`

### src/lib/context.tsx:125
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.removeItem('user')`

### src/lib/context.tsx:131
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.setItem('selectedStates', JSON.stringify(selectedStates))`

### src/lib/context.tsx:135
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `if (selectedCategory) {`

### src/lib/context.tsx:136
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `sessionStorage.setItem('selectedCategory', selectedCategory)`

### src/lib/context.tsx:136
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.setItem('selectedCategory', selectedCategory)`

### src/lib/context.tsx:138
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `sessionStorage.removeItem('selectedCategory')`

### src/lib/context.tsx:138
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.removeItem('selectedCategory')`

### src/lib/context.tsx:140
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `}, [selectedCategory])`

### src/lib/context.tsx:143
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `if (selectedMeasure) {`

### src/lib/context.tsx:144
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `sessionStorage.setItem('selectedMeasure', JSON.stringify(selectedMeasure))`

### src/lib/context.tsx:144
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.setItem('selectedMeasure', JSON.stringify(selectedMeasure))`

### src/lib/context.tsx:146
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `sessionStorage.removeItem('selectedMeasure')`

### src/lib/context.tsx:146
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.removeItem('selectedMeasure')`

### src/lib/context.tsx:148
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `}, [selectedMeasure])`

### src/lib/context.tsx:151
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.setItem('favorites', JSON.stringify(favorites))`

### src/lib/context.tsx:217
**Issue:** Browser storage used - not available during SSR
**Code:** `localStorage.removeItem('user')`

### src/lib/context.tsx:234
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.removeItem('selectedStates')`

### src/lib/context.tsx:235
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `sessionStorage.removeItem('selectedCategory')`

### src/lib/context.tsx:235
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.removeItem('selectedCategory')`

### src/lib/context.tsx:236
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `sessionStorage.removeItem('selectedMeasure')`

### src/lib/context.tsx:236
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.removeItem('selectedMeasure')`

### src/lib/context.tsx:237
**Issue:** Browser storage used - not available during SSR
**Code:** `sessionStorage.removeItem('favorites')`

### src/lib/context.tsx:250
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedCategory,`

### src/lib/context.tsx:251
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedMeasure,`

### src/lib/context.tsx:268
**Issue:** Context hook used - may cause hydration mismatch if values differ between server/client
**Code:** `export function useSelection() {`

### src/types/api.ts:142
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedCategory: string | null;`

### src/types/api.ts:143
**Issue:** Context value used in JSX - server/client may have different values
**Code:** `selectedMeasure: number | null;`

## 🟡 Medium Priority Issues

### src/app/api/categories/route.test.ts:78
**Issue:** Random value used - will differ between server/client
**Code:** `statisticCount: Math.floor(Math.random() * 10) + 1, // Random count 1-10`

### src/app/api/categories/route.test.ts:88
**Issue:** Random value used - will differ between server/client
**Code:** `statisticCount: Math.floor(Math.random() * 10) + 1, // Random count 1-10`

### src/app/api/statistics/route.test.ts:119
**Issue:** Random value used - will differ between server/client
**Code:** `hasData: Math.random() > 0.3, // 70% chance of having data`

### src/app/api/statistics/route.test.ts:121
**Issue:** Random value used - will differ between server/client
**Code:** `dataPoints: Math.floor(Math.random() * 100) + 1,`

### src/app/results/page.tsx:81
**Issue:** Random value used - will differ between server/client
**Code:** `'2020': Math.floor(Math.random() * 100),`

### src/app/results/page.tsx:82
**Issue:** Random value used - will differ between server/client
**Code:** `'2021': Math.floor(Math.random() * 100),`

### src/app/results/page.tsx:83
**Issue:** Random value used - will differ between server/client
**Code:** `'2022': Math.floor(Math.random() * 100),`

### src/app/results/page.tsx:84
**Issue:** Random value used - will differ between server/client
**Code:** `'2023': Math.floor(Math.random() * 100)`

### src/components/AuthStatus.test.tsx:73
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `sessionExpiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now`

### src/components/AuthStatus.test.tsx:87
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `sessionExpiry: Date.now() + 24 * 60 * 60 * 1000`

### src/components/AuthStatus.test.tsx:101
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `sessionExpiry: Date.now() + 24 * 60 * 60 * 1000`

### src/components/AuthStatus.test.tsx:119
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `sessionExpiry: Date.now() + 24 * 60 * 60 * 1000`

### src/components/AuthStatus.test.tsx:168
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `sessionExpiry: Date.now() + 24 * 60 * 60 * 1000`

### src/components/AuthStatus.test.tsx:192
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `sessionExpiry: Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago (expired)`

### src/components/ui/toast.tsx:43
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;`

### src/components/ui/toast.tsx:43
**Issue:** Random value used - will differ between server/client
**Code:** `const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;`

### src/lib/context.test.tsx:226
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `expect(user.sessionExpiry).toBeGreaterThan(Date.now());`

### src/lib/context.test.tsx:255
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `sessionExpiry: Date.now() + 24 * 60 * 60 * 1000`

### src/lib/context.test.tsx:271
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `sessionExpiry: Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago`

### src/lib/context.tsx:32
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `return Date.now() > sessionExpiry`

### src/lib/db/seed-complete.ts:679
**Issue:** Random value used - will differ between server/client
**Code:** `value = 85 + Math.random() * 10; // 85-95%`

### src/lib/db/seed-complete.ts:682
**Issue:** Random value used - will differ between server/client
**Code:** `value = 30 + Math.random() * 20; // 30-50%`

### src/lib/db/seed-complete.ts:685
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 20; // 50-70%`

### src/lib/db/seed-complete.ts:688
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 10; // 10-20%`

### src/lib/db/seed-complete.ts:691
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 6; // 20-26`

### src/lib/db/seed-complete.ts:694
**Issue:** Random value used - will differ between server/client
**Code:** `value = 200 + Math.random() * 50; // 200-250 scale score`

### src/lib/db/seed-complete.ts:699
**Issue:** Random value used - will differ between server/client
**Code:** `value = 3 + Math.random() * 4; // 3-7%`

### src/lib/db/seed-complete.ts:702
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50000 + Math.random() * 50000; // $50k-$100k`

### src/lib/db/seed-complete.ts:705
**Issue:** Random value used - will differ between server/client
**Code:** `value = 100000 + Math.random() * 900000; // $100k-$1M`

### src/lib/db/seed-complete.ts:708
**Issue:** Random value used - will differ between server/client
**Code:** `value = 8 + Math.random() * 12; // 8-20%`

### src/lib/db/seed-complete.ts:711
**Issue:** Random value used - will differ between server/client
**Code:** `value = -50000 + Math.random() * 100000; // -50k to +50k`

### src/lib/db/seed-complete.ts:714
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.3 + Math.random() * 0.4; // 0.3-0.7 index`

### src/lib/db/seed-complete.ts:717
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // 50-100 index`

### src/lib/db/seed-complete.ts:720
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.3 + Math.random() * 0.2; // 0.3-0.5 Gini`

### src/lib/db/seed-complete.ts:723
**Issue:** Random value used - will differ between server/client
**Code:** `value = 1000 + Math.random() * 9000; // 1k-10k`

### src/lib/db/seed-complete.ts:726
**Issue:** Random value used - will differ between server/client
**Code:** `value = 1000000 + Math.random() * 9000000; // $1M-$10M`

### src/lib/db/seed-complete.ts:731
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2 + Math.random() * 6; // 2-8 per 1,000`

### src/lib/db/seed-complete.ts:734
**Issue:** Random value used - will differ between server/client
**Code:** `value = 15 + Math.random() * 25; // 15-40 per 1,000`

### src/lib/db/seed-complete.ts:737
**Issue:** Random value used - will differ between server/client
**Code:** `value = 30 + Math.random() * 30; // 30-60%`

### src/lib/db/seed-complete.ts:740
**Issue:** Random value used - will differ between server/client
**Code:** `value = 200 + Math.random() * 400; // 200-600 per 100k`

### src/lib/db/seed-complete.ts:743
**Issue:** Random value used - will differ between server/client
**Code:** `value = 100 + Math.random() * 200; // $100-$300 per capita`

### src/lib/db/seed-complete.ts:746
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.8 + Math.random() * 1.2; // 0.8-2.0 per 100M miles`

### src/lib/db/seed-complete.ts:749
**Issue:** Random value used - will differ between server/client
**Code:** `value = 5 + Math.random() * 15; // 5-20 per capita`

### src/lib/db/seed-complete.ts:754
**Issue:** Random value used - will differ between server/client
**Code:** `value = 5 + Math.random() * 15; // 5-20%`

### src/lib/db/seed-complete.ts:757
**Issue:** Random value used - will differ between server/client
**Code:** `value = 8000 + Math.random() * 4000; // $8k-$12k per capita`

### src/lib/db/seed-complete.ts:760
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 15; // 20-35%`

### src/lib/db/seed-complete.ts:763
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // 50-100 index`

### src/lib/db/seed-complete.ts:766
**Issue:** Random value used - will differ between server/client
**Code:** `value = 4 + Math.random() * 4; // 4-8 per 1,000`

### src/lib/db/seed-complete.ts:769
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 10; // 10-20%`

### src/lib/db/seed-complete.ts:772
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2 + Math.random() * 3; // 2-5 per 100`

### src/lib/db/seed-complete.ts:775
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 index`

### src/lib/db/seed-complete.ts:778
**Issue:** Random value used - will differ between server/client
**Code:** `value = 8 + Math.random() * 12; // 8-20%`

### src/lib/db/seed-complete.ts:783
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 30; // 10-40%`

### src/lib/db/seed-complete.ts:786
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 150; // 50-200 MMT`

### src/lib/db/seed-complete.ts:789
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 index`

### src/lib/db/seed-complete.ts:792
**Issue:** Random value used - will differ between server/client
**Code:** `value = 30 + Math.random() * 40; // 30-70 AQI`

### src/lib/db/seed-complete.ts:797
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // 50-100 index`

### src/lib/db/seed-complete.ts:802
**Issue:** Random value used - will differ between server/client
**Code:** `value = 5 + Math.random() * 15; // 5-20% of GDP`

### src/lib/db/seed-complete.ts:805
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2000 + Math.random() * 3000; // $2k-$5k per capita`

### src/lib/db/seed-complete.ts:808
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 40; // 20-60%`

### src/lib/db/seed-complete.ts:811
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 30; // 20-50%`

### src/lib/db/seed-complete.ts:814
**Issue:** Random value used - will differ between server/client
**Code:** `value = 70 + Math.random() * 30; // 70-100 rating`

### src/lib/db/seed-complete.ts:817
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2 + Math.random() * 3; // 2-5% of population`

### src/lib/db/seed-complete.ts:820
**Issue:** Random value used - will differ between server/client
**Code:** `value = Math.random() > 0.5 ? 1 : 0; // Binary 0 or 1`

### src/lib/db/seed-complete.ts:823
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 grade`

### src/lib/db/seed-complete.ts:826
**Issue:** Random value used - will differ between server/client
**Code:** `value = Math.random() > 0.5 ? 1 : 0; // Binary 0 or 1`

### src/lib/db/seed-complete.ts:829
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 score`

### src/lib/db/seed-complete.ts:832
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 40; // 10-50 count`

### src/lib/db/seed-complete.ts:835
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 10; // 10-20%`

### src/lib/db/seed-complete.ts:838
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.3 + Math.random() * 0.4; // 0.3-0.7 index`

### src/lib/db/seed-complete.ts:842
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // Generic 50-100`

### src/lib/db/seed-normalized.ts:809
**Issue:** Random value used - will differ between server/client
**Code:** `value = 85 + Math.random() * 10; // 85-95%`

### src/lib/db/seed-normalized.ts:812
**Issue:** Random value used - will differ between server/client
**Code:** `value = 30 + Math.random() * 20; // 30-50%`

### src/lib/db/seed-normalized.ts:815
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 20; // 50-70%`

### src/lib/db/seed-normalized.ts:818
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 10; // 10-20%`

### src/lib/db/seed-normalized.ts:821
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 6; // 20-26`

### src/lib/db/seed-normalized.ts:824
**Issue:** Random value used - will differ between server/client
**Code:** `value = 200 + Math.random() * 50; // 200-250 scale score`

### src/lib/db/seed-normalized.ts:829
**Issue:** Random value used - will differ between server/client
**Code:** `value = 3 + Math.random() * 4; // 3-7%`

### src/lib/db/seed-normalized.ts:832
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50000 + Math.random() * 50000; // $50k-$100k`

### src/lib/db/seed-normalized.ts:835
**Issue:** Random value used - will differ between server/client
**Code:** `value = 100000 + Math.random() * 900000; // $100k-$1M`

### src/lib/db/seed-normalized.ts:838
**Issue:** Random value used - will differ between server/client
**Code:** `value = 8 + Math.random() * 12; // 8-20%`

### src/lib/db/seed-normalized.ts:841
**Issue:** Random value used - will differ between server/client
**Code:** `value = -50000 + Math.random() * 100000; // -50k to +50k`

### src/lib/db/seed-normalized.ts:844
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.3 + Math.random() * 0.4; // 0.3-0.7 index`

### src/lib/db/seed-normalized.ts:847
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // 50-100 index`

### src/lib/db/seed-normalized.ts:850
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.3 + Math.random() * 0.2; // 0.3-0.5 Gini`

### src/lib/db/seed-normalized.ts:853
**Issue:** Random value used - will differ between server/client
**Code:** `value = 1000 + Math.random() * 9000; // 1k-10k`

### src/lib/db/seed-normalized.ts:856
**Issue:** Random value used - will differ between server/client
**Code:** `value = 1000000 + Math.random() * 9000000; // $1M-$10M`

### src/lib/db/seed-normalized.ts:861
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2 + Math.random() * 6; // 2-8 per 1,000`

### src/lib/db/seed-normalized.ts:864
**Issue:** Random value used - will differ between server/client
**Code:** `value = 15 + Math.random() * 25; // 15-40 per 1,000`

### src/lib/db/seed-normalized.ts:867
**Issue:** Random value used - will differ between server/client
**Code:** `value = 30 + Math.random() * 30; // 30-60%`

### src/lib/db/seed-normalized.ts:870
**Issue:** Random value used - will differ between server/client
**Code:** `value = 200 + Math.random() * 400; // 200-600 per 100k`

### src/lib/db/seed-normalized.ts:873
**Issue:** Random value used - will differ between server/client
**Code:** `value = 100 + Math.random() * 200; // $100-$300 per capita`

### src/lib/db/seed-normalized.ts:876
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.8 + Math.random() * 1.2; // 0.8-2.0 per 100M miles`

### src/lib/db/seed-normalized.ts:879
**Issue:** Random value used - will differ between server/client
**Code:** `value = 5 + Math.random() * 15; // 5-20 per capita`

### src/lib/db/seed-normalized.ts:884
**Issue:** Random value used - will differ between server/client
**Code:** `value = 5 + Math.random() * 15; // 5-20%`

### src/lib/db/seed-normalized.ts:887
**Issue:** Random value used - will differ between server/client
**Code:** `value = 8000 + Math.random() * 4000; // $8k-$12k per capita`

### src/lib/db/seed-normalized.ts:890
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 15; // 20-35%`

### src/lib/db/seed-normalized.ts:893
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // 50-100 index`

### src/lib/db/seed-normalized.ts:896
**Issue:** Random value used - will differ between server/client
**Code:** `value = 4 + Math.random() * 4; // 4-8 per 1,000`

### src/lib/db/seed-normalized.ts:899
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 10; // 10-20%`

### src/lib/db/seed-normalized.ts:902
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2 + Math.random() * 3; // 2-5 per 100`

### src/lib/db/seed-normalized.ts:905
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 index`

### src/lib/db/seed-normalized.ts:908
**Issue:** Random value used - will differ between server/client
**Code:** `value = 8 + Math.random() * 12; // 8-20%`

### src/lib/db/seed-normalized.ts:913
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 30; // 10-40%`

### src/lib/db/seed-normalized.ts:916
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 150; // 50-200 MMT`

### src/lib/db/seed-normalized.ts:919
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 index`

### src/lib/db/seed-normalized.ts:922
**Issue:** Random value used - will differ between server/client
**Code:** `value = 30 + Math.random() * 40; // 30-70 AQI`

### src/lib/db/seed-normalized.ts:927
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // 50-100 index`

### src/lib/db/seed-normalized.ts:932
**Issue:** Random value used - will differ between server/client
**Code:** `value = 5 + Math.random() * 15; // 5-20% of GDP`

### src/lib/db/seed-normalized.ts:935
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2000 + Math.random() * 3000; // $2k-$5k per capita`

### src/lib/db/seed-normalized.ts:938
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 40; // 20-60%`

### src/lib/db/seed-normalized.ts:941
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 30; // 20-50%`

### src/lib/db/seed-normalized.ts:944
**Issue:** Random value used - will differ between server/client
**Code:** `value = 70 + Math.random() * 30; // 70-100 rating`

### src/lib/db/seed-normalized.ts:947
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2 + Math.random() * 3; // 2-5% of population`

### src/lib/db/seed-normalized.ts:950
**Issue:** Random value used - will differ between server/client
**Code:** `value = Math.random() > 0.5 ? 1 : 0; // Binary 0 or 1`

### src/lib/db/seed-normalized.ts:953
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 grade`

### src/lib/db/seed-normalized.ts:956
**Issue:** Random value used - will differ between server/client
**Code:** `value = Math.random() > 0.5 ? 1 : 0; // Binary 0 or 1`

### src/lib/db/seed-normalized.ts:959
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 score`

### src/lib/db/seed-normalized.ts:962
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 40; // 10-50 count`

### src/lib/db/seed-normalized.ts:965
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 10; // 10-20%`

### src/lib/db/seed-normalized.ts:968
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.3 + Math.random() * 0.4; // 0.3-0.7 index`

### src/lib/db/seed-normalized.ts:972
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // Generic 50-100`

### src/lib/db/seed.ts:487
**Issue:** Random value used - will differ between server/client
**Code:** `value = 85 + Math.random() * 10; // 85-95%`

### src/lib/db/seed.ts:490
**Issue:** Random value used - will differ between server/client
**Code:** `value = 30 + Math.random() * 20; // 30-50%`

### src/lib/db/seed.ts:493
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 20; // 50-70%`

### src/lib/db/seed.ts:496
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 10; // 10-20%`

### src/lib/db/seed.ts:499
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 6; // 20-26`

### src/lib/db/seed.ts:502
**Issue:** Random value used - will differ between server/client
**Code:** `value = 200 + Math.random() * 50; // 200-250 scale score`

### src/lib/db/seed.ts:507
**Issue:** Random value used - will differ between server/client
**Code:** `value = 3 + Math.random() * 4; // 3-7%`

### src/lib/db/seed.ts:510
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50000 + Math.random() * 50000; // $50k-$100k`

### src/lib/db/seed.ts:513
**Issue:** Random value used - will differ between server/client
**Code:** `value = 100000 + Math.random() * 900000; // $100k-$1M`

### src/lib/db/seed.ts:516
**Issue:** Random value used - will differ between server/client
**Code:** `value = 8 + Math.random() * 12; // 8-20%`

### src/lib/db/seed.ts:519
**Issue:** Random value used - will differ between server/client
**Code:** `value = -50000 + Math.random() * 100000; // -50k to +50k`

### src/lib/db/seed.ts:522
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.3 + Math.random() * 0.4; // 0.3-0.7 index`

### src/lib/db/seed.ts:525
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // 50-100 index`

### src/lib/db/seed.ts:528
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.3 + Math.random() * 0.2; // 0.3-0.5 Gini`

### src/lib/db/seed.ts:531
**Issue:** Random value used - will differ between server/client
**Code:** `value = 1000 + Math.random() * 9000; // 1k-10k`

### src/lib/db/seed.ts:534
**Issue:** Random value used - will differ between server/client
**Code:** `value = 1000000 + Math.random() * 9000000; // $1M-$10M`

### src/lib/db/seed.ts:539
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2 + Math.random() * 6; // 2-8 per 1,000`

### src/lib/db/seed.ts:542
**Issue:** Random value used - will differ between server/client
**Code:** `value = 15 + Math.random() * 25; // 15-40 per 1,000`

### src/lib/db/seed.ts:545
**Issue:** Random value used - will differ between server/client
**Code:** `value = 30 + Math.random() * 30; // 30-60%`

### src/lib/db/seed.ts:548
**Issue:** Random value used - will differ between server/client
**Code:** `value = 200 + Math.random() * 400; // 200-600 per 100k`

### src/lib/db/seed.ts:551
**Issue:** Random value used - will differ between server/client
**Code:** `value = 100 + Math.random() * 200; // $100-$300 per capita`

### src/lib/db/seed.ts:554
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.8 + Math.random() * 1.2; // 0.8-2.0 per 100M miles`

### src/lib/db/seed.ts:557
**Issue:** Random value used - will differ between server/client
**Code:** `value = 5 + Math.random() * 15; // 5-20 per capita`

### src/lib/db/seed.ts:562
**Issue:** Random value used - will differ between server/client
**Code:** `value = 5 + Math.random() * 15; // 5-20%`

### src/lib/db/seed.ts:565
**Issue:** Random value used - will differ between server/client
**Code:** `value = 8000 + Math.random() * 4000; // $8k-$12k per capita`

### src/lib/db/seed.ts:568
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 15; // 20-35%`

### src/lib/db/seed.ts:571
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // 50-100 index`

### src/lib/db/seed.ts:574
**Issue:** Random value used - will differ between server/client
**Code:** `value = 4 + Math.random() * 4; // 4-8 per 1,000`

### src/lib/db/seed.ts:577
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 10; // 10-20%`

### src/lib/db/seed.ts:580
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2 + Math.random() * 3; // 2-5 per 100`

### src/lib/db/seed.ts:583
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 index`

### src/lib/db/seed.ts:586
**Issue:** Random value used - will differ between server/client
**Code:** `value = 8 + Math.random() * 12; // 8-20%`

### src/lib/db/seed.ts:591
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 30; // 10-40%`

### src/lib/db/seed.ts:594
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 150; // 50-200 MMT`

### src/lib/db/seed.ts:597
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 index`

### src/lib/db/seed.ts:600
**Issue:** Random value used - will differ between server/client
**Code:** `value = 30 + Math.random() * 40; // 30-70 AQI`

### src/lib/db/seed.ts:605
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // 50-100 index`

### src/lib/db/seed.ts:610
**Issue:** Random value used - will differ between server/client
**Code:** `value = 5 + Math.random() * 15; // 5-20% of GDP`

### src/lib/db/seed.ts:613
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2000 + Math.random() * 3000; // $2k-$5k per capita`

### src/lib/db/seed.ts:616
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 40; // 20-60%`

### src/lib/db/seed.ts:619
**Issue:** Random value used - will differ between server/client
**Code:** `value = 20 + Math.random() * 30; // 20-50%`

### src/lib/db/seed.ts:622
**Issue:** Random value used - will differ between server/client
**Code:** `value = 70 + Math.random() * 30; // 70-100 rating`

### src/lib/db/seed.ts:625
**Issue:** Random value used - will differ between server/client
**Code:** `value = 2 + Math.random() * 3; // 2-5% of population`

### src/lib/db/seed.ts:628
**Issue:** Random value used - will differ between server/client
**Code:** `value = Math.random() > 0.5 ? 1 : 0; // Binary 0 or 1`

### src/lib/db/seed.ts:631
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 grade`

### src/lib/db/seed.ts:634
**Issue:** Random value used - will differ between server/client
**Code:** `value = Math.random() > 0.5 ? 1 : 0; // Binary 0 or 1`

### src/lib/db/seed.ts:637
**Issue:** Random value used - will differ between server/client
**Code:** `value = 60 + Math.random() * 40; // 60-100 score`

### src/lib/db/seed.ts:640
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 40; // 10-50 count`

### src/lib/db/seed.ts:643
**Issue:** Random value used - will differ between server/client
**Code:** `value = 10 + Math.random() * 10; // 10-20%`

### src/lib/db/seed.ts:646
**Issue:** Random value used - will differ between server/client
**Code:** `value = 0.3 + Math.random() * 0.4; // 0.3-0.7 index`

### src/lib/db/seed.ts:650
**Issue:** Random value used - will differ between server/client
**Code:** `value = 50 + Math.random() * 50; // Generic 50-100`

### src/lib/services/authService.test.ts:33
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `expiresAt: new Date(Date.now() + 3600000), // 1 hour from now`

### src/lib/services/authService.test.ts:42
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `expiresAt: new Date(Date.now() + 900000), // 15 minutes from now`

### src/lib/services/authService.test.ts:84
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `expiresAt: new Date(Date.now() + 3600000),`

### src/lib/services/authService.test.ts:103
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `expiresAt: new Date(Date.now() + 900000),`

### src/lib/services/authService.ts:43
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes`

### src/lib/services/authService.ts:127
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days`

### src/lib/services/cache.ts:16
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `timestamp: Date.now(),`

### src/lib/services/cache.ts:27
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const isExpired = Date.now() - entry.timestamp > entry.ttl;`

### src/lib/services/comprehensiveCSVImportService.test.ts:17
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const startTime = Date.now();`

### src/lib/services/comprehensiveCSVImportService.test.ts:222
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `processingTimeMs: Date.now() - startTime,`

### src/lib/services/comprehensiveCSVImportService.test.ts:237
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `processingTime: `${Date.now() - startTime}ms`,`

### src/lib/services/comprehensiveCSVImportService.ts:31
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const startTime = Date.now();`

### src/lib/services/comprehensiveCSVImportService.ts:243
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `validationTimeMs: Date.now() - startTime,`

### src/lib/services/comprehensiveCSVImportService.ts:274
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const importStartTime = Date.now();`

### src/lib/services/comprehensiveCSVImportService.ts:312
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const importTime = Date.now() - importStartTime;`

### src/lib/services/comprehensiveCSVImportService.ts:320
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `validationTimeMs: Date.now() - startTime,`

### src/lib/services/comprehensiveCSVImportService.ts:334
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `processingTime: `${Date.now() - startTime}ms`,`

### src/lib/services/externalDataService.ts:98
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const jobId = `bea-gdp-${Date.now()}`;`

### src/lib/services/externalDataService.ts:153
**Issue:** Random value used - will differ between server/client
**Code:** `const gdpValue = Math.random() * 1000000 + 50000;`

### src/lib/services/externalDataService.ts:183
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const jobId = `bls-employment-${Date.now()}`;`

### src/lib/services/externalDataService.ts:238
**Issue:** Random value used - will differ between server/client
**Code:** `const employmentValue = Math.random() * 10000 + 500;`

### src/lib/services/externalDataService.ts:268
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const jobId = `census-population-${Date.now()}`;`

### src/lib/services/externalDataService.ts:323
**Issue:** Random value used - will differ between server/client
**Code:** `const populationValue = Math.random() * 50000000 + 1000000;`

### src/lib/test-setup.ts:36
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `const timestamp = Date.now();`

### src/lib/test-setup.ts:37
**Issue:** Random value used - will differ between server/client
**Code:** `const randomId = Math.random().toString(36).substring(2, 15);`

### src/lib/test-utils.ts:30
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `name: `Test State ${Date.now()}`,`

### src/lib/test-utils.ts:31
**Issue:** Random value used - will differ between server/client
**Code:** `abbreviation: `TS${Math.random().toString(36).substr(2, 3).toUpperCase()}`,`

### src/lib/test-utils.ts:54
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `name: `Test Category ${Date.now()}`,`

### src/lib/test-utils.ts:81
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `name: `Test Data Source ${Date.now()}`,`

### src/lib/test-utils.ts:103
**Issue:** Random value used - will differ between server/client
**Code:** `raNumber: `RA${Math.floor(Math.random() * 9000) + 1000}`,`

### src/lib/test-utils.ts:106
**Issue:** Dynamic timestamp used - will differ between server/client
**Code:** `name: `Test Statistic ${Date.now()}`,`

## Recommendations

1. **Use ClientOnly wrapper** for components that depend on context values
2. **Use useSafeContextValue hook** for accessing context values safely
3. **Move browser-only code** into useEffect hooks
4. **Add hydration tests** to catch issues early

