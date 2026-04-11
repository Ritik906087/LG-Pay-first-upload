'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

type PaymentMethodPayload = {
    type: 'bank' | 'upi' | 'usdt';
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
    upi_holder_name?: string;
    upi_id?: string;
    usdt_wallet_address?: string;
};

export async function addPaymentMethodAdmin(payload: PaymentMethodPayload) {
    const { error } = await supabaseAdmin.from('payment_methods').insert(payload);
    if (error) {
        console.error('Error adding payment method (admin action):', error);
        return { success: false, error: { message: error.message, details: error.details } };
    }
    revalidatePath('/admin/dashboard');
    return { success: true };
}

export async function deletePaymentMethodAdmin(id: string) {
    const { error } = await supabaseAdmin.from('payment_methods').delete().eq('id', id);
    if (error) {
        console.error('Error deleting payment method (admin action):', error);
        return { success: false, error: { message: error.message, details: error.details } };
    }
    revalidatePath('/admin/dashboard');
    return { success: true };
}
