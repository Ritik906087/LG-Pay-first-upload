import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <header className="absolute top-0 flex w-full max-w-md items-center justify-end p-6">
        <LanguageSwitcher />
      </header>
      <main className="flex w-full max-w-md flex-col items-center">
        <Logo className="mb-6 text-2xl font-bold" />
        {children}
      </main>
    </div>
  );
}
