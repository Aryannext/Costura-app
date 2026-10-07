# Documentación de Atelier Manager (Costura App)

Proyecto formativo SENA ADSO 2480542 – Centro Tecnológico de la Amazonia, Florencia (Caquetá).

**Si vas a leer solo dos archivos:** [`05-gestion/PLAN_19_DIAS.md`](05-gestion/PLAN_19_DIAS.md) (qué falta y en qué orden) y [`05-gestion/DECISIONES.md`](05-gestion/DECISIONES.md) (por qué la app es como es).

| Carpeta | Fase del ciclo de vida | Contenido |
| --- | --- | --- |
| [`01-analisis/`](01-analisis/) | Análisis | `Costura.md` / `.docx`: introducción, objetivos, actores, RF, RNF, reglas de negocio, historias de usuario y casos de prueba. Requisitos de fase 1 (mejoras) y fase 2 |
| [`02-diseno/`](02-diseno/) | Diseño | `DIAGRAMAS.md` (arquitectura, ER, casos de uso, flujo, módulos, estados). `historico/`: script MySQL del diseño inicial, que la app **no** usa |
| [`03-manuales/`](03-manuales/) | Implantación | Manual de usuario y ficha técnica (base del manual técnico) |
| [`04-calidad/`](04-calidad/) | Pruebas y calidad | Auditoría del 6 de octubre (fallos A01–A18) con su estado de corrección, y el script que los reproducía |
| [`05-gestion/`](05-gestion/) | Gestión | Plan Scrum de cierre, decisiones argumentadas y pendientes |
| [`99-archivo/`](99-archivo/) | — | Propuestas fuera del alcance actual (tienda web / venta). Se conservan como trabajo futuro |

## Dónde está cada cosa en el código

| Tema | Archivo |
| --- | --- |
| Esquema de la base de datos | `src/database/migrations.js` |
| Reglas de estados de orden/prenda | `src/services/reglasOrden.js` |
| Operaciones con la base | `src/database/queries/*.js` |
| Mensajes de WhatsApp | `src/services/whatsapp.js` |
| Recibo | `src/services/recibo.js` |
| Pruebas de reglas de negocio | `src/database/queries/__tests__/reglasNegocio.spec.js` |
| Prueba de punta a punta | `tests/e2e/flujo-orden.spec.js` |
