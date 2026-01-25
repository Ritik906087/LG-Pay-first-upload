"use client";

import React from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, AlertCircle, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function BuyPage() {

  return (
    <div className="text-foreground pb-4 min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white sticky top-0 z-10 border-b">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/home">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold">Buy</h1>
            <p className="text-xs text-muted-foreground">1INR=1LGB 1U=97.00 INR</p>
        </div>
        <div className="w-8"></div>
      </header>

      <main className="p-4 flex-grow">
        <Tabs defaultValue="otp-upi" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto">
            <TabsTrigger value="otp-upi" className="text-base data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent text-muted-foreground p-3 relative">OTP-UPI <span className="absolute top-1 right-1 text-xs text-red-500 font-bold">+5%</span></TabsTrigger>
            <TabsTrigger value="bank" className="text-base data-[state=active]:font-bold data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent text-muted-foreground p-3 relative">BANK <span className="absolute top-1 right-1 text-xs text-red-500 font-bold">+6%</span></TabsTrigger>
          </TabsList>
          
          <div className="mt-4 p-2 bg-orange-100 text-orange-700 text-xs rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Tips: Requires KYC connection to purchase.</span>
          </div>

          <Tabs defaultValue="default" className="w-full mt-4">
            <TabsList className="bg-gray-100 rounded-lg p-1 h-auto">
                <TabsTrigger value="default" className="px-4 py-1 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Default</TabsTrigger>
                <TabsTrigger value="large" className="px-4 py-1 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Large</TabsTrigger>
                <TabsTrigger value="small" className="px-4 py-1 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Small</TabsTrigger>
            </TabsList>
            <TabsContent value="default" className="mt-4">
                 <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
                    <ShoppingCart className="h-16 w-16 opacity-50" />
                    <p className="mt-4 text-lg">No purchase options available</p>
                    <p className="text-sm">Please check back later.</p>
                </div>
            </TabsContent>
            <TabsContent value="large" className="mt-4">
                <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
                    <ShoppingCart className="h-16 w-16 opacity-50" />
                    <p className="mt-4 text-lg">No large purchase options available</p>
                    <p className="text-sm">Please check back later.</p>
                </div>
            </TabsContent>
            <TabsContent value="small" className="mt-4">
                <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
                    <ShoppingCart className="h-16 w-16 opacity-50" />
                    <p className="mt-4 text-lg">No small purchase options available</p>
                    <p className="text-sm">Please check back later.</p>
                </div>
            </TabsContent>
          </Tabs>
        </Tabs>
      </main>
    </div>
  );
}
