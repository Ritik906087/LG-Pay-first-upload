'use client';

import { ReactNode, useMemo, useEffect } from 'react';
import { FirebaseProvider, initializeFirebase } from '@/firebase';

export function FirebaseClientProvider(props: { children: ReactNode }) {
  const instances = useMemo(initializeFirebase, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return <FirebaseProvider {...instances}>{props.children}</FirebaseProvider>;
}
