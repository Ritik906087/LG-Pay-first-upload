
"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PaymentMethod = {
  name: string;
  logo: string;
  bgColor: string;
};

const paymentMethods: PaymentMethod[] = [
  {
    name: "PhonePe",
    logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/download%20(1).png?alt=media&token=205260a4-bfcf-46dd-8dc6-5b440852f2ae",
    bgColor: "bg-violet-600",
  },
  {
    name: "Paytm",
    logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/download%20(2).png?alt=media&token=1fd9f09a-1f02-4dd9-ab3b-06c756856bd8",
    bgColor: "bg-sky-500",
  },
  {
    name: "MobiKwik",
    logo: "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/download.png?alt=media&token=ffb28e60-0b26-4802-9b54-bc6bbb02f35f",
    bgColor: "bg-blue-600",
  },
];

export default function CollectionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Add Payment Method</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
             <Link href="/my">
                <X className="h-6 w-6 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow space-y-4 p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Select the receiving bank
        </h2>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <Button
              key={method.name}
              className={`flex h-16 w-full items-center justify-start gap-4 rounded-lg px-4 py-2 text-white shadow-md ${method.bgColor}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                <Image
                  src={method.logo}
                  alt={`${method.name} logo`}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-semibold">{method.name}</span>
            </Button>
          ))}
        </div>
      </main>
    </div>
  );
}
