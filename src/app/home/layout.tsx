
import HomeLayoutClient from './home-layout-client';
import type { ReactNode } from 'react';

export const dynamic = "force-dynamic";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <HomeLayoutClient>{children}</HomeLayoutClient>;
}
