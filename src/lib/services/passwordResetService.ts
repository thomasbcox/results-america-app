import { db } from '../db';
import { users, passwordResetTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ValidationError, NotFoundError } from '../errors';

export interface PasswordResetRequest {
  email: string;
  origin: string;
}

export interface PasswordResetResult {
  message: string;
  resetUrl?: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export class PasswordResetService {
  static async initiatePasswordReset(request: PasswordResetRequest): Promise<PasswordResetResult> {
    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, request.email))
      .limit(1);

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store the reset token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    // Generate reset URL
    const resetUrl = `${request.origin}/reset-password?token=${token}`;
    
    // Log for development
    console.log('Password reset link generated:', {
      email: user.email,
      resetUrl,
      expiresAt,
    });

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
    };
  }

  static async validateResetToken(token: string): Promise<boolean> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    return !!resetToken;
  }

  static async resetPassword(request: ResetPasswordRequest): Promise<string> {
    // Validate password length
    if (request.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if token exists and is valid
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, request.token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetToken) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(request.password, 12);

    // Update the user's password
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, resetToken.userId));

    // Mark the reset token as used
    await db
      .update(passwordResetTokens)
      .set({
        used: true,
      })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return 'Password reset successfully';
  }
} 