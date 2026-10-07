// Reporte financiero (pantalla Reportes) contra SQLite real.
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

vi.mock('../database/connection.js', async () =>
    (await import('./helpers/sqliteReal.js')).crearConexionFalsa());
vi.mock('vue', async (importOriginal) => ({ ...(await importOriginal()), inject: () => () => {} }));
vi.mock('@capacitor/camera', () => ({ Camera: {}, CameraResultType: {}, CameraSource: {} }));
vi.mock('../services/photoStorage.js', () => ({ savePhotoFromBase64: vi.fn(), deletePhotoFile: vi.fn() }));

import { prepararMotor, nuevaBase } from './helpers/sqliteReal.js';
import { db } from '../database/connection.js';
import { migrations } from '../database/migrations.js';
import { runMigrations } from '../database/migrationRunner.js';
import { getReporteFinanciero } from '../database/queries/reportes.js';
import { useClientes } from '../composables/useClientes.js';
import { useOrdenes } from '../composables/useOrdenes.js';
import { usePrendas } from '../composables/usePrendas.js';
import { usePagos } from '../composables/usePagos.js';
import { fechaLocalISO, sumarDias } from '../services/fechas.js';

const hoy = fechaLocalISO();
const enDias = (n) => fechaLocalISO(sumarDias(new Date(), n));

async function ordenCon(valores, { cancelar = false } = {}) {
    const id_cliente = await useClientes().saveCliente({ nombre: 'Ana', telefono: '3001234567', autoriza_datos: true });
    const id = await useOrdenes().saveOrden({ id_cliente, fecha_entrega_estimada: enDias(5) });
    for (const valor of valores) {
        await usePrendas().savePrenda({ id_orden: id, valor, descripcion_arreglo: 'Basta', id_tipo_prenda: 1 });
    }
    if (cancelar) await useOrdenes().changeEstado(id, 5, 'Cancelada', { id_orden: id, id_estado_orden: 2 });
    return id;
}

beforeAll(async () => {
    await prepararMotor();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

beforeEach(async () => {
    nuevaBase();
    await runMigrations(db, migrations);
});

describe('Reporte financiero', () => {
    it('ingresos: suma los pagos del período y no cuenta los anulados', async () => {
        const id = await ordenCon([30000]);
        await usePagos().savePago({ id_orden: id, valor: 10000, id_metodo_pago: 1 }, 30000);
        const segundo = await usePagos().savePago({ id_orden: id, valor: 5000, id_metodo_pago: 1 }, 20000);
        await usePagos().anularPago(segundo, 'Registrado dos veces');

        const r = await getReporteFinanciero(hoy, hoy);
        expect(r.kpis.ingresosTotales).toBe(10000);
    });

    it('ticket promedio: una orden cancelada no infla el promedio ni cuenta como trabajo', async () => {
        await ordenCon([20000]);
        await ordenCon([40000]);
        await ordenCon([300000], { cancelar: true });

        const r = await getReporteFinanciero(hoy, hoy);
        expect(r.kpis.ticketPromedio).toBe(30000);
        expect(r.kpis.prendasProcesadas).toBe(2);
    });

    it('ticket promedio: una orden sin prendas (valor 0) no baja el promedio', async () => {
        await ordenCon([20000]);
        await ordenCon([]);

        const r = await getReporteFinanciero(hoy, hoy);
        expect(r.kpis.ticketPromedio).toBe(20000);
    });

    it('el ticket promedio es un número, no un texto', async () => {
        await ordenCon([10000]);
        await ordenCon([25000]);
        const r = await getReporteFinanciero(hoy, hoy);
        expect(typeof r.kpis.ticketPromedio).toBe('number');
    });
});
