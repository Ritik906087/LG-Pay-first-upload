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

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md animate-fade-in-up rounded-2xl border-none bg-white/90 shadow-2xl shadow-primary/20">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-3xl font-bold text-gradient">
          Register
        </CardTitle>
        <div className="mt-4 text-center">
          <Image
            src="https://cdn-icons-png.flaticon.com/512/1077/1077035.png"
            alt="Reward"
            width={90}
            height={90}
            className="mx-auto"
          />
          <div className="mt-2 text-sm">
            <p>🎁 New User Reward</p>
            <p>💰 Trading Bonus</p>
            <p>👑 Member Exclusive Tasks</p>
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
