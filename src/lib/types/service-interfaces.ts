// Service Interfaces - Defines contracts for all service classes
// This ensures consistent patterns and type safety across the application

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
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

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface UpdateUserInput {
  name?: string;
  role?: 'admin' | 'user' | 'viewer';
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface MagicLinkInput {
  email: string;
  name?: string;
}

export interface PasswordResetInput {
  email: string;
  origin: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  recentLogins: number;
}

export interface ActivityLog {
  id: number;
  userId: number | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  userEmail: string | null;
  userName: string | null;
}

// Core Service Interfaces
export interface IAuthService {
  // User Management
  createUser(input: CreateUserInput): Promise<User>;
  getUserById(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: number, input: UpdateUserInput): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  getUserStats(): Promise<UserStats>;
  
  // Authentication
  login(input: LoginInput): Promise<{ user: User; session: Session } | null>;
  logout(sessionToken: string): Promise<boolean>;
  validateSession(token: string): Promise<User | null>;
  
  // Password Management
  changePassword(userId: number, newPassword: string): Promise<boolean>;
  
  // Admin Functions
  bootstrapAdminUser(email: string, name: string, password: string): Promise<User>;
  getAdminUsers(): Promise<User[]>;
  activateUser(userId: number): Promise<boolean>;
  deactivateUser(userId: number): Promise<boolean>;
  
  // Maintenance
  cleanupExpiredSessions(): Promise<number>;
  cleanupExpiredResetTokens(): Promise<number>;
  
  // Activity Logging
  logActivity(userId: number | null, action: string, details?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
}

export interface IMagicLinkService {
  createMagicLink(input: MagicLinkInput): Promise<string>;
  verifyMagicLink(token: string): Promise<User>;
  cleanupExpiredMagicLinks(): Promise<number>;
}

export interface IPasswordResetService {
  initiatePasswordReset(input: PasswordResetInput): Promise<{ message: string; resetUrl?: string }>;
  validateResetToken(token: string): Promise<boolean>;
  resetPassword(input: ResetPasswordInput): Promise<string>;
  cleanupExpiredResetTokens(): Promise<number>;
}

export interface IAdminAuthService {
  loginAdmin(email: string, password: string): Promise<{ user: User; session: Session }>;
  resetAdminPassword(email: string): Promise<string>;
  validateAdminSession(token: string): Promise<User | null>;
}

// Statistics Service Interfaces
export interface IStatisticsService {
  getStatistics(): Promise<any[]>;
  getStatisticsByCategory(categoryId: number): Promise<any[]>;
  getStatisticsByState(stateId: number): Promise<any[]>;
  getStatisticsByMeasure(measureId: number): Promise<any[]>;
}

export interface IStatesService {
  getStates(): Promise<any[]>;
  getStateById(id: number): Promise<any | null>;
  getStateByCode(code: string): Promise<any | null>;
}

export interface ICategoriesService {
  getCategories(): Promise<any[]>;
  getCategoryById(id: number): Promise<any | null>;
  getCategoryAvailability(): Promise<any[]>;
}

export interface IDataPointsService {
  getDataPoints(filters?: any): Promise<any[]>;
  getDataPointsByState(stateId: number): Promise<any[]>;
  getDataPointsByMeasure(measureId: number): Promise<any[]>;
}

export interface IAggregationService {
  getAggregatedData(filters?: any): Promise<any>;
  getStateRankings(categoryId?: number): Promise<any[]>;
  getTrendData(measureId: number, stateId: number): Promise<any[]>;
}

// Admin Service Interfaces
export interface IAdminService {
  getSystemStats(): Promise<any>;
  getDataQualityMetrics(): Promise<any>;
  getExternalDataStatus(): Promise<any>;
}

export interface IExternalDataService {
  importExternalData(data: any): Promise<any>;
  queryExternalData(filters: any): Promise<any>;
  validateExternalData(data: any): Promise<any>;
}

export interface IImportExportService {
  exportData(format: string, filters?: any): Promise<any>;
  importData(data: any, format: string): Promise<any>;
  validateImportData(data: any): Promise<any>;
}

// Cache Service Interface
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): Promise<any>;
} 