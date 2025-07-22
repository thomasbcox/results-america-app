import { NextRequest } from 'next/server';
import { GET } from './route';

describe('/api/categories', () => {
  it('should return all categories', async () => {
    // Mock the request
    const request = new NextRequest('http://localhost:3000/api/categories');
    
    // Call the API route
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('description');
    expect(data[0]).toHaveProperty('icon');
  });

  it('should return categories with statistics when withStats=true', async () => {
    // Mock the request with query parameter
    const request = new NextRequest('http://localhost:3000/api/categories?withStats=true');
    
    // Call the API route
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('statisticCount');
  });
}); 