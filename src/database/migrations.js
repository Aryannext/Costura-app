export const migrations = [
  {
    toVersion: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS estado_orden (
          id_estado_orden INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE
      );`,
      `CREATE TABLE IF NOT EXISTS estado_prenda (
          id_estado_prenda INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE
      );`,
      `CREATE TABLE IF NOT EXISTS tipo_prenda (
          id_tipo_prenda INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE
      );`,
      `CREATE TABLE IF NOT EXISTS metodo_pago (
          id_metodo_pago INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE
      );`,
      `CREATE TABLE IF NOT EXISTS tipo_notificacion (
          id_tipo_notificacion INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE
      );`,
      `CREATE TABLE IF NOT EXISTS tipo_actividad (
          id_tipo_actividad INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE
      );`,
      `CREATE TABLE IF NOT EXISTS cliente (
          id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          telefono TEXT NOT NULL,
          direccion TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS orden_trabajo (
          id_orden INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha_creacion TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          fecha_entrega_estimada TEXT NOT NULL,
          fecha_entrega_real TEXT,
          valor_total REAL NOT NULL DEFAULT 0,
          saldo_pendiente REAL NOT NULL DEFAULT 0,
          id_cliente INTEGER NOT NULL,
          id_estado_orden INTEGER NOT NULL,
          FOREIGN KEY(id_cliente) REFERENCES cliente(id_cliente),
          FOREIGN KEY(id_estado_orden) REFERENCES estado_orden(id_estado_orden)
      );`,
      `CREATE TABLE IF NOT EXISTS prenda (
          id_prenda INTEGER PRIMARY KEY AUTOINCREMENT,
          descripcion_arreglo TEXT NOT NULL,
          valor REAL NOT NULL,
          id_orden INTEGER NOT NULL,
          id_tipo_prenda INTEGER NOT NULL,
          id_estado_prenda INTEGER NOT NULL,
          FOREIGN KEY(id_orden) REFERENCES orden_trabajo(id_orden),
          FOREIGN KEY(id_tipo_prenda) REFERENCES tipo_prenda(id_tipo_prenda),
          FOREIGN KEY(id_estado_prenda) REFERENCES estado_prenda(id_estado_prenda)
      );`,
      `CREATE TABLE IF NOT EXISTS observacion (
          id_observacion INTEGER PRIMARY KEY AUTOINCREMENT,
          descripcion TEXT NOT NULL,
          fecha_registro TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          id_prenda INTEGER NOT NULL,
          FOREIGN KEY(id_prenda) REFERENCES prenda(id_prenda)
      );`,
      `CREATE TABLE IF NOT EXISTS fotografia (
          id_fotografia INTEGER PRIMARY KEY AUTOINCREMENT,
          ruta_archivo TEXT NOT NULL,
          fecha_registro TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          id_prenda INTEGER NOT NULL,
          FOREIGN KEY(id_prenda) REFERENCES prenda(id_prenda)
      );`,
      `CREATE TABLE IF NOT EXISTS pago (
          id_pago INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha_pago TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          valor REAL NOT NULL,
          id_orden INTEGER NOT NULL,
          id_metodo_pago INTEGER NOT NULL,
          FOREIGN KEY(id_orden) REFERENCES orden_trabajo(id_orden),
          FOREIGN KEY(id_metodo_pago) REFERENCES metodo_pago(id_metodo_pago)
      );`,
      `CREATE TABLE IF NOT EXISTS notificacion (
          id_notificacion INTEGER PRIMARY KEY AUTOINCREMENT,
          mensaje TEXT NOT NULL,
          fecha_envio TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          id_orden INTEGER NOT NULL,
          id_tipo_notificacion INTEGER NOT NULL,
          FOREIGN KEY(id_orden) REFERENCES orden_trabajo(id_orden),
          FOREIGN KEY(id_tipo_notificacion) REFERENCES tipo_notificacion(id_tipo_notificacion)
      );`,
      `CREATE TABLE IF NOT EXISTS historial_actividad (
          id_actividad INTEGER PRIMARY KEY AUTOINCREMENT,
          descripcion TEXT NOT NULL,
          fecha_hora TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          id_orden INTEGER NOT NULL,
          id_tipo_actividad INTEGER NOT NULL,
          FOREIGN KEY(id_orden) REFERENCES orden_trabajo(id_orden),
          FOREIGN KEY(id_tipo_actividad) REFERENCES tipo_actividad(id_tipo_actividad)
      );`,
      `CREATE TABLE IF NOT EXISTS usuario (
          id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          ultimo_acceso TEXT,
          fecha_creacion TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );`,
      `CREATE TABLE IF NOT EXISTS configuracion (
          clave TEXT PRIMARY KEY,
          valor TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_cliente_nombre ON cliente(nombre);`,
      `CREATE INDEX IF NOT EXISTS idx_orden_cliente ON orden_trabajo(id_cliente);`,
      `CREATE INDEX IF NOT EXISTS idx_orden_estado ON orden_trabajo(id_estado_orden);`,
      `CREATE INDEX IF NOT EXISTS idx_prenda_orden ON prenda(id_orden);`,
      `CREATE INDEX IF NOT EXISTS idx_pago_orden ON pago(id_orden);`,
      `CREATE INDEX IF NOT EXISTS idx_notificacion_orden ON notificacion(id_orden);`,
      `CREATE INDEX IF NOT EXISTS idx_historial_orden ON historial_actividad(id_orden);`,
      `CREATE INDEX IF NOT EXISTS idx_orden_fecha_entrega ON orden_trabajo(fecha_entrega_estimada);`,
      
      `INSERT OR IGNORE INTO estado_orden(id_estado_orden, nombre) VALUES (1, 'Pendiente'), (2, 'En Proceso'), (3, 'Lista para Entregar'), (4, 'Entregada'), (5, 'Cancelada');`,
      `INSERT OR IGNORE INTO estado_prenda(id_estado_prenda, nombre) VALUES (1, 'Pendiente'), (2, 'En Proceso'), (3, 'Terminada'), (4, 'Entregada');`,
      `INSERT OR IGNORE INTO metodo_pago(id_metodo_pago, nombre) VALUES (1, 'Efectivo'), (2, 'Transferencia'), (3, 'Nequi'), (4, 'Daviplata');`,
      `INSERT OR IGNORE INTO tipo_notificacion(id_tipo_notificacion, nombre) VALUES (1, 'Resumen'), (2, 'Orden Lista'), (3, 'Recordatorio');`,
      `INSERT OR IGNORE INTO tipo_actividad(id_tipo_actividad, nombre) VALUES (1, 'Creación'), (2, 'Modificación'), (3, 'Cambio Estado'), (4, 'Pago'), (5, 'Entrega'), (6, 'Cancelación'), (7, 'Reapertura');`,
      `INSERT OR IGNORE INTO tipo_prenda(id_tipo_prenda, nombre) VALUES (1, 'Pantalón'), (2, 'Camisa'), (3, 'Vestido'), (4, 'Falda'), (5, 'Chaqueta'), (6, 'Blusa'), (7, 'Uniforme'), (8, 'Otro');`,
      
      `INSERT OR IGNORE INTO configuracion(clave, valor) VALUES ('telegram_bot_token', ''), ('telegram_chat_id', ''), ('dias_anticipacion_vencer', '3'), ('dias_sin_reclamar', '30');`
    ]
  },
  {
    // P1-4: hasta la v1 el saldo se acumulaba por diferencias y nunca se
    // reconciliaba. Se recalculan todas las órdenes desde sus prendas y pagos.
    // Desde aquí cada escritura lo recalcula (ver queries/saldo.js).
    // El texto queda congelado a propósito: una migración ya aplicada en un
    // teléfono no debe cambiar aunque la consulta de la app evolucione.
    toVersion: 2,
    statements: [
      `UPDATE orden_trabajo SET
          valor_total = (SELECT COALESCE(SUM(valor), 0) FROM prenda WHERE prenda.id_orden = orden_trabajo.id_orden),
          saldo_pendiente = (SELECT COALESCE(SUM(valor), 0) FROM prenda WHERE prenda.id_orden = orden_trabajo.id_orden)
                          - (SELECT COALESCE(SUM(valor), 0) FROM pago WHERE pago.id_orden = orden_trabajo.id_orden);`
    ]
  },
  {
    // P1-9: un pago no se borra, se anula. Queda visible con fecha y motivo y
    // deja de contar en el saldo, para no perder el rastro del dinero (RN-14, RN-35).
    toVersion: 3,
    statements: [
      `ALTER TABLE pago ADD COLUMN anulado_en TEXT;`,
      `ALTER TABLE pago ADD COLUMN motivo_anulacion TEXT;`,
      `INSERT OR IGNORE INTO tipo_actividad(id_tipo_actividad, nombre) VALUES (8, 'Anulación de pago'), (9, 'Eliminación de prenda');`
    ]
  },
  {
    // RN-06, RN-16 y RN-17: desde aquí el estado de la orden se deriva de sus
    // prendas (services/estadoOrden.js). Hasta la v3 se fijaba a mano y podía
    // contradecirlas. Se ajustan las órdenes abiertas con la misma regla y se
    // deja constancia en el historial; entregadas y canceladas no se tocan.
    // Una orden abierta con todas sus prendas entregadas tampoco: no hay fecha
    // real de entrega que inventarle.
    toVersion: 4,
    statements: [
      `INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad)
       SELECT 'Estado ajustado automáticamente a ' ||
              CASE nuevo WHEN 1 THEN 'Pendiente: la orden no tiene prendas'
                         WHEN 2 THEN 'En Proceso: hay prendas pendientes o en proceso'
                         ELSE 'Lista para Entregar: todas las prendas están terminadas' END,
              id_orden, 3
       FROM (
         SELECT o.id_orden, o.id_estado_orden AS actual,
           CASE
             WHEN NOT EXISTS (SELECT 1 FROM prenda p WHERE p.id_orden = o.id_orden) THEN 1
             WHEN EXISTS (SELECT 1 FROM prenda p WHERE p.id_orden = o.id_orden AND p.id_estado_prenda IN (1, 2)) THEN 2
             WHEN EXISTS (SELECT 1 FROM prenda p WHERE p.id_orden = o.id_orden AND p.id_estado_prenda = 3) THEN 3
             ELSE o.id_estado_orden
           END AS nuevo
         FROM orden_trabajo o
         WHERE o.id_estado_orden IN (1, 2, 3)
       )
       WHERE nuevo <> actual;`,
      `UPDATE orden_trabajo SET id_estado_orden =
         CASE
           WHEN NOT EXISTS (SELECT 1 FROM prenda p WHERE p.id_orden = orden_trabajo.id_orden) THEN 1
           WHEN EXISTS (SELECT 1 FROM prenda p WHERE p.id_orden = orden_trabajo.id_orden AND p.id_estado_prenda IN (1, 2)) THEN 2
           WHEN EXISTS (SELECT 1 FROM prenda p WHERE p.id_orden = orden_trabajo.id_orden AND p.id_estado_prenda = 3) THEN 3
           ELSE id_estado_orden
         END
       WHERE id_estado_orden IN (1, 2, 3);`
    ]
  },
  {
    // RN-37 y P1-11: "sin reclamar" se mide desde que la orden quedó Lista para
    // Entregar, no desde la fecha estimada. Desde aquí la transición a Lista
    // sella `fecha_lista` (queries/estadoOrden.js) y salir de Lista la borra.
    // Para las órdenes que ya están Lista se toma su última entrada en ese
    // estado según el historial; si no hay ninguna, la fecha estimada de
    // entrega, que es lo que se medía hasta ahora.
    toVersion: 5,
    statements: [
      `ALTER TABLE orden_trabajo ADD COLUMN fecha_lista TEXT;`,
      `UPDATE orden_trabajo SET fecha_lista = COALESCE(
         (SELECT MAX(h.fecha_hora) FROM historial_actividad h
          WHERE h.id_orden = orden_trabajo.id_orden
            AND h.descripcion LIKE '%a Lista para Entregar%'),
         fecha_entrega_estimada)
       WHERE id_estado_orden = 3;`
    ]
  },
  {
    // Oct 2026: Bre-B (transferencias inmediatas del Banco de la República, sin
    // costo entre personas), nombre del taller para los mensajes y el recibo, y
    // tipos de aviso por WhatsApp. Solo inserta filas: no cambia datos existentes.
    toVersion: 6,
    statements: [
      `INSERT OR IGNORE INTO metodo_pago(id_metodo_pago, nombre) VALUES (5, 'Bre-B');`,
      `INSERT OR IGNORE INTO configuracion(clave, valor) VALUES ('nombre_taller', '');`,
      `INSERT OR IGNORE INTO tipo_notificacion(id_tipo_notificacion, nombre) VALUES (4, 'Orden Recibida'), (5, 'En Proceso'), (6, 'Cobro');`
    ]
  },
  {
    // Ley 1581 de 2012: prueba de la autorización de la clienta para guardar sus
    // datos. NULL = clienta registrada antes de esta versión, sin autorización
    // registrada todavía (la app lo muestra y permite registrarla).
    toVersion: 7,
    statements: [
      `ALTER TABLE cliente ADD COLUMN fecha_autorizacion_datos TEXT;`
    ]
  }
];
