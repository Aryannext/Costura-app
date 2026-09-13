import { describe, it, expect } from 'vitest';
import {
    clasificarVencimiento, interpretarDiasAnticipacion, VENCIMIENTO, DIAS_ANTICIPACION_POR_DEFECTO
} from '../vencimientos.js';

// Mediodía, para que ninguna prueba dependa de la hora a la que se ejecute.
const HOY = new Date(2026, 8, 13, 12, 0, 0);

describe('clasificarVencimiento (RN-38)', () => {
    it('fecha anterior a hoy -> atrasada', () => {
        expect(clasificarVencimiento('2026-09-12', HOY, 3)).toBe(VENCIMIENTO.ATRASADA);
    });

    it('hoy -> próxima, no atrasada', () => {
        expect(clasificarVencimiento('2026-09-13', HOY, 3)).toBe(VENCIMIENTO.PROXIMA);
    });

    it('justo al final del período -> próxima', () => {
        expect(clasificarVencimiento('2026-09-16', HOY, 3)).toBe(VENCIMIENTO.PROXIMA);
    });

    it('un día después del período -> nada', () => {
        expect(clasificarVencimiento('2026-09-17', HOY, 3)).toBeNull();
    });

    it('el período lo decide el negocio', () => {
        expect(clasificarVencimiento('2026-09-20', HOY, 7)).toBe(VENCIMIENTO.PROXIMA);
        expect(clasificarVencimiento('2026-09-20', HOY, 3)).toBeNull();
    });

    it('con 0 días sólo avisa lo que se entrega hoy', () => {
        expect(clasificarVencimiento('2026-09-13', HOY, 0)).toBe(VENCIMIENTO.PROXIMA);
        expect(clasificarVencimiento('2026-09-14', HOY, 0)).toBeNull();
    });

    it('cruza el fin de mes', () => {
        expect(clasificarVencimiento('2026-10-02', new Date(2026, 8, 29, 23, 30), 3)).toBe(VENCIMIENTO.PROXIMA);
    });

    it('sin fecha -> nada', () => {
        expect(clasificarVencimiento(null, HOY, 3)).toBeNull();
    });
});

describe('interpretarDiasAnticipacion', () => {
    it('valor guardado válido', () => {
        expect(interpretarDiasAnticipacion('7')).toBe(7);
        expect(interpretarDiasAnticipacion('0')).toBe(0);
    });

    it('vacío, ausente o corrupto -> el valor por defecto', () => {
        for (const valor of [null, undefined, '', '  ', 'abc', '2.5', '-1', '31']) {
            expect(interpretarDiasAnticipacion(valor)).toBe(DIAS_ANTICIPACION_POR_DEFECTO);
        }
    });
});
