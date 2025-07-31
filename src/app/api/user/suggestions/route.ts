import { NextRequest, NextResponse } from 'next/server';
import { withOptionalAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { UserPreferencesService } from '@/lib/services/userPreferencesService';
import { createSuccessResponse, createBadRequestResponse } from '@/lib/response';
import { z } from 'zod';

const SuggestionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  category: z.enum(['new_statistic', 'data_improvement', 'feature_request', 'bug_report']).optional(),
  email: z.string().email().optional(),
});

export async function POST(request: AuthenticatedRequest) {
  return withOptionalAuth(request, async (req) => {
    try {
      const body = await request.json();
      const data = SuggestionSchema.parse(body);
      await UserPreferencesService.submitSuggestion({
        userId: req.user?.id,
        email: data.email || req.user?.email,
        title: data.title,
        description: data.description,
        category: data.category,
      });
      return createSuccessResponse({ message: 'Suggestion submitted successfully' });
    } catch (error) {
      console.error('Submit suggestion error:', error);
      return createBadRequestResponse('Failed to submit suggestion');
    }
  });
}

export async function GET(request: AuthenticatedRequest) {
  return withOptionalAuth(request, async (req) => {
    try {
      if (!req.user) {
        return createSuccessResponse({ data: [] });
      }
      const suggestions = await UserPreferencesService.getUserSuggestions(req.user.id);
      return createSuccessResponse({ data: suggestions });
    } catch (error) {
      console.error('Get suggestions error:', error);
      return createBadRequestResponse('Failed to get suggestions');
    }
  });
} 