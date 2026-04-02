
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Download } from 'lucide-react';

export default function DownloadPage() {
  const apkUrl = "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/LGPAY.apk?alt=media&token=d71496e3-9732-441e-be40-9f7ebbd23e66";
  const logoUrl = "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224708_385.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDcwOF8zODUuanBnIiwiaWF0IjoxNzc1MTUwMzQwLCJleHAiOjE4MDY2ODYzNDB9.g69doGZuYs7EbHQ5ngFHWSxbu_dNyknLSBVLpM5_byQ";

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <main className="flex flex-grow items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in-up rounded-2xl border-none bg-white/90 shadow-2xl shadow-primary/20">
          <CardHeader className="items-center text-center">
             <Image
                src={logoUrl}
                width={120}
                height={120}
                alt="LG Pay Logo"
                className="rounded-full"
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
