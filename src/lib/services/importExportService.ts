import { createState } from './statesService';
import { createCategory, getAllCategories } from './categoriesService';
import { getAllStatisticsWithSources } from './statisticsService';
import { getDataPointsForStatistic } from './dataPointsService';
import { getAllStates } from './statesService';

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeMetadata?: boolean;
  filters?: {
    category?: string;
    year?: number;
    state?: string;
  };
}

export async function importStatesFromCSV(csvData: string): Promise<ImportResult> {
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const data = lines.slice(1);
  
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const line = data[i];
    const values = line.split(',').map(v => v.trim());
    
    if (values.length < 2) {
      errors.push(`Line ${i + 2}: Invalid format`);
      continue;
    }

    try {
      const [name, abbreviation] = values;
      await createState({ name, abbreviation });
      imported++;
    } catch (error) {
      errors.push(`Line ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    message: `Imported ${imported} states${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    imported,
    errors
  };
}

export async function importCategoriesFromCSV(csvData: string): Promise<ImportResult> {
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const data = lines.slice(1);
  
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const line = data[i];
    const values = line.split(',').map(v => v.trim());
    
    if (values.length < 2) {
      errors.push(`Line ${i + 2}: Invalid format`);
      continue;
    }

    try {
      const [name, description, icon, sortOrder] = values;
      await createCategory({ 
        name, 
        description, 
        icon, 
        sortOrder: sortOrder ? parseInt(sortOrder) : undefined 
      });
      imported++;
    } catch (error) {
      errors.push(`Line ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    message: `Imported ${imported} categories${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    imported,
    errors
  };
}

export async function exportData(options: ExportOptions): Promise<string> {
  const { format, includeMetadata = true, filters } = options;
  
  let data: any = {};

  if (includeMetadata) {
    data.metadata = {
      exportedAt: new Date().toISOString(),
      format,
      filters
    };
  }

  // Export states
  data.states = await getAllStates();

  // Export categories
  data.categories = await getAllCategories();

  // Export statistics
  data.statistics = await getAllStatisticsWithSources();

  // Export data points if filters are provided
  if (filters) {
    if (filters.category) {
      const categoryStats = data.statistics.filter((s: any) => s.category === filters.category);
      data.dataPoints = [];
      
      for (const stat of categoryStats) {
        const points = await getDataPointsForStatistic(stat.id, filters.year);
        data.dataPoints.push(...points);
      }
    }
  }

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else if (format === 'csv') {
    return convertToCSV(data);
  } else {
    throw new Error('XLSX format not yet implemented');
  }
}

function convertToCSV(data: any): string {
  const lines: string[] = [];
  
  // States CSV
  lines.push('=== STATES ===');
  lines.push('id,name,abbreviation,isActive');
  data.states.forEach((state: any) => {
    lines.push(`${state.id},${state.name},${state.abbreviation},${state.isActive}`);
  });
  
  lines.push('');
  lines.push('=== CATEGORIES ===');
  lines.push('id,name,description,icon,sortOrder,isActive');
  data.categories.forEach((category: any) => {
    lines.push(`${category.id},${category.name},${category.description},${category.icon},${category.sortOrder},${category.isActive}`);
  });
  
  lines.push('');
  lines.push('=== STATISTICS ===');
  lines.push('id,name,raNumber,description,unit,category,source');
  data.statistics.forEach((stat: any) => {
    lines.push(`${stat.id},${stat.name},${stat.raNumber},${stat.description},${stat.unit},${stat.category},${stat.source}`);
  });
  
  if (data.dataPoints) {
    lines.push('');
    lines.push('=== DATA POINTS ===');
    lines.push('id,value,year,stateName,statisticName');
    data.dataPoints.forEach((point: any) => {
      lines.push(`${point.id},${point.value},${point.year},${point.stateName},${point.statisticName}`);
    });
  }
  
  return lines.join('\n');
} 