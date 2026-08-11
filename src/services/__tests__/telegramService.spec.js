import { describe, it, expect } from 'vitest';
import { openTelegram, generateTelegramLink } from '../telegramService.js';

describe('telegramService', () => {
    describe('openTelegram', () => {
        it('should throw an Error if telefono is empty', () => {
            expect(() => {
                openTelegram('', 'RECORDATORIO_PAGO', {});
            }).toThrow('El cliente no tiene un teléfono registrado.');
        });

        it('should call window.open with the correct URL if telefono is valid', () => {
            let openedUrl = '';
            // Mock window.open
            global.window = {
                open: (url, target) => {
                    openedUrl = url;
                }
            };

            openTelegram('+573001234567', 'LISTA_ENTREGA', { nombreCliente: 'Juan', idOrden: 1 });

            expect(openedUrl).toContain('https://t.me/+573001234567?text=');
            expect(openedUrl).toContain('Juan');
            expect(openedUrl).toContain('1');
        });
    });
});
