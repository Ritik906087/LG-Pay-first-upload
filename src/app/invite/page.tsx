'use client';

import React from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Gift,
  Clipboard,
} from 'lucide-react';
import Image from 'next/image';

const GlassCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Card
    className={'border bg-white shadow-sm ' + className}
  >
    {children}
  </Card>
);

export default function InvitePage() {
  return (
    <div className="min-h-screen text-foreground pb-24">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 sticky top-0 z-10 border-b">
        <div className="w-8"></div>
        <h1 className="text-xl font-bold">Invitation Bonus</h1>
        <div className="w-8"></div>
      </header>

      <main className="space-y-4 p-4">
        <GlassCard>
            <CardContent className="p-4 space-y-4">
                <div className="rounded-lg overflow-hidden">
                    <Image src="https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/file_000000002968720686f855daed13e880.png?alt=media&token=c4dece97-7dee-41c4-bac7-6c1f9f186fb6" width={400} height={150} alt="Invite friends" className="w-full" />
                </div>
                <h3 className="font-bold text-center">Invite friends to join LG Pay, rewards credited instantly</h3>
                
                <div className="space-y-4 text-sm text-foreground">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <h4 className="font-bold text-primary">लेवल 1 team (Lv 1)</h4>
                        <p className="mt-1 text-primary/80">ये वे दोस्त हैं जिन्हें आप सीधे आमंत्रित करते हैं। जब वे ARB खरीदते हैं, तो आपको <span className="font-bold">+2%</span> बोनस मिलेगा।</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                        <h4 className="font-bold text-accent">लेवल 2 team (Lv 2)</h4>
                        <p className="mt-1 text-accent/80">ये वे दोस्त हैं जिन्हें आपके लेवल 1 दोस्त आमंत्रित करते हैं। जब वे ARB खरीदते हैं, तो आपको फिर भी <span className="font-bold">+1%</span> बोनस मिलेगा।</p>
                    </div>
                </div>

                <p className="text-xs text-center text-yellow-700 bg-yellow-100 p-2 rounded-md">Note: The more your team trades, the more you earn. Bonuses are credited instantly.</p>
                <Button className="w-full btn-gradient rounded-full font-semibold">Invite Now</Button>
                <Button variant="ghost" className="w-full text-muted-foreground">View Invitation Data</Button>
            </CardContent>
        </GlassCard>
      </main>
    </div>
  );
}

    
