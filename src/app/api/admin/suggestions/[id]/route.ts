import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { AdminService } from '@/lib/services/adminService';
import { createSuccessResponse, createBadRequestResponse, createNotFoundResponse } from '@/lib/response';

export async function PATCH(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params;
      const suggestionId = parseInt(id);
      
      if (isNaN(suggestionId)) {
        return createBadRequestResponse('Invalid suggestion ID');
      }

      const body = await request.json();
      const { status, adminNotes } = body;

      if (!status || !['pending', 'approved', 'rejected', 'implemented'].includes(status)) {
        return createBadRequestResponse('Invalid status value');
      }

      await AdminService.updateSuggestionStatus(suggestionId, status, adminNotes);
      return createSuccessResponse({ message: 'Suggestion status updated successfully' });
    } catch (error) {
      console.error('Update suggestion error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return createNotFoundResponse('Suggestion not found');
      }
      return createBadRequestResponse('Failed to update suggestion');
    }
  });
} 