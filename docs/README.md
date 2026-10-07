# Documentación de Atelier Manager (Costura App)

Proyecto formativo SENA ADSO 2480542 – Centro Tecnológico de la Amazonia, Florencia (Caquetá).

**Si vas a leer solo tres archivos:**
- [`05-gestion/PLAN_19_DIAS.md`](05-gestion/PLAN_19_DIAS.md): qué falta y en qué orden.
- [`05-gestion/DECISIONES.md`](05-gestion/DECISIONES.md): por qué la app es como es.
- [`04-calidad/TRAZABILIDAD.md`](04-calidad/TRAZABILIDAD.md): cada requisito, su estado y el archivo que lo implementa.

| Carpeta | Fase del ciclo de vida | Contenido |
| --- | --- | --- |
| [`01-analisis/`](01-analisis/) | Análisis | `Costura.md` / `.docx`: objetivos, actores, RF, RNF, 40 reglas de negocio, historias de usuario y casos de prueba. Requisitos de fase 1 (mejoras) y fase 2 |
| [`02-diseno/`](02-diseno/) | Diseño | `DIAGRAMAS.md`: 9 diagramas regenerados desde el código. `historico/`: script MySQL del diseño inicial, que la app **no** usa |
| [`03-manuales/`](03-manuales/) | Implantación | Manual de usuario y ficha técnica (base del manual técnico) |
| [`04-calidad/`](04-calidad/) | Pruebas y calidad | Matriz de trazabilidad, auditoría del 6 de octubre (A01–A18) con su estado y el script que la reproducía |
| [`05-gestion/`](05-gestion/) | Gestión | Plan Scrum de cierre, decisiones argumentadas y pendientes |
| [`99-archivo/`](99-archivo/) | — | Propuestas fuera del alcance (tienda web / venta). Trabajo futuro |

## Dónde está cada cosa en el código

| Tema | Archivo |
| --- | --- |
| Esquema y migraciones (v1–v6) | `src/database/migrations.js`, `src/database/migrationRunner.js` |
| Estado de la orden derivado de sus prendas | `src/services/estadoOrden.js`, `src/database/queries/estadoOrden.js` |
| Saldo recalculado desde prendas y pagos | `src/database/queries/saldo.js` |
| Avisos por WhatsApp (+57 y plantillas) | `src/services/whatsapp.js`, `src/composables/useOrdenTelegram.js` |
| Respaldo cifrado con fotos | `src/services/backupPayload.js`, `src/services/cryptoService.js` |
| Las 40 reglas de negocio como pruebas | `src/__tests__/reglasNegocio.spec.js` |
| Pruebas de punta a punta | `tests/e2e/` |
| Versión web con Docker | `Dockerfile`, `docker/`, `docker-compose.yml` |
