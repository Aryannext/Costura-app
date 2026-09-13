import { describe, it, expect } from 'vitest';
import { FORMATO_RESPALDO, construirPayload, leerPayload, enMegabytes } from '../backupPayload.js';

describe('backupPayload', () => {
    const baseDatos = { database: 'costura_db', tables: [{ name: 'cliente', values: [[1, 'Ana']] }] };
    const fotografias = { 'prenda_1_123.jpeg': 'QUJD' };

    it('Ida y vuelta del formato nuevo', () => {
        const leido = leerPayload(construirPayload(baseDatos, fotografias));

        expect(leido.formato).toBe(FORMATO_RESPALDO);
        expect(JSON.parse(leido.baseDatosJson)).toEqual(baseDatos);
        expect(leido.fotografias).toEqual(fotografias);
    });

    it('Respaldo sin fotografías -> mapa vacío, no undefined', () => {
        const leido = leerPayload(construirPayload(baseDatos));

        expect(leido.fotografias).toEqual({});
    });

    it('Respaldo antiguo (exportación de SQLite pelada) -> se sigue pudiendo restaurar', () => {
        const antiguo = JSON.stringify(baseDatos);
        const leido = leerPayload(antiguo);

        expect(leido.formato).toBe(1);
        expect(JSON.parse(leido.baseDatosJson)).toEqual(baseDatos);
        expect(leido.fotografias).toEqual({});
    });

    it('Texto que no es JSON -> error claro', () => {
        expect(() => leerPayload('no soy json')).toThrow('El respaldo no tiene un formato válido.');
    });

    it('enMegabytes redondea a un decimal', () => {
        expect(enMegabytes(20 * 1024 * 1024)).toBe('20.0');
    });
});
