
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';

export default function DownloadPage() {
  const apkUrl = "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/LGPAY.apk?alt=media&token=d71496e3-9732-441e-be40-9f7ebbd23e66";
  const logoUrl = "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/file_000000002968720686f855daed13e880.png?alt=media&token=c4dece97-7dee-41c4-bac7-6c1f9f186fb6";

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Download App</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex flex-grow items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in-up rounded-2xl border-none bg-white/90 shadow-2xl shadow-primary/20">
          <CardHeader className="items-center text-center">
             <Image
                src={logoUrl}
                width={120}
                height={120}
                alt="LG Pay Logo"
              />
            <CardTitle className="text-2xl font-bold pt-4">Download LG Pay</CardTitle>
            <CardDescription>
              Secure and fast digital payments platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild size="lg" className="h-14 w-full text-lg font-bold btn-gradient">
              <a href={apkUrl} download>
                <Download className="mr-2 h-5 w-5" />
                Download APK
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
