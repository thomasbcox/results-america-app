import { SimpleCSVImportService } from '../../src/lib/services/simpleCSVImportService';

export interface TestCSVData {
  headers: string[];
  rows: string[][];
  filename: string;
  description: string;
}

export const createTestCSV = (headers: string[], rows: string[][]) => {
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

export const createTestFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv' });
  return new File([blob], filename, { type: 'text/csv' });
};

export const generateValidMultiCategoryCSV = (rowCount: number = 5): TestCSVData => {
  const headers = ['State', 'Year', 'Category', 'Measure', 'Value'];
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois'];
  const categories = ['Economy', 'Education'];
  const measures = ['Gross Domestic Product', 'HS Graduation Rate'];
  
  const rows: string[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const state = states[i % states.length];
    const category = categories[i % categories.length];
    const measure = measures[i % measures.length];
    const year = 2023;
    const value = 1000000 + (i * 100000);
    
    rows.push([state, year.toString(), category, measure, value.toString()]);
  }
  
  return {
    headers,
    rows,
    filename: `valid-multi-category-${rowCount}rows.csv`,
    description: `Valid multi-category CSV with ${rowCount} rows`
  };
};

export const generateValidSingleCategoryCSV = (rowCount: number = 5): TestCSVData => {
  const headers = ['State', 'Year', 'Value'];
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois'];
  
  const rows: string[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const state = states[i % states.length];
    const year = 2023;
    const value = 1000000 + (i * 100000);
    
    rows.push([state, year.toString(), value.toString()]);
  }
  
  return {
    headers,
    rows,
    filename: `valid-single-category-${rowCount}rows.csv`,
    description: `Valid single-category CSV with ${rowCount} rows`
  };
};

export const generateInvalidCSV = (errorType: string): TestCSVData => {
  switch (errorType) {
    case 'invalid-headers':
      return {
        headers: ['Invalid', 'Headers', 'Here'],
        rows: [['California', '2023', '1000000']],
        filename: 'invalid-headers.csv',
        description: 'CSV with invalid headers'
      };
    
    case 'missing-required-fields':
      return {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['California', '', 'Economy', 'GDP', '1000000'], // Missing year
          ['', '2023', 'Economy', 'GDP', '1000000'], // Missing state
          ['California', '2023', 'Economy', 'GDP', ''] // Missing value
        ],
        filename: 'missing-required-fields.csv',
        description: 'CSV with missing required fields'
      };
    
    case 'invalid-data-types':
      return {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['California', 'not-a-year', 'Economy', 'GDP', '1000000'], // Invalid year
          ['California', '2023', 'Economy', 'GDP', 'not-a-number'], // Invalid value
          ['California', '2023', 'Economy', 'GDP', '1.5e6'] // Scientific notation
        ],
        filename: 'invalid-data-types.csv',
        description: 'CSV with invalid data types'
      };
    
    case 'non-existent-states':
      return {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['InvalidState', '2023', 'Economy', 'GDP', '1000000'],
          ['FakeState', '2023', 'Economy', 'GDP', '1000000'],
          ['NotAState', '2023', 'Economy', 'GDP', '1000000']
        ],
        filename: 'non-existent-states.csv',
        description: 'CSV with non-existent state names'
      };
    
    case 'non-existent-categories':
      return {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['California', '2023', 'FakeCategory', 'GDP', '1000000'],
          ['Texas', '2023', 'InvalidCategory', 'GDP', '1000000']
        ],
        filename: 'non-existent-categories.csv',
        description: 'CSV with non-existent categories'
      };
    
    case 'empty-file':
      return {
        headers: [],
        rows: [],
        filename: 'empty-file.csv',
        description: 'Empty CSV file'
      };
    
    case 'headers-only':
      return {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [],
        filename: 'headers-only.csv',
        description: 'CSV with only headers, no data rows'
      };
    
    case 'malformed-csv':
      return {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['California', '2023', 'Economy', 'GDP', '1000000'],
          ['Texas', '2023', 'Economy', 'GDP'], // Missing value
          ['New York', '2023', 'Economy', 'GDP', '1000000', 'extra-field'] // Extra field
        ],
        filename: 'malformed-csv.csv',
        description: 'Malformed CSV with inconsistent columns'
      };
    
    default:
      throw new Error(`Unknown error type: ${errorType}`);
  }
};

export const generateLargeCSV = (rowCount: number): TestCSVData => {
  const headers = ['State', 'Year', 'Category', 'Measure', 'Value'];
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'Michigan', 'North Carolina'];
  const categories = ['Economy', 'Education', 'Health', 'Public Safety'];
  const measures = ['Gross Domestic Product', 'HS Graduation Rate', 'Healthcare Cost', 'Crime Rate'];
  
  const rows: string[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const state = states[i % states.length];
    const category = categories[i % categories.length];
    const measure = measures[i % measures.length];
    const year = 2023;
    const value = 1000000 + (i * 1000);
    
    rows.push([state, year.toString(), category, measure, value.toString()]);
  }
  
  return {
    headers,
    rows,
    filename: `large-csv-${rowCount}rows.csv`,
    description: `Large CSV with ${rowCount} rows`
  };
};

export const generateSpecialCharacterCSV = (): TestCSVData => {
  const headers = ['State', 'Year', 'Category', 'Measure', 'Value'];
  const rows = [
    ['California', '2023', 'Economy', 'GDP (with parentheses)', '1000000'],
    ['New York', '2023', 'Education', 'Graduation Rate %', '85.5'],
    ['Texas', '2023', 'Health', 'Cost per capita', '2500'],
    ['Florida', '2023', 'Public Safety', 'Crime rate per 100k', '350.2'],
    ['Illinois', '2023', 'Economy', 'GDP - adjusted', '1500000']
  ];
  
  return {
    headers,
    rows,
    filename: 'special-characters.csv',
    description: 'CSV with special characters in data'
  };
};

export const uploadTestCSV = async (
  csvData: TestCSVData,
  templateId: number,
  metadata: Record<string, any> = {},
  userId: number = 3
) => {
  const csvContent = createTestCSV(csvData.headers, csvData.rows);
  const file = createTestFile(csvContent, csvData.filename);
  
  return await SimpleCSVImportService.uploadCSV(
    file,
    templateId,
    {
      name: csvData.description,
      description: `Test upload: ${csvData.description}`,
      ...metadata
    },
    userId
  );
}; 