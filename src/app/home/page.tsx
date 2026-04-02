

'use client';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Autoplay from "embla-carousel-autoplay";
import React, { useEffect, useState, useCallback } from 'react';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';


const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <Card className={cn("border bg-white rounded-2xl shadow-sm", className)}>
    {children}
  </Card>
);

const faqs = [
    {
        question: "1. How to sell LG?",
        answer: "You can sell LG directly from the app. Go to the 'Sell' section and follow the instructions."
    },
    {
        question: "2. How to withdraw to bank account?",
        answer: "To withdraw funds, link your bank account in the 'My' section and then use the 'Withdraw' option."
    },
    {
        question: "3. How to withdraw LG to game account?",
        answer: "This feature is coming soon. Stay tuned for updates."
    },
    {
        question: "4. Sell order has been completed, but have not received funds to UPI account",
        answer: "Please allow up to 24 hours for the funds to reflect in your UPI account. If it takes longer, contact support."
    },
    {
        question: "5. How to Real-name verification?",
        answer: "You can complete your real-name verification in the 'My' section under 'Profile'."
    },
    {
        question: "6. When will the withdrawal be successful?",
        answer: "Withdrawals are usually processed within a few hours, but can sometimes take up to 48 hours."
    },
    {
        question: "7. How to deactivate LG Pay wallet?",
        answer: "To deactivate your wallet, please contact our customer support team through the 'Support' option."
    },
    {
        question: "8. How to change phone number?",
        answer: "For security reasons, you need to contact customer support to change your registered phone number."
    },
    {
        question: "9. I forgot my payment password",
        answer: "You can reset your payment password from the login screen using the 'Forgot Password' option."
    },
    {
        question: "10. How to add UPI ID?",
        answer: "You can add or manage your UPI IDs in the 'My' section under 'Payment Methods'."
    }
]

const Countdown = ({ expiryTimestamp, onExpire }: { expiryTimestamp: Date, onExpire?: () => void }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const expiryTime = expiryTimestamp.getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = expiryTime - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("Expired");
                if (!isExpired) {
                    onExpire?.();
                    setIsExpired(true);
                }
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [expiryTimestamp, onExpire, isExpired]);

    if (!timeLeft || timeLeft === "Expired") return null;

    return (
        <div className={cn(
            "flex items-center gap-1 text-xs font-mono",
            "text-yellow-600"
        )}>
            <Clock className="h-3 w-3" />
            <span>{timeLeft}</span>
        </div>
    );
};


const InProgressOrderCard = ({ order, onExpire }: { order: any, onExpire: (orderId: string, type: 'buy' | 'sell', currentStatus: string) => void }) => {
    const isBuy = order.type === 'buy';
    const isSell = order.type === 'sell';
    
    let buttonText = "View";
    let buttonLink = "/order";
    let statusText = order.status.replace('_', ' ');
    let expiryTimestamp: Date | undefined;

    const isUSDT = isBuy && order.payment_type === 'usdt';
    const displayAmount = isUSDT ? (order.amount / 110).toFixed(2) : order.amount.toFixed(2);
    const currencySymbol = isUSDT ? '$' : '₹';

    if (isBuy) {
        if (order.status === 'pending_payment') {
            buttonText = "Complete Payment";
            buttonLink = `/buy/confirm/${order.id}?type=${order.payment_type}&provider=${order.payment_provider}`;
            expiryTimestamp = new Date(new Date(order.created_at).getTime() + 10 * 60 * 1000);
        } else if (order.status === 'pending_confirmation') {
            buttonText = "View Order";
            buttonLink = `/order/${order.id}`;
            statusText = "Confirmation";
            if (order.submitted_at) { 
                 expiryTimestamp = new Date(new Date(order.submitted_at).getTime() + 30 * 60 * 1000);
            }
        } else if (order.status === 'in_applied') {
            buttonText = "View Status";
            buttonLink = `/order/${order.id}`;
            statusText = "In Applied";
        }
    } else if (isSell) {
         if (['pending', 'partially_filled', 'processing'].includes(order.status)) {
            buttonText = "View Status";
            buttonLink = `/order/sell/${order.id}`;
            
            switch (order.status) {
                case 'pending':
                    statusText = "Waiting for Buyer";
                    break;
                case 'partially_filled':
                    statusText = "Partially Matched";
                    break;
                case 'processing':
                    statusText = "Fully Matched";
                    break;
                default:
                    statusText = order.status;
            }
        }
    }

    return (
        <Card className="bg-secondary/50">
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow space-y-1">
                        <p className="font-bold text-lg">{currencySymbol}{displayAmount}</p>
                        <div className="flex items-center gap-2">
                             <p className="text-xs text-muted-foreground capitalize">{statusText}</p>
                             {expiryTimestamp ? <Countdown expiryTimestamp={expiryTimestamp} onExpire={() => onExpire(order.id, order.type, order.status)} /> 
                             : order.status === 'in_applied' ? <p className="text-xs text-orange-600 font-semibold">System Busy</p> : null}
                        </div>
                    </div>
                    <Button asChild size="sm" className="font-bold flex-shrink-0">
                        <Link href={buttonLink}>{buttonText}</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


export default function HomePage() {
   const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false, playOnInit: true, stopOnMouseEnter: true })
  );
  
  const { user, profile: userProfile } = useSupabaseUser();
  const supabase = createClient();
  const { toast } = useToast();

  const [inProgressBuyOrders, setInProgressBuyOrders] = useState<any[]>([]);
  const [inProgressSellOrders, setInProgressSellOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const carouselImages = [
    "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224659_961.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDY1OV85NjEuanBnIiwiaWF0IjoxNzc1MTUwMzIyLCJleHAiOjE4MDY2ODYzMjJ9.5jVq9MeL9JaygjjOxYImzTGJHnUndoT3dPRImEX2azc",
    "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224657_783.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDY1N183ODMuanBnIiwiaWF0IjoxNzc1MTUwMzEzLCJleHAiOjE4MDY2ODYzMTN9.hKw47njZN7CISy5mAU2P_0v63JYM1pWQfUhPRKW4h9I",
    "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224656_573.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDY1Nl81NzMuanBnIiwiaWF0IjoxNzc1MTUwMjk4LCJleHAiOjE4MDY2ODYyOTh9.EzQzVoLK0Dnz-hYVXdljOGpT6NJlkUaQ95pzQfOo6io"
  ];
  
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    const [buyRes, sellRes] = await Promise.all([
      supabase.from('orders').select('*').eq('user_id', user.id).in('status', ['pending_payment', 'pending_confirmation', 'in_applied']),
      supabase.from('sell_orders').select('*').eq('user_id', user.id).in('status', ['pending', 'partially_filled', 'processing'])
    ]);
    
    setInProgressBuyOrders(buyRes.data || []);
    setInProgressSellOrders(sellRes.data || []);
    setOrdersLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchOrders();

    const buyOrdersChannel = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user?.id}` }, fetchOrders)
      .subscribe();

    const sellOrdersChannel = supabase.channel('public:sell_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sell_orders', filter: `user_id=eq.${user?.id}` }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(buyOrdersChannel);
      supabase.removeChannel(sellOrdersChannel);
    };
  }, [user, supabase, fetchOrders]);

  const hasInProgressOrders = inProgressBuyOrders.length > 0 || inProgressSellOrders.length > 0;

  const handleOrderExpire = useCallback(async (orderId: string, type: 'buy' | 'sell', status: string) => {
    if (!user) return;

    if (type === 'buy') {
      const { data: currentOrder, error: fetchError } = await supabase.from('orders').select('status').eq('id', orderId).single();
      
      if (fetchError || !currentOrder || currentOrder.status !== status) return;

      if (status === 'pending_payment') {
        await supabase.from('orders').update({
          status: 'failed',
          cancellation_reason: 'Order timed out.',
        }).eq('id', orderId);
        toast({ variant: 'destructive', title: 'Order Timeout' });
      } else if (status === 'pending_confirmation') {
        await supabase.from('orders').update({
          status: 'in_applied',
        }).eq('id', orderId);
        toast({ title: 'Order is now In Applied', description: 'Please wait for admin review.' });
      }
    }
  }, [user, supabase, toast]);


  return (
    <div className="flex flex-col pb-24 text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center gap-2">
            <Image
                src="https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/InShot_20260402_232141775.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSW5TaG90XzIwMjYwNDAyXzIzMjE0MTc3NS5wbmciLCJpYXQiOjE3NzUxNTIzNjcsImV4cCI6MTgwNjY4ODM2N30.Q_kMw_c7VV88g5PSgBRI4ALd73o8lB3G12CD7bsETmw"
                width={32}
                height={32}
                alt="LG Pay Logo"
                className="rounded-full"
            />
            <h1 className="text-xl font-bold text-gradient">LG Pay</h1>
        </div>
        <div className="w-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-grow space-y-6 p-4 pt-2">
        {/* My Total Assets */}
        <GlassCard>
          <CardContent className="p-4">
            <p className="text-sm font-normal text-muted-foreground">
              Total LG Balance
            </p>
            <p className="text-3xl font-bold">{userProfile?.balance?.toFixed(2) || '0.00'} <span className="text-2xl font-medium">LGB</span></p>
          </CardContent>
        </GlassCard>

        {/* Image Carousel */}
        <Carousel 
            className="w-full"
            opts={{ loop: true, align: "start" }}
            plugins={[plugin.current]}
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.play}
        >
          <CarouselContent>
            {carouselImages.map((src, index) => (
              <CarouselItem key={index}>
                <Card className="overflow-hidden rounded-2xl border-none">
                  <Image
                      src={src}
                      alt={`Carousel image ${index + 1}`}
                      width={1536}
                      height={691}
                      className="w-full object-cover"
                    />
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Buy/Sell Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/buy" className="block">
            <Card className="border-none bg-primary/10 shadow-lg h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-primary text-lg">Buy LG</h3>
                  <div className="rounded-md bg-black/5 p-2">
                    <ArrowDownToLine className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/sell" className="block">
            <Card className="border-none bg-green-100 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-green-800 text-lg">Sell LG</h3>
                  <div className="rounded-md bg-black/5 p-2">
                    <ArrowUpFromLine className="h-5 w-5 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        {/* In Progress Orders */}
        <GlassCard>
            {ordersLoading ? (
                <CardContent className="p-4 flex items-center justify-center min-h-[120px]">
                    <Loader size="md" />
                </CardContent>
            ) : hasInProgressOrders ? (
                <Tabs defaultValue="buy">
                    <CardContent className="p-0">
                         <TabsList className="w-full justify-start rounded-none bg-secondary/30 p-0 border-b">
                            <TabsTrigger value="buy" className="flex-1 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none">Buy Orders</TabsTrigger>
                            <TabsTrigger value="sell" className="flex-1 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none">Sell Orders</TabsTrigger>
                        </TabsList>
                        <TabsContent value="buy" className="p-3 space-y-3">
                           {inProgressBuyOrders.length > 0 ? (
                                inProgressBuyOrders.map((order: any) => (
                                    <InProgressOrderCard key={order.id} order={{...order, type: 'buy'}} onExpire={handleOrderExpire} />
                                ))
                           ) : (
                                <p className="text-center text-sm text-muted-foreground py-4">No buy orders in progress.</p>
                           )}
                        </TabsContent>
                         <TabsContent value="sell" className="p-3 space-y-3">
                           {inProgressSellOrders.length > 0 ? (
                                inProgressSellOrders.map((order: any) => (
                                    <InProgressOrderCard key={order.id} order={{...order, type: 'sell'}} onExpire={handleOrderExpire} />
                                ))
                           ) : (
                                <p className="text-center text-sm text-muted-foreground py-4">No sell orders in progress.</p>
                           )}
                        </TabsContent>
                    </CardContent>
                </Tabs>
            ) : (
                <CardContent className="p-4 flex flex-col items-center justify-center text-muted-foreground min-h-[120px]">
                    <History className="h-10 w-10 mb-2 opacity-60" />
                    <p className="text-sm">You have 0 orders in progress</p>
                </CardContent>
            )}
        </GlassCard>

        {/* FAQ Section */}
        <div className="space-y-4">
           <h2 className="text-center text-lg font-semibold">Beginner's questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-none">
                    <GlassCard className="rounded-xl">
                      <AccordionTrigger className="p-4 text-left font-semibold text-foreground hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </GlassCard>
                </AccordionItem>
              ))}
            </Accordion>
        </div>
      </main>
    </div>
  );
}
