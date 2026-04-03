
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/ui/loader';

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Loader size="md" />
    </main>
  );
}
