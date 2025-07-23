// API response types to replace 'any' usage

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Data types
export interface StateData {
  id: number;
  name: string;
  abbreviation: string;
  population?: number;
  region?: string;
}

export interface CategoryData {
  id: number;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  statisticCount?: number;
  hasData?: boolean;
}

export interface StatisticData {
  id: number;
  name: string;
  raNumber: string;
  description: string;
  unit: string;
  availableSince: string;
  category: string;
  source: string;
  sourceUrl: string;
  hasData?: boolean;
}

export interface DataPointData {
  id: number;
  stateId: number;
  stateName: string;
  statisticId: number;
  statisticName: string;
  value: number;
  year: number;
  source: string;
}

export interface MeasureData {
  states: string[];
  values: number[];
  average: number;
  year: number;
}

export interface StatePerformance {
  name: string;
  code: string;
  value: number;
  rank: number;
}

export interface AggregationData {
  type: 'statistic-comparison' | 'state-comparison' | 'top-performers' | 'bottom-performers' | 'trend-data';
  data: MeasureData | StatePerformance[] | unknown;
  metadata?: {
    totalStates: number;
    year: number;
    statisticId?: number;
  };
}

// Chart data types
export interface ChartDataPoint {
  year: number;
  value: number;
  national: number;
}

export interface ChartData {
  [stateName: string]: ChartDataPoint[];
}

// User types
export interface User {
  email: string;
  name?: string;
  sessionExpiry: number;
}

// Selection types
export interface SelectionState {
  selectedStates: string[];
  selectedCategory: string | null;
  selectedMeasure: number | null;
  favorites: number[];
}

// Error response types
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
} 