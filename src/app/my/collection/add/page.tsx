
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Info, Loader2, CheckCircle, Copy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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

const VerificationDialog = ({
  open,
  onOpenChange,
  paymentDetails,
  methodName
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentDetails: { qr_id: string; image_url: string } | null;
  methodName: string | null;
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<'waiting' | 'paid' | 'failed'>('waiting');
  const [paidData, setPaidData] = useState<any>(null);

  useEffect(() => {
    // Reset state when dialog opens
    if (open) {
      setStatus('waiting');
      setPaidData(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !paymentDetails?.qr_id || status === 'paid') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/verify-payment?qr_id=${paymentDetails.qr_id}`);
        if (!res.ok) return; // Don't stop polling on server error

        const data = await res.json();
        if (data.paid) {
          setStatus('paid');
          setPaidData(data);
          clearInterval(interval);
          toast({
            title: "Success!",
            description: `${methodName} has been linked successfully.`,
            className: 'bg-green-100 border-green-400 text-green-800'
          });
          setTimeout(() => onOpenChange(false), 3000); // Auto-close after 3s
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [open, paymentDetails, onOpenChange, status, methodName, toast]);

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };


  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-gray-800/50 p-6 text-white shadow-2xl">
          {status === 'waiting' && (
            <>
              <h2 className="text-center text-xl font-bold">Link {methodName}</h2>
              <p className="text-center text-sm text-white/70">Scan the QR code to pay ₹1</p>
              <div className="my-6 flex flex-col items-center gap-4">
                <div className="rounded-lg border-4 border-primary bg-white p-2">
                  <Image
                    src={paymentDetails?.image_url ?? ''}
                    width={200}
                    height={200}
                    alt="UPI QR Code"
                  />
                </div>
                <p className="text-2xl font-bold">Pay ₹1.00</p>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-orange-500/20 p-3 text-orange-200 text-sm">
                <Info className="mt-0.5 h-5 w-5 shrink-0" />
                <p><b>Important:</b> Pay only from {methodName}. Using a different app may link the wrong UPI ID.</p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-white/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Waiting for payment...</span>
              </div>
            </>
          )}

          {status === 'paid' && (
            <div className="flex flex-col items-center gap-4 text-center animate-fade-in-up">
              <CheckCircle className="h-20 w-20 text-green-400" />
              <h2 className="text-2xl font-bold">Verified!</h2>
              <p className="text-white/80">Your {methodName} account is now linked.</p>
              <div className="w-full space-y-2 rounded-lg bg-black/30 p-3 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">UPI ID:</span>
                  <span className="font-mono">{paidData?.payer_vpa}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-white/60">Payment ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs break-all text-right">{paidData?.razorpay_payment_id}</span>
                    <Copy className="h-3.5 w-3.5 cursor-pointer" onClick={() => copyToClipboard(paidData?.razorpay_payment_id)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
};


export default function AddCollectionPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ qr_id: string; image_url: string } | null>(null);

  const userProfileRef = useMemo(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, loading: profileLoading } = useDoc<{ paymentMethods?: any[] }>(userProfileRef);

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

    setSelectedMethod(method.name);
    setIsLoadingPayment(true);

    try {
      // Calls the Cloud Function endpoint
      const response = await fetch('/api/create-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, methodName: method.name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment QR code.');
      }

      const data = await response.json();
      setPaymentDetails(data);
      setIsPaymentDialogOpen(true);
    } catch (error) {
      console.error("Error creating payment QR code:", error);
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
        {loading ? (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
        ) : (
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
                      disabled={isLoadingPayment && selectedMethod === method.name}
                    >
                      {isLoadingPayment && selectedMethod === method.name ? <Loader size="xs" /> : "Link"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
        )}
      </main>

      <VerificationDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        paymentDetails={paymentDetails}
        methodName={selectedMethod}
      />
    </div>
  );
}
