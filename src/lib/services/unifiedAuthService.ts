// Unified Authentication Service - Combines magic links and admin authentication
// Provides a single interface for all authentication needs

import { NextRequest, NextResponse } from 'next/server';
import { MagicLinkService } from './magicLinkService';
import { AdminAuthService } from './adminAuthService';
import { AuthService } from './authService';
import { 
  User, 
  Session, 
  MagicLinkInput, 
  LoginInput 
} from '../types/service-interfaces';
import { 
  createError, 
  ServiceError,
  AuthenticationError,
  AuthorizationError
} from '../errors';

export interface AuthResult {
  user: User;
  session: Session;
  authMethod: 'magic_link' | 'password';
}

export interface SessionValidationResult {
  user: User;
  session: Session;
  isValid: boolean;
}

export class UnifiedAuthService {
  /**
   * Authenticate user via magic link (for regular users)
   */
  static async authenticateWithMagicLink(token: string): Promise<AuthResult> {
    try {
      const user = await MagicLinkService.verifyMagicLink(token);
      
      // Create session for magic link user
      const session = await this.createSession(user.id);
      
      return {
        user,
        session,
        authMethod: 'magic_link'
      };
    } catch (error) {
      if (ServiceError.isServiceError(error)) {
        throw error;
      }
      throw createError.authentication('Magic link authentication failed');
    }
  }

  /**
   * Authenticate admin user via password
   */
  static async authenticateAdmin(input: LoginInput): Promise<AuthResult> {
    try {
      const result = await AdminAuthService.loginAdmin(input.email, input.password);
      
      return {
        user: result.user,
        session: result.session,
        authMethod: 'password'
      };
    } catch (error) {
      if (ServiceError.isServiceError(error)) {
        throw error;
      }
      throw createError.authentication('Admin authentication failed');
    }
  }

  /**
   * Create magic link for user authentication
   */
  static async createMagicLink(input: MagicLinkInput): Promise<string> {
    try {
      return await MagicLinkService.createMagicLink(input);
    } catch (error) {
      if (ServiceError.isServiceError(error)) {
        throw error;
      }
      throw createError.authentication('Failed to create magic link');
    }
  }

  /**
   * Reset admin password
   */
  static async resetAdminPassword(email: string): Promise<string> {
    try {
      return await AdminAuthService.resetAdminPassword(email);
    } catch (error) {
      if (ServiceError.isServiceError(error)) {
        throw error;
      }
      throw createError.authentication('Failed to reset admin password');
    }
  }

  /**
   * Reset admin password with token
   */
  static async resetAdminPasswordWithToken(token: string, newPassword: string): Promise<string> {
    try {
      return await AdminAuthService.resetPasswordWithToken(token, newPassword);
    } catch (error) {
      if (ServiceError.isServiceError(error)) {
        throw error;
      }
      throw createError.authentication('Failed to reset password');
    }
  }

  /**
   * Validate session and return user info
   */
  static async validateSession(sessionToken: string): Promise<User | null> {
    if (!sessionToken) {
      return null;
    }

    try {
      // First try admin session validation
      const adminUser = await AdminAuthService.validateAdminSession(sessionToken);
      if (adminUser) {
        return adminUser;
      }

      // If not admin, try regular session validation
      const user = await AuthService.validateSession(sessionToken);
      return user;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Logout user (works for both magic link and admin users)
   */
  static async logout(sessionToken: string): Promise<boolean> {
    if (!sessionToken) {
      return false;
    }

    try {
      // Try admin logout first
      const adminLogout = await AdminAuthService.logoutAdmin(sessionToken);
      if (adminLogout) {
        return true;
      }

      // If not admin, try regular logout
      const logout = await AuthService.logout(sessionToken);
      return logout;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Create session for user
   */
  private static async createSession(userId: number): Promise<Session> {
    // Use the same session creation logic as AdminAuthService
    return await AdminAuthService['createSession'](userId);
  }

  /**
   * Get authentication method for user
   */
  static getAuthMethod(user: User): 'magic_link' | 'password' {
    // If user has no password hash, they use magic links
    // If user has password hash, they use password authentication
    return user.passwordHash ? 'password' : 'magic_link';
  }

  /**
   * Check if user can use magic link authentication
   */
  static canUseMagicLink(user: User): boolean {
    return !user.passwordHash || user.role === 'user' || user.role === 'viewer';
  }

  /**
   * Check if user can use password authentication
   */
  static canUsePassword(user: User): boolean {
    return user.passwordHash && user.role === 'admin';
  }

  /**
   * Get appropriate authentication method for user
   */
  static getPreferredAuthMethod(user: User): 'magic_link' | 'password' {
    if (user.role === 'admin' && user.passwordHash) {
      return 'password';
    }
    return 'magic_link';
  }

  /**
   * Clean up expired sessions and tokens
   */
  static async cleanup(): Promise<{
    expiredSessions: number;
    expiredResetTokens: number;
    expiredMagicLinks: number;
  }> {
    const [expiredSessions, expiredResetTokens, expiredMagicLinks] = await Promise.all([
      AdminAuthService.cleanupExpiredSessions(),
      AdminAuthService.cleanupExpiredResetTokens(),
      MagicLinkService.cleanupExpiredMagicLinks(),
    ]);

    return {
      expiredSessions,
      expiredResetTokens,
      expiredMagicLinks,
    };
  }

  /**
   * Get user authentication status
   */
  static async getUserAuthStatus(userId: number): Promise<{
    hasPassword: boolean;
    hasActiveSessions: boolean;
    lastLoginAt?: Date;
    authMethod: 'magic_link' | 'password' | 'both';
  }> {
    const user = await AuthService.getUserById(userId);
    if (!user) {
      throw createError.userNotFound('User not found');
    }

    const hasPassword = Boolean(user.passwordHash);
    const hasActiveSessions = await this.hasActiveSessions(userId);
    const authMethod = hasPassword ? 'password' : 'magic_link';

    return {
      hasPassword,
      hasActiveSessions,
      lastLoginAt: user.lastLoginAt,
      authMethod,
    };
  }

  /**
   * Check if user has active sessions
   */
  private static async hasActiveSessions(userId: number): Promise<boolean> {
    // This would need to be implemented based on your session storage
    // For now, return false as a placeholder
    return false;
  }

  /**
   * Set up authentication for user
   */
  static async setupUserAuth(
    userId: number, 
    authMethod: 'magic_link' | 'password',
    password?: string
  ): Promise<void> {
    const user = await AuthService.getUserById(userId);
    if (!user) {
      throw createError.userNotFound('User not found');
    }

    if (authMethod === 'password') {
      if (!password) {
        throw createError.validation('Password is required for password authentication');
      }
      
      // Update user to have password
      await AuthService.changePassword(userId, password);
    } else {
      // For magic link, ensure user has no password
      // This is already handled in the user creation process
    }
  }
} 