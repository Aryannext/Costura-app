import { describe, it, expect, vi, beforeEach } from 'vitest';

const enviarTelegram = vi.fn();
vi.mock('../useTelegramBot.js', () => ({ useTelegramBot: () => ({ sendTelegramDocument: enviarTelegram }) }));
vi.mock('../../database/connection.js', () => ({
    exportDatabaseObject: vi.fn(async () => ({ database: 'costura_db', tables: [] })),
    importDatabaseFromJson: vi.fn()
}));
vi.mock('../../database/queries/prendas.js', () => ({ getTodasLasFotografias: vi.fn(async () => []) }));
vi.mock('../../services/cryptoService.js', () => ({
    cryptoService: { encryptBackup: vi.fn(async () => '{"cifrado":true}'), decryptBackup: vi.fn() }
}));
vi.mock('../../services/photoStorage.js', () => ({
    readPhotoAsBase64: vi.fn(), savePhotoFromBase64: vi.fn(), photoSizeInBytes: vi.fn(async () => 0),
    nombreDeArchivo: (r) => r, PHOTO_BACKUP_LIMIT_BYTES: 1
}));
const nativo = vi.hoisted(() => ({ valor: true }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => nativo.valor } }));
const fs = vi.hoisted(() => ({ writeFile: vi.fn(async () => ({ uri: 'file:///cache/copia.json' })) }));
vi.mock('@capacitor/filesystem', () => ({ Filesystem: fs, Directory: { Cache: 'CACHE' }, Encoding: { UTF8: 'utf8' } }));
const share = vi.hoisted(() => ({ share: vi.fn(async () => ({})) }));
vi.mock('@capacitor/share', () => ({ Share: share }));

import { useBackupRestore } from '../useBackupRestore.js';

describe('RNF-17 · copia de seguridad sin Telegram', () => {
    beforeEach(() => { vi.clearAllMocks(); nativo.valor = true; });

    it('en el teléfono guarda el archivo cifrado y abre Compartir, sin usar Telegram', async () => {
        const toast = vi.fn();
        const r = useBackupRestore(toast);
        r.openBackupModal('archivo');
        await r.executeCryptoAction('clave-maestra');

        expect(r.cryptoError.value).toBe('');
        expect(fs.writeFile).toHaveBeenCalledWith(expect.objectContaining({ data: '{"cifrado":true}', directory: 'CACHE' }));
        expect(share.share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///cache/copia.json'] }));
        expect(enviarTelegram).not.toHaveBeenCalled();
    });

    it('si cierra el menú sin elegir, avisa que no se guardó', async () => {
        share.share.mockRejectedValueOnce(new Error('Share canceled'));
        const r = useBackupRestore(vi.fn());
        r.openBackupModal('archivo');
        await r.executeCryptoAction('clave-maestra');
        expect(r.cryptoError.value).toContain('No se guardó la copia');
    });

    it('por defecto sigue enviando a Telegram', async () => {
        enviarTelegram.mockResolvedValueOnce(true);
        const r = useBackupRestore(vi.fn());
        r.openBackupModal();
        await r.executeCryptoAction('clave-maestra');
        expect(enviarTelegram).toHaveBeenCalledTimes(1);
        expect(share.share).not.toHaveBeenCalled();
    });
});
