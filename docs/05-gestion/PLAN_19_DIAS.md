# Plan de cierre: 19 días (7 al 25 de octubre de 2026)

## 1. Lo que exige el proyecto formativo SENA 2480542

Fuente: *Proyecto Formativo ADSO*, sección 2.5.4 "Productos o resultados del proyecto".

| # | Producto exigido | Dónde está | Estado (7 oct) |
| --- | --- | --- | --- |
| 1 | Informe de análisis de requisitos | `docs/01-requisitos/SRS.md` | **Listo (7 oct):** SRS vigente con estructura IEEE 830 y el estado de cada requisito. El original queda en `historico/` |
| 2 | Diseño arquitectónico en UML | `docs/02-diseno/` | **Listo (7 oct):** arquitectura, modelo de datos, casos de uso por actor con especificaciones, estados, cuatro secuencias y diagrama de clases. Una prueba automática los compara con el código |
| 3 | Base de datos e interfaz implementadas | `src/` | **Funciona**: 371 pruebas unitarias y 3 E2E (8 oct). Quedan P-06 y P-07 de `DECISIONES.md` y el hallazgo ANA-H04 (medir tiempos) |
| 4 | Manual técnico y de usuario **en español e inglés** | `docs/03-manuales/` | Usuario y técnico en español listos (7 oct). **Faltan** las versiones en inglés |
| 5 | Artículo de revisión bibliográfica sobre gestión de calidad del software (ES/EN) | — | **No se exige** para graduarse (confirmado el 7 oct). Fuera del plan |

## 2. Scrum aplicado a un equipo de una persona

Scrum **no es nuevo**: lo presentaron Schwaber y Sutherland en 1995 y su guía oficial vigente es de 2020. Es un marco para trabajar en ciclos cortos (*sprints*). Al final de cada sprint hay algo terminado que se puede mostrar.

| Elemento de Scrum | En este proyecto |
| --- | --- |
| Product Owner | Tú, representando a tu mamá (usuaria real) |
| Development Team | Tú (con asistencia de IA) |
| Scrum Master | Tú: cuidas el proceso y quitas bloqueos |
| Stakeholder | El instructor |
| Product Backlog | Pendientes P-01 a P-06 + entregables de la tabla 1 |
| Sprint Review | Mostrarle a tu mamá (sprint 1) y al instructor (sprints 2 y 3) |
| Retrospectiva | 10 minutos al final de cada sprint: qué funcionó y qué cambiar |
| Daily | 5 minutos cada mañana: qué hice ayer, qué haré hoy, qué me bloquea |

**Argumento para sustentar:** con un solo integrante los roles se concentran en una persona. Eso es una adaptación declarada, no un error. Lo que se conserva son los ciclos cortos, el backlog priorizado y la revisión con el usuario real.

## 3. Sprints

### Sprint 1 — "Que mi mamá la use de verdad" (mié 7 – lun 12)
Objetivo: la app en un teléfono real con datos reales.
1. Compilar el APK y probar en el teléfono (P-06): cámara, WhatsApp, alarma de las 8 a. m., huella.
2. ~~Obligar a cambiar la clave `admin123`~~ (ya resuelto en la rama de septiembre). Desplegar la imagen Docker en el VPS (P-07).
3. ~~Agregar el texto de autorización de datos personales (P-03).~~ Resuelto el 7 oct.
4. Capgo: hay cuenta, se mantiene (P-05 resuelto). Probar una actualización OTA en el teléfono.
5. Capacitar a tu mamá 30 minutos y que registre de 5 a 10 órdenes reales.
6. **Evidencia:** fotos o video corto de ella usándola; anotar sus quejas, porque son el insumo del sprint 2.

### Sprint 2 — "Análisis y diseño al día" (mar 13 – dom 18)
Objetivo: que los documentos describan la app real.
1. ~~Crear el SRS~~ **Hecho el 7 oct:** `docs/01-requisitos/SRS.md`, a partir de `historico/Costura.md` y la matriz de trazabilidad, con:
   - estructura IEEE 830 (o su sucesora ISO/IEC/IEEE 29148:2018);
   - alcance offline (D-06);
   - IDs únicos;
   - historias de usuario nuevas: avisos por WhatsApp, órdenes con fecha anterior y pagos con Bre-B.
2. Diagramas UML:
   - ✅ (7 oct) documentación de diseño dividida en `ARQUITECTURA.md`, `MODELO_DE_DATOS.md`, `CASOS_DE_USO.md`, `COMPORTAMIENTO.md` y `CLASES.md`, revisada contra el código;
   - ✅ diagrama de clases del dominio y secuencias de agregar prenda, registrar abono, sesión y copia de seguridad;
   - ✅ `src/__tests__/documentacion.spec.js` falla si un diagrama deja de coincidir con el código.
3. Tabla comparativa con apps existentes, que es la base del argumento de innovación (sección 4).

### Sprint 3 — "Manuales y sustentación" (lun 19 – jue 23)
1. ~~Manual técnico completo~~ **Hecho el 7 oct:** `docs/03-manuales/MANUAL_TECNICO.md`.
2. Versiones en inglés del manual de usuario y del técnico.
3. Evidencias de pruebas: salida de `npm run test:unit` y del E2E, y los casos de prueba CP-xx actualizados.
4. Presentación: problema → solución → demostración en vivo → decisiones → trabajo futuro.

### Colchón (vie 24 – sáb 25)
Ensayo de la sustentación en voz alta, cronometrado, y entrega. **No meter funciones nuevas estos días.**

## 4. ¿Qué es lo innovador?

"Innovador" no exige inventar algo que nadie haya hecho nunca. En la formación SENA (sección 2.6 del proyecto) se pregunta si el proyecto **mejora un proceso existente** y **usa técnicas o tecnologías nuevas para ese contexto**. Lo honesto aquí es:

1. **Hecho para quien no usa computador:** funciona en el celular, sin internet, sin servidor y sin costo mensual.
2. **Comunicación con el cliente sin pagar a nadie:** avisos por WhatsApp listos para enviar, con el canal que ya usan las clientas (D-03).
3. **Reglas que evitan los errores observados:** no se puede marcar lista una orden con prendas sin terminar, el saldo no queda negativo y "sin reclamar" sigue el plazo de la Ley 1480 (D-09, D-10).
4. **Puente físico–digital:** el número de orden en la bolsa (D-02), que ataca la causa real de "¿de quién es esta prenda?".

**Para probarlo hay que comparar.** Haz una tabla con 3 o 4 alternativas que usaría una modista hoy y marca qué resuelve cada una:
- cuaderno;
- WhatsApp Business con etiquetas;
- una app genérica de pedidos o facturación;
- un software de sastrería de pago.

Columnas sugeridas: costo, funciona sin internet, controla estados por prenda, avisa al cliente, controla saldos, alerta ropa sin reclamar.

## 5. Preguntas que probablemente te harán

1. **¿Por qué no usó Telegram para avisar a los clientes?** → D-03 (un bot no puede escribir primero).
2. **¿Qué pasa si se pierde el celular?** → Respaldo cifrado en Telegram; limitación P-01 (fotos).
3. **¿Cómo garantiza que las reglas se cumplan?** → D-10 + las 40 reglas como pruebas contra SQLite real (`src/__tests__/reglasNegocio.spec.js`).
4. **¿Qué leyes aplican?** → Ley 1581 de 2012 (datos personales), Ley 1480 de 2011 art. 18 + Decreto 1413 de 2018 (recibo y bienes abandonados).
5. **¿Qué hizo la IA y qué hizo usted?** → Ver sección 6.
6. **¿Por qué no hizo la tienda web?** → D-07.
7. **¿Para qué usó Docker?** → D-13: despliegue de la versión web para demostración y descarga del APK; no es un servidor de datos.

## 6. Cómo explicar el uso de IA sin que se te caiga la sustentación

Di la verdad y demuestra que entiendes. Para cada parte importante debes poder:
- abrir el archivo;
- decir qué hace con tus palabras;
- explicar por qué se hizo así (está en `DECISIONES.md`).

**Ejercicio diario de 20 minutos durante los sprints:**
1. Abre `src/services/estadoOrden.js` y explica en voz alta cómo se calcula el estado de la orden.
2. Abre `src/database/queries/estadoOrden.js` y sigue qué pasa desde que tocas el estado de una prenda hasta que cambia la cabecera de la orden.
3. Ejecuta `npx vitest run` y lee **una** prueba de `src/__tests__/reglasNegocio.spec.js`.
4. Rompe a propósito una regla en `estadoOrden.js` y mira qué prueba falla. Luego deshaz el cambio (`git checkout -- archivo`).
