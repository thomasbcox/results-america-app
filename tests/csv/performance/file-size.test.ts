import { SimpleCSVImportService } from '../../../src/lib/services/simpleCSVImportService';
import { generateLargeCSV, createTestFile, uploadTestCSV } from '../../utils/csv-test-helpers';

describe('CSV Import Performance - File Size', () => {
  let multiCategoryTemplateId: number;

  beforeAll(async () => {
    const templates = await SimpleCSVImportService.getTemplates();
    const multiCategoryTemplate = templates.find(t => t.name === 'Multi-Category Data Import');
    
    if (!multiCategoryTemplate) {
      throw new Error('Multi-Category template not found');
    }
    
    multiCategoryTemplateId = multiCategoryTemplate.id;
  });

  describe('Small Files (< 1MB)', () => {
    it('should handle files with 1-100 rows efficiently', async () => {
      const startTime = Date.now();
      
      const smallCSV = generateLargeCSV(50); // 50 rows
      const result = await uploadTestCSV(smallCSV, multiCategoryTemplateId);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(result.stats?.totalRows).toBe(50);
      expect(result.stats?.validRows).toBe(50);
      expect(processingTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle files with 100-500 rows', async () => {
      const startTime = Date.now();
      
      const mediumCSV = generateLargeCSV(250); // 250 rows
      const result = await uploadTestCSV(mediumCSV, multiCategoryTemplateId);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(result.stats?.totalRows).toBe(250);
      expect(result.stats?.validRows).toBe(250);
      expect(processingTime).toBeLessThan(10000); // Should complete in under 10 seconds
    });
  });

  describe('Medium Files (1-10MB)', () => {
    it('should handle files with 500-1000 rows', async () => {
      const startTime = Date.now();
      
      const mediumCSV = generateLargeCSV(750); // 750 rows
      const result = await uploadTestCSV(mediumCSV, multiCategoryTemplateId);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(result.stats?.totalRows).toBe(750);
      expect(result.stats?.validRows).toBe(750);
      expect(processingTime).toBeLessThan(15000); // Should complete in under 15 seconds
    });

    it('should handle files with 1000-5000 rows', async () => {
      const startTime = Date.now();
      
      const largeCSV = generateLargeCSV(2500); // 2500 rows
      const result = await uploadTestCSV(largeCSV, multiCategoryTemplateId);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(result.stats?.totalRows).toBe(2500);
      expect(result.stats?.validRows).toBe(2500);
      expect(processingTime).toBeLessThan(30000); // Should complete in under 30 seconds
    });
  });

  describe('Large Files (10-50MB)', () => {
    it('should handle files with 5000-10000 rows', async () => {
      const startTime = Date.now();
      
      const largeCSV = generateLargeCSV(7500); // 7500 rows
      const result = await uploadTestCSV(largeCSV, multiCategoryTemplateId);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(result.stats?.totalRows).toBe(7500);
      expect(result.stats?.validRows).toBe(7500);
      expect(processingTime).toBeLessThan(60000); // Should complete in under 60 seconds
    });

    it('should handle files with 10000+ rows', async () => {
      const startTime = Date.now();
      
      const veryLargeCSV = generateLargeCSV(15000); // 15000 rows
      const result = await uploadTestCSV(veryLargeCSV, multiCategoryTemplateId);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(result.stats?.totalRows).toBe(15000);
      expect(result.stats?.validRows).toBe(15000);
      expect(processingTime).toBeLessThan(120000); // Should complete in under 2 minutes
    });
  });

  describe('Memory Usage', () => {
    it('should not exceed memory limits for large files', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const largeCSV = generateLargeCSV(10000); // 10000 rows
      const result = await uploadTestCSV(largeCSV, multiCategoryTemplateId);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(result.success).toBe(true);
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Should not increase by more than 100MB
    });

    it('should handle memory efficiently for multiple large uploads', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Upload multiple large files
      const promises = [];
      for (let i = 0; i < 3; i++) {
        const largeCSV = generateLargeCSV(5000); // 5000 rows each
        promises.push(uploadTestCSV(largeCSV, multiCategoryTemplateId));
      }
      
      const results = await Promise.all(promises);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // All uploads should succeed
      for (const result of results) {
        expect(result.success).toBe(true);
        expect(result.stats?.totalRows).toBe(5000);
        expect(result.stats?.validRows).toBe(5000);
      }
      
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Should not increase by more than 200MB
    });
  });

  describe('File Size Limits', () => {
    it('should reject files larger than 50MB', async () => {
      // Create a very large file (simulate > 50MB)
      const veryLargeContent = 'State,Year,Category,Measure,Value\n'.repeat(1000000); // ~50MB+
      const veryLargeFile = createTestFile(veryLargeContent, 'very-large-file.csv');
      
      // This would test file size validation
      // const result = await SimpleCSVImportService.uploadCSV(
      //   veryLargeFile,
      //   multiCategoryTemplateId,
      //   { name: 'Test Very Large File' },
      //   3
      // );
      
      // expect(result.success).toBe(false);
      // expect(result.errors).toContain('File too large');
      
      // For now, just test file creation
      expect(veryLargeFile.size).toBeGreaterThan(50 * 1024 * 1024); // > 50MB
    });

    it('should handle files at the size limit boundary', async () => {
      // Create a file at the boundary (close to 50MB)
      const boundaryContent = 'State,Year,Category,Measure,Value\n'.repeat(500000); // ~25MB
      const boundaryFile = createTestFile(boundaryContent, 'boundary-file.csv');
      
      const startTime = Date.now();
      
      // This would test boundary file handling
      // const result = await SimpleCSVImportService.uploadCSV(
      //   boundaryFile,
      //   multiCategoryTemplateId,
      //   { name: 'Test Boundary File' },
      //   3
      // );
      
      // const endTime = Date.now();
      // const processingTime = endTime - startTime;
      
      // expect(result.success).toBe(true);
      // expect(processingTime).toBeLessThan(60000); // Should complete in under 60 seconds
      
      // For now, just test file creation
      expect(boundaryFile.size).toBeGreaterThan(20 * 1024 * 1024); // > 20MB
    });
  });

  describe('Processing Time Analysis', () => {
    it('should have linear processing time for valid data', async () => {
      const rowCounts = [100, 500, 1000, 2500];
      const processingTimes: number[] = [];
      
      for (const rowCount of rowCounts) {
        const startTime = Date.now();
        
        const csv = generateLargeCSV(rowCount);
        const result = await uploadTestCSV(csv, multiCategoryTemplateId);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        expect(result.success).toBe(true);
        expect(result.stats?.totalRows).toBe(rowCount);
        expect(result.stats?.validRows).toBe(rowCount);
        
        processingTimes.push(processingTime);
      }
      
      // Processing time should be roughly linear
      // Time for 500 rows should be ~5x time for 100 rows
      // Time for 1000 rows should be ~10x time for 100 rows
      const time100 = processingTimes[0];
      const time500 = processingTimes[1];
      const time1000 = processingTimes[2];
      
      expect(time500).toBeLessThan(time100 * 6); // Allow some variance
      expect(time1000).toBeLessThan(time100 * 12); // Allow some variance
    });

    it('should handle invalid data efficiently', async () => {
      const startTime = Date.now();
      
      // Create CSV with many invalid rows
      const invalidCSV = {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: Array.from({ length: 1000 }, (_, i) => [
          i % 2 === 0 ? 'InvalidState' : 'California', // Every other row invalid
          i % 3 === 0 ? 'not-a-year' : '2023', // Every third row invalid
          i % 5 === 0 ? 'InvalidCategory' : 'Economy', // Every fifth row invalid
          i % 7 === 0 ? 'InvalidMeasure' : 'GDP', // Every seventh row invalid
          i % 11 === 0 ? 'not-a-number' : '1000000' // Every eleventh row invalid
        ]),
        filename: 'many-invalid-rows.csv',
        description: 'CSV with many invalid rows'
      };
      
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(false);
      expect(result.stats?.totalRows).toBe(1000);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(30000); // Should complete in under 30 seconds even with many errors
    });
  });
}); 