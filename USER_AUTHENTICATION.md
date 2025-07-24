# User Authentication System

## Overview

The Results America application includes a comprehensive user authentication and authorization system with role-based access control, session management, and admin user management capabilities.

## Features

### 🔐 Authentication
- **Secure Login/Logout**: Session-based authentication with secure cookies
- **Password Security**: BCrypt hashing with 12 salt rounds
- **Session Management**: 24-hour session duration with automatic cleanup
- **Password Reset**: Secure token-based password reset functionality with email delivery

### 👥 User Management
- **Role-Based Access**: Three user roles (admin, user, viewer)
- **User CRUD Operations**: Create, read, update, delete users
- **Account Status**: Active/inactive user management
- **Activity Logging**: Comprehensive audit trail of user actions

### 🛡️ Security Features
- **Admin Route Protection**: Middleware-based route protection
- **Session Validation**: Automatic session validation on protected routes
- **Activity Monitoring**: Track user login attempts and system usage
- **Secure Headers**: HTTP-only cookies with secure flags
- **Password Reset Security**: Secure token generation with expiration and one-time use

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' NOT NULL,
  is_active INTEGER DEFAULT true NOT NULL,
  email_verified INTEGER DEFAULT false NOT NULL,
  last_login_at INTEGER,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Password Reset Tokens
```sql
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT false NOT NULL,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Activity Logs
```sql
CREATE TABLE user_activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## User Roles

### Admin
- Full system access
- User management (create, edit, delete users)
- Data management and seeding
- System configuration
- Analytics and monitoring

### User
- Standard application access
- View and interact with data
- Limited administrative functions

### Viewer
- Read-only access
- View data and reports
- No administrative functions

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/validate-reset-token` - Validate reset token
- `POST /api/auth/reset-password` - Reset password with token

### Admin User Management
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users/[id]` - Get specific user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Bootstrap
- `POST /api/admin/bootstrap` - Create first admin user

## Bootstrap Process

### Initial Setup
1. **Access Bootstrap Page**: Navigate to `/admin/bootstrap`
2. **Create Admin User**: Fill in the form with admin credentials
3. **Validation**: System ensures no admin user exists before creation
4. **Redirect**: Automatically redirected to login page

### Bootstrap Requirements
- Email must be unique
- Password minimum 8 characters
- Name is required
- Only one admin user can be created via bootstrap

## Usage Guide

### For Administrators

#### Creating the First Admin User
1. Deploy the application
2. Navigate to `/admin/bootstrap`
3. Fill in admin credentials:
   - **Name**: Full name of the admin
   - **Email**: Admin email address
   - **Password**: Strong password (min 8 characters)
4. Submit the form
5. You'll be redirected to login page
6. Log in with your credentials

#### Managing Users
1. Log in as admin
2. Navigate to `/admin/users`
3. Use the interface to:
   - View all users and their stats
   - Create new users
   - Activate/deactivate users
   - Change user roles
   - Delete users

#### User Management Features
- **User Statistics**: View total users, active users, admin count, recent logins
- **Bulk Operations**: Manage multiple users efficiently
- **Role Assignment**: Assign appropriate roles to users
- **Account Status**: Activate/deactivate accounts as needed

### For Users

#### Logging In
1. Navigate to `/login`
2. Enter email and password
3. System validates credentials
4. Creates secure session
5. Redirects to appropriate dashboard

#### Password Reset Process
1. **Request Reset**: Click "Forgot your password?" on login page
2. **Enter Email**: Provide your email address on `/forgot-password`
3. **Receive Token**: System generates secure reset token (1-hour expiration)
4. **Access Reset Page**: Click reset link from email (or check console in development)
5. **Set New Password**: Enter new password and confirmation on `/reset-password`
6. **Complete Reset**: Password is updated and token is marked as used
7. **Sign In**: Use new password to log in

#### Session Management
- Sessions last 24 hours
- Automatic logout on session expiry
- Secure cookie-based authentication
- Protection against session hijacking

## Password Reset System

### Security Features
- **Secure Token Generation**: 32-byte random hexadecimal tokens
- **Time-Limited Tokens**: 1-hour expiration for all reset tokens
- **One-Time Use**: Tokens are marked as used after password reset
- **Email Validation**: Tokens are tied to specific user accounts
- **Password Requirements**: Minimum 8 characters with confirmation

### Development vs Production
- **Development**: Reset URLs are logged to console and returned in API response
- **Production**: Reset links are sent via email service (SendGrid, AWS SES, etc.)

### Token Lifecycle
1. **Generation**: User requests password reset
2. **Storage**: Token stored in database with expiration
3. **Delivery**: Token sent via email (or logged in development)
4. **Validation**: Token validated when user accesses reset page
5. **Usage**: Token used to update password
6. **Cleanup**: Token marked as used and expires

## Security Considerations

### Password Security
- BCrypt hashing with 12 salt rounds
- Minimum 8 character requirement
- Secure password reset tokens (32-byte random)
- One-time use reset tokens with 1-hour expiration
- Token validation and expiration handling
- Password confirmation requirement

### Session Security
- HTTP-only cookies
- Secure flag in production
- Automatic session cleanup
- Protection against CSRF attacks

### Access Control
- Role-based permissions
- Route-level protection
- API endpoint security
- Admin-only functions

### Password Reset Security
- Secure token generation using crypto.randomBytes()
- Time-limited token expiration
- One-time use tokens prevent replay attacks
- Email-based delivery ensures account ownership
- Security through obscurity (same response for all emails)

## Monitoring and Logging

### Activity Tracking
- User login/logout events
- Administrative actions
- Data modifications
- System access patterns
- Password reset requests and completions

### Audit Trail
- IP address logging
- User agent tracking
- Timestamp recording
- Action details
- Password reset token usage

## Development

### Adding New Roles
1. Update the `role` enum in the schema
2. Modify the AuthService role validation
3. Update UI components
4. Add role-specific permissions

### Extending User Fields
1. Add columns to the users table
2. Update the User interface
3. Modify API endpoints
4. Update UI forms

### Custom Permissions
1. Create permission constants
2. Add permission checks to services
3. Implement permission middleware
4. Update UI based on permissions

### Email Integration
1. Configure email service (SendGrid, AWS SES, etc.)
2. Update forgot password endpoint to send emails
3. Create email templates
4. Test email delivery in staging

## Troubleshooting

### Common Issues

#### "Admin user already exists"
- The bootstrap endpoint can only create one admin user
- Use the regular user creation endpoint for additional admins

#### "Invalid session"
- Session may have expired
- Clear browser cookies and log in again
- Check server time synchronization

#### "Access denied"
- Verify user role has required permissions
- Check if user account is active
- Ensure proper authentication

#### "Invalid or expired reset token"
- Reset tokens expire after 1 hour
- Tokens can only be used once
- Request a new password reset

#### "Password reset email not received"
- Check spam/junk folder
- Verify email address is correct
- In development, check console for reset URL
- Ensure email service is configured in production

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG_AUTH=true
DEBUG_SESSIONS=true
DEBUG_PASSWORD_RESET=true
```

## Environment Variables

```bash
# Authentication
SESSION_SECRET=your-session-secret
SESSION_DURATION=86400000  # 24 hours in milliseconds

# Security
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
PASSWORD_RESET_EXPIRY=3600000  # 1 hour in milliseconds

# Email (for production)
EMAIL_SERVICE_API_KEY=your-email-service-key
EMAIL_FROM_ADDRESS=noreply@yourapp.com

# Development
DEBUG_AUTH=false
DEBUG_SESSIONS=false
DEBUG_PASSWORD_RESET=false
```

## Best Practices

### Password Policy
- Enforce strong passwords
- Regular password updates
- Secure password reset process
- Account lockout on failed attempts

### Session Management
- Regular session cleanup
- Secure cookie settings
- Proper logout handling
- Session timeout warnings

### User Management
- Regular user audits
- Role-based access reviews
- Inactive account cleanup
- Activity monitoring

### Security Monitoring
- Failed login attempts
- Unusual access patterns
- Administrative actions
- System health checks
- Password reset attempts and completions

### Password Reset Best Practices
- Use secure token generation
- Implement rate limiting on reset requests
- Log all reset attempts for security monitoring
- Provide clear user feedback
- Ensure email delivery reliability 