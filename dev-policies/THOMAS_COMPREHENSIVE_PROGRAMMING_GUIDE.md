# Comprehensive Programming Guide
## Assessment Tracker Architecture & Patterns

This guide captures all major architectural decisions, patterns, and best practices from the Assessment Tracker project. Use this as a reference for building similar applications with modern web technologies.

---

## 🏗️ **Core Architecture Decisions**

### **1. Technology Stack**
- **Frontend**: Next.js 15 with App Router + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Service Layer Pattern
- **Database**: SQLite (dev) / PostgreSQL (prod) + Drizzle ORM
- **Authentication**: Magic Link (passwordless)
- **Testing**: Jest + React Testing Library + Real Database Testing
- **Styling**: Tailwind CSS with Glass Morphism Design System

### **2. Layered Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Next.js App   │  │   React Client  │  │   Tailwind   │ │
│  │     Router      │  │   Components    │  │     CSS      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Next.js API   │  │   Service       │  │   Validation │ │
│  │     Routes      │  │   Layer         │  │   (Zod)      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Drizzle ORM   │  │   SQLite/       │  │   Session    │ │
│  │                 │  │   PostgreSQL    │  │   Storage    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Service Layer Pattern**

### **Core Principle: API Routes as Thin Wrappers**
All business logic goes in service classes. API routes only handle HTTP concerns.

### **Service Interface Pattern**
```typescript
// src/lib/types/service-interfaces.ts
export interface IUserService {
  createUser(input: CreateUserInput): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, input: UpdateUserInput): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUserStats(userId: string): Promise<UserStats>;
}

export type CreateUserInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
};
```

### **Service Implementation**
```typescript
// src/lib/services/users.ts
export class UserService implements IUserService {
  static async createUser(input: CreateUserInput): Promise<User> {
    // Business logic here
    const user = await db.insert(users).values(input).returning();
    return user[0];
  }
  
  static async getUserStats(userId: string): Promise<UserStats> {
    // Complex business logic for calculating user statistics
    const instances = await db.select().from(assessmentInstances)
      .where(eq(assessmentInstances.userId, userId));
    
    return {
      total: instances.length,
      completed: instances.filter(i => i.completedAt).length,
      pending: instances.filter(i => !i.completedAt).length
    };
  }
}
```

### **API Route (Thin Wrapper)**
```typescript
// src/app/api/users/[id]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserStats } from '@/lib/services/users';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const stats = await getUserStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### **Error Handling Pattern**
```typescript
export class ServiceError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Usage in services
if (!user) {
  throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
}
```

---

## 🗄️ **Database Design Patterns**

### **1. Foreign Key Order Rules**
Always create data in dependency order to avoid constraint violations:

```typescript
// ✅ CORRECT ORDER: Create dependencies first
export const createTestAssessmentSetup = async (overrides = {}) => {
  // 1. Create assessment type first (no dependencies)
  const type = await createTestAssessmentType(overrides.type);
  
  // 2. Create period (no dependencies)
  const period = await createTestAssessmentPeriod(overrides.period);
  
  // 3. Create template (depends on type)
  const template = await createTestAssessmentTemplate({
    ...overrides.template,
    assessmentTypeId: type.id
  });
  
  // 4. Create category (depends on type)
  const category = await createTestAssessmentCategory({
    ...overrides.category,
    assessmentTypeId: type.id
  });
  
  // 5. Create questions (depends on template and category)
  const questions = await createTestAssessmentQuestions({
    ...overrides.questions,
    templateId: template.id,
    categoryId: category.id
  });
  
  return { type, period, template, category, questions };
};
```

### **2. Database Schema Design**
```typescript
// src/lib/db.ts
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').notNull(),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const assessmentTypes = sqliteTable('assessment_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Foreign key relationships
export const assessmentTemplates = sqliteTable('assessment_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assessmentTypeId: integer('assessment_type_id').notNull()
    .references(() => assessmentTypes.id),
  name: text('name').notNull(),
  version: text('version').notNull(),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
```

### **3. Migration Strategy**
```typescript
// scripts/setup-database.js
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('dev.db');
const db = drizzle(sqlite);

// Run migrations
migrate(db, { migrationsFolder: './drizzle' });
```

---

## 🧪 **Testing Patterns**

### **1. Simple Factory Functions (No Complex Builders)**
```typescript
// src/lib/test-utils-clean.ts
export const createTestUserData = (overrides: Partial<NewUser> = {}): NewUser => ({
  id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: 1,
  ...overrides
});

export const insertTestUser = async (data: NewUser): Promise<User> => {
  const [user] = await db.insert(users).values(data).returning();
  return user;
};

export const createTestUser = async (overrides: Partial<NewUser> = {}): Promise<User> => {
  const data = createTestUserData(overrides);
  return await insertTestUser(data);
};
```

### **2. Real Database Testing (No Mocking)**
```typescript
// ✅ GOOD: Real database testing
describe('UserService', () => {
  beforeEach(async () => {
    await cleanup(); // Clean slate for each test
  });

  afterEach(async () => {
    await cleanup(); // Ensure cleanup even if test fails
  });

  it('should create user successfully', async () => {
    const input = { email: 'test@example.com', role: 'user' };
    const user = await UserService.createUser(input);
    expect(user.email).toBe(input.email);
  });
});

// ❌ BAD: Mocking database
jest.mock('@/lib/db'); // Don't do this!
```

### **3. Test Data Composition**
```typescript
// Build complex scenarios from simple pieces
export const createTestUserWithAssessment = async (overrides = {}) => {
  const user = await createTestUser(overrides.user);
  const { type, period, template } = await createTestAssessmentSetup(overrides.assessmentSetup);
  
  const instance = await createTestAssessmentInstance({
    ...overrides.instance,
    userId: user.id,
    periodId: period.id,
    templateId: template.id
  });
  
  return { user, type, period, template, instance };
};
```

---

## 🎨 **UI/UX Design Patterns**

### **1. Glass Morphism Design System**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.2)',
          shadow: 'rgba(0, 0, 0, 0.1)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
};
```

### **2. Toast Notifications (Replace System Dialogs)**
```typescript
// src/components/ui/toast.tsx
"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return createPortal(
    <div className={`
      fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg
      ${type === 'success' ? 'bg-green-500 text-white' : ''}
      ${type === 'error' ? 'bg-red-500 text-white' : ''}
      ${type === 'info' ? 'bg-blue-500 text-white' : ''}
    `}>
      {message}
    </div>,
    document.body
  );
}
```

### **3. Confirmation Dialogs**
```typescript
// src/components/ui/confirm-dialog.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';

export function ConfirmDialog({ 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive'
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant={variant}>
        {confirmText}
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{message}</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancel}>
                  {cancelText}
                </Button>
                <Button variant={variant} onClick={handleConfirm}>
                  {confirmText}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
```

### **4. Fixing Dropdown Overlap Issues**
```typescript
// Use z-index and proper positioning
.dropdown-container {
  position: relative;
  z-index: 10;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 20;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

// For modals and overlays
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  z-index: 60;
}
```

---

## 🔐 **Authentication & Security**

### **1. Magic Link Authentication**
```typescript
// src/lib/services/auth.ts
export class AuthService {
  static async createMagicLink(email: string): Promise<string> {
    // Validate user exists
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token
    await db.insert(magicLinks).values({
      email,
      token,
      expiresAt: expiresAt.toISOString(),
      used: 0,
    });

    return token;
  }

  static async verifyMagicLink(token: string): Promise<User> {
    const [magicLink] = await db.select()
      .from(magicLinks)
      .where(and(
        eq(magicLinks.token, token),
        eq(magicLinks.used, 0),
        gt(magicLinks.expiresAt, new Date().toISOString())
      ))
      .limit(1);

    if (!magicLink) {
      throw new ServiceError('Invalid or expired token', 'INVALID_TOKEN', 400);
    }

    // Mark as used
    await db.update(magicLinks)
      .set({ used: 1 })
      .where(eq(magicLinks.id, magicLink.id));

    // Get user
    const user = await this.getUserByEmail(magicLink.email);
    if (!user) {
      throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
    }

    return user;
  }
}
```

### **2. Session Management**
```typescript
// src/lib/session.ts
class SessionManager {
  private readonly SESSION_KEY = 'app-session';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  createSession(user: User, token: string): void {
    const session: Session = {
      user,
      expiresAt: Date.now() + this.SESSION_DURATION,
      token,
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  getSession(): Session | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: Session = JSON.parse(sessionData);
      
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      this.clearSession();
      return null;
    }
  }
}
```

---

## 📱 **Next.js App Router Patterns**

### **1. Server vs Client Components**
```typescript
// ✅ Server Component (default)
export default function StaticPage() {
  return <div>Static content</div>;
}

// ✅ Client Component (when needed)
"use client";
import { useState, useEffect } from 'react';

export default function InteractivePage() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Client-side logic
  }, []);
  
  return <div>Interactive content</div>;
}
```

### **2. Layout Pattern**
```typescript
// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <SessionProvider>
            <main>{children}</main>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### **3. Page Pattern**
```typescript
// src/app/dashboard/page.tsx
"use client";

import { useSession } from '@/hooks/useSession';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export default function DashboardPage() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <DashboardLayout>
      <h1>Welcome, {user.firstName}!</h1>
      {/* Dashboard content */}
    </DashboardLayout>
  );
}
```

---

## 🎯 **ESLint Rules & Code Quality**

### **1. Custom ESLint Rules**
```javascript
// eslint-rules/no-logic-in-api-routes.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent business logic in API routes',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.name === 'db' && context.getFilename().includes('/api/')) {
          context.report({
            node,
            message: 'Database operations should be in service layer, not API routes',
          });
        }
      },
    };
  },
};
```

### **2. TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🚀 **Performance Optimization**

### **1. Database Indexing**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assessment_instances_user_id ON assessment_instances(user_id);
CREATE INDEX idx_assessment_instances_period_id ON assessment_instances(period_id);
CREATE INDEX idx_manager_relationships_manager_id ON manager_relationships(manager_id);
CREATE INDEX idx_manager_relationships_subordinate_id ON manager_relationships(subordinate_id);
```

### **2. Component Optimization**
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

### **3. Bundle Optimization**
```typescript
// Dynamic imports for code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

// Lazy load routes
const AdminPage = lazy(() => import('./AdminPage'));
```

---

## 🔄 **Migration to PostgreSQL**

### **1. Environment Configuration**
```typescript
// src/lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
export const db = drizzle(client);
```

### **2. Schema Compatibility**
```typescript
// Ensure SQLite and PostgreSQL compatibility
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').notNull(),
  isActive: integer('is_active').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 📊 **Monitoring & Logging**

### **1. Structured Logging**
```typescript
// src/lib/logger.ts
class Logger {
  private log(level: LogLevel, message: string, data?: any, error?: Error) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    if (process.env.NODE_ENV === 'development') {
      console[level](`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, data);
    } else {
      // Send to logging service in production
    }
  }

  error(message: string, data?: any, error?: Error) {
    this.log('error', message, data, error);
  }
}
```

### **2. Error Tracking**
```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }
}
```

---

## 🎯 **Key Takeaways**

### **Architecture Principles**
1. **Service Layer First** - All business logic in services
2. **Thin API Routes** - Only handle HTTP concerns
3. **Real Database Testing** - No mocking of database
4. **Simple Factory Functions** - No complex test builders
5. **Type Safety** - Full TypeScript throughout
6. **Error Handling** - Consistent error patterns

### **Development Workflow**
1. **Define Interfaces** - Start with TypeScript interfaces
2. **Implement Services** - Business logic in service classes
3. **Write Tests** - Test services directly with real database
4. **Create API Routes** - Thin wrappers around services
5. **Build UI** - Server/client components as appropriate
6. **Add Validation** - Zod schemas for runtime validation

### **Quality Assurance**
1. **ESLint Rules** - Enforce architectural patterns
2. **TypeScript** - Catch errors at compile time
3. **Real Testing** - Integration tests with real database
4. **Error Boundaries** - Graceful error handling
5. **Logging** - Structured logging for debugging

This guide captures the essential patterns and decisions that make this application maintainable, testable, and scalable. Use these patterns as a foundation for building similar applications. 