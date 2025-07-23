import { CacheMissError } from '../errors';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T {
    const entry = this.cache.get(key);
    if (!entry) {
      throw new CacheMissError(`Cache entry not found for key: ${key}`, key);
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      throw new CacheMissError(`Cache entry expired for key: ${key}`, key);
    }

    return entry.data as T;
  }

  getOptional<T>(key: string): T | null {
    try {
      return this.get<T>(key);
    } catch (error) {
      if (error instanceof CacheMissError) {
        return null;
      }
      throw error;
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cache keys for different data types
  static keys = {
    states: 'states',
    categories: 'categories',
    categoriesWithStats: 'categories-with-stats',
    statistics: 'statistics',
    statisticsByCategory: (category: string) => `statistics-category-${category}`,
    dataPointsByState: (stateId: number, year?: number) => 
      `data-points-state-${stateId}${year ? `-${year}` : ''}`,
    dataPointsByStatistic: (statisticId: number, year?: number) => 
      `data-points-statistic-${statisticId}${year ? `-${year}` : ''}`,
  };
}

export const cache = new Cache(); 