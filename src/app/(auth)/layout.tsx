import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <header className="absolute top-0 flex w-full max-w-md items-center justify-end p-6">
        <LanguageSwitcher />
      </header>
      <main className="w-full max-w-md">
        <Logo className="mb-4 text-center text-4xl font-extrabold" />
        {children}
      </main>
    </div>
  );
}
