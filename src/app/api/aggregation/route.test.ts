// Mock the database before importing the route
jest.mock('@/lib/db/index', () => ({
  getDb: () => {
    const { getTestDb } = require('@/lib/test-setup');
    return getTestDb();
  }
}));

import { NextRequest } from 'next/server';
import { GET } from './route';
import { setupTestDatabase, seedTestData, cleanupTestDatabase } from '@/lib/test-setup';

describe('/api/aggregation', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });



  it('should return statistic comparison without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=statistic-comparison&statisticId=1&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    console.log('Response data:', data);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('statisticId');
    expect(data).toHaveProperty('statisticName');
    expect(data).toHaveProperty('year');
    expect(data).toHaveProperty('average');
    expect(data).toHaveProperty('median');
    expect(data).toHaveProperty('min');
    expect(data).toHaveProperty('max');
    expect(data).toHaveProperty('stateCount');
    expect(data).toHaveProperty('unit');
  });

  it('should return state comparison without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=state-comparison&stateId=1&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('stateId');
    expect(data).toHaveProperty('stateName');
    expect(data).toHaveProperty('year');
    expect(data).toHaveProperty('statistics');
    expect(Array.isArray(data.statistics)).toBe(true);
    if (data.statistics.length > 0) {
      expect(data.statistics[0]).toHaveProperty('statisticId');
      expect(data.statistics[0]).toHaveProperty('statisticName');
      expect(data.statistics[0]).toHaveProperty('value');
      expect(data.statistics[0]).toHaveProperty('rank');
      expect(data.statistics[0]).toHaveProperty('percentile');
      expect(data.statistics[0]).toHaveProperty('unit');
    }
  });

  it('should return top performers without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=top-performers&statisticId=1&limit=5&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('statisticId');
    expect(data).toHaveProperty('statisticName');
    expect(data).toHaveProperty('year');
    expect(data).toHaveProperty('performers');
    expect(Array.isArray(data.performers)).toBe(true);
    if (data.performers.length > 0) {
      expect(data.performers[0]).toHaveProperty('stateId');
      expect(data.performers[0]).toHaveProperty('stateName');
      expect(data.performers[0]).toHaveProperty('value');
      expect(data.performers[0]).toHaveProperty('rank');
      expect(data.performers[0]).toHaveProperty('unit');
    }
  });

  it('should return bottom performers without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=bottom-performers&statisticId=1&limit=5&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('statisticId');
    expect(data).toHaveProperty('statisticName');
    expect(data).toHaveProperty('year');
    expect(data).toHaveProperty('performers');
    expect(Array.isArray(data.performers)).toBe(true);
    if (data.performers.length > 0) {
      expect(data.performers[0]).toHaveProperty('stateId');
      expect(data.performers[0]).toHaveProperty('stateName');
      expect(data.performers[0]).toHaveProperty('value');
      expect(data.performers[0]).toHaveProperty('rank');
      expect(data.performers[0]).toHaveProperty('unit');
    }
  });

  it('should return trend data without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=trend-data&statisticId=1&stateId=1');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('statisticId');
    expect(data).toHaveProperty('statisticName');
    expect(data).toHaveProperty('stateId');
    expect(data).toHaveProperty('stateName');
    expect(data).toHaveProperty('trends');
    expect(Array.isArray(data.trends)).toBe(true);
    if (data.trends.length > 0) {
      expect(data.trends[0]).toHaveProperty('year');
      expect(data.trends[0]).toHaveProperty('value');
      expect(data.trends[0]).toHaveProperty('change');
      expect(data.trends[0]).toHaveProperty('changePercent');
    }
  });

  it('should work with authenticated users (no change in behavior)', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=statistic-comparison&statisticId=1&year=2023', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('statisticId');
    expect(data).toHaveProperty('statisticName');
    expect(data).toHaveProperty('year');
    expect(data).toHaveProperty('average');
    expect(data).toHaveProperty('median');
    expect(data).toHaveProperty('min');
    expect(data).toHaveProperty('max');
    expect(data).toHaveProperty('stateCount');
    expect(data).toHaveProperty('unit');
  });

  it('should handle multiple years for trend data', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=trend-data&statisticId=1&stateId=1&years=2020,2021,2022,2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('statisticId');
    expect(data).toHaveProperty('statisticName');
    expect(data).toHaveProperty('stateId');
    expect(data).toHaveProperty('stateName');
    expect(data).toHaveProperty('trends');
    expect(Array.isArray(data.trends)).toBe(true);
    
    // Should have trends for each year
    expect(data.trends.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle custom limits for top/bottom performers', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=top-performers&statisticId=1&limit=10&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('performers');
    expect(Array.isArray(data.performers)).toBe(true);
    expect(data.performers.length).toBeLessThanOrEqual(10);
  });



  it('should return 400 for missing type parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid query parameters');
  });

  it('should return 400 for missing statisticId', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=top-performers');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid query parameters');
  });

  it('should return 400 for missing stateId', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=state-comparison');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid query parameters');
  });

  it('should return 400 for invalid type', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=invalid-type');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid query parameters');
  });

  it('should handle invalid statisticId gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=statistic-comparison&statisticId=999999&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('No data found for statistic 999999 in year 2023');
  });

  it('should handle invalid stateId gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=state-comparison&stateId=999999&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('State');
  });


}); 