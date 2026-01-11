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
  RefreshCw,
  X,
  ChevronRight,
  Copy,
  ShieldCheck,
  Star,
  Lock,
  MessageSquareWarning,
  ScrollText,
  BookUser,
  Book,
  FileText,
  Settings,
  Megaphone,
  LifeBuoy,
  Globe,
  PartyPopper,
  LogOut,
  HelpCircle,
  Users
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const GlassCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Card
    className={cn(
      'border-none bg-white/10 shadow-lg backdrop-blur-md',
      className
    )}
  >
    {children}
  </Card>
);

const actionItems = [
    { icon: ShieldCheck, label: "Real-name" },
    { icon: Star, label: "Collection" },
    { icon: Lock, label: "Payment Password" },
    { icon: MessageSquareWarning, label: "My Appeal" },
    { icon: ScrollText, label: "Transaction" },
    { icon: BookUser, label: "User Guidelines" },
    { icon: Book, label: "Buying Tutorial" },
    { icon: FileText, label: "Selling Tutorial" },
    { icon: Settings, label: "Settings" },
]

const listItems = [
    { icon: Megaphone, label: "Announcement" },
    { icon: ShieldCheck, label: "Security Center" },
    { icon: HelpCircle, label: "Help Center" },
    { icon: Globe, label: "Language" },
    { icon: PartyPopper, label: "Activity" },
]


export default function MyPage() {
  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="flex items-center justify-between bg-transparent p-4">
        <div className="w-8"></div>
        <h1 className="text-xl font-bold text-white">ARWallet</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10"
          >
            <RefreshCw className="h-5 w-5 text-white/80" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10"
          >
            <Link href="/home">
              <X className="h-5 w-5 text-white/80" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="space-y-4 p-4">
        {/* User Info */}
        <GlassCard>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/80">
                <span className="text-2xl font-bold text-yellow-900">A</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">QPVWBOHC</h2>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span>UID:8104617</span>
                  <Copy className="h-3 w-3" />
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/70" />
          </CardContent>
        </GlassCard>
        
        {/* Asset Card */}
        <Card className="border-none bg-slate-800/60 text-white shadow-lg backdrop-blur-md">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <span>Not Verified</span>
                        <span className="text-yellow-400">Verify Now</span>
                    </div>
                    <span className="rounded-full bg-yellow-500/30 px-2 py-0.5 text-yellow-300">LV0</span>
                </div>
                <p className="text-sm text-white/70">Total Asset Valuation</p>
                <p className="text-2xl font-bold">2.00 ARB</p>
                <div className="flex justify-between text-sm text-white/70">
                    <span>≈ 0.00</span>
                    <span>0.00</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Wallet Address:</span>
                    <div className="flex items-center gap-2">
                        <p className="truncate font-mono">1GsdoAyBtYCydjhSw7EtEXfPHUEffEz6KG</p>
                        <Copy className="h-3 w-3" />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Reward/Team Center */}
        <div className="grid grid-cols-2 gap-4">
            <GlassCard>
                <CardContent className="flex items-center justify-center gap-2 p-3">
                    <Star className="h-5 w-5 text-yellow-400"/>
                    <span className="font-semibold">Reward Card</span>
                </CardContent>
            </GlassCard>
            <GlassCard>
                <CardContent className="flex items-center justify-center gap-2 p-3">
                    <Users className="h-5 w-5 text-primary"/>
                    <span className="font-semibold">Team Center</span>
                </CardContent>
            </GlassCard>
        </div>

        {/* Actions Grid */}
        <GlassCard>
            <CardContent className="grid grid-cols-3 gap-y-6 gap-x-2 p-4 text-center">
                {actionItems.map(item => (
                    <div key={item.label} className="flex flex-col items-center gap-2">
                        <item.icon className="h-6 w-6 text-white/80" />
                        <span className="text-xs text-white/80">{item.label}</span>
                    </div>
                ))}
            </CardContent>
        </GlassCard>

        {/* List Items */}
        <GlassCard>
            <CardContent className="p-2">
                {listItems.map(item => (
                     <div key={item.label} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10">
                        <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-white/80" />
                            <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-white/50" />
                    </div>
                ))}
            </CardContent>
        </GlassCard>

        {/* Logout Button */}
        <Button className="w-full h-12 bg-yellow-500 text-yellow-900 font-bold text-base hover:bg-yellow-600 rounded-lg">
            <LogOut className="h-5 w-5 mr-2"/>
            Logout
        </Button>
      </main>
    </div>
  );
}
