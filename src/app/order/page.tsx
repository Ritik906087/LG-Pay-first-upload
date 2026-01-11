"use client";

import React from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, ChevronLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Transaction = {
  id: string;
  type: 'Buy Rebate' | 'Sell';
  amount: string;
  time: string;
  orderNumber: string;
};

const transactions: Transaction[] = [
  { id: '1', type: 'Buy Rebate', amount: '10.00', time: '2026-01-11 09:41:37', orderNumber: 'MR2026011109324909988' },
  { id: '2', type: 'Buy Rebate', amount: '15.00', time: '2026-01-11 09:14:39', orderNumber: 'MR2026011109082200039' },
  { id: '3', type: 'Buy Rebate', amount: '9.00', time: '2026-01-10 10:57:16', orderNumber: 'MR2026011010523601857' },
  { id: '4', type: 'Buy Rebate', amount: '7.00', time: '2026-01-10 10:31:12', orderNumber: 'MR2026011010255308579' },
  { id: '5', type: 'Buy Rebate', amount: '10.00', time: '2026-01-10 10:21:36', orderNumber: 'MR2026011010140303660' },
  { id: '6', type: 'Buy Rebate', amount: '8.00', time: '2026-01-09 11:19:57', orderNumber: 'MR2026010911142201814' },
  { id: '7', type: 'Buy Rebate', amount: '12.00', time: '2026-01-09 11:08:06', orderNumber: 'MR2026010911021608389' },
  { id: '8', type: 'Buy Rebate', amount: '10.00', time: '2026-01-09 11:00:47', orderNumber: 'MR2026010910540706783' },
  { id: '9', type: 'Sell', amount: '100.00', time: '2026-01-08 15:30:00', orderNumber: 'MS2026010815300012345' },
];

const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
  const isBuy = transaction.type.includes('Buy');
  return (
    <Card className="mb-4 bg-white text-foreground shadow-sm">
      <CardContent className="p-4 space-y-3">
        <span className={cn(
          "rounded px-2 py-0.5 text-xs font-bold",
          isBuy ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          {transaction.type}
        </span>
        <div className="space-y-2 text-sm">
           <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold text-destructive">₹{transaction.amount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Time</span>
            <span className="font-mono text-muted-foreground">{transaction.time}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Order Number</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">{transaction.orderNumber}</span>
              <Copy className="h-3 w-3 text-gray-400 cursor-pointer" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function TransactionPage() {
  const TransactionList = ({ transactions }: { transactions: Transaction[] }) => {
    if (transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
          <ClipboardList className="h-16 w-16 opacity-50" />
          <p className="mt-4 text-lg">No transactions yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
        <p className="text-center text-sm text-muted-foreground/60">No more</p>
      </div>
    );
  };
  
  return (
    <div className="text-foreground">
       {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white sticky top-0 z-10 border-b">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/my">
                <ChevronLeft className="h-6 w-6 text-muted-foreground" />
            </Link>
        </Button>
        <h1 className="text-xl font-bold">Transaction</h1>
        <div className="w-8"></div>
      </header>

      <main className="p-4">
          <div className="my-4 grid grid-cols-2 gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-full bg-white border-border rounded-lg h-11">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="rebate">Rebate</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-full bg-white border-border rounded-lg h-11">
                <SelectValue placeholder="Choose Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="all_time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TransactionList transactions={transactions} />
      </main>
    </div>
  );
}
