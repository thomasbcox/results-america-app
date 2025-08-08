import { getDbOrThrow } from '../db/index';
import { CategoriesService } from './categoriesService';
import { StatisticsService } from './statisticsService';
import { DataPointsService } from './dataPointsService';
import { StatesService } from './statesService';
import { importSessions } from '../db/schema-postgres';
import { eq } from 'drizzle-orm';
import type { 
  IImportExportService, 
  ExportFilters, 
  ExportResult, 
  ImportDataInput, 
  ImportResult, 
  ValidationResult 
} from '../types/service-interfaces';

export class ImportExportService {
  static async exportData(format: 'json' | 'csv', filters?: ExportFilters): Promise<ExportResult> {
    const db = getDbOrThrow();
    const exportData: any = {
      metadata: {
        exportedAt: new Date().toISOString(),
        format,
        filters: filters || {}
      },
      data: {}
    };

    try {
      // Export states
      if (!filters?.states || filters.states.length === 0) {
        try {
          const rawStates = await StatesService.getAllStates(false); // Don't use cache for export
          exportData.data.states = rawStates;
        } catch (error) {
          console.warn('Failed to export states:', error);
          exportData.data.states = [];
        }
      } else {
        try {
          const filteredStates = await Promise.all(
            filters.states.map(id => StatesService.getStateById(id))
          );
          exportData.data.states = filteredStates.filter(Boolean);
        } catch (error) {
          console.warn('Failed to export filtered states:', error);
          exportData.data.states = [];
        }
      }

      // Export categories
      if (!filters?.categories || filters.categories.length === 0) {
        try {
          const rawCategories = await CategoriesService.getAllCategories(); // This doesn't use cache
          exportData.data.categories = rawCategories;
        } catch (error) {
          console.warn('Failed to export categories:', error);
          exportData.data.categories = [];
        }
      } else {
        try {
          const filteredCategories = await Promise.all(
            filters.categories.map(id => CategoriesService.getCategoryById(id))
          );
          exportData.data.categories = filteredCategories.filter(Boolean);
        } catch (error) {
          console.warn('Failed to export filtered categories:', error);
          exportData.data.categories = [];
        }
      }

      // Export statistics
      if (!filters?.statistics || filters.statistics.length === 0) {
        try {
          const rawStatistics = await StatisticsService.getAllStatisticsWithSources();
          exportData.data.statistics = rawStatistics;
        } catch (error) {
          console.warn('Failed to export statistics:', error);
          exportData.data.statistics = [];
        }
      } else {
        try {
          const filteredStatistics = await Promise.all(
            filters.statistics.map(id => StatisticsService.getStatisticById(id))
          );
          exportData.data.statistics = filteredStatistics.filter(Boolean);
        } catch (error) {
          console.warn('Failed to export filtered statistics:', error);
          exportData.data.statistics = [];
        }
      }

      // Export data points
      if (filters?.years && filters.years.length > 0) {
        try {
          const allStatistics = await StatisticsService.getAllStatisticsWithSources();
          const allDataPoints = [];
          
          for (const stat of allStatistics) {
            for (const year of filters.years!) {
              const rawPoints = await DataPointsService.getDataPointsForStatistic(stat.id, year);
              allDataPoints.push(...rawPoints);
            }
          }
          
          exportData.dataPoints = allDataPoints;
        } catch (error) {
          console.warn('Failed to export data points:', error);
          exportData.dataPoints = [];
        }
      }

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `results-america-export-${timestamp}.${format}`;

      return {
        data: format === 'json' ? JSON.stringify(exportData, null, 2) : this.convertToCSV(exportData),
        format,
        filename,
        recordCount: this.countRecords(exportData.data)
      };

    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async importData(data: ImportDataInput): Promise<ImportResult> {
    const db = getDbOrThrow();
    const errors: string[] = [];
    let imported = 0;

    try {
      // Validate import format
      const validation = this.validateImportFormat(data.data);
      if (!validation.isValid) {
        return {
          success: false,
          imported: 0,
          errors: validation.errors,
          message: 'Import validation failed'
        };
      }

      // Create import session
      const [importSession] = await db.insert(importSessions).values({
        name: 'Manual Data Import',
        description: 'Manual data import via import/export service',
        recordCount: 0,
      }).returning();

      // Import data in dependency order
      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          try {
            if (item.type === 'state') {
              await StatesService.createState(item.data);
              imported++;
            } else if (item.type === 'category') {
              await CategoriesService.createCategory(item.data);
              imported++;
            } else if (item.type === 'statistic') {
              await StatisticsService.createStatistic(item.data);
              imported++;
            } else if (item.type === 'dataPoint') {
              await DataPointsService.createDataPoint({
                ...item.data,
                importSessionId: importSession.id
              });
              imported++;
            }
          } catch (error) {
            errors.push(`Failed to import ${item.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Update import session
      await db.update(importSessions)
        .set({ 
          recordCount: imported,
        })
        .where(eq(importSessions.id, importSession.id));

      return {
        success: errors.length === 0,
        imported,
        errors,
        message: `Imported ${imported} records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
      };

    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        message: 'Import failed'
      };
    }
  }

  static validateImportFormat(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid import data format');
      return { isValid: false, errors, warnings };
    }

    // Validate states
    if (data.states && !Array.isArray(data.states)) {
      errors.push('States must be an array');
    }

    // Validate categories
    if (data.categories && !Array.isArray(data.categories)) {
      errors.push('Categories must be an array');
    }

    // Validate statistics
    if (data.statistics && !Array.isArray(data.statistics)) {
      errors.push('Statistics must be an array');
    }

    // Validate data points
    if (data.dataPoints && !Array.isArray(data.dataPoints)) {
      errors.push('Data points must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static convertToCSV(data: any): string {
    // Simple CSV conversion - in a real implementation, you'd want a proper CSV library
    const csvLines: string[] = [];
    
    // Add headers
    csvLines.push('Type,ID,Name,Description');
    
    // Add data
    if (data.states) {
      data.states.forEach((state: any) => {
        csvLines.push(`State,${state.id},"${state.name}","${state.abbreviation}"`);
      });
    }
    
    if (data.categories) {
      data.categories.forEach((category: any) => {
        csvLines.push(`Category,${category.id},"${category.name}","${category.description || ''}"`);
      });
    }
    
    return csvLines.join('\n');
  }

  private static countRecords(data: any): number {
    let count = 0;
    if (data.states) count += data.states.length;
    if (data.categories) count += data.categories.length;
    if (data.statistics) count += data.statistics.length;
    if (data.dataPoints) count += data.dataPoints.length;
    return count;
  }
} 