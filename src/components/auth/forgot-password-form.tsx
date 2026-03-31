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
import { Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { Loader } from "@/components/ui/loader";
import { createClient } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { translations } = useLanguage();
  const supabase = createClient();
  
  const formSchema = z.object({
    phone: z
      .string()
      .min(10, { message: translations.phoneRequired })
      .regex(/^[6-9]\d{9}$/, {
        message: translations.phoneInvalid,
      }),
  });


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { phone: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    const email = `${values.phone}@lgpay.app`;

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
        toast({
            variant: 'destructive',
            title: "Error Sending Reset Link",
            description: "Could not send password reset link. Please ensure the phone number is correct and try again."
        });
    } else {
        toast({
            title: "Password Reset Link Sent",
            description: "If an account exists for this number, a password reset link will be sent to the associated email.",
        });
    }

    setIsLoading(false);
  }

  return (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.phoneNumber}</FormLabel>
                   <div className="relative flex items-center">
                     <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={translations.enterPhoneNumber}
                        className="pl-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full btn-gradient rounded-full font-semibold" disabled={isLoading}>
              {isLoading && <Loader size="xs" className="mr-2" />}
              {isLoading ? translations.sending : translations.sendResetCode}
            </Button>
          </form>
        </Form>
  );
}
