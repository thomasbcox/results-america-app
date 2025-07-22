import { NextRequest } from 'next/server';
import { GET } from './route';

describe('/api/aggregation', () => {
  it('should return statistic comparison', async () => {
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

  it('should return state comparison', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=state-comparison&stateId=1&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('labels');
    expect(data).toHaveProperty('datasets');
    expect(Array.isArray(data.labels)).toBe(true);
    expect(Array.isArray(data.datasets)).toBe(true);
  });

  it('should return top performers', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=top-performers&statisticId=1&limit=5&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('state');
      expect(data[0]).toHaveProperty('value');
      expect(data[0]).toHaveProperty('rank');
    }
  });

  it('should return bottom performers', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=bottom-performers&statisticId=1&limit=5&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('state');
      expect(data[0]).toHaveProperty('value');
      expect(data[0]).toHaveProperty('rank');
    }
  });

  it('should return trend data', async () => {
    const request = new NextRequest('http://localhost:3000/api/aggregation?type=trend-data&statisticId=1&stateId=1');
    
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
}); 