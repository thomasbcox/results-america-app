import { db } from '../db/index';
import { states } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { cache } from './cache';
import { PaginationOptions, PaginatedResult, calculatePagination, applyPagination } from './pagination';
import { FilterOptions, filterStates } from './filters';
import { CacheMissError } from '../errors';
import type { 
  IStatesService, 
  StateData, 
  CreateStateInput, 
  UpdateStateInput 
} from '../types/service-interfaces';

export class StatesService implements IStatesService {
  static async getAllStates(useCache = true): Promise<StateData[]> {
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
      console.log('🔍 Fetching states from database...');
      const result = await db.select().from(states).orderBy(states.name);
      console.log(`✅ Found ${result.length} states in database`);
      
      if (useCache) {
        cache.set('states', result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching states from database:', error);
      throw new Error(`Failed to fetch states: ${error}`);
    }
  }

  static async getStatesWithPagination(
    options: PaginationOptions, 
    filters: FilterOptions = {}
  ): Promise<PaginatedResult<StateData>> {
    const allStates = await this.getAllStates();
    const filtered = filterStates(allStates, filters);
    const paginated = applyPagination(filtered, options);
    
    return {
      data: paginated,
      pagination: calculatePagination(options, filtered.length)
    };
  }

  static async searchStates(query: string): Promise<StateData[]> {
    const allStates = await this.getAllStates(false); // Don't use cache for search
    return filterStates(allStates, { search: query });
  }

  static async getStateById(id: number): Promise<StateData | null> {
    const result = await db.select().from(states).where(eq(states.id, id)).limit(1);
    return result[0] || null;
  }

  static async createState(data: CreateStateInput): Promise<StateData> {
    const [state] = await db.insert(states).values(data).returning();
    cache.delete('states'); // Invalidate cache
    return state;
  }

  static async updateState(id: number, data: UpdateStateInput): Promise<StateData> {
    const [state] = await db.update(states).set(data).where(eq(states.id, id)).returning();
    if (!state) {
      throw new Error(`State with id ${id} not found`);
    }
    cache.delete('states'); // Invalidate cache
    return state;
  }

  static async deleteState(id: number): Promise<boolean> {
    const result = await db.delete(states).where(eq(states.id, id)).returning();
    cache.delete('states'); // Invalidate cache
    return result.length > 0;
  }
} 