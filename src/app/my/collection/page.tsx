
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { Loader } from "@/components/ui/loader";
import { useLanguage } from "@/context/language-context";

type LinkedPaymentMethod = {
  name: string;
  upiId: string;
  type: 'upi' | 'bank';
  bankName?: string;
  accountNumber?: string;
};

const paymentMethodDetails: { [key: string]: { logo: string; bgColor: string } } = {
  PhonePe: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(4).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDQpLnBuZyIsImlhdCI6MTc3NTE0ODYyMSwiZXhwIjoxODA2Njg0NjIxfQ.b_cMHhiCw52krGt2edtt1k5C1Keo8uGJwYIWpe6vZVo", bgColor: "bg-violet-600" },
  Paytm: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(5).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDUpLnBuZyIsImlhdCI6MTc3NTE0ODYzMiwiZXhwIjoxODA2Njg0NjMyfQ.QXSbgSLV3ULTcV3ss9Co9ZMe1oj3tb9bR_OP8xY-Nds", bgColor: "bg-sky-500" },
  MobiKwik: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDEpLnBuZyIsImlhdCI6MTc3NTE0ODU3MywiZXhwIjoxODA2Njg0NTczfQ.m8Z7gn5FV-0ss58kTEUZ833u8Wv_bFun3YZeZtyIa9s", bgColor: "bg-blue-600" },
  Freecharge: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(3).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDMpLnBuZyIsImlhdCI6MTc3NTE0ODYwOSwiZXhwIjoxODA2Njg0NjA5fQ.pus8pOlgEXCFb2pjIzNsVtU9DxnIxEeaVaeR3TuIQPc", bgColor: "bg-orange-500" },
  Airtel: { logo: "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/download%20(2).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvZG93bmxvYWQgKDIpLnBuZyIsImlhdCI6MTc3NTE0ODU5OSwiZXhwIjoxODA2Njg0NTk5fQ.yDb5CBUsF_MCejlDIzrQVjg6IMylJbAzEmHFaozfNjE", bgColor: "bg-red-500" },
};

export default function CollectionPage() {
  const { profile: userProfile, loading: profileLoading } = useSupabaseUser();
  const { translations } = useLanguage();

  const linkedMethods = userProfile?.payment_methods || [];

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">{translations.collection}</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow space-y-4 p-4">
        {profileLoading ? (
            <div className="flex items-center justify-center pt-20">
                <Loader size="md" />
            </div>
        ) : linkedMethods.length > 0 ? (
            <div className="space-y-3">
              {linkedMethods.map((method: LinkedPaymentMethod, index) => {
                const details = paymentMethodDetails[method.name];
                if (!details) return null;
                return (
                  <div
                    key={method.upiId || index}
                    className={`flex h-20 w-full items-center justify-between gap-4 rounded-xl px-4 py-2 text-white shadow-md ${details.bgColor}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1">
                        <Image
                          src={details.logo}
                          alt={`${method.name} logo`}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">{method.name}</span>
                        <p className="text-xs font-mono text-white/80">{method.upiId}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center rounded-md bg-green-500/80 px-3 py-1.5 text-xs font-bold uppercase text-white">
                        ACTIVATED
                    </div>
                  </div>
                );
              })}
            </div>
        ) : (
             <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
                <Wallet className="h-16 w-16 opacity-30" />
                <p className="mt-4 text-lg font-medium">No UPI accounts linked.</p>
                <p className="text-sm">Click below to add a new account.</p>
            </div>
        )}

        <Link href="/my/collection/add" className="block !mt-6">
          <Card className="bg-white">
            <CardContent className="flex items-center justify-center gap-3 p-4">
              <div className="grid h-6 w-6 place-items-center rounded-full bg-muted text-muted-foreground">
                <Plus className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground">Add payment UPI</span>
            </CardContent>
          </Card>
        </Link>
      </main>
    </div>
  );
}
