# 📊 CSV Import Format Guide

## ✅ **WORKING CSV FORMATS FOR MULTIPLE METRICS**

The system currently supports **two CSV formats** that can successfully import multiple metrics:

---

## 🎯 **FORMAT 1: Multi-Category Data Import (RECOMMENDED)**

**Template:** `Multi-Category Data Import`  
**Headers:** `State, Year, Category, Measure, Value`

### **✅ Perfect for Multiple Metrics in One File**

This format allows you to import **many different metrics** from **different categories** in a single CSV file.

### **📋 Available Categories & Measures:**

| **Category** | **Available Measures** | **Unit** |
|--------------|----------------------|----------|
| **Education** | High School Graduation Rate, College Enrollment Rate | percentage |
| **Healthcare** | Life Expectancy, Infant Mortality Rate | years, per 1,000 |
| **Economy** | Unemployment Rate, Median Household Income | percentage, dollars |
| **Environment** | (No measures seeded yet) | - |
| **Infrastructure** | (No measures seeded yet) | - |

### **✅ Working Example with Multiple Metrics:**

```csv
State,Year,Category,Measure,Value
California,2023,Economy,Median Household Income,85000
Texas,2023,Economy,Median Household Income,72000
Alabama,2023,Economy,Median Household Income,65000
California,2023,Economy,Unemployment Rate,4.2
Texas,2023,Economy,Unemployment Rate,3.8
Alabama,2023,Economy,Unemployment Rate,3.2
California,2023,Education,High School Graduation Rate,85.2
Texas,2023,Education,High School Graduation Rate,89.1
Alabama,2023,Education,High School Graduation Rate,82.1
California,2023,Healthcare,Life Expectancy,80.1
Texas,2023,Healthcare,Life Expectancy,78.9
Alabama,2023,Healthcare,Life Expectancy,75.2
```

### **📊 This Single File Contains:**
- ✅ **3 different measures** (Median Household Income, Unemployment Rate, High School Graduation Rate, Life Expectancy)
- ✅ **3 different categories** (Economy, Education, Healthcare)
- ✅ **3 different states** (California, Texas, Alabama)
- ✅ **All in one CSV file**

---

## 🎯 **FORMAT 2: Single-Category Data Import**

**Template:** `Single-Category Data Import`  
**Headers:** `State, Year, Value`

### **✅ For One Specific Measure**

This format is for importing **one specific measure** across multiple states.

### **✅ Working Example:**

```csv
State,Year,Value
California,2023,85000
Texas,2023,72000
Alabama,2023,65000
Alaska,2023,78000
Arizona,2023,68000
```

**Requirements:**
- Must specify **Category** and **Measure** in metadata during upload
- All rows must be for the **same measure**

---

## 🎯 **RECOMMENDED APPROACH FOR MULTIPLE METRICS**

### **✅ Use Format 1 (Multi-Category) for Multiple Metrics**

**Why this is the best choice:**
1. **✅ One file, many metrics** - Import all your data in one CSV
2. **✅ Flexible structure** - Mix categories and measures freely
3. **✅ Easy to maintain** - Add new metrics by adding rows
4. **✅ Validated automatically** - System checks categories/measures exist

### **📋 Step-by-Step Process:**

1. **Create your CSV file:**
```csv
State,Year,Category,Measure,Value
California,2023,Economy,Median Household Income,85000
Texas,2023,Economy,Median Household Income,72000
California,2023,Education,High School Graduation Rate,85.2
Texas,2023,Education,High School Graduation Rate,89.1
California,2023,Healthcare,Life Expectancy,80.1
Texas,2023,Healthcare,Life Expectancy,78.9
```

2. **Upload via Admin Interface:**
   - Go to `/admin/data`
   - Select "Multi-Category Data Import" template
   - Upload your CSV file
   - Add metadata (description, data source, etc.)

3. **System will automatically:**
   - ✅ Validate state names match seeded data
   - ✅ Validate categories and measures exist
   - ✅ Check data types (numeric values)
   - ✅ Import all metrics to database

---

## 📊 **COMPLETE WORKING EXAMPLE**

### **✅ Multi-Metric CSV File (`my-data.csv`):**

```csv
State,Year,Category,Measure,Value
California,2023,Economy,Median Household Income,85000
Texas,2023,Economy,Median Household Income,72000
Alabama,2023,Economy,Median Household Income,65000
Alaska,2023,Economy,Median Household Income,78000
Arizona,2023,Economy,Median Household Income,68000
California,2023,Economy,Unemployment Rate,4.2
Texas,2023,Economy,Unemployment Rate,3.8
Alabama,2023,Economy,Unemployment Rate,3.2
Alaska,2023,Economy,Unemployment Rate,4.1
Arizona,2023,Economy,Unemployment Rate,3.5
California,2023,Education,High School Graduation Rate,85.2
Texas,2023,Education,High School Graduation Rate,89.1
Alabama,2023,Education,High School Graduation Rate,82.1
Alaska,2023,Education,High School Graduation Rate,88.5
Arizona,2023,Education,High School Graduation Rate,84.7
California,2023,Healthcare,Life Expectancy,80.1
Texas,2023,Healthcare,Life Expectancy,78.9
Alabama,2023,Healthcare,Life Expectancy,75.2
Alaska,2023,Healthcare,Life Expectancy,78.9
Arizona,2023,Healthcare,Life Expectancy,80.1
```

### **📊 This Single File Contains:**
- ✅ **3 different measures** across **3 categories**
- ✅ **5 states** with data for each measure
- ✅ **20 total data points** in one import
- ✅ **All validated and imported automatically**

---

## ⚠️ **IMPORTANT REQUIREMENTS**

### **✅ Valid States (Case-Insensitive):**
```
Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia
```

### **✅ Valid Categories:**
```
Education, Healthcare, Economy, Environment, Infrastructure
```

### **✅ Valid Measures:**
```
Education: High School Graduation Rate, College Enrollment Rate
Healthcare: Life Expectancy, Infant Mortality Rate  
Economy: Unemployment Rate, Median Household Income
```

### **✅ Data Requirements:**
- **Values must be numeric** (no text like "N/A" or "Unknown")
- **Years should be reasonable** (2020-2024)
- **State names must match exactly** (case-insensitive)
- **Category/Measure combinations must exist** in seeded data

---

## 🚀 **QUICK TEST**

### **Create a Test File:**

```bash
cat > test-multi-metrics.csv << 'EOF'
State,Year,Category,Measure,Value
California,2023,Economy,Median Household Income,85000
Texas,2023,Economy,Median Household Income,72000
California,2023,Education,High School Graduation Rate,85.2
Texas,2023,Education,High School Graduation Rate,89.1
California,2023,Healthcare,Life Expectancy,80.1
Texas,2023,Healthcare,Life Expectancy,78.9
EOF
```

### **Upload via Admin:**
1. Go to `http://localhost:3050/admin/data`
2. Select "Multi-Category Data Import" template
3. Upload `test-multi-metrics.csv`
4. Add metadata and submit

**✅ This should import successfully with 6 data points across 3 categories!**

---

## 📋 **SUMMARY**

**✅ FOR MULTIPLE METRICS: Use "Multi-Category Data Import"**

**Format:** `State,Year,Category,Measure,Value`

**Benefits:**
- ✅ **One file, many metrics**
- ✅ **Flexible structure**
- ✅ **Automatic validation**
- ✅ **Easy to maintain**

**Available Metrics:**
- ✅ **6 different measures** across **3 categories**
- ✅ **10 different states**
- ✅ **All in one CSV file**

**The system is ready to import multiple metrics successfully!** 🎉 