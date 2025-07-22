import { NextRequest } from 'next/server';
import { GET } from './route';

describe('/api/admin/stats', () => {
  it('should return system stats and integrity check', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/stats');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('stats');
    expect(data).toHaveProperty('integrity');
    expect(data).toHaveProperty('timestamp');
    
    // Check stats structure
    expect(data.stats).toHaveProperty('totalStates');
    expect(data.stats).toHaveProperty('totalCategories');
    expect(data.stats).toHaveProperty('totalStatistics');
    expect(data.stats).toHaveProperty('totalDataPoints');
    expect(data.stats).toHaveProperty('totalDataSources');
    expect(data.stats).toHaveProperty('totalImportSessions');
    expect(data.stats).toHaveProperty('cacheSize');
    
    // Check integrity structure
    expect(data.integrity).toHaveProperty('orphanedDataPoints');
    expect(data.integrity).toHaveProperty('missingSources');
    expect(data.integrity).toHaveProperty('duplicateStates');
    expect(data.integrity).toHaveProperty('duplicateCategories');
    expect(data.integrity).toHaveProperty('issues');
    
    // Verify data types
    expect(typeof data.stats.totalStates).toBe('number');
    expect(typeof data.stats.totalCategories).toBe('number');
    expect(typeof data.stats.totalStatistics).toBe('number');
    expect(typeof data.stats.totalDataPoints).toBe('number');
    expect(typeof data.stats.totalDataSources).toBe('number');
    expect(typeof data.stats.totalImportSessions).toBe('number');
    expect(typeof data.stats.cacheSize).toBe('number');
    
    expect(typeof data.integrity.orphanedDataPoints).toBe('number');
    expect(typeof data.integrity.missingSources).toBe('number');
    expect(typeof data.integrity.duplicateStates).toBe('number');
    expect(typeof data.integrity.duplicateCategories).toBe('number');
    expect(Array.isArray(data.integrity.issues)).toBe(true);
    
    // Verify timestamp format
    expect(typeof data.timestamp).toBe('string');
    expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
  });
}); 