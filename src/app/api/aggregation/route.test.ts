import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GET } from './route';
import { AggregationService } from '@/lib/services/aggregationService';
import { validateQueryParams, createSuccessResponse } from '@/lib/response';

// Mock dependencies
jest.mock('@/lib/services/aggregationService');
jest.mock('@/lib/response');

const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>;
const mockValidateQueryParams = validateQueryParams as jest.MockedFunction<typeof validateQueryParams>;
const mockCreateSuccessResponse = createSuccessResponse as jest.MockedFunction<typeof createSuccessResponse>;

describe('Aggregation API Route', () => {
  let mockRequest: any;
  let mockNextUrl: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock request
    mockNextUrl = {
      searchParams: new URLSearchParams('state=California&category=Education&year=2020')
    };

    mockRequest = {
      nextUrl: mockNextUrl,
      method: 'GET'
    };

    // Setup default mock implementations
    mockValidateQueryParams.mockReturnValue({
      state: 'California',
      category: 'Education',
      year: 2020
    });

    mockAggregationService.aggregate.mockResolvedValue({
      state: 'California',
      category: 'Education',
      year: 2020,
      statistics: [
        {
          name: 'Graduation Rate',
          value: 85.5,
          unit: '%',
          rank: 1
        }
      ],
      totalStatistics: 1
    });

    mockCreateSuccessResponse.mockReturnValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/aggregation', () => {
    it('should return aggregated data successfully', async () => {
      const response = await GET(mockRequest);

      expect(mockValidateQueryParams).toHaveBeenCalledWith(
        expect.any(Object),
        mockNextUrl.searchParams
      );
      expect(mockAggregationService.aggregate).toHaveBeenCalledWith({
        state: 'California',
        category: 'Education',
        year: 2020
      });
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        state: 'California',
        category: 'Education',
        year: 2020,
        statistics: [
          {
            name: 'Graduation Rate',
            value: 85.5,
            unit: '%',
            rank: 1
          }
        ],
        totalStatistics: 1
      });
      expect(response.status).toBe(200);
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid parameters');
      mockValidateQueryParams.mockImplementation(() => {
        throw validationError;
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid parameters'
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Database error');
      mockAggregationService.aggregate.mockRejectedValue(serviceError);

      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });

    it('should handle missing query parameters', async () => {
      mockNextUrl.searchParams = new URLSearchParams('');

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('validation')
      });
    });

    it('should handle invalid state parameter', async () => {
      mockNextUrl.searchParams = new URLSearchParams('state=InvalidState&category=Education&year=2020');

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('validation')
      });
    });

    it('should handle invalid year parameter', async () => {
      mockNextUrl.searchParams = new URLSearchParams('state=California&category=Education&year=invalid');

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('validation')
      });
    });

    it('should handle empty aggregation results', async () => {
      mockAggregationService.aggregate.mockResolvedValue({
        state: 'California',
        category: 'Education',
        year: 2020,
        statistics: [],
        totalStatistics: 0
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        state: 'California',
        category: 'Education',
        year: 2020,
        statistics: [],
        totalStatistics: 0
      });
    });

    it('should handle multiple statistics in aggregation', async () => {
      const mockAggregationResult = {
        state: 'California',
        category: 'Education',
        year: 2020,
        statistics: [
          {
            name: 'Graduation Rate',
            value: 85.5,
            unit: '%',
            rank: 1
          },
          {
            name: 'Test Scores',
            value: 78.2,
            unit: 'points',
            rank: 2
          },
          {
            name: 'College Enrollment',
            value: 65.8,
            unit: '%',
            rank: 3
          }
        ],
        totalStatistics: 3
      };

      mockAggregationService.aggregate.mockResolvedValue(mockAggregationResult);

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(mockAggregationResult);
    });

    it('should handle different HTTP methods', async () => {
      mockRequest.method = 'POST';

      const response = await GET(mockRequest);

      // Should still work since we're only testing the GET handler
      expect(response.status).toBe(200);
    });

    it('should handle malformed URL search params', async () => {
      // Mock a malformed search params object
      mockNextUrl.searchParams = null;

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('validation')
      });
    });
  });
}); 