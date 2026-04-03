
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

  const { pathname } = request.nextUrl;
  
  const adminPhones = ['9060873927', '7050396570'];
  const adminPhone = request.cookies.get('admin-phone');
  const isAdminAuthenticated = adminPhone?.value ? adminPhones.includes(adminPhone.value) : false;

  // If an authenticated admin visits the main login page, redirect them to their dashboard.
  if (pathname === '/login' && isAdminAuthenticated) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // ===== Admin Auth Routes =====
  if (pathname.startsWith('/admin')) {
    const isAdminLoginRoute = pathname === '/admin/login';

    if (isAdminLoginRoute) {
      // The dedicated admin login page is removed. Redirect all traffic to the main login page.
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!isAdminAuthenticated) {
      // Unauthenticated users on any other admin page are redirected to the main login page.
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Authenticated admin users are allowed to see any other admin page.
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
