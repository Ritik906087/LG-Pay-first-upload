"use client";
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Headphones,
  User,
  RefreshCw,
  X,
  ArrowRight,
  History,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <Card className={cn("border-none bg-white/10 shadow-2xl shadow-primary/10 backdrop-blur-lg", className)}>
    {children}
  </Card>
);


export default function HomePage() {
  const quickActions = [
    { icon: ArrowDownToLine, label: 'Buy rules' },
    { icon: ArrowUpFromLine, label: 'Sell rules' },
    { icon: Headphones, label: 'Help Center' },
    { icon: User, label: 'User' },
  ];

  return (
    <div className="flex flex-col pb-24 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-gradient">LG Pay</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
            <RefreshCw className="h-5 w-5 text-white/80" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
            <X className="h-5 w-5 text-white/80" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow space-y-6 p-4 pt-2">
        {/* My Total Assets */}
        <GlassCard>
          <CardContent className="p-4">
            <p className="text-sm font-normal text-white/70">
              My total assets
            </p>
            <p className="text-3xl font-bold text-white">2.00 LG</p>
          </CardContent>
        </GlassCard>

        {/* Platform Notice */}
        <Carousel className="w-full">
          <CarouselContent>
            {Array.from({ length: 3 }).map((_, index) => (
              <CarouselItem key={index}>
                <GlassCard className="overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <p className="text-xs text-white/70">
                        Platform Notice
                      </p>
                      <h3 className="text-lg font-bold text-white">Key Information</h3>
                      <Link
                        href="#"
                        className="flex items-center text-sm font-semibold text-yellow-300"
                      >
                        View Details <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                    <Image
                      src="https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/wallet.png?alt=media&token=7e8e6e58-6a4a-4368-bd69-6523918f6562"
                      alt="Wallet with coins"
                      width={100}
                      height={60}
                      data-ai-hint="wallet coins"
                      className="object-contain"
                    />
                  </div>
                </GlassCard>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 text-center">
          {quickActions.map((action) => (
            <div
              key={action.label}
              className="flex flex-col items-center gap-2"
            >
              <Button
                variant="ghost"
                className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20"
              >
                <action.icon className="h-6 w-6 text-white/80" />
              </Button>
              <span className="text-xs text-white/80">
                {action.label}
              </span>
            </div>
          ))}
        </div>

        {/* Buy/Sell Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none bg-gradient-to-br from-yellow-300/80 to-yellow-500/80 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-yellow-900">Buy LG</h3>
                  <p className="text-xs text-yellow-800">
                    Flexible purchasing
                  </p>
                </div>
                <div className="rounded-md bg-white/30 p-2">
                  <ArrowDownToLine className="h-5 w-5 text-yellow-900" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-gradient-to-br from-green-300/80 to-green-500/80 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-green-900">Sell LG</h3>
                  <p className="text-xs text-green-800">Efficient and fast</p>
                </div>
                <div className="rounded-md bg-white/30 p-2">
                  <ArrowUpFromLine className="h-5 w-5 text-green-900" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders in Progress */}
        <div className="flex items-center justify-center gap-2 text-sm text-white/70">
          <History className="h-5 w-5" />
          <span>You have 0 orders in progress</span>
        </div>
        
        <div className="flex justify-center pt-4">
            <Image src="https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/clipboard.png?alt=media&token=e918e69d-21e1-4c6e-b72e-33513a8f5791" width={100} height={120} alt="Clipboard" className="opacity-30" data-ai-hint="clipboard empty"/>
        </div>
      </main>
    </div>
  );
}
