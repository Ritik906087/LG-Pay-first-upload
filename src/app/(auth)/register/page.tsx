"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import { Loader } from '@/components/ui/loader';

export default function RegisterPage() {
  const { translations } = useLanguage();
  return (
    <Card className="w-full max-w-md animate-fade-in-up rounded-2xl border-none bg-white/90 shadow-2xl shadow-primary/20 backdrop-blur-sm">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl font-bold">
          {translations.register}
        </CardTitle>
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/studio-7631087921-85112.firebasestorage.app/o/LG%20PAY%20AVATAR.png?alt=media&token=707ce79d-15fa-4e58-9d1d-a7d774cfe5ec"
          width={64}
          height={64}
          alt="LG Pay Avatar"
          className="my-2"
        />
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="flex justify-center p-8"><Loader size="sm" /></div>}>
            <RegisterForm />
        </Suspense>
      </CardContent>
      <CardFooter className="justify-center">
        <div className="text-sm text-center">
          <Button asChild variant="link" className="p-0 h-auto text-accent">
            <Link
              href="/login"
              className="font-semibold underline-offset-4 hover:underline"
            >
              {translations.backToLogin}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
