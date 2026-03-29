import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, getUserById } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(auth.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId?._id?.toString(),
        company: user.companyId,
      },
    });
  } catch (error: any) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
