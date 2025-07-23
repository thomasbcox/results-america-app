import { NextRequest } from 'next/server';
import { GET } from './route';
import type { StatisticData } from '@/types/api';

describe('/api/statistics', () => {
  it('should return all statistics with sources', async () => {
    // Mock the request
    const request = new NextRequest('http://localhost:3000/api/statistics');
    
    // Call the API route
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('category');
    expect(data[0]).toHaveProperty('source');
    expect(data[0]).toHaveProperty('unit');
  });

  it('should return statistics with proper source information', async () => {
    // Mock the request
    const request = new NextRequest('http://localhost:3000/api/statistics');
    
    // Call the API route
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    
    // Check that statistics have source information
    const statsWithSources = data.filter((stat: StatisticData) => stat.source);
    expect(statsWithSources.length).toBeGreaterThan(0);
  });
}); 