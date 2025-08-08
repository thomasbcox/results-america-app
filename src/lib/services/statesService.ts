import { getDbOrThrow } from '../db/index';
import { states } from '../db/schema-postgres';
import { eq } from 'drizzle-orm';
import { cache } from './cache';
import { PaginationService } from './pagination';
import { FilterService } from './filters';
import { CacheMissError } from '../errors';
import type { 
  IStatesService, 
  StateData, 
  CreateStateInput, 
  UpdateStateInput,
  PaginationOptions,
  PaginatedResult,
  FilterOptions
} from '../types/service-interfaces';
// No need to import StateWithJoins for raw DB mapping

export class StatesService {
  static async getAllStates(useCache = true): Promise<StateData[]> {
    const db = getDbOrThrow();
    if (!db) {
      console.warn('Database not available - returning empty array');
      return [];
    }
    
    if (useCache) {
      try {
        const cached = cache.get<StateData[]>('states');
        return cached;
      } catch (error) {
        if (error instanceof CacheMissError) {
          // Cache miss, fetch from database
        } else {
          throw error;
        }
      }
    }

    try {
      const result = await db.select().from(states).orderBy(states.name);
      
      if (useCache) {
        cache.set('states', result);
      }
      
      return result.map((state) => ({
        id: state.id,
        name: state.name,
        abbreviation: state.abbreviation,
        isActive: state.isActive ?? 1,
      }));
    } catch (error) {
      console.error('Failed to fetch states:', error);
      return [];
    }
  }

  /**
   * Get all states excluding "Nation" for user-facing displays
   */
  static async getDisplayStates(useCache = true): Promise<StateData[]> {
    const allStates = await this.getAllStates(useCache);
    return allStates.filter(state => state.name !== 'Nation');
  }

  static async getStatesWithPagination(
    options: PaginationOptions, 
    filters: FilterOptions = {}
  ): Promise<PaginatedResult<StateData>> {
    const allStates = await this.getAllStates();
    const filtered = FilterService.filterStates(allStates, filters);
    const paginated = PaginationService.applyPagination(filtered, options);
    
    return {
      data: paginated,
      pagination: PaginationService.calculatePagination(options, filtered.length)
    };
  }

  static async searchStates(query: string): Promise<StateData[]> {
    const allStates = await this.getAllStates(false); // Don't use cache for search
    const filtered = FilterService.filterStates(allStates, { search: query });
    // Filter out "Nation" from search results for user displays
    return filtered.filter(state => state.name !== 'Nation');
  }

  static async getStateById(id: number): Promise<StateData | null> {
    const db = getDbOrThrow();
    const result = await db.select().from(states).where(eq(states.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const state = result[0];
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async createState(data: CreateStateInput): Promise<StateData> {
    const db = getDbOrThrow();
    const [state] = await db.insert(states).values(data).returning();
    cache.delete('states'); // Invalidate cache
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async updateState(id: number, data: UpdateStateInput): Promise<StateData> {
    const db = getDbOrThrow();
    const [state] = await db.update(states).set(data).where(eq(states.id, id)).returning();
    if (!state) {
      throw new Error(`State with id ${id} not found`);
    }
    cache.delete('states'); // Invalidate cache
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async deleteState(id: number): Promise<boolean> {
    const db = getDbOrThrow();
    const result = await db.delete(states).where(eq(states.id, id)).returning();
    cache.delete('states'); // Invalidate cache
    return result.length > 0;
  }
} 