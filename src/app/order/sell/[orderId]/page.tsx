

'use client';

import React, { useMemo, Suspense, useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Copy, Clock, CheckCircle, Hourglass, XCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/utils';
import Image from 'next/image';

type MatchedBuyOrder = {
    order_id: string; // This is the user-facing buyer order ID
    amount: number;
    status: 'pending_payment' | 'pending_confirmation' | 'in_applied' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    buyer_id: string;
    utr?: string;
    screenshot_url?: string;
};

type SellOrder = {
    id: string;
    order_id: string;
    amount: number;
    remaining_amount: number;
    status: 'pending' | 'partially_filled' | 'completed' | 'failed' | 'processing';
    created_at: string;
    matched_buy_orders?: MatchedBuyOrder[];
};

const statusConfig: { [key: string]: { style: string; text: string; icon: React.ElementType } } = {
  // SellOrder statuses
  pending: { style: 'bg-green-100 text-green-800', text: 'Active', icon: CheckCircle },
  partially_filled: { style: 'bg-yellow-100 text-yellow-800', text: 'Partially Filled', icon: Hourglass },
  processing: { style: 'bg-blue-100 text-blue-800', text: 'Processing', icon: Loader },
  completed: { style: 'bg-green-500 text-white', text: 'Completed', icon: CheckCircle },
  failed: { style: 'bg-red-100 text-red-800', text: 'Failed', icon: XCircle },

  // MatchedBuyOrder statuses
  pending_payment: { style: 'bg-yellow-100 text-yellow-800', text: 'Awaiting Payment', icon: Clock },
  pending_confirmation: { style: 'bg-blue-100 text-blue-800', text: 'Confirmation', icon: Hourglass },
  in_applied: { style: 'bg-orange-100 text-orange-800', text: 'In Review', icon: AlertTriangle },
  cancelled: { style: 'bg-red-100 text-red-800', text: 'Cancelled', icon: XCircle },
};

const MatchedOrderCard = ({ order }: { order: MatchedBuyOrder }) => {
  const getStatusConfig = (status: MatchedBuyOrder['status']) => {
      if (status === 'completed') {
          return { style: 'bg-green-100 text-green-800', text: 'Completed', icon: CheckCircle };
      }
      return statusConfig[status] || { style: "bg-gray-100 text-gray-800", text: status.replace(/_/g, ' '), icon: AlertTriangle };
  }
  const currentStatus = getStatusConfig(order.status);
  const { toast } = useToast();
  
  const copyToClipboard = (text: string | undefined, label: string) => {
    if(!text) return;
    navigator.clipboard.writeText(text).then(() => toast({ title: `${label} Copied!` }));
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="rounded px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800">
            Matched Buyer
          </span>
          <div className={cn("flex items-center gap-1.5 font-semibold text-sm capitalize", currentStatus.style, "px-2 py-1 rounded-md")}>
            <currentStatus.icon className={cn("h-3.5 w-3.5", currentStatus.text === 'Processing' && 'animate-spin')} />
            <span>{currentStatus.text}</span>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">₹{order.amount.toFixed(2)}</span>
              <Copy className="h-3 w-3 text-gray-400 cursor-pointer" onClick={() => copyToClipboard(order.amount.toFixed(2), 'Amount')} />
            </div>
          </div>
          {order.utr && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-muted-foreground shrink-0">UTR</span>
              <div className="flex items-center gap-2 text-right">
                <span className="font-mono text-muted-foreground break-all">{order.utr}</span>
                <Copy className="h-3 w-3 text-gray-400 cursor-pointer flex-shrink-0" onClick={() => copyToClipboard(order.utr, 'UTR')} />
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Time</span>
            <span className="font-mono text-muted-foreground text-xs">{new Date(order.created_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground shrink-0">Buyer Order ID</span>
             <div className="flex items-center gap-2 text-right">
                <span className="font-mono text-muted-foreground text-xs break-all">{order.order_id?.toUpperCase()}</span>
                <Copy className="h-3 w-3 text-gray-400 cursor-pointer flex-shrink-0" onClick={() => copyToClipboard(order.order_id, 'Order ID')} />
            </div>
          </div>
          {order.screenshot_url && (
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Proof</span>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-primary">View Screenshot</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Payment Proof</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center py-4">
                            <Image
                                src={order.screenshot_url}
                                alt="Payment proof"
                                width={400}
                                height={800}
                                className="max-h-[70vh] w-auto object-contain rounded-md"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


function SellOrderStatusContent() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;
    const { user } = useSupabaseUser();
    const supabase = createClient();
    const { toast } = useToast();

    const [isCancelling, setIsCancelling] = useState(false);
    const [sellOrder, setSellOrder] = useState<SellOrder | null>(null);
    const [sellOrderLoading, setSellOrderLoading] = useState(true);

    useEffect(() => {
        const fetchSellOrder = async () => {
            if (!orderId) {
                setSellOrderLoading(false);
                return;
            };
            setSellOrderLoading(true);
            const numericOrderId = Number(orderId);
            if (isNaN(numericOrderId)) {
                toast({ variant: 'destructive', title: 'Invalid Order ID' });
                setSellOrderLoading(false);
                return;
            }
            const { data, error } = await supabase.from('sell_orders').select('*').eq('id', numericOrderId).single();
            
            if(error || !data) {
                setSellOrder(null);
            } else {
                setSellOrder(data as SellOrder);
            }
            setSellOrderLoading(false);
        }

        fetchSellOrder();

        const numericOrderIdForChannel = Number(orderId);
        if (isNaN(numericOrderIdForChannel)) return;

        const channel = supabase
            .channel(`sell_order_${orderId}`)
            .on<SellOrder>(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'sell_orders', filter: `id=eq.${numericOrderIdForChannel}` },
                (payload) => {
                    setSellOrder(payload.new as SellOrder);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId, supabase, toast]);

    const { activeMatchedOrders, historicalMatchedOrders } = useMemo(() => {
        if (!sellOrder || !sellOrder.matched_buy_orders) {
            return { activeMatchedOrders: [], historicalMatchedOrders: [] };
        }
        const orders = Array.isArray(sellOrder.matched_buy_orders)
            ? [...sellOrder.matched_buy_orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            : [];
        
        const active = orders.filter(o => ['pending_payment', 'pending_confirmation', 'in_applied'].includes(o.status));
        const historical = orders.filter(o => ['completed', 'failed', 'cancelled'].includes(o.status));

        return { activeMatchedOrders: active, historicalMatchedOrders: historical };
    }, [sellOrder]);
    
    const handleCancelRemaining = useCallback(async () => {
        if (!sellOrder || !user || sellOrder.remaining_amount <= 0) {
            toast({ variant: 'destructive', title: 'Cannot cancel', description: 'No remaining amount to cancel.' });
            return;
        }
    
        setIsCancelling(true);
    
        try {
            const numericOrderId = Number(sellOrder.id);
            if (isNaN(numericOrderId)) {
                throw new Error("Invalid Sell Order ID for cancellation.");
            }
            const { error } = await supabase.rpc('cancel_remaining_sell_order', {
                p_order_id: numericOrderId,
                p_user_id: user.id
            });

            if (error) throw error;
    
            toast({ title: 'Order Updated', description: 'The remaining amount has been cancelled and refunded.' });
        } catch (error: any) {
            console.error("Failed to cancel remaining order:", error);
            toast({ variant: 'destructive', title: 'Cancellation Failed', description: error.message });
        } finally {
            setIsCancelling(false);
        }
    }, [sellOrder, user, supabase, toast]);

    const loading = sellOrderLoading;
    
    const amount = sellOrder?.amount || 0;
    const remainingAmount = sellOrder?.remaining_amount ?? amount;
    const progress = amount > 0 ? ((amount - remainingAmount) / amount) * 100 : 0;
    
    const currentStatus = sellOrder ? statusConfig[sellOrder.status] : null;

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }
    
    if (!sellOrder) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <h1 className="text-xl font-bold">Sell Order not found.</h1>
                <Button asChild className="mt-4">
                    <Link href="/order">Go to Orders</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex items-center justify-between p-4 bg-white sticky top-0 z-10 border-b">
                <Button asChild onClick={() => router.back()} variant="ghost" size="icon" className="h-8 w-8">
                     <ChevronLeft className="h-6 w-6 text-muted-foreground" />
                </Button>
                <h1 className="text-xl font-bold">Sell Order Status</h1>
                {sellOrder && sellOrder.remaining_amount > 0 && !['completed', 'failed'].includes(sellOrder.status) ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isCancelling}>
                                Cancel
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Unmatched Amount?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will cancel the unfilled part of your sell order (₹{sellOrder.remaining_amount.toFixed(2)}) and refund it to your wallet. Matched orders will not be affected.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancelRemaining} disabled={isCancelling} className="bg-destructive hover:bg-destructive/90">
                                    {isCancelling ? <Loader size="xs" /> : "Confirm"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : <div className="w-16"></div>}
            </header>

            <main className="flex-grow p-4 space-y-6">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle>Sell Order Progress</CardTitle>
                             {currentStatus && <div className={cn("flex items-center gap-1.5 font-semibold text-sm capitalize", currentStatus.style, "px-2 py-1 rounded-md")}>
                                <currentStatus.icon className={cn("h-3.5 w-3.5", sellOrder.status === 'processing' && 'animate-spin')} />
                                <span>{currentStatus.text}</span>
                             </div>}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Sell Amount</p>
                            <p className="text-4xl font-bold text-primary">₹{(sellOrder.amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                            <Progress value={progress} className="h-3" />
                            <div className="flex justify-between mt-2 text-sm font-medium">
                                <span>Filled: ₹{(amount - remainingAmount).toFixed(2)}</span>
                                <span>Remaining: ₹{remainingAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Matched Buyers</CardTitle>
                        <CardDescription>Buyers who are currently paying for your order.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeMatchedOrders && activeMatchedOrders.length > 0 ? (
                            <div className="space-y-3">
                                {activeMatchedOrders.map(buyOrder => (
                                    <MatchedOrderCard key={buyOrder.order_id} order={buyOrder} />
                                ))}
                            </div>
                        ) : (
                             <p className="text-center text-muted-foreground py-4">No active buyers matched yet.</p>
                        )}
                    </CardContent>
                </Card>

                {historicalMatchedOrders && historicalMatchedOrders.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>Completed or failed matches for this sell order.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {historicalMatchedOrders.map(buyOrder => (
                                    <MatchedOrderCard key={buyOrder.order_id} order={buyOrder} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}

export default function SellOrderStatusPage() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
            <Loader size="md"/>
        </div>
    }>
      <SellOrderStatusContent />
    </Suspense>
  );
}

    