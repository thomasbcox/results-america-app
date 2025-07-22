import { calculatePagination, applyPagination, PaginationOptions } from './pagination';

describe('pagination', () => {
  describe('calculatePagination', () => {
    it('should calculate pagination for first page', () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      const total = 25;
      
      const result = calculatePagination(options, total);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should calculate pagination for middle page', () => {
      const options: PaginationOptions = { page: 2, limit: 10 };
      const total = 25;
      
      const result = calculatePagination(options, total);
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should calculate pagination for last page', () => {
      const options: PaginationOptions = { page: 3, limit: 10 };
      const total = 25;
      
      const result = calculatePagination(options, total);
      
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle custom offset', () => {
      const options: PaginationOptions = { page: 1, limit: 10, offset: 5 };
      const total = 25;
      
      const result = calculatePagination(options, total);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
    });

    it('should handle empty dataset', () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      const total = 0;
      
      const result = calculatePagination(options, total);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });

  describe('applyPagination', () => {
    it('should apply pagination to array', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const options: PaginationOptions = { page: 2, limit: 3 };
      
      const result = applyPagination(data, options);
      
      expect(result).toEqual([4, 5, 6]);
    });

    it('should handle first page', () => {
      const data = [1, 2, 3, 4, 5];
      const options: PaginationOptions = { page: 1, limit: 3 };
      
      const result = applyPagination(data, options);
      
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle last page with remaining items', () => {
      const data = [1, 2, 3, 4, 5];
      const options: PaginationOptions = { page: 2, limit: 3 };
      
      const result = applyPagination(data, options);
      
      expect(result).toEqual([4, 5]);
    });

    it('should handle custom offset', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const options: PaginationOptions = { page: 1, limit: 3, offset: 2 };
      
      const result = applyPagination(data, options);
      
      expect(result).toEqual([3, 4, 5]);
    });

    it('should return empty array for out of bounds page', () => {
      const data = [1, 2, 3];
      const options: PaginationOptions = { page: 5, limit: 10 };
      
      const result = applyPagination(data, options);
      
      expect(result).toEqual([]);
    });
  });
}); 