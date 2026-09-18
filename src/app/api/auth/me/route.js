import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.primary_role,
        isVerified: Boolean(user.is_verified),
        riskScore: user.risk_score,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, user: null },
      { status: 500 }
    );
  }
}
