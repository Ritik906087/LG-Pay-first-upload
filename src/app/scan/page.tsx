"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  QrCode,
  Flashlight,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ScanPage() {
  const [isFlashOn, setIsFlashOn] = useState(false);

  return (
    <div className="relative min-h-screen text-white bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between bg-black/50 p-4 backdrop-blur-sm">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-white/10"
        >
          <Link href="/home">
            <ChevronLeft className="h-6 w-6 text-white" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Scan QR Code</h1>
        <div className="w-10"></div>
      </header>

      {/* QR Scanner Area */}
      <main className="flex h-screen flex-col items-center justify-center">
        <div className="relative h-64 w-64 animate-fade-in">
          <div className="absolute inset-0 border-4 border-white/80 rounded-2xl"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <QrCode className="h-32 w-32 text-white/20" />
          </div>
           <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-center w-full">
            <p className="text-white/80">Align QR code within frame to scan</p>
          </div>
        </div>
      </main>

       {/* Bottom Controls */}
      <footer className="fixed bottom-0 left-0 right-0 flex justify-center gap-12 bg-black/50 p-6 backdrop-blur-sm">
        <Button variant="ghost" className="flex-col h-auto text-white/80 hover:text-white" onClick={() => setIsFlashOn(!isFlashOn)}>
            <Flashlight className={`h-7 w-7 mb-1 ${isFlashOn ? 'text-yellow-400' : ''}`} />
            <span>{isFlashOn ? 'Flash On' : 'Flash Off'}</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto text-white/80 hover:text-white">
            <ImageIcon className="h-7 w-7 mb-1" />
            <span>Album</span>
        </Button>
      </footer>
    </div>
  );
}
