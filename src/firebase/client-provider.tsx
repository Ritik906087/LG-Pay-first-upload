'use client';

import { ReactNode, useMemo } from 'react';
import { FirebaseProvider, initializeFirebase } from '@/firebase';

export function FirebaseClientProvider(props: { children: ReactNode }) {
  const instances = useMemo(initializeFirebase, []);

  return <FirebaseProvider {...instances}>{props.children}</FirebaseProvider>;
}
