import type { FilterOptions, StateData, StatisticData, DataPointData, IFilterService } from '../types/service-interfaces';

export class FilterService {
  static filterStatistics(data: StatisticData[], filters: FilterOptions): StatisticData[] {
    return data.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(searchLower) ||
          (item.description && item.description.toLowerCase().includes(searchLower)) ||
          (item.raNumber && item.raNumber.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.categoryId && item.categoryId !== filters.categoryId) {
        return false;
      }

      // Data quality filter
      if (filters.dataQuality && item.dataQuality !== filters.dataQuality) {
        return false;
      }

      // Active filter
      if (filters.isActive !== undefined && item.isActive !== (filters.isActive ? 1 : 0)) {
        return false;
      }

      return true;
    });
  }

  static filterStates(data: StateData[], filters: FilterOptions): StateData[] {
    return data.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(searchLower) ||
          item.abbreviation.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Active filter
      if (filters.isActive !== undefined && item.isActive !== (filters.isActive ? 1 : 0)) {
        return false;
      }

      return true;
    });
  }

  static filterDataPoints(data: DataPointData[], filters: FilterOptions): DataPointData[] {
    return data.filter(item => {
      // State filter
      if (filters.stateId && item.stateId !== filters.stateId) {
        return false;
      }

      // Year filter
      if (filters.year && item.year !== filters.year) {
        return false;
      }

      return true;
    });
  }
} 