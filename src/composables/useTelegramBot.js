import { inject } from 'vue';

export function useTelegramBot() {
    const toast = inject('toast');

    function getConfig() {
        const botToken = localStorage.getItem('telegram_bot_token');
        const chatId = localStorage.getItem('telegram_chat_id');
        return { botToken, chatId };
    }

    async function sendTelegramMessage(text, parseMode = 'Markdown') {
        const { botToken, chatId } = getConfig();
        if (!botToken || !chatId) {
            console.warn("Telegram no configurado. Ignorando mensaje.");
            return false;
        }

        try {
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: parseMode
                })
            });

            if (!response.ok) {
                console.error("Error Telegram API:", await response.json());
                return false;
            }
            return true;
        } catch (error) {
            console.error("Network Error Telegram:", error);
            return false;
        }
    }

    async function sendTelegramDocument(fileContent, filename, caption = '') {
        const { botToken, chatId } = getConfig();
        if (!botToken || !chatId) {
            toast('Debes configurar Telegram primero.', 'error');
            return false;
        }

        try {
            const blob = new Blob([fileContent], { type: 'application/json' });
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('document', blob, filename);
            if (caption) {
                formData.append('caption', caption);
            }

            const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
            const response = await fetch(url, {
                method: 'POST',
                body: formData // No Content-Type header, fetch sets multipart/form-data automatically
            });

            if (!response.ok) {
                console.error("Error Telegram API sendDocument:", await response.json());
                return false;
            }
            return true;
        } catch (error) {
            console.error("Network Error Telegram Document:", error);
            return false;
        }
    }

    return {
        sendTelegramMessage,
        sendTelegramDocument,
        isConfigured: () => {
            const { botToken, chatId } = getConfig();
            return !!botToken && !!chatId;
        }
    };
}
