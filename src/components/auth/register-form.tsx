
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { useLanguage } from "@/context/language-context";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/utils";

const defaultAvatarUrl = "https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/LG%20PAY%20AVATAR.png?alt=media&token=707ce79d-15fa-4e58-9d1d-a7d774cfe5ec";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const { toast } = useToast();
  const { translations } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const invitationCodeFromUrl = searchParams.get("ref") || "";

  const registerSchema = z
    .object({
      phone: z
        .string()
        .length(10, { message: translations.phoneRequired })
        .regex(/^[6-9]\d{9}$/, {
          message: translations.phoneInvalid,
        }),
      otp: z.string().length(6, { message: translations.otpRequired }),
      password: z
        .string()
        .min(6, { message: translations.passwordMin }),
      confirmPassword: z.string(),
      invitationCode: z.string().min(1, { message: translations.invitationCodeRequired }),
      agreement: z.literal(true, {
        errorMap: () => ({ message: translations.agreementRequired }),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: translations.passwordsDontMatch,
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      otp: "",
      password: "",
      confirmPassword: "",
      invitationCode: invitationCodeFromUrl,
      agreement: false,
    },
  });

  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);

    try {
      const { data: { user, session }, error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+91${values.phone}`,
        token: values.otp,
        type: 'sms',
      });
      
      if (verifyError || !user) {
        throw verifyError || new Error("User not found after OTP verification.");
      }

      // User is verified, now create their profile in the database
      const { data: inviterData, error: inviterError } = await supabase
        .from('users')
        .select('id')
        .eq('numeric_id', values.invitationCode)
        .single();
      
      if (inviterError && inviterError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw new Error("Failed to validate invitation code.");
      }

      const numericId = Math.floor(10000000 + Math.random() * 90000000).toString();
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.id, // Link to auth.users table
          numeric_id: numericId,
          phone_number: values.phone,
          balance: 0.00,
          hold_balance: 0.00,
          display_name: `User${values.phone.slice(-4)}`,
          photo_url: defaultAvatarUrl,
          inviter_uid: inviterData?.id || null,
          email: user.email, // Supabase requires email, we use the phone-based one
        });

      if (profileError) {
        throw profileError;
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: translations.registrationSuccessTitle,
        description: translations.registrationSuccessMessage,
      });
      await supabase.auth.signOut();
      router.push("/login");

    } catch (error: any) {
      console.error("Registration failed:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.message.includes('already registered')) {
          description = "An account with this phone number already exists. Please log in instead.";
      } else if (error.message.includes('Invalid OTP')) {
          description = "The OTP you entered is incorrect. Please try again.";
      }
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleSendOtp() {
    const phone = form.getValues("phone");
    const phoneResult = z.string().length(10).regex(/^[6-9]\d{9}$/).safeParse(phone);

    if (!phoneResult.success) {
      form.setError("phone", { type: "manual", message: translations.phoneInvalid });
      return;
    }

    setIsOtpLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
    });

    if (error) {
        console.error("OTP send error:", error);
        toast({
            variant: "destructive",
            title: "Failed to send OTP",
            description: error.message.includes('rate limit') ? "Too many requests. Please wait before trying again." : "Please try again.",
        });
    } else {
        setIsOtpSent(true);
        toast({
            title: translations.otpSent,
            description: `${translations.otpSentTo.replace('{phone}', `+91${phone}`)}`,
        });
    }
    
    setIsOtpLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onRegisterSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.phoneNumber}</FormLabel>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center gap-2 text-sm text-muted-foreground">
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
                    width={20}
                    height={14}
                    alt="India Flag"
                  />
                  <span>+91</span>
                </div>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder={translations.enterPhoneNumber}
                    className="pl-[88px] text-base"
                    maxLength={10}
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
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.verificationCode}</FormLabel>
              <div className="relative flex items-center">
                <FormControl>
                  <Input placeholder={translations.enterVerificationCode} {...field} className="pr-28 text-base" />
                </FormControl>
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="absolute right-1.5 h-auto rounded-md bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/30"
                  onClick={handleSendOtp}
                  disabled={isOtpLoading}
                >
                  {isOtpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isOtpSent ? "Resend" : translations.send)}
                </Button>
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
              <FormLabel>{translations.password}</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={translations.enterPassword}
                    {...field}
                    className="pr-10 text-base"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 h-auto -translate-y-1/2 p-1 text-accent/80 hover:bg-transparent hover:text-accent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                <FormControl>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={translations.enterConfirmPassword}
                    {...field}
                    className="pr-10 text-base"
                  />
                </FormControl>
                 <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 h-auto -translate-y-1/2 p-1 text-accent/80 hover:bg-transparent hover:text-accent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="invitationCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.invitationCode}</FormLabel>
               <div className="relative">
                <FormControl>
                  <Input 
                    placeholder={translations.enterInvitationCode} 
                    {...field} 
                    className="text-base"
                    disabled={!!invitationCodeFromUrl}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="agreement"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none text-sm">
                <FormLabel className="font-normal text-muted-foreground">
                  {translations.iAgreeTo}{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-accent underline-offset-4 hover:underline"
                    target="_blank"
                  >
                    {translations.userAgreement}
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full font-semibold btn-gradient rounded-full"
          disabled={isLoading || !form.formState.isValid}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? translations.registering : translations.register}
        </Button>
      </form>
    </Form>
  );
}
