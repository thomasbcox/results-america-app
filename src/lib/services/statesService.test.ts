import { createTestDb } from '../db/testDb';
import * as statesService from './statesService';
import { createState, clearAllTestData } from './testUtils';

let db;
beforeEach(() => { db = createTestDb(); });
afterEach(async () => { await clearAllTestData(db); });

describe('statesService', () => {
  it('should create a new state', async () => {
    const [created] = await statesService.createState({ name: 'Testland', abbreviation: 'TL' }, db);
    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Testland');
    expect(created.abbreviation).toBe('TL');
  });

  it('should get all states (including the new one)', async () => {
    const [created] = await statesService.createState({ name: 'Testland', abbreviation: 'TL' }, db);
    const states = await statesService.getAllStates(db);
    expect(states.length).toBeGreaterThan(0);
    expect(states.find(s => s.name === 'Testland')).toBeTruthy();
  });

  it('should get a state by id', async () => {
    const [created] = await statesService.createState({ name: 'Testland', abbreviation: 'TL' }, db);
    const found = await statesService.getStateById(created.id, db);
    expect(found).toBeTruthy();
    expect(found.name).toBe('Testland');
  });

  it('should update a state', async () => {
    const [created] = await statesService.createState({ name: 'Testland', abbreviation: 'TL' }, db);
    const [updated] = await statesService.updateState(created.id, { name: 'UpdatedLand' }, db);
    expect(updated.name).toBe('UpdatedLand');
  });

  it('should delete a state', async () => {
    const [created] = await statesService.createState({ name: 'Testland', abbreviation: 'TL' }, db);
    await statesService.deleteState(created.id, db);
    const found = await statesService.getStateById(created.id, db);
    expect(found).toBeNull();
  });

  it('should get states with pagination', async () => {
    // Create multiple states
    await statesService.createState({ name: 'State A', abbreviation: 'SA' }, db);
    await statesService.createState({ name: 'State B', abbreviation: 'SB' }, db);
    await statesService.createState({ name: 'State C', abbreviation: 'SC' }, db);

    const result = await statesService.getStatesWithPagination(
      { page: 1, limit: 2 },
      {},
      db
    );

    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.total).toBeGreaterThanOrEqual(3);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('should search states by name', async () => {
    await statesService.createState({ name: 'California', abbreviation: 'CA' }, db);
    await statesService.createState({ name: 'Colorado', abbreviation: 'CO' }, db);
    await statesService.createState({ name: 'Texas', abbreviation: 'TX' }, db);

    const results = await statesService.searchStates('california', db);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('California');
  });

  it('should search states by abbreviation', async () => {
    await statesService.createState({ name: 'California', abbreviation: 'CA' }, db);
    await statesService.createState({ name: 'Colorado', abbreviation: 'CO' }, db);

    const results = await statesService.searchStates('CA', db);
    expect(results.length).toBe(1);
    expect(results[0].abbreviation).toBe('CA');
  });

  it('should filter states with sorting', async () => {
    await statesService.createState({ name: 'Zebra', abbreviation: 'ZB' }, db);
    await statesService.createState({ name: 'Alpha', abbreviation: 'AL' }, db);

    const result = await statesService.getStatesWithPagination(
      { page: 1, limit: 10 },
      { sortBy: 'name', sortOrder: 'asc' },
      db
    );

    const names = result.data.map(s => s.name);
    expect(names[0]).toBe('Alpha');
    expect(names[names.length - 1]).toBe('Zebra');
  });
}); 