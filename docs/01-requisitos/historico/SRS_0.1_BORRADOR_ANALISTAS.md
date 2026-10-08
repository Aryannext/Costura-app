# Especificación consolidada de requisitos — Costura-app

**Atelier Manager · SRS 0.1 · 7 de octubre de 2026**

**Estado: borrador revisado documentalmente, pendiente de validación.** Es la versión de trabajo para conciliar el alcance actual; todavía no es una línea base aprobada por la dueña o el instructor. Crear este documento no implementa funciones ni demuestra que las existentes superen sus criterios.

La palabra **debe** expresa un requisito, no un resultado de prueba. Los criterios de esta edición son propuestas comprobables, con pendientes visibles. La falta de una medición no demuestra que una función falle, pero impide afirmar que está verificada.

Para una primera lectura, revisar alcance, decisiones pendientes y protocolo de aceptación. Los catálogos conservan el detalle para desarrollo y sustentación.

## 1. Control, propósito y fuentes

**Propósito:** establecer qué se necesita, con qué origen y cómo se comprobará, evitando mezclar intención histórica, código y aceptación real.

**Datos confirmados por el solicitante el 7 de octubre de 2026:** entrega el **25 de octubre de 2026**; usuaria principal, su mamá en su taller. Ubicación de referencia: Florencia, Caquetá, Colombia, según antecedentes y D-01.

**Confirmación adicional del solicitante en este avance:** a veces se recibe la prenda y queda pendiente el precio o la fecha de entrega. Es una necesidad declarada directamente por el solicitante; no se precisó cuál dato falta en cada situación ni cómo se acuerda después. P-SRS-02 pasa a parcialmente resuelto: el caso existe; falta definir el proceso. No se debe exigir inventar esos datos para poder registrar la recepción.

**Versión técnica inspeccionada:** aplicación 1.1.2; HEAD local e9c8a6a2bbed7a731c219b0a50996c1e9ec135af. La revisión anterior comprobó igualdad de árbol con main publicado c84e7c9a2acd581d18f00343dfcdf4d627f65d2e: c03c428bce00fe056225127aa54ad06875e8ba0c. En esta edición se releyeron HEAD y estado local; no se volvió a consultar main remoto. El contenido base contiene migraciones hasta la versión 7. Al cierre, Git mostró un diff local adicional con migración 8; se registra abajo como actualización concurrente, sin atribuirle el resultado CI del commit base. Ninguna versión de archivo demuestra por sí sola el esquema instalado en un teléfono.

**Método:** configuraciones portables 00–07, versión 1.1, leídas en la revisión precedente; en este avance se aplican principalmente especificación, modelado, trazabilidad y gestión de cambios. Se realiza como trabajo de la IA principal; los subagentes anteriores no completaron sus informes por límite de uso.

| Fuente | Contenido y límite |
| --- | --- |
| S-01 — [Costura.md](Costura.md) | Especificación histórica; RF-01–49, RNF-01–23 y RN-01–40. Se conserva sin editar. No acredita práctica observada ni aprobación actual |
| S-02 — [Mejoras Fase 1](MEJORAS_ADICIONALES_FASE1.md) | RF-50 y RNF-24–27; afirmaciones de beneficios se tratan como declaradas |
| S-03 — [Trazabilidad](../04-calidad/TRAZABILIDAD.md) | Correspondencias y correcciones registradas; sus marcas de verificación y recuentos requieren evidencia/versión, ANA-H06 |
| S-04 — [Decisiones](../05-gestion/DECISIONES.md) | D-01–D-13; fuente de cambios documentados. No se transforma automáticamente en aprobación de todas las reglas por la usuaria |
| S-05 — [Fase 2](COSTURA_FASE2_REQUISITOS.md) | RF-61–71 y RNF-28–31; RF-68/70 y autonomía ya aparecen en la implementación, con diferencias indicadas |
| S-06 — [Revisión del equipo](REVISION_EQUIPO_ANALISTAS_2026-10-07.md) | ANA-H01–H06, fuentes oficiales y alcance de verificación previo |
| S-07 — [Plan de entrega](../05-gestion/PLAN_19_DIAS.md) | Entregables académicos declarados. No se leyó la rúbrica/proyecto formativo original; confirmar P-SRS-01 |
| S-08 — [Diagramas existentes](../02-diseno/DIAGRAMAS.md) | Referencia de diseño; representar código no confirma necesidades. No se renderizaron en este avance |

Fuentes de implementación usadas para inspección, no como sustituto de la necesidad:

| Código | Archivos / comprobación |
| --- | --- |
| C-01 | [Clientes](../../src/database/queries/clientes.js) y [validadores](../../src/services/validators.js): altas, autorización, edición y supresión |
| C-02 | [Órdenes](../../src/database/queries/ordenes.js) y [useOrdenes](../../src/composables/useOrdenes.js): recepción, estados explícitos e historial |
| C-03 | [Estados](../../src/services/estadoOrden.js), [transiciones](../../src/database/queries/estadoOrden.js), [usePrendas](../../src/composables/usePrendas.js) y validadores |
| C-04 | [Saldos](../../src/database/queries/saldo.js), validadores y muestra de [pruebas de reglas](../../src/__tests__/reglasNegocio.spec.js): revisados en este trabajo y/o revisión precedente; no reejecutados |
| C-05 | [Avisos y recibos](../../src/composables/useOrdenTelegram.js), [WhatsApp](../../src/services/whatsapp.js), [recordatorios](../../src/composables/useNotificaciones.js) y [consultas de notificaciones](../../src/database/queries/notificaciones.js) |
| C-06 | [Reportes](../../src/database/queries/reportes.js) y [vencimientos](../../src/services/vencimientos.js) |
| C-07 | [Búsqueda](../../src/database/queries/search.js): clientes y órdenes, límites de 10 y 20 resultados |
| C-08 | [Notificaciones locales](../../src/composables/useNotificacionesLocales.js): planificación de siete días a las 8:00 y permisos |
| C-09 | [Respaldo/restauración](../../src/composables/useBackupRestore.js) y [almacenamiento de fotos](../../src/services/photoStorage.js) |

Referencias normativas registradas en S-06, consultadas el 7 de octubre de 2026; no se repitió una investigación jurídica completa en esta edición:

- **L-01:** [Ley 1581 de 2012, arts. 2, 9 y 12 — Cancillería](https://www.cancilleria.gov.co/normograma/compilacion/docs/ley_1581_2012.htm). Datos de clientes, autorización cuando proceda, finalidades e información al titular. Los mecanismos propuestos de evidencia requieren concreción; no son una certificación.
- **L-02:** [Ley 1480 de 2011, art. 18 — Cancillería](https://www.cancilleria.gov.co/normograma/compilacion/docs/ley_1480_2011.htm). Recepción de bienes para servicio: recibo, custodia y condiciones de devolución. Un indicador operativo no autoriza disposición o venta.
- **L-03:** [Decreto 1413 de 2018 — Función Pública](https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=87866). Procedimiento de bienes no retirados, incorporado al Decreto 1074. S-06 registra recuperación del texto por resultados oficiales y fallo de apertura directa; revisión consolidada pendiente antes de diseñar esa capacidad.

No se afirma conformidad formal con IEEE 830, ISO/IEC/IEEE 29148, UML ni otra norma. La estructura se adopta por utilidad; P-SRS-01 resuelve el formato que efectivamente exige el instructor.

### Actualización de fuentes detectada al cierre

La consulta de Git mostró modificaciones concurrentes en código y documentación que no fueron realizadas por esta edición del SRS. Se preservaron y se inspeccionaron los diffs pertinentes:

- Migración 8 y aviso de privacidad versión 2; el aviso identifica WhatsApp/Telegram, y las nuevas autorizaciones registran versión.
- Supresión que también limpia nombres en determinados avisos preparados. No demuestra eliminación de todo dato identificable en notas, fotos o copias.
- Recibo que añade teléfono/dirección disponibles y garantía/condiciones configuradas. Los campos ausentes se omiten; su presencia opcional no demuestra completar el recibo en todos los casos.
- Advertencia de revalidación añadida a fase 2 y cambios en decisiones/manuales.
- D-09 registra, como declaración atribuida a la dueña, 30 días hábiles para recoger/pagar y conservación de hasta seis meses una vez pagada la prenda. Esta edición no presenció esa consulta y no transforma esa declaración en plazo legal ni en confirmación del solicitante en este chat. P-SRS-13 delimita su aplicación.

Los catálogos conservan las necesidades y criterios; las celdas pertinentes incorporan esa evidencia parcial. El diff no fue sometido aquí a pruebas ni revisión completa. La lectura directa disponible y la consulta externa de Git no mostraron una única vista actualizada de todos los archivos; por ello se distingue la base identificada de estas diferencias de cierre y no se certifica una versión final integrada.

## 2. Necesidades, participantes y vocabulario

**Problema declarado:** la encargada necesita recuperar la relación entre una prenda física, su cliente, arreglo, fecha, avance y saldo. Los documentos describen confusiones/olvidos; no se dispone aquí de mediciones de frecuencia o pérdida económica ni de observación directa del taller.

| Necesidad | Origen | Resultado a validar |
| --- | --- | --- |
| N-01 Identificar y recuperar trabajo | S-01, D-01/D-02 | Localizar una prenda y su encargo sin reconstruirlos de memoria; incluye una identificación física por comprobar |
| N-02 Organizar compromisos | S-01, D-01/D-10 | Distinguir lo pendiente, listo, atrasado y entregado, con fechas comprensibles |
| N-03 Controlar cobros | S-01, D-05/D-11 | Explicar total, abonos y deuda sin duplicar ni perder pagos |
| N-04 Comunicar al cliente | S-01, D-03/D-04 | Facilitar el aviso y distinguir preparación, envío externo y recepción desconocida |
| N-05 Conservar y recuperar información | D-06, RNF-17/18 | Trabajar localmente y recuperar datos/fotos desde una copia cuyo alcance se conoce |
| N-06 Tratar datos e informar adecuadamente | D-08/D-09, S-06, L-01/L-02 | Aviso y recibo coherentes; condiciones y evidencia pendientes identificadas |

**Participantes:** encargada/dueña (operadora y fuente de decisiones del taller); cliente (entrega/retira, paga y recibe comunicaciones; sin cuenta en esta app); aprendiz (desarrolla y conserva evidencia); instructor (define evaluación). Telegram, WhatsApp y servicios nativos son dependencias externas; el reloj y la base local son componentes, no personas aprobadoras.

**Glosario:**

- **Orden:** encargo de un cliente con cero o más prendas. Vacía aún no cuenta como activa.
- **Prenda:** elemento físico con tipo, arreglo, valor y estado; las fotos son evidencia opcional según implementación.
- **Recepción:** fecha en que se recibió el bien. El campo actual se llama fecha_creacion y admite fechas anteriores; no debe confundirse con el instante de captura, P-SRS-02.
- **Estados de orden:** Pendiente, En Proceso, Lista para Entregar, Entregada y Cancelada.
- **Estados de prenda:** Pendiente, En Proceso, Terminada y Entregada.
- **Orden activa:** En Proceso o Lista para Entregar para los indicadores actuales; no significa cualquier registro existente.
- **Pago vigente:** abono registrado que no fue anulado. Registrar dinero no lo transfiere.
- **Saldo:** suma de prendas menos pagos vigentes; entrega física y pago completo son hechos distintos.
- **Aviso preparado:** texto/enlace disponible para enviar; no acredita envío/lectura del cliente.
- **Sin reclamar:** clasificación operativa de seguimiento. No equivale a abandono legal.
- **Respaldo:** copia cifrada con datos y fotos según lo realmente incluido; no garantiza recuperar cambios posteriores ni archivos omitidos.

## 3. Alcance de esta entrega y estados del documento

**Alcance reconstruido desde D-03/D-06/D-13:** un taller, una cuenta operativa, Android con almacenamiento local, clientes, órdenes, prendas, pagos, seguimiento, historial, comunicación manual por WhatsApp y Telegram opcional para la encargada. Respaldo mediante archivo o Telegram. La versión web sirve para demostración/uso local del navegador y distribución; no sincroniza datos entre equipos.

Las tareas locales deben poder continuar sin red. WhatsApp, Telegram y las actualizaciones dependen de condiciones externas. Biometría y alarmas dependen de plataforma/permisos. La identificación física de bolsas/prendas propuesta en D-02 es una actividad del taller que debe acompañar al software.

**Fuera del alcance documentado:** tienda pública, venta de ropa no recogida, pasarela de pago, múltiples talleres, sincronización, roles de varias personas e impresión Bluetooth directa. iOS no se declara plataforma entregada. Nuevas capacidades no se incorporan solo por estar descritas como futuras.

### Cómo leer los catálogos

Cada fila conserva ID, añade revisión, requisito, criterio y origen. **Rev. 1** conserva el sentido de la fuente, con aclaraciones de comprobación; **rev. 2** propone una revisión material y se explica en §10. Los sufijos DAT, REC, OP y LOC identifican propuestas/capacidades no numeradas antes; no ocupan los IDs históricos reservados.

Separar tres cosas:
1. **Necesidad:** declarada, confirmada específicamente o pendiente; código no la confirma.
2. **Documento:** todas las filas están redactadas; las propuestas materiales siguen pendientes de validación competente.
3. **Implementación:** inspeccionada estáticamente, declarada por una fuente, parcial o no comprobada. Ninguna equivale a prueba ejecutada en el taller.

Cada criterio de fila se identifica como **CA-[ID del requisito]** dentro de esta revisión. Los PA enlazados son grupos de escenarios del [protocolo de aceptación](../04-calidad/PROTOCOLO_ACEPTACION_SRS.md), todos no ejecutados en esta entrega.

La prioridad propuesta es resolver ANA-H01/H02 y decisiones que cambian comportamiento, consolidar alcance, después comprobar integridad/recuperación y uso real. No se presenta esta propuesta como aprobación de la dueña.


**Brecha de recepción confirmada en este avance:** el solicitante declara que a veces recibe sin precio o fecha definitiva. C-03 exige valor positivo; OrdenForm.vue exige fecha de entrega y migrations.js la declara NOT NULL. Por tanto, falta un recorrido explícito para acuerdos pendientes. RF-05/06/19 y RF-REC-01 deben representar ese caso; antes de cambiar el esquema se precisa qué dato falta y cómo se acepta el acuerdo posterior. No se cierra P-SRS-02 con un precio de cero ni una fecha ficticia.

## 4. Requisitos funcionales conservados

Origen común RF-01–49: S-01; RF-50: S-02. Las fuentes adicionales explican revisiones, sin borrar el texto histórico. Cada fila incluye su criterio mínimo; no pretende agotar todas las combinaciones.

### 4.1 Clientes — N-01 / N-06

| ID / rev. | Requisito | Criterio de aceptación propuesto | Origen / comprobación | Evidencia y límites |
| --- | --- | --- | --- | --- |
| RF-01 / 2 | Registrar cliente con nombre y teléfono, comprobando la autorización aplicable antes de guardar. | Sin nombre, teléfono o autorización requerida no se crea el registro; con datos válidos se puede recuperar. No exigir teléfono único. | S-01; C-01; RF-DAT-01/02; PA-01 | Inspección parcial de validación y acceso a datos; privacidad pendiente. |
| RF-02 / 1 | Consultar los datos de un cliente registrado. | Seleccionar dos clientes distintos y comprobar que cada detalle corresponde al elegido; informar si no existe. | S-01; S-03; PA-01 | Documentado; recorrido de pantalla pendiente. |
| RF-03 / 1 | Actualizar los datos de un cliente sin cambiar su identidad interna. | Corregir nombre/teléfono y comprobar la persistencia y el vínculo de sus órdenes; rechazar datos obligatorios vacíos. | S-01; C-01; PA-01 | Inspección parcial; prueba de interfaz pendiente. |
| RF-04 / 1 | Consultar las órdenes asociadas a un cliente. | El historial incluye sus órdenes y excluye las de otro cliente. | S-01; C-01; PA-01 | Consulta inspeccionada; aceptación pendiente. |

### 4.2 Órdenes y entregas — N-01 / N-02

| ID / rev. | Requisito | Criterio de aceptación propuesto | Origen / comprobación | Evidencia y límites |
| --- | --- | --- | --- | --- |
| RF-05 / 2 | Crear una orden asociada a un cliente existente, registrando la fecha de recepción. | Admite recepción de hoy o anterior; rechaza futura y cliente inexistente. Nace Pendiente, sin prendas ni importes inventados. | S-01; C-02; RN-03/04; PA-02 | Código inspeccionado; fecha de recepción y fecha de captura deben distinguirse, P-SRS-02. |
| RF-06 / 2 | Registrar fecha estimada de entrega coherente con la recepción. | Una entrega anterior a recepción se rechaza. El caso de fecha todavía desconocida queda pendiente, sin inventar una fecha para salvar el formulario. | S-01; C-02; RN-05; PA-02 | Validación inspeccionada; P-SRS-02. |
| RF-07 / 1 | Consultar información general de una orden. | Coinciden cliente, identificador, fechas, estado, total y saldo con los datos guardados; al cambiar de orden no persiste el detalle anterior. | S-01; C-02; PA-02 | Datos inspeccionados; interfaz pendiente. |
| RF-08 / 2 | Listar órdenes pendientes de finalizar, distinguiendo órdenes vacías, En Proceso y Listas. | Las órdenes sin prendas se identifican como Pendiente y no inflan indicadores de órdenes activas; Entregadas/Canceladas se distinguen. | S-01; D-10; RN-04; PA-03 | Aclaración propuesta del término pendiente; confirmar lectura con usuaria. |
| RF-09 / 1 | Permitir consultar órdenes por fecha estimada de entrega. | Con fechas diferentes, verificar orden ascendente en la consulta destinada a próximos compromisos; registrar tratamiento de fechas desconocidas si se admiten. | S-01; C-06; PA-03 | Consulta de próximas entregas inspeccionada; no se acredita toda ordenación de listados. |
| RF-10 / 2 | Consultar órdenes activas atrasadas. | Incluye En Proceso/Listas con fecha prometida anterior al día local; excluye vacías, entregadas, canceladas y las que vencen hoy. | S-01; C-06; RN-04; PA-03 | Filtro inspeccionado. |
| RF-11 / 1 | Cancelar una orden antes de su entrega cuando el cliente retire el trabajo. | Cambia a Cancelada y conserva pagos e historial; tratamiento de anticipos y prendas ya entregadas requiere P-SRS-04. | S-01; C-02; RN-11–14; PA-06 | Operación inspeccionada; política de excepciones pendiente. |
| RF-12 / 1 | Impedir cancelar una orden Entregada. | El intento produce rechazo y mantiene estado, pagos e historial sin registrar una cancelación exitosa. | S-01; C-02; PA-06 | Validador inspeccionado; comprobar también invocaciones internas. |
| RF-13 / 1 | Permitir reapertura explícita de una orden Entregada por la encargada autenticada. | La reapertura procede solo desde Entregada y queda identificada; no se interpreta como cancelación ni devolución de dinero. | S-01; C-02; RN-15/16; PA-06 | Código inspeccionado; P-SRS-03 sobre prendas tras reabrir. |
| RF-14 / 1 | Registrar la reapertura en el historial de la orden. | Tras reabrir, existe evento de reapertura con fecha/hora, asociado a la orden correcta. | S-01; C-02; PA-06 | Código inspeccionado. |
| RF-15 / 1 | Registrar entrega individual de una prenda terminada. | Entregar una Terminada la cambia a Entregada; intentar entregar una Pendiente se rechaza. | S-01; C-03; RN-07/08; PA-04 | Validador inspeccionado; prueba de dispositivo pendiente. |
| RF-16 / 1 | Distinguir prendas pendientes y entregadas dentro de una orden. | Una orden con entrega parcial muestra cuáles faltan sin marcar todas como entregadas. | S-01; S-03; PA-04 | Documentado; P-SRS-03. |

### 4.3 Prendas, notas y fotos — N-01 / N-02 / N-05

| ID / rev. | Requisito | Criterio de aceptación propuesto | Origen / comprobación | Evidencia y límites |
| --- | --- | --- | --- | --- |
| RF-17 / 1 | Registrar una prenda en una orden existente. | Una orden abierta admite prenda válida; una entregada/cancelada la rechaza; no se permite prenda huérfana. | S-01; C-03; RN-12/18; PA-02 | Código inspeccionado. |
| RF-18 / 1 | Registrar la descripción del arreglo solicitado. | Una descripción vacía o solo espacios se rechaza; la válida queda en la prenda seleccionada. | S-01; C-03; RN-19; PA-02 | Validador inspeccionado. |
| RF-19 / 1 | Asignar un valor a la prenda. | Rechazar cero/negativo; una corrección no puede dejar total inferior a pagos vigentes. Precio por determinar: P-SRS-02. | S-01; C-03; RN-20/29; PA-05 | Validaciones inspeccionadas; política de precio pendiente. |
| RF-20 / 1 | Consultar el estado actual de una prenda. | Mostrar uno de los cuatro estados del glosario según el registro, también después de recargar. | S-01; S-03; PA-04 | Documentado; ver modelo M-SRS-01. |
| RF-21 / 1 | Actualizar el estado de una prenda respetando las transiciones permitidas. | Un cambio válido se conserva y recalcula la orden; un rechazo mantiene el estado anterior visible. | S-01; C-03; PA-04 | Orquestación inspeccionada; escenarios de corrección pendientes. |
| RF-22 / 1 | Consultar las prendas de una orden. | El detalle incluye todas las de esa orden y ninguna ajena; sin prendas muestra lista vacía comprensible. | S-01; S-03; PA-02 | Documentado; prueba de pantalla pendiente. |
| RF-23 / 1 | Recalcular el total desde los valores de las prendas. | Prendas de $20.000 y $10.000 generan total $30.000; editar/eliminar recalcula sin acumular diferencias. | S-01; C-04; PA-05 | Fórmula inspeccionada. |
| RF-24 / 2 | Derivar Lista para Entregar cuando no quede trabajo pendiente y exista al menos una prenda sin entregar. | Terminada+Terminada o Entregada+Terminada: Lista; cualquier Pendiente/En Proceso: En Proceso; todas Entregadas: Entregada; sin prendas: Pendiente. Excepción de reapertura explícita: P-SRS-03. | S-01; D-10; C-03; RN-06/09/10/17; PA-04 | Reconciliación propuesta, no confirmación de negocio. |
| RF-25 / 1 | Añadir una observación a una prenda. | Una nota válida se conserva en la prenda correcta y genera el evento exigido por RN-35; no añadir notas vacías. | S-01; C-03; PA-07 | Orquestación inspeccionada; evitar datos personales innecesarios. |
| RF-26 / 1 | Consultar observaciones de una prenda. | Recupera sus notas y distingue ausencia de notas de un error de consulta. | S-01; C-03; PA-07 | Consulta declarada/inspeccionada parcialmente. |
| RF-27 / 1 | Capturar una foto de una prenda. | Con permiso, la captura se vincula a la prenda; al cancelar o denegar permiso no crea foto ficticia ni anuncia guardado inexistente. | S-01; C-03; PA-07 | Código inspeccionado; ejecución nativa pendiente. |
| RF-28 / 1 | Guardar una o varias fotos asociadas a una prenda. | Dos fotos guardadas pueden recuperarse tras cerrar y abrir; un fallo no deja una referencia que se presente como foto disponible. | S-01; C-03; RN-22/23; PA-07 | Implementación parcial inspeccionada; almacenamiento por probar. |
| RF-29 / 1 | Consultar las fotografías registradas. | La galería corresponde a la prenda elegida; un archivo ausente se informa sin atribuir la foto de otra prenda. | S-01; S-03; PA-07 | Documentado; casos negativos pendientes. |
| RF-30 / 1 | Visualizar una fotografía desde el detalle de la prenda. | Abrir y cerrar una foto conserva la orden/prenda de origen; RNF-23 define tiempo declarado. | S-01; S-03; PA-07/12 | Documentado; medición pendiente. |
| RF-31 / 1 | Corregir descripción y valor de una prenda. | Conserva el vínculo a su orden y recalcula total/saldo; rechaza un precio que invalide pagos existentes. | S-01; C-03; RN-29; PA-05 | Código inspeccionado; permisos sobre órdenes cerradas: P-SRS-04. |
| RF-32 / 1 | Eliminar una fotografía registrada por error. | Deja de aparecer y conserva la prenda y sus importes; verificar eliminación efectiva del archivo y registro de actividad. | S-01; C-03; RN-40; PA-07 | Orquestación inspeccionada; no se asegura borrado físico completo sin prueba. |

### 4.4 Pagos — N-03

| ID / rev. | Requisito | Criterio de aceptación propuesto | Origen / comprobación | Evidencia y límites |
| --- | --- | --- | --- | --- |
| RF-33 / 1 | Registrar abonos en una orden que pueda recibirlos. | Rechaza importes no positivos, superiores al saldo actual u órdenes canceladas; no acepta dos cobros que excedan el saldo por doble toque. | S-01; C-04; RN-25–30; PA-05 | Fórmula/validadores y pruebas inspeccionados; no reejecutados. |
| RF-34 / 2 | Registrar el método del abono: efectivo, Nequi, Daviplata, transferencia o Bre-B según catálogo. | El pago conserva el método elegido. Registrarlo no realiza ni confirma una transferencia financiera. | S-01; D-05; PA-05 | Catálogo documentado; verificación de recepción del dinero es del taller. |
| RF-35 / 2 | Consultar pagos y anulaciones de una orden. | Muestra valor, método, fecha y anulación/motivo cuando exista; los anulados se distinguen y no suman como ingresos. | S-01; S-03 P1-9; C-04; PA-05 | Revisión propuesta que incorpora corrección documentada. |
| RF-36 / 2 | Calcular saldo como total de prendas menos suma de pagos no anulados. | Con total $30.000 y abono $10.000, saldo $20.000; anular ese abono devuelve saldo $30.000 sin borrar el evento. | S-01; C-04; RN-27–29; PA-05 | Fórmula inspeccionada. |
| RF-37 / 2 | Consultar órdenes con saldo por cobrar, incluidas las entregadas. | La suma de la lista coincide con el total por cobrar; excluye Canceladas según implementación. Tratamiento de deuda cancelada: P-SRS-04. | S-01; D-11; C-04/C-06; PA-05 | Criterio actual inspeccionado; política pendiente. |
| RF-38 / 2 | Mostrar Pagada cuando una orden con valor por cobrar quede saldada. | Total positivo y saldo cero: Pagada; saldo positivo: Pendiente. Una orden vacía no debe aparentar un cobro completado. | S-01; C-03; RN-28; PA-05 | Estado derivado inspeccionado. |

### 4.5 Comunicación — N-04 / N-06

| ID / rev. | Requisito | Criterio de aceptación propuesto | Origen / comprobación | Evidencia y límites |
| --- | --- | --- | --- | --- |
| RF-39 / 2 | Preparar y abrir un aviso de orden lista en WhatsApp por acción de la encargada. | Solo procede estando Lista; usa datos actuales; indica preparado. Volver sin enviar no registra entrega al cliente. | S-01; D-03/04; C-05; PA-08 | Inspección; revisión de automático a manual propuesta según decisiones. |
| RF-40 / 2 | Facilitar recordatorios para recoger órdenes Listas mediante enlaces de WhatsApp. | La lista opcional enviada al Telegram de la encargada se registra solo tras respuesta exitosa de ese servicio; no equivale a envío al cliente. Fallo permite reintento. | S-01; D-03; C-05; RN-33; PA-09 | Inspección; frecuencia manual y recordatorios anticipados: P-SRS-05. |
| RF-41 / 2 | Consultar el historial de eventos de comunicación por orden/cliente. | Distingue aviso pendiente, WhatsApp preparado y mensaje remitido al Telegram de la encargada, con fecha/hora; nunca deduce lectura del cliente. | S-01; C-05; RN-32; PA-08/09 | Textos actuales parcialmente distinguen; recorrido completo pendiente. |
| RF-42 / 2 | Generar un recibo con información actual de la orden para compartir con el cliente, o enviarlo al Telegram de la encargada. | Prendas, precios, pagos vigentes y saldo corresponden al momento de generar. Campos y excepciones adicionales: RF-REC-01; no se presenta como factura. | S-01; D-03/09; C-05; PA-10 | Cambian canal/destinatario respecto del original; el diff local añade contacto/garantía opcionales. Completar configuración y comprobar casos, ANA-H02. |

**Excepción externa:** abrir WhatsApp no demuestra que el sistema operativo haya abierto correctamente la aplicación ni que la persona haya enviado. El código usa apertura de enlace; el contrato debe limitar la confirmación a lo observable y tratar fallos detectables. Un mensaje enviado al bot de la encargada no cambia el destinatario del aviso al cliente.

### 4.6 Seguimiento y búsqueda — N-01 / N-02 / N-03

| ID / rev. | Requisito | Criterio de aceptación propuesto | Origen / comprobación | Evidencia y límites |
| --- | --- | --- | --- | --- |
| RF-43 / 2 | Consultar órdenes activas próximas a vencer según anticipación configurada. | Con N=3, incluye hoy y hasta hoy+3; con N=0, solo hoy; atrasadas se muestran por separado. | S-01; C-06; RN-38; PA-03 | Lógica inspeccionada; configuración actual de 0 a 30 días. |
| RF-44 / 2 | Consultar ingresos del período a partir de pagos vigentes fechados en ese período. | Extremos incluidos; excluye pagos anulados. No confundir ingreso recibido con valor de órdenes creadas. | S-01; C-06; PA-11 | Consulta inspeccionada. |
| RF-45 / 2 | Consultar el total actual por cobrar. | Coincide con RF-37, incluye deuda de órdenes entregadas y refleja anulaciones; no se interpreta como ingreso del período. | S-01; C-04/C-06; PA-05/11 | Consulta inspeccionada; Canceladas: P-SRS-04. |
| RF-46 / 1 | Consultar el historial de actividades de una orden. | Recupera eventos con fecha/hora, tipo y descripción de la orden correcta; incluye reaperturas y correcciones relevantes. | S-01; C-02; RN-35; PA-06/07 | Consulta inspeccionada; alcance de toda modificación: P-SRS-04. |
| RF-47 / 2 | Identificar órdenes Listas que superen el plazo operativo sin recoger. | Con N=30, se marca cuando pasan más de 30 días desde la mayor fecha entre lista y entrega prometida; igual a 30 no. No declara abandono ni derecho de venta. | S-01; C-06; RN-37; PA-03; ANA-H05 | Regla actual documentada como operativa; cambio de origen temporal propuesto. |
| RF-48 / 1 | Registrar fecha y hora al pasar una orden a Entregada. | Entrega total manual o de la última prenda genera sello y evento; historial conserva entregas anteriores si se reabre. | S-01; C-02/C-03; RN-36; PA-04/06 | Inspección; comprobar historial en ciclos repetidos. |
| RF-49 / 1 | Buscar órdenes por nombre del cliente. | Una búsqueda coincidente devuelve órdenes del cliente; una sin coincidencias muestra lista vacía, sin perder los datos. | S-01; C-07; PA-13 | Consulta inspeccionada; límites de resultados deben ser visibles. |
| RF-50 / 1 | Sugerir descripciones de arreglos frecuentes durante el registro. | Con descripciones repetidas se ofrecen sugerencias sin obligar a elegirlas; se permite una descripción nueva. | S-02; C-03; PA-13 | Función accesible en código; validación de frecuencia pendiente. |

### 4.7 Funciones de fase 2 presentes o parciales — N-01 / N-02

| ID / rev. | Requisito | Criterio de aceptación propuesto | Origen / comprobación | Evidencia y límites |
| --- | --- | --- | --- | --- |
| RF-68 / 2 | Programar avisos locales de las entregas previstas para cada día. | A las 8:00, un aviso por día con entregas, dentro de los siete días programados; sin permiso se informa la limitación; no programa horas pasadas ni requiere Internet para dispararlos. | S-05; C-08; RNF-31; PA-14 | Revisión propuesta: original decía próximas a vencer; implementación cuenta entregas del día. |
| RF-70 / 1 | Buscar clientes, órdenes o prendas desde una barra mediante texto o números. | Probar coincidencias por entidad, identificador y texto, y ausencia de resultados; informar límites sin sugerir cobertura total. | S-05; C-07; PA-13 | Parcial: el código busca clientes y órdenes; no consulta prendas. Resolver P-SRS-06, sin borrarlo del requisito. |

RF-68 usa planificación de siete días y conteo por fecha de entrega. Eso difiere de una alarma continua de todas las órdenes “próximas a vencer”. RF-70 conserva el alcance original de prendas como brecha; no se elimina por estar ausente del código.

## 5. Requisitos de calidad y restricciones

Origen RNF-01–23: S-01; RNF-24–27: S-02; RNF-31: S-05. Los tiempos son umbrales declarados en esas fuentes, no resultados. Las modificaciones de formato/plataforma/alcance deben dejar decisión trazable.

| ID / rev. | Requisito | Criterio de aceptación propuesto | Origen / comprobación | Evidencia y límites |
| --- | --- | --- | --- | --- |
| RNF-01 / 1 | Mostrar detalle de una orden en menos de 2 s con hasta 500 órdenes. | Medir desde selección hasta datos visibles, con conjunto/entorno definidos en PA-12; conservar umbral estricto. | S-01; N-01; PA-12 | Medición pendiente, ANA-H04 / P-SRS-07. |
| RNF-02 / 1 | Registrar una orden válida en menos de 3 s. | Medir desde Guardar hasta confirmación de persistencia; especificar si incluye alta de cliente/prendas antes de evaluar. | S-01; N-01; PA-12 | Umbral heredado; frontera de operación y dispositivo pendientes. |
| RNF-03 / 1 | Actualizar saldo en menos de 1 s tras registrar un abono. | Medir desde confirmación del registro hasta saldo visible actualizado, sin ocultar el tiempo total de cobro. | S-01; N-03; PA-12 | Definición instrumental y medición pendientes. |
| RNF-04 / 1 | Registrar una orden en máximo tres pantallas consecutivas. | Contar pantallas del recorrido con cliente existente y definir aparte el caso de cliente nuevo; no excluir pasos silenciosamente. | S-01; N-01; PA-02 | Criterio declarado; prueba de usabilidad pendiente. |
| RNF-05 / 2 | Confirmar operaciones solo cuando su resultado esté comprobado por la app. | Error, cancelación del usuario o rechazo de regla no muestra éxito; compartir/preparar no se rotula entregado. | S-01; N-01/N-04; PA-02/07/08 | Aclaración propuesta; revisar todos los recorridos. |
| RNF-06 / 1 | Mantener controles e información utilizables desde 360 px de ancho. | Inspección a 360 px y dispositivos acordados: sin botones inaccesibles, solapamiento ni recorte de importes esenciales. | S-01; N-01; PA-15 | Ejecución visual pendiente. |
| RNF-07 / 2 | Exigir autenticación antes de acceder a información; admitir desbloqueo biométrico si el equipo lo soporta. | Contraseña incorrecta/ruta directa no expone datos; biometría no disponible permite contraseña. Cerrar el acceso inicial hasta cambiar clave de fábrica. | S-01; D-12; N-06; PA-15 | Decisión documentada; flujo completo no reejecutado. |
| RNF-08 / 2 | Guardar verificador hash de la contraseña de acceso, sin almacenar esa contraseña en texto claro. | Inspeccionar almacenamiento; cambio con clave actual, nueva de al menos 8 caracteres, distinta de anterior/fábrica y confirmación coincidente. | S-01; D-12; validators.js; PA-15 | Corrige cifrado por hash; no confundir clave de acceso con contraseña del respaldo. |
| RNF-09 / 2 | Cerrar sesión tras 15 minutos de inactividad y aplicar bloqueo al arranque/reanudación según D-12. | Arranque en frío bloqueado; regreso tras ausencia mayor de 2 minutos exige desbloqueo. Comprobar límite y cierre con reloj controlado. | S-01; D-12; N-06; PA-15 | Valores documentados; pendiente prueba nativa. |
| RNF-10 / 1 | Mantener integridad orden–cliente. | Intento de crear orden con cliente inexistente se rechaza sin orden huérfana. | S-01; RN-03; PA-02 | Comprobación propuesta sobre datos y flujo. |
| RNF-11 / 1 | Mantener integridad prenda–orden. | Orden inexistente no admite prenda ni genera éxito falso. | S-01; RN-18; PA-02 | Validación inspeccionada; prueba pendiente. |
| RNF-12 / 1 | Impedir pagos de valor cero o negativo. | Ambos intentos dejan pagos, saldo e historial de éxito sin cambios. | S-01; RN-26; PA-05 | Validador inspeccionado. |
| RNF-13 / 2 | Sustituido: el porcentaje de disponibilidad de un computador servidor deja de ser criterio de este alcance. | Preservar texto histórico; verificar funcionamiento local con RNF-LOC-01. | S-01; D-06; N-05 | Cambio ya registrado en antecedentes; no se inventa disponibilidad 100%. |
| RNF-14 / 2 | Sustituido: el acceso simultáneo desde dos dispositivos en red local queda fuera de alcance. | Cada instalación posee datos propios; no prometer sincronización ni usar restauración como edición simultánea. | S-01; D-06; N-05 | Cambio registrado; base local por instalación. |
| RNF-15 / 2 | Documentar y comprobar la compatibilidad de la demostración web. | Registrar versiones de Chrome, Firefox y Edge y recorrer funciones web acordadas; enumerar diferencias nativas. El servidor web sirve la app, no centraliza datos. | S-01; D-13; N-05; PA-15 | Compatibilidad original pendiente; no retirar navegadores para ocultar falta de prueba. |
| RNF-16 / 2 | Adaptar las tareas compatibles a móvil, tableta y computador. | Comprobar controles/lectura en tamaños acordados; cámara, huella y alarmas se describen según plataforma. | S-01; D-06/13; PA-15 | Alcance por plataforma pendiente; se revisa la promesa sin pérdida de funcionalidad. |
| RNF-17 / 2 | Generar un respaldo cifrado de datos y fotos según límites explícitos. | Salida a archivo/compartir sin bot; Telegram opcional. Informar número de fotos incluidas/omitidas y no afirmar copia externa guardada si solo se abrió compartir. | S-01; C-09; N-05; PA-16 | Código inspeccionado; comunicación parcial de fotos debe comprobarse. |
| RNF-18 / 2 | Restaurar un respaldo válido y comunicar exactamente lo recuperado. | Clave incorrecta/archivo inválido no modifica datos; comprobar recuperación de tablas y fotos. Un fallo de importación o fotos no se presenta como restauración completa. | S-01; C-09; N-05; PA-16 | Base y fotos son operaciones distintas; P-SRS-10. |
| RNF-19 / 1 | Registrar errores en un archivo de eventos útil para diagnóstico. | Provocar un error de prueba y localizar evento sin contraseñas, tokens ni datos personales innecesarios; definir acceso, retención y tamaño. | S-01; N-05/N-06; PA-17 | Pendiente: matriz declara solo console.error; política P-SRS-08. |
| RNF-20 / 1 | Separar presentación, lógica y acceso a datos. | Inspección de dependencias; registrar excepciones concretas y su tratamiento, sin declarar cumplimiento total por carpetas existentes. | S-01; N-05; PA-17 | Auditoría focalizada pendiente. |
| RNF-21 / 1 | Admitir las imágenes JPG, JPEG o PNG descritas en el requisito original. | Probar cada formato y explicar conversión a JPEG si se adopta; no afirmar carga arbitraria de archivos a partir de la cámara. | S-01; C-03; N-01; PA-07 | Formatos y origen de imagen requieren P-SRS-12. |
| RNF-22 / 1 | Aplicar el límite original de 10 MB por imagen aceptada. | Probar límite y exceso con datos definidos; precisar MB decimal o MiB y si se mide antes/después de conversión. | S-01; C-03; N-05; PA-07 | No demostrado por calidad/ancho de cámara; P-SRS-12. |
| RNF-23 / 1 | Mostrar una fotografía en menos de 3 s. | Medir desde solicitud hasta imagen visible, incluyendo una foto del tamaño máximo admitido y entorno registrado. | S-01; N-01; PA-12 | Medición pendiente. |
| RNF-24 / 1 | Mostrar una señal visual de carga mientras se consultan datos. | Con demora simulada, aparece indicador y luego datos/error; no deja indicador indefinido. | S-02; N-01; PA-15 | Especificación heredada de skeleton; recorrido pendiente. |
| RNF-25 / 2 | Mantener fotos en almacenamiento de datos de la app y recuperarlas desde respaldos válidos. | Cerrar/reabrir y limpiar solo caché no debe perderlas; desinstalar, borrar datos o perder el equipo exige copia recuperable. | S-02; C-09; N-05; PA-16 | Se elimina promesa de permanencia absoluta; prueba real pendiente. |
| RNF-26 / 2 | Asignar responsabilidades identificables a módulos y componentes. | Inspección justificada de un cambio: localizar regla, datos y presentación sin duplicar la regla. Documentar excepciones; cantidad de componentes no acredita SOLID. | S-02; N-05; PA-17 | Aclaración propuesta del criterio de mantenibilidad. |
| RNF-27 / 2 | Usar índices pertinentes y comprobar planes de consulta/rendimiento. | Relacionar índices con consultas reales y PA-12; no garantizar O(log N) para cualquier búsqueda o volumen. | S-02; N-01; PA-12/17 | Revisión propuesta de afirmación no sustentada. |
| RNF-31 / 1 | Disparar avisos locales programados sin Internet. | En teléfono de prueba sin red y con permisos apropiados se recibe el aviso programado; límites de planificación según RF-68. | S-05; C-08; N-02; PA-14 | Código inspeccionado; disparo nativo no ejecutado. |

**Respaldo actual:** C-09 usa un límite de fotos de 20 × 1024 × 1024 bytes para ambos destinos. Excederlo omite fotos; leer una foto puede fallar individualmente. El destino archivo no necesita bot. No afirmar copia “inmortal”, recuperación 100% ni supervivencia a desinstalación sin respaldo. Este límite describe implementación; su suficiencia operativa debe comprobarse.

## 6. Requisitos complementarios derivados del análisis

El siguiente catálogo distingue capacidades ya presentes sin ID propio de requisitos candidatos derivados de hallazgos. No convierte cada idea en trabajo aprobado para programar.

| ID / rev. | Requisito | Criterio de aceptación propuesto | Origen / comprobación | Evidencia y límites |
| --- | --- | --- | --- | --- |
| RF-DAT-01 / 1 | Informar antes de recoger datos: responsable y contacto, finalidades, canales externos usados y forma de ejercer derechos. | Con las integraciones habilitadas, comparar aviso y flujo; no afirmar solo local cuando hay envíos. Enlace a política/instrucciones accesibles según procedimiento definido. | S-06 ANA-H01; L-01; N-06; PA-01 | Candidato; revisión de tratamiento y contenido P-SRS-08. |
| RF-DAT-02 / 1 | Conservar evidencia consultable de la autorización cuando sea necesaria. | Propuesta: vincular titular, fecha, versión del texto informado, medio y evidencia de autorización; poder recuperar qué se autorizó aun si el aviso cambia. | S-06 ANA-H01; L-01; N-06; PA-01 | Candidato; el diff local incorpora fecha y versión del aviso. Medio, contenido recuperable y evidencia siguen por concretar. Este diseño no es una forma única impuesta por ley. |
| RF-DAT-03 / 1 | Permitir atender corrección o supresión según procedimiento y conservación justificados. | Identificar datos en cliente, fotos, notas, historial y copias; registrar alcance y razón de lo conservado. No presentar vaciado de tres campos como anonimización completa. | S-06 ANA-H01; L-01; N-06; PA-01 | Candidato; el diff limpia además nombres de avisos preparados. Notas/fotos/copias y conservación siguen por revisar. P-SRS-08. |
| RF-REC-01 / 1 | Generar un recibo de recepción con los datos pertinentes del artículo 18, además del detalle de RF-42. | Comprobar fecha, identidad/contacto de quien entrega, identificación/servicio de cada bien, abonos y garantía; precio/devolución cuando se conocen. Resolver aceptación posterior si son desconocidos. | S-06 ANA-H02; L-02; N-01; PA-10 | Candidato; el diff añade campos configurables/contacto, pero se omiten si faltan. Garantía aplicable y excepciones pendientes, P-SRS-02/09. |
| RF-OP-01 / 1 | Anular un pago con fecha y motivo sin borrar su rastro. | Rechaza motivo vacío o pago ya anulado; recalcula saldo/ingresos excluyéndolo, conserva consulta del pago y su evento. | S-03 P1-9; C-04; RN-14/35; PA-05 | Función existente documentada por primera vez con este ID; inspección parcial. |
| RF-OP-02 / 1 | Eliminar una prenda errónea con sus relaciones, protegiendo saldos y entregas. | Rechaza orden Entregada/Cancelada, prenda Entregada o total menor que lo pagado; si admite, recalcula estado/importe y registra actividad; comprueba fotos/observaciones. | S-03 P1-9; C-03; RN-29/35; PA-05/07 | Función existente; prueba de eliminación de archivos pendiente. |
| RNF-LOC-01 / 1 | Operar las tareas centrales con datos locales sin red. | Tras preparar instalación de prueba, crear/consultar/actualizar cliente, orden, prenda y pago sin conexión; reiniciar y comprobar persistencia. Mensajería externa se limita de forma explícita. | D-06; N-05; PA-02/16 | Reconstrucción de alcance existente; aceptación en Android pendiente. |
| RNF-REC-01 / 1 | Informar y gestionar recuperaciones parciales de datos y fotografías. | Forzar fallo en lectura de una foto o al restaurar; mostrar recuento y pendiente exactos y no anunciar recuperación total. Precisar política si fotos cambiaron antes del fallo de BD. | C-09; RNF-17/18; N-05; PA-16 | Candidato; P-SRS-10, sin prometer transacción única que el código no demuestra. |

## 7. Reglas de negocio y modelo de estados

Origen RN-01–40: S-01. Las revisiones incorporan D-03/D-10/D-11 y aclaran contradicciones. Son reglas consolidadas propuestas donde el texto cambia; no se infiere aprobación de todas ellas de la confirmación general del proyecto.

| ID / rev. | Regla consolidada | Relación / pendiente |
| --- | --- | --- |
| RN-01 / 1 | Nombre y teléfono son obligatorios para registrar cliente. | RF-01; PA-01 |
| RN-02 / 1 | Un teléfono puede pertenecer a varios clientes; no impone unicidad. | RF-01; PA-01 |
| RN-03 / 1 | Cada orden pertenece a un único cliente existente. | RF-05; RNF-10; PA-02 |
| RN-04 / 2 | La orden vacía existe como Pendiente; solo En Proceso y Lista son activas para indicadores/avisos. | D-10; RF-08/10/43; PA-03 |
| RN-05 / 2 | Entrega estimada no anterior a recepción declarada; diferenciar recepción de captura y contemplar valores desconocidos. | RF-05/06; P-SRS-02; PA-02 |
| RN-06 / 2 | Con al menos una prenda, ninguna sin terminar y alguna sin entregar, la orden pasa a Lista automáticamente. | D-10; RF-24; P-SRS-03; PA-04 |
| RN-07 / 1 | Se permiten entregas parciales de prendas terminadas. | RF-15/16; PA-04 |
| RN-08 / 2 | Cada prenda entregada queda Entregada; la acción de entrega total puede actualizar todas conjuntamente. | D-10; RF-15/48; PA-04 |
| RN-09 / 1 | Todas las prendas entregadas hacen que la orden quede Entregada; una orden vacía no cumple esta condición. | RF-24/48; PA-04 |
| RN-10 / 2 | Propuesta: la entrega parcial conserva Lista si lo restante está terminado; si queda trabajo pendiente, corresponde En Proceso. | Original decía conservar estado actual; conflicto con RN-17 explicitado en P-SRS-03; PA-04 |
| RN-11 / 1 | Una orden Entregada no se cancela. | RF-12; PA-06 |
| RN-12 / 1 | Una orden Cancelada no recibe prendas. | RF-17; PA-06 |
| RN-13 / 1 | Una orden Cancelada no recibe nuevos pagos. | RF-33; PA-06 |
| RN-14 / 1 | Cancelar una orden no elimina pagos registrados. | RF-11/35; P-SRS-04; PA-06 |
| RN-15 / 1 | Solo la encargada autenticada realiza la reapertura de una Entregada. | RF-13; RNF-07; PA-06 |
| RN-16 / 1 | La reapertura cambia explícitamente la orden a En Proceso. | RF-13/14; excepción respecto del cálculo automático; P-SRS-03; PA-06 |
| RN-17 / 2 | En una orden abierta con alguna prenda Pendiente/En Proceso, el estado derivado es En Proceso. | D-10; no reabre Canceladas/Entregadas automáticamente; RF-24; PA-04 |
| RN-18 / 1 | Toda prenda pertenece a una orden existente. | RF-17; RNF-11; PA-02 |
| RN-19 / 1 | Toda prenda tiene descripción del arreglo, no vacía. | RF-18; PA-02 |
| RN-20 / 1 | El valor de prenda es positivo; precio todavía no determinado es una excepción pendiente, no un cero ficticio. | RF-19; P-SRS-02; PA-05 |
| RN-21 / 1 | Una prenda tiene un estado a la vez. | RF-20/21; PA-04 |
| RN-22 / 1 | Cada fotografía se asocia a una única prenda. | RF-28/29; PA-07 |
| RN-23 / 2 | Una prenda admite múltiples fotografías; no se obliga a tener foto si no se ha definido esa condición. | RF-27/28; opcionalidad deducida de implementación, pendiente de confirmar; PA-07 |
| RN-24 / 1 | Una prenda registrada tiene tipo definido. | RF-17; PA-02 |
| RN-25 / 1 | Todo pago pertenece a una orden existente. | RF-33; PA-05 |
| RN-26 / 1 | El abono es mayor que cero. | RF-33; RNF-12; PA-05 |
| RN-27 / 2 | La suma de pagos vigentes no supera el valor total actual; pagos anulados no suman. | D-10; RF-33/36; PA-05 |
| RN-28 / 2 | Con importe total positivo y saldo cero la orden está Pagada; una orden vacía no representa un pago. | RF-38; PA-05 |
| RN-29 / 1 | No permitir operaciones que produzcan saldo negativo. | RF-19/31/33/36; PA-05 |
| RN-30 / 1 | Una Entregada con saldo pendiente puede recibir pagos. | D-11; RF-33/37; PA-05 |
| RN-31 / 2 | Al entrar en Lista se registra aviso pendiente; preparar el aviso al cliente requiere que siga Lista. | D-03/10; sustituye la promesa de envío automático; RF-39; PA-08 |
| RN-32 / 2 | Conservar fecha/hora y significado del evento: preparación o remisión al servicio correspondiente. | RF-41; fecha_envio del esquema no prueba envío al cliente; PA-08/09 |
| RN-33 / 2 | Propuesta: una orden no se incluye más de una vez por día local en la lista remitida con éxito al Telegram de la encargada. | C-05; original trataba recordatorio automático al cliente; concurrencia/reintentos y frecuencia manual pendientes P-SRS-05; PA-09 |
| RN-34 / 2 | Cada recibo/aviso se construye con datos actuales al solicitarlo. | RF-39/42; C-05; PA-08/10 |
| RN-35 / 2 | Registrar actividades de órdenes y efectos pertinentes de cambios en prendas, fotos y pagos, incluidos motivos de anulación. | D-10; concretar catálogo exhaustivo de eventos en P-SRS-04; RF-46; PA-06/07 |
| RN-36 / 1 | El paso a Entregada registra fecha y hora automáticamente. | RF-48; PA-04/06 |
| RN-37 / 2 | Sin reclamar es una alerta operativa: Lista y más de N días desde la mayor fecha entre lista y entrega estimada; N=30 por defecto. | RF-47; no equivale a abandono legal; ANA-H05; PA-03 |
| RN-38 / 2 | Próxima a vencer incluye hoy hasta el día local hoy+N, para órdenes activas; N configurable de 0 a 30 en la implementación. | RF-43; C-06; PA-03 |
| RN-39 / 2 | Las observaciones permanecen mientras exista la prenda, salvo una obligación de tratamiento de datos que deba resolverse explícitamente. | RF-25/26; P-SRS-08; PA-07 |
| RN-40 / 1 | Eliminar una fotografía no elimina la prenda. | RF-32; PA-07 |

### M-SRS-01 — Tabla de decisión de estados, versión 0.1

**Propósito:** explicar RF-24 y hacer visibles RN-06/RN-10/RN-17. Revisada por lectura de C-03; es una tabla de análisis, no certificación de notación UML ni ejecución visual.

| Situación | Resultado derivado / acción |
| --- | --- |
| Orden Entregada o Cancelada | Un cambio de prenda no la reabre por sí mismo |
| Orden abierta sin prendas | Pendiente |
| Orden abierta con todas las prendas Entregadas | Entregada |
| Orden abierta con al menos una Pendiente o En Proceso | En Proceso |
| Orden abierta con todas Terminadas/Entregadas y alguna Terminada | Lista para Entregar |
| Reapertura explícita de Entregada | En Proceso por RN-16; el tratamiento posterior de las prendas requiere P-SRS-03 |

**Incertidumbre inseparable del modelo:** RN-10 original decía conservar el estado ante una entrega parcial; esta versión propone derivarlo según trabajo restante. Reabrir puede dejar transitoriamente una orden En Proceso con prendas todavía Entregadas; no se oculta esa excepción ni se asume que las prendas se reinician automáticamente. El ejemplo debe revisarse con la dueña antes de cerrar ese cambio.

Para comunicación se conserva [M-ANA-01 del informe](REVISION_EQUIPO_ANALISTAS_2026-10-07.md), con su límite de no confirmar entrega al cliente. Los diagramas de diseño existentes no se declaran actualizados mediante este SRS.

## 8. Fase posterior conservada

| IDs existentes | Tratamiento en esta edición |
| --- | --- |
| RF-61–63 | Fuera de entrega; requieren revalidación normativa y del modelo de negocio. No basta cumplir 30 días para vender bienes de terceros |
| RF-64/65 | Exportaciones Excel/PDF futuras; no confundir compartir un recibo de texto con exportación de reportes |
| RF-66/67; RNF-29 | Impresión Bluetooth/ESC-POS futura, según D-02 |
| RF-69 | Hora configurable futura; la implementación revisada usa 8:00 |
| RF-71; RNF-30 | Modo oscuro y condición de contraste asociada, futuros. No elimina obligaciones de usabilidad del alcance actual |
| RNF-28 | Carga de más de 5.000 registros/paginación futura; no se mezcla con 500 órdenes de RNF-01 |
| RF-68/70; RNF-31 | Se incluyen arriba por existencia actual, indicando diferencias y verificaciones pendientes |

No se renumeran IDs ni se declaran completados los elementos futuros por aparecer en tablas.

## 9. Pendientes y trazabilidad hacia la prueba

### 9.1 Decisiones y evidencia necesaria

| ID | Asunto | Elementos afectados | Evidencia o acción de cierre | Responsable conocido / por identificar |
| --- | --- | --- | --- | --- |
| P-SRS-01 | Formato y entregables académicos | Validez formal de SRS, modelos y manuales | Recuperar guía/rúbrica o confirmación específica del instructor; el plan existente es fuente secundaria. Fecha/usuaria ya confirmadas, no repetir esas preguntas. | Aprendiz aporta evidencia; instructor define exigencia. |
| P-SRS-02 | Recepción frente a captura; precio/fecha aún desconocidos | RF-05/06/19, RN-05/20, RF-REC-01 | El solicitante confirmó que a veces falta precio o fecha. Precisar casos y acuerdo posterior con la dueña; conservar captura y recepción diferenciadas. Proponer estado pendiente sin valores ficticios. | Dueña define práctica; analista deriva criterios. |
| P-SRS-03 | Entregas parciales y reapertura | RF-24, RN-06/10/16/17, M-SRS-01 | Confirmar ejemplos terminada+entregada, pendiente+entregada y reapertura con todas entregadas; decidir qué prenda se vuelve a trabajar y qué datos se conservan. | Dueña confirma casos; desarrollo ajusta si corresponde. |
| P-SRS-04 | Cancelación con dinero/entrega parcial; alcance del historial y correcciones | RF-11/31/37/46, RN-14/35, RF-OP-01/02 | Definir cancelación, devolución o saldo retenido sin confundir anulaciones con reembolso real; catálogo de eventos y campos modificables al cerrar. | Dueña; orientación contable/jurídica si la decisión lo requiere. |
| P-SRS-05 | Recordatorios repetidos y fallos | RF-40/41, RN-33 | Acordar frecuencia de contacto; probar doble ejecución/fallo de registro tras éxito Telegram y reintento. Abrir enlace no prueba recepción del cliente. | Dueña define frecuencia; desarrollo comprueba estados. |
| P-SRS-06 | Búsqueda de prendas y límites | RF-70 | Resolver si se completa búsqueda original de prendas o se acepta alcance menor con cambio documentado; probar coincidencias fuera de los primeros 10 clientes/20 órdenes. | Dueña confirma necesidad; aprendiz gestiona cambio. |
| P-SRS-07 | Entorno, carga y fronteras de medición | RNF-01/02/03/23 | Identificar teléfono, versión, volumen de prendas/fotos por orden y condiciones. Medir con PA-12; no sustituir resultados por índices. | Aprendiz y ejecución técnica; usuaria aporta dispositivo. |
| P-SRS-08 | Información, evidencia, conservación y derechos sobre datos | RF-DAT-01/02/03, RNF-19, RN-39 | Inventario de datos/salidas y contacto real del responsable; procedimiento/evidencia de autorización y conservación. Revisión pertinente para uso real, sin publicar datos personales en Git. | Dueña del taller; apoyo competente por identificar donde haga falta. |
| P-SRS-09 | Datos del recibo y garantía | RF-42 / RF-REC-01 | Definir garantía aplicable y datos del recibo; validar casos completos y de cotización pendiente con fuentes L-02 y práctica del taller. | Dueña y orientación competente si existe duda normativa. |
| P-SRS-10 | Recuperación de fotos y fallos parciales | RNF-17/18/25, RNF-REC-01 | Ensayar en instalación aislada: clave errónea, foto ilegible, importación fallida, copia sin fotos y recuperación en otro equipo. Registrar destino de copia y elementos recuperados. | Aprendiz/desarrollo; usuaria practica luego con datos de prueba. |
| P-SRS-11 | Funciones nativas y compatibilidad | RF-68, RNF-07/09/15/16/31 | Ejecutar en Android objetivo cámara, bloqueo, WhatsApp y alarma; registrar versiones de navegador y funciones que sí admiten. | Aprendiz y usuaria; P-06 del plan previo. |
| P-SRS-12 | Formatos, tamaño y obligatoriedad de fotos | RNF-21/22, RN-23 | Definir cámara/galería/archivo, conversión y unidad de tamaño; probar formatos y límite. El archivo .jpeg por sí solo no valida todo el contrato. | Dueña confirma uso; desarrollo aporta prueba. |
| P-SRS-13 | Condiciones añadidas concurrentemente en D-09 | RN-37, RF-47, RF-REC-01, PA-03/10 | Recuperar confirmación registrada de la dueña, precisar desde qué evento corre cada plazo y qué significa conservación. Separar días hábiles de seguimiento en días calendario y de procedimiento legal; no cambiar el contador por inferencia. | Dueña confirma política; analista concilia alcances; revisión pertinente si afecta derechos. |

No hace falta resolver todos los pendientes para trabajar en los demás. Las confirmaciones del usuario sobre fecha, usuaria y recepción con datos todavía pendientes ya constan en §1. El aprendiz no tiene que certificar una interpretación jurídica ni la corrección técnica de los agentes.

### 9.2 Mapa de necesidades y aceptación

| Necesidad | Requisitos y reglas principales | Prueba / evidencia pendiente |
| --- | --- | --- |
| N-01 Identificar trabajo | RF-01–07/17–32/49/50/70; RN-01–05/18–24 | PA-01/02/07/13, más observación de identificación física de prenda y bolsa |
| N-02 Gestionar entregas | RF-08–16/20–24/43/47/48/68; RN-04–17/36–38 | PA-03/04/06/14; validar M-SRS-01 y excepción de reapertura |
| N-03 Controlar dinero | RF-19/23/31/33–38/44/45; RF-OP-01/02; RN-25–30 | PA-05/11; canceladas y reembolsos pendientes |
| N-04 Comunicar | RF-39–42; RN-31–34 | PA-08/09/10; distinguir destinatarios y límites de confirmación |
| N-05 Conservar/recuperar | RNF-17–20/25–27; RNF-LOC-01/REC-01 | PA-12/16/17; fotos y fallos de BD tienen comprobaciones distintas |
| N-06 Datos y condiciones | RF-DAT-01–03, RF-REC-01; RNF-07–09/19 | PA-01/10/15; fuente normativa y decisiones del taller separadas |

### 9.3 Evidencia existente y lo que no prueba

S-06 registra [CI 37676549891](https://github.com/Aryannext/Costura-app/actions/runs/37676549891) exitosa para el commit publicado: pruebas/cobertura, compilación y Docker. No se reejecutó durante la redacción de este SRS y no se toma un recuento de pruebas de documentos discrepantes como resultado nuevo.

El resultado CI citado no cubre automáticamente las modificaciones locales concurrentes descritas en §1. El workflow inspeccionado no ejecuta los E2E Playwright. Una prueba titulada RN-xx no demuestra todas las condiciones de esa regla. Los controles HTTP/Docker no prueban el recorrido táctil, los permisos nativos, la comprensión de la usuaria ni los tiempos del teléfono.

## 10. Registro de revisiones e impactos

El original y sus HU/CP se conservan. Las revisiones 2 de este SRS son **propuestas documentadas**, salvo sustituciones ya registradas en D-06 que se identifican como antecedente. No se declara la adopción por la dueña/instructor de toda la nueva versión.

| Cambio | Antes / nueva formulación | IDs y dependencias | Estado |
| --- | --- | --- | --- |
| SRS-C01 | Red local/servidor → almacenamiento por instalación; web de demostración | RNF-13/14/15/16, RNF-LOC-01, alcance y manuales | D-06/D-13 registrados; evidencia de plataformas pendiente |
| SRS-C02 | Envíos automáticos al cliente → preparación manual y destinos explícitos | RF-39–42, RN-31–34, PA-08/09/10, M-ANA-01 | Propuesta según D-03/D-04; ANA-C01 / ANA-H03 |
| SRS-C03 | Todas terminadas/conservar estado → derivación con entregas parciales y excepción de reapertura | RF-08/10/24/43/47, RN-04/06/08/10/17/37/38, M-SRS-01 | Propuesta; P-SRS-03 y ANA-H05 |
| SRS-C04 | Fecha de creación → recepción declarada diferenciada de captura | RF-05/06, RN-05; recibo e historial | Propuesta, P-SRS-02 |
| SRS-C05 | Pagos sin distinguir anulaciones → importes vigentes, historial y deuda posterior a entrega | RF-34–38/44/45, RN-27/28, RF-OP-01/02 | Correcciones documentadas en S-03; condiciones de cancelación P-SRS-04 |
| SRS-C06 | Autenticación/cifrado genéricos → hash, clave propia y bloqueo explícito | RNF-05/07/08/09; PA-15 | D-12 registrado; pruebas de ejecución pendientes |
| SRS-C07 | Respaldo/permanencia absolutos → alcance, fotos omitidas y fallo parcial explícitos | RNF-17/18/25, RNF-REC-01, PA-16 | Propuesta según C-09 y P-SRS-10 |
| SRS-C08 | Capas/SOLID/índices como garantías → inspección de responsabilidades, consultas y mediciones | RNF-26/27; mantiene RNF-20; PA-12/17 | Propuesta; no garantiza O(log N) global |
| SRS-C09 | Casilla/fecha y recibo declarados suficientes → requisitos de evidencia/información/campos y conservación | RF-01, RF-DAT-01–03, RF-REC-01, RN-23/35/39 | Candidatos; ANA-C02 / ANA-H01/H02, P-SRS-08/09/12 |
| SRS-C10 | Avisos próximos a vencer → descripción precisa de conteo diario programado | RF-68 / RNF-31; PA-14 | Propuesta según implementación; no cambia RF-69 futuro |
| SRS-C11 | Búsqueda global marcada hecha → brecha explícita de prendas y límites | RF-70 conserva rev. 1; PA-13 | Pendiente P-SRS-06; no se recorta silenciosamente |

**SRS-C12 — Cambios de cierre:** evidencia parcial de privacidad/recibo y nuevas condiciones de taller incorporada desde diff local. RF-DAT-02/03, RF-REC-01 y P-SRS-13 requieren revalidación contra la versión integrada y sus pruebas; no se declara cierre de ANA-H01/H02.

**Impactos por revisar tras adoptar cambios:** matriz de trazabilidad, manual de usuario/técnico, diagramas pertinentes, HU/CP vigentes y pruebas asociadas. La existencia de este SRS no cierra ANA-H01–H06 ni esas actualizaciones.

## 11. Criterio de avance y entrega

**Puede avanzar:** diseñar el flujo de recepción con precio/fecha pendientes a partir de la confirmación del solicitante, completar requisitos/criterios con evidencia disponible, corregir incoherencias documentales, preparar fixtures y ensayos, y acordar con la dueña escenarios simples de uso.

**Antes de declarar un requisito listo para desarrollar:** comportamiento, excepciones, dependencia y autoridad relevante deben estar resueltos para ese cambio. Una mejora de redacción no autoriza ni comprueba implementación.

**Antes de aceptación del producto:** identificar la versión entregada, ejecutar los escenarios aplicables en el teléfono objetivo, registrar fallos/correcciones y repetir lo afectado; confirmar con la dueña que las tareas funcionan para el taller y con el instructor qué evidencia académica exige.

**Comprobaciones de este avance:** lectura de catálogos originales, contraste focalizado con código, conservación de IDs, correspondencias con fuentes/pendientes/PA y revisión de integridad documental. No se ejecutaron pruebas del producto ni se inventaron entrevistas o resultados. La revisión 0.1 sirve para trabajar hacia el 25 de octubre; no declara el proyecto terminado.
