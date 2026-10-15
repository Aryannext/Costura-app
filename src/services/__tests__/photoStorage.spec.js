/**
 * DEF-14: en la versión web las fotos viven dentro del navegador (IndexedDB), así
 * que no hay una URL que el servidor pueda entregar. cargarFotoSrc las lee y las
 * entrega como data URL; en el teléfono sigue usando la ruta nativa.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const plataforma = vi.hoisted(() => ({ nativa: false, leer: vi.fn() }));
vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => plataforma.nativa,
        convertFileSrc: (ruta) => `capacitor://localhost/_capacitor_file_${ruta}`
    }
}));
vi.mock('@capacitor/filesystem', () => ({
    Directory: { Data: 'DATA' },
    Filesystem: {
        readFile: (...args) => plataforma.leer(...args),
        getUri: async () => ({ uri: '/data/user/0/app/files' })
    }
}));

const cargar = async () => {
    vi.resetModules();
    return import('../photoStorage.js');
};

beforeEach(() => {
    plataforma.nativa = false;
    plataforma.leer.mockReset();
});

describe('cargarFotoSrc (DEF-14)', () => {
    it('en el navegador lee el archivo y lo entrega como data URL', async () => {
        plataforma.leer.mockResolvedValue({ data: 'aGVsbG8=' });
        const { cargarFotoSrc } = await cargar();

        const src = await cargarFotoSrc('prenda_1_123.jpeg');

        expect(src).toBe('data:image/jpeg;base64,aGVsbG8=');
        expect(plataforma.leer).toHaveBeenCalledWith({ path: 'prenda_1_123.jpeg', directory: 'DATA' });
    });

    it('lee cada archivo una sola vez', async () => {
        plataforma.leer.mockResolvedValue({ data: 'aGVsbG8=' });
        const { cargarFotoSrc } = await cargar();

        await cargarFotoSrc('prenda_1_123.jpeg');
        await cargarFotoSrc('prenda_1_123.jpeg');

        expect(plataforma.leer).toHaveBeenCalledTimes(1);
    });

    it('si el archivo no se puede leer, no rompe: devuelve vacío', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        plataforma.leer.mockRejectedValue(new Error('File does not exist'));
        const { cargarFotoSrc } = await cargar();

        expect(await cargarFotoSrc('no-existe.jpeg')).toBe('');
    });

    it('una data URL o una URL web se usan tal cual', async () => {
        const { cargarFotoSrc } = await cargar();

        expect(await cargarFotoSrc('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
        expect(await cargarFotoSrc('https://ejemplo.com/a.jpg')).toBe('https://ejemplo.com/a.jpg');
        expect(plataforma.leer).not.toHaveBeenCalled();
    });

    it('en el teléfono usa la ruta nativa, sin leer el archivo', async () => {
        plataforma.nativa = true;
        const { cargarFotoSrc, initPhotoStorage } = await cargar();
        await initPhotoStorage();

        const src = await cargarFotoSrc('prenda_1_123.jpeg');

        expect(src).toBe('capacitor://localhost/_capacitor_file_/data/user/0/app/files/prenda_1_123.jpeg');
        expect(plataforma.leer).not.toHaveBeenCalled();
    });
});
