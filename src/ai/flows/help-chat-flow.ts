'use server';
/**
 * @fileOverview A service to handle chat requests.
 *
 * - escalateToHuman - Creates a new human agent chat request in Supabase.
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendNewChatRequestToTelegram } from '@/lib/telegram';

type Message = {
    text: string;
    isUser: boolean;
    attachment?: {
        name: string;
        type: string;
        url: string;
    };
    timestamp: number;
    userName?: string;
};

async function createHumanAgentRequest(input: {
    uid?: string;
    enteredIdentifier: string;
    chatHistory: Message[];
}): Promise<{ success: boolean, error?: string, chatId?: string }> {
    let userNumericId: string | undefined;
    if (input.uid) {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('numeric_id')
                .eq('id', input.uid)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            if (data) {
                userNumericId = data.numeric_id;
            }
        } catch (e) {
            console.error("Failed to fetch user numericId for chat:", e);
            // Non-fatal, continue without it
        }
    }

    try {
        const insertData: any = {
            entered_identifier: input.enteredIdentifier,
            chat_history: input.chatHistory,
            status: 'pending',
            created_at: new Date().toISOString(),
        };

        if (input.uid) {
            insertData.user_id = input.uid;
        }

        if (userNumericId) {
            insertData.user_numeric_id = userNumericId;
        }

        const { data: newDoc, error: insertError } = await supabaseAdmin
            .from('chat_requests')
            .insert(insertData)
            .select('id')
            .single();

        if (insertError) throw insertError;
        
        // Wait for the notification to be sent to ensure reliability
        await sendNewChatRequestToTelegram({
            userNumericId,
            enteredIdentifier: input.enteredIdentifier,
        });

        return { success: true, chatId: newDoc.id };
    } catch (e: any) {
        console.error("Failed to create chat request:", e);
        return { success: false, error: e.message || "An unknown error occurred." };
    }
}

export async function escalateToHuman(input: {
    uid?: string;
    enteredIdentifier: string;
    chatHistory: Message[];
}): Promise<{ success: boolean; error?: string, chatId?: string }> {
    return await createHumanAgentRequest(input);
}
