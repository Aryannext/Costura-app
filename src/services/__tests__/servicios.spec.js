import { describe, it, expect, vi, afterEach } from 'vitest';
import { estadoOrdenSegunPrendas, validarCambioManual } from '../reglasOrden.js';
import { normalizarTelefono, enlaceWhatsApp, mensajes } from '../whatsapp.js';
import { hoyLocal, sumarDias, parseFechaLocal } from '../fechas.js';
import { construirRecibo } from '../recibo.js';

vi.mock('@capacitor/preferences', () => ({ Preferences: {} }));
vi.mock('../../router/index.js', () => ({ default: {} }));
vi.mock('../../database/queries/auth.js', () => ({}));
import { sesionVigente } from '../auth.js';

describe('reglasOrden', () => {
    it('calcula el estado de la orden a partir de sus prendas', () => {
        expect(estadoOrdenSegunPrendas(1, [1, 1])).toBe(1);
        expect(estadoOrdenSegunPrendas(1, [2, 1])).toBe(2);
        expect(estadoOrdenSegunPrendas(2, [3, 3])).toBe(3);
        expect(estadoOrdenSegunPrendas(3, [3, 4])).toBe(3);
        expect(estadoOrdenSegunPrendas(3, [4, 4])).toBe(4);
        expect(estadoOrdenSegunPrendas(3, [3, 1])).toBe(2);
        expect(estadoOrdenSegunPrendas(5, [3, 3])).toBe(5); // cancelada no se toca
    });

    it('valida los cambios manuales', () => {
        expect(() => validarCambioManual(2, 3, [3, 2])).toThrow('Faltan 1');
        expect(validarCambioManual(2, 3, [3, 3])).toBe(true);
        expect(() => validarCambioManual(4, 5, [4])).toThrow('no se puede cancelar');
        expect(validarCambioManual(4, 2, [4])).toBe(true); // reabrir
    });
});

describe('whatsapp', () => {
    it('agrega el indicativo 57 a celulares colombianos de 10 dígitos', () => {
        expect(normalizarTelefono('300 123 4567')).toBe('573001234567');
        expect(normalizarTelefono('+57 300-123-4567')).toBe('573001234567');
        expect(normalizarTelefono('')).toBe('');
    });

    it('arma el enlace wa.me con el texto codificado', () => {
        expect(enlaceWhatsApp('3001234567', 'Hola María')).toBe('https://wa.me/573001234567?text=Hola%20Mar%C3%ADa');
        expect(() => enlaceWhatsApp('', 'x')).toThrow('teléfono');
    });

    it('el mensaje de orden lista menciona el saldo solo si hay deuda', () => {
        const base = { id_orden: 7, cliente_nombre: 'María Pérez', saldo_pendiente: 0 };
        expect(mensajes.lista(base, 'Arreglos Rosa')).not.toContain('Saldo');
        expect(mensajes.lista({ ...base, saldo_pendiente: 5000 }, 'Arreglos Rosa')).toContain('$5.000');
        expect(mensajes.lista(base, 'Arreglos Rosa')).toContain('Hola María');
    });
});

describe('fechas locales', () => {
    afterEach(() => vi.useRealTimers());

    it('a las 9 p. m. de Bogotá sigue siendo el mismo día (A09)', () => {
        vi.useFakeTimers();
        // 6 oct 2026 21:00 en Bogotá = 7 oct 02:00 UTC. toISOString() diría 2026-10-07.
        vi.setSystemTime(new Date(2026, 9, 6, 21, 0, 0));
        expect(hoyLocal()).toBe('2026-10-06');
        expect(sumarDias(1)).toBe('2026-10-07');
    });

    it('interpreta YYYY-MM-DD como medianoche local', () => {
        const d = parseFechaLocal('2026-10-06');
        expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 6, 0]);
    });
});

describe('recibo', () => {
    it('incluye fecha de recepción, prendas y abonos (A11)', () => {
        const texto = construirRecibo(
            { id_orden: 3, cliente_nombre: 'Ana', fecha_creacion: '2026-10-01 10:00:00', fecha_entrega_estimada: '2026-10-08', estado_nombre: 'En Proceso', valor_total: 25000, saldo_pendiente: 15000 },
            [{ tipo_nombre: 'Pantalón', descripcion_arreglo: 'Dobladillo', valor: 10000 }, { tipo_nombre: 'Vestido', descripcion_arreglo: 'Cremallera', valor: 15000 }],
            [{ fecha_pago: '2026-10-01 10:05:00', metodo_nombre: 'Nequi', valor: 10000 }],
            'Arreglos Rosa'
        );
        expect(texto).toContain('Recibido: 01/10/2026');
        expect(texto).toContain('Pantalón – Dobladillo: $10.000');
        expect(texto).toContain('Nequi: $10.000');
        expect(texto).toContain('Saldo pendiente: $15.000');
    });
});

describe('sesión (A10)', () => {
    it('acepta una sesión con actividad reciente y rechaza una vieja o inválida', () => {
        const ahora = 1_000_000_000;
        expect(sesionVigente({ lastActivity: ahora - 60_000 }, ahora)).toBe(true);
        expect(sesionVigente({ lastActivity: ahora - 16 * 60_000 }, ahora)).toBe(false);
        expect(sesionVigente({ loginTime: 0 }, ahora)).toBe(false);
        expect(sesionVigente(null, ahora)).toBe(false);
    });
});
