import { NextRequest } from 'next/server';
import { GET } from './route';

describe('/api/data-points', () => {
  it('should return data points for a state', async () => {
    const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('value');
      expect(data[0]).toHaveProperty('year');
      expect(data[0]).toHaveProperty('statisticName');
    }
  });

  it('should return data points for a statistic', async () => {
    const request = new NextRequest('http://localhost:3000/api/data-points?statisticId=1');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('value');
      expect(data[0]).toHaveProperty('year');
      expect(data[0]).toHaveProperty('stateName');
    }
  });

  it('should return data points for comparison', async () => {
    const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=1,2&statisticIds=1,2&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('should return 400 for missing parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/data-points');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Missing required parameters');
  });

  it('should return 400 for invalid comparison parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=1&year=2023');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Missing required parameters');
  });
}); 