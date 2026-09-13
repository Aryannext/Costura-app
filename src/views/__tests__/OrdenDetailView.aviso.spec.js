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
vi.mock('@capacitor/camera', () => ({ Camera: {}, CameraResultType: {}, CameraSource: {} }));
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }));
vi.mock('../../composables/useHaptics.js', () => ({
    useHaptics: () => new Proxy({}, { get: () => () => {} })
}));
vi.mock('../../services/photoStorage.js', () => ({
    resolvePhotoSrc: (ruta) => ruta, savePhotoFromBase64: vi.fn(), deletePhotoFile: vi.fn()
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
import { createPrenda } from '../../database/queries/prendas.js';
import OrdenDetailView from '../OrdenDetailView.vue';

async function asentar() {
    for (let i = 0; i < 5; i++) await flushPromises();
}

async function montarOrdenConPrendas(valores) {
    const id_cliente = await createCliente({ nombre: 'Ana', telefono: '3001234567' });
    const id_orden = await createOrden({ id_cliente, fecha_entrega_estimada: '2099-01-01' });
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
