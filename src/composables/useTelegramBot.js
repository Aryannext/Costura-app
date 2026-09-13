import { inject } from 'vue';
import { getConfig, updateConfig } from '../database/queries/configuracion.js';

export const CLAVE_BOT_TOKEN = 'telegram_bot_token';
export const CLAVE_CHAT_ID = 'telegram_chat_id';

/**
 * Lee la configuración del bot de la tabla `configuracion`.
 * Vive en la base de datos, y no en localStorage, por dos razones: entra sola
 * en el respaldo cifrado, y no se la lleva por delante una limpieza de datos
 * del WebView.
 */
export async function leerConfigTelegram() {
    const [botToken, chatId] = await Promise.all([
        getConfig(CLAVE_BOT_TOKEN),
        getConfig(CLAVE_CHAT_ID)
    ]);
    return { botToken, chatId };
}

export async function guardarConfigTelegram(botToken, chatId) {
    await updateConfig(CLAVE_BOT_TOKEN, botToken);
    await updateConfig(CLAVE_CHAT_ID, chatId);
}

/**
 * Instalaciones anteriores guardaban el bot en localStorage. Se traslada a la
 * base de datos la primera vez que arranca esta versión y se borra el rastro,
 * para que no queden dos fuentes de verdad.
 */
export async function migrarConfigTelegramDesdeLocalStorage() {
    try {
        for (const clave of [CLAVE_BOT_TOKEN, CLAVE_CHAT_ID]) {
            const heredado = localStorage.getItem(clave);
            if (!heredado) continue;

            const actual = await getConfig(clave);
            if (!actual) {
                await updateConfig(clave, heredado);
            }
            localStorage.removeItem(clave);
        }
    } catch (e) {
        console.error("No se pudo migrar la configuración de Telegram", e);
    }
}

export function useTelegramBot() {
    const toast = inject('toast', null);

    async function sendTelegramMessage(text, parseMode = 'Markdown', configOverride = null) {
        const { botToken, chatId } = configOverride || await leerConfigTelegram();
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
        const { botToken, chatId } = await leerConfigTelegram();
        if (!botToken || !chatId) {
            if (toast) toast('Debes configurar Telegram primero.', 'error');
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
        isConfigured: async () => {
            const { botToken, chatId } = await leerConfigTelegram();
            return !!botToken && !!chatId;
        }
    };
}
