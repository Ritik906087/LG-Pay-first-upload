"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from 'next/link';

const formSchema = z.object({
  phone: z
    .string()
    .min(1, { message: "Please enter your phone number." })
    .min(10, { message: "Phone number must be at least 10 digits." }),
  password: z
    .string()
    .min(1, { message: "Please enter your password." })
    .min(6, { message: "Password must be at least 6 characters." }),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    console.log(values);
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <div className="relative flex items-center">
                 <Image src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" width={24} height={16} alt="Indian Flag" className="absolute left-3" />
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+91 Enter phone number"
                    className="pl-12"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    className="pl-10"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-right text-sm">
          <Link href="/forgot-password" className="font-semibold text-accent hover:underline">
            Forgot Password?
          </Link>
        </div>
        <Button
          type="submit"
          className="w-full font-semibold btn-gradient rounded-full"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Logging In..." : "Log In"}
        </Button>
      </form>
    </Form>
  );
}
