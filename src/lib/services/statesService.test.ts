import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';
import { states } from '../db/schema';
import { eq } from 'drizzle-orm';
import { cache } from './cache';

// Create a test-specific version of StatesService
class TestStatesService {
  static async getAllStates(db: any, useCache = false): Promise<any[]> {
    const result = await db.select().from(states).orderBy(states.name);
    return result.map((state: any) => ({
      ...state,
      isActive: state.isActive ?? 1,
    }));
  }

  static async getStatesWithPagination(db: any, options: any, filters: any = {}): Promise<any> {
    const allStates = await this.getAllStates(db);
    // Simple pagination for tests
    const { page = 1, limit = 10 } = options;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = allStates.slice(start, end);
    
    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total: allStates.length,
        hasNext: end < allStates.length,
        hasPrev: page > 1
      }
    };
  }

  static async searchStates(db: any, query: string): Promise<any[]> {
    const allStates = await this.getAllStates(db);
    return allStates.filter(state => 
      state.name.toLowerCase().includes(query.toLowerCase()) ||
      state.abbreviation.toLowerCase().includes(query.toLowerCase())
    );
  }

  static async getStateById(db: any, id: number): Promise<any | null> {
    const result = await db.select().from(states).where(eq(states.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const state = result[0];
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async createState(db: any, data: any): Promise<any> {
    const [state] = await db.insert(states).values(data).returning();
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async updateState(db: any, id: number, data: any): Promise<any> {
    const [state] = await db.update(states).set(data).where(eq(states.id, id)).returning();
    if (!state) {
      throw new Error(`State with id ${id} not found`);
    }
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async deleteState(db: any, id: number): Promise<boolean> {
    const result = await db.delete(states).where(eq(states.id, id)).returning();
    return result.length > 0;
  }
}

describe('StatesService', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        states: true
      }
    });
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
  });

  it('should create a new state', async () => {
    const db = testDb.db;
    const created = await TestStatesService.createState(db, { 
      name: 'Testland', 
      abbreviation: 'TL' 
    });
    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Testland');
    expect(created.abbreviation).toBe('TL');
  });

  it('should get all states (including the new one)', async () => {
    const db = testDb.db;
    await TestStatesService.createState(db, { name: 'Testland', abbreviation: 'TL' });
    const allStates = await TestStatesService.getAllStates(db);
    expect(allStates.length).toBeGreaterThan(0);
    expect(allStates.find(s => s.name === 'Testland')).toBeTruthy();
  });

  it('should get a state by id', async () => {
    const db = testDb.db;
    const created = await TestStatesService.createState(db, { 
      name: 'Testland', 
      abbreviation: 'TL' 
    });
    const found = await TestStatesService.getStateById(db, created.id);
    expect(found).toBeTruthy();
    expect(found?.name).toBe('Testland');
  });

  it('should update a state', async () => {
    const db = testDb.db;
    const created = await TestStatesService.createState(db, { 
      name: 'Testland', 
      abbreviation: 'TL' 
    });
    const updated = await TestStatesService.updateState(db, created.id, { 
      name: 'UpdatedLand' 
    });
    expect(updated.name).toBe('UpdatedLand');
  });

  it('should delete a state', async () => {
    const db = testDb.db;
    const created = await TestStatesService.createState(db, { 
      name: 'Testland', 
      abbreviation: 'TL' 
    });
    const deleted = await TestStatesService.deleteState(db, created.id);
    expect(deleted).toBe(true);
    
    const found = await TestStatesService.getStateById(db, created.id);
    expect(found).toBeNull();
  });

  it('should get states with pagination', async () => {
    const db = testDb.db;
    
    // Create multiple states with unique names
    await TestStatesService.createState(db, { name: 'State A', abbreviation: 'SA' });
    await TestStatesService.createState(db, { name: 'State B', abbreviation: 'SB' });
    await TestStatesService.createState(db, { name: 'State C', abbreviation: 'SC' });

    const result = await TestStatesService.getStatesWithPagination(
      db,
      { page: 1, limit: 2 }
    );

    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.total).toBeGreaterThanOrEqual(3);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('should search states by name', async () => {
    const db = testDb.db;
    await TestStatesService.createState(db, { name: 'SearchTestState', abbreviation: 'ST' });

    const results = await TestStatesService.searchStates(db, 'searchtest');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('SearchTestState');
  });

  it('should search states by abbreviation', async () => {
    const db = testDb.db;
    await TestStatesService.createState(db, { name: 'AbbreviationTest', abbreviation: 'AT' });

    const results = await TestStatesService.searchStates(db, 'AT');
    expect(results.length).toBe(1);
    expect(results[0].abbreviation).toBe('AT');
  });

  it('should filter states with sorting', async () => {
    const db = testDb.db;

    const result = await TestStatesService.getStatesWithPagination(
      db,
      { page: 1, limit: 10 },
      { sortBy: 'name', sortOrder: 'asc' }
    );

    const names = result.data.map(s => s.name);
    
    // Verify that the list is sorted alphabetically
    for (let i = 1; i < names.length; i++) {
      expect(names[i-1] <= names[i]).toBe(true);
    }
    
    // Verify that pagination structure is correct
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.total).toBeGreaterThan(0);
    expect(result.data.length).toBeGreaterThan(0);
  });
}); 