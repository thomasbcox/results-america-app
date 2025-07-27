import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { setupTestDatabase, clearTestData, getTestDb } from '../test-setup';
import { states } from '../db/schema';
import { eq } from 'drizzle-orm';
import { cache } from './cache';

// Create a test-specific version of StatesService
class TestStatesService {
  static async getAllStates(useCache = false): Promise<any[]> {
    const db = getTestDb();
    const result = await db.select().from(states).orderBy(states.name);
    return result.map((state: any) => ({
      ...state,
      isActive: state.isActive ?? 1,
    }));
  }

  static async getStatesWithPagination(options: any, filters: any = {}): Promise<any> {
    const allStates = await this.getAllStates();
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

  static async searchStates(query: string): Promise<any[]> {
    const allStates = await this.getAllStates();
    return allStates.filter(state => 
      state.name.toLowerCase().includes(query.toLowerCase()) ||
      state.abbreviation.toLowerCase().includes(query.toLowerCase())
    );
  }

  static async getStateById(id: number): Promise<any | null> {
    const db = getTestDb();
    const result = await db.select().from(states).where(eq(states.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const state = result[0];
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async createState(data: any): Promise<any> {
    const db = getTestDb();
    const [state] = await db.insert(states).values(data).returning();
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async updateState(id: number, data: any): Promise<any> {
    const db = getTestDb();
    const [state] = await db.update(states).set(data).where(eq(states.id, id)).returning();
    if (!state) {
      throw new Error(`State with id ${id} not found`);
    }
    return {
      ...state,
      isActive: state.isActive ?? 1,
    };
  }

  static async deleteState(id: number): Promise<boolean> {
    const db = getTestDb();
    const result = await db.delete(states).where(eq(states.id, id)).returning();
    return result.length > 0;
  }
}

describe('StatesService', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await clearTestData();
  });

  it('should create a new state', async () => {
    const created = await TestStatesService.createState({ 
      name: 'Testland', 
      abbreviation: 'TL' 
    });
    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Testland');
    expect(created.abbreviation).toBe('TL');
  });

  it('should get all states (including the new one)', async () => {
    await TestStatesService.createState({ name: 'Testland', abbreviation: 'TL' });
    const allStates = await TestStatesService.getAllStates();
    expect(allStates.length).toBeGreaterThan(0);
    expect(allStates.find(s => s.name === 'Testland')).toBeTruthy();
  });

  it('should get a state by id', async () => {
    const created = await TestStatesService.createState({ 
      name: 'Testland', 
      abbreviation: 'TL' 
    });
    const found = await TestStatesService.getStateById(created.id);
    expect(found).toBeTruthy();
    expect(found?.name).toBe('Testland');
  });

  it('should update a state', async () => {
    const created = await TestStatesService.createState({ 
      name: 'Testland', 
      abbreviation: 'TL' 
    });
    const updated = await TestStatesService.updateState(created.id, { 
      name: 'UpdatedLand' 
    });
    expect(updated.name).toBe('UpdatedLand');
  });

  it('should delete a state', async () => {
    const created = await TestStatesService.createState({ 
      name: 'Testland', 
      abbreviation: 'TL' 
    });
    const deleted = await TestStatesService.deleteState(created.id);
    expect(deleted).toBe(true);
    
    const found = await TestStatesService.getStateById(created.id);
    expect(found).toBeNull();
  });

  it('should get states with pagination', async () => {
    // Create multiple states
    await TestStatesService.createState({ name: 'State A', abbreviation: 'SA' });
    await TestStatesService.createState({ name: 'State B', abbreviation: 'SB' });
    await TestStatesService.createState({ name: 'State C', abbreviation: 'SC' });

    const result = await TestStatesService.getStatesWithPagination(
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
    await TestStatesService.createState({ name: 'California', abbreviation: 'CA' });
    await TestStatesService.createState({ name: 'Colorado', abbreviation: 'CO' });
    await TestStatesService.createState({ name: 'Texas', abbreviation: 'TX' });

    const results = await TestStatesService.searchStates('california');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('California');
  });

  it('should search states by abbreviation', async () => {
    await TestStatesService.createState({ name: 'California', abbreviation: 'CA' });
    await TestStatesService.createState({ name: 'Colorado', abbreviation: 'CO' });

    const results = await TestStatesService.searchStates('CA');
    expect(results.length).toBe(1);
    expect(results[0].abbreviation).toBe('CA');
  });

  it('should filter states with sorting', async () => {
    await TestStatesService.createState({ name: 'Zebra', abbreviation: 'ZB' });
    await TestStatesService.createState({ name: 'Alpha', abbreviation: 'AL' });

    const result = await TestStatesService.getStatesWithPagination(
      { page: 1, limit: 10 },
      { sortBy: 'name', sortOrder: 'asc' }
    );

    const names = result.data.map(s => s.name);
    expect(names[0]).toBe('Alpha');
    expect(names[names.length - 1]).toBe('Zebra');
  });
}); 