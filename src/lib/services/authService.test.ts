import { AuthService } from './authService';
import { db } from '../db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('AuthService', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
  });

  describe('User Management', () => {
    it('should return null for non-existent user', async () => {
      const user = await AuthService.getUserById(999);
      expect(user).toBeNull();
    });

    it('should return null for non-existent email', async () => {
      const user = await AuthService.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should list all users when empty', async () => {
      const users = await AuthService.listUsers();
      expect(users).toHaveLength(0);
    });

    it('should get user statistics when empty', async () => {
      const stats = await AuthService.getUserStats();
      expect(stats.totalUsers).toBe(0);
      expect(stats.activeUsers).toBe(0);
      expect(stats.adminUsers).toBe(0);
      expect(stats.recentLogins).toBe(0);
    });

    it('should cleanup expired sessions when none exist', async () => {
      const cleanedCount = await AuthService.cleanupExpiredSessions();
      expect(cleanedCount).toBe(0);
    });

    it('should cleanup expired password reset tokens when none exist', async () => {
      const cleanedCount = await AuthService.cleanupExpiredResetTokens();
      expect(cleanedCount).toBe(0);
    });

    it('should log anonymous activity', async () => {
      await AuthService.logActivity(null, 'page_view', 'Homepage visited', '127.0.0.1', 'Test Browser');
      
      const allLogs = await db.select().from(userActivityLogs);
      const logs = allLogs.filter(log => log.userId === null);
      
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('page_view');
      expect(logs[0].details).toBe('Homepage visited');
    });

    it('should reject invalid session', async () => {
      const user = await AuthService.validateSession('invalid-token');
      expect(user).toBeNull();
    });

    it('should reject login for non-existent user', async () => {
      const result = await AuthService.login({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(result).toBeNull();
    });

    it('should handle password reset token creation for non-existent user', async () => {
      const token = await AuthService.createPasswordResetToken('nonexistent@example.com');
      expect(token).toBeNull();
    });
  });

  describe('Activity Logging', () => {
    it('should log multiple activities', async () => {
      await AuthService.logActivity(null, 'page_view', 'Homepage visited');
      await AuthService.logActivity(null, 'search', 'User searched for data');
      await AuthService.logActivity(null, 'download', 'User downloaded report');

      const allLogs = await db.select().from(userActivityLogs);
      const logs = allLogs.filter(log => log.userId === null);
      expect(logs).toHaveLength(3);
      expect(logs[0].action).toBe('page_view');
      expect(logs[1].action).toBe('search');
      expect(logs[2].action).toBe('download');
    });

    it('should log activity with IP and user agent', async () => {
      await AuthService.logActivity(null, 'login_attempt', 'Failed login', '192.168.1.1', 'Chrome/91.0');

      const allLogs = await db.select().from(userActivityLogs);
      const logs = allLogs.filter(log => log.userId === null);
      expect(logs).toHaveLength(1);
      expect(logs[0].ipAddress).toBe('192.168.1.1');
      expect(logs[0].userAgent).toBe('Chrome/91.0');
    });
  });

  describe('Session Management', () => {
    it('should handle session validation for non-existent token', async () => {
      const user = await AuthService.validateSession('non-existent-token');
      expect(user).toBeNull();
    });

    it('should handle logout for non-existent session', async () => {
      const result = await AuthService.logout('non-existent-token');
      expect(result).toBe(false);
    });
  });

  describe('Password Reset', () => {
    it('should handle password reset for non-existent user', async () => {
      const result = await AuthService.resetPassword('token', 'newpassword');
      expect(result).toBe(false);
    });
  });

  describe('Admin Functions', () => {
    it('should handle user activation for non-existent user', async () => {
      const result = await AuthService.activateUser(999);
      expect(result).toBe(false);
    });

    it('should handle user deactivation for non-existent user', async () => {
      const result = await AuthService.deactivateUser(999);
      expect(result).toBe(false);
    });

    it('should handle user deletion for non-existent user', async () => {
      const result = await AuthService.deleteUser(999);
      expect(result).toBe(false);
    });

    it('should handle user update for non-existent user', async () => {
      const result = await AuthService.updateUser(999, { name: 'Updated Name' });
      expect(result).toBeNull();
    });
  });
}); 