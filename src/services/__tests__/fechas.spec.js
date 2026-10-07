import { describe, it, expect } from 'vitest';
import { fechaLocalISO, aFechaLocal, sumarDias, diasDeDiferencia, fechaCorta, fechaLarga, etiquetaDia } from '../fechas.js';

describe('fechas para mostrar', () => {
    const HOY = new Date(2026, 8, 13, 22, 30); // de noche: en UTC ya sería el 14

    it('fechaCorta con fecha sola o con hora, sin correrse de día', () => {
        expect(fechaCorta('2026-09-14')).toBe('14 sep');
        expect(fechaCorta('2026-09-10 09:12:00')).toBe('10 sep');
        expect(fechaCorta(null)).toBe('');
    });

    it('fechaLarga en español con mayúscula inicial', () => {
        expect(fechaLarga(HOY)).toBe('Domingo 13 de septiembre');
    });

    it('etiquetaDia usa Hoy, Mañana y Ayer, y si no la fecha corta', () => {
        expect(etiquetaDia('2026-09-13', HOY)).toBe('Hoy');
        expect(etiquetaDia('2026-09-14', HOY)).toBe('Mañana');
        expect(etiquetaDia('2026-09-12', HOY)).toBe('Ayer');
        expect(etiquetaDia('2026-09-20', HOY)).toBe('20 sep');
    });
});

describe('fechas', () => {
    describe('fechaLocalISO', () => {
        it('Usa la fecha local, no UTC', () => {
            // 1 de enero a las 22:30 hora local: en UTC-5, toISOString() ya diría día 2.
            expect(fechaLocalISO(new Date(2026, 0, 1, 22, 30))).toBe('2026-01-01');
        });

        it('Rellena mes y día a dos dígitos', () => {
            expect(fechaLocalISO(new Date(2026, 2, 5))).toBe('2026-03-05');
        });
    });

    describe('aFechaLocal', () => {
        it("'YYYY-MM-DD' se interpreta como medianoche local", () => {
            const fecha = aFechaLocal('2026-09-09');
            expect(fecha.getFullYear()).toBe(2026);
            expect(fecha.getMonth()).toBe(8);
            expect(fecha.getDate()).toBe(9);
            expect(fecha.getHours()).toBe(0);
        });

        // El fallo original: new Date('2026-09-09') es medianoche UTC, que al
        // oeste de Greenwich cae el día anterior.
        it('No se desplaza un día respecto a la cadena recibida', () => {
            expect(fechaLocalISO(aFechaLocal('2026-09-09'))).toBe('2026-09-09');
            expect(fechaLocalISO(aFechaLocal('2026-01-01'))).toBe('2026-01-01');
            expect(fechaLocalISO(aFechaLocal('2026-12-31'))).toBe('2026-12-31');
        });

        it('Una fecha con hora se normaliza a medianoche', () => {
            const fecha = aFechaLocal(new Date(2026, 5, 15, 23, 59));
            expect(fecha.getHours()).toBe(0);
            expect(fecha.getDate()).toBe(15);
        });
    });

    describe('sumarDias', () => {
        it('Desplaza sin modificar la fecha original', () => {
            const original = new Date(2026, 0, 30);
            const despues = sumarDias(original, 3);

            expect(fechaLocalISO(despues)).toBe('2026-02-02');
            expect(fechaLocalISO(original)).toBe('2026-01-30');
        });

        it('Acepta desplazamientos negativos', () => {
            expect(fechaLocalISO(sumarDias(new Date(2026, 0, 1), -1))).toBe('2025-12-31');
        });
    });

    describe('diasDeDiferencia', () => {
        it('Cuenta días entre medianoches locales', () => {
            expect(diasDeDiferencia('2026-09-09', '2026-09-12')).toBe(3);
            expect(diasDeDiferencia('2026-09-09', '2026-09-09')).toBe(0);
            expect(diasDeDiferencia('2026-09-12', '2026-09-09')).toBe(-3);
        });

        it('Ignora la hora del extremo inicial', () => {
            expect(diasDeDiferencia(new Date(2026, 8, 9, 23, 45), '2026-09-10')).toBe(1);
        });
    });
});
