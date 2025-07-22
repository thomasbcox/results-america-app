export interface FilterOptions {
  search?: string;
  category?: string;
  year?: number;
  state?: string;
  source?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function filterStatistics(data: any[], filters: FilterOptions): any[] {
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
    filtered = filtered.filter(item => 
      item.source?.toLowerCase().includes(filters.source?.toLowerCase())
    );
  }

  // Sort
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy!];
      const bVal = b[filters.sortBy!];
      
      if (aVal < bVal) return filters.sortOrder === 'desc' ? 1 : -1;
      if (aVal > bVal) return filters.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return filtered;
}

export function filterStates(data: any[], filters: FilterOptions): any[] {
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
      const aVal = a[filters.sortBy!];
      const bVal = b[filters.sortBy!];
      
      if (aVal < bVal) return filters.sortOrder === 'desc' ? 1 : -1;
      if (aVal > bVal) return filters.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return filtered;
}

export function filterDataPoints(data: any[], filters: FilterOptions): any[] {
  let filtered = [...data];

  // Year filter
  if (filters.year) {
    filtered = filtered.filter(item => item.year === filters.year);
  }

  // State filter
  if (filters.state) {
    filtered = filtered.filter(item => 
      item.stateName?.toLowerCase().includes(filters.state?.toLowerCase()) ||
      item.stateAbbreviation?.toLowerCase().includes(filters.state?.toLowerCase())
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