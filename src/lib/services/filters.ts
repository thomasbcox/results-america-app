export interface FilterOptions {
  search?: string;
  category?: string;
  year?: number;
  state?: string;
  source?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

import type { StatisticData, StateData, DataPointData } from '@/types/api';

export function filterStatistics(data: StatisticData[], filters: FilterOptions): StatisticData[] {
  let filtered = [...data];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower)
    );
  }

  // Category filter
  if (filters.category) {
    filtered = filtered.filter(item => 
      item.category?.toLowerCase() === filters.category?.toLowerCase()
    );
  }

  // Source filter
  if (filters.source) {
    const sourceFilter = filters.source.toLowerCase();
    filtered = filtered.filter(item => 
      item.source?.toLowerCase().includes(sourceFilter)
    );
  }

  // Sort
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy! as keyof StatisticData];
      const bVal = b[filters.sortBy! as keyof StatisticData];
      
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return filters.sortOrder === 'desc' ? -1 : 1;
      if (bVal == null) return filters.sortOrder === 'desc' ? 1 : -1;
      
      if (aVal < bVal) return filters.sortOrder === 'desc' ? 1 : -1;
      if (aVal > bVal) return filters.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return filtered;
}

export function filterStates(data: StateData[], filters: FilterOptions): StateData[] {
  let filtered = [...data];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.name?.toLowerCase().includes(searchLower) ||
      item.abbreviation?.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy! as keyof StateData];
      const bVal = b[filters.sortBy! as keyof StateData];
      
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return filters.sortOrder === 'desc' ? -1 : 1;
      if (bVal == null) return filters.sortOrder === 'desc' ? 1 : -1;
      
      if (aVal < bVal) return filters.sortOrder === 'desc' ? 1 : -1;
      if (aVal > bVal) return filters.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return filtered;
}

export function filterDataPoints(data: DataPointData[], filters: FilterOptions): DataPointData[] {
  let filtered = [...data];

  // Year filter
  if (filters.year) {
    filtered = filtered.filter(item => item.year === filters.year);
  }

  // State filter
  if (filters.state) {
    const stateFilter = filters.state.toLowerCase();
    filtered = filtered.filter(item => 
      item.stateName?.toLowerCase().includes(stateFilter)
    );
  }

  // Sort by value
  if (filters.sortBy === 'value') {
    filtered.sort((a, b) => {
      if (a.value < b.value) return filters.sortOrder === 'desc' ? 1 : -1;
      if (a.value > b.value) return filters.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return filtered;
} 