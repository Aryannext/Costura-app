// Pruebas de las reglas de negocio contra SQLite real en memoria.
// Cada prueba corresponde a un fallo de la auditoría (docs/04-calidad/FALLOS_APP_2026-10-06.md)
// y falla si ese fallo vuelve a aparecer.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({ ref: null }));

vi.mock('../../connection.js', async () => {
    const { crearDbMemoria } = await import('../../__tests__/sqliteMemoria.js');
    db.ref = crearDbMemoria();
    return { db: db.ref, saveDb: vi.fn() };
});

import { changeEstado, createOrden, getOrdenById } from '../ordenes.js';
import { createPrenda, deletePrenda, updateEstadoPrenda, updatePrenda } from '../prendas.js';
import { registrarPago, deletePago } from '../pagos.js';
import { getOrdenesParaRecordar } from '../notificaciones.js';
import { getAllClientes } from '../clientes.js';
import { getDashboardData } from '../reportes.js';
import { sembrarOrden } from '../../__tests__/sqliteMemoria.js';

const orden = async (id) => getOrdenById(id);
const estadosPrendas = async (id) =>
    (await db.ref.query('SELECT id_estado_prenda FROM prenda WHERE id_orden = ? ORDER BY id_prenda', [id]))
        .values.map(r => r.id_estado_prenda);

describe('Reglas de negocio con SQLite real', () => {
    beforeEach(() => db.ref.reiniciar());

    describe('A01 – eliminar pagos y prendas', () => {
        it('eliminar un pago lo borra y devuelve el valor al saldo', async () => {
            const { idOrden, idsPagos } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 50000, estado: 2 }], pagos: [20000] });
            await deletePago(idsPagos[0]);
            const pagos = await db.ref.query('SELECT * FROM pago WHERE id_orden = ?', [idOrden]);
            expect(pagos.values).toHaveLength(0);
            expect((await orden(idOrden)).saldo_pendiente).toBe(50000);
        });

        it('eliminar una prenda la borra con sus fotos/observaciones y descuenta su valor', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 30000, estado: 2 }, { valor: 20000, estado: 1 }] });
            db.ref.sql("INSERT INTO fotografia (ruta_archivo, id_prenda) VALUES ('file:///foto.jpeg', ?)", [idsPrendas[1]]);
            db.ref.sql("INSERT INTO observacion (descripcion, id_prenda) VALUES ('Botón suelto', ?)", [idsPrendas[1]]);

            const rutas = await deletePrenda(idsPrendas[1]);

            expect(rutas).toEqual(['file:///foto.jpeg']);
            const o = await orden(idOrden);
            expect(o.valor_total).toBe(30000);
            expect(o.saldo_pendiente).toBe(30000);
            expect((await db.ref.query('SELECT * FROM fotografia')).values).toHaveLength(0);
        });

        it('no deja eliminar una prenda si el cliente ya pagó más que el nuevo total', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 30000, estado: 2 }, { valor: 20000, estado: 1 }], pagos: [40000] });
            await expect(deletePrenda(idsPrendas[1])).rejects.toThrow('ya pagó');
            expect((await orden(idOrden)).valor_total).toBe(50000);
        });

        it('si se elimina la única prenda pendiente, la orden queda Lista', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 30000, estado: 3 }, { valor: 20000, estado: 1 }] });
            await deletePrenda(idsPrendas[1]);
            expect((await orden(idOrden)).id_estado_orden).toBe(3);
        });
    });

    describe('A02 – no registrar avisos que no se enviaron', () => {
        it('terminar todas las prendas pasa la orden a Lista sin insertar notificaciones falsas', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 10000, estado: 2 }] });
            const r = await updateEstadoPrenda(idsPrendas[0], 3, idOrden);
            expect(r.estadoOrden).toBe(3);
            const o = await orden(idOrden);
            expect(o.id_estado_orden).toBe(3);
            expect(o.fecha_lista).toBeTruthy();
            expect((await db.ref.query('SELECT * FROM notificacion')).values).toHaveLength(0);
        });

        it('consultar órdenes para recordar no inserta nada', async () => {
            sembrarOrden(db.ref, { estadoOrden: 3, prendas: [{ valor: 10000, estado: 3 }] });
            const lista = await getOrdenesParaRecordar();
            expect(lista).toHaveLength(1);
            expect(lista[0].cliente_telefono).toBe('3001234567');
            expect((await db.ref.query('SELECT * FROM notificacion')).values).toHaveLength(0);
        });
    });

    describe('A03 – reabrir', () => {
        it('reabrir una orden entregada la deja En Proceso, borra la fecha real y las prendas vuelven a Terminada', async () => {
            const { idOrden } = sembrarOrden(db.ref, { estadoOrden: 3, prendas: [{ valor: 10000, estado: 3 }] });
            await changeEstado(idOrden, 4);
            expect((await orden(idOrden)).fecha_entrega_real).toBeTruthy();

            await changeEstado(idOrden, 2);
            const o = await orden(idOrden);
            expect(o.id_estado_orden).toBe(2);
            expect(o.fecha_entrega_real).toBeNull();
            expect(await estadosPrendas(idOrden)).toEqual([3]);
            const reapertura = await db.ref.query('SELECT * FROM historial_actividad WHERE id_orden = ? AND id_tipo_actividad = 7', [idOrden]);
            expect(reapertura.values).toHaveLength(1);
        });
    });

    describe('A04 / A14 – Lista y Entregar exigen prendas terminadas', () => {
        it('rechaza Marcar Lista con prendas sin terminar', async () => {
            const { idOrden } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 10000, estado: 3 }, { valor: 5000, estado: 2 }] });
            await expect(changeEstado(idOrden, 3)).rejects.toThrow('Faltan 1 prenda');
            expect((await orden(idOrden)).id_estado_orden).toBe(2);
        });

        it('rechaza Entregar una orden con prendas sin terminar', async () => {
            const { idOrden } = sembrarOrden(db.ref, { estadoOrden: 3, prendas: [{ valor: 10000, estado: 2 }] });
            await expect(changeEstado(idOrden, 4)).rejects.toThrow('Faltan');
        });

        it('rechaza Iniciar Proceso en una orden sin prendas', async () => {
            const { idOrden } = sembrarOrden(db.ref, { estadoOrden: 1 });
            await expect(changeEstado(idOrden, 2)).rejects.toThrow('al menos una prenda');
        });

        it('permite entregar con saldo pendiente (fiado, RN-30) y el saldo se conserva', async () => {
            const { idOrden } = sembrarOrden(db.ref, { estadoOrden: 3, prendas: [{ valor: 10000, estado: 3 }], pagos: [4000] });
            await changeEstado(idOrden, 4);
            const o = await orden(idOrden);
            expect(o.id_estado_orden).toBe(4);
            expect(o.saldo_pendiente).toBe(6000);
            expect(await estadosPrendas(idOrden)).toEqual([4]);
        });

        it('no deja cancelar una orden entregada', async () => {
            const { idOrden } = sembrarOrden(db.ref, { estadoOrden: 4, prendas: [{ valor: 10000, estado: 4 }] });
            await expect(changeEstado(idOrden, 5)).rejects.toThrow('entregada no se puede cancelar');
        });
    });

    describe('A05 – la orden sigue a sus prendas', () => {
        it('si una prenda vuelve a En Proceso, la orden Lista regresa a En Proceso', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 3, prendas: [{ valor: 10000, estado: 3 }, { valor: 5000, estado: 3 }] });
            await updateEstadoPrenda(idsPrendas[1], 2, idOrden);
            const o = await orden(idOrden);
            expect(o.id_estado_orden).toBe(2);
            expect(o.fecha_lista).toBeNull();
        });

        it('agregar una prenda nueva a una orden Lista la devuelve a En Proceso', async () => {
            const { idOrden } = sembrarOrden(db.ref, { estadoOrden: 3, prendas: [{ valor: 10000, estado: 3 }] });
            await createPrenda({ descripcion_arreglo: 'Cremallera', valor: 15000, id_orden: idOrden, id_tipo_prenda: 1 });
            const o = await orden(idOrden);
            expect(o.id_estado_orden).toBe(2);
            expect(o.valor_total).toBe(25000);
        });

        it('empezar la primera prenda pasa una orden Pendiente a En Proceso', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 1, prendas: [{ valor: 10000, estado: 1 }] });
            await updateEstadoPrenda(idsPrendas[0], 2, idOrden);
            expect((await orden(idOrden)).id_estado_orden).toBe(2);
        });

        it('entregar todas las prendas una por una entrega la orden', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 3, prendas: [{ valor: 10000, estado: 3 }, { valor: 5000, estado: 3 }] });
            await updateEstadoPrenda(idsPrendas[0], 4, idOrden);
            expect((await orden(idOrden)).id_estado_orden).toBe(3);
            await updateEstadoPrenda(idsPrendas[1], 4, idOrden);
            expect((await orden(idOrden)).id_estado_orden).toBe(4);
        });

        it('no deja entregar una prenda que no está terminada', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 10000, estado: 2 }] });
            await expect(updateEstadoPrenda(idsPrendas[0], 4, idOrden)).rejects.toThrow('no está Terminada');
        });
    });

    describe('A06 – el saldo nunca queda negativo', () => {
        it('rechaza bajar el precio por debajo de lo ya pagado', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 100000, estado: 2 }], pagos: [100000] });
            await expect(updatePrenda(idsPrendas[0], 'Dobladillo', 80000, idOrden)).rejects.toThrow('ya pagó');
            expect((await orden(idOrden)).saldo_pendiente).toBe(0);
        });

        it('permite bajar el precio si lo pagado sigue cubierto', async () => {
            const { idOrden, idsPrendas } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 100000, estado: 2 }], pagos: [50000] });
            await updatePrenda(idsPrendas[0], 'Dobladillo', 80000, idOrden);
            const o = await orden(idOrden);
            expect(o.valor_total).toBe(80000);
            expect(o.saldo_pendiente).toBe(30000);
        });
    });

    describe('Registro de trabajos anteriores a la app', () => {
        it('crea una orden con fecha de recepción pasada', async () => {
            db.ref.sql("INSERT INTO cliente (nombre, telefono) VALUES ('Ana', '3110000000')");
            const id = await createOrden({ id_cliente: 1, fecha_creacion: '2026-09-29 12:00:00', fecha_entrega_estimada: '2026-10-03' });
            expect((await orden(id)).fecha_creacion).toBe('2026-09-29 12:00:00');
        });

        it('registra un pago con fecha pasada y aparece en ese día', async () => {
            const { idOrden } = sembrarOrden(db.ref, { estadoOrden: 2, prendas: [{ valor: 10000, estado: 2 }] });
            await registrarPago({ valor: 5000, id_orden: idOrden, id_metodo_pago: 5, fecha_pago: '2026-09-30 12:00:00' });
            const pago = (await db.ref.query('SELECT p.*, m.nombre FROM pago p JOIN metodo_pago m USING (id_metodo_pago)')).values[0];
            expect(pago.fecha_pago).toBe('2026-09-30 12:00:00');
            expect(pago.nombre).toBe('Bre-B');
        });
    });

    describe('A12 / A18', () => {
        it('la agenda devuelve más de 50 clientes', async () => {
            for (let i = 0; i < 51; i++) db.ref.sql("INSERT INTO cliente (nombre, telefono) VALUES (?, '3000000000')", [`Cliente ${String(i).padStart(2, '0')}`]);
            expect(await getAllClientes()).toHaveLength(51);
        });

        it('"sin reclamar" se cuenta desde que la orden quedó Lista, no desde la entrega estimada', async () => {
            const { idOrden } = sembrarOrden(db.ref, { estadoOrden: 3, prendas: [{ valor: 10000, estado: 3 }] });
            // Entrega estimada muy vieja, pero quedó Lista hoy
            db.ref.sql("UPDATE orden_trabajo SET fecha_entrega_estimada = '2026-01-01', fecha_lista = datetime('now','localtime') WHERE id_orden = ?", [idOrden]);
            expect((await getDashboardData()).kpis.ordenesSinReclamar).toBe(0);

            db.ref.sql("UPDATE orden_trabajo SET fecha_lista = datetime('now','localtime','-31 days') WHERE id_orden = ?", [idOrden]);
            expect((await getDashboardData()).kpis.ordenesSinReclamar).toBe(1);
        });
    });
});
