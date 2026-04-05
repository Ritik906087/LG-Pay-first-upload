
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronLeft, Info, Wallet, Landmark } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader } from '@/components/ui/loader';

type WithdrawalMethod = {
    type: 'upi' | 'bank';
    name: string;
    upiId?: string;
    upiHolderName?: string;
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
}

const paymentMethodDetails: { [key: string]: { logo: string; bgColor: string } } = {
  PhonePe: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(4).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDQpLnBuZyIsImlhdCI6MTc3NTE0ODYyMSwiZXhwIjoxODA2Njg0NjIxfQ.b_cMHhiCw52krGt2edtt1k5C1Keo8uGJwYIWpe6vZVo", bgColor: "bg-violet-600" },
  Paytm: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(5).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDUpLnBuZyIsImlhdCI6MTc3NTE0ODYzMiwiZXhwIjoxODA2Njg0NjMyfQ.QXSbgSLV3ULTcV3ss9Co9ZMe1oj3tb9bR_OP8xY-Nds", bgColor: "bg-sky-500" },
  MobiKwik: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDEpLnBuZyIsImlhdCI6MTc3NTE0ODU3MywiZXhwIjoxODA2Njg0NTczfQ.m8Z7gn5FV-0ss58kTEUZ833u8Wv_bFun3YZeZtyIa9s", bgColor: "bg-blue-600" },
  Freecharge: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(3).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDMpLnBuZyIsImlhdCI6MTc3NTE0ODYwOSwiZXhwIjoxODA2Njg0NjA5fQ.pus8pOlgEXCFb2pjIzNsVtU9DxnIxEeaVaeR3TuIQPc", bgColor: "bg-orange-500" },
  Airtel: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(2).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDIpLnBuZyIsImlhdCI6MTc3NTE0ODU5OSwiZXhwIjoxODA2Njg0NTk5fQ.yDb5CBUsF_MCejlDIzrQVjg6IMylJbAzEmHFaozfNjE", bgColor: "bg-red-500" },
};

export default function SellPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile: userProfile, loading: profileLoading } = useSupabaseUser();
  const supabase = createClient();

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod | null>(null);
  const [isAmountValid, setIsAmountValid] = useState(true);
  const [isSelling, setIsSelling] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (/^\d*$/.test(value)) {
      setAmount(value);
      const numValue = parseInt(value, 10);
      if (value === '' || (numValue > 0 && numValue % 100 === 0)) {
        setIsAmountValid(true);
      } else {
        setIsAmountValid(false);
      }
    }
  };

  const handleSell = async () => {
    const sellAmount = parseInt(amount, 10);
    
    if (!isAmountValid || !sellAmount || sellAmount <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount ending in 00.' });
        return;
    }
    
    if (!selectedMethod) {
        toast({ variant: 'destructive', title: 'No method selected', description: 'Please select a withdrawal method.' });
        return;
    }

    if (!userProfile) {
        toast({ variant: 'destructive', title: 'User not loaded', description: 'Please wait a moment and try again.' });
        return;
    }

    if (userProfile.balance < sellAmount) {
        toast({ variant: 'destructive', title: 'Insufficient Balance', description: 'You do not have enough balance to make this transaction.' });
        return;
    }
    
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You are not logged in.' });
        return;
    }

    if (!userProfile.numeric_id || !userProfile.phone_number) {
        toast({ variant: 'destructive', title: 'Profile Incomplete', description: 'Your user ID or phone number is missing. Please contact support.' });
        return;
    }

    setIsSelling(true);

    try {
        // Sanitize the withdrawal method to ensure it matches the expected schema in the database function,
        // preventing errors from extra fields like 'upiHolderName'.
        const sanitizedWithdrawalMethod: Partial<WithdrawalMethod> = {
            type: selectedMethod.type,
            name: selectedMethod.name,
        };

        if (selectedMethod.type === 'upi') {
            sanitizedWithdrawalMethod.upiId = selectedMethod.upiId;
            sanitizedWithdrawalMethod.upiHolderName = selectedMethod.upiHolderName;
        } else if (selectedMethod.type === 'bank') {
            sanitizedWithdrawalMethod.bankName = selectedMethod.bankName;
            sanitizedWithdrawalMethod.accountHolderName = selectedMethod.accountHolderName;
            sanitizedWithdrawalMethod.accountNumber = selectedMethod.accountNumber;
            sanitizedWithdrawalMethod.ifscCode = selectedMethod.ifscCode;
        }

        const { error } = await supabase.rpc('create_sell_order', {
            p_user_id: user.id,
            p_amount: sellAmount,
            p_withdrawal_method: sanitizedWithdrawalMethod,
            p_user_numeric_id: userProfile.numeric_id,
            p_user_phone_number: userProfile.phone_number,
        });

        if (error) throw error;

        toast({
            title: 'Sell Order Placed!',
            description: `Your request to sell ${sellAmount} LGB is being processed.`,
        });
        router.push('/order');

    } catch (error: any) {
        console.error('Sell transaction failed:', error);
        toast({ variant: 'destructive', title: 'Sell Failed', description: error.message || 'An unexpected error occurred. If the problem persists, please contact support.' });
    } finally {
        setIsSelling(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/home">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Sell LG</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow space-y-4 p-4 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-5 w-5 text-primary" />
              Withdrawal Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Minimum withdrawal amount is ₹100.</p>
            <p>2. Withdrawal amount must be a multiple of 100 (e.g., 100, 500, 1200).</p>
            <p>3. Funds will be transferred to your selected account within 30 minutes.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sell Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold">
                ₹
              </span>
              <Input
                placeholder="0.00"
                className={cn(
                  'h-14 pl-8 text-2xl font-bold tracking-wider',
                  !isAmountValid && amount !== '' && 'border-destructive ring-2 ring-destructive/50'
                )}
                value={amount}
                onChange={handleAmountChange}
                type="text" 
                inputMode="numeric"
              />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                <p>Balance: {profileLoading ? '...' : (userProfile?.balance || 0).toFixed(2)}</p>
               </div>
            </div>
            {!isAmountValid && amount !== '' && (
              <p className="mt-2 text-xs text-destructive">
                Amount must be a multiple of 100.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-base">Withdrawal Method</CardTitle>
            </CardHeader>
            <CardContent>
                {profileLoading ? (
                    <Skeleton className="h-24 w-full" />
                ) : userProfile?.payment_methods && userProfile.payment_methods.length > 0 ? (
                    <RadioGroup 
                        onValueChange={(value) => setSelectedMethod(JSON.parse(value))}
                        className="space-y-3"
                    >
                        {userProfile.payment_methods.map((method: any, index: number) => {
                            const methodType = method.type || (method.upiId ? 'upi' : 'bank');
                            const isUpi = methodType === 'upi';
                            const isBank = methodType === 'bank';

                            const key = isUpi ? method.upiId : (isBank ? method.accountNumber : `method-${index}`);
                            const id = isUpi ? method.upiId : (isBank ? `bank-${index}` : `method-id-${index}`);
                            
                            const upiDetails = isUpi ? paymentMethodDetails[method.name] : null;
                            const bgColor = isBank ? 'bg-slate-700' : (upiDetails ? upiDetails.bgColor : 'bg-gray-500');

                            if (!key || !id) return null;

                            return (
                                <Label key={key} htmlFor={id} className={cn("flex items-center gap-4 rounded-xl p-3 border-2 border-transparent has-[:checked]:border-primary", bgColor)}>
                                    <RadioGroupItem value={JSON.stringify(method)} id={id} className="border-white text-white ring-offset-0" />
                                    
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1">
                                        {isUpi && upiDetails ? (
                                            <Image src={upiDetails.logo} alt={`${method.name} logo`} width={32} height={32} className="object-contain" />
                                        ) : isBank ? (
                                            <Landmark className="h-6 w-6 text-slate-700"/>
                                        ) : (
                                            <Wallet className="h-6 w-6 text-gray-500"/>
                                        )}
                                    </div>

                                    <div className="text-white">
                                        <span className="text-lg font-semibold">{isUpi ? method.name : method.bankName}</span>
                                        <p className="text-sm font-mono text-white/80">{isUpi ? method.upiId : method.accountNumber}</p>
                                    </div>
                                </Label>
                            );
                        })}
                    </RadioGroup>
                ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-center text-muted-foreground">
                        <Wallet className="h-8 w-8 opacity-50 mb-2" />
                        <p>No withdrawal method active</p>
                        <Button asChild variant="link" className="mt-1">
                            <Link href="/my/collection/add">Add Payment Method</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>

       <CardFooter className="p-4 bg-white border-t sticky bottom-0">
        <Button 
            className="w-full h-12 btn-gradient font-bold text-base"
            onClick={handleSell}
            disabled={isSelling || !isAmountValid || !amount || !selectedMethod}
        >
          {isSelling ? <Loader size="sm" className="mr-2" /> : 'Sell Now'}
        </Button>
      </CardFooter>
    </div>
  );
}
