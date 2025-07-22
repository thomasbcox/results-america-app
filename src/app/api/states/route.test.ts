import { NextRequest } from 'next/server';
import { GET } from './route';
import { createTestDb } from '@/lib/db/testDb';
import { createState, clearAllTestData } from '@/lib/services/testUtils';

let db;

beforeEach(() => {
  db = createTestDb();
});

afterEach(async () => {
  await clearAllTestData(db);
});

describe('/api/states', () => {
  it('should return all states', async () => {
    // Mock the request
    const request = new NextRequest('http://localhost:3000/api/states');
    
    // Call the API route
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('abbreviation');
  });

  it('should return states in alphabetical order', async () => {
    // Mock the request
    const request = new NextRequest('http://localhost:3000/api/states');
    
    // Call the API route
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    
    // Check that states are in alphabetical order
    const stateNames = data.map(s => s.name);
    const sortedNames = [...stateNames].sort();
    expect(stateNames).toEqual(sortedNames);
  });
}); 