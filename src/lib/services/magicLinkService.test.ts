import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MagicLinkService } from './magicLinkService';
import { db } from '@/lib/db';
import { magicLinks, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createError } from '@/lib/errors';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('MagicLinkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createMagicLink', () => {
    it('should create magic link for existing user', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        isActive: true,
        emailVerified: true,
      };

      const mockMagicLink = {
        id: 1,
        userId: 1,
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      // Mock database calls with correct Drizzle API
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockMagicLink]),
        }),
      });

      const result = await MagicLinkService.createMagicLink({
        email: 'user@example.com',
        name: 'Test User',
      });

      expect(result).toContain('auth/verify?token=');
      expect(db.insert).toHaveBeenCalled();
    });

    it('should create magic link for new user', async () => {
      const mockNewUser = {
        id: 2,
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
        isActive: true,
        emailVerified: false,
      };

      const mockMagicLink = {
        id: 1,
        userId: 2,
        token: 'test-token-456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      // Mock user not found, then user creation, then magic link creation
      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockNewUser]),
            }),
          }),
        });

      (db.insert as jest.Mock)
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockNewUser]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockMagicLink]),
          }),
        });

      const result = await MagicLinkService.createMagicLink({
        email: 'newuser@example.com',
        name: 'New User',
      });

      expect(result).toContain('auth/verify?token=');
      expect(db.insert).toHaveBeenCalledTimes(2); // User + Magic Link
    });





    it('should handle database errors gracefully', async () => {
      // Mock all database operations to throw an error
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });
      (db.insert as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(
        MagicLinkService.createMagicLink({
          email: 'user@example.com',
          name: 'Test User',
        })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('verifyMagicLink', () => {
    it('should verify valid magic link', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        isActive: true,
        emailVerified: true,
        lastLoginAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMagicLink = {
        id: 1,
        email: 'user@example.com',
        token: 'a'.repeat(64), // 32 bytes * 2 hex chars
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      // Mock magic link lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockMagicLink]),
          }),
        }),
      });

      // Mock user lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // Mock magic link update
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockMagicLink]),
          }),
        }),
      });

      const result = await MagicLinkService.verifyMagicLink('a'.repeat(64));

      expect(result).toEqual(mockUser);
      expect(db.update).toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        MagicLinkService.verifyMagicLink('invalid-token')
      ).rejects.toThrow('Invalid magic link');
    });

    it('should throw error for expired token', async () => {
      const mockExpiredMagicLink = {
        id: 1,
        email: 'user@example.com',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
        used: false,
        createdAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockExpiredMagicLink]),
          }),
        }),
      });

      await expect(
        MagicLinkService.verifyMagicLink('a'.repeat(64))
      ).rejects.toThrow('Magic link has expired');
    });

    it('should throw error for used token', async () => {
      const mockUsedMagicLink = {
        id: 1,
        email: 'user@example.com',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: true, // Already used
        createdAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUsedMagicLink]),
          }),
        }),
      });

      await expect(
        MagicLinkService.verifyMagicLink('a'.repeat(64))
      ).rejects.toThrow('Magic link has already been used');
    });

    it('should throw error for deactivated user', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        isActive: false, // Deactivated
        emailVerified: true,
        lastLoginAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMagicLink = {
        id: 1,
        email: 'user@example.com',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      // Mock magic link lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockMagicLink]),
          }),
        }),
      });

      // Mock user lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      await expect(
        MagicLinkService.verifyMagicLink('a'.repeat(64))
      ).rejects.toThrow('User account is deactivated');
    });
  });

  describe('cleanupExpiredMagicLinks', () => {
    it('should delete expired magic links', async () => {
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          changes: 2,
        }),
      });

      const result = await MagicLinkService.cleanupExpiredMagicLinks();

      expect(result).toBe(2);
      expect(db.delete).toHaveBeenCalled();
    });
  });

}); 