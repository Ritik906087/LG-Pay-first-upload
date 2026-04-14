
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
    // First, find all orders using this payment method and set their reference to null.
    // This allows the payment method to be deleted without violating foreign key constraints.
    const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ admin_payment_method_id: null })
        .eq('admin_payment_method_id', id);

    if (updateError) {
        console.error('Error nullifying references in orders:', updateError);
        return { success: false, error: { message: 'Failed to update linked orders before deletion.', details: updateError.details } };
    }

    // Now, delete the payment method itself.
    const { error: deleteError } = await supabaseAdmin
        .from('payment_methods')
        .delete()
        .eq('id', id);

    if (deleteError) {
        console.error('Error deleting payment method (admin action):', deleteError);
        // This should not happen if the update above was successful, but handle other potential errors.
        return { success: false, error: { message: deleteError.message, details: deleteError.details } };
    }

    revalidatePath('/admin/dashboard');
    return { success: true };
}
