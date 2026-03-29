import { connect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
}

/**
 * Create auth token using base64 encoding (no external libraries)
 */
export function createAuthToken(
  userId: string,
  email: string,
  name: string,
  role: string,
  companyId?: string
): string {
  const payload = {
    userId,
    email,
    name,
    role,
    companyId,
    iat: Date.now(),
  };
  
  // Use Buffer to encode to base64
  if (typeof window === 'undefined') {
    // Server-side
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  } else {
    // Client-side fallback
    return btoa(JSON.stringify(payload));
  }
}

/**
 * Verify and decode auth token (no external libraries)
 */
export function verifyAuthToken(token: string): SessionUser | null {
  try {
    let decoded: any;
    
    if (typeof window === 'undefined') {
      // Server-side
      decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    } else {
      // Client-side
      decoded = JSON.parse(atob(token));
    }

    // Check if token is not too old (24 hours)
    const tokenAge = Date.now() - decoded.iat;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
      return null;
    }

    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      companyId: decoded.companyId,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Get user from database by ID
 */
export async function getUserById(userId: string) {
  try {
    await connect();
    const user = await User.findById(userId)
      .populate('companyId', 'name industry size region')
      .select('-passwordHash')
      .lean();

    return user || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get auth from cookies (server-side)
 */
export async function getAuthFromCookies(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    return verifyAuthToken(token);
  } catch (error) {
    console.error('Get auth from cookies error:', error);
    return null;
  }
}

/**
 * Get auth from request
 */
export function getAuthFromRequest(request: NextRequest): SessionUser | null {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    return verifyAuthToken(token);
  } catch (error) {
    console.error('Get auth from request error:', error);
    return null;
  }
}
