import { AuthService } from './authService';
import { BootstrapAdminSchema } from '../validators';
import { ServiceError } from '../errors';
import type { BootstrapAdminSchema as BootstrapAdminType } from '../validators';

export interface BootstrapResult {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  message: string;
}

export class BootstrapService {
  /**
   * Bootstrap an admin user with proper validation and error handling
   */
  static async bootstrapAdminUser(data: BootstrapAdminType): Promise<BootstrapResult> {
    try {
      // Validate input data
      const validatedData = BootstrapAdminSchema.parse(data);
      
      // Check if admin user already exists
      const existingAdmin = await AuthService.getUserByEmail(validatedData.email);
      if (existingAdmin) {
        throw new ServiceError('Admin user already exists', 'CONFLICT_ERROR', 409);
      }
      
      // Create admin user
      const adminUser = await AuthService.bootstrapAdminUser(
        validatedData.email,
        validatedData.name,
        validatedData.password
      );
      
      return {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          isActive: adminUser.isActive,
          emailVerified: adminUser.emailVerified,
          lastLoginAt: adminUser.lastLoginAt,
          createdAt: adminUser.createdAt,
          updatedAt: adminUser.updatedAt,
        },
        message: 'Admin user created successfully'
      };
    } catch (error) {
      // Handle specific database errors
      if (error instanceof Error) {
        if (error.message.includes('SQLITE_CONSTRAINT_UNIQUE') || 
            error.message.includes('UNIQUE constraint failed')) {
          throw new ServiceError('User with this email already exists', 'CONFLICT_ERROR', 409);
        }
      }
      
      // Re-throw ServiceError instances
      if (ServiceError.isServiceError(error)) {
        throw error;
      }
      
      // Wrap other errors
      throw new Error('Failed to bootstrap admin user');
    }
  }
  
  /**
   * Check if bootstrap is allowed in current environment
   */
  static isBootstrapAllowed(): boolean {
    // Only allow bootstrap in development or with proper secret
    return process.env.NODE_ENV === 'development' || 
           process.env.BOOTSTRAP_SECRET !== undefined;
  }
  
  /**
   * Validate bootstrap secret if required
   */
  static validateBootstrapSecret(secret?: string): boolean {
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    const expectedSecret = process.env.BOOTSTRAP_SECRET;
    if (!expectedSecret) {
      return false;
    }
    
    return secret === expectedSecret;
  }
} 