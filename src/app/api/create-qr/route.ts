
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // Guard check for environment variables and initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('create-qr Error: Supabase environment variables are not set.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    // Store the QR ID in Supabase to track its status
    const { error } = await supabaseAdmin.from('qr_payments').insert({
      id: qrCode.id,
      status: qrCode.status,
      created_at: new Date().toISOString(),
      paid: false,
      user_id: userId,
      method_name: methodName,
    });
    
    if (error) throw error;

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
