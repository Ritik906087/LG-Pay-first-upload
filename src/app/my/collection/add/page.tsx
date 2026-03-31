
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Landmark, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentMethod = {
  name: string;
  logo: string;
  bgColor: string;
  maintenance?: boolean;
};

const initialPaymentMethods: PaymentMethod[] = [
  { name: "PhonePe", logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/Phonepay.png?alt=media&token=579a228d-121f-4d5b-933d-692d791dec2f", bgColor: "bg-violet-600" },
  { name: "Paytm", logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/download%20(2).png?alt=media&token=1fd9f09a-1f02-4dd9-ab3b-06c756856bd8", bgColor: "bg-sky-500" },
  { name: "MobiKwik", logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/MobiKwik.png?alt=media&token=bf924e98-9b78-459d-8eb7-396c305a11d7", bgColor: "bg-blue-600" },
  { name: "Freecharge", logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/download.png?alt=media&token=fab572ac-b45e-4c62-8276-8c87108756e4", bgColor: "bg-orange-500" },
  { name: "Airtel", logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/Airtel%2001.png?alt=media&token=357342fd-85df-43c1-a7fb-d9d57315df1d", bgColor: "bg-red-500", maintenance: true },
];

export default function AddCollectionPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ id: string; short_url: string } | null>(null);

  const userProfileRef = useMemo(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, loading: profileLoading } = useDoc<{ paymentMethods?: any[] }>(userProfileRef);

  const previousMethodsRef = useRef<any[] | undefined>();

  useEffect(() => {
    if (isPaymentDialogOpen) {
      previousMethodsRef.current = userProfile?.paymentMethods;
    }
  }, [isPaymentDialogOpen, userProfile?.paymentMethods]);

  useEffect(() => {
    if (!isPaymentDialogOpen || !userProfile || !previousMethodsRef.current || !selectedMethod) return;

    const previouslyLinked = previousMethodsRef.current.some(pm => pm.name === selectedMethod.name);
    const newlyLinked = userProfile.paymentMethods?.some(pm => pm.name === selectedMethod.name);

    if (!previouslyLinked && newlyLinked) {
      toast({
        title: "Success!",
        description: `${selectedMethod.name} has been linked successfully.`,
        className: 'bg-green-100 border-green-400 text-green-800'
      });
      setIsPaymentDialogOpen(false);
      setPaymentDetails(null);
      setSelectedMethod(null);
    }
  }, [userProfile, isPaymentDialogOpen, selectedMethod, toast]);

  const handleLinkClick = async (method: PaymentMethod) => {
    if (isLoadingPayment) return;
    if (!user) {
      toast({ variant: "destructive", title: "Please log in to link an account." });
      return;
    }

    if (userProfile?.paymentMethods?.some(pm => pm.name === method.name)) {
      toast({ title: "Already Linked", description: `Your ${method.name} account is already linked.` });
      return;
    }

    setSelectedMethod(method);
    setIsLoadingPayment(true);
    try {
      const response = await fetch('/api/create-upi-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, methodName: method.name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment link.');
      }

      const data = await response.json();
      setPaymentDetails(data);
      setIsPaymentDialogOpen(true);
    } catch (error) {
      console.error("Error creating payment link:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not initiate UPI linking. Please try again." });
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const loading = userLoading || profileLoading;

  return (
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
        <h2 className="text-sm font-semibold text-muted-foreground pt-2">
          Select the receiving UPI to link
        </h2>
        <div className="space-y-3">
          {initialPaymentMethods.map((method) => (
            <div
              key={method.name}
              className={`flex h-20 w-full items-center justify-between gap-4 rounded-xl px-4 py-2 text-white shadow-md ${method.bgColor}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1">
                  <Image
                    src={method.logo}
                    alt={`${method.name} logo`}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="text-lg font-semibold">{method.name}</span>
                </div>
              </div>
              {method.maintenance ? (
                <div className="rounded-md bg-orange-100 px-3 py-1.5 text-xs font-bold uppercase text-orange-600">
                  Maintenance
                </div>
              ) : (
                <Button
                  onClick={() => handleLinkClick(method)}
                  className="rounded-full bg-white/20 px-6 font-semibold text-white shadow-sm hover:bg-white/30"
                  disabled={isLoadingPayment && selectedMethod?.name === method.name}
                >
                  {isLoadingPayment && selectedMethod?.name === method.name ? <Loader size="xs" /> : "Link"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Link {selectedMethod?.name}</DialogTitle>
            <DialogDescription className="text-center">
              Scan the QR code to complete a ₹1 payment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative rounded-lg border-4 border-primary p-2 bg-white">
              {paymentDetails ? (
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(paymentDetails.short_url)}&size=200x200&qzone=2`}
                  width={200}
                  height={200}
                  alt="UPI QR Code"
                />
              ) : <Skeleton className="h-[200px] w-[200px]" />}
            </div>
            <p className="text-xl font-bold">Pay ₹1.00</p>
            <div className="flex items-start gap-3 rounded-lg bg-orange-100 p-3 text-orange-800 text-sm">
              <Info className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                <b>Important:</b> Pay only from the UPI app you wish to link. Using a different app may link the wrong UPI ID.
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground pt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for payment confirmation...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
