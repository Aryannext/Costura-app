# Revisión de diagramas

**20 vigentes y 10 históricos generados sin error con Mermaid CLI.** Las cuatro láminas contacto se inspeccionaron visualmente; el texto fuente vigente se contrastó con código. Sintaxis aprobada no equivale a semántica completa. Los PNG son evidencias de esta revisión, no sustituyen los originales.

[Galería vigente](diagramas/renderizado.md) · [Galería histórica](diagramas/historicos-render.md) · [Fuentes vigentes](diagramas/fuentes.md)

| ID / imagen | Fuente y ubicación | Evaluación |
| --- | --- | --- |
| [DG-01](diagramas/renderizado-1.png) | docs/02-diseno/ARQUITECTURA.md:42 · 3. Vista de capas | Capas legibles a tamaño original. H13: faltan P→D, auth→queries y auth→router; H30: aclarar recursos de red. No describe dependencias unidireccionales estrictas. |
| [DG-02](diagramas/renderizado-2.png) | docs/02-diseno/ARQUITECTURA.md:165 · 6. Arranque y migraciones | Arranque y migraciones: estructura plausible por lectura de connection/migrationRunner. Es alto (1385 px); separar inicialización, versiones y fallos para una página. No se ejecutó migración desde todas las versiones en esta revisión. |
| [DG-03](diagramas/renderizado-3.png) | docs/02-diseno/ARQUITECTURA.md:205 · 7. Despliegue | Despliegue distingue APK local y web estática: correcto para alcance. Conservar P-07 como pendiente, no presentar VPS como despliegue verificado. Aclarar apertura de WhatsApp en teléfono de la modista, no envío directo al dispositivo cliente. |
| [DG-04](diagramas/renderizado-4.png) | docs/02-diseno/CASOS_DE_USO.md:28 · 2.1 Modista · Acceso y seguridad | Acceso: primer cambio de clave es obligatorio bajo su condición. La biometría depende de hardware/plataforma. Añadir límite del sistema y diferenciar entrar de desbloquear para sustentación formal. |
| [DG-05](diagramas/renderizado-5.png) | docs/02-diseno/CASOS_DE_USO.md:53 · 2.2 Modista · Clientes y datos personales | Clientes: H01/H04. Modista registra autorización manifestada por clienta; no es ella quien acepta en nombre del titular. Borrado no abarca automáticamente todo texto/foto/copia. |
| [DG-06](diagramas/renderizado-6.png) | docs/02-diseno/CASOS_DE_USO.md:82 · 2.3 Modista · Órdenes y prendas | Órdenes/prendas: H09/H11. Confirmación de deuda está enlazada a entrega global; entrega individual necesita la misma revisión. Diagrama conceptual no explica todas las guardas. |
| [DG-07](diagramas/renderizado-7.png) | docs/02-diseno/CASOS_DE_USO.md:121 · 2.4 Modista · Cobros y consultas | Cobros/consultas: H20/H21/H23/H24. Separar anulación de devolución y describir filtros del reporte. Vista clara como inventario de funciones. |
| [DG-08](diagramas/renderizado-8.png) | docs/02-diseno/CASOS_DE_USO.md:146 · 2.5 Modista · Comunicación | Comunicación: distinguir destinatario final, aplicación externa y modista. Preparar enlace no confirma recepción. H03/H18/H19. |
| [DG-09](diagramas/renderizado-9.png) | docs/02-diseno/CASOS_DE_USO.md:182 · 2.6 Modista · Configuración y copia de seguridad | Configuración/respaldo: demasiado alto para página conjunta (1280 px). Dividir negocio/seguridad y respaldo/Telegram. H05/H06: aclarar copia sin fotos y recuperación parcial. |
| [DG-10](diagramas/renderizado-10.png) | docs/02-diseno/CASOS_DE_USO.md:219 · 2.7 Reloj del sistema | Reloj: alarmas son eventos programados; atrasadas y sin reclamar son clasificaciones calculadas al consultar, no necesariamente tareas en segundo plano. H12: bloqueo depende también de estado previo. |
| [DG-11](diagramas/renderizado-11.png) | docs/02-diseno/CASOS_DE_USO.md:357 · 4. Flujo del negocio | Flujo completo: 3596 px de alto; ilegible al reducirlo a una hoja. Dividir recepción, trabajo y entrega/cobro. Es flujo habitual: omite corrección, cancelación, entrega parcial, negativa/no uso de WhatsApp y recepción provisional pendiente H28. |
| [DG-12](diagramas/renderizado-12.png) | docs/02-diseno/CLASES.md:12 · 1. Modelo del dominio | Clases: modelo conceptual declarado correctamente, sin clases JS reales. Atributos date/decimal no son tipos SQLite; métodos sin firma son inventario de operaciones. Separar núcleo y catálogos; no confundir composición conceptual con cascade físico. |
| [DG-13](diagramas/renderizado-13.png) | docs/02-diseno/COMPORTAMIENTO.md:13 · 1. Navegación | Navegación: once rutas localizadas. Enlaces de Dashboard son accesos, no todas las rutas posibles. Falta overlay de bloqueo, que no necesita una ruta nueva. No tomar el dibujo como prueba de adaptación móvil. |
| [DG-14](diagramas/renderizado-14.png) | docs/02-diseno/COMPORTAMIENTO.md:59 · 2.1 Estado de una prenda (`estado_prenda`) | Prenda: sintaxis correcta, semántica incompleta. H09: cadena muestra flujo habitual, pero código permite saltos/correcciones. Entregada no debe presentarse como terminal universal mientras orden siga abierta. |
| [DG-15](diagramas/renderizado-15.png) | docs/02-diseno/COMPORTAMIENTO.md:73 · 2.2 Estado de una orden (`estado_orden`) | Orden: H10/H31. Completar Lista→Pendiente; considerar mezcla Terminada/Entregada y excepción de reapertura. Etiquetas visibles, pero flechas densas alrededor de En Proceso. |
| [DG-16](diagramas/renderizado-16.png) | docs/02-diseno/COMPORTAMIENTO.md:125 · 3.1 Agregar una prenda | Agregar prenda: representa comprobación y transacción de escrituras. Añadir límite de saveToStore/navegador y manejo de error; no afirmar garantía universal de atomicidad de otros recursos. |
| [DG-17](diagramas/renderizado-17.png) | docs/02-diseno/COMPORTAMIENTO.md:159 · 3.2 Registrar un abono | Abono: control SQL de saldo representado. H20: no demuestra idempotencia. Rama de rechazo debe representar distintas causas y retorno a UI, no atribuir toda negativa a superar saldo. |
| [DG-18](diagramas/renderizado-18.png) | docs/02-diseno/COMPORTAMIENTO.md:191 · 3.3 Sesión: acceso y bloqueo | Sesión/bloqueo: H12. Añadir guarda bloqueoPorEstaSalida antes de desbloqueo por retorno corto. Mantener corrección ya integrada, no adaptar código al diagrama antiguo. |
| [DG-19](diagramas/renderizado-19.png) | docs/02-diseno/COMPORTAMIENTO.md:231 · 3.4 Copia de seguridad y restauración | Copia/restauración: incluye límite de fotos y snapshot de BD. H05: faltan errores individuales de archivo y diferencia entre rollback de base y de archivos. Dividir copia/restauración para lectura. |
| [DG-20](diagramas/renderizado-20.png) | docs/02-diseno/MODELO_DE_DATOS.md:14 · 1. Diagrama entidad-relación | ER: contiene 17 tablas y columnas controladas por test. Muy denso a 784 px; entregar versión vectorial o secciones negocio/catálogos/soporte para impresión. Revisar nulabilidad, FK, defaults e índices, que la prueba no valida semánticamente. |

<a id="vigencia"></a>

## Vigencia frente a 4252f22

La tabla anterior describe `a2c18ff`; sus números de línea son de ese commit. Al 11 de octubre de 2026 hay cinco diagramas vigentes que cambiaron en `4252f22`. El cambio solo retira Capgo/OTA (D-14) y no corrige ninguna observación de la tabla. Se renderizaron otra vez con Mermaid CLI 12.0.0, sin errores. Fuentes e imágenes: [diagramas/actualizados.md](diagramas/actualizados.md).

| ID / imagen actual | Línea en 4252f22 | Cambio | Evaluación |
| --- | --- | --- | --- |
| [DG-01](diagramas/actual-1.png) | ARQUITECTURA.md:41 | «Servicios externos» ya no incluye Capgo | La observación sobre H13 sigue igual. En H30 queda sin objeto lo de Capgo; siguen las fuentes de Google |
| [DG-02](diagramas/actual-2.png) | ARQUITECTURA.md:163 | `initUpdates + initAppLock` pasa a `initAppLock` | Sigue igual; 1370 px de alto |
| [DG-03](diagramas/actual-3.png) | ARQUITECTURA.md:203 | Sin nodo Capgo; el APK también sirve para cada versión nueva | Sigue igual; P-07 pendiente |
| [DG-09](diagramas/actual-9.png) | CASOS_DE_USO.md:182 | Sin «Buscar actualización» | Sigue igual; 1168 px de alto |
| [DG-13](diagramas/actual-13.png) | COMPORTAMIENTO.md:13 | Sin «Buscar actualización OTA» en Ajustes | Sigue igual |

Los otros 15 diagramas tienen el mismo contenido. Algunos solo empiezan en otra línea: DG-10 y DG-11 dos líneas antes, y DG-14 a DG-19 una línea antes.

## Criterios de presentación

- Para sustentación: un propósito por lámina, texto legible a tamaño de proyección y exportación vectorial al preparar la entrega final. No meter el flujo de 3596 px en una sola diapositiva.
- Separar diagramas de dominio, persistencia, interfaz y despliegue; cada uno con fecha, versión, alcance y leyenda.
- Los casos de uso actuales usan flowchart de Mermaid con formas ovaladas y etiquetas include/extend. Son representaciones conceptuales; confirmar con el instructor si exige notación UML formal y límite de sistema explícito.
- Mantener diagrama y tabla de transiciones juntos. Por cada flecha: origen, destino, guarda, efecto y caso de prueba.
- En secuencias: distinguir validación, transacción SQLite, persistencia web, archivos y servicio externo. Una transacción de BD no incluye los demás recursos.

## Históricos

Estos diagramas solo se verificaron en generación y alcance histórico; no se certifican como representación de la app vigente.

| ID / imagen | Procedencia | Tratamiento |
| --- | --- | --- |
| [DH-01](diagramas/historicos-render-1.png) | docs/04-calidad/historico/AUDITORIA_APP_DOCUMENTACION.md, bloque 1 | Conservar como antecedente/propuesta; no usar como modelo vigente. |
| [DH-02](diagramas/historicos-render-2.png) | docs/04-calidad/historico/FALLOS_APP_2026-10-06.md, bloque 1 | Conservar como antecedente/propuesta; no usar como modelo vigente. |
| [DH-03](diagramas/historicos-render-3.png) | docs/04-calidad/historico/REVISION_EQUIPO_ANALISTAS_2026-10-07.md, bloque 1 | Conservar como antecedente/propuesta; no usar como modelo vigente. |
| [DH-04](diagramas/historicos-render-4.png) | docs/99-archivo/propuesta-venta/ARQUITECTURA.md, bloque 1 | Conservar como antecedente/propuesta; no usar como modelo vigente. |
| [DH-05](diagramas/historicos-render-5.png) | docs/99-archivo/propuesta-venta/ARQUITECTURA.md, bloque 2 | Conservar como antecedente/propuesta; no usar como modelo vigente. |
| [DH-06](diagramas/historicos-render-6.png) | docs/99-archivo/propuesta-venta/ARQUITECTURA.md, bloque 3 | Conservar como antecedente/propuesta; no usar como modelo vigente. |
| [DH-07](diagramas/historicos-render-7.png) | docs/99-archivo/propuesta-venta/ARQUITECTURA.md, bloque 4 | Conservar como antecedente/propuesta; no usar como modelo vigente. |
| [DH-08](diagramas/historicos-render-8.png) | docs/99-archivo/PROPUESTA_WEB_APP.md, bloque 1 | Conservar como antecedente/propuesta; no usar como modelo vigente. |
| [DH-09](diagramas/historicos-render-9.png) | docs/99-archivo/PROPUESTA_WEB_APP.md, bloque 2 | Conservar como antecedente/propuesta; no usar como modelo vigente. |
| [DH-10](diagramas/historicos-render-10.png) | docs/99-archivo/PROPUESTA_WEB_APP.md, bloque 3 | Conservar como antecedente/propuesta; no usar como modelo vigente. |

El diagrama embebido del DOCX/Costura.md pertenece al original archivado; no se regeneró como Mermaid. La existencia del original se comprobó en la estructura DOCX. No se certificó su diseño de página.
