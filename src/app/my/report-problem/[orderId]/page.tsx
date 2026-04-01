
'use client';

import React, { useState, useMemo, Suspense, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Loader, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const buyProblemTypes = [
  'Deposit Not Credited',
  'Deposit Failed',
  'Wrong UTR / Screenshot',
  'Payment Pending',
  'Other Issue',
];

const sellProblemTypes = [
  'Withdrawal Not Received',
  'Withdrawal Amount Incorrect',
  'Payment Reversed',
  'Other Issue',
];

type Order = {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  created_at: string;
};

const FileUploadProgress = ({ file, progress }: { file: File | null; progress: number | null }) => {
    if (!file) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="truncate flex-1">{file.name}</span>
                {progress !== null && <span className="text-xs font-mono">{Math.round(progress)}%</span>}
            </div>
            {progress !== null && <Progress value={progress} className="h-1" />}
        </div>
    );
};

function ReportProblemForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const orderId = params.orderId as string;
  const orderType = searchParams.get('orderType') as 'buy' | 'sell';

  const { user, profile: userProfile } = useSupabaseUser();
  const supabase = createClient();

  const [problemType, setProblemType] = useState('');
  const [message, setMessage] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [bankStatementFile, setBankStatementFile] = useState<File | null>(null);

  const [screenshotProgress, setScreenshotProgress] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [bankStatementProgress, setBankStatementProgress] = useState<number | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
        if (!user || !orderId || !orderType) {
            setOrderLoading(false);
            return;
        };
        setOrderLoading(true);
        const tableName = orderType === 'buy' ? 'orders' : 'sell_orders';
        const { data, error } = await supabase.from(tableName).select('*').eq('id', orderId).single();
        if (error || !data) {
            toast({ variant: 'destructive', title: 'Could not fetch order details.' });
            setOrder(null);
        } else {
            setOrder(data as Order);
        }
        setOrderLoading(false);
    }
    fetchOrder();
  }, [user, orderId, orderType, supabase, toast]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'screenshot' | 'video' | 'statement') => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileTypeName = '';

    if (fileType === 'screenshot') {
        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image file for the screenshot.' });
            return;
        }
        setScreenshotFile(file);
        fileTypeName = 'Screenshot';
    }
    if (fileType === 'video') {
        if (!file.type.startsWith('video/')) {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload a video file.' });
            return;
        }
        setVideoFile(file);
        fileTypeName = 'Video';
    }
    if (fileType === 'statement') {
        if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image or PDF for the statement.' });
            return;
        }
        setBankStatementFile(file);
        fileTypeName = 'Bank statement';
    }

    toast({
        title: `${fileTypeName} selected`,
        description: file.name,
    });
  };
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if(text.length <= 150) {
        setMessage(text);
        setCharCount(text.length);
    }
  };

  const uploadFile = useCallback(async (file: File, path: string, progressSetter: (p: number) => void): Promise<string> => {
        const { data, error } = await supabase.storage
            .from('reports')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(path);
        return publicUrl;
  }, [supabase.storage]);

  const handleSubmit = async () => {
    if (!problemType) {
        toast({ variant: 'destructive', title: 'Please select a problem type.' });
        return;
    }
    if (!user || !userProfile || !order) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load required data. Please try again.' });
        return;
    }
    
    setIsSubmitting(true);
    
    const reportId = uuidv4();
    const caseId = `LGRPT${Date.now()}`;

    try {
        const fileData: { [key: string]: string } = {};

        if (screenshotFile) {
            const path = `${user.id}/${reportId}/screenshot.${screenshotFile.name.split('.').pop()}`;
            const url = await uploadFile(screenshotFile, path, setScreenshotProgress);
            fileData['screenshot_url'] = url;
        }
        if (bankStatementFile) {
            const path = `${user.id}/${reportId}/statement.${bankStatementFile.name.split('.').pop()}`;
            const url = await uploadFile(bankStatementFile, path, setBankStatementProgress);
            // Assuming schema has a column for this, if not, add it or merge with description
        }
        if (videoFile) {
            const path = `${user.id}/${reportId}/video.${videoFile.name.split('.').pop()}`;
            const url = await uploadFile(videoFile, path, setVideoProgress);
            fileData['video_url'] = url;
        }

        const { error: insertError } = await supabase.from('reports').insert({
            case_id: caseId,
            user_id: user.id,
            user_numeric_id: userProfile.numeric_id,
            order_id: order.id,
            display_order_id: order.orderId,
            order_type: orderType,
            problem_type: problemType,
            message: message,
            ...fileData,
            status: 'pending',
        });
        
        if(insertError) throw insertError;

        toast({ title: 'Report Submitted', description: 'We will review your issue shortly.' });
        router.push('/my/report-status');

    } catch (error: any) {
        console.error("Error submitting report:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An error occurred. Please try again.'});
        setIsSubmitting(false); // Only set to false on error, success navigates away
    }
  };

  const problemTypes = orderType === 'buy' ? buyProblemTypes : sellProblemTypes;

  if (orderLoading) {
      return (
          <div className="p-4 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
          </div>
      )
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my/report-problem">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Submit Report</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow space-y-4 p-4">
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono">{order?.orderId}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">₹{order?.amount.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{order ? new Date(order.created_at).toLocaleString() : '...'}</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-base">Problem Type</CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup value={problemType} onValueChange={setProblemType} className="space-y-2">
                    {problemTypes.map(type => (
                        <div key={type} className="flex items-center space-x-3">
                            <RadioGroupItem value={type} id={type} />
                            <Label htmlFor={type} className="font-normal">{type}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-base">Description & Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="message">Describe the issue</Label>
                    <Textarea 
                        id="message" 
                        placeholder="Please provide details..." 
                        value={message}
                        onChange={handleMessageChange}
                        maxLength={150}
                        disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground text-right">{charCount}/150</p>
                </div>
                <div className="space-y-2">
                    <Label>Upload Screenshot</Label>
                    <Input type="file" onChange={(e) => handleFileChange(e, 'screenshot')} accept="image/*" disabled={isSubmitting} />
                    <FileUploadProgress file={screenshotFile} progress={screenshotProgress} />
                </div>
                 <div className="space-y-2">
                    <Label>Upload Bank Statement (Image or PDF)</Label>
                    <Input type="file" onChange={(e) => handleFileChange(e, 'statement')} accept="image/*,application/pdf" disabled={isSubmitting} />
                     <FileUploadProgress file={bankStatementFile} progress={bankStatementProgress} />
                </div>
                 <div className="space-y-2">
                    <Label>Upload Video Recording (Optional)</Label>
                    <Input type="file" onChange={(e) => handleFileChange(e, 'video')} accept="video/*" disabled={isSubmitting} />
                     <FileUploadProgress file={videoFile} progress={videoProgress} />
                </div>
            </CardContent>
        </Card>
        
        <Button onClick={handleSubmit} className="w-full h-12 btn-gradient font-bold" disabled={isSubmitting || !problemType}>
            {isSubmitting ? <Loader size="xs" className="mr-2" /> : null}
            Submit Report
        </Button>
      </main>
    </>
  );
}

export default function ReportProblemDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-20">
                <Loader size="md" />
            </div>
        }>
            <ReportProblemForm />
        </Suspense>
    );
}
