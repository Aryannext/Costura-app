# Protocolo de aceptación de Costura-app

Versión 0.1 · 7 de octubre de 2026 · asociado a [SRS.md](../01-analisis/SRS.md).

**Estado: escenarios propuestos, no resultados.** Ningún PA de este archivo se declara ejecutado. La revisión documental y los resultados de CI previos se describen en el SRS; no sustituyen aceptación con la usuaria.

Los IDs PA-01–PA-17 son nuevos y no renumeran los CP del documento histórico. Cada PA agrupa comprobaciones; aprobar una parte no aprueba automáticamente las demás. Las tablas RF/RNF del SRS conservan además un criterio por requisito. Los PA no aseguran cobertura exhaustiva.

## Cómo usarlo

1. Anotar commit/APK, fecha, dispositivo, sistema operativo, navegador si aplica, permisos y quién ejecuta.
2. Preparar datos ficticios y contactos controlados; para revisar enlaces y fallos externos, simular el transporte. No se necesita contactar clientes reales.
3. Ejecutar los pasos y comparar resultado observado con esperado, guardando evidencia sin datos personales innecesarios.
4. Clasificar cada comprobación como **no ejecutada, superada, fallida o pendiente de definición**. Una respuesta visual de éxito no basta si el dato debía persistir.
5. Vincular cada fallo a requisito y versión. Corregir y repetir el escenario afectado, además de dependencias pertinentes; conservar el resultado anterior.
6. La dueña confirma que el comportamiento sirve al taller; las comprobaciones técnicas corresponden a quien las ejecute. El instructor determina suficiencia académica.

Los importes de ejemplo están en COP. D, D1 y D2 representan días locales definidos al preparar el ensayo. Pruebas de reloj, fallos y restauración se hacen en entorno de prueba. Los umbrales de rendimiento provienen de la especificación histórica; las condiciones aún abiertas se resuelven antes de declarar cumplimiento.

## Escenarios

### PA-01 — Clientes y datos personales

**Requisitos:** RF-01–04; RF-DAT-01–03; RN-01/02.  
**Preparación:** Base de prueba sin clientes; dos personas ficticias; contacto de prueba controlado.

**Pasos:** Registrar sin nombre, sin teléfono y sin autorización requerida; después registrar dos clientes con mismo teléfono; editar uno y consultar sus órdenes. Inspeccionar qué evidencia de autorización se recupera. Ensayar solicitud de supresión con datos ficticios en notas/fotos.

**Resultado esperado:** Datos obligatorios inválidos no se guardan; teléfono repetido no se rechaza por unicidad; cliente/órdenes no se mezclan. Propuestas de aviso, evidencia y supresión se evalúan por separado, sin dar por aprobado todo el caso porque pasa la casilla.

**Preparación pendiente:** Parte de alta es ejecutable con datos preparados; privacidad completa pendiente P-SRS-08.  
**Resultado de esta versión:** no ejecutado.

### PA-02 — Recepción, orden y prendas

**Requisitos:** RF-05–07/17–19/22; RNF-04/10/11; RNF-LOC-01.  
**Preparación:** Cliente ficticio creado; reloj/fecha local conocida; aplicación con sesión válida.

**Pasos:** Sin red, crear orden con recepción de hoy y entrega posterior; probar recepción futura y entrega anterior; probar cliente/orden inexistentes a nivel de datos. Agregar dos prendas de $20.000 y $10.000; repetir con descripción/tipo faltantes. Cerrar/reabrir.

**Resultado esperado:** Orden válida persiste y tiene cliente correcto; campos inválidos se rechazan sin registros huérfanos ni éxito falso. Registrar número de pantallas. Caso de precio/fecha desconocidos queda separado.

**Preparación pendiente:** Casos conocidos preparados; el solicitante confirmó recepciones con precio o fecha pendientes. Su ensayo completo requiere definir el flujo P-SRS-02.  
**Resultado de esta versión:** no ejecutado.

### PA-03 — Fechas y clasificación operativa

**Requisitos:** RF-08–10/43/47; RN-04/37/38.  
**Preparación:** Fijar día D en entorno de prueba; órdenes vacía, En Proceso, Lista, Entregada y Cancelada; fechas D-1,D,D+3,D+4; N anticipación=3.

**Pasos:** Consultar atrasadas/próximas; cambiar N a 0. Para sin reclamar, crear Listas cuyo máximo entre fecha lista y prometida sea D-30 y D-31; repetir con fecha lista de hoy y prometida antigua.

**Resultado esperado:** Atrasada: solo activas con fecha antes de D. Próxima: D…D+3 inclusive; N=0 solo D. Sin reclamar: D-31 sí, D-30 no, lista hoy no. No aparece declaración de abandono o venta autorizada.

**Preparación pendiente:** Preparado para regla operativa propuesta; confirmar RN-37 no certifica plazo legal.  
**Resultado de esta versión:** no ejecutado.

### PA-04 — Avance y entregas parciales

**Requisitos:** RF-15/16/20/21/24/48; RN-06–10/17/21/36.  
**Preparación:** Orden con dos prendas, ambas Pendiente, sin interferir con otras órdenes.

**Pasos:** Terminar primera; intentar entregar segunda sin terminar; entregar primera terminada; terminar segunda; entregar última. Probar orden vacía y orden cerrada con cambio de prenda.

**Resultado esperado:** Estados esperados: En Proceso, rechazo, En Proceso, Lista, Entregada. Se conserva qué prenda se entregó y el sello final. Una orden vacía es Pendiente. Comportamiento de cerradas/reapertura se revisa en PA-06.

**Preparación pendiente:** Preparado como propuesta de reconciliación; P-SRS-03 antes de aceptación de negocio.  
**Resultado de esta versión:** no ejecutado.

### PA-05 — Pagos, saldos y correcciones

**Requisitos:** RF-19/23/31/33–38/45; RF-OP-01/02; RN-25–30.  
**Preparación:** Orden total $30.000 en dos prendas de $20.000 y $10.000; sin pagos; métodos del catálogo.

**Pasos:** Abonar $10.000; rechazar 0, negativo y $20.001; anular abono con motivo y repetir anulación; probar motivo vacío. Registrar de nuevo y cambiar precios. Intentar dos pagos simultáneos por el saldo completo. Entregar con deuda y registrar pago posterior.

**Resultado esperado:** Saldos esperados: $20.000 tras abono, $30.000 tras anulación. Anulados siguen visibles y no suman. Corrección que haga total menor que lo pagado se rechaza. Como máximo un pago simultáneo por saldo completo; saldo no negativo. Entregada sigue Por cobrar mientras deba.

**Preparación pendiente:** Preparado; ingresos y deuda cancelada dependen de P-SRS-04.  
**Resultado de esta versión:** no ejecutado.

### PA-06 — Cancelación, reapertura e historial

**Requisitos:** RF-11–14/46/48; RN-11–16/35/36.  
**Preparación:** Una orden abierta con abono y otra Entregada; registrar estado inicial e historial.

**Pasos:** Cancelar abierta: intentar nueva prenda/pago. Intentar cancelar Entregada. Reabrir Entregada y consultar historial/estados de cada prenda; intentar reabrir no Entregada.

**Resultado esperado:** Cancelación no borra pagos; no admite altas prohibidas. Entregada no se cancela. Reapertura autorizada genera evento y En Proceso. Registrar qué queda en prendas/fecha real; no inventar el resultado de una devolución de dinero.

**Preparación pendiente:** Casos básicos preparados; reapertura completa y dinero en canceladas pendientes P-SRS-03/04.  
**Resultado de esta versión:** no ejecutado.

### PA-07 — Fotos, notas y eliminación

**Requisitos:** RF-25–32; RF-OP-02; RN-22/23/35/39/40; RNF-21/22.  
**Preparación:** Prendas ficticias y fotos sin datos personales; cámara/galería en dispositivo de prueba; tamaño y formatos a acordar.

**Pasos:** Guardar nota y dos fotos; cerrar/reabrir, consultar y borrar una foto. Denegar permiso y cancelar captura. Simular archivo faltante. Intentar eliminar prenda entregada y eliminar una abierta válida. Probar formatos/tamaño cuando se cierre P-SRS-12.

**Resultado esperado:** Notas/fotos corresponden a la prenda; cancelación/error no anuncia guardado. Borrar foto conserva prenda. Eliminación válida mantiene totales e historial coherentes y no deja fotos mostradas como disponibles. Comparar referencias y archivos físicos.

**Preparación pendiente:** Fotos nativas pendientes P-SRS-11; formato/tamaño pendientes P-SRS-12.  
**Resultado de esta versión:** no ejecutado.

### PA-08 — Aviso de orden lista

**Requisitos:** RF-39/41; RN-31/32/34; RNF-05.  
**Preparación:** Orden Lista con datos ficticios y otra En Proceso; apertura externa interceptada en prueba técnica o contacto controlado.

**Pasos:** Cambiar saldo antes de solicitar aviso; abrir enlace, volver sin enviar; probar aviso de Lista desde orden no lista. Simular fallo detectable de preparación/apertura.

**Resultado esperado:** Mensaje usa datos actuales y destinatario correcto; solo se registra preparado, nunca leído/entregado al cliente. Orden no lista rechaza el aviso. Fallo detectable no se presenta como envío confirmado.

**Preparación pendiente:** Preparado para semántica; definir qué fallos de apertura detecta cada plataforma.  
**Resultado de esta versión:** no ejecutado.

### PA-09 — Lista de recordatorios a la encargada

**Requisitos:** RF-40/41; RN-32/33.  
**Preparación:** Dos órdenes Listas; transporte Telegram simulado con respuestas éxito/fallo; mismo día local.

**Pasos:** Fallar primer envío, reintentar con éxito y pedir nueva lista el mismo día. Probar dos ejecuciones simultáneas y fallo de escritura local posterior a éxito remoto.

**Resultado esperado:** El fallo no registra envío; el éxito registra remisión a Telegram de la encargada, no al cliente. Repetición normal no duplica por orden/día. Resultados de concurrencia y registro fallido se documentan; no asumir garantía de entrega única.

**Preparación pendiente:** Caso normal preparado; política y manejo de fallos P-SRS-05.  
**Resultado de esta versión:** no ejecutado.

### PA-10 — Recibo

**Requisitos:** RF-42; RF-REC-01; RN-34.  
**Preparación:** Orden de dos prendas, pagos vigentes y anulados, información de recepción y contacto ficticios; garantía pendiente de definición.

**Pasos:** Generar recibo después de un nuevo abono; comparar versión para compartir y Telegram; revisar campo por campo según catálogo. Simular precio/fecha desconocidos cuando se defina su flujo.

**Resultado esperado:** No suma anulados ni usa copia antigua de saldo. Identifica bienes/servicio y datos necesarios; campos ausentes se reportan como incumplimiento o pendiente, no como aprobado. No se rotula factura.

**Preparación pendiente:** RF-42 básico preparado; RF-REC-01 pendiente P-SRS-02/09.  
**Resultado de esta versión:** no ejecutado.

### PA-11 — Ingresos y total por cobrar

**Requisitos:** RF-44/45; RF-35/37.  
**Preparación:** Período D1…D2; pagos $10.000 en D1 y $5.000 en D2; uno anulado y otro fuera del rango; orden entregada que debe.

**Pasos:** Consultar ingresos y comparar con suma de pagos vigentes del rango; consultar total por cobrar y suma del listado; distinguir fecha de pago de recepción de orden.

**Resultado esperado:** Ingresos del período $15.000 para los dos pagos válidos. No incluye anulado/fuera de rango. Por cobrar coincide con lista, incluye entregada con deuda y no se confunde con ingreso. Registrar efecto de canceladas.

**Preparación pendiente:** Preparado; tratamiento de canceladas P-SRS-04.  
**Resultado de esta versión:** no ejecutado.

### PA-12 — Tiempos de respuesta

**Requisitos:** RNF-01/02/03/23/27.  
**Preparación:** Teléfono/versión y límites de medición definidos; base ficticia con 500 órdenes, carga por orden y fotos documentada.

**Pasos:** Medir abrir detalle, guardar orden, actualizar saldo y visualizar foto. Separar arranque frío y uso habitual. Propuesta metodológica: 10 repeticiones por escenario, conservar todas, sin esconder la peor; ajustar protocolo con responsable de evaluación.

**Resultado esperado:** Contrastar cada observación con <2 s, <3 s, <1 s y <3 s respectivamente. Reportar resultados crudos y variación; un promedio bajo no prueba todos los intentos. Índices/cobertura no sustituyen medición.

**Preparación pendiente:** No listo para ejecución final hasta P-SRS-07/12. Diez repeticiones es propuesta de ensayo, no requisito aprobado.  
**Resultado de esta versión:** no ejecutado.

### PA-13 — Búsqueda y sugerencias

**Requisitos:** RF-49/50/70.  
**Preparación:** Clientes y órdenes ficticios con nombres parecidos; más de 10 clientes/20 órdenes coincidentes; prendas con texto distintivo; arreglos repetidos.

**Pasos:** Buscar nombre, teléfono, número de orden y texto de prenda; buscar sin resultados; revisar presentación de límites; registrar prenda con sugerencia y con texto nuevo.

**Resultado esperado:** Clientes/órdenes no se mezclan y se puede reconocer resultado truncado. La búsqueda de prendas exigida por RF-70 debe evaluarse: el código actual no la cubre. Sugerencias no obligan a usar texto existente.

**Preparación pendiente:** Preparado para detectar brecha; P-SRS-06 decide cambio de alcance o desarrollo.  
**Resultado de esta versión:** no ejecutado.

### PA-14 — Alarmas locales

**Requisitos:** RF-68; RNF-31.  
**Preparación:** Android de prueba, permisos documentados, reloj controlado y órdenes activas con entregas en distintos días.

**Pasos:** Programar antes de las 8; desconectar red; observar aviso. Repetir sin permiso y sin alarma exacta. Cambiar órdenes y reabrir panel; revisar nueva programación y días sin entregas.

**Resultado esperado:** Conteo por día coherente con última programación, sin avisos retrospectivos de hora pasada ni repetición obsoleta. Estado de permisos visible. Más allá de siete días requiere reprogramación; no asumir programación ilimitada.

**Preparación pendiente:** Pendiente ejecución nativa P-SRS-11.  
**Resultado de esta versión:** no ejecutado.

### PA-15 — Acceso y presentación

**Requisitos:** RNF-06–09/15/16/24.  
**Preparación:** Instalación de prueba sin datos reales; cuenta inicial; dispositivos/anchos/navegadores identificados.

**Pasos:** Probar clave incorrecta, ruta directa, cambio de fábrica y biometría si existe; arranque frío, ausencia menor/mayor de 2 min y 15 min inactiva. Revisar 360 px, tablet/escritorio y cargas lentas.

**Resultado esperado:** Datos protegidos antes de autenticación; cambio obligatorio y bloqueo según contrato. Controles esenciales accesibles; no confundir capacidad nativa ausente con funcionamiento web completo; registrar diferencias.

**Preparación pendiente:** Pendiente entorno y hardware P-SRS-07/11; inspección parcial disponible.  
**Resultado de esta versión:** no ejecutado.

### PA-16 — Persistencia, respaldo y recuperación

**Requisitos:** RNF-17/18/25; RNF-LOC-01/REC-01.  
**Preparación:** Instalación aislada con datos/fotos ficticios y una copia previa verificada; destino controlado; contraseña de prueba.

**Pasos:** Trabajar sin red y reiniciar; respaldar a archivo y por transporte Telegram simulado; cancelar compartir. Restaurar copia válida en instalación de prueba; repetir con clave errónea, archivo inválido, foto ilegible, límite de fotos excedido y fallo de importación.

**Resultado esperado:** Datos locales persisten; copia indica alcance y destino observado. Recuperación correcta conserva importes/relaciones/fotos esperadas. Error no implica éxito total. Comparar datos y fotos antes/después de fallo: rollback de BD no demuestra rollback de archivos.

**Preparación pendiente:** Casos de fallo requieren diseño de inyección controlada P-SRS-10; no ejecutarlos sobre instalación operativa.  
**Resultado de esta versión:** no ejecutado.

### PA-17 — Mantenibilidad y diagnóstico

**Requisitos:** RNF-19/20/26/27.  
**Preparación:** Código/versiones identificados; lista de módulos afectados por un cambio de regla; error ficticio reproducible.

**Pasos:** Inspeccionar dependencias y duplicación de reglas; revisar planes/índices relevantes; provocar error controlado y localizar registro según política.

**Resultado esperado:** Informe identifica excepciones concretas. Evento útil de diagnóstico no contiene secretos. Si solo existe consola, RNF-19 no se da por cumplido. No se garantiza complejidad algorítmica por la mera existencia de índices.

**Preparación pendiente:** Inspección preparada; definición/implementación de archivo de eventos pendiente.  
**Resultado de esta versión:** no ejecutado.

## Ficha de evidencia para cada ejecución

| Campo | Valor por completar al ejecutar |
| --- | --- |
| Escenario y subcomprobación | PA-xx + paso |
| Requisito y revisión | ID / revisión del SRS |
| Versión exacta | Commit + APK/build cuando corresponda |
| Fecha y ejecutor | Fecha real; rol de quien ejecutó |
| Entorno y datos | Dispositivo, SO, permisos, volumen, datos ficticios |
| Resultado observado | Descripción concreta; tiempos/valores si corresponde |
| Resultado | No ejecutada / superada / fallida / pendiente de definición |
| Evidencia | Ruta o referencia a captura, log o registro anonimizado |
| Hallazgo vinculado | ANA-Hxx o nuevo ID, si aplica |
| Repetición tras corrección | Nueva versión, fecha y resultado; no sobrescribir el anterior |

## Cobertura y límites

Esta edición prepara comprobaciones de alta prioridad para la entrega del 25 de octubre. No acredita seguridad exhaustiva, accesibilidad completa, conformidad jurídica ni desempeño en cualquier dispositivo. Los criterios del SRS, las reglas RN y los CP históricos deben reconciliarse conforme se cierre cada pendiente. Una prueba con la dueña ayuda a validar utilidad, pero no reemplaza mediciones técnicas ni la fuente académica.
