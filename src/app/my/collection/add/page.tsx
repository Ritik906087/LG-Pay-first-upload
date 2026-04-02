
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { Loader } from "@/components/ui/loader";
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/utils";


const upiProviders = ["PhonePe", "Paytm", "MobiKwik", "Freecharge"];

export default function AddUpiPage() {
  const { user, profile, loading } = useSupabaseUser();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [captcha, setCaptcha] = useState("");

  const handleLinkAccount = async () => {
    if (!provider || !name.trim() || !upiId.trim()) {
      toast({
        variant: "destructive",
        title: "All fields are required.",
      });
      return;
    }
    
    if (captcha !== "1234") {
      toast({
        variant: "destructive",
        title: "Invalid Captcha",
        description: "Please enter the correct captcha.",
      });
      return;
    }

    if (!user || !profile) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    // Basic UPI ID validation
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
        toast({ variant: 'destructive', title: 'Invalid UPI ID format.'});
        return;
    }

    setIsSaving(true);

    try {
      const currentMethods = profile.payment_methods || [];
      
      // Check for duplicates
      if (currentMethods.some((method: any) => method.upiId === upiId)) {
          toast({ variant: 'destructive', title: 'This UPI ID is already linked.'});
          setIsSaving(false);
          return;
      }
      if (currentMethods.some((method: any) => method.name === provider)) {
          toast({ variant: 'destructive', title: `A ${provider} account is already linked.`});
          setIsSaving(false);
          return;
      }

      const newMethod = {
        type: 'upi',
        name: provider, // This is the provider name e.g., "PhonePe"
        upiHolderName: name, // This is the account holder's name
        upiId: upiId,
      };

      const { error } = await supabase
        .from('users')
        .update({ payment_methods: [...currentMethods, newMethod] })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${provider} account linked successfully.`,
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
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my/collection">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Link UPI Account</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow space-y-4 p-4">
        <Card>
            <CardHeader>
                <CardTitle>Enter UPI Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="provider">UPI Provider</Label>
                    <Select onValueChange={setProvider} value={provider}>
                        <SelectTrigger id="provider">
                            <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {upiProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                        id="name" 
                        placeholder="Enter the name on the account" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                 </div>
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input 
                        id="upiId" 
                        placeholder="yourname@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="captcha">Captcha</Label>
                    <div className="flex items-center gap-4">
                        <Input 
                            id="captcha" 
                            placeholder="Enter the captcha"
                            value={captcha}
                            onChange={(e) => setCaptcha(e.target.value)}
                        />
                         <div className="flex h-11 items-center justify-center rounded-lg border bg-muted px-4 font-mono text-xl tracking-widest">
                            1234
                        </div>
                    </div>
                 </div>
            </CardContent>
        </Card>
        <Button className="w-full h-12 text-lg font-bold btn-gradient" onClick={handleLinkAccount} disabled={isSaving || loading}>
          {isSaving ? <Loader size="xs" /> : "Link Account"}
        </Button>
      </main>
    </div>
  );
}
