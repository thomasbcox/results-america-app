# User Authentication System

## 🔐 Overview

The Results America application uses a modern, secure magic link authentication system that provides passwordless login while maintaining strong security. This system eliminates the need for users to remember passwords while ensuring secure access to enhanced features.

## ✨ Key Features

### 🔑 Magic Link Authentication
- **Passwordless Login**: No passwords to remember or manage
- **Email-Based**: Secure tokens sent via email
- **Time-Limited**: 15-minute expiration for security
- **One-Time Use**: Tokens are invalidated after use
- **Rate Limited**: Prevents abuse of the system

### 👥 User Management
- **Role-Based Access**: User and Admin roles
- **Account Status**: Active/inactive user management
- **Email Verification**: Automatic verification via magic links
- **Session Management**: 24-hour sessions with automatic cleanup

### 🛡️ Security Features
- **Secure Tokens**: Cryptographically secure random tokens
- **Session Validation**: Automatic session validation on protected routes
- **Token Cleanup**: Automatic cleanup of expired tokens
- **Rate Limiting**: Prevents brute force attacks

## 🏗️ System Architecture

### Authentication Flow
```
1. User requests magic link → /api/auth/magic-link
2. System generates secure token → 32-byte random hex
3. Token stored in database → magic_links table
4. Email sent with verification link → /auth/verify?token=xxx
5. User clicks link → /api/auth/verify
6. Token validated and consumed → User logged in
7. Session created → 24-hour session token
8. User redirected → Enhanced features available
```

### Session Management
```
1. Session token stored in HTTP-only cookie
2. 24-hour expiration with automatic cleanup
3. Middleware validates sessions on protected routes
4. Automatic logout on session expiration
5. Multiple sessions per user supported
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active INTEGER NOT NULL DEFAULT 1,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Magic Links Table
```sql
CREATE TABLE magic_links (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Implementation Details

### Magic Link Generation
```typescript
// Generate secure 32-byte random token
private static generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Create magic link with 15-minute expiration
static async createMagicLink(email: string): Promise<{ token: string; expiresAt: Date }> {
  const token = this.generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  await db.insert(magicLinks).values({
    email,
    token,
    expiresAt,
    used: 0,
  });
  
  return { token, expiresAt };
}
```

### Session Creation
```typescript
// Create 24-hour session
static async createSession(userId: number): Promise<Session> {
  const token = this.generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const [session] = await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  }).returning();
  
  return session;
}
```

### Authentication Middleware
```typescript
// Require authentication
export async function withAuth(
  request: AuthenticatedRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const sessionToken = request.cookies.get('session_token')?.value;
  
  if (!sessionToken) {
    return createUnauthorizedResponse('Authentication required');
  }
  
  const user = await AuthService.getUserBySession(sessionToken);
  
  if (!user || !user.isActive) {
    return createUnauthorizedResponse('Invalid or expired session');
  }
  
  request.user = user;
  return await handler(request);
}
```

## 🚀 User Experience

### Login Process
1. **Navigate to Login**: User visits `/auth/login`
2. **Enter Email**: User enters their email address
3. **Request Magic Link**: System sends secure token via email
4. **Check Email**: User receives email with verification link
5. **Click Link**: User clicks link to verify and login
6. **Automatic Login**: User is logged in and redirected

### Enhanced Features (Authenticated)
- **Personalized Experience**: User preferences and favorites
- **Admin Access**: Administrative features (for admin users)
- **Data Persistence**: Selections saved across sessions
- **Advanced Features**: Future enhanced functionality

### Core Features (Unauthenticated)
- **Full Data Access**: All state data and statistics
- **State Comparisons**: Compare states and metrics
- **Search and Filter**: Full search and filtering capabilities
- **No Limitations**: Complete access to core functionality

## 🔐 Security Considerations

### Token Security
- **Cryptographic Strength**: 32-byte random tokens
- **Time Limitation**: 15-minute expiration for magic links
- **One-Time Use**: Tokens invalidated after use
- **Rate Limiting**: Prevents token flooding

### Session Security
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Flags**: HTTPS-only in production
- **Automatic Cleanup**: Expired sessions removed
- **Session Validation**: Every request validated

### Data Protection
- **No Password Storage**: Eliminates password-related risks
- **Email Verification**: Ensures valid email addresses
- **Account Status**: Inactive accounts cannot authenticate
- **Audit Trail**: Session and login tracking

## 📱 API Endpoints

### Authentication APIs
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/verify` - Verify magic link and login
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/me` - Get current user info

### Protected APIs
- `GET /api/admin/stats` - System statistics (Admin only)
- `GET /api/admin/users` - User management (Admin only)
- `GET /api/user/favorites` - User favorites
- `POST /api/user/suggestions` - User suggestions

## 🛠️ Development

### Environment Setup
```env
# Required for magic link emails
RESEND_API_KEY=your_resend_api_key

# Database connection
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

### Testing Authentication
```bash
# Test magic link flow
curl -X POST /api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test session validation
curl -H "Cookie: session_token=your_token" \
  /api/auth/me
```

### Admin User Creation
```bash
# 1. Create user via magic link
# 2. Promote to admin via database
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

# Or via API (requires existing admin)
curl -X POST /api/admin/users/{userId}/promote
```

## 🔍 Monitoring and Maintenance

### Regular Tasks
- **Session Cleanup**: Remove expired sessions daily
- **Magic Link Cleanup**: Remove expired tokens
- **User Activity**: Monitor login patterns
- **Error Tracking**: Monitor authentication failures

### Troubleshooting
- **Email Delivery**: Check Resend API status
- **Token Expiration**: Verify token timing
- **Session Issues**: Check cookie settings
- **Database Connectivity**: Verify database access

## 📈 Future Enhancements

### Planned Features
- **Two-Factor Authentication**: Additional security layer
- **Social Login**: OAuth integration
- **Account Recovery**: Alternative recovery methods
- **Session Management**: User session control

### Security Improvements
- **Device Tracking**: Track login devices
- **Geographic Restrictions**: Location-based access
- **Advanced Rate Limiting**: IP-based limits
- **Security Notifications**: Login alerts

---

**Last Updated**: January 2025  
**Version**: 0.1.0  
**Status**: Magic link authentication implemented and active 