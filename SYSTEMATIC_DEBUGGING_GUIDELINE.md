# Systematic Debugging Guideline

## 🎯 **Core Principle: Bottom-Up Debugging**

**Always debug from the data layer upward to the presentation layer.** This systematic approach prevents symptom-fixing and ensures root cause resolution.

## 📋 **Debugging Sequence**

### 1. **Database Layer Verification** 🔍
```bash
# Test database connection
curl -X GET http://localhost:3050/api/states | jq '.success, (.data | length)'

# Verify schema alignment
- Check schema imports (SQLite vs PostgreSQL)
- Confirm table structures match expectations
- Validate foreign key relationships
```

### 2. **Service Layer Testing** ⚙️
```bash
# Test service methods directly
- Verify service imports correct schema
- Check method implementations exist
- Test with sample data
- Validate return types match API expectations
```

### 3. **API Route Validation** 🌐
```bash
# Test API endpoints with curl
curl -X GET http://localhost:3050/api/categories?withStats=true | jq '.success, (.data | length)'
curl -X GET http://localhost:3050/api/statistics?withAvailability=true | jq '.success, (.data | length)'

# Check response structure consistency
- success: boolean
- data: array
- pagination: object (if applicable)
- error: string (if applicable)
```

### 4. **Frontend Integration Debugging** 🎨
```bash
# Check browser console for JavaScript errors
# Verify API response parsing
# Test data structure mapping
# Validate component props
```

## 🔧 **Common Debugging Patterns**

### **Error: "X.map is not a function"**
**Root Cause**: API returns nested object `{success: true, data: [...]}` but frontend expects direct array
**Fix**: Extract data array from response
```typescript
// ❌ Wrong
setStates(await response.json())

// ✅ Correct  
const result = await response.json()
setStates(result.data || [])
```

### **Error: "Cannot access 'X' before initialization"**
**Root Cause**: Variable shadowing imported modules
**Fix**: Rename local variables
```typescript
// ❌ Wrong
import { states } from '../db/schema'
const states = ['WA', 'OR'] // Shadows import

// ✅ Correct
import { states } from '../db/schema'
const stateNames = ['WA', 'OR']
```

### **Error: "X is not a function"**
**Root Cause**: Missing service method implementation
**Fix**: Implement missing methods in service layer
```typescript
// Add missing methods to service class
static async getAllStatistics(): Promise<StatisticData[]> {
  return this.getAllStatisticsWithSources()
}
```

### **Schema Mismatch Errors**
**Root Cause**: Wrong schema imported for environment
**Fix**: Use correct schema for environment
```typescript
// Development/Production: PostgreSQL
import { schema } from '../db/schema-postgres'

// Testing: SQLite  
import { schema } from '../db/schema-normalized'
```

## 🛠️ **Enforcement Strategies**

### **1. Pre-Development Checklist**
Before starting any new feature or debugging session:

- [ ] **Environment Confirmation**: Verify correct database schema for environment
- [ ] **Service Layer Review**: Ensure all required service methods exist
- [ ] **API Response Structure**: Confirm consistent JSON response format
- [ ] **Frontend Expectations**: Align component interfaces with API responses

### **2. Debugging Workflow Template**
```markdown
## Debug Session: [Feature Name]

### 1. Database Layer ✅
- [ ] Connection test: `curl /api/states`
- [ ] Schema verification: Correct imports for environment
- [ ] Table structure: Matches expectations

### 2. Service Layer ✅  
- [ ] Method existence: All required methods implemented
- [ ] Return types: Match API expectations
- [ ] Error handling: Proper error responses

### 3. API Layer ✅
- [ ] Endpoint testing: `curl` with `jq` validation
- [ ] Response structure: `{success, data, pagination}`
- [ ] Parameter validation: Proper error handling

### 4. Frontend Layer ✅
- [ ] API response parsing: Extract `data` array correctly
- [ ] Component props: Match interface definitions
- [ ] Error boundaries: Graceful error handling
- [ ] Console errors: No JavaScript exceptions

### 5. Integration Testing ✅
- [ ] End-to-end flow: Complete user journey
- [ ] Edge cases: Error conditions handled
- [ ] Performance: Acceptable response times
```

### **3. Code Review Checklist**
For every pull request or code change:

- [ ] **Schema Consistency**: Correct schema imported for environment
- [ ] **Service Completeness**: All referenced methods exist
- [ ] **API Response Format**: Consistent structure across endpoints
- [ ] **Frontend Integration**: Proper data extraction and mapping
- [ ] **Error Handling**: Graceful degradation at all layers
- [ ] **Type Safety**: TypeScript interfaces match actual data

### **4. Automated Validation**
```bash
# Add to CI/CD pipeline
npm run test:api          # API endpoint tests
npm run test:services     # Service layer tests  
npm run test:integration  # End-to-end tests
npm run type-check        # TypeScript validation
```

### **5. Documentation Standards**
- **API Documentation**: Always include response structure examples
- **Service Documentation**: Document all public methods and return types
- **Schema Documentation**: Maintain up-to-date schema diagrams
- **Debugging Notes**: Record common issues and solutions

## 🎯 **Success Metrics**

### **Before Debugging Session**
- Clear understanding of expected behavior
- Identified failure point in the stack
- Environment configuration verified

### **After Debugging Session**
- All layers working correctly
- No console errors or warnings
- End-to-end functionality verified
- Documentation updated if needed

## 🚨 **Red Flags (Stop and Investigate)**

1. **"Cannot find module"** → Check import paths and file existence
2. **"X is not a function"** → Verify method implementation exists
3. **"X.map is not a function"** → Check API response structure parsing
4. **"Cannot access X before initialization"** → Look for variable shadowing
5. **Schema mismatch errors** → Verify correct schema for environment
6. **500 Internal Server Error** → Check server logs for detailed error
7. **Frontend stuck in loading** → Check browser console for JavaScript errors

## 📚 **Reference Commands**

### **Database Testing**
```bash
# Test database connection
curl -X GET http://localhost:3050/api/states | jq '.success, (.data | length)'

# Test with specific parameters
curl -X GET "http://localhost:3050/api/categories?withStats=true&withAvailability=true" | jq '.success, (.data | length)'
```

### **Service Testing**
```bash
# Run service tests
npm test -- --testPathPattern="states|categories|statistics" --verbose

# Test specific service
npm test -- --testPathPattern="statisticsService" --verbose
```

### **Frontend Debugging**
```bash
# Check for JavaScript errors in browser console
# Verify network requests in browser dev tools
# Test component rendering with React dev tools
```

## 🎯 **Implementation Strategy**

### **For New Projects**
1. **Setup Phase**: Establish debugging workflow from day one
2. **Documentation**: Create debugging guidelines as part of project setup
3. **Tooling**: Configure linting and testing to catch common issues
4. **Training**: Ensure team understands bottom-up debugging approach

### **For Existing Projects**
1. **Audit Phase**: Review current debugging practices
2. **Gap Analysis**: Identify missing debugging steps
3. **Implementation**: Gradually adopt systematic approach
4. **Validation**: Test approach on current issues

### **For Team Adoption**
1. **Documentation**: Create team-wide debugging guidelines
2. **Training**: Conduct debugging methodology workshops
3. **Code Reviews**: Enforce debugging checklist in reviews
4. **Retrospectives**: Include debugging effectiveness in team retrospectives

## 🏆 **Success Stories**

### **Results America App Debugging Session**
- **Problem**: Frontend pages stuck in loading states
- **Approach**: Systematic bottom-up debugging
- **Root Cause**: API response structure mismatch and variable shadowing
- **Solution**: Fixed data extraction and schema imports
- **Result**: Complete end-to-end functionality restored
- **Time Saved**: Hours of trial-and-error debugging avoided

---

**Remember**: Systematic debugging is not just a technique—it's a mindset. By following this approach consistently, you'll catch issues earlier, fix them more effectively, and build more robust applications. 