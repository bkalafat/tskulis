/**
 * CSRF Token API Endpoint
 * Generates and validates CSRF tokens for client requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFTokenGenerator } from '../../../lib/security/utils';

export async function GET(request: NextRequest) {
  try {
    // Get session ID from cookie or generate anonymous ID
    const sessionCookie = request.cookies.get('session-id');
    const sessionId = sessionCookie?.value || `anonymous_${Date.now()}`;

    // Generate CSRF token
    const token = CSRFTokenGenerator.generate(sessionId);

    const response = NextResponse.json({ 
      csrfToken: token,
      sessionId: sessionId 
    });

    // Set session cookie if not exists
    if (!sessionCookie) {
      response.cookies.set('session-id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 // 24 hours
      });
    }

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, sessionId } = body;

    if (!token || !sessionId) {
      return NextResponse.json(
        { error: 'Token and sessionId are required' },
        { status: 400 }
      );
    }

    // Verify CSRF token
    const isValid = CSRFTokenGenerator.verify(token, sessionId);

    return NextResponse.json({ 
      valid: isValid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate CSRF token' },
      { status: 500 }
    );
  }
}