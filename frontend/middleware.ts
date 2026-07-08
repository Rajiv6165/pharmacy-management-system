import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Edge runtime doesn't have Buffer, so we use atob
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  const isStaffPath = pathname.startsWith('/staff');
  const isStaffLoginPath = pathname === '/staff/login';
  const isAdminPath = pathname.startsWith('/staff/admin');
  const isCustomerAccountPath =
    pathname.startsWith('/account') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders');
  const isCustomerAuthPath = pathname === '/login' || pathname === '/register';

  const payload = token ? decodeJwt(token) : null;
  const isLoggedIn = !!payload && !(payload.exp && Date.now() >= payload.exp * 1000);
  const isStaff = isLoggedIn && payload.type === 'staff';
  const isAdmin = isStaff && payload.role === 'admin';
  const isCustomer = isLoggedIn && payload.type === 'customer';

  // 1. Gating Staff Portal
  if (isStaffPath && !isStaffLoginPath) {
    if (!isStaff) {
      return NextResponse.redirect(new URL('/staff/login', req.url));
    }
    if (isAdminPath && !isAdmin) {
      return NextResponse.redirect(new URL('/staff/dashboard', req.url));
    }
  }

  // Redirect active staff away from staff login
  if (isStaffLoginPath && isStaff) {
    return NextResponse.redirect(new URL('/staff/dashboard', req.url));
  }

  // 2. Gating Customer Account Paths
  if (isCustomerAccountPath) {
    if (!isCustomer) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Redirect active customer away from register/login
  if (isCustomerAuthPath && isCustomer) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, etc. (static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
