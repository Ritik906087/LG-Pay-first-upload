
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent } from '@/components/ui/card';
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/utils';

type Order = {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  created_at: string;
};

type SellOrder = Order;

const OrderCard = ({
  order,
  orderType,
}: {
  order: Order | SellOrder;
  orderType: 'buy' | 'sell';
}) => {
  return (
    <Card className="bg-white">
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span className="font-mono">{order.orderId}</span>
          <span>{new Date(order.created_at).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-bold text-lg">₹{order.amount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold capitalize">
              {order.status.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <div className="flex justify-end pt-2">
           <Button asChild size="sm" variant="outline">
            <Link href={`/my/report-problem/${order.id}?orderType=${orderType}`}>
              Request Report
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const OrderList = ({
  type,
  filters,
}: {
  type: 'buy' | 'sell';
  filters: { status: string; time: string };
}) => {
  const { user } = useSupabaseUser();
  const supabase = createClient();
  const [orders, setOrders] = useState<(Order | SellOrder)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
        if (!user) {
            setLoading(false);
            return;
        };
        setLoading(true);
        const tableName = type === 'buy' ? 'orders' : 'sell_orders';
        const { data, error } = await supabase.from(tableName).select('*').eq('user_id', user.id).order('created_at', {ascending: false}).limit(100);
        if (data) {
            setOrders(data);
        }
        setLoading(false);
    }
    fetchOrders();
  }, [user, supabase, type]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const now = new Date();
    let startDate: Date;
    switch (filters.time) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'this_week':
        startDate = startOfWeek(now);
        break;
      case 'this_month':
        startDate = startOfMonth(now);
        break;
      default:
        startDate = new Date(0); // all_time
    }

    return orders.filter((order) => {
      const createdAtDate = new Date(order.created_at);
      const isAfterStartDate = filters.time === 'all_time' || isAfter(createdAtDate, startDate);
      if (!isAfterStartDate) return false;

      if (filters.status === 'all') return true;
      if (filters.status === 'completed') return order.status === 'completed';
      if (filters.status === 'pending') {
        if (type === 'buy')
          return ['pending_payment', 'pending_confirmation', 'in_applied'].includes(order.status);
        if (type === 'sell')
          return ['pending', 'partially_filled', 'processing'].includes(order.status);
      }
      if (filters.status === 'failed') {
        return ['failed', 'cancelled'].includes(order.status);
      }
      return true;
    });
  }, [orders, filters, type]);

  if (loading) {
    return (
      <div className="flex justify-center pt-10">
        <Loader size="md" />
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
        <ClipboardList className="h-16 w-16 opacity-50" />
        <p className="mt-4 text-lg">No Orders Found</p>
        <p className="text-sm">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredOrders.map((order) => (
        <OrderCard key={order.id} order={order} orderType={type} />
      ))}
    </div>
  );
};

export default function ReportProblemSelectionPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all_time');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Report a Problem</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow p-4">
        <Tabs defaultValue="buy" className="w-full">
            <div className="my-4 grid grid-cols-2 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-white border-border rounded-lg h-11">
                    <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed/Cancelled</SelectItem>
                </SelectContent>
                </Select>

                <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full bg-white border-border rounded-lg h-11">
                    <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all_time">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                </SelectContent>
                </Select>
            </div>
            
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy History</TabsTrigger>
                <TabsTrigger value="sell">Sell History</TabsTrigger>
            </TabsList>

          <TabsContent value="buy" className="pt-4">
            <OrderList type="buy" filters={{ status: statusFilter, time: timeFilter }} />
          </TabsContent>
          <TabsContent value="sell" className="pt-4">
            <OrderList type="sell" filters={{ status: statusFilter, time: timeFilter }} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
