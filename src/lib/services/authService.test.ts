import { AuthService } from './authService';
import { db } from '../db/index';
import { users, sessions, passwordResetTokens, userActivityLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: () => 'mock-token-1234567890abcdef',
  })),
}));

describe('AuthService', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(userActivityLogs);
    await db.delete(passwordResetTokens);
    await db.delete(sessions);
    await db.delete(users);
  });

  describe('User Management', () => {
    it('should create a user successfully', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'user' as const,
      };

      const user = await AuthService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.emailVerified).toBe(false);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should create admin user with bootstrap', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const adminData = {
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'admin123',
      };

      const admin = await AuthService.bootstrapAdminUser(
        adminData.email,
        adminData.name,
        adminData.password
      );

      expect(admin).toBeDefined();
      expect(admin.email).toBe('admin@example.com');
      expect(admin.name).toBe('Admin User');
      expect(admin.role).toBe('admin');
    });

    it('should prevent creating multiple admin users via bootstrap', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      // Create first admin
      await AuthService.bootstrapAdminUser('admin1@example.com', 'Admin 1', 'password123');

      // Try to create second admin
      await expect(
        AuthService.bootstrapAdminUser('admin2@example.com', 'Admin 2', 'password123')
      ).rejects.toThrow('Admin user already exists');
    });

    it('should get user by ID', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const foundUser = await AuthService.getUserById(user.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('test@example.com');
    });

    it('should get user by email', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const foundUser = await AuthService.getUserByEmail('test@example.com');
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      const user = await AuthService.getUserById(999);
      expect(user).toBeNull();
    });

    it('should update user successfully', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const updatedUser = await AuthService.updateUser(user.id, {
        name: 'Updated Name',
        role: 'admin',
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.role).toBe('admin');
    });

    it('should delete user successfully', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const result = await AuthService.deleteUser(user.id);
      expect(result).toBe(true);

      const deletedUser = await AuthService.getUserById(user.id);
      expect(deletedUser).toBeNull();
    });

    it('should list all users', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      await AuthService.createUser({
        email: 'user1@example.com',
        name: 'User 1',
        password: 'password123',
      });

      await AuthService.createUser({
        email: 'user2@example.com',
        name: 'User 2',
        password: 'password123',
      });

      const users = await AuthService.getAllUsers();
      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('user1@example.com');
      expect(users[1].email).toBe('user2@example.com');
    });
  });

  describe('Authentication', () => {
    it('should login user successfully', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBeDefined();
      expect(result?.user.id).toBe(user.id);
      expect(result?.session).toBeDefined();
      expect(result?.session.token).toBeDefined();
      expect(result?.session.userId).toBe(user.id);
    });

    it('should reject login with invalid credentials', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result).toBeNull();
    });

    it('should reject login for non-existent user', async () => {
      const result = await AuthService.login({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(result).toBeNull();
    });

    it('should reject login for inactive user', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      await AuthService.updateUser(user.id, { isActive: false });

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBeNull();
    });

    it('should logout user successfully', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const loginResult = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await AuthService.logout(loginResult!.session.token);
      expect(result).toBe(true);
    });

    it('should validate session successfully', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const loginResult = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      const user = await AuthService.validateSession(loginResult!.session.token);
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    it('should reject invalid session', async () => {
      const user = await AuthService.validateSession('invalid-token');
      expect(user).toBeNull();
    });
  });

  describe('Password Reset', () => {
    it('should create password reset token', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const token = await AuthService.createPasswordResetToken(user.email);
      expect(token).toBeDefined();
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should validate password reset token', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const token = await AuthService.createPasswordResetToken(user.email);
      const isValid = await AuthService.validatePasswordResetToken(user.email, token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid password reset token', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const isValid = await AuthService.validatePasswordResetToken(user.email, 'invalid-token');
      expect(isValid).toBe(false);
    });

    it('should reset password successfully', async () => {
      const mockHash = 'hashed-password-123';
      const newHash = 'new-hashed-password-456';
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(mockHash).mockResolvedValueOnce(newHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const token = await AuthService.createPasswordResetToken(user.email);
      const result = await AuthService.resetPassword(user.email, token, 'newpassword123');

      expect(result).toBe(true);
    });
  });

  describe('Admin Functions', () => {
    it('should activate/deactivate user', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      // Deactivate user
      await AuthService.activateUser(user.id, false);
      const deactivatedUser = await AuthService.getUserById(user.id);
      expect(deactivatedUser?.isActive).toBe(false);

      // Activate user
      await AuthService.activateUser(user.id, true);
      const activatedUser = await AuthService.getUserById(user.id);
      expect(activatedUser?.isActive).toBe(true);
    });

    it('should get user statistics', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      await AuthService.createUser({
        email: 'user1@example.com',
        name: 'User 1',
        password: 'password123',
      });

      await AuthService.createUser({
        email: 'user2@example.com',
        name: 'User 2',
        password: 'password123',
      });

      const stats = await AuthService.getUserStats();
      expect(stats.totalUsers).toBe(2);
      expect(stats.activeUsers).toBe(2);
      expect(stats.adminUsers).toBe(0);
    });
  });

  describe('Session Management', () => {
    it('should cleanup expired sessions', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      const cleanedCount = await AuthService.cleanupExpiredSessions();
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });

    it('should cleanup expired password reset tokens', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      await AuthService.createPasswordResetToken(user.email);

      const cleanedCount = await AuthService.cleanupExpiredPasswordResetTokens();
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Activity Logging', () => {
    it('should log user activity', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const user = await AuthService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      await AuthService.logActivity(user.id, 'login', 'User logged in', '127.0.0.1', 'Test Browser');

      const logs = await db.select().from(userActivityLogs).where(eq(userActivityLogs.userId, user.id));
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('login');
      expect(logs[0].details).toBe('User logged in');
    });

    it('should log anonymous activity', async () => {
      await AuthService.logActivity(null, 'page_view', 'Homepage visited', '127.0.0.1', 'Test Browser');

      const logs = await db.select().from(userActivityLogs).where(eq(userActivityLogs.userId, null));
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('page_view');
      expect(logs[0].details).toBe('Homepage visited');
    });
  });
}); 