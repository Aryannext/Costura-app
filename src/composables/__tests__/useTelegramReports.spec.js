import { describe, it, expect, vi } from 'vitest';

vi.mock('../useTelegramBot.js', () => ({ useTelegramBot: () => ({ sendTelegramMessage: vi.fn() }) }));
vi.mock('../useOrdenes.js', () => ({ useOrdenes: () => ({ ordenes: { value: [] }, fetchOrdenes: vi.fn() }) }));

import { resumirOrdenes } from '../useTelegramReports.js';

// Mediodía, para que la prueba no dependa de la hora a la que se ejecute.
const HOY = new Date(2026, 8, 13, 12, 0, 0);

describe('resumirOrdenes (reporte diario de Telegram)', () => {
    const ordenes = [
        { id_orden: 1, id_estado_orden: 2, fecha_entrega_estimada: '2026-09-01' }, // En Proceso y atrasada
        { id_orden: 2, id_estado_orden: 3, fecha_entrega_estimada: '2026-09-20' }, // Lista, a tiempo
        { id_orden: 3, id_estado_orden: 1, fecha_entrega_estimada: '2020-01-01' }, // sin prendas
        { id_orden: 4, id_estado_orden: 4, fecha_entrega_estimada: '2020-01-01' }, // entregada
        { id_orden: 5, id_estado_orden: 5, fecha_entrega_estimada: '2020-01-01' }  // cancelada
    ];

    it('cuenta las atrasadas por fecha_entrega_estimada (antes daba siempre cero)', () => {
        expect(resumirOrdenes(ordenes, HOY).atrasadas).toBe(1);
    });

    it('RN-04: órdenes sin prendas, entregadas y canceladas no cuentan', () => {
        expect(resumirOrdenes(ordenes, HOY)).toEqual({ activas: 2, listas: 1, atrasadas: 1 });
    });

    it('una orden que se entrega hoy no está atrasada', () => {
        const hoy = [{ id_orden: 6, id_estado_orden: 2, fecha_entrega_estimada: '2026-09-13' }];
        expect(resumirOrdenes(hoy, HOY).atrasadas).toBe(0);
    });
});
