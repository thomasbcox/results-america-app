// Skip cache mock for this test
process.env.SKIP_CACHE_MOCK = 'true';

// Import the real cache implementation
import { cache } from './cache';
import { CacheMissError } from '../errors';

// Ensure we're using the real cache, not the mock
jest.unmock('./cache');

describe('cache', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('should set and get data', () => {
    const testData = { name: 'test', value: 123 };
    cache.set('test-key', testData);
    
    const retrieved = cache.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should throw CacheMissError for non-existent key', () => {
    expect(() => cache.get('non-existent')).toThrow('Cache entry not found for key: non-existent');
  });

  it('should return null for non-existent key using getOptional', () => {
    const retrieved = cache.getOptional('non-existent');
    expect(retrieved).toBeNull();
  });

  it('should delete data', () => {
    cache.set('test-key', { data: 'test' });
    cache.delete('test-key');
    
    expect(() => cache.get('test-key')).toThrow('Cache entry not found for key: test-key');
  });

  it('should clear all data', () => {
    cache.set('key1', { data: 'test1' });
    cache.set('key2', { data: 'test2' });
    cache.clear();
    
    expect(() => cache.get('key1')).toThrow('Cache entry not found for key: key1');
    expect(() => cache.get('key2')).toThrow('Cache entry not found for key: key2');
  });

  it('should expire data after TTL', async () => {
    const shortTTL = 10; // 10ms
    cache.set('expire-test', { data: 'test' }, shortTTL);
    
    // Should be available immediately
    expect(cache.get('expire-test')).toEqual({ data: 'test' });
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Should be expired
    expect(() => cache.get('expire-test')).toThrow('Cache entry expired for key: expire-test');
  });

  it('should use default TTL when not specified', () => {
    cache.set('default-ttl', { data: 'test' });
    
    // Should be available immediately
    expect(cache.get('default-ttl')).toEqual({ data: 'test' });
  });

  it('should handle different data types', () => {
    const stringData = 'test string';
    const numberData = 42;
    const objectData = { key: 'value' };
    const arrayData = [1, 2, 3];
    
    cache.set('string', stringData);
    cache.set('number', numberData);
    cache.set('object', objectData);
    cache.set('array', arrayData);
    
    expect(cache.get('string')).toBe(stringData);
    expect(cache.get('number')).toBe(numberData);
    expect(cache.get('object')).toEqual(objectData);
    expect(cache.get('array')).toEqual(arrayData);
  });
}); 