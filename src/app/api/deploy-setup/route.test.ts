import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { POST } from './route';
import { createSuccessResponse, createInternalServerErrorResponse } from '@/lib/response';

// Mock dependencies
jest.mock('@/lib/response');
jest.mock('drizzle-orm/postgres-js');
jest.mock('postgres');
jest.mock('drizzle-orm/postgres-js/migrator');
jest.mock('@/lib/db/seed');

const mockCreateSuccessResponse = createSuccessResponse as jest.MockedFunction<typeof createSuccessResponse>;
const mockCreateInternalServerErrorResponse = createInternalServerErrorResponse as jest.MockedFunction<typeof createInternalServerErrorResponse>;
const mockDrizzle = require('drizzle-orm/postgres-js').drizzle as jest.MockedFunction<typeof require('drizzle-orm/postgres-js').drizzle>;
const mockPostgres = require('postgres') as jest.MockedFunction<typeof require('postgres')>;
const mockMigrate = require('drizzle-orm/postgres-js/migrator').migrate as jest.MockedFunction<typeof require('drizzle-orm/postgres-js/migrator').migrate>;

describe('Deploy Setup API Route', () => {
  let mockRequest: any;
  let mockClient: any;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock database client
    mockClient = {
      end: jest.fn().mockResolvedValue(undefined)
    };

    // Setup mock database
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([])
    };

    // Setup mock request
    mockRequest = {
      method: 'POST'
    };

    // Setup default mock implementations
    mockPostgres.mockReturnValue(mockClient);
    mockDrizzle.mockReturnValue(mockDb);
    mockMigrate.mockResolvedValue(undefined);

    mockCreateSuccessResponse.mockReturnValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true })
    });

    mockCreateInternalServerErrorResponse.mockReturnValue({
      status: 500,
      json: jest.fn().mockResolvedValue({ success: false, error: 'Internal server error' })
    });

    // Mock environment variable
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.DATABASE_URL;
  });

  describe('POST /api/deploy-setup', () => {
    it('should complete deployment setup successfully with seeding', async () => {
      // Mock empty statistics table (needs seeding)
      mockDb.limit.mockResolvedValue([]);

      // Mock seed function
      const mockSeedDatabase = jest.fn().mockResolvedValue(undefined);
      jest.doMock('@/lib/db/seed', () => ({
        seedDatabase: mockSeedDatabase
      }));

      const response = await POST(mockRequest);

      expect(mockPostgres).toHaveBeenCalledWith('postgresql://test:test@localhost:5432/test', {
        max: 1,
        ssl: 'require',
        idle_timeout: 20,
        connect_timeout: 10,
      });
      expect(mockDrizzle).toHaveBeenCalledWith(mockClient, { schema: expect.any(Object) });
      expect(mockMigrate).toHaveBeenCalledWith(mockDb, { migrationsFolder: './drizzle' });
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(mockClient.end).toHaveBeenCalled();
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        message: 'Deployment setup completed successfully',
        migrations: 'completed',
        seeding: 'completed'
      });
      expect(response.status).toBe(200);
    });

    it('should complete deployment setup successfully without seeding', async () => {
      // Mock existing statistics (no seeding needed)
      mockDb.limit.mockResolvedValue([{ id: 1, name: 'Test Statistic' }]);

      const response = await POST(mockRequest);

      expect(mockPostgres).toHaveBeenCalledWith('postgresql://test:test@localhost:5432/test', {
        max: 1,
        ssl: 'require',
        idle_timeout: 20,
        connect_timeout: 10,
      });
      expect(mockDrizzle).toHaveBeenCalledWith(mockClient, { schema: expect.any(Object) });
      expect(mockMigrate).toHaveBeenCalledWith(mockDb, { migrationsFolder: './drizzle' });
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(mockClient.end).toHaveBeenCalled();
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        message: 'Deployment setup completed successfully',
        migrations: 'completed',
        seeding: 'skipped'
      });
      expect(response.status).toBe(200);
    });

    it('should handle missing DATABASE_URL', async () => {
      delete process.env.DATABASE_URL;

      const response = await POST(mockRequest);

      expect(mockCreateInternalServerErrorResponse).toHaveBeenCalledWith('DATABASE_URL not configured');
      expect(response.status).toBe(500);
    });

    it('should handle database connection error', async () => {
      const connectionError = new Error('Connection failed');
      mockPostgres.mockImplementation(() => {
        throw connectionError;
      });

      const response = await POST(mockRequest);

      expect(mockCreateInternalServerErrorResponse).toHaveBeenCalledWith(
        'Deployment setup failed: Connection failed'
      );
      expect(response.status).toBe(500);
    });

    it('should handle migration error', async () => {
      const migrationError = new Error('Migration failed');
      mockMigrate.mockRejectedValue(migrationError);

      const response = await POST(mockRequest);

      expect(mockCreateInternalServerErrorResponse).toHaveBeenCalledWith(
        'Deployment setup failed: Migration failed'
      );
      expect(response.status).toBe(500);
      expect(mockClient.end).toHaveBeenCalled();
    });

    it('should handle seeding error', async () => {
      // Mock empty statistics table (needs seeding)
      mockDb.limit.mockResolvedValue([]);

      // Mock seed function to throw error
      const mockSeedDatabase = jest.fn().mockRejectedValue(new Error('Seeding failed'));
      jest.doMock('@/lib/db/seed', () => ({
        seedDatabase: mockSeedDatabase
      }));

      const response = await POST(mockRequest);

      expect(mockCreateInternalServerErrorResponse).toHaveBeenCalledWith(
        'Deployment setup failed: Seeding failed'
      );
      expect(response.status).toBe(500);
      expect(mockClient.end).toHaveBeenCalled();
    });

    it('should handle database query error', async () => {
      const queryError = new Error('Query failed');
      mockDb.limit.mockRejectedValue(queryError);

      const response = await POST(mockRequest);

      expect(mockCreateInternalServerErrorResponse).toHaveBeenCalledWith(
        'Deployment setup failed: Query failed'
      );
      expect(response.status).toBe(500);
      expect(mockClient.end).toHaveBeenCalled();
    });

    it('should handle client end error', async () => {
      const endError = new Error('Client end failed');
      mockClient.end.mockRejectedValue(endError);

      const response = await POST(mockRequest);

      expect(mockCreateInternalServerErrorResponse).toHaveBeenCalledWith(
        'Deployment setup failed: Client end failed'
      );
      expect(response.status).toBe(500);
    });

    it('should handle non-Error exceptions', async () => {
      mockPostgres.mockImplementation(() => {
        throw 'String error';
      });

      const response = await POST(mockRequest);

      expect(mockCreateInternalServerErrorResponse).toHaveBeenCalledWith(
        'Deployment setup failed: Unknown error'
      );
      expect(response.status).toBe(500);
    });

    it('should handle different database URLs', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/dbname';

      const response = await POST(mockRequest);

      expect(mockPostgres).toHaveBeenCalledWith('postgresql://user:pass@host:5432/dbname', {
        max: 1,
        ssl: 'require',
        idle_timeout: 20,
        connect_timeout: 10,
      });
      expect(response.status).toBe(200);
    });

    it('should handle multiple statistics in database', async () => {
      // Mock multiple existing statistics
      mockDb.limit.mockResolvedValue([
        { id: 1, name: 'Statistic 1' },
        { id: 2, name: 'Statistic 2' },
        { id: 3, name: 'Statistic 3' }
      ]);

      const response = await POST(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        message: 'Deployment setup completed successfully',
        migrations: 'completed',
        seeding: 'skipped'
      });
      expect(response.status).toBe(200);
    });

    it('should handle empty statistics array', async () => {
      // Mock empty statistics array
      mockDb.limit.mockResolvedValue([]);

      const response = await POST(mockRequest);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        message: 'Deployment setup completed successfully',
        migrations: 'completed',
        seeding: 'completed'
      });
      expect(response.status).toBe(200);
    });
  });
}); 