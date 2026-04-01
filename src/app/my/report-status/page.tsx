
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Hourglass, CheckCircle, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/utils';

type Report = {
  id: string;
  display_order_id: string;
  message: string;
  created_at: string;
  status: 'pending' | 'resolved';
  case_id: string;
  resolution_message?: string;
};

const ReportStatusCard = ({ report }: { report: Report }) => {
  const isPending = report.status === 'pending';

  return (
    <Card className="bg-white shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center p-4 border-b">
           <CardTitle className="text-base">Case ID: <span className="font-mono">{report.case_id}</span></CardTitle>
           <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                isPending
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              )}
            >
              {isPending ? (
                <Hourglass className="h-3 w-3" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              <span className="capitalize">{report.status}</span>
            </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-mono">{report.display_order_id}</span>
                <span>{new Date(report.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-md">{report.message}</p>
            
            {report.status === 'resolved' && report.resolution_message && (
                <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800">
                    <h4 className="font-bold text-sm mb-1">Resolution Note:</h4>
                    <p className="text-sm">{report.resolution_message}</p>
                </div>
            )}
      </CardContent>
    </Card>
  );
};

export default function ReportStatusPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const supabase = createClient();
  const { translations } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
        if (!user) {
            setReportsLoading(false);
            return;
        };
        setReportsLoading(true);
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setReports(data as Report[]);
        }
        setReportsLoading(false);
    }
    fetchReports();
  }, [user, supabase]);


  const loading = authLoading || reportsLoading;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">{translations.checkReportStatus}</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow p-4">
        {loading ? (
          <div className="flex justify-center pt-20">
            <Loader size="md" />
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
            <ClipboardList className="h-16 w-16 opacity-30" />
            <p className="mt-4 text-lg font-medium">{translations.noReportsFound}</p>
            <p className="text-sm">{translations.noReportsYet}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportStatusCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
