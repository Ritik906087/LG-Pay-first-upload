import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import shortid from 'shortid';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Razorpay API keys are not configured in .env file.');
    return NextResponse.json(
      { error: 'Server configuration error: Razorpay keys are missing.' },
      { status: 500 }
    );
  }

  const { userId, methodName } = await request.json();

  if (!userId || !methodName) {
    return NextResponse.json({ error: 'Missing userId or methodName' }, { status: 400 });
  }
  
  let userRecord;
  try {
      userRecord = await getAuth(adminApp).getUser(userId);
  } catch(e) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }


  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const amount = 100; // ₹1 in paisa

  try {
    const response = await razorpay.paymentLink.create({
        amount,
        currency: 'INR',
        accept_partial: false,
        description: `UPI Linking for ${methodName}`,
        customer: {
            name: userRecord.displayName || 'LG Pay User',
            contact: userRecord.phoneNumber,
            email: userRecord.email
        },
        notify: {
            sms: false,
            email: false
        },
        reminder_enable: false,
        notes: {
            userId,
            methodName,
            type: 'UPI_LINKING'
        }
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Razorpay payment link creation failed:', error);
    return NextResponse.json({ error: 'Failed to create Razorpay payment link' }, { status: 500 });
  }
}
