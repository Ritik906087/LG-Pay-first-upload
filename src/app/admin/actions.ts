
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
    // First, check if any order is referencing this payment method.
    const { data: referencingOrders, error: checkError } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('admin_payment_method_id', id)
        .limit(1);

    if (checkError) {
        console.error('Error checking for associated orders:', checkError);
        return { success: false, error: { message: 'Could not verify if the method is in use.', details: checkError.message } };
    }

    if (referencingOrders && referencingOrders.length > 0) {
        return { success: false, error: { message: 'This payment method is linked to existing orders and cannot be deleted.', details: 'Foreign key constraint violation.' } };
    }

    // If no orders are referencing it, proceed with deletion.
    const { error: deleteError } = await supabaseAdmin.from('payment_methods').delete().eq('id', id);
    if (deleteError) {
        // This could still fail due to other reasons, like RLS for a non-master admin (though service key should bypass).
        console.error('Error deleting payment method (admin action):', deleteError);
        return { success: false, error: { message: deleteError.message, details: deleteError.details } };
    }
    revalidatePath('/admin/dashboard');
    return { success: true };
}
