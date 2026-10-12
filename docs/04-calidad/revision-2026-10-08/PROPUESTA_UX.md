# Propuesta de experiencia de uso

**Costura-app / Atelier Manager · anexo de la revisión del 8 de octubre de 2026**

Desarrolla la corrección propuesta de [H24](INFORME.md#h24), [H25](INFORME.md#h25), [H26](INFORME.md#h26) y [H27](INFORME.md#h27), y lo que toca a la interfaz en [H11](INFORME.md#h11), [H17](INFORME.md#h17) y [H18](INFORME.md#h18). Es una **propuesta**: nada de esto está implementado ni probado con la dueña. Antes de cambiar código, cada punto se valida con el [protocolo de observación](PROTOCOLO_UX.md).

Lo observado sale del código en `a2c18ff`. Las partes citadas no cambiaron en `4252f22`.

## Principios

1. **Una acción principal por pantalla.** La siguiente acción habitual se ve primero. Las correcciones van en un menú.
2. **Los datos de dinero siempre a la vista.** Mostrar el total, lo abonado y el saldo en recepción, en el detalle y en el abono.
3. **Nada queda escondido detrás de un gesto.** El deslizamiento puede seguir como atajo, pero toda acción debe tener también un botón visible que funcione con teclado.
4. **Un mensaje de éxito solo cuando algo pasó de verdad.** Cancelar o fallar nunca muestra «guardado» ni «enviado».
5. **No cambiar reglas de negocio.** Las guardas, las confirmaciones de deuda (RN-30) y las restricciones de saldo se quedan como están; solo cambia cómo se presentan.

## Propuestas

### P1 · Abono con importe explícito (H27)

**Hoy:** el valor del formulario empieza con todo el saldo (`valor: props.saldoPendiente`, [PagoForm.vue:79](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/pagos/PagoForm.vue#L79)). El medio de pago empieza en el primero del catálogo, *Efectivo*. Si la modista toca *Guardar* sin revisar, registra un pago total en efectivo.

**Propuesta:**
- El valor empieza vacío y el botón *Guardar* queda desactivado hasta escribir un importe.
- Se conserva el atajo que ya existe, *Pagar el total*, pero con el importe visible: «Pagar el saldo completo ($ 40.000)».
- El medio de pago se elige con botones visibles (Efectivo, Transferencia, Nequi, Daviplata, Bre-B) y no con un selector cerrado. Sigue empezando en Efectivo si la dueña lo confirma como el caso más común.
- Antes de guardar: «Abono de $ 15.000 en Nequi. Saldo después: $ 25.000».

**Se verifica con:** la tarea T3 del protocolo.

### P2 · Estados de la prenda: siguiente paso y corrección aparte (H27, H09)

**Hoy:** [PrendaCard.vue:26](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/prendas/PrendaCard.vue#L26) muestra los cuatro estados como botones al mismo nivel. Con un toque se cambia a cualquiera que esté permitido, y eso incluye retroceder.

**Propuesta:**
- Un botón principal con el siguiente estado habitual: «Empezar», «Marcar terminada» o «Entregar».
- La barra de progreso de cuatro pasos sigue visible, pero solo muestra el estado.
- «Corregir estado…» abre un menú con los estados permitidos y pide confirmar cuando se retrocede.
- *Entregar* una prenda con saldo pendiente muestra la misma advertencia que *Entregar orden* (H11). Se sigue pudiendo entregar con deuda (D-11).

**Se verifica con:** las tareas T2 y T4.

### P3 · Recepción guiada en tres pasos (H27, H03)

**Hoy:** [OrdenForm.vue](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/ordenes/OrdenForm.vue#L3) pide clienta y fechas. Las prendas y los pagos se agregan después, en pestañas del detalle. La clienta nueva se crea sin dirección.

**Propuesta:** se respeta el límite de tres pasos que ya fija el SRS:
1. **Clienta:** se busca o se crea. Al crearla se pide la autorización y se avisa si faltan datos que el recibo usa (H03).
2. **Prendas:** tipo, arreglo y precio, con el total acumulado siempre a la vista.
3. **Fecha y anticipo:** fecha prometida, anticipo opcional con importe explícito (P1) y un resumen antes de crear.

La regla de recepción con precio o fecha pendientes no se decide aquí: depende de H28.

**Se verifica con:** la tarea T1.

### P4 · Acciones visibles en lugar del gesto (H24)

**Hoy:** [SwipeItem.vue](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/components/common/SwipeItem.vue#L2) solo responde a `touchstart`, `touchmove` y `touchend`. Con ratón o teclado no hay forma de anular un pago ni de eliminar una prenda.

**Propuesta:**
- Cada fila tiene un botón «⋯» con el nombre accesible «Acciones de…». Abre un menú con *Anular* o *Eliminar*, que funciona con Tab y Enter.
- El deslizamiento se conserva como atajo y pide la misma confirmación.
- Si la acción no está disponible (orden cerrada, pago ya anulado), el menú dice por qué en lugar de esconderse.

**Se verifica con:** la tarea T5 y una prueba en escritorio con teclado.

### P5 · Tokens de color sin variables huérfanas (H25)

Las siete variables sin definir (`--primary-fixed`, `--border-color`, `--text-secondary`, `--bg-secondary`, `--text-primary`, `--error-color`, `--accent-color`) se cambian por los tokens que ya existen en `style.css`. No se rediseña nada. Después se comprueban con estilos computados el borde de error, el anillo de foco y el contraste a 360 px, 390 px y en escritorio.

### P6 · Tutorial por tareas reales (H26)

- Los tres recorridos actuales se cambian por cuatro tareas: *Recibir ropa*, *Avanzar una prenda*, *Cobrar y entregar* y *Guardar una copia*.
- Las tareas incluyen la autorización de datos y la pestaña *Por cobrar*.
- «¡Misión Completada!» aparece solo si se llegó al último paso. Cerrar a mitad no lo muestra ([useTutorial.js](https://github.com/Aryannext/Costura-app/blob/a2c18ff76a60e8ad02cf5fe9cd91f47521533e26/src/composables/useTutorial.js#L40) usa hoy `onDestroyed` para ambos casos).

### P7 · Mensajes honestos (H17, H18)

| Hoy | Propuesta |
| --- | --- |
| «Fotografía guardada» aunque se cancele la cámara | Al cancelar no se muestra nada; «Foto guardada» solo después de guardar el archivo y la fila |
| «Recordar a los N clientes», con N contado en órdenes | «Preparar recordatorios (N órdenes)» |
| Aviso de envío | «Lista enviada a tu Telegram. Ábrela y envía cada WhatsApp» |

## Lo que no se propone

- No cambiar reglas de negocio, guardas ni restricciones SQL.
- No quitar la confirmación de deuda ni impedir entregar con saldo (D-11).
- No presentar estas propuestas como resultados. La facilidad de uso se concluye solo después del [protocolo](PROTOCOLO_UX.md).
