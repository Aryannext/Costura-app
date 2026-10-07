# ADR VEN 001 Separar el arreglo de la comercialización

- **Estado:** propuesto, pendiente de validación.
- **Fecha:** 6 de octubre de 2026.
- **Contexto confirmado:** Florencia, Caquetá, Colombia; 20 jornadas con hasta 12 horas disponibles por día. Estimación por persona: máximo 240 horas, con 200 planificadas y 40 de margen según PRD.md.
- **Decisores:** responsable del proyecto; revisión técnica y de las reglas aplicables antes de producción.

## 1. Contexto y Problema

La app gestiona arreglos en SQLite local. Un catálogo público necesita información accesible desde internet y disponibilidad común. Las deudas del arreglo, la falta de recogida y el derecho de comercializar no son equivalentes.

## 2. Opciones Consideradas

### Opción A Publicación selectiva y reservas con pago coordinado

- Aprovecha la app actual y reduce el volumen de sincronización.
- El servidor comercial decide disponibilidad; el taller confirma pago y entrega.
- Requiere servicio web, fotos públicas, permisos y política de privacidad.
- No ofrece checkout automático; exige operación manual del taller.

### Opción B Checkout con pasarela

- Permite comprar y pagar directamente en la página.
- Añade integración, webhooks verificados, manejo de pagos fallidos, devoluciones y conciliación.
- Depende de país, proveedor, cuentas y decisiones de privacidad/costos. Requiere otra estimación.

### Opción C Plataforma para múltiples talleres desde el inicio

- Permite que varios talleres publiquen y reciban solicitudes en un mismo portal.
- Necesita aislamiento entre negocios, alta de vendedores, moderación, responsabilidades, liquidaciones si se cobran pagos, y soporte a disputas.
- Supera el escenario conservador del MVP de 20 días de trabajo y requiere equipo/plazo revisado.

## 3. Decisión Propuesta

Usar la opción A como **escenario para estimación**, sin darla por aprobada. Mantener separado el ciclo de arreglos del ciclo comercial. No publicar automáticamente prendas por impago o falta de recogida. Los documentos de este directorio son borradores; no fijan proveedor, mecanismo de autenticación ni tratamiento definitivo de datos personales.

## 4. Consecuencias y Mitigaciones

- Internet será necesario para disponibilidad y operaciones comerciales confirmadas; documentarlo aunque el taller conserve tareas offline.
- Registrar el derecho de comercialización con evidencia revisada y acceso privado; pausar la venta si cambia o se cuestiona.
- Usar importes enteros en la unidad menor de la moneda, restricciones de inventario y pruebas de concurrencia.
- Mantener deudas y pagos de arreglos separados de ingresos por ventas; cualquier devolución o compensación requiere un movimiento explícito.
- Finalizar arquitectura, contrato API y matriz de trazabilidad tras resolver alcance, pagos, privacidad, costos y los conflictos de la documentación original. El país de operación ya está confirmado: Colombia.
