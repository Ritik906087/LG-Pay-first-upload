

'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useUser, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle, FileClock, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader } from '@/components/ui/loader';

type Order = {
    id: string;
    orderId: string;
    amount: number;
    status: string;
    utr: string;
    screenshotURL: string;
    submittedAt: Timestamp;
    cancellationReason?: string;
    rejectionReason?: string;
    paymentType?: 'bank' | 'upi' | 'usdt' | 'p2p_upi';
    matchedSellOrderPath?: string;
};

const formatTime = (seconds: number) => {
    if (seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

function OrderStatusContent() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const orderId = params.orderId as string;
    const { user } = useUser();
    const firestore = useFirestore();

    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const orderRef = useMemo(() => {
        if (!firestore || !user || !orderId) return null;
        return doc(firestore, 'users', user.uid, 'orders', orderId);
    }, [firestore, user, orderId]);

    const { data: order, loading: orderLoading } = useDoc<Order>(orderRef);

    const handleOrderExpiry = async () => {
        if (!order || !orderRef || order.status !== 'pending_confirmation' || !firestore) return;
    
        const currentOrderSnap = await getDoc(orderRef);
        if (currentOrderSnap.exists() && currentOrderSnap.data().status !== 'pending_confirmation') {
            return;
        }

        setIsUpdatingStatus(true);
        try {
            await runTransaction(firestore, async (transaction) => {
                const buyOrderDoc = await transaction.get(orderRef);
                if (!buyOrderDoc.exists()) throw new Error("Buy order not found.");
                const buyOrderData = buyOrderDoc.data() as Order;
    
                if (buyOrderData.paymentType === 'p2p_upi' && buyOrderData.matchedSellOrderPath) {
                    const sellOrderRef = doc(firestore, buyOrderData.matchedSellOrderPath);
                    const sellOrderDoc = await transaction.get(sellOrderRef);
    
                    if (sellOrderDoc.exists()) {
                        const sellOrderData = sellOrderDoc.data();
                        
                        const newRemainingAmount = (sellOrderData.remainingAmount || 0) + buyOrderData.amount;
                        
                        let newSellOrderStatus = 'partially_filled';
                        if (newRemainingAmount >= sellOrderData.amount) {
                             newSellOrderStatus = 'pending';
                        }
    
                        const updatedMatchedBuyOrders = (sellOrderData.matchedBuyOrders || []).map((bo: any) => 
                            bo.buyOrderId === order.id ? { ...bo, status: 'failed' } : bo
                        );
    
                        transaction.update(sellOrderRef, {
                            remainingAmount: newRemainingAmount,
                            status: newSellOrderStatus,
                            matchedBuyOrders: updatedMatchedBuyOrders
                        });
                    }
                }
    
                transaction.update(orderRef, {
                    status: 'failed',
                    rejectionReason: 'Order review timed out.',
                });
            });
            
            toast({
                variant: 'destructive',
                title: 'Order Failed',
                description: 'The order was not reviewed in time.',
            });
            setTimeout(() => router.push('/home'), 1000);
    
        } catch (error) {
            console.error("Order expiry error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update the order status.' });
            setIsUpdatingStatus(false);
        }
    };
    
    useEffect(() => {
        if (!order || order.status !== 'pending_confirmation' || !order.submittedAt) {
            if (order && order.status !== 'pending_confirmation') {
                setTimeLeft(0);
            }
            return;
        }

        const submittedTime = order.submittedAt.toDate();
        const expiryTime = new Date(submittedTime.getTime() + 30 * 60 * 1000); // 30 minutes from submission

        const interval = setInterval(() => {
            const now = new Date();
            const secondsLeft = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);
            
            if (secondsLeft <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
                handleOrderExpiry();
            } else {
                setTimeLeft(secondsLeft);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [order]);
    

    if (orderLoading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <h1 className="text-xl font-bold">Order not found.</h1>
                <Button asChild className="mt-4">
                    <Link href="/home">Go Home</Link>
                </Button>
            </div>
        )
    }
    
    const isTimeout = order.status === 'failed' && order.rejectionReason && (order.rejectionReason.includes('expired') || order.rejectionReason.includes('timed out'));

    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex items-center p-4 bg-white sticky top-0 z-10 border-b">
                <Button asChild onClick={() => router.push('/home')} variant="ghost" size="icon" className="h-8 w-8">
                     <ChevronLeft className="h-6 w-6 text-muted-foreground" />
                </Button>
                <h1 className="text-xl font-bold mx-auto pr-8">Order Status</h1>
            </header>

            <main className="flex-grow p-4 space-y-6">
                <Card className="text-center overflow-hidden">
                    <CardContent className="p-6 space-y-3 flex flex-col items-center">
                        {order.status === 'completed' ? (
                            <>
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <h2 className="text-2xl font-bold text-green-600">Order Completed</h2>
                                <p className="text-muted-foreground">₹{order.amount.toFixed(2)} has been added to your balance.</p>
                            </>
                        ) : order.status === 'pending_confirmation' ? (
                            <>
                                <FileClock className="h-16 w-16 text-green-600" />
                                <h2 className="text-2xl font-bold text-green-600">Confirmation</h2>
                                <p className="text-muted-foreground">Your payment is under review.</p>
                            </>
                        ) : (
                            <>
                                {isTimeout ? (
                                    <AlertTriangle className="h-16 w-16 text-orange-500" />
                                ) : (
                                    <XCircle className="h-16 w-16 text-destructive" />
                                )}
                                <h2 className={cn("text-2xl font-bold capitalize", isTimeout ? "text-orange-600" : "text-destructive")}>
                                    {isTimeout ? 'Timeout' : order.status.replace('_', ' ')}
                                </h2>
                                <p className="text-muted-foreground">
                                    {isTimeout ? "This order has expired." : "This order could not be completed."}
                                </p>
                            </>
                        )}
                        
                    </CardContent>
                    <CardFooter className={cn("p-4", order.status === 'pending_confirmation' ? 'bg-green-100' : 'bg-primary/10')}>
                         <div className="w-full text-center">
                            {order.status === 'pending_confirmation' ? (
                                <>
                                    <p className="text-sm text-green-800 font-semibold">Estimated time remaining</p>
                                    <div className="text-3xl font-mono font-bold text-green-600">
                                        {timeLeft !== null ? formatTime(timeLeft) : <Loader size="md" className="inline-block"/>}
                                    </div>
                                </>
                            ) : order.status === 'completed' ? (
                                 <p className="w-full text-center text-sm text-green-600 font-semibold">Processed successfully!</p>
                            ) : (
                                <p className={cn("w-full text-center text-sm font-semibold", isTimeout ? "text-orange-600" : "text-destructive")}>
                                    This order is no longer active.
                                </p>
                            )}
                         </div>
                    </CardFooter>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="font-semibold">₹{order.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Order ID</span>
                            <span className="font-mono text-xs break-all">{order.orderId}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">{order.paymentType === 'usdt' ? 'TxHash' : 'UTR'}</span>
                            <span className="font-mono break-all">{order.utr}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status</span>
                            <span className={cn("font-semibold capitalize", isTimeout ? "text-orange-600" : "")}>
                                {isUpdatingStatus ? 'Updating...' : (isTimeout ? 'Timeout' : order.status.replace('_', ' '))}
                            </span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Screenshot</span>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="link" className="p-0 h-auto text-primary" disabled={!order.screenshotURL}>View</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Payment Proof</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex justify-center py-4">
                                        <img
                                            src={order.screenshotURL}
                                            alt="Payment proof"
                                            className="max-h-[70vh] w-auto object-contain rounded-md"
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
                 <Button onClick={() => router.push('/home')} className="w-full h-12 btn-gradient font-bold">
                    Back to Home
                </Button>
            </main>
        </div>
    );
}

export default function OrderStatusPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader size="md"/>
            </div>
        }>
            <OrderStatusContent />
        </Suspense>
    );
}
