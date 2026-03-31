import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qrId = searchParams.get('qr_id');

  if (!qrId) {
    return NextResponse.json({ error: 'QR ID is required.' }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const docRef = adminDb.collection('qr_payments').doc(qrId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'QR record not found.' }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Failed to verify payment status.' }, { status: 500 });
  }
}
