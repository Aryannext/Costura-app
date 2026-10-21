/**
 * Flujo completo de la pantalla de una orden contra SQLite real: componentes,
 * composables y consultas de verdad. Sólo se simulan los plugins nativos, el
 * router y el envío a Telegram.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('../../database/connection.js', async () =>
    (await import('../../__tests__/helpers/sqliteReal.js')).crearConexionFalsa());
vi.mock('vue-router', () => ({
    useRoute: () => ({ params: { id: '1' }, query: {} }),
    useRouter: () => ({ push: vi.fn(), back: vi.fn() })
}));
const camara = vi.hoisted(() => ({ getPhoto: vi.fn(), guardar: vi.fn(), borrar: vi.fn() }));
vi.mock('@capacitor/camera', () => ({
    Camera: { getPhoto: (...args) => camara.getPhoto(...args) }, CameraResultType: {}, CameraSource: {}
}));
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }));
vi.mock('../../composables/useHaptics.js', () => ({
    useHaptics: () => new Proxy({}, { get: () => () => {} })
}));
vi.mock('../../services/photoStorage.js', () => ({
    resolvePhotoSrc: (ruta) => ruta,
    cargarFotoSrc: async (ruta) => ruta,
    savePhotoFromBase64: (...args) => camara.guardar(...args),
    deletePhotoFile: (...args) => camara.borrar(...args)
}));
const telegram = vi.hoisted(() => ({ enviar: vi.fn() }));
vi.mock('../../composables/useTelegramBot.js', () => ({
    useTelegramBot: () => ({ sendTelegramMessage: (...args) => telegram.enviar(...args) })
}));

import { prepararMotor, nuevaBase } from '../../__tests__/helpers/sqliteReal.js';
import { db } from '../../database/connection.js';
import { migrations } from '../../database/migrations.js';
import { runMigrations } from '../../database/migrationRunner.js';
import { createCliente } from '../../database/queries/clientes.js';
import { createOrden } from '../../database/queries/ordenes.js';
import { createPrenda, saveFotografia } from '../../database/queries/prendas.js';
import { registrarPago } from '../../database/queries/pagos.js';
import OrdenDetailView from '../OrdenDetailView.vue';

async function asentar() {
    for (let i = 0; i < 5; i++) await flushPromises();
}

async function montarOrdenConPrendas(valores, fecha_entrega_estimada = '2099-01-01') {
    const id_cliente = await createCliente({ nombre: 'Ana', telefono: '3001234567', autoriza_datos: true });
    const id_orden = await createOrden({ id_cliente, fecha_entrega_estimada });
    for (const valor of valores) {
        await createPrenda({ id_orden, valor, descripcion_arreglo: 'Basta', id_tipo_prenda: 1 });
    }

    const wrapper = mount(OrdenDetailView, { global: { provide: { toast: vi.fn() } } });
    await asentar();
    await wrapper.findAll('.tabs button').find(b => b.text() === 'Prendas').trigger('click');
    await asentar();
    return wrapper;
}

async function marcar(wrapper, indice, estado) {
    await wrapper.findAll('.prenda-card')[indice].findAll('.estado-btn')[estado - 1].trigger('click');
    await asentar();
}

const textoModal = (wrapper) => wrapper.find('.confirm-modal').exists() ? wrapper.find('.confirm-modal').text() : null;

beforeAll(async () => {
    await prepararMotor();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

beforeEach(async () => {
    nuevaBase();
    await runMigrations(db, migrations);
    telegram.enviar.mockReset().mockResolvedValue(true);
});

describe('OrdenDetailView · cabecera', () => {
    it('muestra saldo y total con separador de miles, y el estado de pago sin confundirlo con el de la orden', async () => {
        const wrapper = await montarOrdenConPrendas([20000]);

        const cabecera = wrapper.find('.orden-header').text().replace(/\s+/g, ' ');
        expect(cabecera).toContain('Saldo $20.000 de $20.000');
        expect(cabecera).toContain('Ana');
        expect(wrapper.find('.pago-chip').text()).toBe('Por cobrar');
        // El avance va dentro de la cabecera, no en una tarjeta aparte.
        expect(wrapper.find('.orden-header .timeline-progress').exists()).toBe(true);
    });

    it('la fecha de entrega sale en rojo sólo si la orden está atrasada', async () => {
        const aTiempo = await montarOrdenConPrendas([20000]);
        expect(aTiempo.find('.entrega-atrasada').exists()).toBe(false);
        expect(aTiempo.find('.cliente-fechas').text()).toContain('Entrega el 1 ene');
        aTiempo.unmount();

        nuevaBase();
        await runMigrations(db, migrations);
        const tarde = await montarOrdenConPrendas([20000], '2020-01-01');
        expect(tarde.find('.entrega-atrasada').text()).toBe('Debía entregarse el 1 ene');
    });

    it('mientras quedan prendas por terminar abre en Prendas', async () => {
        const wrapper = await montarOrdenConPrendas([20000]);
        expect(wrapper.find('.tabs button.active').text()).toBe('Prendas');
    });
});

describe('OrdenDetailView · aviso al quedar la orden Lista para Entregar', () => {
    it('con una sola prenda, al terminarla ofrece el aviso', async () => {
        const wrapper = await montarOrdenConPrendas([20000]);

        await marcar(wrapper, 0, 3);

        expect(textoModal(wrapper)).toContain('Todas las prendas están terminadas');
    });

    it('con dos prendas, terminar la primera no lo ofrece y terminar la segunda sí', async () => {
        const wrapper = await montarOrdenConPrendas([20000, 10000]);

        await marcar(wrapper, 0, 3);
        expect(textoModal(wrapper)).toBeNull();

        await marcar(wrapper, 1, 3);
        expect(textoModal(wrapper)).toContain('Todas las prendas están terminadas');
    });
});

describe('OrdenDetailView · entregar prenda por prenda con deuda (RN-30, D-11, DEF-04)', () => {
    const estadoPrendas = async () =>
        (await db.query('SELECT id_estado_prenda FROM prenda ORDER BY id_prenda')).values.map(p => p.id_estado_prenda);
    const estadoOrden = async () =>
        (await db.query('SELECT id_estado_orden FROM orden_trabajo')).values[0].id_estado_orden;
    const botonDelModal = (wrapper, texto) =>
        wrapper.find('.confirm-modal').findAll('button').find(b => b.text() === texto);

    async function ordenTerminada(valores) {
        const wrapper = await montarOrdenConPrendas(valores);
        for (let i = 0; i < valores.length; i++) await marcar(wrapper, i, 3);
        // Terminar la última ofrece avisar por WhatsApp; aquí no interesa
        if (textoModal(wrapper)) await botonDelModal(wrapper, 'Cancelar').trigger('click');
        await asentar();
        return wrapper;
    }

    it('entregar una prenda con saldo pide confirmación mostrando lo que se debe, y sin confirmar no la entrega', async () => {
        const wrapper = await ordenTerminada([20000, 10000]);

        await marcar(wrapper, 0, 4);

        expect(textoModal(wrapper)).toContain('$30.000');
        expect(await estadoPrendas()).toEqual([3, 3]);

        await botonDelModal(wrapper, 'Cancelar').trigger('click');
        await asentar();
        expect(await estadoPrendas()).toEqual([3, 3]);
    });

    it('al confirmar la entrega; la última prenda también advierte antes de cerrar la orden con deuda', async () => {
        const wrapper = await ordenTerminada([20000, 10000]);

        await marcar(wrapper, 0, 4);
        await botonDelModal(wrapper, 'Sí, entregar').trigger('click');
        await asentar();
        expect(await estadoPrendas()).toEqual([4, 3]);

        await marcar(wrapper, 1, 4);
        expect(textoModal(wrapper)).toContain('$30.000');
        expect(await estadoOrden()).not.toBe(4);

        await botonDelModal(wrapper, 'Sí, entregar').trigger('click');
        await asentar();
        expect(await estadoPrendas()).toEqual([4, 4]);
        expect(await estadoOrden()).toBe(4);
    });

    it('sin saldo pendiente entrega directo, sin preguntar', async () => {
        const wrapper = await ordenTerminada([20000]);
        await registrarPago({ id_orden: 1, valor: 20000, id_metodo_pago: 1 });
        wrapper.unmount();

        const pagada = mount(OrdenDetailView, { global: { provide: { toast: vi.fn() } } });
        await asentar();
        await pagada.findAll('.tabs button').find(b => b.text() === 'Prendas').trigger('click');
        await asentar();

        await marcar(pagada, 0, 4);

        expect(textoModal(pagada)).toBeNull();
        expect(await estadoPrendas()).toEqual([4]);
    });
});

describe('OrdenDetailView · tomar una foto (RNF-05, DEF-05)', () => {
    async function abrirCamara(toast) {
        const id_cliente = await createCliente({ nombre: 'Ana', telefono: '3001234567', autoriza_datos: true });
        const id_orden = await createOrden({ id_cliente, fecha_entrega_estimada: '2099-01-01' });
        await createPrenda({ id_orden, valor: 20000, descripcion_arreglo: 'Basta', id_tipo_prenda: 1 });

        const wrapper = mount(OrdenDetailView, { global: { provide: { toast } } });
        await asentar();
        await wrapper.findAll('.tabs button').find(b => b.text() === 'Prendas').trigger('click');
        await asentar();
        await wrapper.findAll('.prenda-card .accion').find(b => b.text().startsWith('Fotos')).trigger('click');
        await asentar();
        await wrapper.find('.foto-nueva').trigger('click');
        await asentar();
        return wrapper;
    }

    const avisosDeExito = (toast) => toast.mock.calls.filter(([, tipo]) => tipo === 'success').map(([texto]) => texto);
    const fotosGuardadas = async () => (await db.query('SELECT COUNT(*) AS n FROM fotografia')).values[0].n;

    beforeEach(() => {
        camara.getPhoto.mockReset();
        camara.guardar.mockReset();
    });

    it('si la modista cancela la cámara, no se anuncia ninguna foto guardada', async () => {
        camara.getPhoto.mockRejectedValue(new Error('User cancelled photos app'));
        const toast = vi.fn();

        await abrirCamara(toast);

        expect(avisosDeExito(toast)).not.toContain('Fotografía guardada');
        expect(await fotosGuardadas()).toBe(0);
    });

    it('con una foto real, la guarda y lo anuncia una sola vez', async () => {
        camara.getPhoto.mockResolvedValue({ base64String: 'aGVsbG8=' });
        camara.guardar.mockResolvedValue('prenda_1_1.jpeg');
        const toast = vi.fn();

        await abrirCamara(toast);

        expect(avisosDeExito(toast).filter(t => t === 'Fotografía guardada')).toHaveLength(1);
        expect(await fotosGuardadas()).toBe(1);
    });

    it('DEF-15: el menú para elegir cámara o galería está en español', async () => {
        camara.getPhoto.mockRejectedValue(new Error('User cancelled photos app'));

        await abrirCamara(vi.fn());

        // Sin estas etiquetas, Capacitor y PWA Elements dicen «Photo / From Photos / Take Picture»
        expect(camara.getPhoto).toHaveBeenCalledWith(expect.objectContaining({
            promptLabelHeader: 'Foto de la prenda',
            promptLabelPhoto: 'Elegir de la galería',
            promptLabelPicture: 'Tomar foto',
            promptLabelCancel: 'Cancelar'
        }));
    });

    it('si la cámara falla de verdad, el error se muestra una sola vez y no se anuncia éxito', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        camara.getPhoto.mockRejectedValue(new Error('No hay permiso para usar la cámara'));
        const toast = vi.fn();

        await abrirCamara(toast);

        const errores = toast.mock.calls.filter(([, tipo]) => tipo === 'error').map(([texto]) => texto);
        expect(errores).toEqual(['No hay permiso para usar la cámara']);
        expect(avisosDeExito(toast)).not.toContain('Fotografía guardada');
    });
});

describe('OrdenDetailView · eliminar una foto (RF-32, RN-40, DEF-06, DEF-16)', () => {
    const contar = async (tabla) => (await db.query(`SELECT COUNT(*) AS n FROM ${tabla}`)).values[0].n;

    async function pedirBorrarFoto() {
        camara.borrar.mockReset().mockResolvedValue(true);
        const id_cliente = await createCliente({ nombre: 'Ana', telefono: '3001234567', autoriza_datos: true });
        const id_orden = await createOrden({ id_cliente, fecha_entrega_estimada: '2099-01-01' });
        const id_prenda = await createPrenda({ id_orden, valor: 20000, descripcion_arreglo: 'Basta', id_tipo_prenda: 1 });
        await saveFotografia(id_prenda, 'prenda_1_123.jpeg');

        const wrapper = mount(OrdenDetailView, { global: { provide: { toast: vi.fn() } } });
        await asentar();
        await wrapper.findAll('.tabs button').find(b => b.text() === 'Prendas').trigger('click');
        await asentar();
        await wrapper.findAll('.prenda-card .accion').find(b => b.text().startsWith('Fotos')).trigger('click');
        await asentar();

        await wrapper.find('.delete-foto-btn').trigger('click');
        await asentar();
        return wrapper;
    }

    const botonDelModal = (wrapper, texto) => wrapper.find('.confirm-modal').findAll('button').find(b => b.text() === texto);

    it('DEF-16: pregunta con el modal de la app, en español, y no con el confirm del sistema', async () => {
        const confirmDelSistema = vi.spyOn(window, 'confirm').mockReturnValue(true);

        const wrapper = await pedirBorrarFoto();

        expect(confirmDelSistema).not.toHaveBeenCalled();
        expect(textoModal(wrapper)).toContain('¿Eliminar esta foto?');
        expect(botonDelModal(wrapper, 'Cancelar')).toBeDefined();
        expect(botonDelModal(wrapper, 'Sí, eliminar')).toBeDefined();
        // Hasta confirmar no se borra nada
        expect(await contar('fotografia')).toBe(1);
        expect(camara.borrar).not.toHaveBeenCalled();
        confirmDelSistema.mockRestore();
    });

    it('al confirmar borra la fila y también el archivo del teléfono, sin tocar la prenda', async () => {
        const wrapper = await pedirBorrarFoto();

        await botonDelModal(wrapper, 'Sí, eliminar').trigger('click');
        await asentar();

        expect(camara.borrar).toHaveBeenCalledWith('prenda_1_123.jpeg');
        expect(await contar('fotografia')).toBe(0);
        expect(await contar('prenda')).toBe(1);
        expect(wrapper.find('.foto-thumb').exists()).toBe(false);
    });

    it('al cancelar la foto se queda', async () => {
        const wrapper = await pedirBorrarFoto();

        await botonDelModal(wrapper, 'Cancelar').trigger('click');
        await asentar();

        expect(textoModal(wrapper)).toBeNull();
        expect(camara.borrar).not.toHaveBeenCalled();
        expect(await contar('fotografia')).toBe(1);
    });
});

describe('OrdenDetailView · eliminar y anular sin deslizar (DEF-08)', () => {
    const hoja = () => document.body.querySelector('.ios-action-sheet')?.textContent ?? '';

    async function abrirPestana(wrapper, nombre) {
        await wrapper.findAll('.tabs button').find(b => b.text() === nombre).trigger('click');
        await asentar();
    }

    async function ordenConPago() {
        const id_cliente = await createCliente({ nombre: 'Ana', telefono: '3001234567', autoriza_datos: true });
        const id_orden = await createOrden({ id_cliente, fecha_entrega_estimada: '2099-01-01' });
        await createPrenda({ id_orden, valor: 20000, descripcion_arreglo: 'Basta', id_tipo_prenda: 1 });
        await registrarPago({ id_orden, valor: 5000, id_metodo_pago: 1 });
        const wrapper = mount(OrdenDetailView, { global: { provide: { toast: vi.fn() } }, attachTo: document.body });
        await asentar();
        return wrapper;
    }

    it('cada prenda tiene un botón Eliminar que abre la misma confirmación que el gesto', async () => {
        const wrapper = await ordenConPago();
        await abrirPestana(wrapper, 'Prendas');

        // Solo ícono: el nombre accesible es lo que oyen el lector de pantalla y el teclado
        const boton = wrapper.find('.prenda-card button[aria-label="Eliminar prenda"]');
        expect(boton.attributes('type')).toBe('button');

        await boton.trigger('click');
        await asentar();
        expect(hoja()).toContain('Eliminar Prenda');
        wrapper.unmount();
    });

    it('cada pago vigente tiene un botón Anular que abre la misma confirmación que el gesto', async () => {
        const wrapper = await ordenConPago();
        await abrirPestana(wrapper, 'Pagos');

        const boton = wrapper.findAll('.pago-card button').find(b => b.text() === 'Anular');
        expect(boton?.attributes('type')).toBe('button');

        await boton.trigger('click');
        await asentar();
        expect(hoja()).toContain('Anular Pago');
        wrapper.unmount();
    });

    it('un pago ya anulado no ofrece anularlo otra vez', async () => {
        const wrapper = await ordenConPago();
        await db.run("UPDATE pago SET anulado_en = datetime('now','localtime'), motivo_anulacion = 'Prueba'");
        wrapper.unmount();

        const otra = mount(OrdenDetailView, { global: { provide: { toast: vi.fn() } } });
        await asentar();
        await abrirPestana(otra, 'Pagos');

        expect(otra.findAll('.pago-card button').some(b => b.text() === 'Anular')).toBe(false);
    });
});
