# Especificación de Requisitos de Software · Atelier Manager

**Versión 1.0 · 7 de octubre de 2026** · Estructura según IEEE 830

Proyecto formativo SENA ADSO 2480542 · Centro Tecnológico de la Amazonia, Florencia (Caquetá)

> Este es el documento de requisitos **vigente**: describe lo que la aplicación debe hacer y si hoy lo hace.
> La especificación original se conserva sin cambios en [historico/Costura.md](historico/Costura.md); aquí se mantienen sus identificadores (RF, RNF, RN) para que todo siga siendo trazable.
> La prueba `src/__tests__/reglasNegocio.spec.js` lee la sección 3.4 y falla si alguna regla de negocio queda sin prueba automática.

---

## 1. Introducción

### 1.1 Propósito

Definir qué debe hacer Atelier Manager, una aplicación para gestionar un taller de costura casero: clientas, órdenes de trabajo, prendas, pagos y avisos. Va dirigido al instructor que evalúa el proyecto, a la dueña del taller que lo usa y a quien mantenga el código.

### 1.2 Alcance

**El problema.** En el taller se confunde de quién es cada prenda, se olvidan las fechas prometidas, se pierde la cuenta de los abonos y hay ropa que nadie recoge (D-01).

**La solución.** Una app de Android que funciona sin internet y registra cada prenda con su clienta, arreglo, fecha, avance y saldo. Además prepara los avisos por WhatsApp y guarda copias de seguridad cifradas.

**Fuera del alcance de esta entrega:**
- Tienda de ropa y venta de prendas abandonadas (D-07).
- Pasarela de pagos: la app registra pagos, no los procesa (D-05).
- Varios talleres, varios usuarios o sincronización entre teléfonos.
- Impresión térmica, exportación a Excel o PDF, y modo oscuro.

### 1.3 Definiciones

| Término | Significado |
| --- | --- |
| Modista | La dueña del taller; única usuaria de la app |
| Cliente o clienta | Quien deja la ropa. No usa la app |
| Orden | Lo que una clienta deja en una visita. Tiene cero o más prendas |
| Prenda | Cada pieza de ropa, con su arreglo, precio y estado |
| Abono | Pago parcial o total de una orden |
| Saldo | Suma de las prendas menos los pagos no anulados |
| Orden activa | Orden *En Proceso* o *Lista para Entregar* |
| Aviso preparado | Mensaje de WhatsApp que la app arma y abre; enviarlo lo decide la modista |
| Sin reclamar | Orden lista que nadie ha recogido en N días. Es una alerta, no un abandono legal |
| Offline-first | La app trabaja con datos del teléfono y no necesita internet |
| OTA | Actualización de la app sin reinstalar el APK |

### 1.4 Referencias

| Documento | Contenido |
| --- | --- |
| [historico/Costura.md](historico/Costura.md) | Especificación original: RF-01 a RF-49, RNF-01 a RNF-23, RN-01 a RN-40, historias de usuario y casos de prueba |
| [historico/MEJORAS_ADICIONALES_FASE1.md](historico/MEJORAS_ADICIONALES_FASE1.md) | RF-50 y RNF-24 a RNF-27 |
| [historico/COSTURA_FASE2_REQUISITOS.md](historico/COSTURA_FASE2_REQUISITOS.md) | RF-61 a RF-71 y RNF-28 a RNF-31 (fase posterior) |
| [../05-gestion/DECISIONES.md](../05-gestion/DECISIONES.md) | Por qué cambió cada requisito |
| [../04-calidad/TRAZABILIDAD.md](../04-calidad/TRAZABILIDAD.md) | Cada requisito con el archivo que lo implementa y su prueba |
| [../02-diseno/CASOS_DE_USO.md](../02-diseno/CASOS_DE_USO.md) | Casos de uso por actor |
| Ley 1581 de 2012 y Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) | Protección de datos personales |
| Ley 1480 de 2011, art. 18 | Recibo y custodia de bienes recibidos para un servicio |

### 1.5 Organización del documento

La sección 2 describe el producto en general. La sección 3 lista los requisitos con su estado actual. La sección 4 resume qué cambió frente a la especificación original, y la sección 5 lo que falta.

## 2. Descripción general

### 2.1 Perspectiva del producto

Producto nuevo e independiente. Es una aplicación web (Vue 3) empaquetada como APK con Capacitor, con su base SQLite dentro del teléfono. No depende de ningún servidor. La misma app corre en un navegador para demostraciones, con datos separados. Arquitectura en [ARQUITECTURA.md](../02-diseno/ARQUITECTURA.md).

### 2.2 Funciones principales

1. Registrar clientas con autorización de datos personales.
2. Crear órdenes, agregar prendas con fotos y notas, y seguir su avance.
3. Calcular solos el total, el saldo y el estado de cada orden.
4. Registrar abonos y anular pagos sin borrarlos.
5. Avisar a la clienta por WhatsApp y compartirle el recibo.
6. Mostrar el panel del día, las órdenes atrasadas, las próximas, las sin reclamar y lo que se debe.
7. Reporte financiero por periodo.
8. Copia de seguridad cifrada y restauración.
9. Avisos en el teléfono a las 8:00 y recordatorios por Telegram para la modista.

### 2.3 Características de los usuarios

Una sola usuaria: la modista. Usa WhatsApp todos los días, pero no tiene formación técnica. Por eso la app usa palabras del taller, botones grandes, confirmaciones claras y un tutorial guiado.

### 2.4 Restricciones

- **Plataforma:** Android con Capacitor 8. El navegador es solo para demostración.
- **Costo cero para el taller:** sin servidores ni servicios de pago. Los avisos van por enlaces `wa.me`, no por la API de WhatsApp Business (D-03).
- **Legales:** Ley 1581 de 2012 (autorización, aviso y supresión de datos) y Ley 1480 de 2011, art. 18 (recibo del bien recibido).
- **Datos en el dispositivo:** cada instalación tiene su propia base; no se comparten (D-06).

### 2.5 Suposiciones y dependencias

- El teléfono tiene WhatsApp instalado para los avisos.
- Telegram es **opcional**; sin él, todo funciona salvo los recordatorios, el reporte diario y el envío de copias al bot.
- El aviso exacto de las 8:00 depende de que Android conceda el permiso de alarmas exactas.

## 3. Requisitos específicos

**Estado** frente al código del 7 de octubre de 2026:
- **Cumple:** implementado y con prueba automática.
- **Parcial:** implementado con una diferencia que se explica.
- **No:** no implementado.
- **Derogado:** ya no aplica por una decisión registrada.
- **Futuro:** fase posterior.

### 3.1 Interfaces externas

| Interfaz | Descripción |
| --- | --- |
| Usuario | Pantallas móviles desde 360 px de ancho, barra de navegación inferior con cinco secciones, formularios en máximo tres pasos |
| Hardware | Cámara (fotos de prendas), lector de huella (desbloqueo), almacenamiento interno (base y fotos), notificaciones locales |
| Software | WhatsApp (enlaces `wa.me` con +57), menú Compartir de Android, API de bots de Telegram (opcional), Capgo para actualizaciones |
| Comunicaciones | HTTPS hacia Telegram y Capgo. Todo lo demás funciona sin red |

### 3.2 Requisitos funcionales

Donde dice "rev. 2" el texto cambió frente al original; la sección 4 explica por qué.

#### Clientes

| ID | Requisito | Estado |
| --- | --- | --- |
| RF-01 | Registrar una clienta con nombre y teléfono, solo si autoriza el tratamiento de sus datos (rev. 2) | Cumple |
| RF-02 | Consultar los datos de una clienta | Cumple |
| RF-03 | Actualizar los datos de una clienta | Cumple |
| RF-04 | Consultar el historial de órdenes de una clienta | Cumple |

#### Órdenes de trabajo

| ID | Requisito | Estado |
| --- | --- | --- |
| RF-05 | Crear una orden para una clienta registrada, con la fecha en que se recibió la ropa (hoy o anterior) (rev. 2) | Cumple |
| RF-06 | Asignar la fecha prometida de entrega, no anterior a la de recepción. Es obligatoria: la dueña siempre acuerda fecha y precio al recibir (confirmado el 8 de octubre de 2026) | Cumple |
| RF-07 | Consultar la información general de una orden | Cumple |
| RF-08 | Ver las órdenes pendientes, separadas en activas, historial y por cobrar | Cumple |
| RF-09 | Ver las órdenes ordenadas por fecha de entrega | Cumple |
| RF-10 | Consultar las órdenes atrasadas | Cumple |
| RF-11 | Cancelar una orden antes de entregarla, conservando sus pagos | Cumple |
| RF-12 | Impedir cancelar una orden *Entregada* | Cumple |
| RF-13 | Reabrir una orden *Entregada* | Cumple |
| RF-14 | Registrar cada reapertura en el historial | Cumple |
| RF-15 | Entregar prendas una por una | Cumple |
| RF-16 | Ver qué prendas faltan y cuáles ya se entregaron | Cumple |

#### Prendas

| ID | Requisito | Estado |
| --- | --- | --- |
| RF-17 | Registrar una prenda en una orden abierta | Cumple |
| RF-18 | Registrar la descripción del arreglo | Cumple |
| RF-19 | Asignar un precio mayor que cero | Cumple |
| RF-20 | Consultar el estado de una prenda | Cumple |
| RF-21 | Cambiar el estado de una prenda | Cumple |
| RF-22 | Ver las prendas de una orden | Cumple |
| RF-23 | Calcular solo el total de la orden desde sus prendas | Cumple |
| RF-24 | Pasar sola la orden a *Lista para Entregar* cuando no quede trabajo pendiente (rev. 2) | Cumple |
| RF-25 | Agregar notas a una prenda | Cumple |
| RF-26 | Consultar las notas de una prenda | Cumple |
| RF-27 | Tomar fotos de una prenda | Cumple |
| RF-28 | Guardar una o varias fotos por prenda | Cumple |
| RF-29 | Consultar las fotos de una prenda | Cumple |
| RF-30 | Ver las fotos en grande desde el detalle | Cumple |
| RF-31 | Corregir la descripción y el precio de una prenda | Cumple |
| RF-32 | Eliminar fotos tomadas por error | Cumple |
| RF-50 | Sugerir las descripciones de arreglo más frecuentes | Cumple |

#### Pagos

| ID | Requisito | Estado |
| --- | --- | --- |
| RF-33 | Registrar abonos, incluso con fecha anterior a hoy | Cumple |
| RF-34 | Registrar el medio de pago: Efectivo, Transferencia, Nequi, Daviplata o Bre-B (rev. 2) | Cumple |
| RF-35 | Consultar los pagos de una orden, con los anulados marcados (rev. 2) | Cumple |
| RF-36 | Calcular solo el saldo: total menos pagos no anulados | Cumple |
| RF-37 | Consultar las órdenes con saldo, también las ya entregadas | Cumple |
| RF-38 | Marcar la orden como *Pagada* cuando el saldo llegue a cero | Cumple |
| RF-OP-01 | Anular un pago con motivo, sin borrarlo | Cumple |

#### Comunicación

| ID | Requisito | Estado |
| --- | --- | --- |
| RF-39 | Cuando la orden esté lista, preparar el aviso para la clienta y abrir WhatsApp; la modista lo envía (rev. 2) | Cumple |
| RF-40 | Enviar a la modista, por Telegram, los recordatorios del día con un enlace de WhatsApp por cada orden sin recoger (rev. 2) | Cumple |
| RF-41 | Consultar el historial de avisos de una orden y de una clienta | Cumple |
| RF-42 | Generar el recibo de la orden con prendas, pagos y saldo, para compartirlo con la clienta o enviárselo la modista a su Telegram (rev. 2) | Cumple |

#### Seguimiento y reportes

| ID | Requisito | Estado |
| --- | --- | --- |
| RF-43 | Consultar las órdenes próximas a vencer, con anticipación configurable de 0 a 30 días | Cumple |
| RF-44 | Consultar los ingresos de un periodo | Cumple |
| RF-45 | Consultar el total por cobrar | Cumple |
| RF-46 | Consultar el historial de actividades de una orden | Cumple |
| RF-47 | Identificar las órdenes listas sin reclamar en más de 30 días, como alerta para la modista (rev. 2) | Cumple |
| RF-48 | Registrar sola la fecha y hora de entrega | Cumple |
| RF-49 | Buscar órdenes por nombre de la clienta | Cumple |
| RF-68 | Avisar en el teléfono, a las 8:00, las entregas del día, sin internet | Cumple |
| RF-70 | Buscador global de clientas, órdenes y prendas | Parcial: busca clientas y órdenes, no prendas |

#### Datos personales y recibo (requisitos nuevos)

| ID | Requisito | Estado |
| --- | --- | --- |
| RF-DAT-01 | Mostrar y compartir el aviso de privacidad: qué datos, para qué, por dónde pasan y qué derechos tiene la clienta | Cumple |
| RF-DAT-02 | Guardar la fecha de la autorización y la versión del aviso que aceptó | Cumple |
| RF-DAT-03 | Borrar los datos personales de una clienta a su pedido, si no tiene órdenes abiertas ni saldo, conservando las cuentas del taller | Cumple |
| RF-REC-01 | Incluir en el recibo el celular y la dirección de la clienta, la garantía y las condiciones del taller (Ley 1480 art. 18) | Cumple |

#### Fase posterior

RF-61 a RF-63 (bodega y venta de prendas abandonadas), RF-64 y RF-65 (exportar), RF-66 y RF-67 (impresión térmica), RF-69 (hora configurable del aviso) y RF-71 (modo oscuro): **Futuro**. RF-61 a RF-63 necesitan además revisión legal antes de construirse: treinta días sin reclamar no dan derecho a vender la ropa de otra persona.

### 3.3 Requisitos no funcionales

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-01 | Mostrar una orden en menos de 2 s con hasta 500 órdenes | Parcial: implementado con índices, sin medir en el teléfono |
| RNF-02 | Registrar una orden en menos de 3 s | Parcial: sin medir en el teléfono |
| RNF-03 | Actualizar el saldo en menos de 1 s tras un pago | Parcial: sin medir en el teléfono |
| RNF-04 | Registrar una orden en máximo tres pantallas | Cumple |
| RNF-05 | Confirmar cada operación exitosa; no mostrar éxito si falló | Cumple |
| RNF-06 | Verse bien desde 360 px de ancho | Cumple |
| RNF-07 | Pedir autenticación; desbloqueo con huella si el teléfono la tiene; obligar a cambiar la clave de fábrica (rev. 2) | Cumple |
| RNF-08 | Guardar la contraseña como hash bcrypt, nunca en claro | Cumple |
| RNF-09 | Cerrar sesión a los 15 minutos sin uso y bloquear al volver tras 2 minutos fuera (rev. 2) | Cumple |
| RNF-10 | No permitir órdenes sin clienta | Cumple |
| RNF-11 | No permitir prendas sin orden | Cumple |
| RNF-12 | No permitir pagos de cero o negativos | Cumple |
| RNF-13 | Disponibilidad del 95 % del servidor | Derogado: no hay servidor (D-06) |
| RNF-14 | Acceso desde dos dispositivos en red local | Derogado: un dispositivo por diseño (D-06) |
| RNF-15 | Funcionar en Chrome, Firefox y Edge | Parcial: probado en Edge y Chromium; el objetivo real es el APK |
| RNF-16 | Adaptarse a móvil, tableta y computador | Cumple |
| RNF-17 | Generar una copia de seguridad descargable, cifrada, sin depender de Telegram (rev. 2) | Cumple |
| RNF-18 | Restaurar una copia, con vuelta atrás si falla | Cumple |
| RNF-19 | Registrar los errores en un archivo de eventos | No: solo consola |
| RNF-20 | Separar presentación, lógica y datos | Cumple, con cinco excepciones de lectura simple documentadas |
| RNF-21 | Guardar imágenes en JPG o PNG | Cumple: JPEG |
| RNF-22 | Imágenes de hasta 10 MB | Cumple: se reducen a 1080 px de ancho |
| RNF-23 | Mostrar una foto en menos de 3 s | Parcial: sin medir en el teléfono |
| RNF-24 | Mostrar siluetas de carga mientras llegan los datos | Cumple |
| RNF-25 | Guardar las fotos en el almacenamiento permanente de la app | Cumple |
| RNF-26 | Responsabilidad única por módulo | Cumple |
| RNF-27 | Índices en los campos de búsqueda | Cumple: ocho índices |
| RNF-31 | Avisos locales sin internet | Cumple |

### 3.4 Reglas de negocio

| ID | Regla | Estado |
| --- | --- | --- |
| RN-01 | Una clienta necesita nombre y teléfono para registrarse | Cumple |
| RN-02 | El teléfono no es único: varias clientas pueden compartirlo | Cumple |
| RN-03 | Cada orden pertenece a una sola clienta | Cumple |
| RN-04 | Una orden puede crearse sin prendas; solo es activa con al menos una | Cumple |
| RN-05 | La fecha prometida no puede ser anterior a la de recepción | Cumple |
| RN-06 | La orden pasa sola a *Lista para Entregar* cuando no queda ninguna prenda sin terminar | Cumple |
| RN-07 | Se pueden entregar prendas terminadas aunque falten otras | Cumple |
| RN-08 | Cada prenda entregada queda en estado *Entregada* | Cumple |
| RN-09 | La orden queda *Entregada* cuando todas sus prendas se entregaron | Cumple |
| RN-10 | Con prendas entregadas y otras pendientes, la orden queda según lo que falta: *En Proceso* si falta coser, *Lista* si solo falta entregar (rev. 2) | Cumple |
| RN-11 | Una orden entregada no se cancela | Cumple |
| RN-12 | Una orden cancelada no recibe prendas | Cumple |
| RN-13 | Una orden cancelada no recibe pagos | Cumple |
| RN-14 | Cancelar no borra los pagos | Cumple |
| RN-15 | Solo la modista, con sesión iniciada, reabre una orden | Cumple |
| RN-16 | Reabrir deja la orden *En Proceso* | Cumple |
| RN-17 | Con alguna prenda *Pendiente* o *En Proceso*, la orden está *En Proceso* | Cumple |
| RN-18 | Toda prenda pertenece a una orden | Cumple |
| RN-19 | Toda prenda tiene descripción del arreglo | Cumple |
| RN-20 | El precio de una prenda es mayor que cero | Cumple |
| RN-21 | Una prenda tiene un solo estado a la vez | Cumple |
| RN-22 | Cada foto pertenece a una sola prenda | Cumple |
| RN-23 | Una prenda puede tener varias fotos | Cumple |
| RN-24 | Toda prenda tiene tipo | Cumple |
| RN-25 | Todo pago pertenece a una orden | Cumple |
| RN-26 | Un abono es mayor que cero | Cumple |
| RN-27 | Los abonos no pueden pasar del total de la orden | Cumple |
| RN-28 | Una orden con saldo cero está pagada | Cumple |
| RN-29 | El saldo nunca es negativo | Cumple |
| RN-30 | Una orden entregada puede seguir recibiendo pagos | Cumple |
| RN-31 | El aviso de orden lista solo se ofrece con la orden en *Lista para Entregar* (rev. 2) | Cumple |
| RN-32 | El historial de avisos guarda fecha y hora | Cumple |
| RN-33 | Una orden no entra más de una vez por día en los recordatorios (rev. 2) | Cumple |
| RN-34 | Recibos y avisos usan los datos actuales de la orden | Cumple |
| RN-35 | Todo cambio en una orden queda en su historial | Cumple |
| RN-36 | La fecha y hora de entrega se registran solas | Cumple |
| RN-37 | Una orden lista es "sin reclamar" tras más de N días (30) desde la fecha más tardía entre la prometida y la de quedar lista (rev. 2) | Cumple |
| RN-38 | Una orden es próxima a vencer si su fecha prometida cae en el periodo de anticipación configurado | Cumple |
| RN-39 | Las notas de una prenda duran lo que dure la prenda | Cumple |
| RN-40 | Borrar una foto no borra la prenda | Cumple |

## 4. Cambios frente a la especificación original

| Requisito | Antes | Ahora | Por qué |
| --- | --- | --- | --- |
| RF-39, RF-40, RN-31 | Avisos automáticos al cliente | La app prepara el mensaje y la modista lo envía por WhatsApp; los recordatorios le llegan a ella por Telegram | La API de WhatsApp cobra por mensaje y un envío automático no deja revisar el texto (D-03) |
| RF-42, RN-34 | Resumen al cliente por Telegram | Recibo compartido por WhatsApp; Telegram solo para la modista | Las clientas usan WhatsApp, no Telegram (D-03) |
| RF-01, RF-DAT | Nombre y teléfono | Además, autorización con fecha y versión del aviso, y borrado a pedido | Ley 1581 de 2012 (D-08) |
| RF-REC-01, RF-42 | Recibo con lo básico | Celular, dirección, garantía y condiciones | Ley 1480 art. 18 (D-09) |
| RF-05, RN-05 | Fecha de creación | Fecha de recepción, que puede ser anterior | Trabajos recibidos antes de empezar a usar la app |
| RF-24, RN-06, RN-10 | Lista cuando todas estén *Terminada*; con entregas parciales, conservar el estado | El estado se deriva de todas las prendas: las entregadas cuentan como terminadas | La regla original contradecía RN-17 (D-10) |
| RF-34 | Cuatro medios de pago | Se agregó Bre-B | Transferencias inmediatas sin costo del Banco de la República |
| RF-35, RF-OP-01 | Pagos sin corrección | Los pagos se anulan con motivo, nunca se borran | No perder el rastro del dinero |
| RF-47, RN-37 | 30 días en *Lista* | Desde la fecha más tardía entre la prometida y la de quedar lista; es una alerta, no abandono legal | No contarle al cliente días antes de lo prometido; Ley 1480 |
| RNF-07, RNF-09 | Usuario y contraseña; 15 minutos | Además, huella, clave de fábrica obligatoria y bloqueo al volver | La clave de fábrica era igual en todas las instalaciones (D-12) |
| RNF-13, RNF-14 | Servidor en red local | Derogados | Offline-first en un solo teléfono (D-06) |
| RNF-17 | Archivo descargable | Archivo cifrado por Compartir, o por Telegram | Que la copia no dependa de Telegram |

## 5. Pendientes

| Pendiente | Qué falta | Afecta |
| --- | --- | --- |
| Buscar prendas | El buscador global no busca prendas | RF-70 |
| Medir tiempos | Medir en el teléfono de la dueña con 500 órdenes | RNF-01, RNF-02, RNF-03, RNF-23 |
| Archivo de errores | Guardar los errores en un archivo para poder diagnosticar en el taller | RNF-19 |
| Prueba en el teléfono real | Cámara, huella, aviso de las 8:00 y WhatsApp en el teléfono de la dueña | P-06 de DECISIONES.md |
