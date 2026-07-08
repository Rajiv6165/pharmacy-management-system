import { NextRequest, NextResponse } from 'next/server';

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const payload = decodeJwt(token);
  if (!payload) {
    return NextResponse.json({ user: null });
  }

  // If token is expired, clean up cookie
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    const res = NextResponse.json({ user: null });
    res.cookies.delete('token');
    return res;
  }

  return NextResponse.json({
    user: {
      id: parseInt(payload.sub),
      type: payload.type,
      role: payload.role || null
    }
  });
}
