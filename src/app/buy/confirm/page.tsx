
'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Copy, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const bankDetails = {
    'Bank Name': 'LG Pay Corporate',
    'Account Holder': 'LG Services India Pvt Ltd',
    'Account Number': '01234567890',
    'IFSC Code': 'LGPAY000001'
};

const upiDetails = {
    'Recipient Name': 'LG Pay Services',
    'UPI ID': 'lgpay-corporate@okaxis'
};

function PaymentDetailsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const amount = searchParams.get('amount');
    const type = searchParams.get('type');
    const provider = searchParams.get('provider');

    const details = type === 'bank' ? bankDetails : upiDetails;
    const isUpi = type === 'upi';

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: 'Copied to clipboard!' });
        });
    };

    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex items-center p-4 bg-white sticky top-0 z-10 border-b">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft className="h-6 w-6 text-muted-foreground" />
                </Button>
                <h1 className="text-xl font-bold mx-auto pr-8">Confirm Payment</h1>
            </header>

            <main className="flex-grow p-4 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{isUpi ? `Pay with ${provider}` : 'Bank Transfer'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        {Object.entries(details).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                                <span className="text-muted-foreground">{key}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{value}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(value)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 space-y-4">
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-sm">Amount to be paid</span>
                            <span className="font-bold text-2xl text-primary">₹{amount}</span>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="utr">UTR / Reference Number</Label>
                            <Input id="utr" placeholder="Enter 12-digit UTR number" />
                        </div>
                        <div className="space-y-2">
                            <Label>Upload Screenshot</Label>
                             <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-dashed">
                                <Upload className="h-4 w-4"/>
                                Click to upload payment proof
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>

            <footer className="p-4 grid grid-cols-2 gap-4 bg-white border-t sticky bottom-0">
                <Button onClick={() => router.push('/home')} variant="destructive" className="h-12 text-base font-bold bg-red-500 hover:bg-red-600 text-white">CANCEL</Button>
                <Button className="h-12 text-base font-bold bg-green-500 hover:bg-green-600 text-white">CONFIRM</Button>
            </footer>
        </div>
    );
}


export default function ConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentDetailsContent />
    </Suspense>
  )
}
