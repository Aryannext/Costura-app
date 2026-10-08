import { describe, it, expect, vi } from 'vitest';
import { normalizarTelefono, enlaceWhatsApp, mensajes } from '../whatsapp.js';

vi.mock('@capacitor/share', () => ({ Share: {} }));
vi.mock('vue', async (original) => ({ ...(await original()), inject: () => () => {} }));
vi.mock('../../composables/useTelegramBot.js', () => ({ useTelegramBot: () => ({}) }));
vi.mock('../../database/connection.js', () => ({ db: null, saveDb: vi.fn() }));
import { construirRecibo } from '../../composables/useOrdenTelegram.js';

describe('whatsapp (D-03)', () => {
    it('agrega el indicativo 57 a celulares colombianos de 10 dígitos', () => {
        expect(normalizarTelefono('300 123 4567')).toBe('573001234567');
        expect(normalizarTelefono('+57 300-123-4567')).toBe('573001234567');
        expect(normalizarTelefono('')).toBe('');
    });

    it('arma el enlace wa.me con el texto codificado y rechaza clientes sin teléfono', () => {
        expect(enlaceWhatsApp('3001234567', 'Hola María')).toBe('https://wa.me/573001234567?text=Hola%20Mar%C3%ADa');
        expect(() => enlaceWhatsApp('', 'x')).toThrow('teléfono');
    });

    it('el aviso de orden lista menciona el saldo solo si hay deuda', () => {
        const base = { id_orden: 7, cliente_nombre: 'María Pérez', saldo_pendiente: 0 };
        expect(mensajes.lista(base, 'Arreglos Rosa')).not.toContain('Saldo');
        expect(mensajes.lista(base, 'Arreglos Rosa')).toContain('Hola María');
        expect(mensajes.lista({ ...base, saldo_pendiente: 5000 }, 'Arreglos Rosa')).toMatch(/\$\s?5\.000/);
    });

    it('el aviso de recibido lista las prendas y la fecha prometida', () => {
        const texto = mensajes.recibida(
            { id_orden: 3, cliente_nombre: 'Ana', fecha_entrega_estimada: '2026-10-20' },
            [{ tipo_nombre: 'Pantalón', descripcion_arreglo: 'Dobladillo' }],
            'Arreglos Rosa'
        );
        expect(texto).toContain('• Pantalón: Dobladillo');
        expect(texto).toContain('20/10/2026');
    });
});

describe('recibo (RF-42, Ley 1480 art. 18)', () => {
    const orden = {
        id_orden: 3, cliente_nombre: 'Ana', fecha_creacion: '2026-10-01 10:00:00', fecha_entrega_estimada: '2026-10-08',
        estado_nombre: 'En Proceso', valor_total: 25000, saldo_pendiente: 15000
    };

    it('incluye cada prenda y los abonos vigentes, no los anulados', () => {
        const texto = construirRecibo(orden, {
            markdown: false,
            taller: 'Arreglos Rosa',
            prendas: [{ tipo_nombre: 'Pantalón', descripcion_arreglo: 'Dobladillo', valor: 10000 }],
            pagos: [
                { fecha_pago: '2026-10-01 10:05:00', metodo_nombre: 'Bre-B', valor: 10000, anulado_en: null },
                { fecha_pago: '2026-10-02 09:00:00', metodo_nombre: 'Efectivo', valor: 5000, anulado_en: '2026-10-02 09:10:00' }
            ]
        });
        expect(texto).toContain('RECIBO DIGITAL - ARREGLOS ROSA');
        expect(texto).toMatch(/1\. Pantalón – Dobladillo: \$\s?10\.000/);
        expect(texto).toContain('01/10/2026 Bre-B');
        expect(texto).not.toContain('Efectivo');
    });

    it('lleva celular, dirección, garantía y condiciones del taller (ANA-H02)', () => {
        const texto = construirRecibo(
            { ...orden, cliente_telefono: '3001234567', cliente_direccion: 'Calle 5 # 3-20' },
            { markdown: false, garantia: 'Seis meses. Si quedó grande o pequeña, te la ajustamos gratis.', condiciones: 'Tienes 30 días hábiles para recoger.' }
        );
        expect(texto).toContain('Celular: 3001234567');
        expect(texto).toContain('Dirección: Calle 5 # 3-20');
        expect(texto).toContain('Garantía: Seis meses. Si quedó grande o pequeña, te la ajustamos gratis.');
        expect(texto).toContain('Condiciones: Tienes 30 días hábiles para recoger.');
    });

    it('sin garantía configurada no inventa una', () => {
        const texto = construirRecibo(orden, { markdown: false, garantia: '  ', condiciones: '' });
        expect(texto).not.toContain('Garantía');
        expect(texto).not.toContain('Condiciones');
        expect(texto).not.toContain('Dirección');
    });

    it('sin detalle conserva el formato anterior', () => {
        expect(construirRecibo(orden)).toContain('*Fecha de Recepción:* 01/10/2026');
        expect(construirRecibo(orden)).not.toContain('PRENDAS');
    });
});
