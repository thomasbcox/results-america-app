import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { UserPreferencesService } from '@/lib/services/userPreferencesService';
import { createSuccessResponse, createBadRequestResponse } from '@/lib/response';
import { z } from 'zod';

const AddFavoriteSchema = z.object({
  statisticId: z.number().positive('Statistic ID must be positive'),
});

export async function GET(request: AuthenticatedRequest) {
  return withAuth(request, async (req) => {
    try {
      const favorites = await UserPreferencesService.getFavorites(req.user.id);
      return createSuccessResponse(favorites);
    } catch (error) {
      console.error('Get favorites error:', error);
      return createBadRequestResponse('Failed to get favorites');
    }
  });
}

export async function POST(request: AuthenticatedRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await request.json();
      const { statisticId } = AddFavoriteSchema.parse(body);
      await UserPreferencesService.addFavorite(req.user.id, statisticId);
      return createSuccessResponse({ message: 'Favorite added successfully' });
    } catch (error) {
      console.error('Add favorite error:', error);
      return createBadRequestResponse('Failed to add favorite');
    }
  });
}

export async function DELETE(request: AuthenticatedRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await request.json();
      const { statisticId } = AddFavoriteSchema.parse(body);
      await UserPreferencesService.removeFavorite(req.user.id, statisticId);
      return createSuccessResponse({ message: 'Favorite removed successfully' });
    } catch (error) {
      console.error('Remove favorite error:', error);
      return createBadRequestResponse('Failed to remove favorite');
    }
  });
} 