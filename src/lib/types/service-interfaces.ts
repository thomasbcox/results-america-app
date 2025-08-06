// Comprehensive Service Interfaces
// Following the ideal pattern from the programming guide

// ============================================================================
// DATA MANAGEMENT SERVICES
// ============================================================================

export interface IStatesService {
  getAllStates(useCache?: boolean): Promise<StateData[]>;
  getStatesWithPagination(options: PaginationOptions, filters?: FilterOptions): Promise<PaginatedResult<StateData>>;
  searchStates(query: string): Promise<StateData[]>;
  getStateById(id: number): Promise<StateData | null>;
  createState(data: CreateStateInput): Promise<StateData>;
  updateState(id: number, data: UpdateStateInput): Promise<StateData>;
  deleteState(id: number): Promise<boolean>;
}

export interface ICategoriesService {
  getAllCategories(): Promise<CategoryData[]>;
  getCategoryById(id: number): Promise<CategoryData | null>;
  createCategory(data: CreateCategoryInput): Promise<CategoryData>;
  updateCategory(id: number, data: UpdateCategoryInput): Promise<CategoryData>;
  deleteCategory(id: number): Promise<boolean>;
}

export interface IStatisticsService {
  getAllStatisticsWithSources(): Promise<StatisticData[]>;
  getStatisticById(id: number): Promise<StatisticData | null>;
  createStatistic(data: CreateStatisticInput): Promise<StatisticData>;
  updateStatistic(id: number, data: UpdateStatisticInput): Promise<StatisticData>;
  deleteStatistic(id: number): Promise<boolean>;
  getStatisticsByCategory(categoryId: number): Promise<StatisticData[]>;
}

export interface IStatisticsManagementService {
  updateStatistic(id: number, data: UpdateStatisticData): Promise<StatisticData>;
  getStatistic(id: number): Promise<StatisticData>;
}

export interface IDataPointsService {
  getDataPointsForState(stateId: number, year?: number): Promise<DataPointData[]>;
  getDataPointsForStatistic(statisticId: number, year?: number): Promise<DataPointData[]>;
  getDataPointsForComparison(stateIds: number[], statisticIds: number[], year: number): Promise<DataPointData[]>;
  createDataPoint(data: CreateDataPointInput): Promise<DataPointData>;
  updateDataPoint(id: number, data: UpdateDataPointInput): Promise<DataPointData>;
  deleteDataPoint(id: number): Promise<boolean>;
}

export interface IAggregationService {
  aggregate(params: AggregationParams): Promise<AggregationResult>;
  getStatisticComparison(statisticId: number, year?: number): Promise<ComparisonData>;
  getStateComparison(stateId: number, year?: number): Promise<StateComparisonData>;
  getTopBottomPerformers(statisticId: number, limit?: number, year?: number, order?: 'asc' | 'desc'): Promise<TopBottomPerformersData>;
  getTrendData(statisticId: number, stateId: number): Promise<TrendData>;
  getNationalAverage(statisticId: number, year?: number): Promise<number>;
}

export interface IDataAvailabilityService {
  getStatisticsWithData(): Promise<number[]>;
  getDataAvailabilityByState(stateId: number): Promise<DataAvailabilityData>;
  getDataAvailabilityByStatistic(statisticId: number): Promise<DataAvailabilityData>;
  getDataQualityMetrics(): Promise<DataQualityMetrics>;
}

export interface IExternalDataService {
  importData(data: ExternalDataImportInput): Promise<ImportResult>;
  validateImportData(data: ExternalDataImportInput): Promise<ValidationResult>;
  getImportHistory(): Promise<ImportSession[]>;
}

export interface IImportExportService {
  exportData(format: 'json' | 'csv', filters?: ExportFilters): Promise<ExportResult>;
  importData(data: ImportDataInput): Promise<ImportResult>;
  validateImportFormat(data: any): Promise<ValidationResult>;
}

export interface ICacheService {
  get<T>(key: string): T;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
  getStats(): CacheStats;
}

export interface IPaginationService {
  calculatePagination(options: PaginationOptions, totalItems: number): PaginationInfo;
  applyPagination<T>(items: T[], options: PaginationOptions): T[];
}

export interface IFilterService {
  filterStates(states: StateData[], filters: FilterOptions): StateData[];
  filterStatistics(statistics: StatisticData[], filters: FilterOptions): StatisticData[];
  filterDataPoints(dataPoints: DataPointData[], filters: FilterOptions): DataPointData[];
}

// ============================================================================
// DATA TYPES
// ============================================================================

export interface StateData {
  id: number;
  name: string;
  abbreviation: string;
  isActive: number;
}

export interface CategoryData {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: number;
}

export interface StatisticData {
  id: number;
  raNumber: string | null;
  categoryId: number;
  dataSourceId: number | null;
  name: string;
  description: string | null;
  subMeasure: string | null;
  calculation: string | null;
  unit: string;
  availableSince: string | null;
  dataQuality: 'mock' | 'real';
  provenance: string | null;
  preferenceDirection: 'higher' | 'lower' | 'neutral';
  isActive: number;
  categoryName?: string;
  dataSourceName?: string;
}

export interface DataPointData {
  id: number;
  statisticId: number;
  stateId: number;
  year: number;
  value: number;
  importSessionId: number | null;
  stateName?: string;
  statisticName?: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export type CreateStateInput = {
  name: string;
  abbreviation: string;
};

export type UpdateStateInput = Partial<CreateStateInput & { isActive: number }>;

export type CreateCategoryInput = {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type CreateStatisticInput = {
  raNumber?: string;
  categoryId: number;
  dataSourceId?: number;
  name: string;
  description?: string;
  subMeasure?: string;
  calculation?: string;
  unit: string;
  availableSince?: string;
  dataQuality?: 'mock' | 'real';
  provenance?: string;
  preferenceDirection?: 'higher' | 'lower' | 'neutral';
};

export type UpdateStatisticInput = Partial<CreateStatisticInput>;

export type UpdateStatisticData = {
  dataQuality?: 'mock' | 'real';
  provenance?: string;
  name?: string;
  description?: string;
  unit?: string;
  preferenceDirection?: 'higher' | 'lower' | 'neutral';
  isActive?: boolean;
};

export type CreateDataPointInput = {
  statisticId: number;
  stateId: number;
  year: number;
  value: number;
  importSessionId: number;
};

export type UpdateDataPointInput = Partial<CreateDataPointInput>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface FilterOptions {
  search?: string;
  categoryId?: number;
  stateId?: number;
  year?: number;
  dataQuality?: 'mock' | 'real';
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type AggregationParams = 
  | { type: 'statistic-comparison'; statisticId: number; year?: number; }
  | { type: 'state-comparison'; stateId: number; year?: number; }
  | { type: 'top-performers' | 'bottom-performers'; statisticId: number; limit?: number; year?: number; }
  | { type: 'trend-data'; statisticId: number; stateId: number; };

export type AggregationResult = ComparisonData | StateComparisonData | TopBottomPerformersData | TrendData;

export interface ComparisonData {
  statistic: StatisticData;
  year: number;
  states: Array<{
    state: StateData;
    value: number;
    rank: number;
    percentile: number;
  }>;
  nationalAverage: number;
}

export interface StateComparisonData {
  state: StateData;
  year: number;
  statistics: Array<{
    statistic: StatisticData;
    value: number;
    rank: number;
    percentile: number;
  }>;
}

export interface TopBottomPerformersData {
  statistic: StatisticData;
  year: number;
  performers: Array<{
    state: StateData;
    value: number;
    rank: number;
  }>;
}

export interface TrendData {
  statistic: StatisticData;
  state: StateData;
  trends: Array<{
    year: number;
    value: number;
    change: number;
    changePercent: number;
  }>;
}

export interface ExternalDataImportInput {
  source: string;
  data: any[];
  options?: {
    overwrite?: boolean;
    validateOnly?: boolean;
  };
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportSession {
  id: number;
  source: string;
  importedAt: Date;
  recordCount: number;
  status: 'success' | 'partial' | 'failed';
}

export interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  keys: string[];
}

export interface DataAvailabilityData {
  totalRecords: number;
  availableRecords: number;
  coverage: number;
  years: number[];
  states: StateData[];
}

export interface DataQualityMetrics {
  totalRecords: number;
  mockData: number;
  realData: number;
  qualityRatio: number;
}

export interface ExportFilters {
  states?: number[];
  categories?: number[];
  statistics?: number[];
  years?: number[];
  dataQuality?: 'mock' | 'real';
}

export interface ExportResult {
  data: any;
  format: string;
  filename: string;
  recordCount: number;
}

export interface ImportDataInput {
  data: any[];
  format: 'json' | 'csv';
  options?: {
    validateOnly?: boolean;
    overwrite?: boolean;
  };
} 