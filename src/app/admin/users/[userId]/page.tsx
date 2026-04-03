

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { Wallet, ChevronLeft, Copy, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader } from '@/components/ui/loader';
import { createClient } from '@/lib/utils';

const defaultAvatarUrl = "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224703_814.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDcwM184MTQuanBnIiwiaWF0IjoxNzc1MTUwMzMxLCJleHAiOjE4MDY2ODYzMzF9.o5z7uxui9h2o-GVKG9znk4TKBAoK4WMsLKY6NPZ8_1o";

const paymentMethodDetails: { [key: string]: { logo: string; bgColor: string } } = {
  PhonePe: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(4).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDQpLnBuZyIsImlhdCI6MTc3NTE0ODYyMSwiZXhwIjoxODA2Njg0NjIxfQ.b_cMHhiCw52krGt2edtt1k5C1Keo8uGJwYIWpe6vZVo", bgColor: "bg-violet-600" },
  Paytm: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(5).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDUpLnBuZyIsImlhdCI6MTc3NTE0ODYzMiwiZXhwIjoxODA2Njg0NjMyfQ.QXSbgSLV3ULTcV3ss9Co9ZMe1oj3tb9bR_OP8xY-Nds", bgColor: "bg-sky-500" },
  MobiKwik: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDEpLnBuZyIsImlhdCI6MTc3NTE0ODU3MywiZXhwIjoxODA2Njg0NTczfQ.m8Z7gn5FV-0ss58kTEUZ833u8Wv_bFun3YZeZtyIa9s", bgColor: "bg-blue-600" },
  Freecharge: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(3).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDMpLnBuZyIsImlhdCI6MTc3NTE0ODYwOSwiZXhwIjoxODA2Njg0NjA5fQ.pus8pOlgEXCFb2pjIzNsVtU9DxnIxEeaVaeR3TuIQPc", bgColor: "bg-orange-500" },
  Airtel: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(2).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDIpLnBuZyIsImlhdCI6MTc3NTE0ODU5OSwiZXhwIjoxODA2Njg0NTk5fQ.yDb5CBUsF_MCejlDIzrQVjg6IMylJbAzEmHFaozfNjE", bgColor: "bg-red-500" },
};

type UserProfile = {
    id: string;
    display_name: string;
    numeric_id: string;
    balance: number;
    hold_balance: number;
    email?: string;
    phone_number?: string;
    photo_url?: string;
    payment_methods?: { name: string; upiId: string }[];
};

type Order = {
  id: string;
  amount: number;
  status: 'pending_payment' | 'processing' | 'completed' | 'cancelled' | 'failed';
  utr?: string;
  screenshot_url?: string;
  created_at: string;
};

type SellOrder = {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  utr?: string;
  withdrawal_method: { name: string, upiId: string };
  created_at: string;
  completed_at?: string;
};


const BalanceActionDialog = ({ userId, currentBalance }: { userId: string, currentBalance: number }) => {
    const [amount, setAmount] = useState('');
    const [action, setAction] = useState<'add' | 'deduct'>('add');
    const [open, setOpen] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();

    const handleUpdateBalance = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount' });
            return;
        }

        const newBalance = action === 'add' ? Number(currentBalance) + value : Number(currentBalance) - value;

        if (newBalance < 0) {
            toast({ variant: 'destructive', title: 'Insufficient Balance' });
            return;
        }

        const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
        if (error) {
            console.error("Balance update error: ", error)
            toast({ variant: 'destructive', title: 'Update Failed' });
        } else {
            toast({ title: 'Balance Updated' });
            setOpen(false);
            setAmount('');
        }
    };


    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Manage Balance</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update User Balance</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                     <div className="flex items-center gap-4">
                        <Label>Action</Label>
                        <Button variant={action === 'add' ? 'default' : 'outline'} onClick={() => setAction('add')}>Add</Button>
                        <Button variant={action === 'deduct' ? 'default' : 'outline'} onClick={() => setAction('deduct')}>Deduct</Button>
                    </div>
                    <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 100" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateBalance}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const HoldBalanceActionDialog = ({ userId }: { userId: string }) => {
    const [amount, setAmount] = useState('');
    const [action, setAction] = useState<'add' | 'remove'>('add');
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();
    const [currentBalance, setCurrentBalance] = useState(0);
    const [currentHoldBalance, setCurrentHoldBalance] = useState(0);

    const fetchBalances = async () => {
        const { data, error } = await supabase.from('users').select('balance, hold_balance').eq('id', userId).single();
        if (data) {
            setCurrentBalance(data.balance || 0);
            setCurrentHoldBalance(data.hold_balance || 0);
        }
    }

    const handleUpdateHoldBalance = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount' });
            return;
        }

        setIsLoading(true);

        try {
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('balance, hold_balance')
                .eq('id', userId)
                .single();

            if (fetchError || !userData) {
                throw new Error(fetchError?.message || "Could not find user to update.");
            }
            
            let newBalance = userData.balance;
            let newHoldBalance = userData.hold_balance;

            if (action === 'add') {
                if (newBalance < value) {
                    toast({ variant: 'destructive', title: 'Insufficient Balance', description: "User's main balance is not sufficient." });
                    setIsLoading(false);
                    return;
                }
                newBalance -= value;
                newHoldBalance += value;
            } else { // remove
                if (newHoldBalance < value) {
                    toast({ variant: 'destructive', title: 'Insufficient Hold Balance', description: "User's hold balance is not sufficient." });
                    setIsLoading(false);
                    return;
                }
                newBalance += value;
                newHoldBalance -= value;
            }

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    balance: newBalance,
                    hold_balance: newHoldBalance
                })
                .eq('id', userId);
            
            if (updateError) {
                throw updateError;
            }
            
            toast({ title: 'Hold Balance Updated' });
            setOpen(false);
            setAmount('');
        } catch (error: any) {
            console.error("Hold balance update error: ", error);
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <Dialog open={open} onOpenChange={(isOpen) => {setOpen(isOpen); if(isOpen) fetchBalances();}}>
            <DialogTrigger asChild>
                <Button>Manage Hold</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Hold Balance</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">Current Main Balance: <span className="font-bold text-foreground">{(currentBalance || 0).toFixed(2)}</span></p>
                    <p className="text-sm text-muted-foreground">Current Hold Balance: <span className="font-bold text-foreground">{(currentHoldBalance || 0).toFixed(2)}</span></p>
                     <div className="flex items-center gap-4">
                        <Label>Action</Label>
                        <Button variant={action === 'add' ? 'default' : 'outline'} onClick={() => setAction('add')}>Add to Hold</Button>
                        <Button variant={action === 'remove' ? 'default' : 'outline'} onClick={() => setAction('remove')}>Remove from Hold</Button>
                    </div>
                    <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 100" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleUpdateHoldBalance} disabled={isLoading}>
                         {isLoading && <Loader size="xs" className="mr-2" />}
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function UserDetailsPage() {
    const params = useParams();
    const userId = params.userId as string;
    const supabase = createClient();
    const { toast } = useToast();
    
    const [isMasterAdmin, setIsMasterAdmin] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [sellOrders, setSellOrders] = useState<SellOrder[]>([]);
    const [l1Agents, setL1Agents] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const masterAdminPhones = ['9060873927', '7050396570'];
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        }
        const adminPhone = getCookie('admin-phone');
        if (adminPhone && masterAdminPhones.includes(adminPhone)) {
            setIsMasterAdmin(true);
        }
    }, []);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [userRes, ordersRes, sellOrdersRes, l1AgentsRes] = await Promise.all([
                    supabase.from('users').select('*').eq('id', userId).single(),
                    supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                    supabase.from('sell_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                    supabase.from('users').select('*').eq('inviter_uid', userId)
                ]);

                if (userRes.error) throw userRes.error;
                setUser(userRes.data as UserProfile);

                if (ordersRes.error) console.error("Error fetching orders:", ordersRes.error);
                else setOrders(ordersRes.data as Order[]);

                if (sellOrdersRes.error) console.error("Error fetching sell orders:", sellOrdersRes.error);
                else setSellOrders(sellOrdersRes.data as SellOrder[]);

                if (l1AgentsRes.error) console.error("Error fetching L1 agents:", l1AgentsRes.error);
                else setL1Agents(l1AgentsRes.data as UserProfile[]);

            } catch (err: any) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, supabase]);
    
    const stats = React.useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
        const completedBuyOrders = orders?.filter(o => o.status === 'completed') || [];
        const completedSellOrders = sellOrders?.filter(o => o.status === 'completed') || [];
    
        // Total stats
        const totalBuyAmount = completedBuyOrders.reduce((acc, order) => acc + order.amount, 0);
        const totalBuyCount = completedBuyOrders.length;
        const totalSellAmount = completedSellOrders.reduce((acc, order) => acc + order.amount, 0);
        const totalSellCount = completedSellOrders.length;
    
        // Today's stats
        const todayBuyOrders = completedBuyOrders.filter(o => o.created_at && new Date(o.created_at) >= startOfToday);
        const todayBuyAmount = todayBuyOrders.reduce((acc, order) => acc + order.amount, 0);
        const todayBuyCount = todayBuyOrders.length;
    
        const todaySellOrders = completedSellOrders.filter(o => o.completed_at && new Date(o.completed_at) >= startOfToday);
        const todaySellAmount = todaySellOrders.reduce((acc, order) => acc + order.amount, 0);
        const todaySellCount = todaySellOrders.length;
    
        return { totalBuyAmount, totalBuyCount, totalSellAmount, totalSellCount, todayBuyAmount, todayBuyCount, todaySellAmount, todaySellCount };
    }, [orders, sellOrders]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
          toast({ title: 'UID Copied!' });
        });
    };

    const copyUpiToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
          toast({ title: 'UPI ID Copied!' });
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Skeleton className="h-24 w-full" />
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (error || !user) {
        return (
             <div className="p-8">
                <Card className="bg-destructive/10">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                        <CardDescription className="text-destructive/80">
                            Could not load user data.
                        </CardDescription>
                    </CardHeader>
                </Card>
             </div>
        )
    }


    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/admin/dashboard">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">User Details</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Profile Card */}
                <Card>
                    <CardHeader className="flex flex-col items-center text-center">
                         <Avatar className="h-24 w-24 border-4 border-primary/20">
                            <AvatarImage src={defaultAvatarUrl} alt={user.display_name} />
                            <AvatarFallback className="text-3xl bg-muted">
                                {user.display_name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl mt-4">{user.display_name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer" onClick={() => copyToClipboard(user.numeric_id)}>
                            <span>UID: {user.numeric_id}</span>
                            <Copy className="h-3 w-3" />
                        </div>
                        <p className="text-sm text-muted-foreground">{user.phone_number || 'No phone number'}</p>
                    </CardHeader>
                </Card>

                {/* Balance Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold">{(Number(user.balance) || 0).toFixed(2)} <span className="text-lg text-muted-foreground">LGB</span></div>
                        <p className="text-sm text-muted-foreground">This is the user's available balance for transactions.</p>
                    </CardContent>
                    <CardFooter>
                         {isMasterAdmin ? (
                            <BalanceActionDialog userId={userId} currentBalance={Number(user.balance) || 0} />
                         ) : (
                            <Button disabled>Manage Balance (Master only)</Button>
                         )}
                    </CardFooter>
                </Card>
                
                {/* Hold Balance Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hold Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold">{(Number(user.hold_balance) || 0).toFixed(2)} <span className="text-lg text-muted-foreground">LGB</span></div>
                         <p className="text-sm text-muted-foreground">This balance is frozen and cannot be used by the user.</p>
                    </CardContent>
                    <CardFooter>
                         {isMasterAdmin ? (
                            <HoldBalanceActionDialog userId={userId} />
                         ) : (
                            <Button disabled>Manage Hold (Master only)</Button>
                         )}
                    </CardFooter>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invite Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 rounded-lg bg-purple-100 p-4">
                        <div className="rounded-full bg-purple-200 p-3">
                            <Users className="h-6 w-6 text-purple-700" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-purple-800">Invited Users</p>
                            {loading ? <Skeleton className="h-6 w-10 mt-1" /> : <p className="text-2xl font-bold text-purple-900">{l1Agents?.length || 0}</p>}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline">
                        <Link href={`/admin/invites/${userId}`}>View Invites</Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Linked UPIs Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Linked UPI Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    {user.payment_methods && user.payment_methods.length > 0 ? (
                        <div className="space-y-3">
                            {user.payment_methods.map((method) => {
                                const details = paymentMethodDetails[method.name];
                                if (!details) return null;
                                return (
                                    <div
                                        key={method.name}
                                        className={`flex items-center justify-between gap-4 rounded-xl p-3 text-white shadow-md ${details?.bgColor || 'bg-gray-500'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {details && (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1">
                                                    <Image
                                                        src={details.logo}
                                                        alt={`${method.name} logo`}
                                                        width={32}
                                                        height={32}
                                                        className="object-contain"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-grow">
                                                <span className="text-base font-semibold">{method.name}</span>
                                                <p className="text-xs font-mono text-white/80">{method.upiId}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center justify-center rounded-md bg-green-500/80 px-2 py-1 text-[10px] font-bold uppercase text-white">
                                                ACTIVATED
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                                                onClick={() => copyUpiToClipboard(method.upiId || '')}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-24 text-center text-muted-foreground">
                            <Wallet className="h-8 w-8 opacity-50 mb-2" />
                            <p>No UPI accounts linked.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* User Stats Card */}
            <Card>
                <CardHeader>
                    <CardTitle>User Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                    <div className="rounded-lg bg-blue-100 p-3">
                        <p className="text-sm font-medium text-blue-800">Total Buy</p>
                        <p className="text-2xl font-bold text-blue-900">₹{stats.totalBuyAmount.toFixed(2)}</p>
                        <p className="text-xs text-blue-800">{stats.totalBuyCount} orders</p>
                    </div>
                    <div className="rounded-lg bg-green-100 p-3">
                        <p className="text-sm font-medium text-green-800">Total Sell</p>
                        <p className="text-2xl font-bold text-green-900">₹{stats.totalSellAmount.toFixed(2)}</p>
                        <p className="text-xs text-green-800">{stats.totalSellCount} orders</p>
                    </div>
                    <div className="rounded-lg bg-blue-100 p-3">
                        <p className="text-sm font-medium text-blue-800">Today's Buy</p>
                        <p className="text-2xl font-bold text-blue-900">₹{stats.todayBuyAmount.toFixed(2)}</p>
                        <p className="text-xs text-blue-800">{stats.todayBuyCount} orders</p>
                    </div>
                    <div className="rounded-lg bg-green-100 p-3">
                        <p className="text-sm font-medium text-green-800">Today's Sell</p>
                        <p className="text-2xl font-bold text-green-900">₹{stats.todaySellAmount.toFixed(2)}</p>
                        <p className="text-xs text-green-800">{stats.todaySellCount} orders</p>
                    </div>
                </CardContent>
            </Card>

            {/* Buy Order History */}
            <Card>
                <CardHeader>
                    <CardTitle>Buy Order History</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>UTR</TableHead>
                                <TableHead>Screenshot</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Loading orders...
                                    </TableCell>
                                </TableRow>
                            ) : orders && orders.length > 0 ? orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">₹{order.amount.toFixed(2)}</TableCell>
                                    <TableCell className="capitalize">{order.status.replace('_', ' ')}</TableCell>
                                    <TableCell>{order.utr || 'N/A'}</TableCell>
                                    <TableCell>
                                        {order.screenshot_url ? (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="link" className="p-0 h-auto text-primary">View</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Payment Proof</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="flex justify-center py-4">
                                                        <img
                                                            src={order.screenshot_url}
                                                            alt="Payment proof"
                                                            className="max-h-[70vh] w-auto object-contain rounded-md"
                                                        />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        ): 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">{new Date(order.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No buy orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             {/* Sell Order History */}
            <Card>
                <CardHeader>
                    <CardTitle>Sell Order History</CardTitle>
                    <CardDescription>
                       Successful: {sellOrders?.filter(o => o.status === 'completed').length || 0} | Failed/Cancelled: {sellOrders?.filter(o => o.status === 'failed').length || 0}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>To UPI</TableHead>
                                <TableHead>UTR</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Loading sell orders...
                                    </TableCell>
                                </TableRow>
                            ) : sellOrders && sellOrders.length > 0 ? sellOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">₹{order.amount.toFixed(2)}</TableCell>
                                    <TableCell className="capitalize">{order.status}</TableCell>
                                    <TableCell className="text-xs">{order.withdrawal_method.name} ({order.withdrawal_method.upiId})</TableCell>
                                    <TableCell>{order.utr || 'N/A'}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">{new Date(order.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No sell orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    )
}
