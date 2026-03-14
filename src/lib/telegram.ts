
'use server';

const tags = '@PRAJAPATI_KING1 @Anandyda89 @Zx_PiYUSH_02 @Satyam_ll @RITIK90608';

type OrderDetails = {
    orderId: string;
    userNumericId?: string;
    amount: number;
    utr: string;
    receiverDetails: { [key: string]: string | undefined };
};

export async function sendOrderConfirmationToTelegram(details: OrderDetails) {
    const botToken = process.env.TELEGRAM_PAYMENT_BOT_TOKEN;
    const chatIds = process.env.TELEGRAM_PAYMENT_CHAT_IDS?.split(',') || [];

    if (!botToken || chatIds.length === 0) {
        console.error('[TelegramBot] ERROR: Payment bot token or chat IDs are not configured in .env file.');
        return;
    }
    console.log(`[TelegramBot] INFO: Sending payment proof for Order ID ${details.orderId} to ${chatIds.length} chat(s).`);

    let receiverText = '';
    for (const [key, value] of Object.entries(details.receiverDetails)) {
        if (value) {
            receiverText += `\n${key}: \`${value}\``;
        }
    }

    const message = `
*New Buy Order Confirmation!*

*Order ID:* \`${details.orderId}\`
*User UID:* \`${details.userNumericId || 'N/A'}\`
*Amount:* ₹${details.amount.toFixed(2)}
*UTR:* \`${details.utr}\`

*Receiver Details:*${receiverText}

${tags}
    `;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const sendPromises = chatIds.map(chatId => {
        const trimmedChatId = chatId.trim();
        if (!trimmedChatId) {
            console.warn('[TelegramBot] WARN: Empty chat ID found in TELEGRAM_PAYMENT_CHAT_IDS.');
            return Promise.resolve({ ok: false, status: 'skipped' });
        }
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: trimmedChatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });
    });

    try {
        const results = await Promise.allSettled(sendPromises);

        results.forEach((result, index) => {
            const chatId = chatIds[index].trim();
            if (result.status === 'rejected') {
                console.error(`[TelegramBot] FATAL: Network error sending PAYMENT message to chat ID ${chatId}:`, result.reason);
            } else if (result.value && !result.value.ok) {
                if (result.value.status === 'skipped') return;
                result.value.json().then(errorBody => {
                    console.error(`[TelegramBot] ERROR: Failed to send PAYMENT message to chat ID ${chatId}. Status: ${result.value.status}. Response:`, JSON.stringify(errorBody));
                }).catch(() => {
                    console.error(`[TelegramBot] ERROR: Failed to send PAYMENT message to chat ID ${chatId}. Status: ${result.value.status}. Could not parse error response.`);
                });
            } else if (result.value?.ok) {
                console.log(`[TelegramBot] SUCCESS: Sent PAYMENT message to chat ID ${chatId}.`);
            }
        });
    } catch (e) {
        console.error('[TelegramBot] FATAL: An unexpected error occurred while sending Telegram notifications.', e);
    }
}

type ChatRequestDetails = {
    userNumericId?: string;
    enteredIdentifier: string;
};

export async function sendNewChatRequestToTelegram(details: ChatRequestDetails) {
    const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const chatIds = process.env.TELEGRAM_SUPPORT_CHAT_IDS?.split(',') || [];

    if (!botToken || chatIds.length === 0) {
        console.error('[TelegramBot] ERROR: Support bot token or chat IDs are not configured in .env file.');
        return;
    }
    console.log(`[TelegramBot] INFO: Sending new chat request for User ${details.userNumericId || details.enteredIdentifier} to ${chatIds.length} chat(s).`);

    const message = `
*New Live Chat Request!* 💬

A user needs help.

*User UID:* \`${details.userNumericId || 'N/A'}\`
*Identifier Entered:* \`${details.enteredIdentifier}\`

Please check the admin panel to join the chat.

${tags}
    `;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const sendPromises = chatIds.map(chatId => {
        const trimmedChatId = chatId.trim();
        if (!trimmedChatId) {
            console.warn('[TelegramBot] WARN: Empty chat ID found in TELEGRAM_SUPPORT_CHAT_IDS.');
            return Promise.resolve({ ok: false, status: 'skipped' });
        }
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: trimmedChatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });
    });

    try {
        const results = await Promise.allSettled(sendPromises);

        results.forEach((result, index) => {
            const chatId = chatIds[index].trim();
            if (result.status === 'rejected') {
                console.error(`[TelegramBot] FATAL: Network error sending SUPPORT message to chat ID ${chatId}:`, result.reason);
            } else if (result.value && !result.value.ok) {
                if (result.value.status === 'skipped') return;
                 result.value.json().then(errorBody => {
                    console.error(`[TelegramBot] ERROR: Failed to send SUPPORT message to chat ID ${chatId}. Status: ${result.value.status}. Response:`, JSON.stringify(errorBody));
                }).catch(() => {
                    console.error(`[TelegramBot] ERROR: Failed to send SUPPORT message to chat ID ${chatId}. Status: ${result.value.status}. Could not parse error response.`);
                });
            } else if (result.value?.ok) {
                console.log(`[TelegramBot] SUCCESS: Sent SUPPORT message to chat ID ${chatId}.`);
            }
        });
    } catch (e) {
        console.error('[TelegramBot] FATAL: An unexpected error occurred while sending Telegram notifications.', e);
    }
}
