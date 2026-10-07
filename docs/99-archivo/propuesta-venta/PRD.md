# PRD propuesto para taller y catálogo de prendas

Estado: borrador de análisis, pendiente de confirmar número de talleres y forma de compra. Fecha: 6 de octubre de 2026. No es un compromiso de entrega ni una arquitectura aprobada.

**Contexto confirmado por el usuario:** Florencia, departamento del Caquetá, Colombia. Disponibilidad declarada: 20 jornadas de hasta 12 horas diarias, equivalentes a un máximo de 240 horas por persona. No se ha fijado una fecha de inicio ni confirmado cuántas personas desarrollarán el proyecto. Zona horaria: America/Bogota; precios del piloto en pesos colombianos (COP).

## 1. Resumen Ejecutivo

**Problema:** el taller necesita gestionar arreglos y ofrecer prendas nuevas o usadas que pueda vender legítimamente. La app actual tiene fallos y diferencias con los documentos; su base local no hace accesible un catálogo a compradores de internet.

**Solución propuesta:** conservar y corregir la gestión del taller; añadir preparación de productos y una web pública con fotos, información, disponibilidad y solicitudes de reserva. El taller confirma pago y entrega en el escenario de menor alcance. La compra con pasarela es una variante pendiente de decisión.

**Métrica de éxito del piloto:** completar los flujos de arreglo, publicación, reserva y venta con evidencia de pruebas; no vender una misma unidad dos veces ni publicar información privada del cliente original.

## 2. Usuarios y Personas

- **Modista o responsable del taller:** registra clientes, arreglos, prendas, pagos y entregas; prepara productos y gestiona ventas.
- **Cliente del arreglo:** dueño de la prenda original. No se debe confundir con su futuro comprador.
- **Comprador:** consulta la web y solicita adquirir una prenda.
- **Administrador:** controla publicaciones, permisos, incidencias y políticas. En un piloto de un taller puede ser la misma persona que la modista.

## 3. Alcance del Proyecto

### Dentro del Alcance propuesto para un MVP de 20 jornadas

- Corregir los fallos prioritarios de la auditoría y acordar estados, entregas con deuda, sesiones y respaldo.
- Registrar productos nuevos/usados con origen, talla, medidas, condición, defectos, precio, moneda y fotos seleccionadas para publicación.
- Separar prendas no reclamadas de productos habilitados para venta.
- Registrar y revisar el fundamento que permite comercializar cada producto.
- Publicar, pausar y retirar productos desde un panel autorizado.
- Mostrar catálogo y detalle público adaptable a teléfono y computador, con búsqueda y filtros básicos.
- Solicitar reserva; confirmar disponibilidad en servidor; registrar pago verificado y entrega/recogida.
- Separar ingresos por arreglos e ingresos por ventas, conservando la trazabilidad.
- Actualizar requisitos, diagramas, manual y pruebas contra los flujos aceptados.

El cálculo del plazo toma como escenario **un taller, un desarrollador dedicado con experiencia, la base existente y reservas con pago coordinado con el taller**. Este escenario es una propuesta para estimar, no una elección confirmada del usuario. Si se requieren varias tiendas, checkout, logística integrada o reconstrucción desde cero, se debe volver a estimar.

### Fuera de ese escenario de 20 días

- Portal completo de múltiples vendedores, comisiones, liquidaciones y disputas.
- Envíos automáticos y conexión con transportadoras.
- Carrito de varias unidades, cupones y promociones.
- Impresoras Bluetooth, certificación iOS y garantía de todos los objetivos de escala del documento original.
- Sincronización bidireccional completa de todas las tablas del taller entre varios dispositivos.

La pasarela queda **pendiente de decisión**, no descartada por el usuario. No se han contratado servicios ni seleccionado proveedores.

## 4. Requerimientos Funcionales

Se utiliza el prefijo RF-VEN para evitar las colisiones RF-50/RNF-24 detectadas en los documentos anteriores.

| ID | Requerimiento | Prioridad | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-VEN-01 | Clasificar el producto como nuevo o usado y registrar su origen. | Alta | La ficha muestra condición y defectos; no infiere condición nueva por estar en buen estado. |
| RF-VEN-02 | Registrar el derecho de comercialización y su evidencia privada. | Alta | Una persona autorizada revisa el fundamento; el mero impago o falta de recogida no habilita publicar. |
| RF-VEN-03 | Crear un borrador de producto desde una prenda del taller o desde inventario propio. | Alta | La referencia al arreglo es interna y no se muestra en la web. |
| RF-VEN-04 | Publicar fotos, título, descripción, talla/medidas, condición, defectos, precio y moneda. | Alta | La publicación se rechaza si faltan datos requeridos, fotos o habilitación vigente. |
| RF-VEN-05 | Permitir catálogo y detalle público con filtros por condición y talla. | Alta | Visitantes ven únicamente productos publicados y disponibles. |
| RF-VEN-06 | Crear una reserva para una unidad disponible. | Alta | Dos solicitudes simultáneas no consiguen reservar la misma unidad; la segunda recibe conflicto. |
| RF-VEN-07 | Vencer/cancelar reservas y devolver disponibilidad cuando corresponda. | Alta | Se registra la fecha de vencimiento y el catálogo refleja el estado real. |
| RF-VEN-08 | Confirmar venta tras verificar el pago y registrar recogida/entrega. | Alta | Un enlace a WhatsApp o una solicitud de reserva no cuenta como venta pagada. |
| RF-VEN-09 | Separar el registro de venta del saldo del arreglo original. | Alta | Una venta no elimina deudas ni abonos del arreglo; cualquier ajuste se registra por separado. |
| RF-VEN-10 | Pausar o retirar una publicación si se cuestiona el derecho de venta. | Alta | Se impiden nuevas reservas y se gestiona explícitamente cualquier reserva vigente. |
| RF-VEN-11 | Mostrar identidad/contacto del vendedor y condiciones de compra, entrega, garantía y devoluciones aplicables. | Alta | El comprador conoce las condiciones antes de confirmar su solicitud. |
| RF-VEN-12 | Conservar historial de publicación, reserva, pago, venta y entrega. | Alta | Cada cambio guarda fecha y responsable; se pueden investigar discrepancias. |

### Historias de usuario del análisis

- **HU-VEN-01:** Como modista, quiero preparar una prenda que puedo comercializar, para publicarla con su condición real sin exponer los datos del dueño original.
- **HU-VEN-02:** Como comprador, quiero ver fotografías, medidas y defectos, para evaluar una prenda nueva o usada antes de reservarla.
- **HU-VEN-03:** Como taller, quiero confirmar disponibilidad y pago, para evitar ventas duplicadas y mantener mis cuentas claras.
- **HU-VEN-04:** Como administrador, quiero bloquear una publicación sin fundamento válido de venta, para gestionar una reclamación sin continuar ofreciendo el producto.

### Reglas de negocio

1. Una prenda no reclamada, una deuda del arreglo y un producto vendible son tres situaciones distintas.
2. El tiempo transcurrido puede activar seguimiento y avisos; no transfiere automáticamente propiedad ni permisos de venta.
3. La habilitación debe responder a un fundamento válido: propiedad acreditada, encargo de venta válido u otro título revisado para el país de operación. Una casilla marcada por el taller no basta para crear ese derecho.
4. El estado del arreglo se conserva. Se añade un ciclo comercial independiente: borrador → publicado → reservado → vendido; también pausa, retiro y vencimiento de reserva.
5. Una unidad admite una sola reserva vigente y una sola venta confirmada. El servidor decide disponibilidad, no una copia offline.
6. Las fotos públicas son una selección expresa; las fotos de reparación pueden contener personas, etiquetas o datos privados y no se publican automáticamente.
7. El precio de venta es independiente del costo del arreglo y se conserva al reservar. Un cambio posterior no altera retroactivamente una reserva aceptada.

## 5. Requerimientos No Funcionales

- **RNF-VEN-01 — Integridad:** operaciones de reserva/venta atómicas e idempotentes; no duplicar una reserva por reintentos de red.
- **RNF-VEN-02 — Privacidad:** excluir de las respuestas públicas dueño original, teléfono, dirección, observaciones privadas, deuda y evidencia de autorización. Definir consentimiento, conservación y acceso a los datos de compradores antes de producción.
- **RNF-VEN-03 — Seguridad:** los cambios comerciales requieren identidad y permisos comprobados por el servidor. Mecanismo de autenticación pendiente de definición; no reutilizar un objeto local `auth_user` como acreditación del servidor.
- **RNF-VEN-04 — Conectividad:** el taller puede conservar sus operaciones locales previstas; publicar, reservar y confirmar ventas requiere internet. Un fallo de red no debe mostrarse como publicación o venta exitosa.
- **RNF-VEN-05 — Recuperación:** probar respaldos de base, imágenes y referencias en un entorno limpio.
- **RNF-VEN-06 — Calidad:** pruebas de flujos, concurrencia, aislamiento de datos, precios, recuperación y dispositivos objetivo. Los requisitos de velocidad/capacidad se fijarán con volumen y entorno de prueba, sin prometer cifras sin medirlas.

## 6. Suposiciones y Decisiones Propuestas

Confirmado: operación en Florencia, Caquetá, Colombia; 20 jornadas con hasta 12 horas diarias disponibles. Pendiente de respuesta: un taller o varios, reserva/pago directo o checkout con pasarela, forma de entrega, equipo desarrollador, fecha de inicio y presupuesto de infraestructura.

El análisis conceptual de ARQUITECTURA.md y el contrato de borrador no autorizan elegir infraestructura, tratar datos reales ni desplegar el sistema. Se deben cerrar privacidad, autenticación, forma de adquisición y costos antes de finalizar el diseño.

### Consideración para Colombia y el piloto en Florencia

La SIC explica que el abandono de bienes recibidos para prestar un servicio **no convierte al prestador en propietario**. Por eso la frase actual de fase 2 «más de 30 días ... para incautarlas y ponerlas a la venta» debe reemplazarse por seguimiento de bienes no reclamados y verificación del derecho de comercialización. El flujo legal aplicable debe revisarse para el caso real; no se puede convertir automáticamente una deuda en autorización de venta. [SIC, disposición de bienes abandonados](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/disposicion-de-los-bienes-abandonados-bajo-la-prestacion-de-un-servicio), [Decreto 1413 de 2018, Función Pública](https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=87866).

### Viabilidad del plazo

**20 jornadas de hasta 12 horas ofrecen un presupuesto máximo de 240 horas por persona. Es un escenario posible para un MVP acotado sobre la base actual, con riesgo relevante; no permite asegurar que todos los documentos originales, con sus contradicciones y funciones futuras, queden implementados al 100 %.** La disponibilidad horaria no equivale a 240 horas de programación efectiva. Hacerlo desde cero, añadir varios vendedores o incorporar pagos en línea requiere otra estimación.

Se propone planificar **200 horas de actividades y 40 horas de margen**, distribuidas durante las 20 jornadas. El margen cubre bloqueos, retrabajo e imprevistos; no añade funcionalidades al alcance. Las horas siguientes son una distribución inicial, no mediciones ni tiempos garantizados.

| Jornadas | Horas previstas | Resultado previsto | Condición de salida |
| --- | --- | --- | --- |
| 1–2 | 20 | Análisis y versión acordada de requisitos/diagramas. | Decisiones críticas resueltas y matriz requisito → pantalla → prueba. |
| 3–7 | 50 | Correcciones prioritarias del taller. | Estados, contabilidad, sesiones y operaciones sin falsos éxitos verificadas; alcance del respaldo verificado. |
| 8–10 | 30 | Modelo comercial, API y panel básico. | Permisos, imágenes y disponibilidad funcionando en entorno de pruebas. |
| 11–13 | 30 | Catálogo y ficha pública. | Información completa y datos privados excluidos. |
| 14–15 | 20 | Reserva y confirmación de venta. | Concurrencia, vencimiento y pago confirmado verificados. |
| 16–17 | 20 | Integración y documentación. | Flujos app–web completos y manual/diagramas alineados. |
| 18–20 | 30 | Pruebas y piloto. | Ensayo con modista y compradores; incidencias críticas cerradas. |
| Durante las 20 jornadas | 40 | Margen para imprevistos. | Usarlo para cumplir el alcance, no para ampliar funciones. |
| **Total máximo** | **240** | **200 horas planificadas y 40 de margen.** | **Reestimar si no se cumplen las condiciones de salida.** |

Al finalizar la jornada 2 se debe revisar la estimación contra el alcance acordado. Al finalizar la jornada 7 se debe comprobar si el núcleo del taller está estable; si no, reducir funciones comerciales o ampliar el plazo antes de continuar. Dominio, hosting, cuentas y catálogo de prueba deben estar disponibles a tiempo; aquí no se comprometen gastos. La recogida en el taller de Florencia es una opción para el piloto, pendiente de confirmar; no se presuponen envíos nacionales.

### Actualización de la documentación existente

| Documento | Cambio necesario cuando se apruebe el alcance |
| --- | --- |
| Costura.md / Costura.docx | Añadir compradores, catálogo, reservas, venta habilitada y límites de conectividad; resolver los requisitos de servidor/red local y entrega con deuda. |
| COSTURA_FASE2_REQUISITOS.md | Sustituir la regla de incautación automática y completar bodega, publicación y venta; renumerar IDs repetidos. |
| DIAGRAMAS.md | Separar estados de arreglo y estados comerciales; ampliar actores, ER, arquitectura y secuencias. |
| FICHA_TECNICA.md | Documentar el servicio web compartido, almacenamiento de fotos públicas y mecanismos aprobados de seguridad. |
| MANUAL_USUARIO.md | Explicar habilitación, preparación de fotos, publicación, reserva, pago, entrega y retiro; ajustar los formularios reales. |
| Auditoría y pruebas | Vincular cada corrección y nueva función a un criterio verificable. |

Estos cambios son propuestas; este turno no reescribe los documentos originales ni implementa la ampliación.
