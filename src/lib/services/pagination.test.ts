import { PaginationService } from './pagination';
import type { PaginationOptions } from '../types/service-interfaces';

describe('pagination', () => {
  describe('calculatePagination', () => {
    it('should calculate pagination for first page', () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      const total = 25;
      
      const result = PaginationService.calculatePagination(options, total);
      
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalItems).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should calculate pagination for middle page', () => {
      const options: PaginationOptions = { page: 2, limit: 10 };
      const total = 25;
      
      const result = PaginationService.calculatePagination(options, total);
      
      expect(result.currentPage).toBe(2);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalItems).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should calculate pagination for last page', () => {
      const options: PaginationOptions = { page: 3, limit: 10 };
      const total = 25;
      
      const result = PaginationService.calculatePagination(options, total);
      
      expect(result.currentPage).toBe(3);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalItems).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should handle empty dataset', () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      const total = 0;
      
      const result = PaginationService.calculatePagination(options, total);
      
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });
  });

  describe('applyPagination', () => {
    it('should apply pagination to array', () => {
      const data = [1, 2, 3, 4, 5, 6];
      const options: PaginationOptions = { page: 2, limit: 3 };
      
      const result = PaginationService.applyPagination(data, options);
      
      expect(result).toEqual([4, 5, 6]);
    });

    it('should handle first page', () => {
      const data = [1, 2, 3, 4, 5];
      const options: PaginationOptions = { page: 1, limit: 3 };
      
      const result = PaginationService.applyPagination(data, options);
      
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle last page with remaining items', () => {
      const data = [1, 2, 3, 4, 5];
      const options: PaginationOptions = { page: 2, limit: 3 };
      
      const result = PaginationService.applyPagination(data, options);
      
      expect(result).toEqual([4, 5]);
    });

    it('should return empty array for out of bounds page', () => {
      const data = [1, 2, 3, 4, 5];
      const options: PaginationOptions = { page: 5, limit: 10 };
      
      const result = PaginationService.applyPagination(data, options);
      
      expect(result).toEqual([]);
    });
  });
}); 