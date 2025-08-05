import { config } from 'dotenv';
import { afterAll } from '@jest/globals';
import React from 'react';
import { TestUtils, BulletproofTestDatabase } from './bulletproof-test-db';

// Load environment variables for tests
config({ path: '.env' });

// Set test environment
(process.env as any).NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

/**
 * Next.js API Test Environment Setup
 * 
 * This setup provides the necessary globals for testing Next.js API routes
 */
export function setupNextApiTestEnvironment() {
  // Store the native URL constructor before we override it
  const NativeURL = global.URL;
  
  // Mock Next.js Request and Response objects
  global.Request = class MockRequest {
    private _url: string;
    method: string;
    headers: Headers;
    body: any;

    constructor(input: string | Request, init?: RequestInit) {
      if (typeof input === 'string') {
        this._url = input;
      } else {
        this._url = input.url;
      }
      
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body;
    }

    get url() {
      return this._url;
    }

    async json() {
      return this.body ? JSON.parse(this.body as string) : {};
    }

    async text() {
      return this.body as string || '';
    }
  } as any;

  global.Response = class MockResponse {
    status: number;
    headers: Headers;
    body: any;

    constructor(body?: any, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers);
      this.body = body;
    }

    json() {
      return Promise.resolve(this.body);
    }

    text() {
      return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
    }

    static json(data: any, init?: ResponseInit) {
      return new MockResponse(data, init);
    }
  } as any;

  // Mock Next.js server components
  (global as any).NextRequest = global.Request;
  (global as any).NextResponse = global.Response;

  // Mock Next.js URL
  global.URL = class MockURL {
    href: string;
    origin: string;
    protocol: string;
    username: string;
    password: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    searchParams: URLSearchParams;
    hash: string;

    constructor(url: string, base?: string) {
      // Use the stored native URL constructor to avoid infinite recursion
      const nativeURL = new NativeURL(url, base);
      
      this.href = nativeURL.href;
      this.origin = nativeURL.origin;
      this.protocol = nativeURL.protocol;
      this.username = nativeURL.username;
      this.password = nativeURL.password;
      this.host = nativeURL.host;
      this.hostname = nativeURL.hostname;
      this.port = nativeURL.port;
      this.pathname = nativeURL.pathname;
      this.search = nativeURL.search;
      this.searchParams = nativeURL.searchParams;
      this.hash = nativeURL.hash;
    }
  } as any;

  // Mock Next.js headers
  (global as any).headers = () => new Headers();
  (global as any).cookies = () => new Map();
  (global as any).redirect = (url: string) => new Response(null, { status: 302, headers: { Location: url } });
  (global as any).notFound = () => new Response(null, { status: 404 });
  (global as any).permanentRedirect = (url: string) => new Response(null, { status: 308, headers: { Location: url } });
}

/**
 * Database Test Environment Setup
 * 
 * This setup provides database mocking and utilities for service tests
 */
export function setupDatabaseTestEnvironment() {
  // Mock the main database module
  jest.mock('@/lib/db/index', () => {
    let mockDb: any = null;
    
    return {
      getDb: () => mockDb,
      db: () => mockDb,
      setTestDb: (db: any) => { mockDb = db; },
      postgresSchema: {}
    };
  });

  // Mock the cache module
  jest.mock('@/lib/services/cache', () => ({
    cache: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getOptional: jest.fn(),
    },
  }));
}

/**
 * React Test Environment Setup
 * 
 * This setup provides utilities for testing React components
 */
export function setupReactTestEnvironment() {
  // Mock React hooks that might cause issues in tests
  jest.mock('react', () => {
    const originalReact = jest.requireActual('react');
    return {
      ...originalReact,
      useId: () => 'test-id',
      useTransition: () => [false, jest.fn()],
      useDeferredValue: (value: any) => value,
    };
  });

  // Mock Next.js router
  jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  }));

  // Mock Next.js image
  jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
      // eslint-disable-next-line @next/next/no-img-element
      return React.createElement('img', props);
    },
  }));
}

/**
 * Test Database Lifecycle Management
 */
export class TestDatabaseManager {
  private static currentTestDb: any = null;

  /**
   * Create a fresh test database for a test
   */
  static async createTestDatabase(options: {
    seed?: boolean;
    seedOptions?: any;
    config?: any;
  } = {}): Promise<any> {
    // Clean up any existing test database
    this.cleanupTestDatabase();

    // Create new test database
    const testDb = await TestUtils.createAndSeed({
      config: options.config,
      seedOptions: options.seedOptions
    });

    // Set as current test database
    this.currentTestDb = testDb;

    // Mock the database module to use our test database
    const { setTestDb } = require('@/lib/db/index');
    setTestDb(testDb.db);

    return testDb;
  }

  /**
   * Get the current test database
   */
  static getCurrentTestDatabase(): any {
    return this.currentTestDb;
  }

  /**
   * Clean up the current test database
   */
  static cleanupTestDatabase(): void {
    if (this.currentTestDb) {
      BulletproofTestDatabase.destroy(this.currentTestDb);
      this.currentTestDb = null;
    }
  }

  /**
   * Clear all data from the current test database
   */
  static clearTestData(): void {
    if (this.currentTestDb) {
      BulletproofTestDatabase.clearData(this.currentTestDb);
    }
  }
}

/**
 * Jest Test Helpers
 */
export const JestTestHelpers = {
  /**
   * Create a mock request for API testing
   */
  createMockRequest(url: string, options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}): Request {
    const { method = 'GET', headers = {}, body } = options;
    
    return new Request(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }) as any;
  },

  /**
   * Create a mock response for API testing
   */
  createMockResponse(data: any, options: {
    status?: number;
    headers?: Record<string, string>;
  } = {}): Response {
    const { status = 200, headers = {} } = options;
    
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }) as any;
  },

  /**
   * Wait for async operations to complete
   */
  async waitFor(condition: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    throw new Error('Condition not met within timeout');
  },

  /**
   * Mock environment variables for tests
   */
  mockEnv(env: Record<string, string>): () => void {
    const originalEnv = { ...process.env };
    
    Object.assign(process.env, env);
    
    return () => {
      Object.assign(process.env, originalEnv);
    };
  },
};

/**
 * Global test setup
 */
export function setupGlobalTestEnvironment() {
  // Setup Next.js API test environment
  setupNextApiTestEnvironment();
  
  // Setup database test environment
  setupDatabaseTestEnvironment();
  
  // Setup React test environment
  setupReactTestEnvironment();
}

/**
 * Global test teardown
 */
export function teardownGlobalTestEnvironment() {
  // Clean up all test databases
  TestUtils.cleanup();
}

// Setup global test environment
setupGlobalTestEnvironment();

// Note: afterAll should be called in individual test files, not here

// Export everything for use in test files
export {
  TestUtils,
  BulletproofTestDatabase,
}; 