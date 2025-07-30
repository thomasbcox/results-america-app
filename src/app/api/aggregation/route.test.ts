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

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('statisticId');
    expect(data.data).toHaveProperty('statisticName');
    expect(data.data).toHaveProperty('year');
    expect(data.data).toHaveProperty('average');
    expect(data.data).toHaveProperty('median');
    expect(data.data).toHaveProperty('min');
    expect(data.data).toHaveProperty('max');
    expect(data.data).toHaveProperty('stateCount');
    expect(data.data).toHaveProperty('unit');
  });

  it('should return state comparison without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=state-comparison&stateId=1&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('stateId');
    expect(data.data).toHaveProperty('stateName');
    expect(data.data).toHaveProperty('year');
    expect(data.data).toHaveProperty('statistics');
    expect(Array.isArray(data.data.statistics)).toBe(true);
    if (data.data.statistics.length > 0) {
      expect(data.data.statistics[0]).toHaveProperty('statisticId');
      expect(data.data.statistics[0]).toHaveProperty('statisticName');
      expect(data.data.statistics[0]).toHaveProperty('value');
      expect(data.data.statistics[0]).toHaveProperty('rank');
      expect(data.data.statistics[0]).toHaveProperty('percentile');
      expect(data.data.statistics[0]).toHaveProperty('unit');
    }
  });

  it('should return top performers without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=top-performers&statisticId=1&limit=5&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('statisticId');
    expect(data.data).toHaveProperty('statisticName');
    expect(data.data).toHaveProperty('year');
    expect(data.data).toHaveProperty('performers');
    expect(Array.isArray(data.data.performers)).toBe(true);
    if (data.data.performers.length > 0) {
      expect(data.data.performers[0]).toHaveProperty('stateId');
      expect(data.data.performers[0]).toHaveProperty('stateName');
      expect(data.data.performers[0]).toHaveProperty('value');
      expect(data.data.performers[0]).toHaveProperty('rank');
      expect(data.data.performers[0]).toHaveProperty('unit');
    }
  });

  it('should return bottom performers without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=bottom-performers&statisticId=1&limit=5&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('statisticId');
    expect(data.data).toHaveProperty('statisticName');
    expect(data.data).toHaveProperty('year');
    expect(data.data).toHaveProperty('performers');
    expect(Array.isArray(data.data.performers)).toBe(true);
    if (data.data.performers.length > 0) {
      expect(data.data.performers[0]).toHaveProperty('stateId');
      expect(data.data.performers[0]).toHaveProperty('stateName');
      expect(data.data.performers[0]).toHaveProperty('value');
      expect(data.data.performers[0]).toHaveProperty('rank');
      expect(data.data.performers[0]).toHaveProperty('unit');
    }
  });

  it('should return trend data without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=trend-data&statisticId=1&stateId=1');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('statisticId');
    expect(data.data).toHaveProperty('statisticName');
    expect(data.data).toHaveProperty('stateId');
    expect(data.data).toHaveProperty('stateName');
    expect(data.data).toHaveProperty('trends');
    expect(Array.isArray(data.data.trends)).toBe(true);
    if (data.data.trends.length > 0) {
      expect(data.data.trends[0]).toHaveProperty('year');
      expect(data.data.trends[0]).toHaveProperty('value');
      expect(data.data.trends[0]).toHaveProperty('change');
      expect(data.data.trends[0]).toHaveProperty('changePercent');
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
    expect(data.data).toHaveProperty('statisticId');
    expect(data.data).toHaveProperty('statisticName');
    expect(data.data).toHaveProperty('year');
    expect(data.data).toHaveProperty('average');
    expect(data.data).toHaveProperty('median');
    expect(data.data).toHaveProperty('min');
    expect(data.data).toHaveProperty('max');
    expect(data.data).toHaveProperty('stateCount');
    expect(data.data).toHaveProperty('unit');
  });

  it('should handle multiple years for trend data', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=trend-data&statisticId=1&stateId=1&years=2020,2021,2022,2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('statisticId');
    expect(data.data).toHaveProperty('statisticName');
    expect(data.data).toHaveProperty('stateId');
    expect(data.data).toHaveProperty('stateName');
    expect(data.data).toHaveProperty('trends');
    expect(Array.isArray(data.data.trends)).toBe(true);
    
    // Should have trends for each year
    expect(data.data.trends.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle custom limits for top/bottom performers', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=top-performers&statisticId=1&limit=10&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('performers');
    expect(Array.isArray(data.data.performers)).toBe(true);
    expect(data.data.performers.length).toBeLessThanOrEqual(10);
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