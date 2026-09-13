# Matriz de Trazabilidad · Atelier Manager

Correspondencia entre los requisitos especificados y el código que los implementa. Cada fila se verificó contra `src/`, no contra la intención original.

> **Revisión:** 13 de septiembre de 2026 · versión 1.1.2 · esquema 2
> **Suite de pruebas:** 133 en verde, 0 omitidas

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
| RF-24 · orden a "Lista" automática | ✅ | `updateEstadoPrenda` |
| RF-27 a RF-30, RF-32 · fotografías | ✅ | `services/photoStorage.js`, `components/prendas/PrendaCard.vue` |

### Pagos · RF-33 a RF-38

| Req. | Estado | Dónde vive |
| --- | --- | --- |
| RF-33 a RF-35, RF-37 | ✅ | `composables/usePagos.js`, `database/queries/pagos.js` |
| RF-36 · saldo automático | ✅ | Cada escritura recalcula `saldo_pendiente = SUM(prenda.valor) − SUM(pago.valor)`; la migración 2 reparó los saldos acumulados por diferencias. RN-29: `validateValorPrendaContraPagos` impide bajar un precio por debajo de lo pagado · con pruebas sobre SQLite real |
| RF-38 · estado de pago al llegar a cero | ❌ | No existe campo ni transición. El saldo se muestra, pero no cambia el estado de la orden |

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
| RF-43 · próximas a vencer | ⚠️ | Funciona, pero el umbral de 3 días está escrito a mano en `AppHeader.vue`. La clave `dias_anticipacion_vencer` de `configuracion` existe y **nadie la lee** |
| RF-47 · sin reclamar más de 30 días | ⚠️ | Igual: el 30 está dentro del SQL y `dias_sin_reclamar` no se consulta |

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
| P1-9 | Deslizar para eliminar una prenda o un pago **no elimina nada**: sólo muestra «Pago eliminado y saldo recalculado». Pendiente de decidir si un pago puede borrarse (RN-14, RN-35) o sólo anularse con rastro | `composables/useOrdenModals.js` |

**Cerrados en la revisión del 13 de septiembre:** P1-4 (saldo por diferencias; ahora recalculado y con confirmación al entregar con deuda, que RN-30 permite) y el falso cambio de estado `#undefined` que se registraba en el historial al editar una prenda.

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
