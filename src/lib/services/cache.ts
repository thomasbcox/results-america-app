interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
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