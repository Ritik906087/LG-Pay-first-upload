'use client';

import { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/loader';

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader size="md" />
      </div>
    );
  }

  return <>{children}</>;
}
