import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error("RAZORPAY_WEBHOOK_SECRET is not set in .env file.");
        return NextResponse.json({ error: 'Server configuration error: Webhook secret is missing.' }, { status: 500 });
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
      if (!adminDb) {
        throw new Error('Firestore Admin SDK is not initialized.');
      }
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

        } catch (error: any) {
          console.error('Firestore update failed in webhook:', error);
          // We still return 200 to Razorpay to acknowledge receipt of the webhook,
          // but we log the error for debugging.
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch(e: any) {
    console.error('Unhandled error in verify-upi-payment route:', e.message);
    return NextResponse.json({ error: 'An unexpected server error occurred in webhook.' }, { status: 500 });
  }
}
