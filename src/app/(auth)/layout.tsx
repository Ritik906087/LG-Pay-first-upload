import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <header className="absolute top-0 flex w-full items-center justify-between p-4 sm:p-6">
        <Logo className="h-10 w-auto" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/help" className="gap-2">
              <HelpCircle className="size-4" />
              <span className="hidden sm:inline">Help Center</span>
            </Link>
          </Button>
        </div>
      </header>
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
