
import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Guard check for environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Razorpay Webhook Error: Supabase environment variables are not set.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }
  
  // Initialize Supabase client safely within the route handler
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
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
      const qrEntity = payload.qr_code.entity;
      const paymentEntity = payload.payment.entity;

      const qrId = qrEntity.id;
      
      const { data: qrPayment, error: qrError } = await supabaseAdmin
        .from('qr_payments')
        .select('*')
        .eq('id', qrId)
        .single();

      if (qrError) throw new Error(`QR payment record not found for ID: ${qrId}`);
      if (qrPayment.paid) {
        console.log(`Webhook for QR ID ${qrId} already processed.`);
        return NextResponse.json({ status: 'ok' });
      }

      const { user_id, method_name } = qrPayment;
      const payerVpa = paymentEntity.vpa;

      if (!user_id || !method_name || !payerVpa) {
        console.warn(`Missing user_id, method_name, or VPA for QR ID: ${qrId}. Cannot link UPI.`);
      } else {
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('payment_methods')
          .eq('id', user_id)
          .single();

        if (userError) {
           console.error(`User profile not found for userId: ${user_id}. Cannot link UPI.`);
        } else {
          const currentMethods = user.payment_methods || [];
          const newMethod = { name: method_name, upiId: payerVpa, type: 'upi' };
          const isDuplicate = currentMethods.some((pm: any) => pm.upiId === payerVpa);

          if (!isDuplicate) {
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({ payment_methods: [...currentMethods, newMethod] })
                .eq('id', user_id);
             if (updateError) console.error("Failed to update user payment methods:", updateError);
          }
        }
      }

      const { error: updateQrError } = await supabaseAdmin
        .from('qr_payments')
        .update({
            paid: true,
            status: 'credited',
            payer_vpa: payerVpa,
            razorpay_payment_id: paymentEntity.id,
            paid_at: new Date(paymentEntity.created_at * 1000).toISOString(),
            amount: paymentEntity.amount / 100,
        })
        .eq('id', qrId);
        
      if (updateQrError) throw updateQrError;

      console.log(`Successfully processed payment and linked UPI for QR ID: ${qrId}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Error in webhook processing:', error);
    return NextResponse.json({ error: 'Webhook processing error.' }, { status: 500 });
  }
}
