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
  }
];
