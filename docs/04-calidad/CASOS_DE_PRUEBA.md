# Casos de prueba · Atelier Manager

Casos de prueba de la versión 1.2.0, con los elementos de la guía SENA *Aplicación de pruebas de software* (tabla 1): identificador, nombre, descripción, orden de ejecución, requerimiento asociado, precondición, postcondición y resultado esperado. El resultado de cada ejecución está en el [informe de resultados](INFORME_DE_RESULTADOS.md).

> **Fecha:** 14 de octubre de 2026 · **Versión probada:** 1.2.0, esquema 8 · **Requisitos:** [SRS](../01-requisitos/SRS.md)

Los identificadores son `CPV-xx` (caso de prueba vigente). Los `CP-xx` de la especificación original son históricos y no se reutilizan.

---

## 1. Cómo se ejecutan

La ejecución sigue el flujo de actividades de la guía (figura 2):

1. **Calendario:** una sola jornada, el 14 de octubre de 2026, en el orden de la columna *Orden*.
2. **Entorno:** PC con Windows 11, Node 24, Microsoft Edge y el servidor de desarrollo en `localhost:5173`. Versión publicada en `https://proyectosena.online/costura-app/`.
3. **Datos de prueba:** siempre inventados. Las pruebas automáticas crean una base SQLite vacía por caso; la de volumen crea 500 órdenes y 150 clientas. Nunca se usan datos de clientas reales.
4. **Criterios de entrada:** el código compila, `npm ci` termina sin errores y la base de la prueba arranca con las 8 migraciones aplicadas.
5. **Ejecución:** se corren los casos, se analizan los resultados y cada falla se registra como defecto en el [reporte de defectos](REPORTE_DE_DEFECTOS.md).

| Tipo (guía, sección 1.1) | Casos | Cómo se ejecutan |
| --- | --- | --- |
| Funcional: unitaria y de integración | CPV-01 a CPV-13 | Automático: `npm run test:unit` (Vitest + SQLite real con sql.js) |
| Funcional: de punta a punta | CPV-14 a CPV-16 | Automático: `PW_CHANNEL=msedge npx playwright test` |
| No funcional: volumen y rendimiento | CPV-17 | Automático: `src/database/__tests__/volumen.sqlite.spec.js` |
| No funcional: seguridad | CPV-18 a CPV-21, CPV-23 | Automático y con herramientas (`npm audit`, cabeceras HTTP, OWASP ZAP) |
| Regresión de la documentación | CPV-22 | Automático: `src/__tests__/documentacion.spec.js` |
| No funcional: carga | CPV-24 | Herramienta: Apache JMeter |
| Aceptación, usabilidad y exploratoria | CPV-25 a CPV-28 | Manual, en el teléfono y con la dueña |

## 2. Resumen

| Orden | ID | Nombre | Requerimiento |
| --- | --- | --- | --- |
| 1 | CPV-01 | Registrar una clienta con autorización de datos | RF-01, RF-DAT-02, RN-01 |
| 2 | CPV-02 | Crear una orden con fecha de recepción y de entrega | RF-05, RF-06, RN-05 |
| 3 | CPV-03 | Agregar una prenda con arreglo y precio | RF-17, RF-18, RF-19, RN-19, RN-20 |
| 4 | CPV-04 | La orden cambia de estado según sus prendas | RF-24, RN-06, RN-17 |
| 5 | CPV-05 | Entrega parcial y total de prendas | RF-15, RF-16, RN-07 a RN-10 |
| 6 | CPV-06 | Registrar abonos sin superar el saldo | RF-33, RF-36, RN-26, RN-27, RN-29, RNF-12 |
| 7 | CPV-07 | Anular un pago con motivo, sin borrarlo | RF-OP-01, RF-35 |
| 8 | CPV-08 | Cancelar una orden | RF-11, RF-12, RN-11 a RN-14 |
| 9 | CPV-09 | Reabrir una orden entregada | RF-13, RF-14, RN-15, RN-16 |
| 10 | CPV-10 | Aviso de orden lista por WhatsApp | RF-39, RN-31 |
| 11 | CPV-11 | Recibo de la orden | RF-42, RF-REC-01 |
| 12 | CPV-12 | Órdenes sin reclamar en más de 30 días | RF-47, RN-37 |
| 13 | CPV-13 | Migraciones de la base de datos | ARQUITECTURA §6 |
| 14 | CPV-14 | Los datos sobreviven a una recarga en la web | RNF-15, D-13 |
| 15 | CPV-15 | Crear órdenes seguidas sin mezclar datos | RN-03, RNF-10 |
| 16 | CPV-16 | Flujo completo de una orden | RF-01, RF-05, RF-17, RF-24, RF-33, RF-34, RF-39, RN-30 |
| 17 | CPV-17 | Volumen: 500 órdenes | RNF-01, RNF-02, RNF-03, RNF-27 |
| 18 | CPV-18 | Copia de seguridad cifrada | RNF-17, RNF-18 |
| 19 | CPV-19 | Bloqueo al volver de segundo plano | RNF-07, RNF-09 |
| 20 | CPV-20 | Dependencias sin vulnerabilidades conocidas | RNF-07, seguridad del APK |
| 21 | CPV-21 | Cabeceras de seguridad de la versión web | D-13, MANUAL_TECNICO §12 |
| 22 | CPV-22 | La documentación coincide con el código | Todos |
| 23 | CPV-23 | Escaneo de seguridad con OWASP ZAP | Seguridad de la versión web |
| 24 | CPV-24 | Carga de la versión web con JMeter | D-13 |
| 25 | CPV-25 | Aceptación con la dueña | Todo el SRS |
| 26 | CPV-26 | Hardware del teléfono: cámara, huella y aviso de las 8:00 | RF-27, RNF-07, RF-68, RNF-31 |
| 27 | CPV-27 | Usabilidad con la dueña | RNF-04, RNF-16 |
| 28 | CPV-28 | Exploratoria: cancelar la cámara no anuncia éxito | RNF-05, RF-27 |

## 3. Casos

### CPV-01 · Registrar una clienta con autorización de datos

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Comprueba que no se guarde una clienta sin nombre, sin teléfono válido o sin autorización (Ley 1581), y que con todo se guarde con la fecha de la autorización. Prueba unitaria y E2E |
| Orden de ejecución | 1 |
| Requerimiento asociado | RF-01, RF-DAT-02, RN-01 |
| Precondición | Base vacía con las migraciones aplicadas |
| Pasos | 1. Intentar guardar sin nombre. 2. Con teléfono de 2 dígitos. 3. Sin marcar la autorización. 4. Con nombre, `3001234567` y autorización |
| Postcondición | Existe una sola clienta, con `fecha_autorizacion_datos` y la versión del aviso |
| Resultado esperado | Los intentos 1 a 3 se rechazan con un mensaje que dice qué falta; el 4 se guarda |
| Evidencia | `validators.spec.js` (validateCliente), `reglasNegocio.spec.js` (RN-01), `flujo-orden.spec.js` paso 1 |

### CPV-02 · Crear una orden con fecha de recepción y de entrega

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Una orden puede registrar ropa recibida antes de usar la app, pero la entrega prometida no puede ser anterior a la recepción |
| Orden de ejecución | 2 |
| Requerimiento asociado | RF-05, RF-06, RN-05 |
| Precondición | Existe una clienta |
| Pasos | 1. Crear una orden recibida hace 5 días con entrega mañana. 2. Intentar una entrega anterior a la recepción |
| Postcondición | Existe una orden *Pendiente* con la fecha de recepción indicada |
| Resultado esperado | El paso 1 crea la orden; el paso 2 se rechaza |
| Evidencia | `validators.spec.js` (validateFechaEntrega), `reglasNegocio.spec.js` (RN-05), `flujo-orden.spec.js` paso 2 |

### CPV-03 · Agregar una prenda con arreglo y precio

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Una prenda necesita orden, tipo, descripción del arreglo y un precio mayor que cero; el total de la orden se recalcula solo |
| Orden de ejecución | 3 |
| Requerimiento asociado | RF-17, RF-18, RF-19, RF-23, RN-18, RN-19, RN-20, RN-24 |
| Precondición | Existe una orden abierta |
| Pasos | 1. Agregar una prenda sin descripción. 2. Con precio 0. 3. Con descripción y precio 20.000 |
| Postcondición | La orden tiene una prenda *Pendiente* y total 20.000 |
| Resultado esperado | 1 y 2 se rechazan; 3 se guarda y el total y el saldo pasan a 20.000 |
| Evidencia | `reglasNegocio.spec.js` (RN-18 a RN-20, RN-24), `saldo.sqlite.spec.js` |

### CPV-04 · La orden cambia de estado según sus prendas

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | El estado de la orden se deriva de sus prendas: *En Proceso* mientras quede trabajo y *Lista para Entregar* cuando no queda; ese estado solo lo asigna el sistema |
| Orden de ejecución | 4 |
| Requerimiento asociado | RF-24, RN-06, RN-17 |
| Precondición | Orden con dos prendas *Pendiente* |
| Pasos | 1. Terminar la primera prenda. 2. Terminar la segunda. 3. Intentar poner la orden en *Lista* a mano |
| Postcondición | La orden queda *Lista para Entregar* |
| Resultado esperado | Tras 1 sigue *En Proceso*; tras 2 pasa sola a *Lista*; 3 se rechaza |
| Evidencia | `reglasNegocio.spec.js` (RN-06, RN-17), `estadoOrden.spec.js`, `saldo.sqlite.spec.js` (estado derivado contra SQLite real) |

### CPV-05 · Entrega parcial y total de prendas

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Se pueden entregar prendas terminadas una por una; la orden solo queda *Entregada* cuando se entregaron todas |
| Orden de ejecución | 5 |
| Requerimiento asociado | RF-15, RF-16, RF-48, RN-07 a RN-10, RN-36 |
| Precondición | Orden *Lista* con dos prendas terminadas |
| Pasos | 1. Entregar una prenda. 2. Entregar la otra |
| Postcondición | Orden *Entregada* con fecha y hora de entrega |
| Resultado esperado | Tras 1 la orden conserva su estado y muestra qué falta; tras 2 queda *Entregada* con la fecha registrada sola |
| Evidencia | `reglasNegocio.spec.js` (RN-07 a RN-10, RN-36) |

### CPV-06 · Registrar abonos sin superar el saldo

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Un abono es mayor que cero, no supera el saldo vigente ni entra en una orden cancelada. La comprobación ocurre en la misma sentencia SQL que escribe, para resistir un doble toque |
| Orden de ejecución | 6 |
| Requerimiento asociado | RF-33, RF-34, RF-36, RF-38, RN-26 a RN-29, RNF-12 |
| Precondición | Orden con total 20.000 y saldo 20.000 |
| Pasos | 1. Abonar 0. 2. Abonar 25.000. 3. Abonar 5.000 por Bre-B. 4. Abonar 15.000 |
| Postcondición | Saldo 0 y orden marcada *Pagada* |
| Resultado esperado | 1 y 2 se rechazan sin dejar rastro en el historial; 3 deja saldo 15.000; 4 deja saldo 0 |
| Evidencia | `saldo.sqlite.spec.js` (P1-16), `reglasNegocio.spec.js` (RN-26 a RN-29) |

### CPV-07 · Anular un pago con motivo, sin borrarlo

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Un pago mal digitado se anula con un motivo; queda visible como anulado y deja de contar en el saldo |
| Orden de ejecución | 7 |
| Requerimiento asociado | RF-OP-01, RF-35 |
| Precondición | Orden con un abono de 5.000 |
| Pasos | 1. Anular sin motivo. 2. Anular con motivo «Se registró dos veces». 3. Volver a anularlo |
| Postcondición | El pago sigue en la base con fecha y motivo de anulación |
| Resultado esperado | 1 se rechaza («Escribe el motivo de la anulación.»); 2 anula y el saldo sube 5.000; 3 se rechaza («Este pago ya está anulado.») |
| Evidencia | `saldo.sqlite.spec.js` (P1-9 · anular pagos), `validators.spec.js` (validateAnularPago) |

### CPV-08 · Cancelar una orden

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Cancelar conserva los pagos; una orden entregada no se cancela; una cancelada no recibe prendas ni pagos |
| Orden de ejecución | 8 |
| Requerimiento asociado | RF-11, RF-12, RN-11 a RN-14 |
| Precondición | Una orden abierta con un abono y otra *Entregada* |
| Pasos | 1. Cancelar la abierta. 2. Agregarle una prenda y un pago. 3. Cancelar la entregada |
| Postcondición | La orden abierta queda *Cancelada* con su abono intacto |
| Resultado esperado | 1 cancela; 2 y 3 se rechazan |
| Evidencia | `reglasNegocio.spec.js` (RN-11 a RN-14) |

### CPV-09 · Reabrir una orden entregada

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | La dueña puede reabrir una orden entregada; queda *En Proceso* y la reapertura queda en el historial |
| Orden de ejecución | 9 |
| Requerimiento asociado | RF-13, RF-14, RN-15, RN-16, RN-35 |
| Precondición | Orden *Entregada* |
| Pasos | 1. Reabrir la orden |
| Postcondición | Orden *En Proceso* con una línea de reapertura en el historial |
| Resultado esperado | Cambia de estado y el historial registra la reapertura con su fecha y hora |
| Evidencia | `reglasNegocio.spec.js` (RN-15, RN-16, RN-35) |

### CPV-10 · Aviso de orden lista por WhatsApp

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | El aviso se ofrece solo al entrar en *Lista para Entregar*; abre WhatsApp con el número en +57 y el mensaje escrito |
| Orden de ejecución | 10 |
| Requerimiento asociado | RF-39, RN-31, D-03 |
| Precondición | Orden con una prenda en proceso y clienta con celular `3001234567` |
| Pasos | 1. Terminar la última prenda. 2. Aceptar avisar |
| Postcondición | Queda registrado el aviso en el historial de notificaciones |
| Resultado esperado | Se abre `https://wa.me/573001234567?text=…` con «ya está lista» |
| Evidencia | `whatsapp.spec.js`, `reglasNegocio.spec.js` (RN-31), `flujo-orden.spec.js` paso 4 |

### CPV-11 · Recibo de la orden

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | El recibo lleva prendas, pagos, saldo, datos de la clienta, garantía y condiciones del taller (Ley 1480, art. 18) |
| Orden de ejecución | 11 |
| Requerimiento asociado | RF-42, RF-REC-01, D-09 |
| Precondición | Orden con prendas y un abono; garantía y condiciones configuradas |
| Pasos | 1. Generar el recibo |
| Postcondición | Ninguna; el recibo no modifica la base |
| Resultado esperado | El texto contiene cada elemento con los valores actuales |
| Evidencia | `whatsapp.spec.js` (recibo RF-42) |

### CPV-12 · Órdenes sin reclamar en más de 30 días

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Una orden lista se marca *sin reclamar* después de 30 días, contados desde la fecha más tardía entre la prometida y la de quedar lista. Es una alerta, no un abandono legal |
| Orden de ejecución | 12 |
| Requerimiento asociado | RF-47, RN-37 |
| Precondición | Órdenes listas con 30 y 31 días; otra terminada antes de lo prometido |
| Pasos | 1. Consultar las órdenes sin reclamar |
| Postcondición | Ninguna |
| Resultado esperado | Solo aparece la de 31 días; en la terminada antes de tiempo el plazo corre desde la fecha prometida |
| Evidencia | `reglasNegocio.spec.js` (RN-37) |

### CPV-13 · Migraciones de la base de datos

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Cada migración corre en su propia transacción; una que falla se revierte entera; una base más nueva que la app impide arrancar |
| Orden de ejecución | 13 |
| Requerimiento asociado | ARQUITECTURA §6, MANUAL_TECNICO §6 |
| Precondición | Base vacía, base a medio migrar y base en una versión mayor que la de la app |
| Pasos | 1. Arrancar con cada base |
| Postcondición | Base vacía y a medio migrar quedan en la versión 8 |
| Resultado esperado | Solo se aplican las pendientes; una sentencia fallida no registra su versión; la base más nueva lanza error y no se escribe |
| Evidencia | `migrationRunner.spec.js`, `saldo.sqlite.spec.js` (migraciones contra SQLite real) |

### CPV-14 · Los datos sobreviven a una recarga en la web

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | En la versión web la base vive en IndexedDB; una clienta registrada sigue ahí después de recargar. Prueba de punta a punta en Microsoft Edge |
| Orden de ejecución | 14 |
| Requerimiento asociado | RNF-15, D-13 |
| Precondición | Navegador limpio, sesión iniciada |
| Pasos | 1. Registrar una clienta. 2. Recargar la página. 3. Buscarla |
| Postcondición | La clienta existe en IndexedDB |
| Resultado esperado | Después de recargar la clienta aparece |
| Evidencia | `tests/e2e/persistence.spec.js` |

### CPV-15 · Crear órdenes seguidas sin mezclar datos

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Crear varias órdenes rápido no cruza clientas ni identificadores |
| Orden de ejecución | 15 |
| Requerimiento asociado | RN-03, RNF-10 |
| Precondición | Sesión iniciada |
| Pasos | 1. Crear órdenes para varias clientas sin esperar entre una y otra |
| Postcondición | Cada orden pertenece a la clienta correcta |
| Resultado esperado | Ninguna orden queda con la clienta o el número de otra |
| Evidencia | `tests/e2e/orden-creation.spec.js` |

### CPV-16 · Flujo completo de una orden

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | El recorrido de la modista de punta a punta en el navegador: clienta, recepción con fecha anterior, prenda, aviso por WhatsApp, abono Bre-B y entrega con deuda |
| Orden de ejecución | 16 |
| Requerimiento asociado | RF-01, RF-05, RF-17, RF-24, RF-33, RF-34, RF-39, RN-30 |
| Precondición | Navegador limpio; la app obliga a cambiar la clave de fábrica |
| Pasos | Los seis pasos de `flujo-orden.spec.js` |
| Postcondición | Orden *Entregada* con saldo 15.000 |
| Resultado esperado | Cada paso muestra lo que dice el SRS; entregar con deuda pide confirmación mostrando 15.000; no hay errores en la página |
| Evidencia | `tests/e2e/flujo-orden.spec.js` |

### CPV-17 · Volumen: 500 órdenes

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Prueba de volumen (guía, sección 1.1): con 500 órdenes, 150 clientas, 1.000 prendas y 500 abonos, mide 20 veces cada operación diaria con las consultas reales de la app. Mide el motor SQLite (sql.js) en el PC, no en el teléfono |
| Orden de ejecución | 17 |
| Requerimiento asociado | RNF-01, RNF-02, RNF-03, RNF-27 |
| Precondición | Base vacía con las migraciones aplicadas |
| Pasos | 1. Cargar el volumen. 2. Medir abrir una orden, registrar una orden, registrar un abono, listar todas y buscar |
| Postcondición | Base con 520 órdenes (500 más 20 creadas al medir) |
| Resultado esperado | Abrir una orden < 2 s, registrar una orden < 3 s, actualizar el saldo < 1 s, listar y buscar < 2 s |
| Evidencia | `src/database/__tests__/volumen.sqlite.spec.js`, [evidencias/2026-10-14/volumen.txt](evidencias/2026-10-14/volumen.txt) |

### CPV-18 · Copia de seguridad cifrada

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | La copia se cifra con AES-256-GCM y una clave derivada con PBKDF2 (600.000 iteraciones); sin la contraseña correcta, o con el archivo alterado, no se restaura |
| Orden de ejecución | 18 |
| Requerimiento asociado | RNF-17, RNF-18 |
| Precondición | Base con datos |
| Pasos | 1. Cifrar y descifrar. 2. Descifrar con otra contraseña. 3. Alterar el texto cifrado o el IV. 4. Cifrar dos veces lo mismo |
| Postcondición | Ninguna |
| Resultado esperado | 1 devuelve los datos exactos; 2 y 3 se rechazan; 4 produce cifrados distintos |
| Evidencia | `cryptoService.spec.js`, `useBackupRestore.spec.js` |

### CPV-19 · Bloqueo al volver de segundo plano

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | La app se bloquea si estuvo más de 2 minutos en segundo plano; un regreso sin salida registrada no la desbloquea |
| Orden de ejecución | 19 |
| Requerimiento asociado | RNF-07, RNF-09 |
| Precondición | Sesión iniciada |
| Pasos | 1. Salir y volver a los 30 s. 2. Salir y volver a los 3 min. 3. Volver sin salida registrada estando bloqueada |
| Postcondición | Solo 2 y 3 terminan con la pantalla de bloqueo |
| Resultado esperado | 1 no pide clave; 2 la pide; 3 sigue bloqueada |
| Evidencia | `useAppLock.spec.js` |

### CPV-20 · Dependencias sin vulnerabilidades conocidas

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Prueba de seguridad: las librerías que viajan en el APK y en la web no tienen vulnerabilidades críticas ni altas publicadas |
| Orden de ejecución | 20 |
| Requerimiento asociado | RNF-07; seguridad del APK |
| Precondición | `npm ci` terminado |
| Pasos | 1. `npm audit --omit=dev` |
| Postcondición | Ninguna |
| Resultado esperado | 0 críticas y 0 altas |
| Evidencia | [evidencias/2026-10-14/seguridad.txt](evidencias/2026-10-14/seguridad.txt), sección 1 |

### CPV-21 · Cabeceras de seguridad de la versión web

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Prueba de seguridad pasiva con una sola petición: la versión publicada entrega las cabeceras que protegen contra encuadre, rastreo del tipo de archivo, inyección de scripts y bajada a HTTP |
| Orden de ejecución | 21 |
| Requerimiento asociado | D-13, MANUAL_TECNICO §12 |
| Precondición | Versión publicada en `/costura-app/` |
| Pasos | 1. `curl -I https://proyectosena.online/costura-app/`. 2. `curl -I http://…` |
| Postcondición | Ninguna |
| Resultado esperado | Presentes `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy` y `Strict-Transport-Security`; `Server` sin versión; HTTP redirige a HTTPS |
| Evidencia | [evidencias/2026-10-14/seguridad.txt](evidencias/2026-10-14/seguridad.txt), sección 2 |

### CPV-22 · La documentación coincide con el código

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Regresión de la documentación: tablas y columnas del diagrama ER, módulos, rutas, métodos del diagrama de clases y enlaces entre documentos coinciden con el código. Comprueba estructura, no exactitud de cada regla (H14) |
| Orden de ejecución | 22 |
| Requerimiento asociado | Todos |
| Precondición | Ninguna |
| Pasos | 1. Correr `documentacion.spec.js` |
| Postcondición | Ninguna |
| Resultado esperado | Las 8 pruebas pasan |
| Evidencia | `src/__tests__/documentacion.spec.js` |

### CPV-23 · Escaneo de seguridad con OWASP ZAP

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Línea base pasiva de OWASP ZAP (guía, sección 1.2, pruebas de seguridad) sobre la versión web |
| Orden de ejecución | 23 |
| Requerimiento asociado | Seguridad de la versión web |
| Precondición | ZAP instalado; autorización para escanear el VPS compartido o una copia local del contenedor |
| Pasos | 1. Escaneo de línea base sobre `/costura-app/`. 2. Clasificar las alertas por riesgo |
| Postcondición | Informe HTML de ZAP en `evidencias/` |
| Resultado esperado | Ninguna alerta de riesgo alto; las medias con su defecto registrado |
| Evidencia | Pendiente |

### CPV-24 · Carga de la versión web con JMeter

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Prueba de carga (guía, sección 1.2): usuarios simultáneos abriendo la versión web. Solo aplica a la demostración web: el APK no tiene servidor |
| Orden de ejecución | 24 |
| Requerimiento asociado | D-13 |
| Precondición | JMeter instalado; contenedor local o autorización para cargar el VPS compartido |
| Pasos | 1. 20 usuarios durante 60 s pidiendo la página, el JavaScript y el `sql-wasm.wasm` |
| Postcondición | Ninguna |
| Resultado esperado | 0 % de errores y percentil 95 por debajo de 2 s |
| Evidencia | Pendiente |

### CPV-25 · Aceptación con la dueña

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Los diez pasos de la prueba de aceptación ([PLAN_DE_PRUEBAS §3](PLAN_DE_PRUEBAS.md)), hechos por la dueña en su teléfono |
| Orden de ejecución | 25 |
| Requerimiento asociado | Todo el SRS |
| Precondición | APK 1.2.0 instalado en el teléfono de la dueña; datos inventados |
| Pasos | Los diez de la tabla de la sección 3 del plan |
| Postcondición | Tabla llenada con resultado, ayudas y comentarios |
| Resultado esperado | Los diez pasos pasan sin ayuda |
| Evidencia | Pendiente |

### CPV-26 · Hardware del teléfono: cámara, huella y aviso de las 8:00

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Funciones que dependen del teléfono y que el navegador no puede probar |
| Orden de ejecución | 26 |
| Requerimiento asociado | RF-27, RNF-07, RF-68, RNF-31, P-06 |
| Precondición | APK instalado en un Android real, con huella registrada |
| Pasos | 1. Tomar una foto. 2. Desbloquear con huella. 3. Esperar el aviso de las 8:00 sin internet |
| Postcondición | Foto guardada en la prenda |
| Resultado esperado | Cada función responde como dice el SRS |
| Evidencia | Pendiente |

### CPV-27 · Usabilidad con la dueña

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Prueba de usabilidad (guía, sección 1.2): la dueña hace tareas reales sin ayuda y se miden errores y ayudas |
| Orden de ejecución | 27 |
| Requerimiento asociado | RNF-04, RNF-16 |
| Precondición | Teléfono con el APK y datos inventados |
| Pasos | Tareas T1 a T8 del [protocolo de observación](revision-2026-10-08/PROTOCOLO_UX.md) |
| Postcondición | Hoja de registro llenada |
| Resultado esperado | Cada tarea se completa sin ayuda y sin error |
| Evidencia | Pendiente |

### CPV-28 · Exploratoria: cancelar la cámara no anuncia éxito

| Elemento | Caso de prueba |
| --- | --- |
| Descripción | Prueba exploratoria nacida de la revisión (H17): si la modista abre la cámara y cancela, la app no debe decir que guardó una foto |
| Orden de ejecución | 28 |
| Requerimiento asociado | RNF-05, RF-27 |
| Precondición | Una prenda abierta |
| Pasos | 1. Tocar *Tomar foto*. 2. Cancelar la cámara |
| Postcondición | La prenda no tiene fotos nuevas |
| Resultado esperado | No aparece «Fotografía guardada» |
| Evidencia | Inspección de `usePrendas.js` y `useAsyncAction.js`; en el teléfono queda pendiente |
