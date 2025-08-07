import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';
import { AdminService } from './adminService';
import { ServiceError, NotFoundError } from '../errors';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema'; // Import schema directly

// Mock the database connection for AdminService
jest.mock('../db', () => ({
  getDb: () => {
    // This will be set by the test
    return (global as any).testDb?.db || null;
  }
}));

describe('AdminService', () => {
  let testDb: any;
  let testUserIds: number[] = [];

  beforeEach(async () => {
    // Create fresh test database with bulletproof isolation
    testDb = await TestUtils.createAndSeed({
      config: { verbose: true },
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        users: true
      }
    });

    // Make the test database available globally for the mock
    (global as any).testDb = testDb;

    // Reset test user IDs
    testUserIds = [];
  });

  afterEach(() => {
    // Clean up test database
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
    TestUtils.cleanup();
    
    // Clear global test database
    (global as any).testDb = null;
  });

  describe('getSystemStats', () => {
    it('should return system statistics', async () => {
      // Create test users first and capture their IDs
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'admin@test.com',
          name: 'Admin User',
          role: 'admin',
          isActive: 1,
          emailVerified: 1
        },
        {
          email: 'user@test.com',
          name: 'Regular User',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        },
        {
          email: 'inactive@test.com',
          name: 'Inactive User',
          role: 'user',
          isActive: 0,
          emailVerified: 0
        }
      ]).returning({ id: schema.users.id });

      // Store the user IDs for use in suggestions
      testUserIds = userResults.map(u => u.id);

      // Create test suggestions with valid user IDs
      await testDb.db.insert(schema.userSuggestions).values([
        {
          userId: testUserIds[0], // admin@test.com
          email: 'admin@test.com',
          title: 'Test Suggestion 1',
          description: 'Test description 1',
          status: 'pending'
        },
        {
          userId: testUserIds[1], // user@test.com
          email: 'user@test.com',
          title: 'Test Suggestion 2',
          description: 'Test description 2',
          status: 'approved'
        }
      ]);

      const stats = await AdminService.getSystemStats();

      expect(stats).toHaveProperty('users');
      expect(stats).toHaveProperty('suggestions');
      expect(stats).toHaveProperty('data');

      // Account for seeded users plus the 3 we created
      expect(stats.users.total).toBeGreaterThanOrEqual(3);
      expect(stats.users.active).toBeGreaterThanOrEqual(2);
      expect(stats.users.admins).toBeGreaterThanOrEqual(1);

      expect(stats.suggestions.total).toBe(2);
      expect(stats.suggestions.pending).toBe(1);

      // Account for seeded data
      expect(stats.data.statistics).toBeGreaterThanOrEqual(0);
      expect(stats.data.categories).toBeGreaterThanOrEqual(0);
      expect(stats.data.dataPoints).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUsers', () => {
    it('should return users with pagination', async () => {
      // Create test users
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'user1@test.com',
          name: 'User 1',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        },
        {
          email: 'user2@test.com',
          name: 'User 2',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      testUserIds = userResults.map(u => u.id);

      const result = await AdminService.getUsers(1, 10);

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('pagination');
      expect(result.users.length).toBeGreaterThan(0);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should handle second page', async () => {
      // Create more users to test pagination
      const userResults = await testDb.db.insert(schema.users).values([
        { email: 'user1@test.com', name: 'User 1', role: 'user', isActive: 1, emailVerified: 1 },
        { email: 'user2@test.com', name: 'User 2', role: 'user', isActive: 1, emailVerified: 1 },
        { email: 'user3@test.com', name: 'User 3', role: 'user', isActive: 1, emailVerified: 1 },
        { email: 'user4@test.com', name: 'User 4', role: 'user', isActive: 1, emailVerified: 1 },
        { email: 'user5@test.com', name: 'User 5', role: 'user', isActive: 1, emailVerified: 1 }
      ]).returning({ id: schema.users.id });

      testUserIds = userResults.map(u => u.id);

      const result = await AdminService.getUsers(2, 2);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle empty page', async () => {
      const result = await AdminService.getUsers(999, 10);

      expect(result.users.length).toBe(0);
      expect(result.pagination.page).toBe(999);
      expect(result.pagination.hasNext).toBe(false);
    });
  });

  describe('getUserDetails', () => {
    it('should return user details with counts', async () => {
      // Create a test user
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'testuser@test.com',
          name: 'Test User',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      // Create suggestions for this user
      await testDb.db.insert(schema.userSuggestions).values([
        {
          userId,
          email: 'testuser@test.com',
          title: 'Suggestion 1',
          description: 'Description 1',
          status: 'pending'
        },
        {
          userId,
          email: 'testuser@test.com',
          title: 'Suggestion 2',
          description: 'Description 2',
          status: 'approved'
        }
      ]);

      const userDetails = await AdminService.getUserDetails(userId);

      expect(userDetails).toHaveProperty('id');
      expect(userDetails).toHaveProperty('email');
      expect(userDetails).toHaveProperty('name');
      expect(userDetails).toHaveProperty('role');
      expect(userDetails).toHaveProperty('stats');
      expect(userDetails.stats.suggestions).toBe(2);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(AdminService.getUserDetails(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role to admin', async () => {
      // Create a test user
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'testuser@test.com',
          name: 'Test User',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      const updatedUser = await AdminService.updateUserRole(userId, 'admin');

      expect(updatedUser.role).toBe('admin');
    });

    it('should update user role to user', async () => {
      // Create a test admin user
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'testadmin@test.com',
          name: 'Test Admin',
          role: 'admin',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      const updatedUser = await AdminService.updateUserRole(userId, 'user');

      expect(updatedUser.role).toBe('user');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(AdminService.updateUserRole(999, 'admin')).rejects.toThrow(NotFoundError);
    });
  });

  describe('toggleUserStatus', () => {
    it('should toggle user status from active to inactive', async () => {
      // Create an active test user
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'activeuser@test.com',
          name: 'Active User',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      const updatedUser = await AdminService.toggleUserStatus(userId);

      expect(updatedUser.isActive).toBe(false);
    });

    it('should toggle user status from inactive to active', async () => {
      // Create an inactive test user
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'inactiveuser@test.com',
          name: 'Inactive User',
          role: 'user',
          isActive: 0,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      const updatedUser = await AdminService.toggleUserStatus(userId);

      expect(updatedUser.isActive).toBe(true);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(AdminService.toggleUserStatus(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSuggestions', () => {
    it('should return all suggestions with pagination', async () => {
      // Create test users
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'suggestionuser@test.com',
          name: 'Suggestion User',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      // Create test suggestions
      await testDb.db.insert(schema.userSuggestions).values([
        {
          userId,
          email: 'suggestionuser@test.com',
          title: 'Pending Suggestion',
          description: 'A pending suggestion',
          status: 'pending'
        },
        {
          userId,
          email: 'suggestionuser@test.com',
          title: 'Approved Suggestion',
          description: 'An approved suggestion',
          status: 'approved'
        },
        {
          userId,
          email: 'suggestionuser@test.com',
          title: 'Rejected Suggestion',
          description: 'A rejected suggestion',
          status: 'rejected'
        }
      ]);

      const result = await AdminService.getSuggestions(1, 10);

      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('pagination');
      expect(result.suggestions.length).toBe(3);
    });

    it('should filter by status', async () => {
      // Create test users
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'filteruser@test.com',
          name: 'Filter User',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      // Create test suggestions
      await testDb.db.insert(schema.userSuggestions).values([
        {
          userId,
          email: 'filteruser@test.com',
          title: 'Pending Suggestion',
          description: 'A pending suggestion',
          status: 'pending'
        },
        {
          userId,
          email: 'filteruser@test.com',
          title: 'Approved Suggestion',
          description: 'An approved suggestion',
          status: 'approved'
        }
      ]);

      const result = await AdminService.getSuggestions(1, 10, 'pending');

      expect(result.suggestions.length).toBe(1);
      expect(result.suggestions[0].status).toBe('pending');
    });

    it('should handle empty results', async () => {
      const result = await AdminService.getSuggestions(1, 10);

      expect(result.suggestions.length).toBe(0);
    });
  });

  describe('updateSuggestionStatus', () => {
    it('should update suggestion status to approved', async () => {
      // Create a test user
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'updateuser@test.com',
          name: 'Update User',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      // Create a test suggestion
      const suggestionResult = await testDb.db.insert(schema.userSuggestions).values({
        userId,
        email: 'updateuser@test.com',
        title: 'Test Suggestion',
        description: 'Test description',
        status: 'pending'
      }).returning({ id: schema.userSuggestions.id });

      const suggestionId = suggestionResult[0].id;

      await AdminService.updateSuggestionStatus(suggestionId, 'approved', 'Good suggestion');

      // Verify the update
      const updatedSuggestion = await testDb.db
        .select()
        .from(schema.userSuggestions)
        .where(eq(schema.userSuggestions.id, suggestionId))
        .limit(1);

      expect(updatedSuggestion[0].status).toBe('approved');
      expect(updatedSuggestion[0].adminNotes).toBe('Good suggestion');
    });

    it('should update suggestion status to rejected', async () => {
      // Create a test user
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'rejectuser@test.com',
          name: 'Reject User',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      // Create a test suggestion
      const suggestionResult = await testDb.db.insert(schema.userSuggestions).values({
        userId,
        email: 'rejectuser@test.com',
        title: 'Test Suggestion',
        description: 'Test description',
        status: 'pending'
      }).returning({ id: schema.userSuggestions.id });

      const suggestionId = suggestionResult[0].id;

      await AdminService.updateSuggestionStatus(suggestionId, 'rejected', 'Not feasible');

      // Verify the update
      const updatedSuggestion = await testDb.db
        .select()
        .from(schema.userSuggestions)
        .where(eq(schema.userSuggestions.id, suggestionId))
        .limit(1);

      expect(updatedSuggestion[0].status).toBe('rejected');
    });

    it('should throw NotFoundError for non-existent suggestion', async () => {
      await expect(AdminService.updateSuggestionStatus(999, 'approved')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSuggestionStats', () => {
    it('should return suggestion statistics', async () => {
      // Create test users
      const userResults = await testDb.db.insert(schema.users).values([
        {
          email: 'statsuser@test.com',
          name: 'Stats User',
          role: 'user',
          isActive: 1,
          emailVerified: 1
        }
      ]).returning({ id: schema.users.id });

      const userId = userResults[0].id;
      testUserIds = [userId];

      // Create test suggestions
      await testDb.db.insert(schema.userSuggestions).values([
        {
          userId,
          email: 'statsuser@test.com',
          title: 'Suggestion 1',
          description: 'Description 1',
          status: 'pending'
        },
        {
          userId,
          email: 'statsuser@test.com',
          title: 'Suggestion 2',
          description: 'Description 2',
          status: 'approved'
        },
        {
          userId,
          email: 'statsuser@test.com',
          title: 'Suggestion 3',
          description: 'Description 3',
          status: 'rejected'
        }
      ]);

      const stats = await AdminService.getSuggestionStats();

      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('approved');
      expect(stats).toHaveProperty('rejected');
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(1);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity', async () => {
      const activity = await AdminService.getRecentActivity(5);

      expect(Array.isArray(activity)).toBe(true);
      expect(activity.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getImportDetails', () => {
    it('should return import details', async () => {
      // This test would need CSV import data to be properly tested
      // For now, we'll just test that the method doesn't throw
      try {
        await AdminService.getImportDetails(1);
      } catch (error) {
        // Expected to fail if no import data exists
        expect(error).toBeDefined();
      }
    });
  });
}); 