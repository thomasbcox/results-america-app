export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function calculatePagination(options: PaginationOptions, total: number): PaginatedResult<any>['pagination'] {
  const { page, limit } = options;
  const offset = options.offset || (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function applyPagination<T>(data: T[], options: PaginationOptions): T[] {
  const { page, limit } = options;
  const offset = options.offset || (page - 1) * limit;
  
  return data.slice(offset, offset + limit);
} 