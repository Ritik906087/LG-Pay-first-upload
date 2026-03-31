import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import shortid from 'shortid';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin'; // You need to create this file

export async function POST(request: Request) {
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
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
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
