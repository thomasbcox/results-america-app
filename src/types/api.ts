// API response types to replace 'any' usage

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ErrorApiResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
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
  dataQuality?: 'mock' | 'real';
  provenance?: string;
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
  statisticId: number;
  statisticName: string;
  unit: string;
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
  id: number;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface MagicLink {
  id: number;
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
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