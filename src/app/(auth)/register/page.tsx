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
import { Gift, Crown, Award } from 'lucide-react';

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md animate-fade-in-up rounded-2xl border-none bg-white/90 shadow-2xl shadow-primary/20 backdrop-blur-sm">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl font-bold">
          Register
        </CardTitle>
        <div className="mt-4 flex w-full justify-around text-center text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <Gift className="h-5 w-5" />
            <span>New User Reward</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Award className="h-5 w-5" />
            <span>Trading Bonus</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Crown className="h-5 w-5" />
            <span>Member Tasks</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="justify-center">
        <div className="text-sm text-center">
          <Link
            href="/login"
            className="font-semibold text-accent underline-offset-4 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
