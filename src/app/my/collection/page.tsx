"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PaymentMethod = {
  name: string;
  logo: string;
  bgColor: string;
};

const initialPaymentMethods: (PaymentMethod & { linked: boolean })[] = [
  {
    name: "PhonePe",
    logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/download%20(1).png?alt=media&token=205260a4-bfcf-46dd-8dc6-5b440852f2ae",
    bgColor: "bg-violet-600",
    linked: false,
  },
  {
    name: "Paytm",
    logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/download%20(2).png?alt=media&token=1fd9f09a-1f02-4dd9-ab3b-06c756856bd8",
    bgColor: "bg-sky-500",
    linked: false,
  },
  {
    name: "MobiKwik",
    logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/download.png?alt=media&token=ffb28e60-0b26-4802-9b54-bc6bbb02f35f",
    bgColor: "bg-blue-600",
    linked: false,
  },
];

export default function CollectionPage() {
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { toast } = useToast();

  const handleLinkClick = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsDialogOpen(true);
  };

  const handleSendOtp = () => {
    setIsOtpSending(true);
    setTimeout(() => {
      setIsOtpSending(false);
      setOtpSent(true);
      toast({ title: "OTP Sent!", description: "OTP sent to your number." });
    }, 1500);
  };

  const handleLinkSubmit = () => {
    setIsLinking(true);
    // Mock linking process
    setTimeout(() => {
      setIsLinking(false);
      setIsDialogOpen(false);
      setOtpSent(false);
      
      if (selectedMethod) {
          setPaymentMethods(prevMethods => prevMethods.map(m => 
              m.name === selectedMethod.name ? { ...m, linked: true } : m
          ));
      }

      toast({
        title: "Success!",
        description: `${selectedMethod?.name} has been linked successfully.`,
      });
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Add UPI</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow space-y-4 p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Select the receiving bank
        </h2>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
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
                <span className="text-lg font-semibold">{method.name}</span>
              </div>
              {method.linked ? (
                 <div className="flex items-center justify-center rounded-md bg-green-500/80 px-3 py-1 text-xs font-bold text-white">
                    VERIFIED
                </div>
              ) : (
                <Button
                  onClick={() => handleLinkClick(method)}
                  className="rounded-full bg-white/20 px-6 font-semibold text-white shadow-sm hover:bg-white/30"
                >
                  Link
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>

      {selectedMethod && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold">
                Link {selectedMethod.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Enter your {selectedMethod.name} registered number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Phone Number"
                  className="h-12 text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="otp">OTP</Label>
                <div className="relative flex items-center">
                  <Input
                    id="otp"
                    placeholder="Verification Code"
                    className="h-12 pr-24 text-base"
                    disabled={!otpSent}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="absolute right-2 h-9 text-accent"
                    onClick={handleSendOtp}
                    disabled={isOtpSending}
                  >
                    {isOtpSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                 <Label htmlFor="upiId">Enter your {selectedMethod.name} UPI</Label>
                <Input
                  id="upiId"
                  placeholder="yourname@upi"
                  className="h-12 text-base"
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button
                type="submit"
                onClick={handleLinkSubmit}
                className="w-full h-12 rounded-full btn-gradient font-bold text-base"
                disabled={isLinking || !otpSent}
              >
                {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
