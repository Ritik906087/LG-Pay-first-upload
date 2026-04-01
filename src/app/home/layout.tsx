
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, History, UserPlus, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/loader';
import { useLanguage } from '@/context/language-context';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseUser } from '@/hooks/use-supabase-user';


export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { translations } = useLanguage();
  const { user, profile, loading } = useSupabaseUser();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    // Session validation logic
    if (!loading && profile && profile.session_id) {
      const localSessionId = localStorage.getItem('user-session-id');
      if (localSessionId && localSessionId !== profile.session_id) {
        supabase.auth.signOut().then(() => {
          localStorage.removeItem('user-session-id');
          toast({
            variant: 'destructive',
            title: 'Session Expired',
            description: 'You have logged in on another device.',
          });
          // Use window.location to force a full refresh to clear all state
          window.location.href = '/login';
        });
      }
    }
  }, [profile, loading, router, toast, supabase.auth]);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    { href: '/home', icon: Home, label: translations.navHome },
    { href: '/order', icon: History, label: translations.navOrderHistory },
    { href: '/invite', icon: UserPlus, label: translations.navInvite },
    { href: '/my', icon: User, label: translations.navMy },
  ];

  if (!isMounted || loading) {
    return (
      <div className="home-layout md:bg-gray-200">
        <div className="relative mx-auto flex min-h-screen w-full flex-col items-center justify-center bg-background md:max-w-md md:shadow-lg">
          <Loader size="md" />
        </div>
      </div>
    );
  }
  
  if (!user) {
    router.replace('/login');
    return (
       <div className="home-layout md:bg-gray-200">
        <div className="relative mx-auto flex min-h-screen w-full flex-col items-center justify-center bg-background md:max-w-md md:shadow-lg">
          <Loader size="md" />
        </div>
      </div>
    );
  }

  const noNavRoutes = [
    '/buy',
    '/sell',
    '/my/team',
    '/my/report-problem',
    '/my/report-status',
    '/my/feedback',
    '/my/collection',
    '/my/change-password',
    '/my/transactions',
    '/my/settings',
    '/my/new-user-rewards',
    '/my/newbie-friend-rewards',
    '/my/tutorial',
  ];

  const showNavBar = !noNavRoutes.some(route => pathname.startsWith(route));

  return (
    <div className="home-layout md:bg-gray-200">
      <div className="relative mx-auto flex min-h-screen w-full flex-col bg-background md:max-w-md md:shadow-lg">
        <main className={cn("flex-grow", showNavBar ? "pb-14" : "")}>{children}</main>
        {showNavBar && (
          <footer className="fixed bottom-0 z-50 w-full border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:absolute md:max-w-md">
            <nav className="flex h-14 items-center justify-around">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 text-xs transition-colors',
                      isActive
                        ? 'font-bold text-primary'
                        : 'text-gray-500 hover:text-primary'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </footer>
        )}
      </div>
    </div>
  );
}
