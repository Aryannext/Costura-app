# Manual de Usuario: Atelier Manager

Versión del manual: 2.0 (7 de octubre de 2026). Describe la app tal como funciona hoy.

Atelier Manager te ayuda a saber **de quién es cada prenda, qué hay que hacerle, para cuándo la prometiste y cuánto te deben**. Funciona en el celular, sin internet; solo necesita internet para abrir WhatsApp o usar Telegram.

---

## 0. Antes de empezar (una sola vez)
1. Entra con tu usuario y contraseña.
2. Ve a **Ajustes → Nombre de tu taller** y escribe cómo te conocen (ej. "Arreglos Doña Rosa"). Ese nombre sale en los mensajes de WhatsApp y en los recibos.
3. Opcional: en **Ajustes → Notificaciones de Telegram** conecta tu bot para recibir copias de seguridad y reportes.

## 1. Panel de inicio
- **Tarjetas:** órdenes activas, en proceso, listas, atrasadas, **sin reclamar** (listas y con 30 días o más desde la fecha prometida) y dinero que te deben.
- **Próximas entregas:** lo que prometiste primero aparece arriba. Úsalo para decidir qué coser hoy, aunque llegue algo más fácil.
- **Enviar recordatorios:** te manda a Telegram una lista con un enlace de WhatsApp por cada cliente que no ha recogido su ropa.

## 2. Clientes
1. Menú **Clientes → + Nuevo Cliente**.
2. Nombre y **celular** (obligatorio, 10 dígitos). La app le agrega el +57 para WhatsApp.
3. Tocando un cliente ves todas sus órdenes y los avisos que le has enviado.

## 3. Crear una orden (cuando te traen ropa)
1. **Órdenes → + Nueva**.
2. Elige el cliente o toca **+ Nuevo Cliente** para crearlo ahí mismo.
3. **¿Cuándo recibiste la ropa?** Por defecto es hoy. Si estás pasando a la app ropa que recibiste antes, elige ese día.
4. **Fecha estimada de entrega:** lo que le prometiste al cliente.
5. **Crear Orden.** La orden empieza en $0; el total se arma con las prendas.
6. **Escribe el número de la orden (#) en la bolsa** o pégale la etiqueta. Así sabes siempre de quién es cada bolsa.

### Dentro de la orden hay tres pestañas
- **Prendas:** toca **+ Prenda**, elige el tipo, escribe el arreglo ("dobladillo 2 cm", "cambiar cremallera") y el precio. Con la cámara tomas foto del daño; con el lápiz agregas notas.
- **Pagos:** **+ Registrar Pago**, eliges el medio (Efectivo, Nequi, Daviplata, Transferencia o Bre-B), el valor y el día. Si te equivocaste, desliza el pago y elimínalo: el saldo se corrige solo.
- **Detalle:** estado, fechas, botones de WhatsApp, recibo e historial de todo lo que pasó.

## 4. Estados: la app los mueve sola
Tú cambias el estado de **cada prenda** en la pestaña Prendas. La orden se acomoda sola:

| Si las prendas están… | La orden queda… |
| --- | --- |
| Ninguna empezada | Pendiente |
| Al menos una En Proceso o Terminada | En Proceso |
| Todas Terminadas | **Lista para Entregar** |
| Todas Entregadas | Entregada |

- Cuando la orden pasa a **En Proceso** o a **Lista**, la app te pregunta si quieres avisarle al cliente. Si dices **Sí**, se abre WhatsApp con el mensaje escrito; tú solo pulsas Enviar.
- **Marcar Lista** y **Entregar** no funcionan si falta alguna prenda por terminar. La app te dice cuántas faltan.
- **Entregar con deuda (fiado):** sí se puede, pero la app te advierte cuánto queda debiendo. El saldo sigue apareciendo en *Pagos pendientes* hasta que lo registres.
- **Te equivocaste o el cliente volvió con un reclamo:** en una orden entregada toca **Reabrir Orden**. Vuelve a *En Proceso*; pasa a *En Proceso* solo la prenda que hay que corregir.
- **Cancelar:** si el cliente retira su ropa sin terminar. Una orden ya entregada no se puede cancelar.

## 5. Avisos al cliente por WhatsApp (gratis)
En **Detalle** tienes:
- **WhatsApp: recibimos tu ropa** – le confirma qué dejó y para cuándo.
- **WhatsApp: tu orden está lista** – cuando ya puede pasar.
- **WhatsApp: recordar saldo** – si te debe.
- **Compartir recibo** – le mandas el recibo completo (prendas, abonos y saldo) por WhatsApp o por donde quieras.

La app **no envía nada sola**: abre WhatsApp y tú decides. Por eso en el historial aparece como "aviso preparado".

## 6. Telegram (solo para ti)
- **Respaldar BD:** te envía una copia cifrada de tus datos. Hazlo cada semana.
- **Restaurar BD:** en un celular nuevo, carga el archivo del respaldo.
  - ⚠️ Hoy el respaldo **no incluye las fotos** de las prendas, solo los datos.
- **Reporte diario:** resumen de órdenes activas, listas y atrasadas. Se envía cuando tocas el botón.
- **Copia del recibo a mi Telegram:** guarda el recibo en tu chat.

## 7. Ropa que nadie recoge
Si una orden está lista y ya pasaron **30 días desde la fecha que prometiste** (o desde que la terminaste, si fue después), aparece en *Sin reclamar*. La ley (Ley 1480 de 2011, art. 18, y Decreto 1413 de 2018) dice que, pasado un mes de la fecha de entrega, debes **pedirle por escrito al cliente que la recoja**. Si en los dos meses siguientes no la recoge, se considera abandonada. Guarda ese mensaje de WhatsApp como prueba. No vendas ni regales la prenda antes de cumplir ese procedimiento.
