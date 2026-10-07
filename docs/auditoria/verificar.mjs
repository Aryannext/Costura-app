// Reproduce hallazgos sin usar datos del taller ni enviar mensajes externos.
// Node 24: node docs/auditoria/verificar.mjs
import { DatabaseSync } from 'node:sqlite';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { migrations } from '../../src/database/migrations.js';

const root = new URL('../../', import.meta.url);
const results = [];
let sequence = 0;
let memory;

function freshDatabase() {
  if (memory) memory.close();
  memory = new DatabaseSync(':memory:');
  memory.exec('PRAGMA foreign_keys=ON;');
  for (const sql of migrations[0].statements) memory.exec(sql);
  memory.exec("INSERT INTO cliente(nombre,telefono) VALUES ('Cliente de prueba','3001234567');");
  memory.exec("INSERT INTO orden_trabajo(id_cliente,id_estado_orden,fecha_entrega_estimada,valor_total,saldo_pendiente) VALUES(1,2,'2026-10-05',100000,100000);");
  memory.exec("INSERT INTO prenda(descripcion_arreglo,valor,id_orden,id_tipo_prenda,id_estado_prenda) VALUES('Arreglo',100000,1,1,2);");
  return {
    query: async (sql, values=[]) => ({ values: memory.prepare(sql).all(...values) }),
    run: async (sql, values=[]) => {
      const change = memory.prepare(sql).run(...values);
      return { changes: { lastId: Number(change.lastInsertRowid), changes: Number(change.changes) } };
    },
    executeSet: async (set, transaction=true) => {
      if (transaction) memory.exec('BEGIN;');
      let last;
      try {
        for (const entry of set) last = memory.prepare(entry.statement).run(...entry.values);
        if (transaction) memory.exec('COMMIT;');
        return { changes: { lastId: Number(last.lastInsertRowid), changes: Number(last.changes) } };
      } catch (error) {
        if (transaction) memory.exec('ROLLBACK;');
        throw error;
      }
    },
  };
}

// Ejecuta los cuerpos originales; sustituye únicamente imports por adaptadores
// SQLite en memoria y dobles de Vue, Capacitor y transporte. No prueba hardware.
async function loadOriginal(path, dependencies) {
  const key = `__audit_${sequence++}`;
  globalThis[key] = dependencies;
  const original = await readFile(new URL(path, root), 'utf8');
  const source = original.replace(/^import\s[\s\S]*?;\s*/gm, '');
  const prelude = `const { ${Object.keys(dependencies).join(', ')} } = globalThis.${key};\n`;
  return import(`data:text/javascript;base64,${Buffer.from(prelude + source).toString('base64')}`);
}

async function probe(id, name, action) {
  try {
    const detail = await action();
    results.push({ id, name, reproduced: true, detail });
    console.log(`${id}: REPRODUCIDO — ${name}`);
  } catch (error) {
    results.push({ id, name, reproduced: false, error: error.message });
    console.error(`${id}: NO CONFIRMADO — ${error.message}`);
    process.exitCode = 1;
  }
}

const saveDb = async () => {};
const registrarHistorialActividad = async () => {};
const ref = value => ({ value });

await probe('A01', 'Eliminar anuncia éxito y conserva el pago', async () => {
  freshDatabase();
  memory.exec('INSERT INTO pago(valor,id_orden,id_metodo_pago) VALUES(10000,1,1);');
  const messages = [];
  const { useOrdenModals } = await loadOriginal('src/composables/useOrdenModals.js', { ref, inject: () => (msg) => messages.push(msg) });
  const modals = useOrdenModals();
  modals.openDeleteSheet('pago',1);
  modals.handleSheetAction({ id: 'delete' });
  const count = memory.prepare('SELECT COUNT(*) AS total FROM pago').get().total;
  assert.equal(count,1);
  assert.ok(messages.some(msg => msg.includes('Pago eliminado')));
  return { remainingPayments: count, messages };
});

await probe('A02', 'Recordatorios masivos registran envíos sin transporte', async () => {
  const db = freshDatabase();
  memory.exec('UPDATE orden_trabajo SET id_estado_orden=3;');
  let requests = 0;
  const { executeRecordatoriosMasivos } = await loadOriginal('src/database/queries/notificaciones.js', { db, saveDb, fetch: async () => { requests++; } });
  const count = await executeRecordatoriosMasivos();
  assert.equal(count,1);
  assert.equal(requests,0);
  return { reportedAsSent: count, networkRequests: requests, notificationRows: memory.prepare('SELECT COUNT(*) AS total FROM notificacion').get().total };
});

await probe('A03', 'Reapertura deja orden Pendiente con prendas entregadas y fecha antigua', async () => {
  const db = freshDatabase();
  memory.exec("UPDATE orden_trabajo SET id_estado_orden=4,fecha_entrega_real='2026-10-05 10:00:00'; UPDATE prenda SET id_estado_prenda=4;");
  const { changeEstado } = await loadOriginal('src/database/queries/ordenes.js', { db, saveDb });
  await changeEstado(1,1,'Pendiente',{ id_estado_orden: 4 });
  const order = memory.prepare('SELECT id_estado_orden,fecha_entrega_real FROM orden_trabajo').get();
  assert.equal(order.id_estado_orden,1);
  assert.ok(order.fecha_entrega_real);
  assert.equal(memory.prepare('SELECT id_estado_prenda FROM prenda').get().id_estado_prenda,4);
  return order;
});

await probe('A04', 'Marcar Lista admite prendas En Proceso', async () => {
  const db = freshDatabase();
  const { changeEstado } = await loadOriginal('src/database/queries/ordenes.js', { db, saveDb });
  await changeEstado(1,3,'Lista para Entregar',{ id_estado_orden: 2 });
  assert.equal(memory.prepare('SELECT id_estado_orden FROM orden_trabajo').get().id_estado_orden,3);
  assert.equal(memory.prepare('SELECT id_estado_prenda FROM prenda').get().id_estado_prenda,2);
  return { orderState:3, garmentState:2 };
});

await probe('A05', 'Regresar prenda a En Proceso deja orden Lista', async () => {
  const db = freshDatabase();
  memory.exec('UPDATE orden_trabajo SET id_estado_orden=3; UPDATE prenda SET id_estado_prenda=3;');
  const { updateEstadoPrenda } = await loadOriginal('src/database/queries/prendas.js', { db, saveDb, registrarHistorialActividad });
  await updateEstadoPrenda(1,2,1);
  assert.equal(memory.prepare('SELECT id_estado_orden FROM orden_trabajo').get().id_estado_orden,3);
  return { orderState:3, garmentState:2 };
});

await probe('A06', 'Reducir precio después de pagar produce saldo negativo', async () => {
  const db = freshDatabase();
  memory.exec('UPDATE orden_trabajo SET saldo_pendiente=0; INSERT INTO pago(valor,id_orden,id_metodo_pago) VALUES(100000,1,1);');
  const { updatePrenda } = await loadOriginal('src/database/queries/prendas.js', { db, saveDb, registrarHistorialActividad });
  await updatePrenda(1,'Arreglo ajustado',80000,1);
  const order = memory.prepare('SELECT valor_total,saldo_pendiente FROM orden_trabajo').get();
  assert.equal(order.saldo_pendiente,-20000);
  return order;
});

await probe('A07', 'Alta directa de cliente acepta teléfono vacío', async () => {
  const db = freshDatabase();
  const { createCliente } = await loadOriginal('src/database/queries/clientes.js', { db, saveDb });
  await createCliente({ nombre:'Cliente sin teléfono', telefono:'' });
  assert.equal(memory.prepare('SELECT telefono FROM cliente WHERE id_cliente=2').get().telefono,'');
  return { insertedPhone: '' };
});

await probe('A08', 'Reporte Telegram omite orden vencida por usar campo inexistente', async () => {
  freshDatabase();
  const orders = memory.prepare('SELECT * FROM orden_trabajo').all();
  let sent;
  const { useTelegramReports } = await loadOriginal('src/composables/useTelegramReports.js', {
    useTelegramBot: () => ({ sendTelegramMessage: async msg => { sent=msg; return true; } }),
    useOrdenes: () => ({ ordenes:{ value:orders }, fetchOrdenes:async () => {} }),
  });
  await useTelegramReports(() => {}).generarReporte();
  assert.ok(!sent.includes('Atrasadas'));
  assert.equal(Number.isNaN(new Date(orders[0].fecha_entrega).getTime()),true);
  return { overdueDate:orders[0].fecha_entrega_estimada, wrongField: 'fecha_entrega', sent };
});

await probe('A09', 'Fecha de hoy rechazada al interpretarse como UTC en Bogotá', async () => {
  const priorTZ = process.env.TZ;
  process.env.TZ='America/Bogota';
  try {
    const RealDate=Date;
    class FixedDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : ['2026-10-06T15:00:00-05:00'])); }
    }
    const { validators } = await loadOriginal('src/services/validators.js', { Date:FixedDate });
    assert.throws(() => validators.validateFechaEntrega('2026-10-06'), /anterior/);
    return { selectedDate:'2026-10-06', localNow:'2026-10-06T15:00:00-05:00', rejected:true };
  } finally {
    if (priorTZ === undefined) delete process.env.TZ;
    else process.env.TZ=priorTZ;
  }
});

await probe('A10', 'Sesión persistida antigua se acepta sin verificar expiración', async () => {
  const oldSession={ id:1,username:'admin',loginTime:0 };
  const { isAuthenticated } = await loadOriginal('src/services/auth.js', {
    getUsuarioByUsername: async () => null, updateUltimoAcceso:async () => {}, bcrypt:{},
    Preferences:{ get:async () => ({ value:JSON.stringify(oldSession) }) }, router:{},
    window:{ addEventListener:() => {}, removeEventListener:() => {} },
    setTimeout:() => 1, clearTimeout:() => {},
  });
  assert.equal(await isAuthenticated(),true);
  return { storedLoginTime:0, authenticated:true };
});

await probe('A11', 'Recibo usa fecha_recepcion inexistente y omite detalles de prendas y pagos', async () => {
  freshDatabase();
  const order=memory.prepare('SELECT * FROM orden_trabajo').get();
  order.cliente_nombre='Cliente de prueba';
  order.estado_nombre='En Proceso';
  let sent;
  const { useOrdenTelegram } = await loadOriginal('src/composables/useOrdenTelegram.js', {
    inject:() => () => {},
    useTelegramBot:() => ({ sendTelegramMessage:async msg => { sent=msg; return true; } }),
    useNotificaciones:() => ({ saveNotificacion:async () => {} }), Share:{},
  });
  await useOrdenTelegram({ value:order }).generarReciboTelegram();
  assert.ok(sent.includes('*Fecha de Recepción:* \n'));
  assert.ok(!sent.includes('Arreglo'));
  return { emptyReceptionDate:true, sent };
});

await probe('A12', 'Listado inicial muestra solo 50 de 51 clientes', async () => {
  const db=freshDatabase();
  for (let i=0;i<50;i++) memory.prepare('INSERT INTO cliente(nombre,telefono) VALUES(?,?)').run(`Cliente ${i}`,'3001234567');
  const { getAllClientes }=await loadOriginal('src/database/queries/clientes.js',{ db,saveDb });
  assert.equal((await getAllClientes()).length,50);
  return { registered:51, initialList:50 };
});

await probe('A13', 'Alarma diaria repite el número calculado al abrir el panel', async () => {
  let scheduled;
  const { useNotificacionesLocales }=await loadOriginal('src/composables/useNotificacionesLocales.js',{
    db:{ query:async () => ({ values:[{ pendientes_hoy:2 }] }) },
    LocalNotifications:{ checkPermissions:async () => ({ display:'granted' }), cancel:async () => {}, schedule:async config => { scheduled=config; } },
  });
  await useNotificacionesLocales().scheduleDailyReminders();
  const notification=scheduled.notifications[0];
  assert.equal(notification.schedule.repeats,true);
  assert.ok(notification.body.includes('2 orden'));
  return notification;
});

await probe('A14', 'Entrega general admite deuda y prendas aún En Proceso', async () => {
  const db=freshDatabase();
  const { changeEstado }=await loadOriginal('src/database/queries/ordenes.js',{ db,saveDb });
  await changeEstado(1,4,'Entregada',{ id_estado_orden:3,saldo_pendiente:100000 });
  const order=memory.prepare('SELECT id_estado_orden,saldo_pendiente FROM orden_trabajo').get();
  assert.equal(order.id_estado_orden,4);
  assert.equal(order.saldo_pendiente,100000);
  return { ...order, garmentState:memory.prepare('SELECT id_estado_prenda FROM prenda').get().id_estado_prenda };
});

memory.close();
await writeFile(new URL('./resultados.json',import.meta.url),JSON.stringify({
  reviewDate:'2026-10-06', runtime:process.version,
  scope:'Lógica original con SQLite en memoria y dobles de servicios; sin navegador, hardware ni datos reales.',
  reproduced:results.filter(r => r.reproduced).length, total:results.length, results,
},null,2)+'\n');
console.log(`Resultados: ${fileURLToPath(new URL('./resultados.json',import.meta.url))}`);
