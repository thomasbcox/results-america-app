import { getDb } from '../db/index';
import { states } from '../db/schema-postgres';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
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

export class StatesService {
  static async getAllStates(useCache = true): Promise<StateData[]> {
    const db = getDb();
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
      
      return result.map((state: any) => ({
        ...state,
        isActive: state.isActive ?? 1,
      }));
    } catch (error) {
      console.error('Failed to fetch states:', error);
      return [];
    }
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
    return FilterService.filterStates(allStates, { search: query });
  }

  static async getStateById(id: number): Promise<StateData | null> {
    const db = getDb();
    const result = await db.select().from(states).where(eq(states.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const state = result[0];
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async createState(data: CreateStateInput): Promise<StateData> {
    const db = getDb();
    const [state] = await db.insert(states).values(data).returning();
    cache.delete('states'); // Invalidate cache
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async updateState(id: number, data: UpdateStateInput): Promise<StateData> {
    const db = getDb();
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
    const db = getDb();
    const result = await db.delete(states).where(eq(states.id, id)).returning();
    cache.delete('states'); // Invalidate cache
    return result.length > 0;
  }
} 