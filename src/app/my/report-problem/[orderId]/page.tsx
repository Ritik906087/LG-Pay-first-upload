
'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Loader, Upload, Paperclip, Video, FileText } from 'lucide-react';
import { useUser, useFirestore, useDoc, useStorage } from '@/firebase';
import { doc, collection, serverTimestamp, Timestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
  createdAt: Timestamp;
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

  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();

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

  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<{ numericId: string }>(userProfileRef);

  const orderRef = useMemo(() => {
    if (!firestore || !user || !orderId || !orderType) return null;
    const collectionName = orderType === 'buy' ? 'orders' : 'sellOrders';
    return doc(firestore, 'users', user.uid, collectionName, orderId);
  }, [firestore, user, orderId, orderType]);
  const { data: order, loading: orderLoading } = useDoc<Order>(orderRef);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'screenshot' | 'video' | 'statement') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileType === 'screenshot' && !file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image file for the screenshot.' });
        return;
    }
    if (fileType === 'video' && !file.type.startsWith('video/')) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload a video file.' });
        return;
    }
    if (fileType === 'statement' && !file.type.startsWith('image/') && !file.type.includes('pdf')) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image or PDF for the statement.' });
        return;
    }

    if (fileType === 'screenshot') setScreenshotFile(file);
    if (fileType === 'video') setVideoFile(file);
    if (fileType === 'statement') setBankStatementFile(file);
  };
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if(text.length <= 150) {
        setMessage(text);
        setCharCount(text.length);
    }
  };

  const uploadFile = (file: File, path: string, progressSetter: (p: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!storage) {
            return reject(new Error("Firebase Storage is not initialized."));
        }
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressSetter(progress);
            },
            (error) => {
                console.error('Upload failed:', error);
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
            }
        );
    });
  };

  const handleSubmit = async () => {
    if (!problemType) {
        toast({ variant: 'destructive', title: 'Please select a problem type.' });
        return;
    }
     if (!user || !userProfile || !order || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load required data. Please try again.' });
        return;
    }
    
    setIsSubmitting(true);
    
    // 1. Generate a new report document reference to get a unique ID
    const newReportRef = doc(collection(firestore, "reports"));
    const reportId = newReportRef.id;

    try {
        let screenshotURL: string | undefined;
        let videoURL: string | undefined;
        let bankStatementURL: string | undefined;

        // 2. Upload files if they exist, using the new reportId in the path
        if (screenshotFile) {
            const fileExtension = screenshotFile.name.split('.').pop();
            const path = `reports/${user.uid}/${reportId}/screenshot.${fileExtension}`;
            screenshotURL = await uploadFile(screenshotFile, path, setScreenshotProgress);
        }
        if (videoFile) {
            const fileExtension = videoFile.name.split('.').pop();
            const path = `reports/${user.uid}/${reportId}/video.${fileExtension}`;
            videoURL = await uploadFile(videoFile, path, setVideoProgress);
        }
        if (bankStatementFile) {
            const fileExtension = bankStatementFile.name.split('.').pop();
            const path = `reports/${user.uid}/${reportId}/statement.${fileExtension}`;
            bankStatementURL = await uploadFile(bankStatementFile, path, setBankStatementProgress);
        }

        // 3. Save the report data to Firestore with the file URLs
        await setDoc(newReportRef, {
            userId: user.uid,
            userNumericId: userProfile.numericId,
            orderId: order.id,
            displayOrderId: order.orderId,
            orderType: orderType,
            problemType: problemType,
            message: message,
            screenshotURL,
            videoURL,
            bankStatementURL,
            createdAt: serverTimestamp(),
            status: 'pending',
        });

        toast({ title: 'Report Submitted', description: 'We will review your issue shortly.' });
        router.push('/my/report-status');

    } catch (error) {
        console.error("Error submitting report:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'An error occurred. Please try again.'});
    } finally {
        setIsSubmitting(false);
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
                    <span>{order?.createdAt.toDate().toLocaleString()}</span>
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
