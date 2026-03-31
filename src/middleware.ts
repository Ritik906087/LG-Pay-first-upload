
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session }} = await supabase.auth.getSession();
  const user = session?.user;

  const adminPhone = request.cookies.get('admin-phone');
  const { pathname } = request.nextUrl;

  // ===== Admin Auth Routes =====
  if (pathname.startsWith('/admin')) {
    const isAdminLoginRoute = pathname.startsWith('/admin/login');

    if (adminPhone?.value === process.env.ADMIN_PHONE && isAdminLoginRoute) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    if (!adminPhone?.value && !isAdminLoginRoute) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return response;
  }

  // ===== User Auth Routes =====
  const authRoutes = ['/login', '/register', '/forgot-password', '/terms'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  const protectedRoutes = ['/home', '/my', '/order', '/rewards', '/buy', '/sell'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
