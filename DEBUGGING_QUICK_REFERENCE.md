# 🚨 DEBUGGING QUICK REFERENCE

## **ENFORCE THIS SEQUENCE IN EVERY DEBUGGING SESSION**

### **1. DATABASE LAYER** 🔍
```bash
curl -X GET http://localhost:3050/api/states | jq '.success, (.data | length)'
```
- [ ] Database connection working?
- [ ] Correct schema imported for environment?
- [ ] Table structure matches expectations?

### **2. SERVICE LAYER** ⚙️
```bash
npm test -- --testPathPattern="[serviceName]" --verbose
```
- [ ] All required methods implemented?
- [ ] Return types match API expectations?
- [ ] Error handling in place?

### **3. API LAYER** 🌐
```bash
curl -X GET "http://localhost:3050/api/[endpoint]?[params]" | jq '.success, (.data | length)'
```
- [ ] Endpoint returns 200 status?
- [ ] Response structure: `{success, data, pagination}`?
- [ ] Parameter validation working?

### **4. FRONTEND LAYER** 🎨
- [ ] Browser console errors?
- [ ] API response parsing: `result.data` not direct array?
- [ ] Component props match interfaces?

---

## **COMMON FIXES**

| Error | Root Cause | Fix |
|-------|------------|-----|
| `X.map is not a function` | API returns `{success, data: [...]}` | Extract `result.data` |
| `Cannot access X before initialization` | Variable shadowing | Rename local variables |
| `X is not a function` | Missing service method | Implement method |
| Schema mismatch | Wrong schema imported | Use correct schema for environment |

---

## **RED FLAGS - STOP AND INVESTIGATE**

🚨 **"Cannot find module"** → Check import paths  
🚨 **"X is not a function"** → Verify method exists  
🚨 **"X.map is not a function"** → Check API response parsing  
🚨 **"Cannot access X before initialization"** → Look for variable shadowing  
🚨 **500 Internal Server Error** → Check server logs  
🚨 **Frontend stuck loading** → Check browser console  

---

## **SUCCESS CRITERIA**

✅ All layers working correctly  
✅ No console errors or warnings  
✅ End-to-end functionality verified  
✅ Documentation updated if needed  

---

**🎯 REMEMBER: Bottom-up debugging prevents symptom-fixing and ensures root cause resolution.** 