"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { Loader } from "@/components/ui/loader";
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/utils";
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type UpiProvider = {
    name: string;
    logo: string;
    color: string;
    status: 'active' | 'maintenance';
};

const upiProviders: UpiProvider[] = [
    {
        name: "PhonePe",
        logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(4).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDQpLnBuZyIsImlhdCI6MTc3NTE0ODYyMSwiZXhwIjoxODA2Njg0NjIxfQ.b_cMHhiCw52krGt2edtt1k5C1Keo8uGJwYIWpe6vZVo",
        color: "bg-violet-600",
        status: "active"
    },
    {
        name: "Paytm",
        logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(5).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDUpLnBuZyIsImlhdCI6MTc3NTE0ODYzMiwiZXhwIjoxODA2Njg0NjMyfQ.QXSbgSLV3ULTcV3ss9Co9ZMe1oj3tb9bR_OP8xY-Nds",
        color: "bg-sky-500",
        status: "active"
    },
    {
        name: "MobiKwik",
        logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDEpLnBuZyIsImlhdCI6MTc3NTE0ODU3MywiZXhwIjoxODA2Njg0NTczfQ.m8Z7gn5FV-0ss58kTEUZ833u8Wv_bFun3YZeZtyIa9s",
        color: "bg-blue-600",
        status: "active"
    },
    {
        name: "Freecharge",
        logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(3).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDMpLnBuZyIsImlhdCI6MTc3NTE0ODYwOSwiZXhwIjoxODA2Njg0NjA5fQ.pus8pOlgEXCFb2pjIzNsVtU9DxnIxEeaVaeR3TuIQPc",
        color: "bg-orange-500",
        status: "active"
    },
    {
        name: "Airtel",
        logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(2).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDIpLnBuZyIsImlhdCI6MTc3NTE0ODU5OSwiZXhwIjoxODA2Njg0NTk5fQ.yDb5CBUsF_MCejlDIzrQVjg6IMylJbAzEmHFaozfNjE",
        color: "bg-red-500",
        status: "maintenance"
    }
];

export default function AddUpiPage() {
  const { user, profile, loading } = useSupabaseUser();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<UpiProvider | null>(null);

  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [phone, setPhone] = useState("");

  const handleOpenDialog = (provider: UpiProvider) => {
    if (provider.status === 'maintenance') {
      toast({
        variant: 'destructive',
        title: 'Under Maintenance',
        description: `${provider.name} is temporarily unavailable.`
      });
      return;
    }
    setSelectedProvider(provider);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setName("");
    setUpiId("");
    setPhone("");
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setDialogOpen(open);
  };

  const handleLinkAccount = async () => {
    if (!selectedProvider || !name.trim() || !upiId.trim() || !phone.trim()) {
      toast({
        variant: "destructive",
        title: "All fields are required.",
      });
      return;
    }
    
    if (!user || !profile) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    if (phone !== profile.phone_number) {
        toast({
          variant: "destructive",
          title: "Invalid Phone Number",
          description: "Please enter the phone number associated with your account.",
        });
        return;
    }

    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
        toast({ variant: 'destructive', title: 'Invalid UPI ID format.'});
        return;
    }

    setIsSaving(true);

    try {
      const currentMethods = profile.payment_methods || [];
      
      if (currentMethods.some((method: any) => method.upiId === upiId)) {
          toast({ variant: 'destructive', title: 'This UPI ID is already linked.'});
          setIsSaving(false);
          return;
      }
      if (currentMethods.some((method: any) => method.name === selectedProvider.name)) {
          toast({ variant: 'destructive', title: `A ${selectedProvider.name} account is already linked.`});
          setIsSaving(false);
          return;
      }

      const newMethod = {
        type: 'upi',
        name: selectedProvider.name,
        upiHolderName: name,
        upiId: upiId,
      };

      const { error } = await supabase
        .from('users')
        .update({ payment_methods: [...currentMethods, newMethod] })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${selectedProvider.name} account linked successfully.`,
      });
      router.push('/my/collection');

    } catch (error: any) {
        console.error("Error linking account:", error);
        toast({
            variant: "destructive",
            title: "Failed to link account",
            description: error.message || "Please try again."
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my/collection">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Add Payment Method</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow space-y-4 p-4">
        <p className="text-sm font-semibold text-muted-foreground">Select the receiving UPI to link</p>
        {upiProviders.map((provider) => (
            <div
                key={provider.name}
                onClick={() => handleOpenDialog(provider)}
                className={cn(
                    "flex h-16 w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-2 text-white shadow-md transition-transform active:scale-95",
                    provider.color,
                    provider.status === 'maintenance' && 'cursor-not-allowed opacity-70'
                )}
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1">
                    <Image
                        src={provider.logo}
                        alt={`${provider.name} logo`}
                        width={32}
                        height={32}
                        className="object-contain"
                    />
                    </div>
                    <span className="text-lg font-semibold">{provider.name}</span>
                </div>
                <div className={cn(
                    "flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-bold",
                     provider.status === 'active' ? 'bg-white/20' : 'bg-white text-red-500'
                )}>
                    {provider.status === 'active' ? 'Link' : 'MAINTENANCE'}
                </div>
            </div>
        ))}
      </main>
    </div>

    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Link {selectedProvider?.name} Account</DialogTitle>
                <DialogDescription>Enter your UPI details to link your account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                        id="name" 
                        placeholder="Enter the name on the account" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSaving}
                    />
                 </div>
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input 
                        id="upiId" 
                        placeholder="yourname@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        disabled={isSaving}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        placeholder="Enter your registered phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isSaving}
                        type="tel"
                        maxLength={10}
                    />
                 </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => handleDialogChange(false)}>Cancel</Button>
                <Button onClick={handleLinkAccount} disabled={isSaving || loading}>
                    {isSaving ? <Loader size="xs" /> : "Link Account"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
