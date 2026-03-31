import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  const { userId, methodName } = await request.json();

  if (!userId || !methodName) {
    return NextResponse.json({ error: 'userId and methodName are required.' }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Razorpay keys not configured.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  try {
    const closeBy = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

    const options = {
      type: 'upi_qr',
      name: 'Secure ₹1 Verification',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: 100, // 100 paise = ₹1
      description: `Verification for ${methodName}`,
      close_by: closeBy,
      notes: {
        purpose: 'verification',
        userId: userId,
        methodName: methodName,
      },
    };

    const qrCode = await razorpay.qrCode.create(options);

    if (!adminDb) {
      throw new Error('Firestore admin is not initialized.');
    }

    // Store the QR ID in Firestore to track its status
    await adminDb.collection('qr_payments').doc(qrCode.id).set({
      id: qrCode.id,
      status: qrCode.status,
      created_at: FieldValue.serverTimestamp(),
      paid: false,
      userId: userId,
      methodName: methodName,
    });

    return NextResponse.json({
      qr_id: qrCode.id,
      image_url: qrCode.image_url,
      status: qrCode.status,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay QR code:', error);
    return NextResponse.json({ error: 'Failed to create QR code.' }, { status: 500 });
  }
}
