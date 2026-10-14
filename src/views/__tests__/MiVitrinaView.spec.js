import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('@capacitor/camera', () => ({
    Camera: { getPhoto: vi.fn(async () => ({ base64String: 'Zm90bw==', format: 'jpeg' })) },
    CameraResultType: { Base64: 'base64' },
    CameraSource: { Prompt: 'PROMPT' }
}));

const api = vi.hoisted(() => ({ token: '', vitrina: null }));
vi.mock('../../services/vitrina.js', async () => {
    const { vi: v } = await import('vitest');
    class ErrorVitrina extends Error {
        constructor(m, estado = 0) { super(m); this.estado = estado; }
    }
    return {
        ErrorVitrina,
        CATEGORIAS_VITRINA: ['Vestidos', 'Blusas'],
        URL_VITRINA: 'https://ejemplo.test/vitrina',
        leerTokenVitrina: v.fn(async () => api.token),
        nombreDelTaller: v.fn(async () => 'Arreglos Doña Rosa'),
        cargarMiVitrina: v.fn(async () => api.vitrina),
        crearVitrina: v.fn(async (perfil) => ({ perfil: { ...perfil, id: 1, estado: 'pendiente' }, prendas: [] })),
        vincularVitrina: v.fn(),
        publicarPrenda: v.fn(async (p) => ({ ...p, id: 9, foto: 'fotos/x.jpg', vendida: false })),
        marcarVendida: v.fn(async (id, vendida) => ({ vendida })),
        quitarPrenda: v.fn(async () => null),
        borrarVitrina: v.fn(async () => null),
        olvidarVitrina: v.fn(async () => { api.token = ''; }),
        urlFotoVitrina: (r) => `https://ejemplo.test/vitrina/${r}`
    };
});

import * as servicio from '../../services/vitrina.js';
import MiVitrinaView from '../MiVitrinaView.vue';

const toast = vi.fn();
async function montar() {
    const wrapper = mount(MiVitrinaView, { global: { provide: { toast } } });
    await flushPromises();
    return wrapper;
}

const VITRINA = {
    perfil: { id: 1, nombre: 'Taller Doña Marta', ciudad: 'Bogotá', barrio: 'Kennedy', estado: 'aprobada' },
    prendas: [
        { id: 1, titulo: 'Vestido de lino', categoria: 'Vestidos', precio: 185000, talla: 'M', foto: 'fotos/a.jpg', vendida: false },
        { id: 2, titulo: 'Blusa a rayas', categoria: 'Blusas', precio: 78000, talla: 'S', foto: 'fotos/b.jpg', vendida: true }
    ]
};

describe('MiVitrinaView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.token = '';
        api.vitrina = structuredClone(VITRINA);
    });

    it('sin vitrina ofrece crearla con el nombre del taller ya puesto, y exige aceptar las condiciones', async () => {
        const w = await montar();
        expect(w.find('#v-nombre').element.value).toBe('Arreglos Doña Rosa');
        const crear = w.findAll('button[type="submit"]')[0];
        expect(crear.text()).toBe('Crear mi vitrina');
        expect(crear.attributes('disabled')).toBeDefined();

        await w.find('#v-ciudad').setValue('Bogotá');
        await w.find('#v-barrio').setValue('Kennedy');
        await w.find('#v-whatsapp').setValue('3001234567');
        await w.find('.acepto input').setValue(true);
        await w.findAll('form')[0].trigger('submit');
        await flushPromises();

        // El arreglo vacío del formulario no viaja al servidor
        expect(servicio.crearVitrina).toHaveBeenCalledWith(expect.objectContaining({ ciudad: 'Bogotá', servicios: [], aceptaCondiciones: true }));
        expect(w.find('.estado').text()).toBe('Esperando aprobación');
    });

    it('con vitrina muestra el estado y cuántas prendas hay a la venta', async () => {
        api.token = 'abc';
        const w = await montar();
        expect(w.find('.estado').text()).toBe('Publicada');
        expect(w.text()).toContain('Mis prendas (1 a la venta)');
        expect(w.findAll('.item')).toHaveLength(2);
        expect(w.find('.item img').attributes('src')).toBe('https://ejemplo.test/vitrina/fotos/a.jpg');
    });

    it('publica una prenda con su foto', async () => {
        api.token = 'abc';
        const w = await montar();
        await w.find('.publicar').trigger('click');
        const enviar = w.find('form button[type="submit"]');
        expect(enviar.attributes('disabled')).toBeDefined();

        await w.find('.foto').trigger('click');
        await flushPromises();
        await w.find('#p-titulo').setValue('Falda midi');
        await w.find('#p-precio').setValue(95000);
        await w.find('form').trigger('submit');
        await flushPromises();

        expect(servicio.publicarPrenda).toHaveBeenCalledWith(expect.objectContaining({ foto: 'Zm90bw==', titulo: 'Falda midi', precio: 95000, categoria: 'Vestidos' }));
        expect(w.findAll('.item')).toHaveLength(3);
        expect(toast).toHaveBeenCalledWith('Prenda publicada.', 'success');
    });

    it('quitar una prenda pide confirmación', async () => {
        api.token = 'abc';
        const w = await montar();
        const quitar = () => w.findAll('.item')[0].findAll('button').find(b => /Quitar|quitarla/.test(b.text()));
        await quitar().trigger('click');
        expect(servicio.quitarPrenda).not.toHaveBeenCalled();
        expect(quitar().text()).toBe('Sí, quitarla');
        await quitar().trigger('click');
        await flushPromises();
        expect(servicio.quitarPrenda).toHaveBeenCalledWith(1);
        expect(w.findAll('.item')).toHaveLength(1);
    });

    it('si el código ya no sirve, lo olvida y vuelve a ofrecer crear o vincular', async () => {
        api.token = 'viejo';
        servicio.cargarMiVitrina.mockRejectedValueOnce(new servicio.ErrorVitrina('El código de tu vitrina no es válido.', 401));
        const w = await montar();
        expect(servicio.olvidarVitrina).toHaveBeenCalled();
        expect(w.text()).toContain('¿Ya tienes una vitrina?');
        expect(w.text()).toContain('El código de tu vitrina no es válido.');
    });

    it('sin internet lo dice y deja reintentar', async () => {
        api.token = 'abc';
        servicio.cargarMiVitrina.mockRejectedValueOnce(new servicio.ErrorVitrina('No hay conexión con la vitrina.'));
        const w = await montar();
        expect(w.find('.aviso--error').text()).toContain('No hay conexión');
        await w.find('.aviso--error button').trigger('click');
        await flushPromises();
        expect(w.find('.estado').exists()).toBe(true);
    });
});
