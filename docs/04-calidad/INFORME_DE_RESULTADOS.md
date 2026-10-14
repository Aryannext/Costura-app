# Informe de resultados de pruebas · Atelier Manager

Resultado de la ejecución de los [casos de prueba](CASOS_DE_PRUEBA.md) de la versión 1.2.0, con la estructura de la guía SENA *Aplicación de pruebas de software* (sección 1.3): alcance, resumen, defectos y conclusiones.

> **Fecha de ejecución:** 14 de octubre de 2026 · **Commit probado:** `efe712b` (main) más la prueba de volumen nueva · **Responsable:** Cristian Cantillo Mejía · **Evidencias:** [evidencias/2026-10-14/](evidencias/2026-10-14/)

---

## 1. Alcance

**Se incluye:**
- Las reglas de negocio y los requisitos funcionales que se pueden comprobar sin el teléfono, con pruebas unitarias y de integración contra SQLite real.
- Tres recorridos de punta a punta en Microsoft Edge.
- Volumen de 500 órdenes medido sobre el motor de base de datos.
- Seguridad de las dependencias y de las cabeceras de la versión web publicada.
- Regresión de la documentación frente al código.

**No se incluye:**
- El teléfono: cámara, huella, alarmas, tiempos reales (P-06).
- La aceptación y la usabilidad con la dueña.
- El escaneo con OWASP ZAP y la carga con JMeter, que necesitan herramientas que no estaban instaladas y autorización para usar el VPS compartido.
- Chrome y Firefox: solo se probó Edge (RNF-15).
- La revisión semántica de la documentación, hecha aparte en la [revisión del 8 de octubre](revision-2026-10-08/INFORME.md).

**Entorno:** Windows 11, Node 24.19, Vitest 4.1, Playwright con Microsoft Edge, servidor de desarrollo en `localhost:5173`. Versión publicada en `https://proyectosena.online/costura-app/`, servida por nginx en Docker.

**Criterios de entrada:** se cumplieron. `npm ci` sin errores, la base de prueba arranca con las 8 migraciones y el servidor de desarrollo responde.

## 2. Resumen de pruebas

| Casos de prueba | Cantidad |
| --- | --- |
| Planificados | 28 |
| Ejecutados | 23 |
| Exitosos | 20 |
| Fallidos | 3 |
| Bloqueados | 5 |

De los ejecutados pasa el 87 % (20 de 23). Los bloqueados son los que dependen del teléfono, de la dueña o de herramientas no instaladas.

**Pruebas automáticas que respaldan los casos:**

| Conjunto | Resultado | Evidencia |
| --- | --- | --- |
| Unitarias y de integración (Vitest) | 388 de 388 pasan, en 37 archivos | [pruebas-unitarias.json](evidencias/2026-10-14/pruebas-unitarias.json) |
| De punta a punta (Playwright, Edge) | 3 de 3 pasan, en 32,2 s | [e2e.txt](evidencias/2026-10-14/e2e.txt) |
| Volumen (500 órdenes) | 5 de 5 pasan | [volumen.txt](evidencias/2026-10-14/volumen.txt) |
| Documentación | 8 de 8 pasan (incluidas en las 388) | `documentacion.spec.js` |

**Cobertura** de `src/database`, `src/composables` y `src/services`, por encima del mínimo que exige la CI (62 / 58 / 64 / 65):

| Sentencias | Ramas | Funciones | Líneas |
| --- | --- | --- | --- |
| 62,98 % | 59,95 % | 64,80 % | 66,26 % |

## 3. Resultado por caso

| ID | Nombre | Resultado | Observación |
| --- | --- | --- | --- |
| CPV-01 | Registrar una clienta con autorización de datos | Exitoso | |
| CPV-02 | Crear una orden con fecha de recepción y de entrega | Exitoso | |
| CPV-03 | Agregar una prenda con arreglo y precio | Exitoso | |
| CPV-04 | La orden cambia de estado según sus prendas | Exitoso | |
| CPV-05 | Entrega parcial y total de prendas | Exitoso | La regla funciona; la advertencia de deuda falta en este camino (DEF-04) |
| CPV-06 | Registrar abonos sin superar el saldo | Exitoso | |
| CPV-07 | Anular un pago con motivo, sin borrarlo | Exitoso | |
| CPV-08 | Cancelar una orden | Exitoso | |
| CPV-09 | Reabrir una orden entregada | Exitoso | |
| CPV-10 | Aviso de orden lista por WhatsApp | Exitoso | |
| CPV-11 | Recibo de la orden | Exitoso | Con los datos completos; si faltan, el recibo los omite (H03) |
| CPV-12 | Órdenes sin reclamar en más de 30 días | Exitoso | |
| CPV-13 | Migraciones de la base de datos | Exitoso | |
| CPV-14 | Los datos sobreviven a una recarga en la web | Exitoso | Aviso de accesibilidad en la consola (DEF-09) |
| CPV-15 | Crear órdenes seguidas sin mezclar datos | Exitoso | |
| CPV-16 | Flujo completo de una orden | Exitoso | Sin errores de página |
| CPV-17 | Volumen: 500 órdenes | Exitoso | Ver sección 4 |
| CPV-18 | Copia de seguridad cifrada | Exitoso | |
| CPV-19 | Bloqueo al volver de segundo plano | Exitoso | |
| CPV-20 | Dependencias sin vulnerabilidades conocidas | **Fallido** | 2 críticas y 5 altas en producción (DEF-01, DEF-02). En la reprueba tras el PR #15: exitoso (sección 7) |
| CPV-21 | Cabeceras de seguridad de la versión web | **Fallido** | Faltan CSP, HSTS y Permissions-Policy; `Server` muestra la versión (DEF-03) |
| CPV-22 | La documentación coincide con el código | Exitoso | Comprueba estructura, no exactitud (H14) |
| CPV-23 | Escaneo de seguridad con OWASP ZAP | Bloqueado | ZAP no instalado; falta autorización para el VPS compartido |
| CPV-24 | Carga de la versión web con JMeter | Bloqueado | JMeter no instalado; falta autorización para el VPS compartido |
| CPV-25 | Aceptación con la dueña | Bloqueado | Pendiente de hacer con la dueña |
| CPV-26 | Hardware del teléfono | Bloqueado | Pendiente en un Android real (P-06) |
| CPV-27 | Usabilidad con la dueña | Bloqueado | Protocolo listo, sin aplicar |
| CPV-28 | Exploratoria: cancelar la cámara no anuncia éxito | **Fallido** | Por inspección del código; reproducción en el teléfono pendiente (DEF-05) |

## 4. Métricas de volumen y rendimiento

500 órdenes, 150 clientas, 1.000 prendas y 500 abonos. Cada operación se midió 20 veces con las consultas reales de la app sobre sql.js (SQLite en WebAssembly), en el PC de desarrollo.

| Operación | Mediana | Máximo | Límite del SRS | Cumple |
| --- | --- | --- | --- | --- |
| Abrir una orden: datos, prendas, pagos e historial (RNF-01) | 0,56 ms | 2,72 ms | 2 s | Sí |
| Registrar una orden con una prenda (RNF-02) | 0,48 ms | 1,13 ms | 3 s | Sí |
| Registrar un abono y leer el saldo (RNF-03) | 0,38 ms | 0,70 ms | 1 s | Sí |
| Listar todas las órdenes | 4,93 ms | 5,63 ms | 2 s | Sí |
| Buscar una clienta por nombre | 0,63 ms | 1,47 ms | 2 s | Sí |

La base de datos no es el cuello de botella: hay tres órdenes de magnitud de margen. Esto **no cierra** RNF-01 a RNF-03. En el teléfono también cuentan el puente de Capacitor, la escritura en disco y el dibujo de la pantalla, así que la medición en el teléfono de la dueña sigue pendiente (CPV-26).

## 5. Defectos detectados

El detalle de cada uno, con su método de reproducción, está en el [reporte de defectos](REPORTE_DE_DEFECTOS.md).

| ID | Título | Severidad | Estado |
| --- | --- | --- | --- |
| DEF-01 | Capacitor Android con una vulnerabilidad crítica publicada | Crítica | Verificado |
| DEF-02 | Otras seis dependencias con vulnerabilidades críticas o altas | Media | Verificado |
| DEF-03 | Faltan cabeceras de seguridad en la versión web | Media | Nuevo |
| DEF-04 | Entregar la última prenda cierra la orden con deuda sin advertir | Alta | Verificado |
| DEF-05 | Cancelar la cámara muestra «Fotografía guardada» | Media | Verificado |
| DEF-06 | Eliminar una foto deja el archivo en el teléfono | Media | Verificado |
| DEF-07 | Las órdenes no se ordenan por fecha de entrega | Media | Abierto |
| DEF-08 | Anular y eliminar solo se alcanzan deslizando el dedo | Media | Abierto |
| DEF-09 | Formularios de contraseña sin campo de usuario | Baja | Nuevo |
| DEF-10 | Siete variables de estilo usadas sin definir | Baja | Verificado |
| DEF-11 | El tutorial dice «Misión Completada» al cerrarlo a medias | Baja | Verificado |
| DEF-12 | «Recordar a N clientes» cuenta órdenes, no clientas | Baja | Verificado |

**Análisis** (guía, sección 1.3):
- **Impacto:** DEF-01 afecta al APK que se instala en el taller. DEF-04 puede hacer entregar ropa sin cobrar. Los demás no alteran datos.
- **Condiciones:** DEF-04 aparece solo al entregar prenda por prenda; el botón *Entregar orden* sí advierte. DEF-08 aparece solo con ratón o teclado.
- **Variación de configuración:** las pruebas E2E corrieron solo en Edge. Chrome y Firefox (RNF-15) siguen sin probar.
- **Severidad:** ver la escala del [reporte de defectos](REPORTE_DE_DEFECTOS.md#1-cómo-se-gestiona-una-incidencia).

## 6. Conclusiones

1. **La lógica del taller es sólida.** Pasan las 388 pruebas automáticas y las 3 de punta a punta, y las 40 reglas de negocio tienen cada una su prueba contra SQLite real. Ninguna prueba de reglas falló.
2. **Con 500 órdenes la base responde en milisegundos.** El margen frente a los límites del SRS es amplio, pero la medición que cuenta es la del teléfono.
3. **La seguridad de la entrega necesita atención antes de instalar en el taller:**
   - Actualizar Capacitor y las demás dependencias (DEF-01, DEF-02). Hecho el mismo 14 de octubre (sección 7).
   - Completar las cabeceras de la versión web (DEF-03).
4. **Los defectos abiertos son de interfaz y de mensajes**, no de cálculo. El más importante es DEF-04, porque toca el dinero.
5. **No se puede declarar la app aceptada.** Faltan la aceptación con la dueña, el teléfono real y la usabilidad (CPV-25 a CPV-27). Los resultados de esta ejecución no los reemplazan.
6. Las acciones, su prioridad y su seguimiento están en el [plan de mejora](PLAN_DE_MEJORA.md).

## 7. Repruebas

Casos que se repitieron después de corregir sus defectos. El resumen de la sección 2 no cambia: describe la ejecución original. La regresión completa queda para la acción A12 del plan de mejora.

| Fecha | Caso | Commit | Resultado | Defectos |
| --- | --- | --- | --- | --- |
| 14 oct | CPV-20 | `809cfb8` (main, con el PR #15) | Exitoso: `npm audit --omit=dev` y `npm audit` dan 0 vulnerabilidades; el paso nuevo de la CI pasa | DEF-01 y DEF-02 → *Verificado* |
| 14 oct | CPV-05, con el método de reproducción de DEF-04 | Rama `entrega-prenda-advierte-deuda` | Exitoso: entregar una prenda con saldo pide confirmación, también la última; sin saldo entrega directo | DEF-04 → *Verificado* |
| 14 oct | CPV-28, en pruebas de la pantalla con la cámara simulada | Rama `mensajes-foto-y-tutorial` | Exitoso: cancelar no anuncia nada; una foto real y un error se anuncian una vez cada uno. En el teléfono sigue pendiente | DEF-05 → *Verificado* |
| 14 oct | Método de reproducción de DEF-11, con el driver.js real en Edge | Rama `mensajes-foto-y-tutorial` | Exitoso: cerrar a mitad no dice «Misión Completada»; terminar sí | DEF-11 → *Verificado* |
| 14 oct | Método de reproducción de DEF-12 | Rama `recordatorios-cuenta-ordenes` | Exitoso: el botón ya no habla de clientes y el aviso cuenta órdenes | DEF-12 → *Verificado* |
| 14 oct | Métodos de reproducción de DEF-06 y DEF-10 | Rama `fotos-y-estilos` | Exitoso: eliminar una foto borra también su archivo; no queda ninguna variable de CSS sin definir y el formulario se ve con sus bordes, error y foco | DEF-06 y DEF-10 → *Verificado* |

Sobre el mismo commit pasan las 388 pruebas unitarias, con el mínimo de cobertura, y las 3 E2E en Edge. La versión publicada en `/costura-app/` carga con Vue 3.5.43.
