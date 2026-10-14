import { describe, it, expect, beforeEach, vi } from 'vitest';

const config = new Map();
vi.mock('../../database/queries/configuracion.js', () => ({
    getConfig: vi.fn(async (clave) => config.get(clave) ?? null),
    updateConfig: vi.fn(async (clave, valor) => { config.set(clave, valor); })
}));

const {
    URL_VITRINA, CLAVE_TOKEN_VITRINA, crearVitrina, vincularVitrina, cargarMiVitrina,
    publicarPrenda, marcarVendida, cambiarPrecio, quitarPrenda, borrarVitrina, actualizarPerfilVitrina,
    leerTokenVitrina, urlFotoVitrina
} = await import('../vitrina.js');

function respuesta(estado, cuerpo) {
    return {
        status: estado,
        ok: estado >= 200 && estado < 300,
        json: async () => {
            if (cuerpo === undefined) throw new Error('sin cuerpo');
            return cuerpo;
        }
    };
}

let fetchMock;
beforeEach(() => {
    config.clear();
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
});

describe('Vitrina de Modistas desde la app', () => {
    it('al crear la vitrina guarda el código en la configuración y no lo devuelve', async () => {
        fetchMock.mockResolvedValue(respuesta(201, { token: 'abc', perfil: { id: 1, estado: 'pendiente' }, prendas: [] }));
        const v = await crearVitrina({ nombre: 'Taller' });

        expect(v).toEqual({ perfil: { id: 1, estado: 'pendiente' }, prendas: [] });
        expect(config.get(CLAVE_TOKEN_VITRINA)).toBe('abc');
        const [url, opciones] = fetchMock.mock.calls[0];
        expect(url).toBe(`${URL_VITRINA}/api/modistas`);
        expect(opciones.method).toBe('POST');
        expect(JSON.parse(opciones.body)).toEqual({ nombre: 'Taller' });
    });

    it('las llamadas de la modista llevan su código', async () => {
        config.set(CLAVE_TOKEN_VITRINA, 'xyz');
        fetchMock.mockResolvedValue(respuesta(200, { perfil: {}, prendas: [] }));
        await cargarMiVitrina();
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer xyz');
    });

    it('sin código no llama al servidor', async () => {
        await expect(cargarMiVitrina()).rejects.toMatchObject({ estado: 401 });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sin internet da un mensaje claro', async () => {
        config.set(CLAVE_TOKEN_VITRINA, 'xyz');
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(cargarMiVitrina()).rejects.toThrow(/conexión/);
    });

    it('muestra el mensaje de error del servidor, o uno genérico si no hay', async () => {
        config.set(CLAVE_TOKEN_VITRINA, 'xyz');
        fetchMock.mockResolvedValueOnce(respuesta(400, { error: 'Elige una categoría de la lista.' }));
        await expect(publicarPrenda({})).rejects.toThrow('Elige una categoría de la lista.');
        fetchMock.mockResolvedValueOnce(respuesta(502));
        await expect(publicarPrenda({})).rejects.toMatchObject({ estado: 502, message: expect.stringMatching(/no respondió/) });
    });

    it('vincular con un código que no sirve no lo guarda', async () => {
        fetchMock.mockResolvedValue(respuesta(401, { error: 'El código de tu vitrina no es válido.' }));
        await expect(vincularVitrina('  malo ')).rejects.toThrow(/no es válido/);
        expect(await leerTokenVitrina()).toBe('');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer malo');
        await expect(vincularVitrina('')).rejects.toThrow(/Escribe/);
    });

    it('vincular con un código bueno lo guarda', async () => {
        fetchMock.mockResolvedValue(respuesta(200, { perfil: { id: 3 }, prendas: [] }));
        await vincularVitrina('bueno');
        expect(await leerTokenVitrina()).toBe('bueno');
    });

    it('edita, marca vendida, cambia precio y quita prendas con la ruta correcta', async () => {
        config.set(CLAVE_TOKEN_VITRINA, 'xyz');
        fetchMock.mockResolvedValue(respuesta(200, {}));
        await marcarVendida(7, true);
        await cambiarPrecio(7, 90000);
        await actualizarPerfilVitrina({ horario: 'Sábados' });
        fetchMock.mockResolvedValue(respuesta(204));
        await quitarPrenda(7);
        const llamadas = fetchMock.mock.calls.map(([url, o]) => [url.replace(URL_VITRINA, ''), o.method, o.body && JSON.parse(o.body)]);
        expect(llamadas).toEqual([
            ['/api/mi-vitrina/prendas/7', 'PATCH', { vendida: true }],
            ['/api/mi-vitrina/prendas/7', 'PATCH', { precio: 90000 }],
            ['/api/mi-vitrina', 'PUT', { horario: 'Sábados' }],
            ['/api/mi-vitrina/prendas/7', 'DELETE', undefined]
        ]);
    });

    it('borrar la vitrina olvida el código', async () => {
        config.set(CLAVE_TOKEN_VITRINA, 'xyz');
        fetchMock.mockResolvedValue(respuesta(204));
        await borrarVitrina();
        expect(await leerTokenVitrina()).toBe('');
    });

    it('arma la dirección de las fotos', () => {
        expect(urlFotoVitrina('fotos/a.jpg')).toBe(`${URL_VITRINA}/fotos/a.jpg`);
    });
});
