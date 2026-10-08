import { describe, it, expect, vi, beforeEach } from 'vitest';

const capgo = vi.hoisted(() => ({
    notifyAppReady: vi.fn(),
    list: vi.fn(),
    current: vi.fn(),
    addListener: vi.fn(),
    getLatest: vi.fn(),
    download: vi.fn(),
    set: vi.fn()
}));
vi.mock('@capgo/capacitor-updater', () => ({ CapacitorUpdater: capgo }));

// El estado de las actualizaciones es global al módulo: se recarga en cada prueba
async function nuevoUseUpdates() {
    vi.resetModules();
    const { useUpdates } = await import('../useUpdates.js');
    return useUpdates();
}

describe('useUpdates · buscar actualización a mano', () => {
    beforeEach(() => vi.clearAllMocks());

    it('descarga la versión nueva y la deja lista para instalar', async () => {
        capgo.getLatest.mockResolvedValue({ version: '1.2.0', url: 'https://x/1.2.0.zip' });
        capgo.download.mockResolvedValue({ version: '1.2.0', id: 'b-12' });
        const toast = vi.fn();
        const u = await nuevoUseUpdates();

        await u.manualCheck(toast);

        expect(capgo.download).toHaveBeenCalledWith({ version: '1.2.0', url: 'https://x/1.2.0.zip' });
        expect(u.updateAvailable.value).toBe(true);
        expect(u.updateVersion.value).toBe('1.2.0');
        expect(toast).toHaveBeenLastCalledWith(expect.stringContaining('v1.2.0'), 'success');
    });

    it('sin versión nueva lo dice y no descarga nada', async () => {
        capgo.getLatest.mockResolvedValue({});
        const toast = vi.fn();
        const u = await nuevoUseUpdates();

        await u.manualCheck(toast);

        expect(capgo.download).not.toHaveBeenCalled();
        expect(u.updateAvailable.value).toBe(false);
        expect(toast).toHaveBeenLastCalledWith('Ya tienes la versión más reciente instalada.', 'info');
    });

    it('el error up_to_date de Capgo no se muestra como fallo', async () => {
        capgo.getLatest.mockRejectedValue(new Error('up_to_date'));
        const toast = vi.fn();
        await (await nuevoUseUpdates()).manualCheck(toast);
        expect(toast).toHaveBeenLastCalledWith('Estás en la última versión.', 'info');
    });

    it('sin conexión avisa del error', async () => {
        capgo.getLatest.mockRejectedValue(new Error('network'));
        const toast = vi.fn();
        await (await nuevoUseUpdates()).manualCheck(toast);
        expect(toast).toHaveBeenLastCalledWith(expect.stringContaining('Error al buscar'), 'error');
    });

    it('funciona sin función de aviso', async () => {
        capgo.getLatest.mockResolvedValue({});
        await expect((await nuevoUseUpdates()).manualCheck()).resolves.toBeUndefined();
    });
});

describe('useUpdates · al arrancar', () => {
    beforeEach(() => vi.clearAllMocks());

    it('ofrece un paquete ya descargado solo si es más nuevo que el actual', async () => {
        capgo.current.mockResolvedValue({ bundle: { id: 'actual', version: '1.1.2' } });
        capgo.list.mockResolvedValue({ bundles: [
            { id: 'viejo', version: '1.1.0', status: 'success' },
            { id: 'roto', version: '1.3.0', status: 'error' },
            { id: 'nuevo', version: '1.1.10', status: 'success' }
        ] });
        const u = await nuevoUseUpdates();

        await u.initUpdates();

        expect(capgo.notifyAppReady).toHaveBeenCalled();
        expect(u.updateVersion.value).toBe('1.1.10');
    });

    it('cuando Capgo termina una descarga, la marca como disponible', async () => {
        capgo.current.mockResolvedValue({ bundle: { id: 'actual', version: '1.1.2' } });
        capgo.list.mockResolvedValue({ bundles: [] });
        const u = await nuevoUseUpdates();
        await u.initUpdates();

        const alTerminar = capgo.addListener.mock.calls.find(([evento]) => evento === 'downloadComplete')[1];
        alTerminar({ bundle: { version: '1.4.0', id: 'b-14' } });
        alTerminar({});

        expect(u.updateAvailable.value).toBe(true);
        expect(u.updateVersion.value).toBe('1.4.0');
    });
});
