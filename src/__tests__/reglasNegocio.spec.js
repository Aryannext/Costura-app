// @vitest-environment node
/**
 * Catálogo de reglas de negocio (docs/01-analisis/Costura.md, RN-01 a RN-40) como pruebas.
 *
 * Cada regla tiene su propio `describe` con el identificador del documento, y la
 * última prueba del archivo comprueba que no falte ninguna: si alguien añade una
 * RN al catálogo sin probarla, la CI falla.
 *
 * Las pruebas atraviesan la capa donde la regla tiene que cumplirse de verdad
 * (composables y consultas) contra un SQLite real, no los validadores sueltos:
 * una regla que sólo respeta la pantalla ocultando un botón no está cumplida.
 *
 * `it.fails` marca un incumplimiento conocido, con su defecto en
 * docs/04-calidad/TRAZABILIDAD.md. Esa prueba pasa mientras la regla siga rota; el día que
 * se corrija empezará a fallar y habrá que cambiarla a `it`. Así ningún
 * incumplimiento queda escondido y ninguna corrección pasa sin prueba.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { ref } from 'vue';

vi.mock('../database/connection.js', async () =>
    (await import('./helpers/sqliteReal.js')).crearConexionFalsa());
// Fuera de un componente no hay provide/inject: el toast es un no-op.
vi.mock('vue', async (importOriginal) => ({ ...(await importOriginal()), inject: () => () => {} }));
vi.mock('@capacitor/camera', () => ({ Camera: {}, CameraResultType: {}, CameraSource: {} }));
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }));
vi.mock('../services/photoStorage.js', () => ({ savePhotoFromBase64: vi.fn(), deletePhotoFile: vi.fn() }));

const telegram = vi.hoisted(() => ({ enviar: vi.fn() }));
vi.mock('../composables/useTelegramBot.js', () => ({
    useTelegramBot: () => ({ sendTelegramMessage: (...args) => telegram.enviar(...args) })
}));

import { prepararMotor, nuevaBase } from './helpers/sqliteReal.js';
import { db } from '../database/connection.js';
import { migrations } from '../database/migrations.js';
import { runMigrations } from '../database/migrationRunner.js';
import { createOrden, getOrdenById } from '../database/queries/ordenes.js';
import {
    createPrenda, saveFotografia, getObservacionesByPrenda, getFotografiasByPrenda
} from '../database/queries/prendas.js';
import { registrarPago, getPagosByOrden } from '../database/queries/pagos.js';
import { getNotificacionesByOrden, getOrdenesParaRecordar } from '../database/queries/notificaciones.js';
import { getDashboardData } from '../database/queries/reportes.js';
import * as consultasAuth from '../database/queries/auth.js';
import { useClientes } from '../composables/useClientes.js';
import { useOrdenes } from '../composables/useOrdenes.js';
import { usePrendas } from '../composables/usePrendas.js';
import { usePagos } from '../composables/usePagos.js';
import { useOrdenTelegram } from '../composables/useOrdenTelegram.js';
import { useNotificaciones } from '../composables/useNotificaciones.js';
import { cargarDiasAnticipacion, guardarDiasAnticipacion } from '../composables/useConfiguracionNegocio.js';
import { esOrdenActiva, estadoDePago } from '../services/estadoOrden.js';
import { clasificarVencimiento, VENCIMIENTO } from '../services/vencimientos.js';
import { fechaLocalISO, sumarDias } from '../services/fechas.js';

const O = { PENDIENTE: 1, EN_PROCESO: 2, LISTA: 3, ENTREGADA: 4, CANCELADA: 5 };
const P = { PENDIENTE: 1, EN_PROCESO: 2, TERMINADA: 3, ENTREGADA: 4 };
const FECHA_HORA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

// ── Ayudantes: pasan por los mismos composables que usa la pantalla ────────

const enDias = (dias) => fechaLocalISO(sumarDias(new Date(), dias));

async function filas(sql, params = []) {
    return (await db.query(sql, params)).values;
}

async function uno(sql, params = []) {
    return (await filas(sql, params))[0];
}

function cliente(telefono = '3001234567', nombre = 'Ana') {
    return useClientes().saveCliente({ nombre, telefono });
}

async function orden(fecha = enDias(5)) {
    return useOrdenes().saveOrden({ id_cliente: await cliente(), fecha_entrega_estimada: fecha });
}

function prenda(id_orden, valor = 20000, descripcion_arreglo = 'Basta') {
    return usePrendas().savePrenda({ id_orden, valor, descripcion_arreglo, id_tipo_prenda: 1 });
}

function estadoPrenda(id_prenda, id_orden, estado) {
    return usePrendas().changeEstado(id_prenda, estado, id_orden);
}

async function cambiarOrden(id_orden, destino) {
    return useOrdenes().changeEstado(id_orden, destino, 'estado', await getOrdenById(id_orden));
}

/** `saldoEnPantalla` imita el valor que la vista le pasa a savePago. */
async function abonar(id_orden, valor, saldoEnPantalla) {
    const saldo = saldoEnPantalla ?? (await getOrdenById(id_orden)).saldo_pendiente;
    return usePagos().savePago({ id_orden, valor, id_metodo_pago: 1 }, saldo);
}

async function ordenLista(valor = 20000) {
    const id = await orden();
    const a = await prenda(id, valor);
    await estadoPrenda(a, id, P.TERMINADA);
    return { id, a };
}

async function ultimaActividad(id_orden) {
    return uno(
        'SELECT descripcion, id_tipo_actividad FROM historial_actividad WHERE id_orden = ? ORDER BY id_actividad DESC LIMIT 1',
        [id_orden]
    );
}

async function contarHistorial(id_orden) {
    return (await uno('SELECT COUNT(*) AS n FROM historial_actividad WHERE id_orden = ?', [id_orden])).n;
}

beforeAll(async () => {
    await prepararMotor();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

beforeEach(async () => {
    nuevaBase();
    await runMigrations(db, migrations);
    telegram.enviar.mockReset().mockResolvedValue(true);
});

// ── Gestión de clientes ───────────────────────────────────────────────────

describe('RN-01 · un cliente necesita nombre y teléfono', () => {
    it('sin teléfono no se registra', async () => {
        await expect(useClientes().saveCliente({ nombre: 'Ana', telefono: '' }))
            .rejects.toThrow('El número de teléfono es obligatorio.');
        expect((await uno('SELECT COUNT(*) AS n FROM cliente')).n).toBe(0);
    });

    it('sin nombre no se registra', async () => {
        await expect(useClientes().saveCliente({ nombre: '  ', telefono: '3001234567' }))
            .rejects.toThrow('El nombre del cliente es obligatorio.');
    });

    it('con nombre y teléfono sí', async () => {
        expect(await cliente()).toBeGreaterThan(0);
    });
});

describe('RN-02 · el teléfono no es único', () => {
    it('dos clientes pueden compartir el mismo número', async () => {
        await cliente('3001234567', 'Ana');
        await cliente('3001234567', 'Luis');
        expect((await uno('SELECT COUNT(*) AS n FROM cliente WHERE telefono = ?', ['3001234567'])).n).toBe(2);
    });
});

// ── Gestión de órdenes de trabajo ─────────────────────────────────────────

describe('RN-03 · una orden pertenece a un único cliente', () => {
    it('no existe una orden sin cliente', async () => {
        await expect(createOrden({ id_cliente: 999, fecha_entrega_estimada: enDias(1) }))
            .rejects.toThrow(/FOREIGN KEY constraint failed/);
        await expect(createOrden({ id_cliente: null, fecha_entrega_estimada: enDias(1) }))
            .rejects.toThrow(/NOT NULL constraint failed/);
    });

    it('la orden guarda exactamente un cliente', async () => {
        const columnas = (await filas('PRAGMA table_info(orden_trabajo)')).map(c => c.name);
        expect(columnas.filter(c => c.includes('cliente'))).toEqual(['id_cliente']);
    });
});

describe('RN-04 · una orden sin prendas no está activa', () => {
    it('se crea sin prendas, pero no cuenta como activa', async () => {
        const id = await orden();
        expect(esOrdenActiva(await getOrdenById(id))).toBe(false);
        expect((await getDashboardData()).kpis.ordenesActivas).toBe(0);
    });

    it('con su primera prenda pasa a estar activa', async () => {
        const id = await orden();
        await prenda(id);
        expect(esOrdenActiva(await getOrdenById(id))).toBe(true);
        expect((await getDashboardData()).kpis.ordenesActivas).toBe(1);
    });
});

describe('RN-05 · la entrega no puede ser anterior a la creación', () => {
    it('ayer se rechaza', async () => {
        const id_cliente = await cliente();
        await expect(useOrdenes().saveOrden({ id_cliente, fecha_entrega_estimada: enDias(-1) }))
            .rejects.toThrow('La fecha estimada de entrega no puede ser anterior a la fecha de creación.');
    });

    it('hoy mismo se acepta', async () => {
        expect(await orden(enDias(0))).toBeGreaterThan(0);
    });
});

describe('RN-06 · Lista para Entregar sólo la asigna el sistema, con todo terminado', () => {
    it('pasa sola a Lista cuando se termina la última prenda', async () => {
        const id = await orden();
        const a = await prenda(id);
        const b = await prenda(id, 10000, 'Ruedo');

        await estadoPrenda(a, id, P.TERMINADA);
        expect((await getOrdenById(id)).id_estado_orden).toBe(O.EN_PROCESO);

        await estadoPrenda(b, id, P.TERMINADA);
        expect((await getOrdenById(id)).id_estado_orden).toBe(O.LISTA);
    });

    it('no se puede poner a mano', async () => {
        const id = await orden();
        await prenda(id);
        await expect(cambiarOrden(id, O.LISTA)).rejects.toThrow('no se puede fijar a mano');
    });
});

describe('RN-07 · entrega parcial de las prendas terminadas', () => {
    it('se entrega sólo lo que el cliente reclama, y el resto sigue en la orden', async () => {
        const id = await orden();
        const a = await prenda(id);
        const b = await prenda(id, 10000, 'Ruedo');
        await estadoPrenda(a, id, P.TERMINADA);
        await estadoPrenda(b, id, P.TERMINADA);

        await estadoPrenda(a, id, P.ENTREGADA);

        const estados = await filas('SELECT id_prenda, id_estado_prenda FROM prenda WHERE id_orden = ? ORDER BY id_prenda', [id]);
        expect(estados).toEqual([{ id_prenda: a, id_estado_prenda: P.ENTREGADA }, { id_prenda: b, id_estado_prenda: P.TERMINADA }]);
    });

    it('una prenda sin terminar no se entrega', async () => {
        const id = await orden();
        const a = await prenda(id);
        await expect(estadoPrenda(a, id, P.ENTREGADA)).rejects.toThrow('Sólo se puede entregar una prenda terminada.');
    });
});

describe('RN-08 · la entrega de cada prenda se registra individualmente', () => {
    it('cambia el estado de esa prenda y deja constancia en el historial', async () => {
        const { id, a } = await ordenLista();

        await estadoPrenda(a, id, P.ENTREGADA);

        expect((await uno('SELECT id_estado_prenda FROM prenda WHERE id_prenda = ?', [a])).id_estado_prenda).toBe(P.ENTREGADA);
        const historial = (await filas('SELECT descripcion FROM historial_actividad WHERE id_orden = ?', [id])).map(h => h.descripcion);
        expect(historial).toContain(`Estado de prenda #${a} actualizado`);
    });
});

describe('RN-09 · la orden sólo queda Entregada con todas sus prendas entregadas', () => {
    it('no se entrega a mano mientras falten prendas por terminar', async () => {
        const id = await orden();
        await prenda(id);
        await expect(cambiarOrden(id, O.ENTREGADA))
            .rejects.toThrow('Sólo se puede entregar una orden Lista para Entregar');
    });

    it('al entregar la última prenda, la orden queda Entregada', async () => {
        const { id, a } = await ordenLista();
        await estadoPrenda(a, id, P.ENTREGADA);
        expect((await getOrdenById(id)).id_estado_orden).toBe(O.ENTREGADA);
    });

    it('el botón Entregar entrega también cada una de las prendas', async () => {
        const { id } = await ordenLista();
        const b = await prenda(id, 5000, 'Botón');
        await estadoPrenda(b, id, P.TERMINADA);

        await cambiarOrden(id, O.ENTREGADA);

        const estados = (await filas('SELECT id_estado_prenda FROM prenda WHERE id_orden = ?', [id])).map(p => p.id_estado_prenda);
        expect(estados).toEqual([P.ENTREGADA, P.ENTREGADA]);
    });
});

describe('RN-10 · con entregas parciales la orden conserva su estado', () => {
    it('una orden Lista con una prenda entregada y otra terminada sigue Lista', async () => {
        const id = await orden();
        const a = await prenda(id);
        const b = await prenda(id, 10000, 'Ruedo');
        await estadoPrenda(a, id, P.TERMINADA);
        await estadoPrenda(b, id, P.TERMINADA);

        await estadoPrenda(a, id, P.ENTREGADA);

        expect((await getOrdenById(id)).id_estado_orden).toBe(O.LISTA);
    });
});

describe('RN-11 · una orden entregada no se cancela', () => {
    it('se rechaza', async () => {
        const { id } = await ordenLista();
        await cambiarOrden(id, O.ENTREGADA);
        await expect(cambiarOrden(id, O.CANCELADA)).rejects.toThrow('Una orden entregada no se puede cancelar.');
        expect((await getOrdenById(id)).id_estado_orden).toBe(O.ENTREGADA);
    });
});

describe('RN-12 · una orden cancelada no recibe prendas', () => {
    it('P1-15: añadir una prenda a una orden cancelada se rechaza', async () => {
        const id = await orden();
        await prenda(id);
        await cambiarOrden(id, O.CANCELADA);

        await expect(prenda(id, 5000, 'Botón')).rejects.toThrow('No se pueden agregar prendas a una orden cancelada.');
        expect((await uno('SELECT COUNT(*) AS n FROM prenda WHERE id_orden = ?', [id])).n).toBe(1);
    });

    it('tampoco a una orden entregada: primero hay que reabrirla', async () => {
        const { id } = await ordenLista();
        await cambiarOrden(id, O.ENTREGADA);

        await expect(prenda(id, 5000, 'Botón')).rejects.toThrow('No se pueden agregar prendas a una orden entregada. Reábrela primero.');
    });
});

describe('RN-13 · una orden cancelada no recibe pagos', () => {
    it('P1-15: registrar un pago en una orden cancelada se rechaza', async () => {
        const id = await orden();
        await prenda(id);
        await cambiarOrden(id, O.CANCELADA);

        await expect(abonar(id, 5000)).rejects.toThrow('No se pueden registrar pagos a una orden cancelada.');
    });
});

describe('RN-14 · cancelar no elimina los pagos', () => {
    it('los pagos siguen registrados y vigentes', async () => {
        const id = await orden();
        await prenda(id);
        await abonar(id, 5000);

        await cambiarOrden(id, O.CANCELADA);

        const pagos = await getPagosByOrden(id);
        expect(pagos).toHaveLength(1);
        expect(pagos[0].anulado_en).toBeNull();
    });
});

describe('RN-15 · sólo la dueña reabre órdenes', () => {
    it('la aplicación tiene una única cuenta y no ofrece forma de crear otras', async () => {
        await consultasAuth.setupDefaultUser();
        await consultasAuth.setupDefaultUser();

        expect((await uno('SELECT COUNT(*) AS n FROM usuario')).n).toBe(1);
        expect(Object.keys(consultasAuth).filter(n => /crear|create|insert|registrar|nuevo/i.test(n))).toEqual([]);
    });

    it('sólo se reabre lo que está entregado', async () => {
        const id = await orden();
        await prenda(id);
        await expect(cambiarOrden(id, O.EN_PROCESO)).rejects.toThrow();
    });
});

describe('RN-16 · reabrir deja la orden En Proceso', () => {
    it('vuelve a En Proceso y registra la reapertura', async () => {
        const { id } = await ordenLista();
        await cambiarOrden(id, O.ENTREGADA);

        await cambiarOrden(id, O.EN_PROCESO);

        expect((await getOrdenById(id)).id_estado_orden).toBe(O.EN_PROCESO);
        expect((await ultimaActividad(id)).id_tipo_actividad).toBe(7);
    });
});

describe('RN-17 · con prendas pendientes o en proceso, la orden está En Proceso', () => {
    it('entra en En Proceso con la primera prenda y vuelve si una prenda regresa', async () => {
        const id = await orden();
        const a = await prenda(id);
        expect((await getOrdenById(id)).id_estado_orden).toBe(O.EN_PROCESO);

        await estadoPrenda(a, id, P.TERMINADA);
        expect((await getOrdenById(id)).id_estado_orden).toBe(O.LISTA);

        await estadoPrenda(a, id, P.EN_PROCESO);
        expect((await getOrdenById(id)).id_estado_orden).toBe(O.EN_PROCESO);
    });
});

// ── Gestión de prendas ────────────────────────────────────────────────────

describe('RN-18 · toda prenda pertenece a una orden', () => {
    it('no se registra una prenda para una orden inexistente', async () => {
        await expect(prenda(999)).rejects.toThrow('La orden no existe.');
        // Y aunque se salte el composable, la base tampoco la acepta.
        await expect(createPrenda({ id_orden: 999, valor: 1000, descripcion_arreglo: 'Basta', id_tipo_prenda: 1 }))
            .rejects.toThrow(/FOREIGN KEY constraint failed/);
        expect((await uno('SELECT COUNT(*) AS n FROM prenda')).n).toBe(0);
    });
});

describe('RN-19 · una prenda necesita la descripción del arreglo', () => {
    it('al registrarla', async () => {
        const id = await orden();
        await expect(prenda(id, 20000, '  ')).rejects.toThrow('La descripción del arreglo es obligatoria.');
    });

    it('al editarla', async () => {
        const id = await orden();
        const a = await prenda(id);
        await expect(usePrendas().editPrenda(a, '', 20000, id)).rejects.toThrow('La descripción es obligatoria');
    });
});

describe('RN-20 · el valor de una prenda es mayor que cero', () => {
    it('al registrarla', async () => {
        const id = await orden();
        await expect(prenda(id, 0)).rejects.toThrow('El valor de la prenda debe ser mayor a cero.');
    });

    it('al editarla', async () => {
        const id = await orden();
        const a = await prenda(id);
        await expect(usePrendas().editPrenda(a, 'Basta', -1, id)).rejects.toThrow('El valor de la prenda debe ser mayor a cero.');
    });
});

describe('RN-21 · una prenda tiene un solo estado a la vez', () => {
    it('el estado es una única columna de la prenda', async () => {
        const columnas = (await filas('PRAGMA table_info(prenda)')).map(c => c.name);
        expect(columnas.filter(c => c.includes('estado'))).toEqual(['id_estado_prenda']);
    });
});

describe('RN-22 · una fotografía pertenece a una única prenda', () => {
    it('no se guarda una foto sin prenda, y cada foto apunta a una sola', async () => {
        await expect(saveFotografia(999, 'huerfana.jpeg')).rejects.toThrow(/FOREIGN KEY constraint failed/);
        const columnas = (await filas('PRAGMA table_info(fotografia)')).map(c => c.name);
        expect(columnas.filter(c => c.includes('prenda'))).toEqual(['id_prenda']);
    });
});

describe('RN-23 · una prenda puede tener varias fotografías', () => {
    it('admite más de una', async () => {
        const id = await orden();
        const a = await prenda(id);
        const frente = await saveFotografia(a, 'frente.jpeg');
        const espalda = await saveFotografia(a, 'espalda.jpeg');

        // El id devuelto es el de cada foto, aunque antes se escriba su línea de historial.
        const ids = (await getFotografiasByPrenda(a)).map(f => f.id_fotografia).sort();
        expect(ids).toEqual([frente, espalda].sort());
    });
});

describe('RN-24 · toda prenda tiene un tipo', () => {
    it('sin tipo no se registra', async () => {
        const id = await orden();
        await expect(usePrendas().savePrenda({ id_orden: id, valor: 20000, descripcion_arreglo: 'Basta', id_tipo_prenda: null }))
            .rejects.toThrow('El tipo de prenda es obligatorio.');
    });
});

// ── Gestión de pagos ──────────────────────────────────────────────────────

describe('RN-25 · todo pago pertenece a una orden', () => {
    it('no se registra un pago para una orden inexistente', async () => {
        await expect(registrarPago({ id_orden: 999, valor: 1000, id_metodo_pago: 1 }))
            .rejects.toThrow(/FOREIGN KEY constraint failed/);
    });
});

describe('RN-26 · un abono es mayor que cero', () => {
    it('cero se rechaza', async () => {
        const id = await orden();
        await prenda(id);
        await expect(abonar(id, 0)).rejects.toThrow('El valor del abono debe ser mayor a cero.');
    });
});

describe('RN-27 · los abonos no superan el total de la orden', () => {
    it('un abono mayor que el saldo se rechaza', async () => {
        const id = await orden();
        await prenda(id, 20000);
        await expect(abonar(id, 25000)).rejects.toThrow('no puede superar el saldo pendiente');
    });

    // El saldo que mostraba la pantalla ya no cuenta: savePago lo relee.
    it('P1-16: dos envíos con el mismo saldo en pantalla no superan el total', async () => {
        const id = await orden();
        await prenda(id, 20000);

        await abonar(id, 20000, 20000);
        await expect(abonar(id, 20000, 20000)).rejects.toThrow('no puede superar el saldo pendiente');
    });

    it('P1-16: dos abonos simultáneos, como un doble toque, no pasan los dos', async () => {
        const id = await orden();
        await prenda(id, 20000);

        const resultados = await Promise.allSettled([abonar(id, 20000), abonar(id, 20000)]);

        expect(resultados.map(r => r.status).sort()).toEqual(['fulfilled', 'rejected']);
        expect(await getPagosByOrden(id)).toHaveLength(1);
        expect((await getOrdenById(id)).saldo_pendiente).toBe(0);
    });
});

describe('RN-28 · una orden está pagada con saldo cero', () => {
    it('queda Pagada al saldar la deuda', async () => {
        const id = await orden();
        await prenda(id, 20000);
        await abonar(id, 5000);
        expect(estadoDePago(await getOrdenById(id))).toBe('Pendiente');

        await abonar(id, 15000);
        expect(estadoDePago(await getOrdenById(id))).toBe('Pagada');
    });
});

describe('RN-29 · el saldo nunca es negativo', () => {
    it('bajar el precio por debajo de lo pagado se rechaza', async () => {
        const id = await orden();
        const a = await prenda(id, 20000);
        await abonar(id, 20000);

        await expect(usePrendas().editPrenda(a, 'Basta', 10000, id)).rejects.toThrow('El saldo no puede quedar negativo.');
        expect((await getOrdenById(id)).saldo_pendiente).toBe(0);
    });

    it('P1-16: un doble envío del mismo abono tampoco lo deja negativo', async () => {
        const id = await orden();
        await prenda(id, 20000);

        await abonar(id, 20000, 20000).catch(() => {});
        await abonar(id, 20000, 20000).catch(() => {});

        expect((await getOrdenById(id)).saldo_pendiente).toBeGreaterThanOrEqual(0);
    });
});

describe('RN-30 · una orden entregada sigue recibiendo pagos', () => {
    it('se abona después de entregar', async () => {
        const { id } = await ordenLista(20000);
        await cambiarOrden(id, O.ENTREGADA);

        await abonar(id, 5000);

        expect((await getOrdenById(id)).saldo_pendiente).toBe(15000);
    });
});

// ── Notificaciones ────────────────────────────────────────────────────────

describe('RN-31 · el aviso de orden lista sólo al entrar en Lista para Entregar', () => {
    it('la notificación se registra al entrar en Lista, y no antes', async () => {
        const id = await orden();
        const a = await prenda(id);
        const b = await prenda(id, 10000, 'Ruedo');

        await estadoPrenda(a, id, P.TERMINADA);
        expect(await getNotificacionesByOrden(id)).toHaveLength(0);

        await estadoPrenda(b, id, P.TERMINADA);
        expect(await getNotificacionesByOrden(id)).toHaveLength(1);
    });

    it('P1-17: no se envía el aviso de orden lista si la orden no está Lista', async () => {
        const id = await orden();
        await prenda(id);
        const ordenEnPantalla = ref(await getOrdenById(id));
        const avisos = useOrdenTelegram(ordenEnPantalla);

        await avisos.notificarTelegram('LISTA_ENTREGA');
        await avisos.enviarAlertaOrdenListaBot();

        expect(telegram.enviar).not.toHaveBeenCalled();
    });

    it('con la orden Lista sí se envía', async () => {
        const { id } = await ordenLista();
        const ordenEnPantalla = ref(await getOrdenById(id));

        await useOrdenTelegram(ordenEnPantalla).notificarTelegram('LISTA_ENTREGA');

        expect(telegram.enviar).toHaveBeenCalledTimes(1);
    });

    it('decide el estado de la base, no el que tenía la pantalla', async () => {
        const { id, a } = await ordenLista();
        const ordenEnPantalla = ref(await getOrdenById(id));
        // La prenda vuelve a proceso después de que la pantalla cargó la orden.
        await estadoPrenda(a, id, P.EN_PROCESO);

        await useOrdenTelegram(ordenEnPantalla).notificarTelegram('LISTA_ENTREGA');

        expect(telegram.enviar).not.toHaveBeenCalled();
    });
});

describe('RN-32 · el historial de notificaciones guarda fecha y hora', () => {
    it('cada notificación tiene su fecha y hora', async () => {
        const { id } = await ordenLista();
        const [notificacion] = await getNotificacionesByOrden(id);
        expect(notificacion.fecha_envio).toMatch(FECHA_HORA);
    });
});

describe('RN-33 · un recordatorio automático por orden al día', () => {
    it('el segundo envío del día no repite la orden', async () => {
        const { id } = await ordenLista();
        const { triggerRecordatorios } = useNotificaciones();

        expect(await triggerRecordatorios()).toBe(1);
        expect(await triggerRecordatorios()).toBe(0);

        const recordatorios = (await getNotificacionesByOrden(id)).filter(n => n.id_tipo_notificacion === 3);
        expect(recordatorios).toHaveLength(1);
        // El mensaje a Telegram lleva el enlace de WhatsApp con indicativo +57
        expect(telegram.enviar.mock.calls[0][0]).toContain('https://wa.me/573001234567?text=');
    });

    it('A02: si Telegram no confirma, no se registra ningún recordatorio', async () => {
        const { id } = await ordenLista();
        telegram.enviar.mockResolvedValue(false);

        await expect(useNotificaciones().triggerRecordatorios()).rejects.toThrow('No se registró');

        const recordatorios = (await getNotificacionesByOrden(id)).filter(n => n.id_tipo_notificacion === 3);
        expect(recordatorios).toHaveLength(0);
        expect(await getOrdenesParaRecordar()).toHaveLength(1);
    });
});

describe('RN-34 · el resumen de Telegram usa la información actual de la orden', () => {
    it('P1-18: el recibo muestra el saldo que hay en la base al enviarlo', async () => {
        const id = await orden();
        await prenda(id, 20000);
        const ordenEnPantalla = ref(await getOrdenById(id));
        await registrarPago({ id_orden: id, valor: 5000, id_metodo_pago: 1 });

        await useOrdenTelegram(ordenEnPantalla).generarReciboTelegram();

        expect(telegram.enviar.mock.calls[0][0]).toContain('*Saldo:* $15.000');
    });

    it('P1-18: el recibo muestra la fecha de recepción de la orden', async () => {
        const id = await orden();
        await prenda(id);
        const ordenEnPantalla = ref(await getOrdenById(id));
        const [anio, mes, dia] = ordenEnPantalla.value.fecha_creacion.slice(0, 10).split('-');

        await useOrdenTelegram(ordenEnPantalla).generarReciboTelegram();

        expect(telegram.enviar.mock.calls[0][0]).toContain(`*Fecha de Recepción:* ${dia}/${mes}/${anio}`);
    });
});

// ── Control y seguimiento ─────────────────────────────────────────────────

describe('RN-35 · toda modificación de una orden queda en el historial', () => {
    it('crear, añadir prendas, cambiar estados, pagar y anular quedan registrados', async () => {
        const id = await orden();
        const a = await prenda(id);
        await estadoPrenda(a, id, P.TERMINADA);
        const idPago = await abonar(id, 5000);
        await usePagos().anularPago(idPago, 'Error');

        const historial = (await filas('SELECT descripcion FROM historial_actividad WHERE id_orden = ?', [id])).map(h => h.descripcion);
        expect(historial).toEqual(expect.arrayContaining([
            'Orden creada en estado Pendiente',
            'Prenda añadida a la orden',
            `Estado de prenda #${a} actualizado`,
            'Abono de $5.000 registrado',
            'Pago de $5.000 anulado: Error'
        ]));
    });

    it('P1-19: añadir una observación a una prenda queda en el historial', async () => {
        const id = await orden();
        const a = await prenda(id);
        const antes = await contarHistorial(id);

        await usePrendas().addNewObservacion(a, 'Color azul');

        expect(await contarHistorial(id)).toBe(antes + 1);
    });

    it('P1-19: añadir y borrar una fotografía queda en el historial', async () => {
        const id = await orden();
        const a = await prenda(id);
        const antes = await contarHistorial(id);

        const foto = await saveFotografia(a, 'frente.jpeg');
        await usePrendas().removeFoto(foto);

        expect(await contarHistorial(id)).toBe(antes + 2);
        const [eliminada, anadida] = (await filas(
            'SELECT descripcion FROM historial_actividad WHERE id_orden = ? ORDER BY id_actividad DESC LIMIT 2', [id]
        )).map(h => h.descripcion);
        expect(anadida).toBe(`Fotografía añadida a la prenda #${a}`);
        expect(eliminada).toBe(`Fotografía eliminada de la prenda #${a}`);
    });

    it('P1-19: si la foto no llega a guardarse, tampoco queda su rastro', async () => {
        const id = await orden();
        const antes = await contarHistorial(id);

        await expect(saveFotografia(999, 'huerfana.jpeg')).rejects.toThrow(/FOREIGN KEY constraint failed/);

        expect(await contarHistorial(id)).toBe(antes);
    });
});

describe('RN-36 · la fecha y hora de entrega se registran solas', () => {
    it('se sellan al entregar', async () => {
        const { id } = await ordenLista();
        expect((await getOrdenById(id)).fecha_entrega_real).toBeNull();

        await cambiarOrden(id, O.ENTREGADA);

        expect((await getOrdenById(id)).fecha_entrega_real).toMatch(FECHA_HORA);
    });
});

describe('RN-37 · sin reclamar: más de 30 días en Lista para Entregar', () => {
    const sinReclamar = async () => (await getDashboardData()).kpis.ordenesSinReclamar;

    /**
     * Simula que la orden lleva `dias` días Lista para Entregar y que la fecha
     * prometida también quedó atrás (Ley 1480 art. 18: el plazo corre desde la
     * fecha prevista de devolución).
     */
    async function listaDesdeHace(id_orden, dias) {
        await db.run(
            "UPDATE orden_trabajo SET fecha_lista = datetime('now','localtime', ?), fecha_entrega_estimada = date('now','localtime', ?) WHERE id_orden = ?",
            [`-${dias} days`, `-${dias} days`, id_orden]
        );
    }

    it('Ley 1480 art. 18: terminada antes de lo prometido, el plazo corre desde la fecha prometida', async () => {
        const { id } = await ordenLista();
        // Lista hace 40 días, pero se le prometió para hace 10
        await db.run(
            "UPDATE orden_trabajo SET fecha_lista = datetime('now','localtime','-40 days'), fecha_entrega_estimada = date('now','localtime','-10 days') WHERE id_orden = ?",
            [id]
        );
        expect(await sinReclamar()).toBe(0);

        await db.run("UPDATE orden_trabajo SET fecha_entrega_estimada = date('now','localtime','-31 days') WHERE id_orden = ?", [id]);
        expect(await sinReclamar()).toBe(1);
    });

    it('P1-11: una orden que quedó Lista hoy no está sin reclamar aunque su fecha estimada sea antigua', async () => {
        const id = await createOrden({ id_cliente: await cliente(), fecha_entrega_estimada: enDias(-60) });
        const a = await prenda(id);
        await estadoPrenda(a, id, P.TERMINADA);

        expect(await sinReclamar()).toBe(0);
    });

    it('con 30 días en Lista todavía no; con 31, sí', async () => {
        const { id } = await ordenLista();

        await listaDesdeHace(id, 30);
        expect(await sinReclamar()).toBe(0);

        await listaDesdeHace(id, 31);
        expect(await sinReclamar()).toBe(1);
    });

    it('la fecha se sella al quedar Lista y se borra al salir de Lista', async () => {
        const { id, a } = await ordenLista();
        expect((await getOrdenById(id)).fecha_lista).toMatch(FECHA_HORA);

        await estadoPrenda(a, id, P.EN_PROCESO);

        expect((await getOrdenById(id)).fecha_lista).toBeNull();
    });

    it('una orden que vuelve a quedar Lista empieza la cuenta de cero', async () => {
        const { id, a } = await ordenLista();
        await listaDesdeHace(id, 40);
        expect(await sinReclamar()).toBe(1);

        await estadoPrenda(a, id, P.EN_PROCESO);
        await estadoPrenda(a, id, P.TERMINADA);

        expect(await sinReclamar()).toBe(0);
    });

    it('entregada o cancelada ya no cuenta', async () => {
        const entregada = await ordenLista();
        const cancelada = await ordenLista();
        await listaDesdeHace(entregada.id, 40);
        await listaDesdeHace(cancelada.id, 40);
        expect(await sinReclamar()).toBe(2);

        await cambiarOrden(entregada.id, O.ENTREGADA);
        await cambiarOrden(cancelada.id, O.CANCELADA);

        expect(await sinReclamar()).toBe(0);
    });

    it('los días salen de la configuración del negocio', async () => {
        const { id } = await ordenLista();
        await listaDesdeHace(id, 20);
        await db.run("UPDATE configuracion SET valor = '15' WHERE clave = 'dias_sin_reclamar'");

        expect(await sinReclamar()).toBe(1);
    });
});

describe('RN-38 · próxima a vencer según el período que configura el negocio', () => {
    it('el período sale de la configuración y se puede cambiar', async () => {
        const enCincoDias = enDias(5);
        expect(clasificarVencimiento(enCincoDias, new Date(), await cargarDiasAnticipacion())).toBeNull();

        await guardarDiasAnticipacion(7);

        expect(clasificarVencimiento(enCincoDias, new Date(), await cargarDiasAnticipacion())).toBe(VENCIMIENTO.PROXIMA);
    });
});

// ── Observaciones y fotografías ───────────────────────────────────────────

describe('RN-39 · las observaciones se conservan mientras exista la prenda', () => {
    it('siguen ahí después de cambiar el estado y el precio de la prenda', async () => {
        const id = await orden();
        const a = await prenda(id);
        await usePrendas().addNewObservacion(a, 'Color azul');

        await estadoPrenda(a, id, P.EN_PROCESO);
        await usePrendas().editPrenda(a, 'Basta y ruedo', 25000, id);

        expect((await getObservacionesByPrenda(a)).map(o => o.descripcion)).toEqual(['Color azul']);
    });
});

describe('RN-40 · borrar una fotografía no borra la prenda', () => {
    it('la prenda conserva sus datos', async () => {
        const id = await orden();
        const a = await prenda(id, 20000, 'Cremallera');
        const foto = await saveFotografia(a, 'frente.jpeg');

        await usePrendas().removeFoto(foto);

        expect(await getFotografiasByPrenda(a)).toEqual([]);
        expect(await uno('SELECT descripcion_arreglo, valor FROM prenda WHERE id_prenda = ?', [a]))
            .toEqual({ descripcion_arreglo: 'Cremallera', valor: 20000 });
    });
});

// ── El catálogo está completo ─────────────────────────────────────────────

describe('Catálogo de reglas', () => {
    it('cada RN de docs/01-analisis/Costura.md tiene su bloque de pruebas en este archivo', () => {
        const catalogo = readFileSync(new URL('../../docs/01-analisis/Costura.md', import.meta.url), 'utf8');
        const reglas = [...new Set([...catalogo.matchAll(/^RN-(\d{2})\./gm)].map(m => `RN-${m[1]}`))];

        const esteArchivo = readFileSync(new URL(import.meta.url), 'utf8');
        const probadas = new Set([...esteArchivo.matchAll(/describe\('(RN-\d{2}) ·/g)].map(m => m[1]));

        expect(reglas.length).toBeGreaterThanOrEqual(40);
        expect(reglas.filter(regla => !probadas.has(regla))).toEqual([]);
    });
});

describe('Trabajos recibidos antes de usar la app (oct 2026)', () => {
    it('una orden puede registrarse con la fecha en que se recibió la ropa', async () => {
        const recibida = `${enDias(-7)} 12:00:00`;
        const id = await useOrdenes().saveOrden({ id_cliente: await cliente(), fecha_creacion: recibida, fecha_entrega_estimada: enDias(-2) });
        expect((await getOrdenById(id)).fecha_creacion).toBe(recibida);
    });

    it('no se acepta una fecha de recepción futura ni una entrega anterior a la recepción', async () => {
        const id_cliente = await cliente();
        await expect(useOrdenes().saveOrden({ id_cliente, fecha_creacion: `${enDias(1)} 12:00:00`, fecha_entrega_estimada: enDias(3) }))
            .rejects.toThrow('posterior a hoy');
        await expect(useOrdenes().saveOrden({ id_cliente, fecha_creacion: `${enDias(-7)} 12:00:00`, fecha_entrega_estimada: enDias(-8) }))
            .rejects.toThrow('anterior a la fecha de creación');
    });

    it('un abono puede registrarse con fecha pasada y con Bre-B', async () => {
        const id = await orden();
        await prenda(id, 20000);
        const fecha = `${enDias(-3)} 12:00:00`;
        await usePagos().savePago({ id_orden: id, valor: 5000, id_metodo_pago: 5, fecha_pago: fecha }, 20000);

        const [pago] = await getPagosByOrden(id);
        expect(pago.fecha_pago).toBe(fecha);
        expect(pago.metodo_nombre).toBe('Bre-B');
        expect((await getOrdenById(id)).saldo_pendiente).toBe(15000);
    });
});
