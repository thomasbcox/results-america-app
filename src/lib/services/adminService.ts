import { getDb } from '../db';
import { users, userSuggestions, userFavorites, statistics, categories, dataPoints } from '../db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { ServiceError, NotFoundError } from '../errors';
import type { User } from '../../types/api';

export class AdminService {
  /**
   * Get system statistics
   */
  static async getSystemStats() {
    const db = getDb();
    const [
      userCount,
      activeUserCount,
      adminCount,
      suggestionCount,
      pendingSuggestionCount,
      statisticCount,
      categoryCount,
      dataPointCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(eq(users.isActive, 1)),
      db.select({ count: count() }).from(users).where(eq(users.role, 'admin')),
      db.select({ count: count() }).from(userSuggestions),
      db.select({ count: count() }).from(userSuggestions).where(eq(userSuggestions.status, 'pending')),
      db.select({ count: count() }).from(statistics),
      db.select({ count: count() }).from(categories),
      db.select({ count: count() }).from(dataPoints),
    ]);

    return {
      users: {
        total: userCount[0].count,
        active: activeUserCount[0].count,
        admins: adminCount[0].count,
      },
      suggestions: {
        total: suggestionCount[0].count,
        pending: pendingSuggestionCount[0].count,
      },
      data: {
        statistics: statisticCount[0].count,
        categories: categoryCount[0].count,
        dataPoints: dataPointCount[0].count,
      },
    };
  }

  /**
   * Get all users with pagination
   */
  static async getUsers(page: number = 1, limit: number = 20) {
    const db = getDb();
    const offset = (page - 1) * limit;

    const [usersList, totalCount] = await Promise.all([
      db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(users),
    ]);

    return {
      users: usersList,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
        hasNext: page * limit < totalCount[0].count,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get user by ID with additional data
   */
  static async getUserDetails(userId: number) {
    const db = getDb();
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundError('User not found');
    }

    // Get user's suggestions count
    const suggestionsCount = await db
      .select({ count: count() })
      .from(userSuggestions)
      .where(eq(userSuggestions.userId, userId));

    // Get user's favorites count
    const favoritesCount = await db
      .select({ count: count() })
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));

    return {
      ...user[0],
      stats: {
        suggestions: suggestionsCount[0].count,
        favorites: favoritesCount[0].count,
      },
    };
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: number, role: 'user' | 'admin'): Promise<User> {
    const db = getDb();
    const [user] = await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...user,
      name: user.name || undefined,
      isActive: Boolean(user.isActive),
      emailVerified: Boolean(user.emailVerified),
    };
  }

  /**
   * Toggle user active status
   */
  static async toggleUserStatus(userId: number): Promise<User> {
    const db = getDb();
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundError('User not found');
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        isActive: user[0].isActive ? 0 : 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return {
      ...updatedUser,
      name: updatedUser.name || undefined,
      isActive: Boolean(updatedUser.isActive),
      emailVerified: Boolean(updatedUser.emailVerified),
    };
  }

  /**
   * Get all suggestions with pagination
   */
  static async getSuggestions(page: number = 1, limit: number = 20, status?: string) {
    const db = getDb();
    const offset = (page - 1) * limit;

    const suggestions = status 
      ? await db.select().from(userSuggestions).where(eq(userSuggestions.status, status as any)).orderBy(desc(userSuggestions.createdAt)).limit(limit).offset(offset)
      : await db.select().from(userSuggestions).orderBy(desc(userSuggestions.createdAt)).limit(limit).offset(offset);

    const totalCount = status
      ? await db.select({ count: count() }).from(userSuggestions).where(eq(userSuggestions.status, status as any))
      : await db.select({ count: count() }).from(userSuggestions);

    return {
      suggestions,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
        hasNext: page * limit < totalCount[0].count,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update suggestion status
   */
  static async updateSuggestionStatus(
    suggestionId: number,
    status: string,
    adminNotes?: string
  ): Promise<void> {
    const db = getDb();
    const result = await db
      .update(userSuggestions)
      .set({
        status: status as any,
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(userSuggestions.id, suggestionId));

    if (result.changes === 0) {
      throw new NotFoundError('Suggestion not found');
    }
  }

  /**
   * Get suggestion statistics
   */
  static async getSuggestionStats() {
    const db = getDb();
    const stats = await db
      .select({
        status: userSuggestions.status,
        count: count(),
      })
      .from(userSuggestions)
      .groupBy(userSuggestions.status);

    return stats.reduce((acc: Record<string, number>, stat: any) => {
      acc[stat.status] = stat.count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(limit: number = 10) {
    const db = getDb();
    // This would typically combine recent user registrations, suggestions, etc.
    // For now, return recent suggestions
    const recentSuggestions = await db
      .select()
      .from(userSuggestions)
      .orderBy(desc(userSuggestions.createdAt))
      .limit(limit);

    return recentSuggestions;
  }

  /**
   * Get import details by ID
   */
  static async getImportDetails(importId: number) {
    const db = getDb();
    // Import the CSV import tables
    const { csvImports, csvImportStaging, csvImportMetadata } = await import('../db/schema-postgres');
    
    const importRecord = await db
      .select()
      .from(csvImports)
      .where(eq(csvImports.id, importId))
      .limit(1);

    if (importRecord.length === 0) {
      throw new NotFoundError('Import not found');
    }

    const import_ = importRecord[0];

    // Get staging data
    const stagingData = await db
      .select()
      .from(csvImportStaging)
      .where(eq(csvImportStaging.csvImportId, importId));

    // Get metadata
    const metadata = await db
      .select()
      .from(csvImportMetadata)
      .where(eq(csvImportMetadata.csvImportId, importId))
      .limit(1);

    return {
      import: import_,
      staging: {
        totalRecords: stagingData.length,
        validRecords: stagingData.filter((record: any) => record.validationStatus === 'valid').length,
        invalidRecords: stagingData.filter((record: any) => record.validationStatus === 'invalid').length,
        sampleRecords: stagingData.slice(0, 5), // First 5 records as sample
      },
      metadata: metadata[0] || null,
    };
  }
} 