import { db } from '../db/index';
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

import type { StateData, CategoryData, StatisticData, DataPointData } from '@/types/api';

export async function exportData(options: ExportOptions): Promise<string> {
  const { format, includeMetadata = true, filters } = options;
  
  const data: {
    metadata?: {
      exportedAt: string;
      format: string;
      filters?: ExportOptions['filters'];
    };
    states: StateData[];
    categories: CategoryData[];
    statistics: StatisticData[];
    dataPoints?: DataPointData[];
  } = {
    states: [],
    categories: [],
    statistics: []
  };

  if (includeMetadata) {
    data.metadata = {
      exportedAt: new Date().toISOString(),
      format,
      filters
    };
  }

  // Export states
  const rawStates = await getAllStates(db, false); // Don't use cache for export
  data.states = rawStates.map(state => ({
    id: state.id,
    name: state.name,
    abbreviation: state.abbreviation,
    population: undefined,
    region: undefined
  }));

  // Export categories
  const rawCategories = await getAllCategories(db); // This doesn't use cache
  data.categories = rawCategories.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description || '',
    icon: category.icon || '',
    sortOrder: category.sortOrder || 0,
    statisticCount: undefined,
    hasData: undefined
  }));

  // Export statistics
  const rawStatistics = await getAllStatisticsWithSources(db);
  data.statistics = rawStatistics.map(stat => ({
    id: stat.id,
    name: stat.name,
    raNumber: stat.raNumber || '',
    description: stat.description || '',
    unit: stat.unit,
    availableSince: stat.availableSince || '',
    category: stat.category || '',
    source: stat.source || '',
    sourceUrl: stat.sourceUrl || '',
    hasData: undefined
  }));

  // Export data points if filters are provided
  if (filters) {
    if (filters.category) {
      const categoryStats = data.statistics.filter((s: StatisticData) => s.category === filters.category);
      data.dataPoints = [];
      
      for (const stat of categoryStats) {
        const rawPoints = await getDataPointsForStatistic(stat.id, filters.year);
        const transformedPoints = rawPoints.map(point => ({
          id: point.id,
          stateId: 0, // Not available in the query result
          stateName: point.stateName || '',
          statisticId: stat.id, // Use the current statistic ID
          statisticName: stat.name, // Use the current statistic name
          value: point.value,
          year: point.year,
          source: stat.source // Use the current statistic source
        }));
        data.dataPoints.push(...transformedPoints);
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

function convertToCSV(data: {
  states: StateData[];
  categories: CategoryData[];
  statistics: StatisticData[];
  dataPoints?: DataPointData[];
}): string {
  const lines: string[] = [];
  
  // States CSV
  lines.push('=== STATES ===');
  lines.push('id,name,abbreviation');
  data.states.forEach((state: StateData) => {
    lines.push(`${state.id},${state.name},${state.abbreviation}`);
  });
  
  lines.push('');
  lines.push('=== CATEGORIES ===');
  lines.push('id,name,description,icon,sortOrder');
  data.categories.forEach((category: CategoryData) => {
    lines.push(`${category.id},${category.name},${category.description},${category.icon},${category.sortOrder}`);
  });
  
  lines.push('');
  lines.push('=== STATISTICS ===');
  lines.push('id,name,raNumber,description,unit,category,source');
  data.statistics.forEach((stat: StatisticData) => {
    lines.push(`${stat.id},${stat.name},${stat.raNumber},${stat.description},${stat.unit},${stat.category},${stat.source}`);
  });
  
  if (data.dataPoints) {
    lines.push('');
    lines.push('=== DATA POINTS ===');
    lines.push('id,value,year,stateName,statisticName');
    data.dataPoints.forEach((point: DataPointData) => {
      lines.push(`${point.id},${point.value},${point.year},${point.stateName},${point.statisticName}`);
    });
  }
  
  return lines.join('\n');
} 