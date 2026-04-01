
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ChevronLeft, Eye, EyeOff, Loader, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { createClient } from '@/lib/utils';
import { useSupabaseUser } from '@/hooks/use-supabase-user';


export default function ChangePasswordPage() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const router = useRouter();
  const { translations } = useLanguage();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formSchema = z.object({
    oldPassword: z.string().min(1, { message: translations.oldPasswordRequired }),
    newPassword: z.string().min(6, { message: translations.passwordMin }),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: translations.passwordsDontMatch,
    path: ["confirmPassword"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    if (!user || !user.email) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Could not find user information. Please log in again.",
      });
      setIsLoading(false);
      return;
    }

    // 1. Verify old password by trying to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.oldPassword,
    });

    if (signInError) {
        toast({
            variant: "destructive",
            title: translations.passwordUpdateFailedTitle,
            description: translations.oldPasswordIncorrect,
        });
        form.setError("oldPassword", { message: translations.oldPasswordIncorrect });
        setIsLoading(false);
        return;
    }
    
    // 2. If old password is correct, update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.newPassword
    });

    if (updateError) {
      console.error("Password change error:", updateError);
      toast({
          variant: "destructive",
          title: translations.passwordUpdateFailedTitle,
          description: updateError.message,
      });
    } else {
       toast({
        title: translations.passwordUpdateSuccessTitle,
        description: translations.passwordUpdateSuccessMessage,
      });
      router.push('/my');
    }

    setIsLoading(false);
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">{translations.paymentPassword}</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow space-y-4 p-4">
        <Card className="bg-white">
            <CardHeader>
                <CardTitle>{translations.paymentPassword}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="oldPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{translations.oldPassword}</FormLabel>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <FormControl>
                                            <Input type={showOldPassword ? "text" : "password"} placeholder={translations.enterOldPassword} className="pl-10" {...field} />
                                        </FormControl>
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-1.5 top-1/2 h-auto -translate-y-1/2 p-1 text-accent/80 hover:bg-transparent hover:text-accent" onClick={() => setShowOldPassword(!showOldPassword)}>
                                            {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{translations.newPassword}</FormLabel>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <FormControl>
                                            <Input type={showNewPassword ? "text" : "password"} placeholder={translations.enterNewPassword} className="pl-10" {...field} />
                                        </FormControl>
                                         <Button type="button" variant="ghost" size="icon" className="absolute right-1.5 top-1/2 h-auto -translate-y-1/2 p-1 text-accent/80 hover:bg-transparent hover:text-accent" onClick={() => setShowNewPassword(!showNewPassword)}>
                                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{translations.confirmPassword}</FormLabel>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <FormControl>
                                            <Input type={showConfirmPassword ? "text" : "password"} placeholder={translations.enterConfirmPassword} className="pl-10" {...field} />
                                        </FormControl>
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-1.5 top-1/2 h-auto -translate-y-1/2 p-1 text-accent/80 hover:bg-transparent hover:text-accent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full h-12 btn-gradient font-bold" disabled={isLoading}>
                            {isLoading && <Loader size="xs" className="mr-2" />}
                            {isLoading ? translations.updatingPassword : translations.updatePassword}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
