import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Generate a secure magic link token
    // 2. Store the token in the database with expiration
    // 3. Send an email with the magic link
    // 4. Return success response

    // For now, we'll just return success
    // The frontend will handle the session directly for demo purposes
    return NextResponse.json(
      { 
        success: true, 
        message: 'Magic link sent to your email',
        // In production, you'd return a token or redirect URL
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
} 