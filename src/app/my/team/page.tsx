
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, Users as UsersIcon, Wallet, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';
import { Skeleton } from '@/components/ui/skeleton';

type UserProfile = {
  id: string;
  numeric_id: string;
  photo_url?: string;
};

const AgentItem = ({ agent }: { agent: UserProfile }) => {
    const supabase = createClient();
    const [stats, setStats] = useState({ income: 0, orders: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchAgentData = async () => {
        setLoading(true);
        const [incomeRes, ordersRes] = await Promise.all([
          supabase.from('transactions').select('amount').eq('user_id', agent.id),
          supabase.from('orders').select('id', { count: 'exact' }).eq('user_id', agent.id).eq('status', 'completed')
        ]);
        
        const totalIncome = incomeRes.data?.reduce((acc, tx) => acc + (tx.amount || 0), 0) || 0;
        const totalOrders = ordersRes.count || 0;

        setStats({ income: totalIncome, orders: totalOrders });
        setLoading(false);
      };
      fetchAgentData();
    }, [supabase, agent.id]);

    return (
        <div className="flex items-center gap-4 p-4 border-b last:border-b-0">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={agent.photo_url} alt={`Avatar for UID ${agent.numeric_id}`} />
                <AvatarFallback className="bg-primary/10 text-primary">
                    <UsersIcon className="h-6 w-6" />
                </AvatarFallback>
            </Avatar>
            <div className="grid grid-cols-2 flex-1 text-sm gap-x-4 gap-y-1">
                <p className="font-semibold col-span-2">UID: {agent.numeric_id}</p>
                {loading ? (
                    <>
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                    </>
                ) : (
                    <>
                        <p className="text-muted-foreground"><span className="font-medium text-green-600">₹{stats.income.toFixed(2)}</span> Income</p>
                        <p className="text-muted-foreground"><span className="font-medium text-primary">{stats.orders}</span> order</p>
                    </>
                )}
            </div>
             <div className={cn("text-xs font-semibold px-2 py-1 rounded-full", "bg-gray-100 text-gray-500")}>
                Offline
            </div>
        </div>
    );
};


const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: React.ElementType, colorClass: string }) => (
    <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-full", colorClass)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-bold text-lg">{value}</p>
        </div>
    </div>
);


export default function TeamPage() {
    const { user } = useSupabaseUser();
    const supabase = createClient();
    const [l1Agents, setL1Agents] = useState<UserProfile[]>([]);
    const [l2Agents, setL2Agents] = useState<UserProfile[]>([]);
    const [selfIncome, setSelfIncome] = useState(0);
    const [loading, setLoading] = useState(true);
    const [l1AgentUids, setL1AgentUids] = useState<string[]>([]);

    useEffect(() => {
      const fetchData = async () => {
        if (!user) {
          setLoading(false);
          return;
        };

        setLoading(true);

        // Fetch L1 agents
        const { data: l1Data } = await supabase.from('users').select('id, numeric_id, photo_url').eq('inviter_uid', user.id);
        const l1 = l1Data || [];
        setL1Agents(l1);
        const l1Ids = l1.map(a => a.id);
        setL1AgentUids(l1Ids);

        // Fetch L2 agents if L1 agents exist
        if (l1Ids.length > 0) {
            // Firestore 'in' queries are limited to 30 items.
            const { data: l2Data } = await supabase.from('users').select('id, numeric_id, photo_url').in('inviter_uid', l1Ids.slice(0, 30));
            setL2Agents(l2Data || []);
        }

        // Fetch self income
        const { data: incomeData } = await supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'team_bonus');
        const totalIncome = incomeData?.reduce((acc, tx) => acc + (tx.amount || 0), 0) || 0;
        setSelfIncome(totalIncome);

        setLoading(false);
      }
      fetchData();
    }, [user, supabase]);

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Team</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow p-4 space-y-4">
        <Card className="bg-white">
            <CardContent className="grid grid-cols-2 gap-y-6 p-4">
                <StatCard title="Income" value={loading ? '...' : `₹${selfIncome.toFixed(2)}`} icon={Wallet} colorClass="bg-primary" />
                <StatCard title="Today's income" value="₹0" icon={Wallet} colorClass="bg-accent" />
                <StatCard title="Team size" value={loading ? '...' : (l1Agents.length + l2Agents.length)} icon={UsersIcon} colorClass="bg-green-500" />
                <StatCard title="New members today" value="0" icon={UserPlus} colorClass="bg-orange-500" />
            </CardContent>
        </Card>

        <Tabs defaultValue="lv1" className="w-full">
          <TabsList className="flex w-full bg-white rounded-lg border p-1">
            <TabsTrigger value="lv1" className="flex-1 text-base data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md bg-transparent text-muted-foreground p-2.5">Team L1</TabsTrigger>
            <TabsTrigger value="lv2" className="flex-1 text-base data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md bg-transparent text-muted-foreground p-2.5">Team L2</TabsTrigger>
          </TabsList>
          <TabsContent value="lv1" className="bg-white mt-4 rounded-lg border">
            {loading ? (
                <div className="flex justify-center p-8"><Loader size="sm" /></div>
            ) : l1Agents.length > 0 ? (
                <div>
                    {l1Agents.map((agent) => <AgentItem key={agent.id} agent={agent} />)}
                </div>
            ) : (
                <p className="text-center text-muted-foreground p-8">No Level 1 members found.</p>
            )}
          </TabsContent>
          <TabsContent value="lv2" className="bg-white mt-4 rounded-lg border">
             {loading && l1AgentUids.length > 0 ? (
                <div className="flex justify-center p-8"><Loader size="sm" /></div>
             ) : l2Agents && l2Agents.length > 0 ? (
                <div>
                    {l2Agents.map((agent) => <AgentItem key={agent.id} agent={agent} />)}
                </div>
            ) : (
                <p className="text-center text-muted-foreground p-8">No Level 2 members found.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
