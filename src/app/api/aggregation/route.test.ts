import { NextRequest } from 'next/server';
import { GET } from './route';

describe('/api/aggregation', () => {
  it('should return statistic comparison without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=statistic-comparison&statisticId=1&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('states');
    expect(data).toHaveProperty('values');
    expect(data).toHaveProperty('average');
    expect(data).toHaveProperty('min');
    expect(data).toHaveProperty('max');
    expect(data).toHaveProperty('median');
  });

  it('should return state comparison without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=state-comparison&stateId=1&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('labels');
    expect(data).toHaveProperty('datasets');
    expect(Array.isArray(data.labels)).toBe(true);
    expect(Array.isArray(data.datasets)).toBe(true);
  });

  it('should return top performers without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=top-performers&statisticId=1&limit=5&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('value');
      expect(data[0]).toHaveProperty('rank');
    }
  });

  it('should return bottom performers without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=bottom-performers&statisticId=1&limit=5&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('value');
      expect(data[0]).toHaveProperty('rank');
    }
  });

  it('should return trend data without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=trend-data&statisticId=1&stateId=1');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('labels');
    expect(data).toHaveProperty('datasets');
    expect(Array.isArray(data.labels)).toBe(true);
    expect(Array.isArray(data.datasets)).toBe(true);
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
    expect(data).toHaveProperty('states');
    expect(data).toHaveProperty('values');
    expect(data).toHaveProperty('average');
    expect(data).toHaveProperty('min');
    expect(data).toHaveProperty('max');
    expect(data).toHaveProperty('median');
  });

  it('should handle multiple years for trend data', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=trend-data&statisticId=1&stateId=1&years=2020,2021,2022,2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('labels');
    expect(data).toHaveProperty('datasets');
    expect(Array.isArray(data.labels)).toBe(true);
    expect(Array.isArray(data.datasets)).toBe(true);
    
    // Should have labels for each year
    expect(data.labels.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle custom limits for top/bottom performers', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=top-performers&statisticId=1&limit=10&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(10);
  });

  it('should handle multiple statistics for comparison', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=statistic-comparison&statisticId=1,2,3&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('states');
    expect(data).toHaveProperty('values');
    expect(Array.isArray(data.values)).toBe(true);
  });

  it('should handle multiple states for comparison', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=state-comparison&stateId=1,2,3&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('labels');
    expect(data).toHaveProperty('datasets');
    expect(Array.isArray(data.labels)).toBe(true);
    expect(Array.isArray(data.datasets)).toBe(true);
  });

  it('should return 400 for missing type parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Missing required parameter: type');
  });

  it('should return 400 for missing statisticId', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=top-performers');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Missing required parameter: statisticId');
  });

  it('should return 400 for missing stateId', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=state-comparison');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Missing required parameter: stateId');
  });

  it('should return 400 for invalid type', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=invalid-type');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid type');
  });

  it('should handle invalid statisticId gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=statistic-comparison&statisticId=999999&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('states');
    expect(data).toHaveProperty('values');
    expect(Array.isArray(data.values)).toBe(true);
    expect(data.values.length).toBe(0);
  });

  it('should handle invalid stateId gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=state-comparison&stateId=999999&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('labels');
    expect(data).toHaveProperty('datasets');
    expect(Array.isArray(data.labels)).toBe(true);
    expect(data.labels.length).toBe(0);
  });

  it('should handle invalid year gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=statistic-comparison&statisticId=1&year=9999');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('states');
    expect(data).toHaveProperty('values');
    expect(Array.isArray(data.values)).toBe(true);
    expect(data.values.length).toBe(0);
  });

  it('should maintain consistent response structure for all types', async () => {
    const types = ['statistic-comparison', 'state-comparison', 'top-performers', 'bottom-performers', 'trend-data'];
    
    for (const type of types) {
      const params = type === 'statistic-comparison' 
        ? 'statisticId=1&year=2023'
        : type === 'state-comparison'
        ? 'stateId=1&year=2023'
        : type === 'trend-data'
        ? 'statisticId=1&stateId=1'
        : 'statisticId=1&limit=5&year=2023';
        
      const request = new NextRequest(`http://localhost:3000/api/aggregation?type=${type}&${params}`);
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    }
  });

  it('should handle edge cases with empty data gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=statistic-comparison&statisticId=1&year=1900');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('states');
    expect(data).toHaveProperty('values');
    expect(Array.isArray(data.states)).toBe(true);
    expect(Array.isArray(data.values)).toBe(true);
  });
}); 