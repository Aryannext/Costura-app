import { describe, it, expect, vi } from 'vitest';
import {
    construirRecordatorios,
    ID_BASE_RECORDATORIO,
    HORA_RECORDATORIO,
    DIAS_A_PROGRAMAR
} from '../useNotificacionesLocales.js';

vi.mock('@capacitor/local-notifications', () => ({
    LocalNotifications: {
        checkPermissions: vi.fn(),
        requestPermissions: vi.fn(),
        cancel: vi.fn(),
        schedule: vi.fn()
    }
}));

vi.mock('../../database/queries/ordenes.js', () => ({
    getEntregasPorDia: vi.fn()
}));

// Martes 9 de septiembre de 2026, 07:00 hora local: antes de la hora del aviso.
const AHORA = new Date(2026, 8, 9, 7, 0, 0);

describe('construirRecordatorios', () => {
    it('Sin entregas -> ningún aviso', () => {
        expect(construirRecordatorios([], AHORA)).toEqual([]);
        expect(construirRecordatorios(null, AHORA)).toEqual([]);
    });

    it('Un día con entregas -> un aviso a las 8 de ese día', () => {
        const avisos = construirRecordatorios([{ dia: '2026-09-09', total: 3 }], AHORA);

        expect(avisos).toHaveLength(1);
        expect(avisos[0].id).toBe(ID_BASE_RECORDATORIO);
        expect(avisos[0].body).toContain('3 órdenes');
        expect(avisos[0].schedule.at.getHours()).toBe(HORA_RECORDATORIO);
        expect(avisos[0].schedule.at.getDate()).toBe(9);
    });

    // El fallo original: una sola notificación repetitiva congelaba la cuenta
    // del día en que se programó y mentía todas las mañanas siguientes.
    it('Cada día lleva su propia cuenta, no la del primero', () => {
        const avisos = construirRecordatorios([
            { dia: '2026-09-09', total: 3 },
            { dia: '2026-09-10', total: 1 },
            { dia: '2026-09-11', total: 7 }
        ], AHORA);

        expect(avisos.map(a => a.body)).toEqual([
            'Tienes 3 órdenes para entregar hoy. ¡Revisa el taller!',
            'Tienes 1 orden para entregar hoy. ¡Revisa el taller!',
            'Tienes 7 órdenes para entregar hoy. ¡Revisa el taller!'
        ]);
    });

    it('Los identificadores son estables y distintos por día', () => {
        const avisos = construirRecordatorios([
            { dia: '2026-09-09', total: 1 },
            { dia: '2026-09-11', total: 2 }
        ], AHORA);

        expect(avisos.map(a => a.id)).toEqual([ID_BASE_RECORDATORIO, ID_BASE_RECORDATORIO + 2]);
    });

    it('Singular con una sola orden', () => {
        const [aviso] = construirRecordatorios([{ dia: '2026-09-10', total: 1 }], AHORA);
        expect(aviso.body).toContain('1 orden para');
        expect(aviso.body).not.toContain('órdenes');
    });

    it('Si las 8 de hoy ya pasaron, hoy no se programa', () => {
        const mediodia = new Date(2026, 8, 9, 12, 0, 0);

        const avisos = construirRecordatorios([
            { dia: '2026-09-09', total: 3 },
            { dia: '2026-09-10', total: 2 }
        ], mediodia);

        expect(avisos).toHaveLength(1);
        expect(avisos[0].schedule.at.getDate()).toBe(10);
    });

    it('Días con cero entregas no generan aviso', () => {
        const avisos = construirRecordatorios([
            { dia: '2026-09-09', total: 0 },
            { dia: '2026-09-10', total: 2 }
        ], AHORA);

        expect(avisos).toHaveLength(1);
        expect(avisos[0].schedule.at.getDate()).toBe(10);
    });

    it('Fuera del horizonte de programación -> se descarta', () => {
        const demasiadoLejos = new Date(2026, 8, 9 + DIAS_A_PROGRAMAR, 0, 0, 0);
        const avisos = construirRecordatorios([
            { dia: `2026-09-${9 + DIAS_A_PROGRAMAR}`, total: 5 }
        ], AHORA);

        expect(avisos).toEqual([]);
        expect(demasiadoLejos.getDate()).toBe(9 + DIAS_A_PROGRAMAR);
    });

    it('Una fecha ya pasada no se programa', () => {
        expect(construirRecordatorios([{ dia: '2026-09-08', total: 4 }], AHORA)).toEqual([]);
    });
});
