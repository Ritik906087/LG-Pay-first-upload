import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const signature = request.headers.get('x-razorpay-signature') || '';
  const body = await request.text();

  try {
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(body);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      console.warn('Webhook signature mismatch.');
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    const data = JSON.parse(body);
    const event = data.event;
    const payload = data.payload;

    if (event === 'qr_code.credited') {
      if (!adminDb) {
        throw new Error('Firestore admin is not initialized.');
      }
      const qrEntity = payload.qr_code.entity;
      const paymentEntity = payload.payment.entity;

      const qrId = qrEntity.id;
      const docRef = adminDb.collection('qr_payments').doc(qrId);

      await adminDb.runTransaction(async (transaction) => {
        const qrDoc = await transaction.get(docRef);
        if (!qrDoc.exists) {
          throw new Error(`QR payment record not found for ID: ${qrId}`);
        }

        const { userId, methodName } = qrDoc.data()!;
        const payerVpa = paymentEntity.vpa;

        if (!userId || !methodName || !payerVpa) {
          console.warn(`Missing userId, methodName, or VPA for QR ID: ${qrId}. Cannot link UPI.`);
        } else {
          const userRef = adminDb.collection('users').doc(userId);
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists) {
            const currentMethods = userDoc.data()?.paymentMethods || [];
            const newMethod = { name: methodName, upiId: payerVpa, type: 'upi' };
            const isDuplicate = currentMethods.some((pm: any) => pm.upiId === payerVpa);

            if (!isDuplicate) {
              transaction.update(userRef, {
                paymentMethods: FieldValue.arrayUnion(newMethod),
              });
            }
          } else {
            console.error(`User profile not found for userId: ${userId}. Cannot link UPI.`);
          }
        }

        const paymentData = {
          paid: true,
          status: 'credited',
          payer_vpa: payerVpa,
          razorpay_payment_id: paymentEntity.id,
          paid_at: Timestamp.fromMillis(paymentEntity.created_at * 1000),
          amount: paymentEntity.amount / 100,
        };
        transaction.update(docRef, paymentData);
      });

      console.log(`Successfully processed payment and linked UPI for QR ID: ${qrId}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Error in webhook processing:', error);
    return NextResponse.json({ error: 'Webhook processing error.' }, { status: 500 });
  }
}
