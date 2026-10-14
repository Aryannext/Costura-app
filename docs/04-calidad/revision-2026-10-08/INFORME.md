# Revisión de documentación, aplicación y experiencia de uso

**Costura-app / Atelier Manager · 8 de octubre de 2026**

## Dictamen

La aplicación y su documentación tienen una base coherente, pero todavía no es defendible afirmar que todo lo documentado coincide completamente con la aplicación. Esta revisión identifica **31 hallazgos**: discrepancias funcionales, afirmaciones documentales demasiado amplias, problemas de descubrimiento de acciones y decisiones de negocio pendientes. No son 31 fallos de Sonar ni se reabren los 89 problemas corregidos.

Prioridades: corregir instrucciones sobre datos personales, requerimiento de recogida y dinero; precisar recuperación de fotografías y comprobar entrega con deuda por todas sus rutas. Después, sincronizar estados, ordenación, trazabilidad y guías. La aceptación con la dueña sigue siendo necesaria.

## Alcance y evidencia

- Inventario inicial: **32 archivos** en docs: **14 vigentes y 18 históricos o propuestas archivadas**, con SHA-256 en [inventario.json](inventario.json).
- Contenido vigente contrastado con vistas, componentes, composables, servicios, consultas, migraciones y pruebas existentes. Matriz de **125 entradas**: 57 RF, 28 RNF y 40 RN.
- **20 diagramas Mermaid vigentes y 10 históricos renderizados correctamente**. La sintaxis no demuestra corrección semántica. Véase [DIAGRAMAS.md](DIAGRAMAS.md).
- Main remoto: `a2c18ff76a60e8ad02cf5fe9cd91f47521533e26`; checkout: `5df488b7d2c8a1746b7c5cd8bccafcccef7b7efd`. Ambos árboles Git: `8f0c840af42693e57c7d276a96362cd644a654b2`; comparación sin archivos diferentes al comenzar.
- Producto según package.json en `a2c18ff`: 1.1.2 (1.2.0 desde el PR #10; véase Vigencia); esquema documentado: 8. Son versiones diferentes de artefactos diferentes.
- Ejecución: `npx vitest run src/__tests__/documentacion.spec.js --coverage.enabled=false`: **8/8 aprobadas**, 8 de octubre, 10:50; 274 ms. No es una nueva certificación de toda la suite ni de Sonar.
- Instalación web aislada localhost:5179: acceso y cambio de contraseña inspeccionados a 390 × 844. **Recorrido posterior pendiente del cambio de clave por el usuario**, exigido por la política de la herramienta. No se eludió esa protección ni se usaron datos reales.
- UX restante: inspección de componentes y flujos; las hipótesis no se presentan como resultados de una prueba con la dueña.
- Históricos: revisión de procedencia, alcance y diferencias relevantes; sus resultados no se atribuyen al código actual. DOCX inspeccionado mediante texto/estructura XML; no se certifica paginación ni equivalencia íntegra con Costura.md.
- No se modificaron src, pruebas, Sonar, workflows, dependencias ni originales documentales. Esta carpeta contiene únicamente evidencias y propuestas.
- Anexos: [PROPUESTA_UX.md](PROPUESTA_UX.md) (propuesta de experiencia de uso, H24–H27) y [PROTOCOLO_UX.md](PROTOCOLO_UX.md) (observación con la dueña, sin aplicar).

## Vigencia frente al código actual

Revisado el 11 de octubre de 2026 contra `4252f229ec709a609e3699c2a4b5d235650837ac` (rama compose-vps, que contiene main con los PR #10 y #11). Los hallazgos y la matriz describen `a2c18ff`; los enlaces de evidencia siguen fijados a ese commit. Cambios posteriores que afectan a esta revisión:

- **Versión 1.2.0** en package.json y MANUAL_TECNICO (esquema 8 sin cambios). La diferencia de versión señalada en H15 desapareció; el resto de H15 sigue vigente.
- **Capgo retirado** (D-14, P-05 resuelto): sin actualizaciones OTA; cada versión nueva se instala con un APK encima del anterior y MANUAL_TECNICO §6 documenta el procedimiento. La parte de H30 sobre Capgo y lo que esta revisión pedía de «procedimiento OTA» quedan sin objeto; el resto de H30 sigue vigente.
- **Versión web en subruta** (`/costura-app/`) y `docker/compose.vps.yml`. P-07 sigue pendiente en DECISIONES hasta comprobar el despliegue.
- **Documentos vigentes modificados:** 8 de 14 (SRS, ARQUITECTURA, CASOS_DE_USO, COMPORTAMIENTO, MANUAL_TECNICO, PLAN_SONAR, DECISIONES, PLAN_19_DIAS). Los cambios retiran Capgo/OTA y actualizan la versión; ninguno corrige un hallazgo de este informe. inventario.json registra el hash de cada archivo en ambos commits.
- **Requisitos:** los 125 ID del SRS y su enunciado y estado son idénticos en ambos commits; MATRIZ.md sigue siendo válida.
- **Diagramas:** cambiaron DG-01, DG-02, DG-03, DG-09 y DG-13 (se quitó Capgo/OTA). Se renderizaron de nuevo; véase [DIAGRAMAS.md](DIAGRAMAS.md#vigencia).
- **Código citado en los hallazgos:** sin cambios de comportamiento. connection.js tiene 5 líneas nuevas (ruta de sql-wasm en subruta), así que la evidencia de H05 en la línea 157 está en la 162 del commit actual.
- `npx vitest run src/__tests__/documentacion.spec.js --coverage.enabled=false` en `4252f22`: **8/8 aprobadas**, 11 de octubre, 23:02.

## Cómo interpretar los hallazgos

**Alta:** resolver o acordar antes de usar con clientas reales o defender una garantía de cumplimiento. **Media:** corregir para consistencia, comprensión o evidencia de aceptación. Es prioridad del producto/documentación, no calificación de vulnerabilidad.

Salvo ejecución indicada, la evidencia es inspección de código/documentos. Los criterios de cierre son escenarios propuestos, no resultados ya aprobados. H19 y H27 son riesgos/hipótesis para ensayo; H28 requiere conciliación de fuentes.

| ID | Prioridad | Hallazgo | Relación |
| --- | --- | --- | --- |
| [H01](#h01) | Alta | Privacidad: el manual pide borrar notas sin una función para hacerlo | RF-DAT-03, RN-35, RN-39 |
| [H02](#h02) | Alta | WhatsApp no sustituye el requerimiento formal descrito por la norma | RF-47, RN-37 |
| [H03](#h03) | Alta | El recibo puede salir sin campos que el SRS declara cubiertos | RF-REC-01, RF-42 |
| [H04](#h04) | Media | Aviso de privacidad y prueba de autorización requieren precisión | RF-DAT-01, RF-DAT-02, RF-01 |
| [H05](#h05) | Alta | Restauración: vuelta atrás de la base no implica vuelta atrás de las fotos | RNF-17, RNF-18 |
| [H06](#h06) | Media | Guardar fotos permanentemente no garantiza sobrevivir a desinstalación | RNF-25 |
| [H07](#h07) | Media | Eliminar una fotografía elimina su registro, no necesariamente su archivo | RF-32, RN-40 |
| [H08](#h08) | Media | Orden de los listados no cumple literalmente RF-09 | RF-09 |
| [H09](#h09) | Media | Diagrama de prendas representa una cadena más restrictiva que el código | RF-21, RN-07, RN-21 |
| [H10](#h10) | Media | Diagrama de órdenes omite casos y la reapertura tiene una excepción | RF-13, RF-24, RN-04, RN-06, RN-10, RN-16, RN-28 |
| [H11](#h11) | Alta | Entrega por prenda no muestra la misma advertencia de deuda | RF-15, RN-30, D-11 |
| [H12](#h12) | Media | La secuencia de bloqueo simplifica una condición de seguridad importante | RNF-07, RNF-09 |
| [H13](#h13) | Media | Arquitectura real y regla declarada de dependencias difieren | RNF-20, RNF-26 |
| [H14](#h14) | Media | La prueba de documentación comprueba estructura, no equivalencia completa | Todos |
| [H15](#h15) | Media | Matriz de trazabilidad desactualizada respecto del SRS | RF-39, RF-46, RF-47, RF-48, RF-49, RF-70, RNF-20, RNF-23, RN-37 |
| [H16](#h16) | Media | 1080 píxeles no demuestra el límite de 10 MB por imagen | RNF-22 |
| [H17](#h17) | Media | Cancelar la cámara puede terminar con aviso de éxito | RNF-05, RF-27 |
| [H18](#h18) | Media | Recordar al cliente realmente prepara una lista para la modista | RF-40, RN-32 |
| [H19](#h19) | Media | Una vez al día requiere acotar concurrencia y fallo intermedio | RN-33 |
| [H20](#h20) | Media | Protección contra sobrepago no equivale a idempotencia de abonos | RF-33, RN-27 |
| [H21](#h21) | Alta | Anular un registro no equivale a devolver dinero realmente recibido | RF-OP-01, RN-14, RN-29 |
| [H22](#h22) | Media | El historial registra eventos, pero no todos sus valores anteriores | RN-35, RF-46 |
| [H23](#h23) | Media | Los títulos del reporte pueden interpretarse como otras métricas | RF-44, RF-45 |
| [H24](#h24) | Media | Acciones necesarias ocultas tras un gesto táctil | RF-OP-01, RNF-16 |
| [H25](#h25) | Media | Estilos usan siete variables que no están definidas | RNF-06, RNF-16 |
| [H26](#h26) | Media | El recorrido inicial enseña una versión incompleta de la interfaz | RNF-04, RNF-16 |
| [H27](#h27) | Media | Carga de decisión alta en recepción, estados y pagos | RNF-04, RNF-16 |
| [H28](#h28) | Alta | Precio y fecha pendientes: fuentes de negocio contradictorias | RF-06, RF-19, RN-05, RN-20 |
| [H29](#h29) | Media | Paquete de graduación necesita evidencias y fechas consistentes | Entrega académica |
| [H30](#h30) | Media | Dependencias de red y comandos de operación deben describirse con precisión | RNF-20, Manual técnico |
| [H31](#h31) | Media | Casos de uso y manual discrepan sobre acciones manuales de la orden | RF-11, RF-13, RF-15 |

## Evidencia y acciones de cierre

<a id="h01"></a>

### H01 · Privacidad: el manual pide borrar notas sin una función para hacerlo

**Prioridad:** Alta. **Referencias:** RF-DAT-03, RN-35, RN-39.

**Lo observado.** MANUAL_USUARIO §3 promete datos eliminados y pide borrar nombres en notas. PrendaCard solo permite añadir/consultar; addObservacion también copia la nota al historial. anonimizarCliente no limpia esos textos ni fotos ni copias previas.

**Consecuencia.** Una clienta identificada en una nota puede seguir identificable después de anonimizar su ficha.

**Corrección propuesta.** Definir alcance y conservación de datos; ofrecer un proceso verificable de redacción de notas e historial cuando corresponda. Corregir mientras tanto la promesa del manual. No borrar registros contables indiscriminadamente.

**Criterio de cierre.** Introducir un nombre ficticio en ficha, nota, historial y foto; tramitar la solicitud y documentar qué se elimina, conserva y por qué, incluyendo las copias.

**Evidencia:** [src/database/queries/clientes.js:85](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/clientes.js#L85); [src/database/queries/prendas.js:99](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/prendas.js#L99); [src/components/prendas/PrendaCard.vue:73](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/prendas/PrendaCard.vue#L73); [docs/03-manuales/MANUAL_USUARIO.md:52](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/03-manuales/MANUAL_USUARIO.md#L52).

<a id="h02"></a>

### H02 · WhatsApp no sustituye el requerimiento formal descrito por la norma

**Prioridad:** Alta. **Referencias:** RF-47, RN-37.

**Lo observado.** MANUAL_USUARIO §9 afirma que un WhatsApp sirve como requerimiento. El Decreto 1074, art. 2.2.2.56.2, exige correo certificado y además correo electrónico cuando se conozca.

**Consecuencia.** La modista podría creer que inició el procedimiento legal con una acción que la app solo prepara.

**Corrección propuesta.** Corregir la guía y separar recordatorio cotidiano, alerta operativa y trámite legal. Mantener venta de prendas fuera del alcance. Fuente oficial L3 al final.

**Criterio de cierre.** El manual distingue los tres conceptos, enlaza la fuente y no presenta 30 días de la app como declaración de abandono.

**Evidencia:** [docs/03-manuales/MANUAL_USUARIO.md:171](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/03-manuales/MANUAL_USUARIO.md#L171); [src/database/queries/reportes.js:60](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/reportes.js#L60).

<a id="h03"></a>

### H03 · El recibo puede salir sin campos que el SRS declara cubiertos

**Prioridad:** Alta. **Referencias:** RF-REC-01, RF-42.

**Lo observado.** construirRecibo omite dirección/teléfono vacíos; garantía depende de configuración. El alta de clienta desde OrdenForm no pide dirección. Hay capacidad de incluirlos, pero no garantía de completitud.

**Consecuencia.** El recibo de una recepción real puede quedar incompleto aun cuando el SRS dice Cumple.

**Corrección propuesta.** Definir validación previa del recibo y revisión de datos de la clienta; completar condiciones y garantía con la dueña. No inventar duración de garantía. Referencia L1.

**Criterio de cierre.** Crear clienta desde Nueva orden y generar recibo con dirección/garantía vacías: el producto debe guiar a completarlas o indicar explícitamente el pendiente según decisión aprobada.

**Evidencia:** [src/composables/useOrdenTelegram.js:46](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/useOrdenTelegram.js#L46); [src/components/ordenes/OrdenForm.vue:81](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/ordenes/OrdenForm.vue#L81); [docs/01-requisitos/SRS.md:219](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/01-requisitos/SRS.md#L219).

<a id="h04"></a>

### H04 · Aviso de privacidad y prueba de autorización requieren precisión

**Prioridad:** Media. **Referencias:** RF-DAT-01, RF-DAT-02, RF-01.

**Lo observado.** El aviso usa el nombre del taller y remite a este mismo número, lo que no identifica un canal cuando se lee dentro de la app. Fecha y versión son evidencia técnica limitada, no prueba integral del proceso de autorización.

**Consecuencia.** Es difícil explicar a la clienta quién responde y dónde ejercer sus derechos.

**Corrección propuesta.** Agregar identificación y contacto del responsable; conservar versión del texto y procedimiento de obtención. Evitar afirmar cumplimiento general por tener una casilla. Referencia L2.

**Criterio de cierre.** Leer aviso dentro de la app sin WhatsApp: identificar responsable/canal; consultar fecha, versión y evidencia de cómo se obtuvo la autorización.

**Evidencia:** [src/services/avisoPrivacidad.js:10](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/services/avisoPrivacidad.js#L10); [src/database/queries/clientes.js:71](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/clientes.js#L71); [docs/03-manuales/MANUAL_USUARIO.md:45](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/03-manuales/MANUAL_USUARIO.md#L45).

<a id="h05"></a>

### H05 · Restauración: vuelta atrás de la base no implica vuelta atrás de las fotos

**Prioridad:** Alta. **Referencias:** RNF-17, RNF-18.

**Lo observado.** La restauración escribe fotografías antes de tomar/importar la instantánea de la base; ciertos errores de fotos se capturan y se continúa. Superados 20 MiB se excluyen todas las fotos del respaldo. El manual promete taller intacto con fotos.

**Consecuencia.** Una copia parcial o una restauración fallida puede dejar fotografías ausentes o diferentes de las referencias de la base.

**Corrección propuesta.** Precisar alcance de recuperación; inventario de fotos incluidas/excluidas/fallidas y resultado visible. Diseñar staging y recuperación conjunta antes de prometer atomicidad de archivos y base.

**Criterio de cierre.** Copia con foto ilegible; copia sobre límite; restauración que falla después de escribir archivos. Verificar por separado base, archivos y mensaje mostrado.

**Evidencia:** [src/composables/useBackupRestore.js:220](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/useBackupRestore.js#L220); [src/composables/useBackupRestore.js:25](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/useBackupRestore.js#L25); [src/database/connection.js:157](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/connection.js#L157); [docs/03-manuales/MANUAL_USUARIO.md:161](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/03-manuales/MANUAL_USUARIO.md#L161).

<a id="h06"></a>

### H06 · Guardar fotos permanentemente no garantiza sobrevivir a desinstalación

**Prioridad:** Media. **Referencias:** RNF-25.

**Lo observado.** MODELO_DE_DATOS atribuye supervivencia a reinstalación al nombre de archivo. photoStorage usa Directory.Data. El nombre relativo permite resolver rutas al restaurar, pero no conserva por sí mismo archivos desinstalados.

**Consecuencia.** La usuaria podría desinstalar creyendo que sus fotos seguirán disponibles.

**Corrección propuesta.** Explicar actualización frente a desinstalación y restauración desde respaldo verificado. Fuente oficial Android L4.

**Criterio de cierre.** El manual indica comprobar respaldo con fotos antes de cambiar de teléfono o desinstalar; ensayo en dispositivo de prueba.

**Evidencia:** [src/services/photoStorage.js:25](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/services/photoStorage.js#L25); [docs/02-diseno/MODELO_DE_DATOS.md:146](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/02-diseno/MODELO_DE_DATOS.md#L146).

<a id="h07"></a>

### H07 · Eliminar una fotografía elimina su registro, no necesariamente su archivo

**Prioridad:** Media. **Referencias:** RF-32, RN-40.

**Lo observado.** removeFoto llama deleteFotografia; esta operación elimina la fila e historial correspondiente sin llamar deletePhotoFile. El borrado de una prenda sí tiene limpieza de archivos por otra ruta.

**Consecuencia.** Fotos retiradas de la galería pueden seguir ocupando almacenamiento; borrar visualmente no es suprimir el archivo.

**Corrección propuesta.** Definir borrado físico con tratamiento de fallos y mantener prenda intacta; describir qué ocurre en respaldos ya compartidos.

**Criterio de cierre.** Eliminar una foto ficticia; verificar fila, archivo y prenda por separado, con un caso de error de Filesystem.

**Evidencia:** [src/composables/usePrendas.js:159](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/usePrendas.js#L159); [src/database/queries/prendas.js:201](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/prendas.js#L201); [src/services/photoStorage.js:81](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/services/photoStorage.js#L81).

<a id="h08"></a>

### H08 · Orden de los listados no cumple literalmente RF-09

**Prioridad:** Media. **Referencias:** RF-09.

**Lo observado.** getAllOrdenes ordena fecha_creacion DESC; OrdenesView conserva ese orden en Activas e Historial, y Por cobrar aplica su propio orden de deuda.

**Consecuencia.** Las órdenes más urgentes no necesariamente aparecen primero.

**Corrección propuesta.** Aplicar orden por fecha prometida en la vista acordada o aprobar una revisión explícita de RF-09; conservar el orden de deuda como opción identificada.

**Criterio de cierre.** Dos órdenes con recepción y promesa en orden inverso: comprobar orden visible en las tres pestañas y criterio de desempate.

**Evidencia:** [src/database/queries/ordenes.js:11](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/ordenes.js#L11); [src/views/OrdenesView.vue:37](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/views/OrdenesView.vue#L37); [docs/01-requisitos/SRS.md:146](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/01-requisitos/SRS.md#L146).

<a id="h09"></a>

### H09 · Diagrama de prendas representa una cadena más restrictiva que el código

**Prioridad:** Media. **Referencias:** RF-21, RN-07, RN-21.

**Lo observado.** COMPORTAMIENTO solo dibuja Pendiente→En proceso→Terminada→Entregada. Los controles y validateCambioEstadoPrenda admiten saltos y correcciones mientras la orden esté abierta; entregar exige haber terminado.

**Consecuencia.** Un lector puede implementar o defender reglas diferentes de las que usa la app.

**Corrección propuesta.** Dibujar transiciones permitidas con guardas o separar flujo habitual de tabla completa de correcciones. Explicar prenda entregada dentro de orden abierta.

**Criterio de cierre.** Contrastar cada par de estados 1..4 con la validación y el estado de la orden; marcar permitida/rechazada y mensaje.

**Evidencia:** [src/services/validators.js:158](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/services/validators.js#L158); [src/components/prendas/PrendaCard.vue:26](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/prendas/PrendaCard.vue#L26); [docs/02-diseno/COMPORTAMIENTO.md:57](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/02-diseno/COMPORTAMIENTO.md#L57).

<a id="h10"></a>

### H10 · Diagrama de órdenes omite casos y la reapertura tiene una excepción

**Prioridad:** Media. **Referencias:** RF-13, RF-24, RN-04, RN-06, RN-10, RN-16, RN-28.

**Lo observado.** La tabla textual contempla mezcla Terminada/Entregada, pero la flecha exige todas Terminadas. Falta Lista→Pendiente al retirar la última prenda permitida. Reabrir fija En Proceso sin reiniciar prendas; saldo cero con total cero no se rotula Pagada.

**Consecuencia.** La explicación de automatismos resulta contradictoria en órdenes vacías o reabiertas.

**Corrección propuesta.** Documentar tabla de decisión con precedencia y excepción temporal de reapertura, además de fecha de entrega conservada. Aclarar RN-28 para total cero.

**Criterio de cierre.** Probar orden vacía, mixta, eliminación final, entrega y reapertura; comparar estado persistido, derivado y etiqueta de pago.

**Evidencia:** [src/services/estadoOrden.js:76](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/services/estadoOrden.js#L76); [src/database/queries/ordenes.js:72](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/ordenes.js#L72); [docs/02-diseno/COMPORTAMIENTO.md:79](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/02-diseno/COMPORTAMIENTO.md#L79).

<a id="h11"></a>

### H11 · Entrega por prenda no muestra la misma advertencia de deuda

**Prioridad:** Alta. **Referencias:** RF-15, RN-30, D-11.

**Lo observado.** El botón Entregar orden usa mensajeConfirmacionEntrega. handleEstadoPrenda cambia directamente el estado sin esa confirmación; entregar la última prenda puede cerrar la orden con saldo.

**Consecuencia.** Se puede terminar una entrega por otra ruta sin la advertencia que la documentación promete.

**Corrección propuesta.** Unificar la advertencia cuando una entrega deja prendas fuera con deuda, manteniendo la decisión aprobada de permitirla. No bloquear automáticamente cobros posteriores.

**Criterio de cierre.** Orden con dos prendas terminadas y saldo: comparar botón global con entrega individual, incluida la última prenda.

**Evidencia:** [src/views/OrdenDetailView.vue:128](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/views/OrdenDetailView.vue#L128); [src/views/OrdenDetailView.vue:299](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/views/OrdenDetailView.vue#L299); [docs/05-gestion/DECISIONES.md:127](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/05-gestion/DECISIONES.md#L127).

<a id="h12"></a>

### H12 · La secuencia de bloqueo simplifica una condición de seguridad importante

**Prioridad:** Media. **Referencias:** RNF-07, RNF-09.

**Lo observado.** El diagrama dice que volver antes de dos minutos quita el bloqueo. useAppLock mantiene un bloqueo previo y solo revierte el creado por esa salida, con bloqueoPorEstaSalida.

**Consecuencia.** El diagrama podría inducir a deshacer una corrección de seguridad ya integrada.

**Corrección propuesta.** Conservar código y tests actuales; actualizar exclusivamente la secuencia y su guarda para reflejar la corrección.

**Criterio de cierre.** Diagrama distingue salida corta desde sesión desbloqueada y salida corta desde sesión ya bloqueada; enlaza regresión existente.

**Evidencia:** [src/composables/useAppLock.js:22](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/useAppLock.js#L22); [docs/02-diseno/COMPORTAMIENTO.md:220](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/02-diseno/COMPORTAMIENTO.md#L220).

<a id="h13"></a>

### H13 · Arquitectura real y regla declarada de dependencias difieren

**Prioridad:** Media. **Referencias:** RNF-20, RNF-26.

**Lo observado.** El esquema oculta cinco accesos de presentación a datos y servicios/auth importa tanto queries/auth como Vue y router. El reporte directo tampoco es una simple lectura de una tabla. README y matriz no describen todas las excepciones consistentemente.

**Consecuencia.** La defensa académica de separación por capas puede apoyarse en una afirmación absoluta falsa.

**Corrección propuesta.** Actualizar mapa real con excepciones y dependencias. No proponer una reescritura para acomodar el dibujo. Separar arquitectura actual de mejoras futuras.

**Criterio de cierre.** Cada import entre capas tiene representación o excepción y la lista de módulos coincide con src.

**Evidencia:** [src/services/auth.js:11](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/services/auth.js#L11); [src/views/ReportesView.vue:79](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/views/ReportesView.vue#L79); [docs/02-diseno/ARQUITECTURA.md:75](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/02-diseno/ARQUITECTURA.md#L75); [README.md:57](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/README.md#L57).

<a id="h14"></a>

### H14 · La prueba de documentación comprueba estructura, no equivalencia completa

**Prioridad:** Media. **Referencias:** Todos.

**Lo observado.** Los ocho tests revisan tablas/columnas por nombre, módulos, rutas, funciones, excepciones y enlaces. No verifican cada transición, cardinalidad, regla de interacción, precisión legal ni legibilidad de imágenes.

**Consecuencia.** Ocho pruebas verdes pueden coexistir con los hallazgos de este informe.

**Corrección propuesta.** Precisar el alcance de la prueba en README, ARQUITECTURA y PLAN_DE_PRUEBAS. Añadir revisión semántica al criterio de entrega.

**Criterio de cierre.** Afirmaciones documentales distinguen validación estructural de revisión funcional; cada corrección se comprueba con el escenario correspondiente.

**Evidencia:** [src/__tests__/documentacion.spec.js:10](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/__tests__/documentacion.spec.js#L10); [docs/README.md:5](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/README.md#L5); [docs/04-calidad/PLAN_DE_PRUEBAS.md:14](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/04-calidad/PLAN_DE_PRUEBAS.md#L14).

<a id="h15"></a>

### H15 · Matriz de trazabilidad desactualizada respecto del SRS

**Prioridad:** Media. **Referencias:** RF-39, RF-46, RF-47, RF-48, RF-49, RF-70, RNF-20, RNF-23, RN-37.

**Lo observado.** TRAZABILIDAD dice versión 1.2.0 frente a package 1.1.2, mantiene checks y pendientes distintos del SRS y contiene referencias de implementación imprecisas. RF-70 es parcial y RNF-23 aún no medido; RN-37 usa la fecha más tardía.

**Consecuencia.** No hay una única respuesta fiable sobre qué está terminado y dónde se demuestra.

**Actualización 11 oct.** package.json ya está en 1.2.0, igual que TRAZABILIDAD; la diferencia de versión quedó resuelta. Siguen pendientes los checks, los pendientes y las referencias distintas del SRS.

**Corrección propuesta.** Unificar versión de producto, esquema y documentos por separado; una fila por ID con archivo, prueba concreta, resultado/fecha y pendientes. Adjunta matriz de revisión de 125 filas.

**Criterio de cierre.** Recorrer cada ID desde SRS a implementación y evidencia y regresar desde funcionalidades de app a requisito/decisión.

**Evidencia:** [docs/04-calidad/TRAZABILIDAD.md:5](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/04-calidad/TRAZABILIDAD.md#L5); [package.json:4](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/package.json#L4); [docs/01-requisitos/SRS.md:210](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/01-requisitos/SRS.md#L210).

<a id="h16"></a>

### H16 · 1080 píxeles no demuestra el límite de 10 MB por imagen

**Prioridad:** Media. **Referencias:** RNF-22.

**Lo observado.** takePhoto reduce dimensiones/calidad, pero el estado Cumple se justifica solo por ancho y no por una comprobación de bytes.

**Consecuencia.** Una optimización habitual se presenta como garantía cuantitativa.

**Corrección propuesta.** Medir o validar tamaño real y definir MB/MiB; entretanto marcar evidencia pendiente.

**Criterio de cierre.** Archivo por debajo, en el límite y por encima; validar el resultado almacenado y mensaje de rechazo.

**Evidencia:** [src/composables/usePrendas.js:116](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/usePrendas.js#L116); [docs/01-requisitos/SRS.md:250](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/01-requisitos/SRS.md#L250).

<a id="h17"></a>

### H17 · Cancelar la cámara puede terminar con aviso de éxito

**Prioridad:** Media. **Referencias:** RNF-05, RF-27.

**Lo observado.** takePhoto devuelve null al cancelar, pero execute tiene successMessage Fotografía guardada y useAsyncAction no condiciona el toast al resultado.

**Consecuencia.** La modista puede creer que guardó evidencia que no existe.

**Corrección propuesta.** Tratar cancelación como resultado distinto del éxito; anunciar guardado solo después de guardar archivo y fila.

**Criterio de cierre.** Cancelar cámara/selector: ninguna fila ni mensaje de guardado; captura válida: un resultado y mensaje coherentes. Hallazgo por código, pendiente de dispositivo.

**Evidencia:** [src/composables/usePrendas.js:122](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/usePrendas.js#L122); [src/composables/useAsyncAction.js:21](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/useAsyncAction.js#L21).

<a id="h18"></a>

### H18 · Recordar al cliente realmente prepara una lista para la modista

**Prioridad:** Media. **Referencias:** RF-40, RN-32.

**Lo observado.** Dashboard rotula Recordar a N clientes usando conteo de órdenes; la operación manda una lista a Telegram. Ya se les recordó hoy no demuestra entrega a cada clienta.

**Consecuencia.** Se confunde preparación con envío y clientes únicos con órdenes.

**Corrección propuesta.** Rotular Preparar recordatorios (N órdenes); después Lista enviada a tu Telegram. Explicar que aún hay que abrir WhatsApp y enviar.

**Criterio de cierre.** Dos órdenes de una misma clienta: contador correcto por unidad; fallo de Telegram no anuncia envío; no afirmar lectura/entrega al cliente.

**Evidencia:** [src/views/DashboardView.vue:108](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/views/DashboardView.vue#L108); [src/composables/useNotificaciones.js:33](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/useNotificaciones.js#L33); [src/database/queries/notificaciones.js:3](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/notificaciones.js#L3).

<a id="h19"></a>

### H19 · Una vez al día requiere acotar concurrencia y fallo intermedio

**Prioridad:** Media. **Referencias:** RN-33.

**Lo observado.** La secuencia consulta pendientes, envía Telegram y luego registra avisos. No se observa reserva/idempotencia diaria atómica que abarque envío y registro.

**Consecuencia.** Dos ejecuciones simultáneas o éxito remoto seguido de fallo local pueden duplicar un recordatorio. Riesgo inferido, no envío real reproducido.

**Corrección propuesta.** Aclarar garantía actual; diseñar exclusión y estado de envío/reintento si se exige una sola vez. No marcar como fallo de Telegram ya reproducido.

**Criterio de cierre.** Ensayo con transporte simulado: dos llamadas concurrentes y fallo del registro tras éxito remoto; contar mensajes y filas.

**Evidencia:** [src/composables/useNotificaciones.js:33](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/useNotificaciones.js#L33); [src/database/queries/notificaciones.js:51](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/notificaciones.js#L51); [src/__tests__/reglasNegocio.spec.js:607](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/__tests__/reglasNegocio.spec.js#L607).

<a id="h20"></a>

### H20 · Protección contra sobrepago no equivale a idempotencia de abonos

**Prioridad:** Media. **Referencias:** RF-33, RN-27.

**Lo observado.** CASOS_DE_USO atribuye al control de saldo evitar dos registros por doble toque. Dos abonos de 5000 sobre saldo 20000 son válidos para la restricción; el bloqueo de UI reduce riesgo, pero no prueba idempotencia general.

**Consecuencia.** Una explicación de integridad promete más que la regla implementada.

**Corrección propuesta.** Precisar sobrepago frente a repetición de la misma operación; decidir si hace falta clave de operación. Mantener las protecciones actuales.

**Criterio de cierre.** Distinguir dos pagos voluntarios de un reintento duplicado; ensayar ambos sin dinero ni servicios reales.

**Evidencia:** [docs/02-diseno/CASOS_DE_USO.md:306](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/02-diseno/CASOS_DE_USO.md#L306); [src/database/queries/pagos.js:59](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/pagos.js#L59).

<a id="h21"></a>

### H21 · Anular un registro no equivale a devolver dinero realmente recibido

**Prioridad:** Alta. **Referencias:** RF-OP-01, RN-14, RN-29.

**Lo observado.** El manual sugiere anular el pago si de verdad se cobró de más. La app representa anulación de un dato, sin un flujo de devolución o crédito. Cancelar conserva pagos pero saca la orden de ciertas listas operativas.

**Consecuencia.** Podría ocultarse una entrada real para cuadrar un saldo y perder claridad contable.

**Corrección propuesta.** Corregir la instrucción y acordar procedimiento de devoluciones/cancelaciones con anticipo; registrar esta limitación si permanece fuera de alcance.

**Criterio de cierre.** Casos separados: pago duplicado por digitación, sobrecobro real, cancelación con anticipo, reducción de precio después de pago. Cada uno tiene procedimiento y evidencia sin fingir devolución.

**Evidencia:** [docs/03-manuales/MANUAL_USUARIO.md:115](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/03-manuales/MANUAL_USUARIO.md#L115); [src/database/queries/pagos.js:37](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/pagos.js#L37); [src/services/estadoOrden.js:90](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/services/estadoOrden.js#L90).

<a id="h22"></a>

### H22 · El historial registra eventos, pero no todos sus valores anteriores

**Prioridad:** Media. **Referencias:** RN-35, RF-46.

**Lo observado.** Varias escrituras dejan descripciones genéricas como estado actualizado. Eso permite ver que hubo un cambio, no reconstruir siempre valor anterior, nuevo y razón.

**Consecuencia.** La frase todo lo que pasó puede entenderse como una auditoría exhaustiva que no existe.

**Corrección propuesta.** Definir alcance real; para cambios que lo necesiten guardar antes/después y motivo, evitando duplicar datos personales innecesarios.

**Criterio de cierre.** Editar precio y estado: comprobar exactamente qué puede reconstruirse y reflejar ese alcance en manual y SRS.

**Evidencia:** [src/database/queries/prendas.js:134](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/prendas.js#L134); [docs/02-diseno/MODELO_DE_DATOS.md:149](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/02-diseno/MODELO_DE_DATOS.md#L149).

<a id="h23"></a>

### H23 · Los títulos del reporte pueden interpretarse como otras métricas

**Prioridad:** Media. **Referencias:** RF-44, RF-45.

**Lo observado.** Prendas Procesadas cuenta prendas de órdenes recibidas en el periodo, no prendas finalizadas en él. Ticket promedio promedia importes de órdenes, no pagos. El filtro temporal tiene significados diferentes para ingresos y órdenes.

**Consecuencia.** La dueña puede interpretar carga recibida como producción terminada o ventas como cobros.

**Corrección propuesta.** Publicar diccionario de métricas; renombrar Prendas recibidas en órdenes del periodo y Valor promedio por orden cuando coincida con la fórmula. Explicar canceladas y fechas.

**Criterio de cierre.** Orden recibida ayer, terminada hoy y pagada mañana: cada indicador tiene resultado esperado escrito y verificable.

**Evidencia:** [src/database/queries/reportes.js:115](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/database/queries/reportes.js#L115); [src/views/ReportesView.vue:46](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/views/ReportesView.vue#L46).

<a id="h24"></a>

### H24 · Acciones necesarias ocultas tras un gesto táctil

**Prioridad:** Media. **Referencias:** RF-OP-01, RNF-16.

**Lo observado.** SwipeItem revela el botón con touchstart/move/end y lo oculta con v-show en reposo. La ruta de ratón/teclado no tiene equivalente en ese componente.

**Consecuencia.** Anular o eliminar puede resultar indescubrible y difícil en la demostración de escritorio.

**Corrección propuesta.** Añadir menú visible de acciones accesible con teclado, manteniendo gesto opcional y confirmaciones. No cambiar las restricciones de negocio.

**Criterio de cierre.** La dueña descubre Anular sin ayuda; Tab/Enter llega a la misma acción en escritorio; no se ejecuta accidentalmente al desplazar verticalmente.

**Evidencia:** [src/components/common/SwipeItem.vue:2](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/common/SwipeItem.vue#L2); [src/components/common/SwipeItem.vue:4](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/common/SwipeItem.vue#L4).

<a id="h25"></a>

### H25 · Estilos usan siete variables que no están definidas

**Prioridad:** Media. **Referencias:** RNF-06, RNF-16.

**Lo observado.** Se encontraron --primary-fixed, --border-color, --text-secondary, --bg-secondary, --text-primary, --error-color y --accent-color sin definición en los estilos revisados.

**Consecuencia.** Esas declaraciones pueden quedar inválidas y perder bordes, color de errores o anillo de foco. No se afirma fallo de contraste medido en todas las pantallas.

**Corrección propuesta.** Unificar los tokens existentes y verificar contraste/foco con estilos computados; no rediseñar toda la app para corregir nombres.

**Criterio de cierre.** Sin referencias a variables inexistentes; comprobar formularios válidos/erróneos, foco y tarjetas a 360/390 px y escritorio.

**Evidencia:** [src/assets/css/style.css:356](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/assets/css/style.css#L356); [src/components/ordenes/OrdenForm.vue:180](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/ordenes/OrdenForm.vue#L180); [src/components/pagos/PagoForm.vue:128](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/pagos/PagoForm.vue#L128).

<a id="h26"></a>

### H26 · El recorrido inicial enseña una versión incompleta de la interfaz

**Prioridad:** Media. **Referencias:** RNF-04, RNF-16.

**Lo observado.** useTutorial tiene tres recorridos y textos que no enseñan consentimiento, Por cobrar y el flujo completo de prendas/pagos. onDestroyed comunica misión completada incluso al abandonar.

**Consecuencia.** La guía puede reforzar la confusión de una usuaria nueva.

**Corrección propuesta.** Cambiar la ayuda por tareas reales: recibir, avanzar, entregar/cobrar y recuperar. Separar abandonar de completar el recorrido.

**Criterio de cierre.** Cerrar el tutorial a mitad no muestra completado; una usuaria puede completar recepción y abono siguiendo la guía vigente.

**Evidencia:** [src/composables/useTutorial.js:40](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/useTutorial.js#L40); [src/views/AyudaView.vue:23](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/views/AyudaView.vue#L23).

<a id="h27"></a>

### H27 · Carga de decisión alta en recepción, estados y pagos

**Prioridad:** Media. **Referencias:** RNF-04, RNF-16.

**Lo observado.** Recepción reparte cliente, orden, prendas y pagos; la tarjeta ofrece varios estados; PagoForm inicia el importe con todo el saldo y el medio en Efectivo.

**Consecuencia.** Hipótesis de usabilidad: aumenta la posibilidad de marcar un estado o pago distinto del que se pretendía. Requiere observación con la dueña.

**Corrección propuesta.** [Propuesta UX adjunta](PROPUESTA_UX.md): flujo guiado, total/saldo siempre visibles, siguiente acción principal y correcciones en menú; abono con importe explícito y atajo Pagar saldo completo.

**Criterio de cierre.** Cinco tareas con datos ficticios y medición de ayudas/errores; no concluir facilidad por una captura ni por opinión del desarrollador.

**Evidencia:** [src/components/pagos/PagoForm.vue:3](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/pagos/PagoForm.vue#L3); [src/components/prendas/PrendaCard.vue:26](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/prendas/PrendaCard.vue#L26); [src/components/ordenes/OrdenForm.vue:3](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/ordenes/OrdenForm.vue#L3).

<a id="h28"></a>

### H28 · Precio y fecha pendientes: fuentes de negocio contradictorias

**Prioridad:** Alta. **Referencias:** RF-06, RF-19, RN-05, RN-20.

**Lo observado.** El usuario confirmó antes recepciones con alguno pendiente; el protocolo histórico lo registra. SRS vigente dice confirmación del 8 de octubre de que siempre se acuerdan ambos.

**Consecuencia.** No se puede elegir la regla correcta solo mirando el código; hay riesgo de documentar una comodidad técnica como realidad del taller.

**Corrección propuesta.** Vincular la decisión posterior y quién la confirmó; si sustituyó el dato anterior, explicitarlo. Si no, acordar recepción provisional y aceptación sin inventar fecha/precio cero.

**Criterio de cierre.** Acta breve con ejemplo real anonimizado, dueña, fecha y decisión; actualizar SRS, formularios y casos de prueba solo según ese resultado.

**Evidencia:** [docs/01-requisitos/SRS.md:143](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/01-requisitos/SRS.md#L143); [docs/04-calidad/historico/PROTOCOLO_ACEPTACION_BORRADOR.md:43](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/04-calidad/historico/PROTOCOLO_ACEPTACION_BORRADOR.md#L43).

<a id="h29"></a>

### H29 · Paquete de graduación necesita evidencias y fechas consistentes

**Prioridad:** Media. **Referencias:** Entrega académica.

**Lo observado.** El plan prevé manuales en español e inglés, pero el inventario vigente solo contiene español. Faltan resultados llenados de aceptación de la dueña y medición en su teléfono. El calendario asigna mal días de semana a 23–25 de octubre de 2026.

**Consecuencia.** No se puede declarar listo para graduación solo por CI verde; la rúbrica del instructor debe cerrar el alcance académico.

**Corrección propuesta.** Corregir calendario (23 viernes, 24 sábado, 25 domingo); confirmar rúbrica y vincular entregables/versiones. Recuperar historias/casos históricos mediante mapeo, sin reactivar requisitos retirados.

**Criterio de cierre.** Lista de entrega con responsable, enlace, versión y evidencia; aceptación registrada; manual inglés si el instructor lo exige conforme al plan.

**Evidencia:** [docs/05-gestion/PLAN_19_DIAS.md:12](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/05-gestion/PLAN_19_DIAS.md#L12); [docs/04-calidad/PLAN_DE_PRUEBAS.md:62](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/04-calidad/PLAN_DE_PRUEBAS.md#L62); [docs/README.md:3](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/README.md#L3).

<a id="h30"></a>

### H30 · Dependencias de red y comandos de operación deben describirse con precisión

**Prioridad:** Media. **Referencias:** RNF-20, Manual técnico.

**Lo observado.** CSS importa fuentes de Google; la arquitectura afirma que solo salen datos cuando la modista decide. Capgo también merece distinguirse del envío manual. Los comandos PW_CHANNEL=... del plan son Bash, aunque este entorno usa PowerShell.

**Actualización 11 oct.** Capgo se retiró del código y de la documentación (D-14); esa parte quedó sin objeto. Siguen vigentes las fuentes de Google y los comandos por shell.

**Consecuencia.** Offline-first no significa ausencia de solicitudes de red; comandos copiados literalmente pueden fallar en la sustentación.

**Corrección propuesta.** Documentar recursos remotos y fallback de fuentes, actualización OTA y contactos externos. Dar comandos específicos para Windows y no afirmar que los servicios desconocen el router.

**Criterio de cierre.** Arranque sin red conserva funciones locales; explicar qué requiere conexión. En PowerShell usar $env:PW_CHANNEL='msedge' y después npx playwright test cuando corresponda.

**Evidencia:** [src/assets/css/style.css:1](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/assets/css/style.css#L1); [src/services/auth.js:11](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/services/auth.js#L11); [docs/04-calidad/PLAN_DE_PRUEBAS.md:27](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/04-calidad/PLAN_DE_PRUEBAS.md#L27).

<a id="h31"></a>

### H31 · Casos de uso y manual discrepan sobre acciones manuales de la orden

**Prioridad:** Media. **Referencias:** RF-11, RF-13, RF-15.

**Lo observado.** Hay descripciones de cancelar/reabrir como únicas acciones manuales o de ausencia de botones para cambiar estado, pero también existe Entregar orden.

**Consecuencia.** La explicación al jurado y la guía de usuario no distinguen estado calculado de acciones manuales autorizadas.

**Corrección propuesta.** Decir que Pendiente/En proceso/Lista se derivan, mientras Entregar, Cancelar y Reabrir son acciones con guardas; sincronizar flujo general y tablas.

**Criterio de cierre.** Mismo vocabulario y lista de acciones en casos, manual, diagrama y pantalla.

**Evidencia:** [docs/02-diseno/CASOS_DE_USO.md:117](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/02-diseno/CASOS_DE_USO.md#L117); [docs/03-manuales/MANUAL_USUARIO.md:99](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/docs/03-manuales/MANUAL_USUARIO.md#L99); [src/components/ordenes/TabDetalle.vue:11](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/ordenes/TabDetalle.vue#L11); [src/views/OrdenDetailView.vue:221](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/views/OrdenDetailView.vue#L221).

## Revisión de cada documento vigente

| Documento | Resultado y trabajo necesario |
| --- | --- |
| docs/README.md | Buena puerta de entrada y separación histórica. Acotar la promesa de equivalencia automática completa (H14). |
| SRS.md | Catálogo único útil. Corregir RF-09; matizar privacidad, recibo, fotos y recuperación; resolver H28 sin inferir necesidades desde la implementación. |
| ARQUITECTURA.md | Correcta distinción móvil local/web. Representar dependencias reales, excepciones y recursos externos (H13, H30). |
| CASOS_DE_USO.md | Amplia cobertura por actor y nueve casos detallados. Precisar idempotencia, precondición de acceso para copia, entrega individual y supresión. El flujo general es habitual, no exhaustivo. |
| CLASES.md | Correctamente declarado modelo de dominio, no clases JavaScript. Tipos conceptuales difieren de SQLite; localizar métodos no valida firma ni responsabilidad. Denso para impresión. |
| COMPORTAMIENTO.md | Actualizar guardas, estados, reapertura y recuperación. Los límites transaccionales no garantizan por sí solos ausencia de todo descuadre. |
| MODELO_DE_DATOS.md | 17 tablas y versión 8 útiles como referencia. Completar comprobación de restricciones, nulabilidad y relaciones; corregir reinstalación e historial. |
| MANUAL_USUARIO.md | Organizado por tareas. Prioridad alta: instrucciones sobre notas, devolución, recuperación y requerimiento legal. |
| MANUAL_TECNICO.md | Añadir evidencia de compilación/instalación por versión y comandos por shell (el procedimiento de actualización por APK ya está en §6 desde la 1.2.0); ensayo de recuperación en otro teléfono. |
| PLAN_DE_PRUEBAS.md | Reconoce pendientes reales. Precisar alcance de documentacion.spec.js y añadir caminos alternativos, conservando protecciones existentes. |
| PLAN_SONAR.md | Se conserva configuración y trabajo corregido. Su resultado no demuestra usabilidad, exactitud jurídica o completitud del manual. No se repitió análisis remoto. |
| TRAZABILIDAD.md | Reconciliar con SRS y versión real; evidencia por ID. La matriz adjunta es revisión, no aprobación automática de requisitos. |
| DECISIONES.md | Buena base D-xx/P-xx. Vincular decisión de recepción y detallar conservación, cobro/entrega y límites de respaldos. |
| PLAN_19_DIAS.md | Inglés pendiente según el plan; corregir calendario y equivalencia entre contador operativo y plazo legal; llevar aceptación y rúbrica a evidencia. |

## Correspondencia desde la aplicación hacia los documentos

| Funcionalidad real | Referencia | Ajuste |
| --- | --- | --- |
| Clientes y autorización | RF-01–04, RF-DAT-01/02, CU-01 | Datos técnicos y evidencia de autorización separados; alta desde orden alineada. |
| Supresión | RF-DAT-03, CU-09, D-08 | Campos, notas, historial, fotos, copias y conservación (H01). |
| Recepción/agenda | RF-05–10, CU-02 | Ordenación y recepción incompleta (H08/H28). |
| Prendas, notas, fotos, sugerencias | RF-17–32, RF-50, CU-03/04 | Estados, borrado físico, cancelación de cámara y tamaño. |
| Entrega parcial/total, cancelación/reapertura | RF-11–16/24/48, CU-06, D-10/11 | Todas las rutas, deuda y excepción de reapertura. |
| Abonos, medios, anulación y cartera | RF-33–38, RF-OP-01, CU-05 | Corrección ≠ devolución; sobrepago ≠ idempotencia. |
| WhatsApp y recibo | RF-39/42/REC-01, CU-07, D-03/09 | Datos completos; preparar/compartir no demuestra envío. |
| Telegram y reporte diario | RF-40/41 y casos por actor | Contador, garantía diaria y destinatario claros; identificar reporte diario como función propia. |
| Reportes/buscador | RF-43–49/70 | Diccionario de métricas; búsqueda de prendas pendiente explícita. |
| Alarmas locales | RF-68, RNF-31 | Ensayo en teléfono, permisos y horizonte de programación. |
| Clave, huella y bloqueo | RNF-07–09, D-12 | Conservar correcciones; alinear diagramas. |
| Respaldos | RNF-17/18/25, CU-08 | Límite, faltantes, contraseña y recuperación conjunta. |
| Ayuda, vibración y cargas | RNF-24 y arquitectura | Tutorial actualizado; enlazar funciones adicionales si la rúbrica exige trazabilidad individual. |
| Actualización por APK y demostración Docker | Arquitectura, D-13, D-14, manual técnico | Decisiones técnicas; no implican servidor multiusuario. Capgo/OTA retirado (D-14). Evidencia de P-07 pendiente. |

## Históricos y propuestas archivadas

Los 18 originales se identifican con hash en inventario.json y se conservan. No reescribirlos para que aparenten describir la versión actual.

- Costura.docx/md: fuentes de procedencia y HU/CP originales; falta enlazar su mapeo vigente, no restaurar requisitos retirados.
- Mejoras fase 1/fase 2: no reutilizar promesas de respaldo «inmortal» o aprendizaje automático como capacidades verificadas.
- SRS 0.1/protocolo borrador: conservan la recepción incompleta; vincular decisión que la sustituya (H28).
- Script MySQL: correctamente rotulado histórico; no usar para instalar. La app ejecuta migraciones SQLite.
- Auditorías, verificar.mjs y resultados.json: fallos antiguos y registro de correcciones. Los 14 resultados históricos no son 14 defectos actuales.
- Revisión del equipo del 7 de octubre: investigación exploratoria de alternativas; enlazar desde paquete vigente y distinguir fabricante de ensayo real.
- PROPUESTA_WEB_APP y propuesta-venta (PRD, arquitectura, contrato, escenarios y ADR): futura tienda, contrato parcial y pruebas no ejecutadas. No exigir sus endpoints al APK local. Sus diagramas se renderizaron, no se validaron contra una tienda inexistente.

## Secuencia de cierre

1. Corregir instrucciones y promesas urgentes de H01–H06 y H21.
2. Conciliar recepción (H28) y procedimiento de devoluciones/cancelaciones con anticipo con la dueña.
3. Correcciones puntuales propuestas: H07/H08/H11/H17/H18/H24/H25, cada una con su escenario, conservando Sonar y protecciones existentes.
4. Sincronizar estados, capas, matriz, casos, manuales y evidencia por versión.
5. Probar con la dueña: [protocolo UX adjunto](PROTOCOLO_UX.md), Android, fotos, alarmas, huella, recuperación y RNF cuantitativos pendientes.
6. Cerrar rúbrica, inglés, APK/documentos y ensayo de sustentación.

## Fuentes externas verificadas

Consulta: 8 de octubre de 2026. Discrepancias concretas; no certificación jurídica integral ni estudio tributario/municipal.

- **L1:** [Ley 1480, art. 18 — fuente oficial](https://www.cancilleria.gov.co/normograma/compilacion/docs/ley_1480_2011.htm). Recibo y custodia; contempla precio/fecha aún no conocidos, información y aceptación posteriores.
- **L2:** [Ley 1581, arts. 9 y 12 — fuente oficial](https://www.cancilleria.gov.co/normograma/compilacion/docs/ley_1581_2012.htm). Autorización, información e identificación/contacto del responsable.
- **L3:** [Decreto 1074, capítulo 56 incorporado por Decreto 1413 — fuente oficial](https://cancilleria.gov.co/sites/default/files/Normograma/docs/decreto_1074_2015_pr038.htm). Comunicación formal y plazos diferentes de la alerta interna. Se verificó en Cancillería tras errores de apertura en Función Pública.
- **L4:** [Android: almacenamiento específico de la app](https://developer.android.com/training/data-storage/app-specific). Los archivos propios se eliminan al desinstalar; restaurar un respaldo es una operación diferente.

## Pendientes de esta revisión

Se entrega revisión documental y estática con evidencia. Quedan recorrido interactivo posterior al cambio de contraseña, teléfono de la dueña, rendimiento, decisión H28 y validación de facilidad de uso. No se afirman resultados de esas actividades.
