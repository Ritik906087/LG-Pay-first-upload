import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qrId = searchParams.get('qr_id');

  if (!qrId) {
    return NextResponse.json({ error: 'QR ID is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
        .from('qr_payments')
        .select('*')
        .eq('id', qrId)
        .single();

    if (error) {
        if(error.code === 'PGRST116') { // Not found
             return NextResponse.json({ error: 'QR record not found.' }, { status: 404 });
        }
        throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Failed to verify payment status.' }, { status: 500 });
  }
}
