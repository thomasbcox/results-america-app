import { NextRequest } from 'next/server';
import { DELETE, POST } from './route';

describe('/api/admin/cache', () => {
  describe('DELETE', () => {
    it('should clear cache successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/cache');
      
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
      expect(data.message).toBe('Cache cleared successfully');
      expect(typeof data.timestamp).toBe('string');
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
    });
  });

  describe('POST', () => {
    it('should rebuild cache successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/cache');
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
      expect(data.message).toBe('Cache rebuilt successfully');
      expect(typeof data.timestamp).toBe('string');
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
}); 