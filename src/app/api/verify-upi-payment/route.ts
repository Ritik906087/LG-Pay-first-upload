import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not set.");
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('x-razorpay-signature');

  if (!signature) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 400 });
  }

  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(body);
  const digest = shasum.digest('hex');

  if (digest !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const data = JSON.parse(body);

  if (data.event === 'payment_link.paid') {
    const paymentLink = data.payload.payment_link.entity;
    const payment = data.payload.payment.entity;
    
    const { userId, methodName, type } = paymentLink.notes;

    if (type === 'UPI_LINKING' && userId && methodName && payment.vpa) {
      try {
        const userProfileRef = adminDb.collection('users').doc(userId);
        
        await adminDb.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userProfileRef);
            if (!userDoc.exists) {
                throw new Error("User profile could not be found.");
            }

            const currentMethods = userDoc.data()?.paymentMethods || [];
            const newMethod = { name: methodName, upiId: payment.vpa, type: 'upi' };
            const isDuplicate = currentMethods.some((pm: any) => pm.upiId === newMethod.upiId);
            
            if (isDuplicate) {
                console.log(`UPI ID ${newMethod.upiId} already linked for user ${userId}. Skipping.`);
                return;
            }

            transaction.update(userProfileRef, {
                paymentMethods: FieldValue.arrayUnion(newMethod)
            });
        });

      } catch (error) {
        console.error('Firestore update failed:', error);
        // We still return 200 to Razorpay to acknowledge receipt of the webhook,
        // but we log the error for debugging.
      }
    }
  }

  return NextResponse.json({ status: 'ok' });
}
