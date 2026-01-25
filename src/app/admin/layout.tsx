import type { ReactNode } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            {children}
        </div>
    </FirebaseClientProvider>
  );
}
