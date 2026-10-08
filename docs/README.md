# Documentación · Atelier Manager (Costura App)

Proyecto formativo SENA ADSO 2480542 · Centro Tecnológico de la Amazonia, Florencia (Caquetá) · Entrega: 25 de octubre de 2026

**Todo lo que está aquí describe la app tal como está hoy en el código.** Una prueba automática (`src/__tests__/documentacion.spec.js`) compara los diagramas con el código y falla si dejan de coincidir.

---

## Si te preguntan…, abre esto

| Pregunta | Documento |
| --- | --- |
| ¿Qué problema resuelve y qué hace la app? | [SRS](01-requisitos/SRS.md), secciones 1 y 2 |
| ¿Cuáles son los requisitos y cuáles se cumplen? | [SRS](01-requisitos/SRS.md), sección 3 |
| ¿Qué cambió frente a la especificación original y por qué? | [SRS](01-requisitos/SRS.md), sección 4, y [DECISIONES](05-gestion/DECISIONES.md) |
| ¿Cuál es la arquitectura? ¿Por qué no tiene servidor? | [ARQUITECTURA](02-diseno/ARQUITECTURA.md) |
| ¿Cómo es la base de datos? | [MODELO_DE_DATOS](02-diseno/MODELO_DE_DATOS.md) |
| ¿Quién usa la app y para qué? (casos de uso) | [CASOS_DE_USO](02-diseno/CASOS_DE_USO.md) |
| ¿Cómo cambia de estado una orden? ¿Qué pasa al registrar un pago? | [COMPORTAMIENTO](02-diseno/COMPORTAMIENTO.md) |
| ¿Dónde está el diagrama de clases? | [CLASES](02-diseno/CLASES.md) |
| ¿Cómo se instala, compila y despliega? | [MANUAL_TECNICO](03-manuales/MANUAL_TECNICO.md) |
| ¿Cómo la usa la modista? | [MANUAL_USUARIO](03-manuales/MANUAL_USUARIO.md) |
| ¿Cómo se probó? ¿Qué falta probar? | [PLAN_DE_PRUEBAS](04-calidad/PLAN_DE_PRUEBAS.md) |
| ¿Dónde está implementado cada requisito? | [TRAZABILIDAD](04-calidad/TRAZABILIDAD.md) |
| ¿Cómo se organizó el trabajo? (Scrum) | [PLAN_19_DIAS](05-gestion/PLAN_19_DIAS.md) |
| ¿Qué leyes se tuvieron en cuenta? | [DECISIONES](05-gestion/DECISIONES.md): D-08 (Ley 1581) y D-09 (Ley 1480) |

## Carpetas

| Carpeta | Fase | Documentos vigentes | Histórico |
| --- | --- | --- | --- |
| [`01-requisitos/`](01-requisitos/) | Análisis | `SRS.md` | Especificación original (`Costura.md` y `.docx`), mejoras de fase 1, requisitos de fase 2 y el borrador SRS 0.1 de los analistas |
| [`02-diseno/`](02-diseno/) | Diseño | `ARQUITECTURA.md`, `MODELO_DE_DATOS.md`, `CASOS_DE_USO.md`, `COMPORTAMIENTO.md`, `CLASES.md` | Script MySQL del diseño inicial, que la app **no** usa |
| [`03-manuales/`](03-manuales/) | Implantación | `MANUAL_TECNICO.md`, `MANUAL_USUARIO.md` | — |
| [`04-calidad/`](04-calidad/) | Pruebas | `PLAN_DE_PRUEBAS.md`, `TRAZABILIDAD.md` | Auditorías del 6 y 7 de octubre, con sus fallos y cómo se corrigieron |
| [`05-gestion/`](05-gestion/) | Gestión | `PLAN_19_DIAS.md`, `DECISIONES.md` | — |
| [`99-archivo/`](99-archivo/) | — | — | Propuestas fuera del alcance (tienda web). Trabajo futuro |

**Regla de la carpeta `historico/`:** lo que está ahí no se edita. Sirve como evidencia de cómo evolucionó el proyecto; lo vigente es lo de afuera.

## Dónde está cada cosa en el código

| Tema | Archivo |
| --- | --- |
| Esquema y migraciones (versiones 1 a 8) | `src/database/migrations.js`, `src/database/migrationRunner.js` |
| Estado de la orden derivado de sus prendas | `src/services/estadoOrden.js`, `src/database/queries/estadoOrden.js` |
| Saldo recalculado desde prendas y pagos | `src/database/queries/saldo.js` |
| Avisos por WhatsApp y recibo | `src/services/whatsapp.js`, `src/composables/useOrdenTelegram.js` |
| Datos personales (Ley 1581) | `src/services/avisoPrivacidad.js`, `src/database/queries/clientes.js` |
| Copia de seguridad cifrada | `src/composables/useBackupRestore.js`, `src/services/cryptoService.js` |
| Las 40 reglas de negocio como pruebas | `src/__tests__/reglasNegocio.spec.js` |
| Documentación comparada con el código | `src/__tests__/documentacion.spec.js` |
| Pruebas de punta a punta | `tests/e2e/` |
| Versión web con Docker | `Dockerfile`, `docker/`, `docker-compose.yml` |
