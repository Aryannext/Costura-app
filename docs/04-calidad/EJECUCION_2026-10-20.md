# Ejecución de pruebas del 20 de octubre · web y APK

Registro de la regresión del 20 de octubre de 2026 (acción A12 del [plan de mejora](PLAN_DE_MEJORA.md)). Sigue el flujo de actividades de la guía SENA *Aplicación de pruebas de software* (figura 2): calendario, entorno, datos de prueba, criterios de entrada y ejecución. Las incidencias de esta ejecución están en la sección 7.

> **Commit probado:** `6a09fd3` (main, con el PR #26) · **Versión:** 1.2.0 (versionCode 10200) · **Responsable:** Cristian Cantillo Mejía · **Evidencias:** [evidencias/2026-10-20/](evidencias/2026-10-20/) · **Informe:** [INFORME_DE_RESULTADOS_2026-10-20](INFORME_DE_RESULTADOS_2026-10-20.md)

La web y el APK son la misma app compilada con Vite. Cambian la base de datos (sql.js en IndexedDB en la web, SQLite nativo en el teléfono), la cámara, los diálogos del sistema y el servidor. Por eso cada caso se registra en la plataforma donde se ejecutó.

---

## 1. Calendario de ejecución

Una jornada, el 20 de octubre de 2026 (hora de Colombia).

| Orden | Actividad | Casos | Hora |
| --- | --- | --- | --- |
| 1 | Línea base: pruebas unitarias y de integración con cobertura | CPV-01 a CPV-13, CPV-17, CPV-18, CPV-22 | 13:40 |
| 2 | Auditoría de dependencias | CPV-20 | 13:43 |
| 3 | Compilar el APK debug desde `6a09fd3` e instalarlo limpio en el emulador | Precondición del APK | 13:45 |
| 4 | Recorrido completo, tiempos, persistencia y arranque en el APK | CPV-14, CPV-16, CPV-29 | 13:47 a 14:02 |
| 5 | Cámara, fotos y textos del sistema en el APK | CPV-28, CPV-30, CPV-31 | 13:57 a 14:02 |
| 6 | Versión publicada: rutas, cabeceras y archivos | CPV-21, CPV-32 | 14:04 |
| 7 | Bloqueo al volver de segundo plano en el APK | CPV-19 | 14:03 a 14:06 |
| 8 | Pruebas de punta a punta en Edge, con el emulador encendido | CPV-14 a CPV-16 | 14:06 a 14:17 |
| 9 | Primer arranque con los datos borrados y recorrido sobre base limpia en el APK | CPV-16, CPV-29 | 14:19 |
| 10 | Pruebas de punta a punta en Edge con el equipo libre (emulador apagado) | CPV-14 a CPV-16 | 14:22 a 14:26 |
| 11 | Recorrido de la CSP sobre la compilación de producción y la versión publicada en el navegador | CPV-21 | 14:30 a 14:40 |

## 2. Verificación del entorno

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| PC | Windows 11, Node 24.19, Vitest 4.1.11, Playwright 1.62.1, Microsoft Edge | — |
| El APK sale del commit probado | `npm run build`, `cap sync android` y `gradlew assembleDebug` con JDK 21 sobre `6a09fd3`: compila; versionName 1.2.0, versionCode 10200 | — |
| Teléfono de pruebas | Emulador de Android Studio *Medium Phone*, Android 17 (API 37), x86_64, WebView Chrome 145.0.7632.218. **No es el teléfono de la dueña** | `apk/` |
| Cómo se maneja el APK | El build debug deja depurar el WebView. Playwright se conecta a él por CDP (`adb forward` al socket `webview_devtools_remote`) y repite los pasos de `tests/e2e/`. La cámara y los diálogos nativos se manejan con `adb` | [scripts/](evidencias/2026-10-20/scripts/) |
| La versión publicada es la del commit probado | Los 30 archivos que pide `https://proyectosena.online/costura-app/` tienen el mismo hash que una compilación local de `6a09fd3` con base `/costura-app/` | [web/hashes-produccion.txt](evidencias/2026-10-20/web/hashes-produccion.txt) |
| CI del commit probado | GitHub Actions sobre `6a09fd3`: éxito, incluido el job de la imagen Docker | [run 38761071563](https://github.com/Aryannext/Costura-app/actions/runs/38761071563) |
| Red del PC | El DNS local falló a ratos y el ping rondaba los 300 ms. Las peticiones a producción fijan la IP pública del servidor (`--resolve`). Por eso no se miden tiempos de carga de la web publicada | [web-produccion.txt](evidencias/2026-10-20/web-produccion.txt) |
| Chromium de escritorio | No arranca: Playwright 1.62 pide un Chromium que no está instalado, y Windows no deja ejecutar el que sí está («Permission denied»). Ver INC-03 | [e2e-chromium.txt](evidencias/2026-10-20/e2e-chromium.txt) |

## 3. Datos de prueba integrados

- Todos inventados: clientas «Clienta APK …», «Medición 0 … 4» y «SyncClient_…», teléfonos `300123…` y `300555…`, prendas «Pantalón · Dobladillo / Ruedo», abonos de 1.000 a 5.000 pesos y una foto de la escena virtual del emulador.
- Usuario y claves: los de prueba de `tests/e2e/helpers.js`, solo en el emulador y en servidores locales. En producción no se inició sesión.
- Cada recorrido de Playwright arranca con un navegador limpio. En el APK se instaló limpio y, para el recorrido final, se borraron los datos de la app (`pm clear`).

## 4. Criterios de entrada

| Criterio (del plan) | ¿Se cumple? | Observación |
| --- | --- | --- |
| El código compila | Sí | La web (`vite build`) y el APK (`assembleDebug`) |
| `npm ci` sin errores | Sí, en la CI | Localmente se usaron los `node_modules` del mismo `package-lock.json`, sin cambios desde el PR #26 |
| La base de la prueba arranca con las 8 migraciones | Sí | Unitarias contra SQLite real; en el APK, primer arranque tras `pm clear` |

## 5. Registro de ejecución

| Caso | Plataforma | Resultado obtenido | Estado | Incidencia | Evidencia |
| --- | --- | --- | --- | --- | --- |
| CPV-01 a CPV-13 | Motor común (Vitest + sql.js) | Pasan sus pruebas dentro de las 431 | Exitoso | — | [pruebas-unitarias.xml](evidencias/2026-10-20/pruebas-unitarias.xml) |
| CPV-14 | Web, Edge | `persistence.spec.js`: 4 de 4 corridas | Exitoso | — | [e2e-edge-sin-carga.txt](evidencias/2026-10-20/e2e-edge-sin-carga.txt) |
| CPV-14 | APK | Tras cerrar la app (`am force-stop`) y abrirla: pide la clave, y la clienta, la orden *Entregada* y el total por cobrar de $35.000 siguen ahí | Exitoso | — | [apk/arranque-y-persistencia.txt](evidencias/2026-10-20/apk/arranque-y-persistencia.txt) |
| CPV-15 | Web, Edge | `orden-creation.spec.js`: 7 de 8 corridas. La que falló buscó el historial en *Detalle* cuando la orden ya se había abierto en *Prendas* | Exitoso | INC-02 | [e2e-edge-repeticion-2.txt](evidencias/2026-10-20/e2e-edge-repeticion-2.txt) |
| CPV-16 | Web, Edge | `flujo-orden.spec.js`: 3 de 3 con el equipo libre; con el emulador encendido, 2 corridas de 10 pasaron su límite de tiempo | Exitoso | INC-01 | [e2e-edge-sin-carga.txt](evidencias/2026-10-20/e2e-edge-sin-carga.txt), [e2e-edge.txt](evidencias/2026-10-20/e2e-edge.txt) |
| CPV-16 | APK | Base limpia, 9 de 9 pasos: cambio obligatorio de clave, teléfono inválido rechazado, orden, prenda, orden *Lista* con WhatsApp y +57, abono Bre-B, abono mayor que el saldo bloqueado, entrega con deuda que pide confirmación y fecha de autorización de la clienta | Exitoso | INC-07 | [apk/flujo-2-base-limpia.json](evidencias/2026-10-20/apk/flujo-2-base-limpia.json), [capturas/](evidencias/2026-10-20/capturas/) |
| CPV-17 | Motor común | `volumen.sqlite.spec.js`: 5 de 5 con 500 órdenes | Exitoso | — | [pruebas-unitarias.txt](evidencias/2026-10-20/pruebas-unitarias.txt) |
| CPV-18 | Motor común | Copia cifrada: pasan sus pruebas | Exitoso | — | [pruebas-unitarias.xml](evidencias/2026-10-20/pruebas-unitarias.xml) |
| CPV-19 | APK | Fuera 34 s: vuelve sin pedir clave. Fuera 147 s: pide la clave | Exitoso | — | [apk/bloqueo-segundo-plano.json](evidencias/2026-10-20/apk/bloqueo-segundo-plano.json), [captura](evidencias/2026-10-20/capturas/apk-12-bloqueo-tras-147s.png) |
| CPV-20 | Dependencias | `npm audit --omit=dev` y `npm audit`: 0 vulnerabilidades | Exitoso | — | [seguridad-dependencias.txt](evidencias/2026-10-20/seguridad-dependencias.txt) |
| CPV-21 | Web publicada y compilación de producción | CSP, política de permisos, nosniff, Referrer-Policy y X-Frame-Options en la página y en los archivos; `Server: nginx` sin versión; HTTP redirige a HTTPS. Recorrido completo con la CSP real: 0 violaciones. HSTS no se evalúa: es decisión del dominio | Exitoso | — | [web-produccion.txt](evidencias/2026-10-20/web-produccion.txt), [web/recorrido-csp.json](evidencias/2026-10-20/web/recorrido-csp.json) |
| CPV-22 | Documentación | `documentacion.spec.js`: 8 de 8 | Exitoso | — | [pruebas-unitarias.xml](evidencias/2026-10-20/pruebas-unitarias.xml) |
| CPV-23, CPV-24 | — | No se ejecutaron: ZAP y JMeter siguen sin instalar y sin autorización para el VPS compartido | Bloqueado | — | — |
| CPV-25, CPV-27 | — | Necesitan a la dueña | Bloqueado | — | — |
| CPV-26 | — | Pide un Android real con huella registrada. La cámara se probó en el emulador (CPV-28 y CPV-30); la huella y el aviso de las 8:00, no | Bloqueado | — | — |
| CPV-28 | APK | Abrir *Take Picture* y volver con Atrás: ningún aviso y ninguna foto nueva. Es la primera vez que se reproduce en Android (en el ciclo anterior fue por inspección) | Exitoso | — | [captura](evidencias/2026-10-20/capturas/apk-09-camara-cancelada.png) |
| CPV-29 | APK | Medido dentro del WebView, 5 veces cada uno: abrir orden 464 ms de mediana (máx. 634); registrar orden 1.286 ms (máx. 1.963); saldo visible tras un abono 308 ms (máx. 805) | Exitoso | INC-08 | [apk/tiempos-rnf.json](evidencias/2026-10-20/apk/tiempos-rnf.json), [apk/tiempo-abono-saldo.json](evidencias/2026-10-20/apk/tiempo-abono-saldo.json) |
| CPV-30 | APK | Foto con la cámara del emulador: un aviso «Fotografía guardada», miniatura visible y archivo `prenda_2_….jpeg` en `files/`. Al eliminarla: «Fotografía eliminada» y el archivo desaparece (DEF-06) | Exitoso | — | [capturas/apk-10-foto-guardada.png](evidencias/2026-10-20/capturas/apk-10-foto-guardada.png) |
| CPV-30 | Web, compilación de producción con la CSP real | Foto de 64×64 desde archivo: se guarda y la miniatura la muestra (`data:image/jpeg`, 64×64) | Exitoso | — | [web/recorrido-csp.json](evidencias/2026-10-20/web/recorrido-csp.json), [captura](evidencias/2026-10-20/capturas/web-01-foto-con-csp.png) |
| CPV-31 | APK y web | El menú de la cámara dice «Photo / From Photos / Take Picture» y la confirmación para borrar una foto dice «CANCEL / OK», también con la app en español de Colombia | Fallido | INC-04, INC-05 | [capturas/apk-08…](evidencias/2026-10-20/capturas/apk-08-menu-camara-con-app-en-es-CO.png), [capturas/apk-11…](evidencias/2026-10-20/capturas/apk-11-confirm-ingles-con-app-en-es-CO.png) |
| CPV-32 | Web publicada | Mismos 30 archivos que `6a09fd3`; rutas profundas 200; archivo inexistente 404; `/costura-app` redirige a `/costura-app/`. En Edge, a 360 px y en escritorio: llega al ingreso sin errores, sin violaciones y sin desborde horizontal | Exitoso | — | [web/hashes-produccion.txt](evidencias/2026-10-20/web/hashes-produccion.txt), [web/produccion-navegador.json](evidencias/2026-10-20/web/produccion-navegador.json) |

## 6. Ejecución automatizada

| Conjunto | Comando | Resultado | Evidencia |
| --- | --- | --- | --- |
| Unitarias y de integración | `npx vitest run --coverage --reporter=junit` | 431 de 431, en 43 archivos y 69 s. Contadas con `resumen_resultados.py` sobre el JUnit XML | [pruebas-unitarias.xml](evidencias/2026-10-20/pruebas-unitarias.xml) |
| Cobertura | La misma corrida | Sentencias 67,90 %, ramas 64,07 %, funciones 71,05 %, líneas 71,18 % (mínimos de la CI: 62 / 58 / 64 / 65) | [pruebas-unitarias.txt](evidencias/2026-10-20/pruebas-unitarias.txt) |
| De punta a punta, Edge, equipo libre | `PW_CHANNEL=msedge npx playwright test --repeat-each=3` | 9 de 9 | [e2e-edge-sin-carga.txt](evidencias/2026-10-20/e2e-edge-sin-carga.txt) |
| De punta a punta, Edge, con el emulador encendido | La suite y dos tandas repetidas | 13 de 16 (2 + 4 + 7); los 3 fallos son de tiempo de la prueba (INC-01, INC-02) | [e2e-edge.txt](evidencias/2026-10-20/e2e-edge.txt), [e2e-edge-repeticion.txt](evidencias/2026-10-20/e2e-edge-repeticion.txt), [e2e-edge-repeticion-2.txt](evidencias/2026-10-20/e2e-edge-repeticion-2.txt) |
| De punta a punta, Chromium | `npx playwright test` | No arrancó el navegador | [e2e-chromium.txt](evidencias/2026-10-20/e2e-chromium.txt) |
| APK en el emulador | `node scripts/apk-flujo.mjs`, `apk-medir.mjs`, `apk-abono.mjs`, `apk-arranque.mjs`, `apk-primer.mjs`, `apk-bloqueo.mjs` | Ver CPV-14, CPV-16, CPV-19 y CPV-29 | [apk/](evidencias/2026-10-20/apk/) |
| CSP sobre la compilación de producción | `node scripts/csp.mjs` con `vite preview --base=/costura-app/` | 6 pasos, 0 violaciones, 0 errores | [web/recorrido-csp.json](evidencias/2026-10-20/web/recorrido-csp.json) |

**Arranque del APK en el emulador** (no hay requisito que lo limite; se anota como dato):

| Medición | Primer cuadro | Pantalla usable |
| --- | --- | --- |
| Primer arranque tras borrar los datos | 4,0 s | 9,1 s (ingreso) |
| Cinco arranques en frío con datos | 5,0 a 6,9 s (mediana 6,2 s) | 8,5 a 12,7 s (mediana 10,4 s), pantalla de bloqueo |

El primer arranque después de instalar tardó cerca de un minuto. No se cronometró: Android optimiza la app la primera vez y eso no se repite.

## 7. Incidencias

Ciclo de vida: Nuevo → Abierto → Asignado → Diferido / Reabierto → Verificado → Cerrado ([reporte de defectos](REPORTE_DE_DEFECTOS.md#1-cómo-se-gestiona-una-incidencia)).

| ID | Resumen | Caso | Entradas | Esperado | Obtenido | Impacto en las pruebas | Estado | ¿Es defecto? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INC-01 | `flujo-orden.spec.js` se pasa de tiempo | CPV-16, web | Suite en Edge con el emulador encendido | La prueba pasa | 2 de 10 corridas fallaron: una no vio «Orden #» en 10 s y otra se pasó de los 30 s del caso | Repetir con el equipo libre | Diferido | No: con el equipo libre pasa 3 de 3. La prueba usa tiempos fijos que un PC cargado no alcanza. Acción A13 |
| INC-02 | `orden-creation.spec.js` no encuentra el historial | CPV-15, web | Tres envíos simultáneos del formulario | Una orden creada, dos rechazadas y su historial | La orden y los rechazos salen bien, pero la prueba busca el historial en *Detalle* cuando la vista ya pasó a *Prendas* | Ninguno | Diferido | No: una orden pendiente se abre en *Prendas* por diseño, y la prueba no espera ese cambio. Acción A13 |
| INC-03 | Chromium de escritorio no arranca | RNF-15 | `npx playwright test` sin `PW_CHANNEL` | Las 3 pruebas corren en Chromium | `Executable doesn't exist` (falta la versión 1234); el Chromium 1248 instalado da `Permission denied` | Chrome y Firefox siguen sin probarse en escritorio | Abierto | No: es del entorno |
| INC-04 | El menú de la cámara está en inglés | CPV-31 | *Fotos* → *Tomar foto*, con la app en `es-CO` | Opciones en español | «Photo / From Photos / Take Picture» | Ninguno | Nuevo | Sí → [DEF-15](REPORTE_DE_DEFECTOS.md#def-15) |
| INC-05 | La confirmación para borrar una foto está en inglés | CPV-31 | Borrar una foto en el APK, con la app en `es-CO` | Botones en español | «CANCEL / OK» | Ninguno | Nuevo | Sí → [DEF-16](REPORTE_DE_DEFECTOS.md#def-16) |
| INC-06 | El APK pide `favicon.svg` en rutas que no existen | CPV-16, APK | Navegar a `/ordenes/…` y `/clientes/…` | Sin errores en la consola | Dos 404: `/ordenes/favicon.svg` y `/clientes/favicon.svg` | Ninguno | Diferido | No como defecto visible: con `base: './'` Vite deja el ícono relativo, y el WebView lo vuelve a pedir en rutas profundas. El WebView no muestra ícono; en la web publicada la base es absoluta y no pasa |
| INC-07 | Fallos del guion del APK | CPV-16, APK | Primer recorrido | — | El guion intentó pulsar «Registrar Pago» con un abono mayor que el saldo, pero la app lo deja deshabilitado; y buscó una orden entregada en *Activas*, cuando está en *Historial* | Se corrigió el guion y se repitió | Cerrado | No: la app se comportó según CPV-06 y RN-30 |
| INC-08 | El abono tarda más de 1 s si se cuenta el cierre del modal | CPV-29 | Registrar un abono en el APK | Saldo actualizado en menos de 1 s (RNF-03) | El saldo cambia a los 308 ms (máx. 805); el modal termina su animación a los 653 ms (máx. 1.144) | Se midió el momento en que cambia el saldo, que es lo que pide RNF-03 | Cerrado | No: RNF-03 se cumple |

### Seguimiento

| Incidencia | Fecha | Estado anterior | Estado nuevo | Nota |
| --- | --- | --- | --- | --- |
| INC-01 | 20 oct | Nuevo | Diferido | Se descartó un fallo de la app: el error «cannot start a transaction within a transaction» del registro viene de `orden-creation.spec.js`, que lo provoca a propósito |
| INC-02 | 20 oct | Nuevo | Diferido | Causa leída en `OrdenDetailView.vue` (`onMounted` abre *Prendas* si la orden está pendiente o en proceso) |
| INC-04, INC-05 | 20 oct | Nuevo | Nuevo | Pasan al reporte de defectos. Sin corregir: probar y corregir son trabajos distintos |
| INC-07, INC-08 | 20 oct | Nuevo | Cerrado | No son defectos |
