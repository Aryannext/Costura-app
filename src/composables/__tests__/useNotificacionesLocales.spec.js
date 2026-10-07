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

describe('P1-7 · permisos del aviso de las 8:00', () => {
    it('interpreta los permisos de Android', async () => {
        const { interpretarPermisosAviso } = await import('../useNotificacionesLocales.js');
        expect(interpretarPermisosAviso('granted', 'granted')).toBe('ok');
        expect(interpretarPermisosAviso('granted', 'denied')).toBe('inexacto');
        expect(interpretarPermisosAviso('denied', 'granted')).toBe('sin-permiso');
        expect(interpretarPermisosAviso('prompt', 'denied')).toBe('sin-permiso');
    });

    it('sin alarmas exactas abre el ajuste de Android y rearma los avisos', async () => {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const { getEntregasPorDia } = await import('../../database/queries/ordenes.js');
        const { useNotificacionesLocales } = await import('../useNotificacionesLocales.js');
        LocalNotifications.checkPermissions.mockResolvedValue({ display: 'granted' });
        LocalNotifications.checkExactNotificationSetting = vi.fn()
            .mockResolvedValueOnce({ exact_alarm: 'denied' })
            .mockResolvedValue({ exact_alarm: 'granted' });
        LocalNotifications.changeExactNotificationSetting = vi.fn().mockResolvedValue({});
        getEntregasPorDia.mockResolvedValue([]);

        const resultado = await useNotificacionesLocales().activarAviso();

        expect(LocalNotifications.changeExactNotificationSetting).toHaveBeenCalledTimes(1);
        expect(resultado).toBe('ok');
        expect(LocalNotifications.cancel).toHaveBeenCalled();
    });

    it('en el navegador (sin plugin nativo) responde no-disponible', async () => {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const { useNotificacionesLocales } = await import('../useNotificacionesLocales.js');
        LocalNotifications.checkPermissions.mockRejectedValue(new Error('Not implemented on web.'));
        expect(await useNotificacionesLocales().estadoAviso()).toBe('no-disponible');
    });
});
