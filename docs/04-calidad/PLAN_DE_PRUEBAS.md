# Plan de pruebas · Atelier Manager

Qué se prueba, cómo se prueba y qué falta probar.

> **Revisado:** 7 de octubre de 2026

---

## 1. Niveles de prueba

| Nivel | Herramienta | Qué cubre | Cuándo corre |
| --- | --- | --- | --- |
| Unitarias y de integración | Vitest + Vue Test Utils + sql.js | Las 40 reglas de negocio contra SQLite real, validaciones, saldo, estados, migraciones, copia de seguridad, avisos, recibo y vistas | En cada cambio, en GitHub Actions |
| Documentación | Vitest (`documentacion.spec.js`) | Que diagramas, módulos, rutas y enlaces coincidan con el código | En cada cambio, en GitHub Actions |
| De punta a punta | Playwright | Tres recorridos completos en el navegador: crear clienta y orden, el flujo completo de una orden y que los datos sobrevivan a una recarga | A mano antes de cada entrega |
| Calidad estática | SonarCloud | Confiabilidad y seguridad del código nuevo | En cada pull request |
| Versión web | `curl` en GitHub Actions | La imagen Docker responde, las rutas profundas cargan y los encabezados de seguridad están | En cada cambio |
| Aceptación | La dueña, en su teléfono | Que la app sirva en el taller real (sección 3) | Antes de la entrega |

## 2. Cómo correrlas

```bash
npm run test:unit
```

```bash
PW_CHANNEL=msedge npx playwright test
```

El resultado de cada ejecución en GitHub Actions queda en la pestaña *Actions* del repositorio, con el commit exacto que se probó.

**Por qué las pruebas usan SQLite real.** Una simulación de la base aceptaría cualquier SQL; con sql.js las restricciones, transacciones y migraciones son las mismas del teléfono. Así se detectaron errores que las simulaciones dejaban pasar, como el saldo que se descuadraba (P1-4).

**Cómo se prueba cada regla.** Cada una de las 40 reglas del [SRS](../01-requisitos/SRS.md) tiene un bloque `describe('RN-xx · ...')` en `src/__tests__/reglasNegocio.spec.js`. La última prueba del archivo lee el SRS y falla si alguna regla no tiene su bloque.

## 3. Prueba de aceptación con la dueña

Se hace en el teléfono de la dueña, con datos inventados, antes de usarla con clientas reales. Quien acompaña anota el resultado de cada paso sin ayudarle, salvo que se quede bloqueada.

**Datos de la prueba:** versión del APK, fecha, modelo del teléfono, versión de Android.

| # | Paso | Resultado esperado | ¿Pasó? | ¿Necesitó ayuda? | Comentario de la dueña |
| --- | --- | --- | --- | --- | --- |
| 1 | Entrar con la clave de fábrica y cambiarla | Pide la clave nueva antes de dejar entrar | | | |
| 2 | Registrar una clienta inventada, leyéndole el aviso de privacidad | Sin la casilla no deja guardar; con la casilla, sí | | | |
| 3 | Crear una orden con dos prendas y una foto | La orden queda *En Proceso* con el total correcto | | | |
| 4 | Avisar por WhatsApp que se recibió la ropa | Se abre WhatsApp con el mensaje y el número con +57 | | | |
| 5 | Registrar un abono parcial | El saldo baja en lo abonado | | | |
| 6 | Terminar la primera prenda y después la segunda | Con la segunda, la orden pasa sola a *Lista* y ofrece avisar | | | |
| 7 | Entregar la orden con saldo pendiente | Pide confirmación mostrando cuánto se debe | | | |
| 8 | Compartir el recibo | Lleva prendas, abonos, saldo, garantía y condiciones | | | |
| 9 | Guardar una copia de seguridad en Drive | Pide la contraseña maestra y abre el menú Compartir | | | |
| 10 | Al día siguiente, revisar el aviso de las 8:00 | Llega a las 8:00 con las entregas del día | | | |

**Preguntas para la dueña al terminar:**
1. ¿Qué fue lo más difícil?
2. ¿Hay algo que hace en el cuaderno que la app no le deja hacer? (Por ejemplo, recibir ropa sin saber todavía el precio).
3. ¿Usaría la app mañana con una clienta real?

Las respuestas van a [DECISIONES.md](../05-gestion/DECISIONES.md) si cambian algo de la app.

## 4. Lo que falta probar

| Qué | Por qué no se ha probado | Requisito |
| --- | --- | --- |
| Cámara, huella y aviso de las 8:00 en el teléfono de la dueña | Solo se probaron en el emulador de Android | P-06 |
| Tiempos de respuesta con 500 órdenes | Hay que medirlos en el teléfono real | RNF-01, RNF-02, RNF-03 |
| Restaurar una copia con fotos en otro teléfono | Se probó en el emulador | RNF-18 |
| Prueba de aceptación de la sección 3 | Pendiente de hacer con la dueña | Todo el SRS |

Los informes de auditoría anteriores, con los fallos encontrados y cómo se corrigieron, están en [historico/](historico/).
