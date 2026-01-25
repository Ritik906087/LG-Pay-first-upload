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
import { useToast } from '@/hooks/use-toast';

type Transaction = {
  id: string;
  type: 'Buy Rebate' | 'Sell';
  amount: string;
  time: string;
  orderNumber: string;
};

// In a real app, this would be fetched from a server
const transactions: Transaction[] = [];

const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
  const isBuy = transaction.type.includes('Buy');
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Order number copied!' });
    });
  };

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
              <Copy className="h-3 w-3 text-gray-400 cursor-pointer" onClick={() => copyToClipboard(transaction.orderNumber)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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

export default function TransactionPage() {
  
  return (
    <div className="text-foreground min-h-screen">
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
