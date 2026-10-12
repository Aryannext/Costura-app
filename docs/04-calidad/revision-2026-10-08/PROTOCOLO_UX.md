# Protocolo de observación de uso con la dueña

**Costura-app / Atelier Manager · anexo de la revisión del 8 de octubre de 2026**

Sirve para comprobar la hipótesis [H27](INFORME.md#h27) y los puntos de interfaz de [H11](INFORME.md#h11), [H17](INFORME.md#h17), [H18](INFORME.md#h18), [H24](INFORME.md#h24) y [H26](INFORME.md#h26). Se aplica dos veces: **antes** de tocar el código, para tener una línea base, y **después** de aplicar la [propuesta UX](PROPUESTA_UX.md). Complementa la prueba de aceptación de [PLAN_DE_PRUEBAS.md §3](../PLAN_DE_PRUEBAS.md). Aquel plan responde si la app funciona; este, si la dueña la usa sin equivocarse.

**Estado:** sin aplicar. Las tablas están vacías a propósito.

## Condiciones

- Teléfono de la dueña o uno de prueba con el APK de la versión a evaluar. Se anotan la versión, la fecha, el modelo del teléfono y la versión de Android.
- **Solo datos inventados:** clienta «Prueba Uno», teléfono 3000000001 y dinero ficticio. Ninguna clienta real, ningún envío real de WhatsApp o Telegram a terceros.
- Telegram, si se usa, apunta al chat de prueba del desarrollador.
- Se explica que se evalúa la aplicación, no a la dueña, y se le pide permiso para tomar notas.
- Quien observa lee la tarea en voz alta y no ayuda. Solo interviene si ella se queda bloqueada más de 2 minutos o lo pide. Cada intervención cuenta como una ayuda.
- Antes de empezar: base de datos limpia con una orden semilla (O-1) de dos prendas Terminadas, total $ 40.000 y saldo $ 40.000.

## Qué se mide en cada tarea

| Medida | Cómo se anota |
| --- | --- |
| Completada | Sí / Sí con ayuda / No |
| Ayudas | Número de intervenciones del observador |
| Errores | Acción distinta de la pedida: otro estado, otro importe, otro medio, otra orden. Se anota aunque ella lo corrija después |
| Tiempo | Minutos desde que oye la tarea hasta que dice «listo» |
| Comentario | Lo que dice en voz alta, palabra por palabra si es posible |

## Tareas

| # | Tarea (se lee en voz alta) | Resultado correcto | Relación |
| --- | --- | --- | --- |
| T1 | «Llegó una clienta nueva, Prueba Uno, con un pantalón para subir el ruedo por $ 15.000 y una blusa para entallar por $ 25.000. Lo quiere el viernes. Recíbelo.» | Clienta con autorización, orden con dos prendas, total $ 40.000 y fecha correcta | H27, H03, P3 |
| T2 | «Ya terminaste el pantalón. Anótalo.» Después: «Te equivocaste: la blusa todavía no está empezada. Corrígelo.» | Pantalón Terminado; la blusa queda en el estado correcto sin tocar el pantalón | H27, H09, P2 |
| T3 | «Prueba Uno te dejó $ 10.000 por Nequi. Regístralo.» | Abono de $ 10.000 en Nequi; saldo $ 30.000. **No** un pago total ni en efectivo | H27, P1 |
| T4 | En O-1: «La clienta se lleva solo una prenda y no paga. Entrégasela.» Después: «Volvió por la otra, tampoco pagó. Entrégala.» | En las dos entregas aparece la advertencia de deuda; la orden queda Entregada con saldo $ 40.000 | H11, P2 |
| T5 | «El abono de T3 lo anotaste en la orden equivocada. Anúlalo.» | Encuentra *Anular* sin ayuda; pago anulado y saldo recalculado | H24, P4 |
| T6 | «Toma una foto del pantalón y, sin tomarla, cancela.» | No aparece un mensaje de foto guardada ni una foto nueva | H17, P7 |
| T7 | «Avisa a las clientas que tienen ropa lista.» (Con dos órdenes listas de la misma clienta) | Entiende que la app le manda una lista a su Telegram y que todavía tiene que enviar cada WhatsApp | H18, P7 |
| T8 (opcional) | Abrir la ayuda, empezar un recorrido y cerrarlo a la mitad | No aparece «Misión Completada» | H26, P6 |

T1 a T5 son las cinco tareas que pide el criterio de cierre de H27. T6 a T8 comprueban mensajes puntuales.

## Hoja de registro

**Aplicación:** ☐ línea base ☐ después de la propuesta · **Versión del APK:** ____ · **Fecha:** ____ · **Teléfono / Android:** ____ · **Observador:** ____

| # | Completada | Ayudas | Errores (cuáles) | Tiempo | Comentario |
| --- | --- | --- | --- | --- | --- |
| T1 | | | | | |
| T2 | | | | | |
| T3 | | | | | |
| T4 | | | | | |
| T5 | | | | | |
| T6 | | | | | |
| T7 | | | | | |
| T8 | | | | | |

**Preguntas al terminar:**
1. ¿En qué momento dudó o tuvo miedo de equivocarse?
2. ¿Qué haría distinto en el cuaderno para las mismas tareas?
3. De lo que vio hoy, ¿qué le cambiaría primero?

## Cómo se interpreta

- Una tarea **pasa** si se completa sin ayudas y sin errores. Los umbrales para aprobar la versión (por ejemplo, cuántas tareas deben pasar) se acuerdan con el instructor y la dueña **antes** de aplicar el protocolo, no después de ver los resultados.
- Si un error se repite en la misma tarea en las dos aplicaciones, la propuesta no lo resolvió y se revisa.
- Con una sola usuaria, el resultado es evidencia cualitativa para este taller. No es una medición estadística de usabilidad.
- Los resultados y las decisiones que cambien la app se registran en [DECISIONES.md](../../05-gestion/DECISIONES.md).
