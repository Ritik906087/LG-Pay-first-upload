
import type { ReactNode } from 'react';

export default function ReportProblemDetailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary">
        {children}
    </div>
    );
}
