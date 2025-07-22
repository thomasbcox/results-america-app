import { cache } from './cache';

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

  it('should return null for non-existent key', () => {
    const retrieved = cache.get('non-existent');
    expect(retrieved).toBeNull();
  });

  it('should delete data', () => {
    cache.set('test-key', { data: 'test' });
    cache.delete('test-key');
    
    const retrieved = cache.get('test-key');
    expect(retrieved).toBeNull();
  });

  it('should clear all data', () => {
    cache.set('key1', { data: 'test1' });
    cache.set('key2', { data: 'test2' });
    cache.clear();
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('should expire data after TTL', async () => {
    const shortTTL = 10; // 10ms
    cache.set('expire-test', { data: 'test' }, shortTTL);
    
    // Should be available immediately
    expect(cache.get('expire-test')).toEqual({ data: 'test' });
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Should be expired
    expect(cache.get('expire-test')).toBeNull();
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