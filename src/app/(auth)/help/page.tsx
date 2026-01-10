import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HelpPage() {
  return (
    <Card className="w-full max-w-md animate-fade-in-up rounded-2xl border-none shadow-2xl shadow-purple-200/50 dark:shadow-purple-900/50">
      <CardHeader>
        <CardTitle className="text-2xl">Help Center</CardTitle>
        <CardDescription>
          Find answers to common questions about LG Pay.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">How do I reset my password?</h3>
          <p className="text-sm text-muted-foreground">
            You can reset your password by navigating to the{' '}
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              Forgot Password
            </Link>{' '}
            page and following the instructions.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">How do I create an account?</h3>
          <p className="text-sm text-muted-foreground">
            To create an account, go to the{' '}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Sign Up
            </Link>{' '}
            page and enter your phone number. You will receive an OTP to verify
            your number and set up your account.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Back to Sign In</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
