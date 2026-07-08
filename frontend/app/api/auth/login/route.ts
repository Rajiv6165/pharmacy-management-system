import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password, isStaff } = body;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const loginEndpoint = isStaff ? '/auth/staff/login' : '/auth/customer/login';

    const response = await fetch(`${backendUrl}${loginEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { detail: errData.detail || 'Authentication failed' },
        { status: response.status }
      );
    }

    const data = await response.json(); // contains access_token and optionally role

    const res = NextResponse.json({
      success: true,
      role: data.role || 'customer'
    });

    res.cookies.set('token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
