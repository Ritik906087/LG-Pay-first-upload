

'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Users, LayoutDashboard, Wallet, Eye, Search, Landmark, Banknote, Trash2, Clock, History, CheckCircle, Download, XCircle, MessageSquare, Send, Paperclip, X, FileClock, AlertCircle, FileWarning, MessageCircleQuestion, Video, Image as ImageIcon, Loader2, RefreshCw, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Loader } from '@/components/ui/loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/utils';


const defaultAvatarUrl = "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224703_814.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDcwM184MTQuanBnIiwiaWF0IjoxNzc1MTUwMzMxLCJleHAiOjE4MDY2ODYzMzF9.o5z7uxui9h2o-GVKG9znk4TKBAoK4WMsLKY6NPZ8_1o";

type UserProfile = {
    id: string;
    display_name: string;
    numeric_id: string;
    balance: number;
    hold_balance: number;
    email?: string;
    phone_number?: string;
    photo_url?: string;
    inviter_uid?: string;
};

type PaymentMethod = {
    id: string;
    type: 'bank' | 'upi' | 'usdt';
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
    upi_holder_name?: string;
    upi_id?: string;
    usdt_wallet_address?: string;
}

type WithdrawalMethod = {
    type: 'upi' | 'bank';
    name: string;
    upiId?: string;
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiHolderName?: string;
}

type Order = {
    id: string;
    path: string;
    user_id: string;
    order_id: string;
    amount: number;
    status: 'pending_confirmation' | 'in_applied';
    submitted_at?: string;
    utr?: string;
    screenshot_url?: string;
    verification_result?: string;
    created_at: string;
    user?: UserProfile;
    payment_type?: 'bank' | 'upi' | 'usdt' | 'p2p_upi' | 'p2p_bank';
    payment_provider?: string;
    admin_payment_method_id?: string;
    seller_withdrawal_details?: WithdrawalMethod;
    matched_sell_order_path?: string;
    ocr_verified?: boolean;
    ocr_utr_match?: boolean;
    ocr_amount_match?: boolean;
    ocr_upi_match?: boolean;
    ocr_bank_account_match?: boolean;
};

type SellOrder = {
    id: string;
    user_id: string;
    user_numeric_id: string;
    user_phone_number: string;
    order_id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    withdrawal_method: { 
        type: 'upi' | 'bank';
        name: string;
        upiId?: string;
        bankName?: string;
        accountHolderName?: string;
        accountNumber?: string;
        ifscCode?: string;
    };
    created_at: string;
    completed_at?: string;
    failure_reason?: string;
}

type Attachment = {
  name: string;
  type: string;
  url: string;
};


type Message = {
  text: string;
  isUser: boolean;
  timestamp: number;
  userName?: string;
  attachment?: Attachment;
};

type ChatRequest = {
    id: string;
    user_id?: string;
    user_numeric_id?: string;
    entered_identifier: string;
    status: 'pending' | 'active' | 'closed';
    created_at: string;
    chat_history: Message[];
    agent_id?: string;
    agent_joined_at?: string;
}

type Report = {
    id: string;
    case_id: string;
    user_id: string;
    user_numeric_id: string;
    order_id: string;
    display_order_id: string;
    order_type: 'buy' | 'sell';
    problem_type: string;
    message: string;
    screenshot_url?: string;
    video_url?: string;
    created_at: string;
    status: 'pending' | 'resolved';
    resolution_message?: string;
}

type Feedback = {
    id: string;
    user_id: string;
    user_numeric_id: string;
    message: string;
    created_at: string;
}

const paymentMethodDetails: { [key: string]: { logo: string; bgColor: string } } = {
  PhonePe: {
    logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(4).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDQpLnBuZyIsImlhdCI6MTc3NTE0ODYyMSwiZXhwIjoxODA2Njg0NjIxfQ.b_cMHhiCw52krGt2edtt1k5C1Keo8uGJwYIWpe6vZVo",
    bgColor: "bg-violet-600",
  },
  Paytm: {
    logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(5).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDUpLnBuZyIsImlhdCI6MTc3NTE0ODYzMiwiZXhwIjoxODA2Njg0NjMyfQ.QXSbgSLV3ULTcV3ss9Co9ZMe1oj3tb9bR_OP8xY-Nds",
    bgColor: "bg-sky-500",
  },
  MobiKwik: {
    logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDEpLnBuZyIsImlhdCI6MTc3NTE0ODU3MywiZXhwIjoxODA2Njg0NTczfQ.m8Z7gn5FV-0ss58kTEUZ833u8Wv_bFun3YZeZtyIa9s",
    bgColor: "bg-blue-600",
  },
  Freecharge: {
    logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(3).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDMpLnBuZyIsImlhdCI6MTc3NTE0ODYwOSwiZXhwIjoxODA2Njg0NjA5fQ.pus8pOlgEXCFb2pjIzNsVtU9DxnIxEeaVaeR3TuIQPc",
    bgColor: "bg-orange-500",
  },
};

const CountdownTimer = ({ expiryTimestamp, className }: { expiryTimestamp: string, className?: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const expiryTime = new Date(expiryTimestamp).getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = expiryTime - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("Expired");
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [expiryTimestamp]);

    return (
        <div className={cn(
            "flex items-center gap-1 text-xs font-mono",
            timeLeft === "Expired" ? "text-red-500" : "text-yellow-600",
            className
        )}>
            <Clock className="h-3 w-3" />
            <span>{timeLeft}</span>
        </div>
    );
};

const UserCard = React.memo(({ user }: { user: UserProfile }) => {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={defaultAvatarUrl} alt={user.display_name} />
                    <AvatarFallback>{user.display_name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base">{user.display_name}</CardTitle>
                    <CardDescription>UID: {user.numeric_id}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-1">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-xl font-bold">{(user.balance || 0).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">LGB</span></p>
                <p className="text-xs text-muted-foreground pt-2">{user.phone_number || 'No phone number'}</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full" variant="outline">
                    <Link href={`/admin/users/${user.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View User
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
});
UserCard.displayName = 'UserCard';


function UsersGrid({ users, loading, error }: { users: UserProfile[], loading: boolean, error: any }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex-row items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card className="bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Fetching Users</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not retrieve user data. Your current security rules may be blocking this query. For this feature to work, an admin must have read access to the 'users' table.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }
    
    if (users.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No users found.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((user) => (
                <UserCard key={user.id} user={user} />
            ))}
        </div>
    );
}

function BankDetailsForm({ onAdd }: { onAdd: (details: Omit<PaymentMethod, 'id' | 'type'>) => Promise<void> }) {
    const [bankName, setBankName] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!bankName || !accountHolderName || !accountNumber || !ifscCode) {
            alert('Please fill all fields');
            return;
        }
        setIsLoading(true);
        await onAdd({ bank_name: bankName, account_holder_name: accountHolderName, account_number: accountNumber, ifsc_code: ifscCode });
        setIsLoading(false);
        setBankName('');
        setAccountHolderName('');
        setAccountNumber('');
        setIfscCode('');
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Bank Account</CardTitle>
                <CardDescription>Enter the details of the bank account to be added.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input id="bank-name" placeholder="e.g., State Bank of India" value={bankName} onChange={e => setBankName(e.target.value)} disabled={isLoading}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account-holder-name">Account Holder Name</Label>
                    <Input id="account-holder-name" placeholder="e.g., John Doe" value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} disabled={isLoading}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input id="account-number" placeholder="e.g., 1234567890" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} disabled={isLoading}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ifsc-code">IFSC Code</Label>
                    <Input id="ifsc-code" placeholder="e.g., SBIN0001234" value={ifscCode} onChange={e => setIfscCode(e.target.value)} disabled={isLoading}/>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading && <Loader size="xs" className="mr-2"/>}
                    Add Bank Account
                </Button>
            </CardFooter>
        </Card>
    );
}

function UpiDetailsForm({ onAdd }: { onAdd: (details: Omit<PaymentMethod, 'id' | 'type'>) => Promise<void> }) {
    const [upiHolderName, setUpiHolderName] = useState('');
    const [upiId, setUpiId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async () => {
        if(!upiHolderName || !upiId) {
            alert('Please fill all fields');
            return;
        }
        setIsLoading(true);
        await onAdd({ upi_holder_name: upiHolderName, upi_id: upiId });
        setIsLoading(false);
        setUpiHolderName('');
        setUpiId('');
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>Add UPI ID</CardTitle>
                <CardDescription>Enter the details of the UPI ID to be added.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="upi-holder-name">Name</Label>
                    <Input id="upi-holder-name" placeholder="e.g., John Doe" value={upiHolderName} onChange={e => setUpiHolderName(e.target.value)} disabled={isLoading}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="upi-id">UPI ID</Label>
                    <Input id="upi-id" placeholder="e.g., johndoe@upi" value={upiId} onChange={e => setUpiId(e.target.value)} disabled={isLoading}/>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading && <Loader size="xs" className="mr-2"/>}
                    Add UPI ID
                </Button>
            </CardFooter>
        </Card>
    );
}

function UsdtDetailsForm({ onAdd }: { onAdd: (details: Omit<PaymentMethod, 'id' | 'type'>) => Promise<void> }) {
    const [usdtWalletAddress, setUsdtWalletAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async () => {
        if(!usdtWalletAddress) {
            alert('Please fill all fields');
            return;
        }
        setIsLoading(true);
        await onAdd({ usdt_wallet_address: usdtWalletAddress });
        setIsLoading(false);
        setUsdtWalletAddress('');
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>Add USDT Wallet</CardTitle>
                <CardDescription>Enter the TRC20 wallet address for USDT payments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="usdt-wallet-address">USDT Address (TRC20)</Label>
                    <Input id="usdt-wallet-address" placeholder="T..." value={usdtWalletAddress} onChange={e => setUsdtWalletAddress(e.target.value)} disabled={isLoading}/>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading && <Loader size="xs" className="mr-2"/>}
                    Add USDT Wallet
                </Button>
            </CardFooter>
        </Card>
    );
}

function PaymentMethodsList({ methods, loading, onDelete, canDelete }: { methods: PaymentMethod[], loading: boolean, onDelete: (id: string) => void, canDelete: boolean }) {
    if (loading) {
        return <Skeleton className="h-32 w-full mt-8"/>
    }

    if (!methods || methods.length === 0) {
        return null;
    }

    const bankAccounts = methods.filter(m => m.type === 'bank');
    const upiAccounts = methods.filter(m => m.type === 'upi');
    const usdtAccounts = methods.filter(m => m.type === 'usdt');

    return (
        <div className="mt-8 space-y-6">
            {bankAccounts.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Saved Bank Accounts</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {bankAccounts.map(method => (
                            <Card key={method.id} className="p-4 bg-muted/50 flex justify-between items-start">
                                <div className="text-sm space-y-1">
                                    <p><span className="font-semibold">Bank:</span> {method.bank_name}</p>
                                    <p><span className="font-semibold">Holder:</span> {method.account_holder_name}</p>
                                    <p><span className="font-semibold">Account No:</span> {method.account_number}</p>
                                    <p><span className="font-semibold">IFSC:</span> {method.ifsc_code}</p>
                                </div>
                                {canDelete && (
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(method.id)} className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}
            {upiAccounts.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Saved UPI IDs</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {upiAccounts.map(method => (
                             <Card key={method.id} className="p-4 bg-muted/50 flex justify-between items-start">
                                <div className="text-sm space-y-1">
                                    <p><span className="font-semibold">Name:</span> {method.upi_holder_name}</p>
                                    <p><span className="font-semibold">UPI ID:</span> {method.upi_id}</p>
                                </div>
                                {canDelete && (
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(method.id)} className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}
            {usdtAccounts.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Saved USDT Wallets</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {usdtAccounts.map(method => (
                             <Card key={method.id} className="p-4 bg-muted/50 flex justify-between items-start">
                                <div className="text-sm space-y-1 break-all">
                                    <p><span className="font-semibold">Network:</span> USDT (TRC20)</p>
                                    <p><span className="font-semibold">Address:</span> {method.usdt_wallet_address}</p>
                                </div>
                                {canDelete && (
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(method.id)} className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

const PaymentReceipt = React.forwardRef<HTMLDivElement, { order: SellOrder; utr: string }>(({ order, utr }, ref) => {
    const receiptDate = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    const isBank = order.withdrawal_method?.type === 'bank';

    return (
        <div ref={ref} className="bg-white p-6 rounded-lg shadow-lg w-[360px] relative overflow-hidden font-sans">
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <h1 className="text-[120px] font-bold text-gray-200/30 rotate-[-30deg] select-none">LG PAY</h1>
            </div>
            <div className="relative z-10">
                <div className="text-center mb-6">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="text-xl font-semibold mt-4">Payment Successful</h2>
                    <p className="text-3xl font-bold mt-2">₹{order.amount.toFixed(2)}</p>
                </div>

                <div className="space-y-3 text-sm border-t border-dashed pt-4">
                    <div className="flex justify-between">
                        <span className="text-gray-500">To</span>
                        <span className="font-medium text-right">{isBank ? order.withdrawal_method?.accountHolderName : order.withdrawal_method?.name}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">{isBank ? 'Account No.' : 'UPI ID'}</span>
                        <span className="font-medium text-right">{isBank ? order.withdrawal_method?.accountNumber : order.withdrawal_method?.upiId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">From</span>
                        <span className="font-medium">LG PAY ADMIN</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">UTR Number</span>
                        <span className="font-medium font-mono">{utr || 'XXXXXXXXXXXXXXXX'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Order ID</span>
                        <span className="font-medium font-mono text-xs break-all">{order.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Date & Time</span>
                        <span className="font-medium">{receiptDate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
});
PaymentReceipt.displayName = 'PaymentReceipt';


function ProcessWithdrawalDialog({ order, onProcessed }: { order: SellOrder, onProcessed: () => void }) {
    const [utr, setUtr] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [open, setOpen] = useState(false);
    const [showRejectionUI, setShowRejectionUI] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();
    const receiptRef = useRef<HTMLDivElement>(null);

    // This is the user's destination account (either bank or UPI).
    const withdrawalDetails = order.withdrawal_method;
    const isBankWithdrawal = withdrawalDetails?.type === 'bank';

    const handleConfirm = async () => {
        if (utr.length !== 12 || !/^\d+$/.test(utr)) {
            toast({ variant: 'destructive', title: 'Invalid UTR', description: 'UTR must be 12 digits.' });
            return;
        }
        setIsConfirming(true);
        try {
            const { error } = await supabase.from('sell_orders').update({
                status: 'completed',
                utr: utr,
                completed_at: new Date().toISOString(),
            }).eq('id', order.id);
            if (error) throw error;
            toast({ title: 'Withdrawal Confirmed!', description: `Order ${order.order_id} marked as completed.` });
            setOpen(false);
            onProcessed();
        } catch (e: any) {
            console.error("Failed to confirm withdrawal:", e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsConfirming(false);
        }
    };
    
     const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for rejection.' });
            return;
        }
        setIsRejecting(true);
        try {
            const { data: userData, error: userError } = await supabase.from('users').select('balance').eq('id', order.user_id).single();
            if (userError || !userData) throw new Error("User not found for refund.");

            const newBalance = (userData.balance || 0) + order.amount;
            
            const { error: userUpdateError } = await supabase.from('users').update({ balance: newBalance }).eq('id', order.user_id);
            if(userUpdateError) throw new Error('Failed to refund user balance.');

            const { error: orderUpdateError } = await supabase.from('sell_orders').update({
                status: 'failed',
                failure_reason: rejectionReason,
            }).eq('id', order.id);
            if (orderUpdateError) throw orderUpdateError;


            toast({ title: 'Withdrawal Rejected', description: `Order ${order.order_id} has been rejected and amount refunded.` });
            setOpen(false);
            onProcessed();
        } catch (e: any) {
            console.error("Failed to reject withdrawal:", e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsRejecting(false);
        }
    };

    const handleDownloadImage = async () => {
        if (!receiptRef.current) {
            toast({ variant: 'destructive', title: 'Error', description: 'Receipt element not found.' });
            return;
        }
        if (!utr || utr.length !== 12) {
            toast({ variant: 'destructive', title: 'Invalid UTR', description: 'Please enter a 12-digit UTR before downloading.' });
            return;
        }

        setIsDownloading(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher scale for better resolution
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `LGPAY-Receipt-${order.order_id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to download image:', error);
            toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not generate receipt image.' });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            {/* Hidden receipt for capturing */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <PaymentReceipt ref={receiptRef} order={order} utr={utr} />
            </div>
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setShowRejectionUI(false); }}>
                <DialogTrigger asChild>
                    <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">View Details</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Withdrawal</DialogTitle>
                        <div className="flex justify-between items-center text-sm pt-2">
                            <CardDescription>Order ID: <span className="break-all">{order.order_id}</span></CardDescription>
                            <CountdownTimer expiryTimestamp={new Date(new Date(order.created_at).getTime() + 30 * 60 * 1000).toISOString()} />
                        </div>
                    </DialogHeader>
                    {showRejectionUI ? (
                        <div className="py-4 space-y-2">
                            <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                            <Input id="rejection-reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g., Invalid details" />
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <p><strong>Amount:</strong> <span className="font-bold text-lg text-primary">₹{order.amount}</span></p>
                            <p><strong>User UID:</strong> {order.user_numeric_id}</p>
                            <p><strong>Phone:</strong> {order.user_phone_number}</p>
                            
                            <p><strong>Method:</strong> {withdrawalDetails?.type?.toUpperCase() ?? 'N/A'}</p>
                            {isBankWithdrawal ? (
                                <>
                                <p><strong>Bank:</strong> {withdrawalDetails.bankName ?? 'N/A'}</p>
                                <p><strong>Holder:</strong> {withdrawalDetails.accountHolderName ?? 'N/A'}</p>
                                <p><strong>Account No:</strong> {withdrawalDetails.accountNumber ?? 'N/A'}</p>
                                <p><strong>IFSC:</strong> {withdrawalDetails.ifscCode ?? 'N/A'}</p>
                                </>
                            ) : (
                                <p><strong>To ({withdrawalDetails?.name || 'N/A'}):</strong> {withdrawalDetails?.upiId || 'N/A'}</p>
                            )}

                            <div className="space-y-2 pt-2">
                                <Label htmlFor="utr">12-Digit UTR Number</Label>
                                <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} maxLength={12} placeholder="Enter payment UTR" />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="sm:justify-between flex-col-reverse sm:flex-row sm:items-center gap-2">
                         <Button asChild variant="secondary" className="sm:mr-auto">
                            <Link href={`/admin/users/${order.user_id}`} target="_blank">View User</Link>
                        </Button>
                        {showRejectionUI ? (
                             <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowRejectionUI(false)} disabled={isRejecting}>Back</Button>
                                <Button variant="destructive" onClick={handleReject} disabled={isRejecting || !rejectionReason.trim()}>
                                    {isRejecting && <Loader size="xs" className="mr-2"/>}
                                    Confirm Rejection
                                </Button>
                             </div>
                        ) : (
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" className="text-primary border-primary" onClick={handleDownloadImage} disabled={isDownloading || isConfirming}>
                                    {isDownloading ? <Loader size="xs" className="mr-2"/> : <Download className="mr-2 h-4 w-4" />}
                                    Receipt
                                </Button>
                                <Button variant="destructive" onClick={() => setShowRejectionUI(true)} disabled={isConfirming}>Reject</Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirm} disabled={isConfirming || !utr || utr.length !== 12}>
                                    {isConfirming && <Loader size="xs" className="mr-2"/>}
                                    Confirm
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function WithdrawalsTabContent() {
    const supabase = createClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [allOrders, setAllOrders] = useState<SellOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchWithdrawals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('sell_orders').select('*').eq('status', 'pending').order('created_at', { ascending: false });
            if (error) throw error;
            setAllOrders(data);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            setError(error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);


    useEffect(() => {
        fetchWithdrawals();
    }, [fetchWithdrawals]);

    const filteredOrders = useMemo(() => {
        const pendingOrders = allOrders;

        if (!searchTerm) return pendingOrders;
        const lowercasedTerm = searchTerm.toLowerCase();
        return pendingOrders.filter(order =>
            order.order_id.toLowerCase().includes(lowercasedTerm) ||
            order.user_numeric_id.toLowerCase().includes(lowercasedTerm) ||
            order.user_phone_number?.toLowerCase().includes(lowercasedTerm)
        );
    }, [allOrders, searchTerm]);

    if (error) {
        return (
            <Card className="bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Fetching Withdrawals</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not retrieve withdrawal data. This might be due to security rules or a missing database index.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-xs text-destructive/80 font-mono bg-destructive/10 p-2 rounded-md break-all">
                        {error.message}
                    </p>
                 </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by Order ID, UID, or Phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 max-w-sm"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            ) : filteredOrders.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No pending withdrawals found.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.map(order => (
                        <Card key={order.id} className="flex flex-col">
                            <CardContent className="flex-grow p-4 space-y-2 text-sm">
                                <p><strong>Amount:</strong> <span className="font-bold text-lg text-primary">₹{order.amount}</span></p>
                                <p><strong>User UID:</strong> {order.user_numeric_id}</p>
                                <p><strong>Phone:</strong> {order.user_phone_number}</p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <ProcessWithdrawalDialog order={order} onProcessed={fetchWithdrawals} />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function HistoryUsersGrid({ users, loading, error }: { users: UserProfile[], loading: boolean, error: any }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </CardHeader>
                         <CardContent>
                             <Skeleton className="h-4 w-full" />
                         </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card className="bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Fetching Users</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not retrieve user data.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }
    
    if (users.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No users found.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((user) => (
            <Card key={user.id} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="text-base">{user.display_name}</CardTitle>
                    <CardDescription>UID: {user.numeric_id}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                     <p className="text-sm text-muted-foreground">{user.phone_number || 'No phone number'}</p>
                </CardContent>
                <CardFooter>
                     <Button asChild className="w-full" variant="outline">
                        <Link href={`/admin/history/${user.id}`}>
                            <History className="mr-2 h-4 w-4" />
                            View History
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
            ))}
        </div>
    );
}

function LiveChatTabContent() {
    const supabase = createClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [liveChatRequests, setLiveChatRequests] = useState<ChatRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchChats = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('chat_requests')
                .select('*')
                .in('status', ['pending', 'active'])
                .order('created_at', { ascending: false });

            if (error) {
                setError(error);
                setLiveChatRequests([]);
            } else {
                setLiveChatRequests(data as ChatRequest[]);
            }
            setLoading(false);
        };
        fetchChats();
        
        const channel = supabase.channel('public:chat_requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests' }, payload => {
                fetchChats(); // Refetch on any change
            }).subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        }

    }, [supabase]);
    
    const sortedAndFilteredRequests = useMemo(() => {
        const sorted = [...liveChatRequests].sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        if (!searchTerm.trim()) {
            return sorted;
        }

        const lowercasedTerm = searchTerm.toLowerCase();
        return sorted.filter(req => 
            (req.user_numeric_id && req.user_numeric_id.toLowerCase().includes(lowercasedTerm)) ||
            (req.entered_identifier && req.entered_identifier.toLowerCase().includes(lowercasedTerm))
        );
    }, [liveChatRequests, searchTerm]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
        );
    }
    
    if (error) {
        return (
            <Card className="bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Fetching Chat Requests</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not retrieve chat data. This can be caused by security rules. Please check your console for more details.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-xs text-destructive/80 font-mono bg-destructive/10 p-2 rounded-md break-all">
                        {error.message}
                    </p>
                 </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by UID or Phone Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 max-w-sm"
                />
            </div>

            {sortedAndFilteredRequests.length === 0 ? (
                 <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        {searchTerm ? "No matching chat requests found." : "No pending or active live chat requests."}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedAndFilteredRequests.map(request => {
                         const isPending = request.status === 'pending';
                         return (
                            <Card key={request.id} className={cn("flex flex-col", !isPending && "bg-blue-50 border-blue-200")}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{isPending ? "New Chat Request" : "Active Chat"}</CardTitle>
                                            <CardDescription>
                                                {new Date(request.created_at).toLocaleString()}
                                            </CardDescription>
                                        </div>
                                        {isPending && <CountdownTimer expiryTimestamp={new Date(new Date(request.created_at).getTime() + 10 * 60 * 1000).toISOString()} />}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-2 text-sm">
                                    <p><strong>User UID:</strong> {request.user_numeric_id || 'N/A'}</p>
                                    <p><strong>Identifier:</strong> {request.entered_identifier}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className={cn(
                                        "w-full font-bold",
                                        isPending ? "bg-green-500 hover:bg-green-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
                                    )}>
                                        <Link href={`/admin/chat/${request.id}`}>
                                            {isPending ? "JOIN CHAT" : "VIEW ACTIVE CHAT"}
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                         )
                    })}
                </div>
            )}
        </div>
    );
}

const VerificationItem = ({ label, isMatch }: { label: string, isMatch?: boolean }) => {
    if (isMatch === undefined) {
        return (
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1.5 font-semibold text-yellow-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Scanning...</span>
                </div>
            </div>
        );
    }
    
    const Icon = isMatch ? CheckCircle : XCircle;
    const colorClass = isMatch ? "text-green-600" : "text-red-500";
    const text = isMatch ? "YES" : "NO";

    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <div className={cn("flex items-center gap-1.5 font-semibold", colorClass)}>
                <Icon className="h-4 w-4" />
                <span>{text}</span>
            </div>
        </div>
    );
};


function ProcessConfirmationDialog({ order, onProcessed, adminPaymentMethods }: { order: Order; onProcessed: () => void; adminPaymentMethods: PaymentMethod[] }) {
    const [open, setOpen] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [showRejectionUI, setShowRejectionUI] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const supabase = createClient();
    const { toast } = useToast();

    const isP2P = order.payment_type === 'p2p_upi' || order.payment_type === 'p2p_bank';

    const receiverDetails = useMemo(() => {
        if (isP2P) {
            return order.seller_withdrawal_details;
        }
        if (!order.admin_payment_method_id || !adminPaymentMethods) return null;
        return adminPaymentMethods.find(m => m.id.toString() === order.admin_payment_method_id);
    }, [order, adminPaymentMethods, isP2P]);

    const copyToClipboard = (text: string | undefined, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: `${label} Copied!`, description: text });
    };

    const handleApprove = async () => {
        // This function would ideally be a single RPC call to a database function
        // to ensure atomicity. For now, we'll chain the calls.
        setIsApproving(true);
        try {
            // This needs to be converted to a proper transaction or RPC
            toast({ variant: 'destructive', title: 'Approval logic not fully implemented for Supabase yet.' });
            // The logic involves multiple table updates (users, orders, sell_orders, transactions)
            // and should be handled in a database function for safety.
        } catch (e: any) {
            console.error("Failed to approve payment:", e);
            toast({ variant: 'destructive', title: 'Approval Failed', description: e.message });
        } finally {
            setIsApproving(false);
        }
    };
    
    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast({ variant: 'destructive', title: 'Reason Required' });
            return;
        }
        setIsRejecting(true);
        try {
            // This also needs to be a transaction
            toast({ variant: 'destructive', title: 'Rejection logic not fully implemented for Supabase yet.' });
        } catch (e: any) {
            console.error("Failed to reject payment:", e);
            toast({ variant: 'destructive', title: 'Rejection Failed', description: e.message });
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setShowRejectionUI(false); }}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full">Review</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Review Payment</DialogTitle>
                    <DialogDescription>
                        Confirm or reject this payment of <strong>₹{order.amount.toFixed(2)}</strong> from user {order.user?.numeric_id}.
                    </DialogDescription>
                </DialogHeader>

                {showRejectionUI ? (
                    <div className="py-4 space-y-2">
                        <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                        <Textarea id="rejection-reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g., UTR does not match, screenshot is edited..." />
                    </div>
                ) : (
                    <div className="space-y-4 py-4 text-sm">
                        <div className="flex justify-between"><span>User:</span> <span className="font-semibold">{order.user?.display_name || 'N/A'} ({order.user?.numeric_id})</span></div>
                        <div className="flex justify-between items-start gap-2"><span>UTR / TxHash:</span> <span className="font-mono text-right break-all">{order.utr}</span></div>
                        <div className="flex justify-between items-center">
                            <span>Screenshot:</span> 
                            <Dialog>
                                <DialogTrigger asChild>
                                   <Button variant="link" size="sm" className="h-auto p-0">View Image</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Payment Screenshot</DialogTitle>
                                    </DialogHeader>
                                    <img src={order.screenshot_url} alt="Payment Screenshot" className="rounded-md max-h-[70vh] object-contain" />
                                </DialogContent>
                            </Dialog>
                        </div>

                        {receiverDetails && (
                            <div className="mt-4">
                                <h3 className="font-semibold text-foreground mb-2 text-sm">Receiver Details</h3>
                                <div className="rounded-lg border bg-secondary/50 p-3 space-y-2 text-sm">
                                    {receiverDetails.type === 'bank' && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Bank:</span>
                                                <span className="font-semibold">{receiverDetails.bankName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Holder:</span>
                                                <span className="font-semibold">{receiverDetails.accountHolderName}</span>
                                            </div>
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-muted-foreground shrink-0">Account No:</span>
                                                <div className="flex items-center gap-1 text-right">
                                                    <span className="font-mono break-all">{receiverDetails.accountNumber}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(receiverDetails.accountNumber, 'Account No.')}><Copy className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-muted-foreground shrink-0">IFSC:</span>
                                                <div className="flex items-center gap-1 text-right">
                                                    <span className="font-mono break-all">{receiverDetails.ifscCode}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(receiverDetails.ifscCode, 'IFSC Code')}><Copy className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {receiverDetails.type === 'upi' && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Name:</span>
                                                <span className="font-semibold">{receiverDetails.upiHolderName}</span>
                                            </div>
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-muted-foreground shrink-0">UPI ID:</span>
                                                <div className="flex items-center gap-1 text-right">
                                                    <span className="font-mono break-all">{receiverDetails.upiId}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(receiverDetails.upiId, 'UPI ID')}><Copy className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {receiverDetails.type === 'usdt' && (
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-muted-foreground shrink-0">Wallet:</span>
                                            <div className="flex items-center gap-1 text-right">
                                                <span className="font-mono break-all">{receiverDetails.usdt_wallet_address}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(receiverDetails.usdt_wallet_address, 'Wallet Address')}><Copy className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <h3 className="font-semibold text-foreground mb-2 text-sm">Automated Verification</h3>
                            <div className="rounded-lg border bg-secondary/50 p-3 space-y-2 text-sm">
                                <VerificationItem label="Amount Match" isMatch={order.ocr_amount_match} />
                                <VerificationItem label="UTR Match" isMatch={order.ocr_utr_match} />
                                {(order.payment_type === 'upi' || order.payment_type === 'p2p_upi') && <VerificationItem label="UPI Match" isMatch={order.ocr_upi_match} />}
                                {order.payment_type === 'bank' && <VerificationItem label="Account Match" isMatch={order.ocr_bank_account_match} />}
                            </div>
                        </div>

                        {order.verification_result && (
                             <div className="flex items-start gap-2 rounded-md bg-yellow-50 border border-yellow-200 p-3">
                                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-yellow-800">AI Verification Result</h4>
                                    <p className="text-yellow-700">{order.verification_result}</p>
                                </div>
                             </div>
                        )}
                    </div>
                )}
                 <DialogFooter className="sm:justify-end gap-2">
                    {showRejectionUI ? (
                        <>
                            <Button variant="ghost" onClick={() => setShowRejectionUI(false)} disabled={isRejecting}>Back</Button>
                            <Button variant="destructive" onClick={handleReject} disabled={isRejecting || !rejectionReason.trim()}>
                                {isRejecting && <Loader size="xs" className="mr-2"/>}
                                Confirm Rejection
                            </Button>
                        </>
                    ) : (
                        <>
                           <Button variant="destructive" onClick={() => setShowRejectionUI(true)} disabled={isApproving}>Reject</Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isApproving}>
                                {isApproving && <Loader size="xs" className="mr-2"/>}
                                Approve
                            </Button>
                        </>
                    )}
                 </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ConfirmationsTabContent() {
    const supabase = createClient();
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [usersMap, setUsersMap] = useState<Map<string, UserProfile>>(new Map());
    const [adminPaymentMethods, setAdminPaymentMethods] = useState<PaymentMethod[]>([]);
    
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [methodsLoading, setMethodsLoading] = useState(true);

    const [error, setError] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchConfirmations = useCallback(async () => {
        setOrdersLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('orders')
                .select('*')
                .in('status', ['pending_confirmation', 'in_applied'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const combinedOrders = data as Order[];
            setAllOrders(combinedOrders);

            if (combinedOrders.length > 0) {
                const userIds = [...new Set(combinedOrders.map(order => order.user_id))];
                const { data: usersData, error: usersError } = await supabase.from('users').select('*').in('id', userIds);
                if(usersError) throw usersError;
                
                const newUsersMap = new Map<string, UserProfile>();
                usersData.forEach((user: UserProfile) => newUsersMap.set(user.id, user));
                setUsersMap(newUsersMap);
            } else {
                setUsersMap(new Map());
            }

        } catch (err: any) {
            console.error("Error fetching confirmations:", err);
            setError(err);
        } finally {
            setOrdersLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchConfirmations();
    }, [fetchConfirmations]);
    
    useEffect(() => {
        setMethodsLoading(true);
        supabase.from('payment_methods').select('*')
            .then(({ data, error }) => {
                if(error) throw error;
                setAdminPaymentMethods(data as PaymentMethod[]);
            })
            .catch((err) => {
                console.error("Error fetching payment methods:", err);
            })
            .finally(() => {
                setMethodsLoading(false);
            });
    }, [supabase]);


    const ordersWithUserData = useMemo(() => {
        return allOrders.map(order => ({
            ...order,
            user: usersMap.get(order.user_id)
        }));
    }, [allOrders, usersMap]);

    const filteredOrders = useMemo(() => {
        if (!ordersWithUserData) return [];
        if (!searchTerm) return ordersWithUserData;
        const lowercasedTerm = searchTerm.toLowerCase();
        return ordersWithUserData.filter(order =>
            order.order_id.toLowerCase().includes(lowercasedTerm) ||
            order.user?.numeric_id?.toLowerCase().includes(lowercasedTerm) ||
            order.utr?.toLowerCase().includes(lowercasedTerm)
        );
    }, [ordersWithUserData, searchTerm]);
    
    const loading = ordersLoading || methodsLoading;

    if (error) {
         return (
            <Card className="bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Fetching Confirmations</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not retrieve pending payments. This might be due to security rules or a network issue.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-xs text-destructive/80 font-mono bg-destructive/10 p-2 rounded-md break-all">
                        {error.message}
                    </p>
                 </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by Order ID, UID, or UTR..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 max-w-sm"
                    />
                </div>
                <Button onClick={fetchConfirmations} variant="outline" size="sm" disabled={ordersLoading}>
                     {ordersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                     Refresh
                </Button>
            </div>
            {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            ) : filteredOrders.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No payments are pending confirmation.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.map(order => {
                        const providerDetails = order.payment_provider ? paymentMethodDetails[order.payment_provider] : null;
                        return (
                            <Card key={order.id}>
                                <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Amount</p>
                                        <p className="font-bold text-lg text-primary">₹{order.amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        {order.status === 'pending_confirmation' && order.submitted_at ? (
                                            <CountdownTimer 
                                                expiryTimestamp={new Date(new Date(order.submitted_at).getTime() + 30 * 60 * 1000).toISOString()} 
                                            />
                                        ) : order.status === 'in_applied' ? (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                                                <AlertCircle className="h-3 w-3" />
                                                <span>In Applied</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-2 text-sm">
                                    <p><strong>User:</strong> {order.user ? `${order.user.display_name} (${order.user.numeric_id})` : <Skeleton className="h-4 w-20 inline-block"/>}</p>
                                    <p className="flex items-start gap-2"><strong>UTR/TxHash:</strong> <span className="font-mono text-right break-all">{order.utr}</span></p>
                                     {order.payment_provider && (
                                        <p className="flex items-center gap-2">
                                            <strong>Method:</strong>
                                            {providerDetails ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Image src={providerDetails.logo} alt={order.payment_provider} width={16} height={16} />
                                                    <span>{order.payment_provider}</span>
                                                </span>
                                            ) : (
                                                <span>{order.payment_provider}</span>
                                            )}
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <ProcessConfirmationDialog order={order} onProcessed={fetchConfirmations} adminPaymentMethods={adminPaymentMethods} />
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function ReviewReportDialog({ report, onResolved }: { report: Report; onResolved: () => void }) {
    const [open, setOpen] = useState(false);
    const [resolutionMessage, setResolutionMessage] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();

    const handleResolve = async () => {
        if (!resolutionMessage.trim()) {
            toast({ variant: 'destructive', title: 'Resolution message is required.' });
            return;
        }
        setIsResolving(true);
        try {
            const { error } = await supabase.from('reports').update({
                status: 'resolved',
                resolution_message: resolutionMessage,
            }).eq('id', report.id);

            if (error) throw error;
            toast({ title: 'Report Resolved' });
            setOpen(false);
            onResolved();
        } catch (error: any) {
            console.error('Failed to resolve report:', error);
            toast({ variant: 'destructive', title: 'Failed to resolve report', description: error.message });
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={report.status === 'resolved'}>
                    {report.status === 'resolved' ? 'Resolved' : 'Review'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Review Report: {report.case_id}</DialogTitle>
                    <DialogDescription>
                        User {report.user_numeric_id} reported a problem with order {report.display_order_id}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    <p><strong>Problem:</strong> {report.problem_type}</p>
                    <p><strong>Message:</strong></p>
                    <p className="text-sm p-3 bg-secondary rounded-md">{report.message}</p>
                    
                    {report.screenshot_url && (
                        <div>
                            <strong>Screenshot:</strong>
                            <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-primary underline ml-2">View Image</a>
                        </div>
                    )}
                    {report.video_url && (
                         <div>
                            <strong>Video:</strong>
                            <a href={report.video_url} target="_blank" rel="noopener noreferrer" className="text-primary underline ml-2">View Video</a>
                        </div>
                    )}
                     <p><strong>Order Type:</strong> {report.order_type}</p>

                    {report.status === 'resolved' ? (
                        <div>
                            <Label>Resolution Message</Label>
                            <p className="text-sm p-3 bg-green-100 rounded-md text-green-900">{report.resolution_message}</p>
                        </div>
                    ) : (
                         <div className="space-y-2 pt-4">
                            <Label htmlFor="resolutionMessage">Resolution Message</Label>
                            <Textarea
                                id="resolutionMessage"
                                value={resolutionMessage}
                                onChange={(e) => setResolutionMessage(e.target.value)}
                                placeholder="Explain how the issue was resolved..."
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)} disabled={isResolving}>Close</Button>
                    {report.status === 'pending' && (
                        <Button onClick={handleResolve} disabled={isResolving || !resolutionMessage.trim()}>
                            {isResolving ? <Loader size="xs" className="mr-2"/> : 'Mark as Resolved'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ReportsTabContent() {
    const supabase = createClient();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from("reports").select('*');
            if (error) throw error;
            const fetchedReports = data as Report[];
            fetchedReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setReports(fetchedReports);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);


    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader size="md" />
            </div>
        );
    }
    
    if (error) {
        return (
            <Card className="bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Fetching Reports</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not retrieve report data.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-xs text-destructive/80 font-mono bg-destructive/10 p-2 rounded-md break-all">
                        {error.message}
                    </p>
                 </CardContent>
            </Card>
        )
    }

    if (!reports || reports.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No reports found.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Reports</CardTitle>
                <CardDescription>
                    Review and resolve issues reported by users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Case ID</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Problem</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map(report => (
                            <TableRow key={report.id}>
                                <TableCell className="font-mono text-xs">{report.case_id}</TableCell>
                                <TableCell className="font-mono text-xs break-all">{report.display_order_id}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{report.problem_type}</TableCell>
                                <TableCell>{new Date(report.created_at).toLocaleString()}</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-semibold",
                                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                    )}>
                                        {report.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <ReviewReportDialog report={report} onResolved={fetchReports} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function FeedbackTabContent() {
    const supabase = createClient();
    const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchFeedback = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
            if (error) setError(error);
            else setFeedbackItems(data as Feedback[]);
            setLoading(false);
        };
        fetchFeedback();
    }, [supabase]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader size="md" /></div>;
    }

    if (error) {
        return (
            <Card className="bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Fetching Feedback</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not retrieve feedback data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-destructive/80 font-mono bg-destructive/10 p-2 rounded-md break-all">
                        {error.message}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!feedbackItems || feedbackItems.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No feedback has been submitted yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Feedback</CardTitle>
                <CardDescription>Suggestions and feedback from users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User UID</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feedbackItems.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.user_numeric_id}</TableCell>
                                <TableCell className="max-w-[400px] whitespace-pre-wrap">{item.message}</TableCell>
                                <TableCell className="text-right text-xs">{new Date(item.created_at).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function AdminDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState<any>(null);

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [isMasterAdmin, setIsMasterAdmin] = useState(false);
    const [isSearchingOrders, setIsSearchingOrders] = useState(false);
    const [orderIdSearchedUser, setOrderIdSearchedUser] = useState<UserProfile[] | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setUsersLoading(true);
            const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
            if (error) setUsersError(error);
            else setAllUsers(data as UserProfile[]);
            setUsersLoading(false);
        };
        fetchUsers();
    }, [supabase]);

    useEffect(() => {
        const fetchMethods = async () => {
            setPaymentMethodsLoading(true);
            const { data, error } = await supabase.from('payment_methods').select('*');
            if (error) console.error(error);
            else setPaymentMethods(data as PaymentMethod[]);
            setPaymentMethodsLoading(false);
        };
        fetchMethods();
    }, [supabase]);


    useEffect(() => {
        const masterAdminPhones = ['9060873927', '7050396570'];
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        }
        const phone = getCookie('admin-phone');
        if (phone && masterAdminPhones.includes(phone)) {
            setIsMasterAdmin(true);
        }
    }, []);

    const filteredUsers = useMemo(() => {
        if (orderIdSearchedUser !== null) {
            return orderIdSearchedUser;
        }
        if (!allUsers) return [];
        const lowercasedTerm = searchTerm.toLowerCase();
        if (!lowercasedTerm) {
            return allUsers;
        }

        return allUsers.filter(user =>
            user.numeric_id?.toLowerCase().includes(lowercasedTerm) ||
            user.phone_number?.toLowerCase().includes(lowercasedTerm)
        );
    }, [allUsers, searchTerm, orderIdSearchedUser]);


    const handleLogout = () => {
        document.cookie = 'admin-phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/admin/login');
    };
    
    const totalUsers = allUsers?.length || 0;
    const totalBalance = allUsers?.reduce((acc, user) => acc + (user.balance || 0), 0) || 0;

    const handleAddMethod = async (type: 'bank' | 'upi' | 'usdt', details: any) => {
        const { error } = await supabase.from('payment_methods').insert({ type, ...details });
        if(error) {
            console.error(error);
            toast({ variant: 'destructive', title: `Error adding ${type} method.`});
        } else {
            toast({ title: `${type.toUpperCase()} method added successfully.`});
            // Re-fetch methods
            const { data } = await supabase.from('payment_methods').select('*');
            if (data) setPaymentMethods(data as PaymentMethod[]);
        }
    };

    const handleDeleteMethod = async (id: string) => {
        if (!confirm('Are you sure you want to delete this payment method?')) return;
        const { error } = await supabase.from('payment_methods').delete().eq('id', id);
        if (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error deleting payment method.'});
        } else {
            toast({ title: 'Payment method deleted.' });
            setPaymentMethods(prev => prev.filter(m => m.id !== id));
        }
    };

    function TopSellDestinations() {
        const [topDestinations, setTopDestinations] = useState<{ id: string; total: number; name: string; type: 'UPI' | 'Bank' }[]>([]);
        const [loading, setLoading] = useState(true);
    
        useEffect(() => {
            const fetchTopDestinations = async () => {
                setLoading(true);
                const { data, error } = await supabase.from('sell_orders').select('amount, withdrawal_method').eq('status', 'completed');
                
                if (error) {
                     console.error("Error fetching top sell destinations:", error);
                     toast({ variant: 'destructive', title: 'Error fetching leaderboard' });
                     setLoading(false);
                     return;
                }
                
                const totals = new Map<string, { total: number; name: string; type: 'UPI' | 'Bank' }>();
    
                data.forEach(order => {
                    const method = order.withdrawal_method as WithdrawalMethod;

                    if (method?.type === 'upi' && method.upiId) {
                        const id = method.upiId;
                        const current = totals.get(id) || { total: 0, name: method.name || 'Unknown UPI', type: 'UPI' };
                        current.total += order.amount;
                        totals.set(id, current);
                    } else if (method?.type === 'bank' && method.accountNumber) {
                        const id = method.accountNumber;
                        const current = totals.get(id) || { total: 0, name: method.bankName || 'Unknown Bank', type: 'Bank' };
                        current.total += order.amount;
                        totals.set(id, current);
                    }
                });
    
                const sortedTop10 = Array.from(totals.entries())
                    .sort(([, a], [, b]) => b.total - a.total)
                    .slice(0, 10)
                    .map(([id, data]) => ({ id, ...data }));
                
                setTopDestinations(sortedTop10);
                setLoading(false);
            };
    
            fetchTopDestinations();
        }, []);
    
        return (
            <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Top 10 Sell Destinations</CardTitle>
                    <CardDescription>
                        Highest total amount withdrawn to these destinations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader size="sm" />
                        </div>
                    ) : topDestinations.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">No completed sell orders found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Destination ID</TableHead>
                                    <TableHead>Name / Provider</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topDestinations.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-semibold">{index + 1}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>
                                            <span className={cn("px-2 py-1 text-xs font-semibold rounded-full", item.type === 'UPI' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800')}>{item.type}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">₹{item.total.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10 justify-between">
            <Logo className="text-2xl" />
            <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue="dashboard" className="w-full md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] gap-6">
          <TabsList className="w-full h-auto flex-row justify-start overflow-x-auto md:flex-col md:items-stretch md:justify-start">
            <TabsTrigger value="dashboard" className="justify-start p-3">
                <LayoutDashboard className="mr-2" />
                Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="justify-start p-3">
                <Users className="mr-2"/>
                Users
            </TabsTrigger>
             <TabsTrigger value="withdrawals" className="justify-start p-3">
                <Banknote className="mr-2"/>
                Withdrawals
            </TabsTrigger>
            <TabsTrigger value="confirmations" className="justify-start p-3">
                <FileClock className="mr-2"/>
                Confirmations
            </TabsTrigger>
            <TabsTrigger value="reports" className="justify-start p-3">
                <FileWarning className="mr-2"/>
                Reports
            </TabsTrigger>
             <TabsTrigger value="feedback" className="justify-start p-3">
                <MessageCircleQuestion className="mr-2"/>
                Feedback
            </TabsTrigger>
            <TabsTrigger value="live-chat" className="justify-start p-3">
                <MessageSquare className="mr-2"/>
                Live Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="justify-start p-3">
                <History className="mr-2"/>
                History
            </TabsTrigger>
            {isMasterAdmin && (
              <TabsTrigger value="payment-methods" className="justify-start p-3">
                  <Wallet className="mr-2"/>
                  Payment Methods
              </TabsTrigger>
            )}
          </TabsList>
          <div className="mt-4 md:mt-0">
            <TabsContent value="dashboard" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                            Total Users
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {usersLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalUsers}</div>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                            Total Balance
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        {usersLoading ? <Skeleton className="h-8 w-2/3" /> : <div className="text-2xl font-bold">{(totalBalance || 0).toFixed(2)} <span className="text-sm text-muted-foreground">LGB</span></div>}
                        </CardContent>
                    </Card>
                    {isMasterAdmin && <TopSellDestinations />}
                </div>
            </TabsContent>
            <TabsContent value="users" className="mt-0">
                <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by UID or Phone Number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 max-w-sm"
                    />
                </div>
                <UsersGrid users={filteredUsers} loading={usersLoading} error={usersError} />
                </div>
            </TabsContent>
            <TabsContent value="withdrawals" className="mt-0">
                    <WithdrawalsTabContent />
                </TabsContent>
                <TabsContent value="confirmations" className="mt-0">
                    <ConfirmationsTabContent />
                </TabsContent>
                <TabsContent value="reports" className="mt-0">
                    <ReportsTabContent />
                </TabsContent>
                <TabsContent value="feedback" className="mt-0">
                    <FeedbackTabContent />
                </TabsContent>
                <TabsContent value="live-chat" className="mt-0">
                <LiveChatTabContent />
                </TabsContent>
                <TabsContent value="history" className="mt-0">
                    <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by Order ID, UID, or Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 max-w-sm"
                        />
                    </div>
                    <HistoryUsersGrid users={filteredUsers} loading={usersLoading || isSearchingOrders} error={usersError} />
                    </div>
            </TabsContent>
            {isMasterAdmin && (
              <TabsContent value="payment-methods" className="mt-0">
                  <div className="w-full max-w-2xl mx-auto">
                      <Tabs defaultValue="bank">
                          <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="bank">
                                  <Landmark className="mr-2" />
                                  Bank
                              </TabsTrigger>
                              <TabsTrigger value="upi">
                                  <Banknote className="mr-2" />
                                  UPI
                              </TabsTrigger>
                              <TabsTrigger value="usdt">
                                  <Wallet className="mr-2" />
                                  USDT
                              </TabsTrigger>
                          </TabsList>
                          <TabsContent value="bank" className="mt-4">
                              <BankDetailsForm onAdd={(details) => handleAddMethod('bank', details)} />
                          </TabsContent>
                          <TabsContent value="upi" className="mt-4">
                              <UpiDetailsForm onAdd={(details) => handleAddMethod('upi', details)} />
                          </TabsContent>
                          <TabsContent value="usdt" className="mt-4">
                              <UsdtDetailsForm onAdd={(details) => handleAddMethod('usdt', details)} />
                          </TabsContent>
                      </Tabs>
                      <PaymentMethodsList methods={paymentMethods || []} loading={paymentMethodsLoading} onDelete={handleDeleteMethod} canDelete={isMasterAdmin}/>
                  </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </main>
    </div>
    )
}

export default function AdminDashboardPage() {
    const [isMounted, setIsMounted] = React.useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10 justify-between">
                    <Logo className="text-2xl" />
                </header>
                <main className="flex flex-1 items-center justify-center">
                    <Loader size="md"/>
                </main>
            </div>
        )
    }

    return <AdminDashboard />;
}
