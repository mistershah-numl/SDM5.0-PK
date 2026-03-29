import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Company from '@/lib/models/Company';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check token age (24 hours)
    const tokenAge = Date.now() - decoded.iat;
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    await connect();
    
    // Find user
    const user = await User.findById(decoded.userId).select('-passwordHash').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find company if companyId exists
    let company = null;
    if (user.companyId) {
      company = await Company.findById(user.companyId)
        .select('name industry size region contactEmail')
        .lean();
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId?.toString(),
        company: company,
      },
    });
  } catch (error: any) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 401 });
  }
}
