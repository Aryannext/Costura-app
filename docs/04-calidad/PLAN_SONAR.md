# Plan para cerrar los problemas de SonarCloud en `main`

> **Fecha:** 8 de octubre de 2026 · **Fuente:** API pública de SonarCloud, proyecto `Aryannext_Costura-app`, rama `main` (commit `1b83b87`)

## Por qué `main` falla y los pull requests no

En un pull request, SonarCloud solo revisa lo que cambió en ese pull request; por eso los PR #1 a #4 pasaron con 0 problemas nuevos. En `main` revisa todo el **código nuevo desde la versión base**, que incluye código escrito antes de octubre que nunca se había corregido.

La revisión de calidad de `main` falla por dos condiciones:

| Condición | Valor | Exigido | Causa |
| --- | --- | --- | --- |
| Confiabilidad en código nuevo | C | A | 22 problemas de severidad media |
| Seguridad en código nuevo | C | A | 1 problema de severidad media en Gradle |

## Inventario: 89 problemas abiertos

| Calidad | Alta | Media | Baja | Total | ¿Tumba la revisión? |
| --- | --- | --- | --- | --- | --- |
| Seguridad | — | 1 | 1 | 2 | **Sí** |
| Confiabilidad | — | 22 | 8 | 30 | **Sí** |
| Mantenibilidad | 1 | 24 | 32 | 57 | No |

## Pasos

### Paso 1. Seguridad (2 problemas) · hecho en la rama `corrige-sonar-main`

| Problema | Archivo | Solución |
| --- | --- | --- |
| Las dependencias de Gradle no tienen archivo de bloqueo (S8569, media) | `android/build.gradle` | Bloqueo de dependencias activado; archivos `gradle.lockfile`, `app/gradle.lockfile` y `buildscript-gradle.lockfile` generados por Gradle. El APK compila con ellos |
| Tráfico sin cifrar permitido por omisión en Android viejo (S5332, baja) | `AndroidManifest.xml` | `android:usesCleartextTraffic="false"`. La app solo usa HTTPS |

### Paso 2. Confiabilidad (30 problemas) · hecho en la rama `corrige-sonar-main`

| Problema | Cuántos | Solución |
| --- | --- | --- |
| Campo de formulario sin etiqueta asociada | 19 | `id` en cada campo y su `<label for>`; si la etiqueta no se ve en el diseño, con la clase `sr-only` |
| Elemento que se toca pero no responde al teclado | 5 | `@keydown.enter` o `@keydown.esc` |
| Imagen sin texto alternativo | 1 | `alt="Fotografía de la prenda"` |
| `isNaN` y `parseInt` globales | 2 | `Number.isNaN` y `Number.parseInt(…, 10)` |
| `fromCharCode` y `charCodeAt` | 2 | `fromCodePoint` y `codePointAt`; mismo resultado con bytes de 0 a 255 |
| `export let db` | 1 | **Se deja a propósito** con `// NOSONAR` y la razón escrita: es la referencia viva a la conexión, que vale `null` antes de abrir y después de restaurar una copia. Cambiarla obliga a tocar las once consultas a 17 días de la entrega |

**Resultado esperado:** al fusionar esta rama, la revisión de calidad de `main` pasa a A en confiabilidad y seguridad.

### Paso 3. Errores que se tragan en silencio (8 problemas, S2486) · hecho en la rama `mantenibilidad-sonar`

Bloques `catch` vacíos en `AjustesView.vue` (4), `useNotificacionesLocales.js`, `AppLockScreen.vue`, `photoStorage.js` y `OrdenDetailView.vue`. En cada uno: registrar el error con `console.warn`, o escribir en un comentario por qué se ignora. Es el más útil de los pasos restantes: un error que nadie ve es un error que nadie arregla (relacionado con RNF-19).

### Paso 4. Accesibilidad (15 problemas) · hecho en la rama `mantenibilidad-sonar`

- **S6819 (9):** elementos con `role="button"`, `role="list"`, `role="dialog"`, etc. Cambiarlos por el elemento nativo (`<button>`, `<ul>`/`<li>`, `<dialog>`), con su CSS ajustado para que se vean igual. Archivos: `AppHeader.vue`, `OrdenCard.vue`, `PrendaCard.vue`, `ClienteDetailView.vue`, `TimelineProgressBar.vue`, `AppLockScreen.vue`. Las tarjetas a las que hoy se les agregó `role="button"` (`AyudaView.vue`, `ClienteCard.vue`) entran aquí también.
- **S7924 (2):** contraste insuficiente en `IosActionSheet.vue` y `PhotoViewerModal.vue`.

Hay que revisar en el navegador que cada pantalla se vea igual que antes, con capturas antes y después.

### Paso 5. Limpieza menor (20 problemas) · hecho en la rama `mantenibilidad-sonar`

Cambios de una línea, sin efecto en el comportamiento:
- importaciones sin usar (3);
- asignaciones inútiles en `useClientes.js` (2);
- escape innecesario en `validators.js`;
- encadenamiento opcional (5);
- operador opuesto (2);
- `export … from`;
- `.at(-1)`;
- `Date.now()`;
- un solo `push` con varios elementos;
- plantillas anidadas;
- `if` solo dentro de un `else` (2);
- el nombre del parámetro de `catch`.

### Paso 6. Estructura (18 problemas) · hecho en la rama `mantenibilidad-sonar`

- **Complejidad de `useUpdates.js` (S3776, alta):** partir la función de 22 puntos de complejidad en funciones pequeñas, con pruebas antes de tocarla.
- **Funciones dentro de funciones (S7721, 5):** sacar a nivel de módulo las que no usan el estado del composable.
- **`await` dentro de un bucle (S9382, 8):** en las migraciones y en las fotos **es a propósito**: van una tras otra para no mezclar transacciones y no cargar todas las fotos en memoria a la vez. Se documenta en el código y se marca como aceptado. Donde no haga falta ir en orden, se usa `Promise.all`.
- **`await` de nivel superior (S7785, 2):** en `main.js` e `index.html`. Hay que comprobar que el navegador del APK lo soporte antes de cambiarlo.
- **`Blob#text()` en lugar de `FileReader` (S7756).**

### Paso 7. Verificación final

- Pruebas unitarias, de punta a punta y de documentación en verde.
- APK compilado y probado en el emulador.
- En SonarCloud, la rama `main` con la revisión de calidad en verde y los problemas restantes justificados.

## Resultado de los pasos 3 a 6 (8 de octubre)

Se cerraron los 61 problemas que quedaban en `main` después del PR #5:

| Grupo | Cómo se resolvió |
| --- | --- |
| Errores en silencio (8) | Cada `catch` registra el error con `console.warn` o `console.error` |
| Accesibilidad (15) | Las tarjetas que se tocan son `<button>` de verdad con la clase global `boton-tarjeta`; los estados de la prenda son un `<fieldset>`; el avance de la orden es una `<ol>`; la pantalla de bloqueo es un `<dialog>`; la miniatura de la foto va dentro de un botón; dos colores con más contraste |
| Limpieza (20) | Cambios de una línea sin efecto en el comportamiento. `!(x > 0)` no se cambió por `x <= 0`, porque con un valor vacío no significan lo mismo |
| `useUpdates.js` | Funciones pequeñas (`isNewer`, `marcarDisponible`, `avisar`). Antes se escribieron 7 pruebas del comportamiento existente, y siguen pasando. El módulo se eliminó después, al quitar las actualizaciones remotas de pago (D-14) |
| Funciones dentro de composables (5) | Movidas a nivel de módulo; ninguna usaba estado interno |
| `await` en bucles (8) | En paralelo donde las operaciones son independientes (tamaño de fotos, claves de Telegram). Uno tras otro, con `// NOSONAR` y la razón, en las migraciones, la lectura y escritura de fotos (memoria) y las escrituras sobre la misma conexión |
| `await` de nivel superior (2) | En `main.js` y en el script de `index.html` |

**Comprobación visual:** se tomaron capturas de ocho pantallas antes y después, a 390 px de ancho: lista de órdenes, clientes, detalle de clienta, detalle de orden, prendas, ayuda, avisos y pantalla de bloqueo. Son idénticas píxel a píxel, salvo un aviso temporal que salió en una sola de las dos tomas.

## Orden y prioridad

1. **Pasos 1 y 2:** ya hechos. Arreglan la revisión de calidad de `main` en un solo pull request.
2. **Paso 3:** antes de la entrega, porque mejora el diagnóstico en el taller.
3. **Pasos 4 y 5:** antes de la entrega si hay tiempo. Son seguros y se pueden explicar en la sustentación.
4. **Paso 6:** después de la prueba con la dueña. Tocar la estructura cerca de la entrega es el cambio con más riesgo y menos beneficio visible.
