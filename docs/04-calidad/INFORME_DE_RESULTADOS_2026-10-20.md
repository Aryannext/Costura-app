# Informe de resultados del 20 de octubre · web y APK

Resultado de la regresión de la versión 1.2.0 en la versión web publicada y en el APK (acción A12 del [plan de mejora](PLAN_DE_MEJORA.md)). Tiene los cuatro apartados de la guía SENA *Aplicación de pruebas de software* (sección 1.3): alcance, resumen, defectos y conclusiones. El detalle de cada caso, el entorno y las incidencias está en la [ejecución del 20 de octubre](EJECUCION_2026-10-20.md). La primera ejecución, del 14 de octubre, está en el [informe anterior](INFORME_DE_RESULTADOS.md).

> **Fecha de ejecución:** 20 de octubre de 2026 · **Commit probado:** `6a09fd3` (main, el mismo publicado en `proyectosena.online/costura-app/`) · **Responsable:** Cristian Cantillo Mejía · **Evidencias:** [evidencias/2026-10-20/](evidencias/2026-10-20/)

---

## 1. Alcance

**Se incluye:**
- **Toda la suite automática** sobre el commit publicado: reglas de negocio, volumen, copia de seguridad, documentación y seguridad de las dependencias.
- **La versión web publicada:**
  - Comprobación de que corresponde al commit probado.
  - Rutas y cabeceras de seguridad.
  - Carga en Edge a 360 px y en escritorio, sin iniciar sesión.
- **La compilación de producción** recorrida con la CSP real: orden, foto, reportes, tutorial y recarga.
- **Las pruebas de punta a punta en Edge.**
- **El APK compilado del mismo commit, en un emulador de Android 17:**
  - Recorrido completo de una orden.
  - Tiempos de RNF-01 a RNF-03.
  - Arranque, persistencia al cerrar la app y bloqueo al volver.
  - Cámara y fotos.
  - Textos del sistema.

**No se incluye:**
- **El teléfono real:** huella, aviso de las 8:00 y los tiempos que cuentan para el SRS (CPV-26). El emulador no lo reemplaza.
- **La aceptación y la usabilidad con la dueña** (CPV-25, CPV-27).
- **OWASP ZAP y JMeter** (CPV-23, CPV-24): las herramientas no están instaladas y falta autorización para el VPS compartido.
- **Chrome y Firefox de escritorio:** Chromium no arrancó en este PC (INC-03) y Firefox no está instalado. Sí se probaron dos motores Chromium: Edge y el WebView de Android.
- **La copia a Drive y el menú Compartir en el APK:** su lógica está cubierta por las pruebas unitarias (CPV-18).

**Criterios de entrada:** se cumplieron (ejecución, sección 4).

## 2. Resumen de pruebas

| Casos de prueba | Cantidad |
| --- | --- |
| Planificados | 32 |
| Ejecutados | 27 |
| Exitosos | 26 |
| Fallidos | 1 |
| Bloqueados | 5 |
| No ejecutados | 0 |

De los ejecutados pasa el 96 % (26 de 27). El fallido es CPV-31: los textos en inglés del menú de la cámara y de un diálogo. Los bloqueados son los mismos del 14 de octubre: dependen del teléfono real, de la dueña o de herramientas sin instalar.

**Frente a la ejecución del 14 de octubre:**
- **Casos:** había 28 planificados, 23 ejecutados y 3 fallidos. Los fallidos eran CPV-20, CPV-21 y CPV-28, y hoy pasan los tres.
- **Casos nuevos:** se agregaron cuatro para el APK y el despliegue (CPV-29 a CPV-32).

**Por plataforma:**

| Caso | Web | APK (emulador) |
| --- | --- | --- |
| CPV-14 · Los datos sobreviven | Exitoso (recarga) | Exitoso (cerrar y abrir la app) |
| CPV-16 · Flujo completo de una orden | Exitoso | Exitoso, 9 de 9 pasos |
| CPV-19 · Bloqueo al volver | Cubierto por pruebas unitarias | Exitoso: 34 s no bloquea, 147 s sí |
| CPV-28 · Cancelar la cámara | — | Exitoso |
| CPV-29 · Tiempos de respuesta | — | Exitoso |
| CPV-30 · Tomar, ver y borrar una foto | Exitoso (con la CSP real) | Exitoso (el archivo se borra) |
| CPV-31 · Textos del sistema en español | Fallido (menú de la cámara) | Fallido (menú de la cámara y confirmación) |
| CPV-32 · Versión publicada = commit probado | Exitoso | — |

**Pruebas automáticas que respaldan los casos:**

| Conjunto | Resultado | Evidencia |
| --- | --- | --- |
| Unitarias y de integración (Vitest) | 431 de 431, en 43 archivos | [pruebas-unitarias.xml](evidencias/2026-10-20/pruebas-unitarias.xml) |
| De punta a punta (Playwright, Edge) | 9 de 9 con el PC libre; 13 de 16 con el emulador encendido (INC-01, INC-02) | [e2e-edge-sin-carga.txt](evidencias/2026-10-20/e2e-edge-sin-carga.txt) |
| Recorrido con la CSP real | 6 pasos, 0 violaciones | [web/recorrido-csp.json](evidencias/2026-10-20/web/recorrido-csp.json) |
| Dependencias (`npm audit`) | 0 vulnerabilidades | [seguridad-dependencias.txt](evidencias/2026-10-20/seguridad-dependencias.txt) |

**Cobertura** de `src/database`, `src/composables` y `src/services`, por encima del mínimo de la CI (62 / 58 / 64 / 65) y mayor que el 14 de octubre:

| Sentencias | Ramas | Funciones | Líneas |
| --- | --- | --- | --- |
| 67,90 % (62,98 %) | 64,07 % (59,95 %) | 71,05 % (64,80 %) | 71,18 % (66,26 %) |

Entre paréntesis, el valor del 14 de octubre.

### Tiempos en el APK

Emulador de Android 17, SQLite nativo. Cada operación se midió 5 veces dentro del WebView, del toque a la pantalla actualizada.

| Operación | Mediana | Máximo | Límite del SRS | Cumple |
| --- | --- | --- | --- | --- |
| Abrir una orden desde la lista (RNF-01) | 464 ms | 634 ms | 2 s | Sí |
| Registrar una orden con clienta nueva (RNF-02) | 1.286 ms | 1.963 ms | 3 s | Sí |
| Ver el saldo nuevo tras un abono (RNF-03) | 308 ms | 805 ms | 1 s | Sí |

- **Comparación con la base sola:** en el PC, la base sola respondía en menos de 6 ms (CPV-17). En el APK cuentan además el puente de Capacitor, el disco y el dibujo de la pantalla, y aun así sobra margen.
- **RNF-03:** es el más justo. Si se cuenta hasta que termina la animación de cierre del modal, el máximo es de 1,1 s. El saldo, que es lo que pide el requisito, cambia antes (INC-08).
- **Arranque:** no tiene límite en el SRS. Con datos, la pantalla queda usable en una mediana de 10,4 s en el emulador.

## 3. Defectos

El detalle de cada uno está en el [reporte de defectos](REPORTE_DE_DEFECTOS.md).

**Detectados en esta ejecución:**

| ID | Título | Severidad | Estado |
| --- | --- | --- | --- |
| DEF-15 | El menú de la cámara está en inglés | Baja | Nuevo |
| DEF-16 | La confirmación para borrar una foto está en inglés | Baja | Nuevo |

**Estado de los anteriores:**
- **13 cerrados:** DEF-01 a DEF-06 y DEF-08 a DEF-14. Sus pruebas pasaron sobre el commit publicado.
- **Sin cambios:** DEF-07 sigue *Abierto*, a la espera de la decisión de la dueña (A7).

**Análisis** (guía, sección 1.3):
- **Impacto:** DEF-15 y DEF-16 no tocan datos ni dinero. La modista tiene que adivinar qué opción abre la cámara y confirmar con «OK» un borrado. Para una usuaria que no lee inglés son una barrera, aunque pequeña.
- **Condiciones:** el menú de la cámara aparece cada vez que se toma una foto. La confirmación aparece solo al borrar una foto.
- **Variación de configuración:** se repitió con la app en español de Colombia y los textos no cambiaron. Vienen fijos de Capacitor, no del idioma del teléfono, así que en el teléfono de la dueña se verían igual. En la web, el menú de la cámara también está en inglés.
- **Severidad:** baja, según la escala del reporte: es un detalle de texto sin efecto en los datos.
- **Incidencias que no fueron defectos:** seis. Tres son del entorno o de las pruebas (INC-01 a INC-03), una no se ve en la app (INC-06) y dos son errores del guion o de la medición (INC-07, INC-08). Todas están en la [ejecución](EJECUCION_2026-10-20.md#7-incidencias).

## 4. Conclusiones

1. **La versión publicada y el APK funcionan igual que en las pruebas.**
   - Lo que sirve `proyectosena.online/costura-app/` sale del commit probado, archivo por archivo.
   - El APK compilado de ese commit hace el recorrido completo de una orden sin errores.
2. **Las correcciones del 14 y 15 de octubre se mantienen.**
   - Se cerraron 13 defectos y ninguno volvió a aparecer.
   - DEF-05 y DEF-06 se reprodujeron por primera vez en Android, y quedaron corregidos.
3. **En el emulador, el APK cumple los tiempos de RNF-01 a RNF-03 con margen**, aunque el de RNF-03 es el más justo. Esto no cierra esos requisitos: el teléfono de la dueña puede ser más lento que el emulador de un PC.
4. **El único fallo nuevo es de idioma** (DEF-15 y DEF-16). Es fácil de corregir (acción A13), y conviene hacerlo antes de la sesión con la dueña, para que no la confunda.
5. **¿Está lista?** Lo está para la sesión de aceptación con la dueña, en su teléfono (A8 y A9), y no todavía para declararla aceptada. Riesgos abiertos:
   - **El teléfono real:** huella, aviso de las 8:00 y tiempos.
   - **El arranque:** unos 10 s en el emulador.
   - **DEF-07:** orden de la lista, pendiente de decisión.
   - **Seguridad y carga sin escaneo** (ZAP y JMeter).
   - **Navegadores:** Chrome y Firefox de escritorio siguen sin probarse.
6. **Las pruebas de punta a punta fallan cuando el PC está cargado** (INC-01, INC-02), aunque la app esté bien. Una falsa alarma en la CI hace perder tiempo, y la acción A14 las vuelve más robustas.
