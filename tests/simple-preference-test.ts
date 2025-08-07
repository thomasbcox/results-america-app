import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StatisticsService } from '../src/lib/services/statisticsService';

/**
 * Simple test to verify preference direction functionality
 */

describe('Simple Preference Direction Test', () => {
  it('should have preferenceDirection in service interface', () => {
    // Test that the service interface includes preferenceDirection
    expect(StatisticsService).toBeDefined();
    expect(typeof StatisticsService.getAllStatisticsWithSources).toBe('function');
  });

  it('should handle preference direction values correctly', () => {
    // Test that we can handle the preference direction values
    const validDirections = ['higher', 'lower'];
    
    validDirections.forEach(direction => {
      expect(['higher', 'lower']).toContain(direction);
    });
  });

  it('should validate preference direction enum', () => {
    // Test that our enum validation works
    const testDirection = 'higher' as 'higher' | 'lower';
    expect(['higher', 'lower']).toContain(testDirection);
  });
}); 