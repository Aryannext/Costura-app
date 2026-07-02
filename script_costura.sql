CREATE DATABASE modista_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE modista_db;

CREATE TABLE estado_orden (
    id_estado_orden INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE estado_prenda (
    id_estado_prenda INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tipo_prenda (
    id_tipo_prenda INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE metodo_pago (
    id_metodo_pago INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tipo_notificacion (
    id_tipo_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tipo_actividad (
    id_tipo_actividad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE cliente (

    id_cliente INT AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    telefono VARCHAR(20) NOT NULL,

    direccion VARCHAR(200)

);

CREATE TABLE orden_trabajo (

    id_orden INT AUTO_INCREMENT PRIMARY KEY,

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_entrega_estimada DATE NOT NULL,

    fecha_entrega_real DATETIME NULL,

    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,

    saldo_pendiente DECIMAL(10,2) NOT NULL DEFAULT 0,

    id_cliente INT NOT NULL,

    id_estado_orden INT NOT NULL,

    CONSTRAINT fk_orden_cliente
        FOREIGN KEY(id_cliente)
        REFERENCES cliente(id_cliente),

    CONSTRAINT fk_orden_estado
        FOREIGN KEY(id_estado_orden)
        REFERENCES estado_orden(id_estado_orden)

);

CREATE TABLE prenda (

    id_prenda INT AUTO_INCREMENT PRIMARY KEY,

    descripcion_arreglo TEXT NOT NULL,

    valor DECIMAL(10,2) NOT NULL,

    id_orden INT NOT NULL,

    id_tipo_prenda INT NOT NULL,

    id_estado_prenda INT NOT NULL,

    CONSTRAINT fk_prenda_orden
        FOREIGN KEY(id_orden)
        REFERENCES orden_trabajo(id_orden),

    CONSTRAINT fk_prenda_tipo
        FOREIGN KEY(id_tipo_prenda)
        REFERENCES tipo_prenda(id_tipo_prenda),

    CONSTRAINT fk_prenda_estado
        FOREIGN KEY(id_estado_prenda)
        REFERENCES estado_prenda(id_estado_prenda)

);

CREATE TABLE observacion (

    id_observacion INT AUTO_INCREMENT PRIMARY KEY,

    descripcion TEXT NOT NULL,

    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_prenda INT NOT NULL,

    CONSTRAINT fk_observacion_prenda
        FOREIGN KEY(id_prenda)
        REFERENCES prenda(id_prenda)

);

CREATE TABLE fotografia (

    id_fotografia INT AUTO_INCREMENT PRIMARY KEY,

    ruta_archivo VARCHAR(255) NOT NULL,

    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_prenda INT NOT NULL,

    CONSTRAINT fk_fotografia_prenda
        FOREIGN KEY(id_prenda)
        REFERENCES prenda(id_prenda)

);

CREATE TABLE pago (

    id_pago INT AUTO_INCREMENT PRIMARY KEY,

    fecha_pago DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    valor DECIMAL(10,2) NOT NULL,

    id_orden INT NOT NULL,

    id_metodo_pago INT NOT NULL,

    CONSTRAINT fk_pago_orden
        FOREIGN KEY(id_orden)
        REFERENCES orden_trabajo(id_orden),

    CONSTRAINT fk_pago_metodo
        FOREIGN KEY(id_metodo_pago)
        REFERENCES metodo_pago(id_metodo_pago)

);

CREATE TABLE notificacion (

    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,

    mensaje TEXT NOT NULL,

    fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_orden INT NOT NULL,

    id_tipo_notificacion INT NOT NULL,

    CONSTRAINT fk_notificacion_orden
        FOREIGN KEY(id_orden)
        REFERENCES orden_trabajo(id_orden),

    CONSTRAINT fk_notificacion_tipo
        FOREIGN KEY(id_tipo_notificacion)
        REFERENCES tipo_notificacion(id_tipo_notificacion)

);

CREATE TABLE historial_actividad (

    id_actividad INT AUTO_INCREMENT PRIMARY KEY,

    descripcion TEXT NOT NULL,

    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_orden INT NOT NULL,

    id_tipo_actividad INT NOT NULL,

    CONSTRAINT fk_historial_orden
        FOREIGN KEY(id_orden)
        REFERENCES orden_trabajo(id_orden),

    CONSTRAINT fk_historial_tipo
        FOREIGN KEY(id_tipo_actividad)
        REFERENCES tipo_actividad(id_tipo_actividad)

);

CREATE INDEX idx_cliente_nombre
ON cliente(nombre);

CREATE INDEX idx_orden_cliente
ON orden_trabajo(id_cliente);

CREATE INDEX idx_orden_estado
ON orden_trabajo(id_estado_orden);

CREATE INDEX idx_prenda_orden
ON prenda(id_orden);

CREATE INDEX idx_pago_orden
ON pago(id_orden);

CREATE INDEX idx_notificacion_orden
ON notificacion(id_orden);

CREATE INDEX idx_historial_orden
ON historial_actividad(id_orden);

INSERT INTO estado_orden(nombre)
VALUES
('Pendiente'),
('En Proceso'),
('Lista para Entregar'),
('Entregada'),
('Cancelada');

INSERT INTO estado_prenda(nombre)
VALUES
('Pendiente'),
('En Proceso'),
('Terminada'),
('Entregada');

INSERT INTO metodo_pago(nombre)
VALUES
('Efectivo'),
('Transferencia'),
('Nequi'),
('Daviplata');

INSERT INTO tipo_notificacion(nombre)
VALUES
('Resumen'),
('Orden Lista'),
('Recordatorio');

INSERT INTO tipo_actividad(nombre)
VALUES
('Creación'),
('Modificación'),
('Cambio Estado'),
('Pago'),
('Entrega'),
('Cancelación'),
('Reapertura');

INSERT INTO tipo_prenda(nombre)
VALUES
('Pantalón'),
('Camisa'),
('Vestido'),
('Falda'),
('Chaqueta'),
('Blusa'),
('Uniforme'),
('Otro');