# Matriz de Trazabilidad · Atelier Manager

Correspondencia entre los requisitos especificados y el código que los implementa. Cada fila se verificó contra `src/`, no contra la intención original.

> **Revisión:** 13 de septiembre de 2026 · versión 1.1.2 · esquema 4
> **Suite de pruebas:** 201 en verde, 0 omitidas

Leyenda: ✅ implementado y verificado · ⚠️ implementado con salvedades · ❌ no implementado · 🚧 planificado

---

## Fase 1 · Requisitos funcionales

### Gestión de clientes · RF-01 a RF-04

| Req. | Estado | Dónde vive |
| --- | --- | --- |
| RF-01 a RF-04 | ✅ | `views/ClientesView.vue`, `views/ClienteDetailView.vue`, `composables/useClientes.js`, `database/queries/clientes.js` |

### Órdenes de trabajo · RF-05 a RF-16, RF-49

| Req. | Estado | Dónde vive |
| --- | --- | --- |
| RF-05 a RF-11, RF-15, RF-16 | ✅ | `views/OrdenesView.vue`, `views/OrdenDetailView.vue`, `composables/useOrdenes.js`, `database/queries/ordenes.js` |
| RF-12 · no cancelar entregadas | ✅ | `validators.validateOrdenAccionPermitida` · con pruebas |
| RF-13 · reabrir entregadas | ✅ | `validators.validateOrdenAccionPermitida` · con pruebas |
| RF-14 · registrar la reapertura | ✅ | `changeEstado` inserta `historial_actividad` tipo 7 |
| RF-49 · buscar por nombre de cliente | ✅ | `database/queries/search.js` |

### Prendas · RF-17 a RF-32

| Req. | Estado | Dónde vive |
| --- | --- | --- |
| RF-17 a RF-22, RF-25, RF-26, RF-31 | ✅ | `composables/usePrendas.js`, `database/queries/prendas.js` |
| RF-23 · total automático | ✅ | `createPrenda` y `updatePrenda` recalculan `valor_total` desde `SUM(prenda.valor)` en la misma transacción (`queries/saldo.js`) · con pruebas sobre SQLite real |
| RF-24 · orden a "Lista" automática | ✅ | `services/estadoOrden.js` deriva el estado de la orden de sus prendas (RN-04, RN-06, RN-09, RN-17) y `queries/estadoOrden.js` lo aplica en la misma transacción al crear, cambiar o eliminar una prenda · con pruebas sobre SQLite real de CP-18, CP-19, CP-22, CP-46 y CP-47 |
| RF-27 a RF-30, RF-32 · fotografías | ✅ | `services/photoStorage.js`, `components/prendas/PrendaCard.vue` |

### Pagos · RF-33 a RF-38

| Req. | Estado | Dónde vive |
| --- | --- | --- |
| RF-33 a RF-35, RF-37 | ✅ | `composables/usePagos.js`, `database/queries/pagos.js` |
| RF-36 · saldo automático | ✅ | Cada escritura recalcula `saldo_pendiente = SUM(prenda.valor) − SUM(pago.valor)`; la migración 2 reparó los saldos acumulados por diferencias. RN-29: `validateValorPrendaContraPagos` impide bajar un precio por debajo de lo pagado · con pruebas sobre SQLite real |
| RF-38 · estado de pago al llegar a cero | ✅ | `estadoDePago` en `services/estadoOrden.js` (RN-28, HU-37). Se **deriva** del saldo al leer, sin columna propia: el saldo ya se recalcula en cada escritura y una segunda copia podría descuadrarse. Se muestra como *Pagada* o *Pendiente* en el detalle y en la tarjeta de la orden · con pruebas de CP-77 y CP-78 |

### Notificaciones · RF-39 a RF-42

| Req. | Estado | Dónde vive |
| --- | --- | --- |
| RF-39, RF-40 · aviso automático al cliente | ⚠️ | Se registra una fila en `notificacion`, pero **nada sale del teléfono**. El aviso real depende de que la modista toque el enlace `wa.me`. No hay envío automático |
| RF-41 · historial de notificaciones | ✅ | `database/queries/notificaciones.js` |
| RF-42 · resumen por Telegram | ✅ | `composables/useTelegramReports.js` |

### Reportes y seguimiento · RF-43 a RF-48

| Req. | Estado | Dónde vive |
| --- | --- | --- |
| RF-44, RF-45, RF-46, RF-48 | ✅ | `database/queries/reportes.js`, `views/ReportesView.vue` |
| RF-43 · próximas a vencer | ✅ | `clasificarVencimiento` en `services/vencimientos.js` (RN-38). Los días se leen de `dias_anticipacion_vencer` y se cambian en **Ajustes → Aviso de entregas próximas** (0 a 30). Sólo cuentan órdenes activas (RN-04) |
| RF-47 · sin reclamar más de 30 días | ⚠️ | El 30 está dentro del SQL y `dias_sin_reclamar` no se consulta. Además **mide mal**: cuenta desde la fecha estimada de entrega y RN-37 pide contar desde que la orden entró en *Lista para Entregar*. Ver P1-11 |

### Valor añadido de Fase 1

| Req. | Estado | Dónde vive |
| --- | --- | --- |
| RF-50 · autocompletado de descripciones | ✅ | `getDescripcionesFrecuentes` en `database/queries/prendas.js` |

---

## Fase 1 · Requisitos no funcionales

| Req. | Estado | Nota |
| --- | --- | --- |
| RNF-01 a RNF-03 · rendimiento | ⚠️ | Los índices están creados. `getPrendasByOrden` hace N+1: dos consultas adicionales por prenda. Ver P1-8 |
| RNF-04 a RNF-06 · usabilidad | ✅ | Registro de orden en tres pantallas; confirmaciones por toast; diseño desde 360 px |
| RNF-07 · autenticación | ✅ | `services/auth.js` + guardia del router |
| RNF-08 · contraseñas cifradas | ✅ | bcrypt con salt 10. **Cambio obligatorio** de la clave de fábrica en el primer acceso |
| RNF-09 · cierre por inactividad | ✅ | 15 minutos, más bloqueo al reanudar tras 2 minutos en segundo plano |
| RNF-10 a RNF-12 · integridad | ✅ | `validators.js`, con pruebas para cada regla |
| RNF-13 · disponibilidad del servidor | ⛔ | **Derogado.** No hay servidor: la arquitectura es offline-first en un solo dispositivo |
| RNF-14 · dos dispositivos en red local | ⛔ | **Derogado.** Incompatible con la arquitectura elegida. Requeriría sincronización, que no está en el alcance |
| RNF-15 · navegadores de escritorio | ⚠️ | Funciona en modo desarrollo. El objetivo real es el APK; el soporte de escritorio no se prueba en CI |
| RNF-16 · adaptable a móvil y tableta | ✅ | |
| RNF-17 · copia de seguridad descargable | ⚠️ | El respaldo es completo y cifrado, pero **el único destino es Telegram**. Sin bot configurado no hay copia posible. Falta una vía local |
| RNF-18 · restauración | ✅ | Con instantánea previa y rollback automático |
| RNF-19 · registro de errores en archivo | ❌ | Sólo `console.error`, ilegible en un APK de producción. Sin telemetría no hay diagnóstico posible en el taller |
| RNF-20 · separación de capas | ✅ | Cuatro capas. Dos excepciones conocidas, listadas abajo |
| RNF-21 a RNF-23 · imágenes | ✅ | JPEG a calidad 60, ancho 1080, en `Directory.Data` |
| RNF-24 · skeleton loaders | ✅ | `components/common/SkeletonLoader.vue` |
| RNF-25 · fotos en almacenamiento permanente | ✅ | Se guardan por **nombre de archivo**, no por ruta absoluta: así sobreviven a una reinstalación |
| RNF-26 · responsabilidad única | ✅ | |
| RNF-27 · índices en la base | ✅ | Ocho índices |

---

## Fase 2 · Pendiente

> **Renumerada.** La especificación original usaba RF-50 y RNF-24 a RNF-27, que ya estaban ocupados por el documento de mejoras de Fase 1. Se desplazó a RF-61 y RNF-28 para que la matriz sea unívoca. La correspondencia está en [COSTURA_FASE2_REQUISITOS.md](COSTURA_FASE2_REQUISITOS.md).

| Req. | Antes | Descripción | Estado |
| --- | --- | --- | --- |
| RF-61 a RF-63 | RF-50 a RF-52 | Bodega: archivar y vender prendas abandonadas | 🚧 |
| RF-64, RF-65 | RF-53, RF-54 | Exportar reportes a Excel y PDF | 🚧 |
| RF-66, RF-67 | RF-55, RF-56 | Impresión térmica ESC/POS por Bluetooth | 🚧 |
| RF-68 | RF-57 | Notificación local con órdenes próximas a vencer | ✅ **hecho** |
| RF-69 | RF-58 | Hora configurable del aviso diario | 🚧 · fija a las 8:00 |
| RF-70 | RF-59 | Buscador global | ✅ **hecho** · en el panel de inicio |
| RF-71 | RF-60 | Modo claro y oscuro | 🚧 |
| RNF-28 a RNF-31 | RNF-24 a RNF-27 | Paginación, ESC/POS, contraste WCAG, autonomía | 🚧 · salvo la autonomía, ya cumplida |

---

## Defectos conocidos abiertos

Ninguno impide publicar ni pone datos en riesgo.

| Id | Defecto | Dónde |
| --- | --- | --- |
| P1-3 | Recargar en una ruta profunda deja la pantalla en blanco: `base: './'` con `createWebHistory` | `vite.config.js`, `router/index.js` |
| P1-6 | Las transiciones entre vistas nunca se activan: el `watch` observa el objeto `route` completo, así que `to` y `from` son la misma referencia | `App.vue` |
| P1-7 | Alarmas exactas sin comprobar el permiso en Android 13+ | `useNotificacionesLocales.js` |
| P1-8 | N+1 al cargar el detalle de una orden | `queries/prendas.js` |
| P1-11 | RN-37 · "sin reclamar" cuenta desde la fecha estimada y no desde la entrada en *Lista para Entregar*; los 30 días no son configurables | `queries/reportes.js` |
| P1-12 | HU-36 · no hay una vista de órdenes con saldo pendiente; sólo la cifra total en el panel | `views/OrdenesView.vue` |
| P1-13 | Los distintivos de estado del panel usan un mapa desplazado en uno (4 se pinta como *Lista*, 5 como *Entregada*); el texto es correcto, el color no | `views/DashboardView.vue` |
| P1-14 | Si cambiar el estado de una prenda falla por algo distinto de CP-18, el selector sigue mostrando el valor elegido hasta recargar | `components/prendas/PrendaCard.vue` |

**Cerrados en la revisión del 13 de septiembre:**

- **P1-4** · saldo por diferencias. Ahora se recalcula en cada escritura, con confirmación al entregar con deuda, que RN-30 permite.
- **P1-9** · deslizar para eliminar no hacía nada y aun así mostraba «Pago eliminado y saldo recalculado». Decisión: **un pago nunca se borra, se anula** con fecha y motivo (`pago.anulado_en`, `pago.motivo_anulacion`, migración 3). Deja de contar en el saldo y en los ingresos de reportes, y queda en el historial (tipo 8) según RN-14 y RN-35. **Una prenda sí se elimina**, con sus fotos y observaciones y registro en el historial (tipo 9), salvo si la orden está entregada o cancelada, si la prenda ya se entregó, o si el total quedaría por debajo de lo pagado (RN-29).
- El falso cambio de estado `#undefined` que se registraba en el historial al editar una prenda.
- El modal de confirmación decía «Sí, Notificar» para cualquier acción, incluida la de entregar con saldo.
- **RN-16** · reabrir dejaba la orden en *Pendiente*; ahora vuelve a *En Proceso* (HU-09, CP-22).
- **RN-17** · nada asignaba nunca *En Proceso*, y los botones *Iniciar Proceso* y *Marcar Lista* permitían estados que contradecían a las prendas. Se quitaron: el estado se deriva de las prendas en cada cambio (HU-23, CP-46, CP-47). A mano sólo quedan *Entregar* (únicamente desde *Lista para Entregar*), *Cancelar* y *Reabrir*. La migración 4 ajustó las órdenes abiertas existentes y lo dejó en su historial.
- **P1-10** · eliminar la última prenda pendiente ahora deja la orden *Lista para Entregar*, y eliminar la última prenda la devuelve a *Pendiente*.
- **CP-18** · la entrega de una prenda sin terminar sólo la bloqueaba la pantalla; ahora también la regla de negocio (`validateCambioEstadoPrenda`).
- **RN-04** · las órdenes sin prendas contaban como activas, atrasadas, próximas entregas, avisos de la campana, recordatorios de las 8:00 y resumen de Telegram. Ahora sólo cuentan *En Proceso* y *Lista para Entregar*, desde una única definición (`ESTADOS_ORDEN_ACTIVA`) que comparten la pantalla y el SQL (`condicionOrdenActiva`). Siguen apareciendo en el listado, con el aviso «Sin prendas».
- **RN-28** · no existía el concepto de orden pagada. Ver RF-38.
- **RN-38** · el período de anticipación era un 3 escrito en `AppHeader.vue`. Ver RF-43.
- El resumen diario de Telegram filtraba las atrasadas por `o.fecha_entrega`, una columna que no existe: informaba siempre cero atrasadas.

### Excepciones a la separación de capas

Dos sitios saltan de la presentación a la capa de datos sin pasar por su composable, que existe:

- `views/ReportesView.vue` importa `queries/reportes.js` en vez de usar `useReportes.js`
- `components/ordenes/OrdenForm.vue` importa `queries/clientes.js` en vez de usar `useClientes.js`

---

## Documentos relacionados

| Documento | Contenido |
| --- | --- |
| [Costura.md](Costura.md) | Especificación original de Fase 1: RF, RNF e historias de usuario |
| [DIAGRAMAS.md](DIAGRAMAS.md) | Planos del sistema, regenerados desde el código |
| [MEJORAS_ADICIONALES_FASE1.md](MEJORAS_ADICIONALES_FASE1.md) | Valor añadido sobre la especificación original |
| [COSTURA_FASE2_REQUISITOS.md](COSTURA_FASE2_REQUISITOS.md) | Alcance de la siguiente etapa |
| [../FICHA_TECNICA.md](../FICHA_TECNICA.md) | Resumen técnico y de despliegue |
| [../MANUAL_USUARIO.md](../MANUAL_USUARIO.md) | Guía operativa para el taller |
