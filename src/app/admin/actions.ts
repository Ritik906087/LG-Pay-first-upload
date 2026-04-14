
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

export async function deletePaymentMethodAdmin(id: number) {
    // User wants to delete the payment method even if it's linked.
    // The pre-emptive check has been removed as per the user's request.
    // The database's own foreign key constraints will now handle the integrity.
    const { error: deleteError } = await supabaseAdmin.from('payment_methods').delete().eq('id', id);
    if (deleteError) {
        console.error('Error deleting payment method (admin action):', deleteError);
        
        // Check for foreign key violation error code from Postgres (23503) to give a clearer message.
        if (deleteError.code === '23503') {
             return { success: false, error: { message: 'This payment method is in use by existing orders and cannot be deleted.', details: deleteError.details } };
        }

        return { success: false, error: { message: deleteError.message, details: deleteError.details } };
    }
    revalidatePath('/admin/dashboard');
    return { success: true };
}
