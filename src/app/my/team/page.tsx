
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, RefreshCw, X, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';

type Agent = {
  uid: string;
  photoURL?: string;
  online: boolean;
  rebate: number;
  subordinates: number;
};

// Placeholder data similar to the image
const dummyAgentsLv1: Agent[] = [
  { uid: '17549362', online: false, rebate: 0, subordinates: 0 },
  { uid: '16948000', online: false, rebate: 0, subordinates: 0 },
  { uid: '16465543', online: false, rebate: 0, subordinates: 0 },
  { uid: '16209957', online: false, rebate: 0, subordinates: 0 },
  { uid: '16160664', photoURL: 'https://picsum.photos/seed/16160664/100/100', online: false, rebate: 202, subordinates: 0 },
  { uid: '15452250', online: false, rebate: 0, subordinates: 0 },
  { uid: '15192302', photoURL: 'https://picsum.photos/seed/15192302/100/100', online: false, rebate: 320, subordinates: 0 },
  { uid: '14587879', online: false, rebate: 0, subordinates: 0 },
];

const dummyAgentsLv2: Agent[] = [
    { uid: '13549362', online: true, rebate: 50, subordinates: 2 },
    { uid: '12948000', photoURL: 'https://picsum.photos/seed/12948000/100/100', online: false, rebate: 150, subordinates: 5 },
];


const AgentItem = ({ agent }: { agent: Agent }) => (
    <div className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
            <AvatarImage src={agent.photoURL} alt={`Avatar for UID ${agent.uid}`} />
            <AvatarFallback className="bg-primary/10 text-primary">
                <UsersIcon className="h-6 w-6" />
            </AvatarFallback>
        </Avatar>
        <div className="grid grid-cols-2 flex-1 text-sm gap-x-4 gap-y-1">
            <p><span className="text-muted-foreground">UID:</span> {agent.uid}</p>
            <p><span className="text-muted-foreground">Rebate:</span> {agent.rebate}</p>
            <p><span className="text-muted-foreground">Online:</span> {agent.online ? 'yes' : 'no'}</p>
            <p><span className="text-muted-foreground">Subordinates:</span> {agent.subordinates}</p>
        </div>
    </div>
);


export default function TeamCenterPage() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Team Center</h1>
        <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="ghost" size="icon" className="h-8 w-8" disabled={isRefreshing}>
                <RefreshCw className={`h-5 w-5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                <Link href="/my">
                    <X className="h-6 w-6 text-muted-foreground" />
                </Link>
            </Button>
        </div>
      </header>

      <main className="flex-grow">
        <Tabs defaultValue="lv1" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-none border-b">
            <TabsTrigger value="lv1" className="text-base data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent text-muted-foreground p-3">Agent Lv1</TabsTrigger>
            <TabsTrigger value="lv2" className="text-base data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent text-muted-foreground p-3">Agent Lv2</TabsTrigger>
          </TabsList>
          <TabsContent value="lv1" className="bg-white mt-0">
            {dummyAgentsLv1.length > 0 ? (
                <div className="divide-y">
                    {dummyAgentsLv1.map((agent) => <AgentItem key={agent.uid} agent={agent} />)}
                </div>
            ) : (
                <p className="text-center text-muted-foreground p-8">No Level 1 agents found.</p>
            )}
          </TabsContent>
          <TabsContent value="lv2" className="bg-white mt-0">
             {dummyAgentsLv2.length > 0 ? (
                <div className="divide-y">
                    {dummyAgentsLv2.map((agent) => <AgentItem key={agent.uid} agent={agent} />)}
                </div>
            ) : (
                <p className="text-center text-muted-foreground p-8">No Level 2 agents found.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
