import { getDb } from '../db';
import { userFavorites, userSuggestions, statistics } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ServiceError, NotFoundError, ValidationError } from '../errors';
import type { User } from '../../types/api';

export class UserPreferencesService {
  /**
   * Add a statistic to user's favorites
   */
  static async addFavorite(userId: number, statisticId: number): Promise<void> {
    const db = getDb();
    // Check if statistic exists
    const statistic = await db
      .select()
      .from(statistics)
      .where(eq(statistics.id, statisticId))
      .limit(1);

    if (statistic.length === 0) {
      throw new NotFoundError('Statistic not found');
    }

    // Check if already favorited
    const existing = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.statisticId, statisticId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ValidationError('Statistic is already in your favorites');
    }

    await db.insert(userFavorites).values({
      userId,
      statisticId,
    });
  }

  /**
   * Remove a statistic from user's favorites
   */
  static async removeFavorite(userId: number, statisticId: number): Promise<void> {
    const db = getDb();
    await db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.statisticId, statisticId)
        )
      );
  }

  /**
   * Get user's favorite statistics
   */
  static async getFavorites(userId: number) {
    const db = getDb();
    return await db
      .select({
        id: userFavorites.id,
        statisticId: userFavorites.statisticId,
        createdAt: userFavorites.createdAt,
        statistic: {
          id: statistics.id,
          name: statistics.name,
          description: statistics.description,
          unit: statistics.unit,
          categoryId: statistics.categoryId,
        },
      })
      .from(userFavorites)
      .innerJoin(statistics, eq(userFavorites.statisticId, statistics.id))
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt));
  }

  /**
   * Check if a statistic is favorited by user
   */
  static async isFavorited(userId: number, statisticId: number): Promise<boolean> {
    const db = getDb();
    const favorite = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.statisticId, statisticId)
        )
      )
      .limit(1);

    return favorite.length > 0;
  }

  /**
   * Submit a user suggestion
   */
  static async submitSuggestion(data: {
    userId?: number;
    email?: string;
    title: string;
    description: string;
    category?: string;
  }): Promise<void> {
    const db = getDb();
    if (!data.userId && !data.email) {
      throw new ValidationError('Either userId or email is required');
    }

    await db.insert(userSuggestions).values({
      userId: data.userId || null,
      email: data.email || null,
      title: data.title,
      description: data.description,
      category: data.category || 'feature_request',
      status: 'pending',
    });
  }

  /**
   * Get user's suggestions
   */
  static async getUserSuggestions(userId: number) {
    const db = getDb();
    return await db
      .select()
      .from(userSuggestions)
      .where(eq(userSuggestions.userId, userId))
      .orderBy(desc(userSuggestions.createdAt));
  }

  /**
   * Get all suggestions (admin only)
   */
  static async getAllSuggestions(status?: string) {
    const db = getDb();
    return status 
      ? await db.select().from(userSuggestions).where(eq(userSuggestions.status, status as any)).orderBy(desc(userSuggestions.createdAt))
      : await db.select().from(userSuggestions).orderBy(desc(userSuggestions.createdAt));
  }

  /**
   * Update suggestion status (admin only)
   */
  static async updateSuggestionStatus(
    suggestionId: number,
    status: string,
    adminNotes?: string
  ): Promise<void> {
    const db = getDb();
    await db
      .update(userSuggestions)
      .set({
        status: status as any,
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(userSuggestions.id, suggestionId));
  }

  /**
   * Get suggestion by ID
   */
  static async getSuggestionById(id: number) {
    const db = getDb();
    const suggestion = await db
      .select()
      .from(userSuggestions)
      .where(eq(userSuggestions.id, id))
      .limit(1);

    return suggestion.length > 0 ? suggestion[0] : null;
  }
} 