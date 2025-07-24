import { db } from '../db/index';
import { states } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { cache } from './cache';
import { PaginationOptions, PaginatedResult, calculatePagination, applyPagination } from './pagination';
import { FilterOptions, filterStates } from './filters';

import { CacheMissError } from '../errors';
import type { StateData } from '@/types/api';

export async function getAllStates(database = db, useCache = true) {
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
    const result = await database.select().from(states).orderBy(states.name);
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

export async function getStatesWithPagination(
  options: PaginationOptions, 
  filters: FilterOptions = {}, 
  database = db
): Promise<PaginatedResult<StateData>> {
  const allStates = await getAllStates(database);
  const filtered = filterStates(allStates, filters);
  const paginated = applyPagination(filtered, options);
  
  return {
    data: paginated,
    pagination: calculatePagination(options, filtered.length)
  };
}

export async function searchStates(query: string, database = db) {
  const allStates = await getAllStates(database, false); // Don't use cache for search
  return filterStates(allStates, { search: query });
}

export async function getStateById(id: number, database = db) {
  const result = await database.select().from(states).where(eq(states.id, id)).limit(1);
  return result[0] || null;
}

export async function createState(data: { name: string; abbreviation: string }, database = db) {
  const result = await database.insert(states).values(data).returning();
  cache.delete('states'); // Invalidate cache
  return result;
}

export async function updateState(id: number, data: Partial<{ name: string; abbreviation: string; isActive: number }>, database = db) {
  const result = await database.update(states).set(data).where(eq(states.id, id)).returning();
  cache.delete('states'); // Invalidate cache
  return result;
}

export async function deleteState(id: number, database = db) {
  const result = await database.delete(states).where(eq(states.id, id)).returning();
  cache.delete('states'); // Invalidate cache
  return result;
} 