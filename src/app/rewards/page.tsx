
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  Award,
  Users,
  Gift,
  BadgeHelp,
  Clipboard,
  Trophy,
  Inbox,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const GlassCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Card
    className={cn(
      'border bg-white shadow-sm',
      className
    )}
  >
    {children}
  </Card>
);

const LevelIcon = ({
  level,
  isActive,
  isLocked,
}: {
  level: string;
  isActive?: boolean;
  isLocked?: boolean;
}) => (
  <div className="flex flex-col items-center gap-2">
    <div
      className={cn(
        'relative flex h-14 w-14 items-center justify-center rounded-full bg-secondary',
        isActive && 'bg-yellow-400',
        isLocked && 'opacity-50'
      )}
    >
      <Trophy
        className={cn(
          'h-8 w-8',
          isActive ? 'text-yellow-900' : 'text-muted-foreground'
        )}
      />
    </div>
    <span
      className={cn(
        'text-xs font-semibold',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {level}
    </span>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Inbox className="h-12 w-12 opacity-50" />
        <p className="mt-4 text-base">{message}</p>
    </div>
)

export default function RewardsPage() {
  return (
    <div className="min-h-screen text-foreground pb-24">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 sticky top-0 z-10 border-b">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Link href="/home">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Rewards</h1>
        <div className="w-8"></div>
      </header>

      <main className="space-y-4 p-4">
        {/* Reward Claimed */}
        <GlassCard className="bg-yellow-50">
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-yellow-500" />
              <p className="text-sm font-semibold">
                Reward Claimed <span className="font-bold text-yellow-600">0 LG</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-muted-foreground"
            >
              <BadgeHelp className="h-4 w-4" />
              Rules
            </Button>
          </CardContent>
        </GlassCard>

        {/* Current Level Card */}
        <GlassCard className="overflow-hidden bg-gradient-to-br from-yellow-100 to-yellow-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-yellow-800">
                Current Level
              </CardTitle>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/50">
                 <Trophy className="h-9 w-9 text-yellow-700" />
              </div>
            </div>
            <p className="text-4xl font-bold text-yellow-900">LV0</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Progress value={0} className="h-2 bg-black/10" />
              <div className="flex justify-between text-xs font-medium text-yellow-800">
                <span>LV0</span>
                <span>LV1</span>
              </div>
            </div>
            <div className="grid grid-cols-3 text-center">
              <div>
                <p className="font-bold text-yellow-900">0</p>
                <p className="text-xs text-yellow-800">Valid Trading Volume</p>
              </div>
              <div>
                <p className="font-bold text-yellow-900">0</p>
                <p className="text-xs text-yellow-800">Successful Buy Count</p>
              </div>
              <div>
                <p className="font-bold text-yellow-900">0</p>
                <p className="text-xs text-yellow-800">Successful Sell Count</p>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* Level Selector */}
        <div className="grid grid-cols-5 gap-2 px-2">
          <LevelIcon level="LV0" isActive />
          <LevelIcon level="LV1" isLocked />
          <LevelIcon level="LV2" isLocked />
          <LevelIcon level="LV3" isLocked />
          <LevelIcon level="LV4" isLocked />
        </div>
        
        <Tabs defaultValue="task" className="w-full">
           <TabsList className="grid w-full grid-cols-2 bg-secondary h-12 rounded-xl p-1">
            <TabsTrigger value="task" className="text-base data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg">Task</TabsTrigger>
            <TabsTrigger value="invite" className="text-base data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg">Invite</TabsTrigger>
          </TabsList>
          <TabsContent value="task" className="space-y-4">
            <GlassCard>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-bold">VIP Tasks</CardTitle>
                        <Button variant="link" className="text-yellow-500 p-0 h-auto">VIP Zone ▸</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <EmptyState message="No VIP tasks available right now." />
                </CardContent>
            </GlassCard>
            <GlassCard>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Daily Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                     <EmptyState message="No daily tasks available. Check back tomorrow!" />
                </CardContent>
            </GlassCard>
             <GlassCard>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Reward getting member</CardTitle>
                </CardHeader>
                <CardContent>
                    <EmptyState message="No recent rewards." />
                </CardContent>
            </GlassCard>
          </TabsContent>
          <TabsContent value="invite">
            <GlassCard>
                <CardContent className="p-4 space-y-4">
                    <div className="rounded-lg overflow-hidden">
                        <Image src="https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/file_000000002968720686f855daed13e880.png?alt=media&token=c4dece97-7dee-41c4-bac7-6c1f9f186fb6" width={400} height={150} alt="Invite friends" className="w-full" />
                    </div>
                    <h3 className="font-bold text-center">Invite friends to join LG Pay, rewards credited instantly</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-3">
                            <Clipboard className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" />
                            <span>Click "Invite Now" to share your exclusive link or poster.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Users className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" />
                            <span>Friends register via the link or QR code and complete their first trade.</span>
                        </li>
                         <li className="flex items-start gap-3">
                            <Gift className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" />
                            <span>Invited users can unlock exclusive tasks and get extra rewards.</span>
                        </li>
                    </ul>
                    <p className="text-xs text-center text-yellow-700 bg-yellow-100 p-2 rounded-md">Note: Reach LV3 (VIP) to unlock extra rewards and rebates.</p>
                    <Button className="w-full btn-gradient rounded-full font-semibold">Invite Now</Button>
                    <Button variant="ghost" className="w-full text-muted-foreground">View Invitation Data</Button>
                </CardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
