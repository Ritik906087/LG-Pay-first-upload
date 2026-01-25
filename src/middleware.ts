import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userToken = request.cookies.get('firebase-auth-token');
  const adminToken = request.cookies.get('admin-auth');
  const { pathname } = request.nextUrl;

  // ===== Admin Auth Routes =====
  const isAdminLoginRoute = pathname.startsWith('/admin/login');
  const isAdminProtectedRoute = pathname.startsWith('/admin/dashboard');

  if (adminToken && isAdminLoginRoute) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (!adminToken && isAdminProtectedRoute) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  
  if (pathname.startsWith('/admin')) {
      return NextResponse.next();
  }

  // ===== User Auth Routes =====
  const authRoutes = ['/login', '/register', '/forgot-password', '/terms', '/help'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  const protectedRoutes = ['/home', '/my', '/order', '/rewards', '/buy'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (userToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (!userToken && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
