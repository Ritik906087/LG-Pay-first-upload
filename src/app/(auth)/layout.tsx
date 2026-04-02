
"use client";

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHelpPage = pathname === '/help';

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  if (isHelpPage) {
    return <>{children}</>;
  }

  return (
      <div className="md:bg-gray-200">
        <div className={cn("relative mx-auto flex min-h-screen w-full flex-col items-center justify-start bg-secondary md:max-w-md md:shadow-lg", !isHelpPage && "auth-layout p-4 pt-24 pb-12")}>
          {!isHelpPage && (
            <header className="absolute top-0 flex w-full max-w-md items-center justify-between p-6">
              <Image
                src="https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224708_385.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDcwOF8zODUuanBnIiwiaWF0IjoxNzc1MTUwMzQwLCJleHAiOjE4MDY2ODYzNDB9.g69doGZuYs7EbHQ5ngFHWSxbu_dNyknLSBVLpM5_byQ"
                width={60}
                height={60}
                alt="Decorative corner image"
                className="opacity-80"
              />
              <LanguageSwitcher />
            </header>
          )}
          <main className="flex w-full max-w-md flex-col items-center">
            {!isHelpPage && <Logo className="mb-6 text-2xl font-bold" />}
            {children}
          </main>
        </div>
      </div>
  );
}
