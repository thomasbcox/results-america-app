import type { PaginationOptions, PaginatedResult, PaginationInfo, IPaginationService } from '../types/service-interfaces';

export class PaginationService {
  static calculatePagination<T>(options: PaginationOptions, total: number): PaginatedResult<T>['pagination'] {
    const { page, limit } = options;
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    
    return {
      currentPage,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }

  static applyPagination<T>(data: T[], options: PaginationOptions): T[] {
    const { page, limit } = options;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return data.slice(startIndex, endIndex);
  }
} 