
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Download } from 'lucide-react';

export default function DownloadPage() {
  const apkUrl = "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/public/Lg%20pay/LGPAY.apk";
  const logoUrl = "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/30297-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvMzAyOTctcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NzUxNTM5MTQsImV4cCI6MTgwNjY4OTkxNH0.VfdWT_qcizXAxDiRfArTFBYeStKewpXM3FFwwpZSlPE";

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <main className="flex flex-grow items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in-up rounded-2xl border-none bg-white/90 shadow-2xl shadow-primary/20">
          <CardHeader className="items-center text-center">
             <Image
                src={logoUrl}
                width={160}
                height={50}
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
