# Manual de Usuario: Atelier Manager

¡Bienvenido! Esta herramienta fue diseñada para facilitarte la vida: gestionar los pedidos de tus clientes de manera rápida, profesional y sin necesidad de internet.

A continuación te explicamos cómo usar cada parte de tu aplicación.

---

## 1. Entrar a la aplicación

La primera vez que abras la app, entra con el usuario **`admin`** y la contraseña **`admin123`**.

**Lo primero que te va a pedir es cambiar esa contraseña, y no te dejará hacer nada más hasta que lo hagas.** No es un capricho: esa clave viene igual en todas las instalaciones, así que cualquiera que la conozca podría abrir los datos de tus clientes. Elige una tuya, de al menos 8 caracteres.

Después puedes cambiarla cuando quieras desde **Ajustes → Cambiar Contraseña**.

**Huella o rostro.** Si tu teléfono tiene lector, aparecerá el botón *Ingresar con Huella / FaceID* y entrarás en un segundo.

**La app se bloquea sola.** Si sales a responder un mensaje y vuelves enseguida, sigues dentro sin que te moleste. Si dejas el teléfono un rato encima del mostrador, o cierras y vuelves a abrir la aplicación, te pedirá la huella o la contraseña. Tus datos siguen donde estaban: al desbloquear vuelves justo a la pantalla en la que ibas, incluso con un formulario a medio llenar.

---

## 2. El panel de inicio

Al entrar verás un resumen de cómo está tu taller hoy:

- **Tarjetas superiores:** los números grandes. Cuántas órdenes tienes activas, cuántas están atrasadas, cuántas llevan más de 30 días sin reclamar y cuánto dinero tienes "en la calle".
- **Buscador:** escribe un nombre, un teléfono o un número de orden y aparece al instante, separado en *Clientes* y *Órdenes*.
- **Próximas entregas:** los pedidos que debes entregar más pronto. Ideal para priorizar el día.

**El aviso de las 8:00 de la mañana.** Si algún día tienes entregas, el teléfono te avisa a primera hora con la cantidad exacta de ese día. Funciona sin internet. Los avisos se preparan para los siguientes 7 días cada vez que abres la aplicación, así que ábrela al menos una vez por semana para que no se queden sin cuerda.

---

## 3. Clientes (tu agenda)

1. Toca **"Clientes"** en el menú de abajo.
2. Presiona **"+ Nuevo Cliente"**.
3. Ingresa Nombre y Teléfono. El teléfono es importante: es el que se usa para los avisos de WhatsApp.
4. Tocando el nombre de un cliente ves todo su **historial**: cuánto te ha pagado, cuántas prendas le has arreglado y si es cliente frecuente.

---

## 4. Órdenes (el corazón del taller)

Una orden es el "ticket" que le creas al cliente cuando te trae ropa.

**Cómo crear una orden**

1. Ve a **"Órdenes"** y presiona **"+ Nueva Orden"**.
2. **Selecciona al cliente.** Si es nuevo, puedes crearlo ahí mismo sin salir del formulario.
3. Elige la **fecha de entrega** que le prometiste. Puedes ponerla para hoy mismo si es un arreglo rápido.
4. Presiona **Guardar**.

> **El precio no se pone aquí.** La orden nace en cero y el total se va calculando solo a medida que le añades prendas. Es a propósito: así el total siempre coincide con lo que hay dentro.

**Dentro de una orden hay tres pestañas**

- **Detalle** — el dinero pendiente y el estado general. Desde aquí cambias el estado y generas recibos digitales.
- **Prendas** — aquí agregas la ropa real.
  - Presiona **"+ Prenda"**, escribe qué hay que hacerle, ponle precio y guarda. La app te sugiere las descripciones que más usas, para no repetir escritura.
  - **Fotos:** el ícono de la cámara le toma foto al daño. Tócala para verla en grande, o la "X" roja para borrarla.
  - **Notas:** el botón de lápiz sirve para anotar cosas como "cortar 2 dedos de largo".
- **Pagos** — cuando el cliente venga a abonar, entra aquí y registra el valor. El saldo se actualiza solo.

---

## 5. Los estados (el semáforo)

Cada **prenda** pasa por cuatro etapas: **Pendiente → En Proceso → Terminada → Entregada**.

La **orden completa** avanza sola según sus prendas:

1. 🔵 **Pendiente** — la ropa está en el mostrador.
2. 🟡 **En Proceso** — estás trabajando en ella.
3. 🟢 **Lista para Entregar** — en cuanto marcas *Terminada* la última prenda, la orden salta aquí sola y la app te ofrece avisarle al cliente por WhatsApp.
4. ⚫ **Entregada** — cuando todas las prendas quedan entregadas. Se guarda la fecha y hora exactas.

También puedes **cancelar** una orden si el cliente desiste, y **reabrir** una entregada si hubo un error. Ambas cosas quedan registradas en el historial de la orden.

Lo que la app **sí** te impide:

- Cancelar una orden que ya entregaste.
- Añadir prendas o pagos a una orden cancelada.
- Registrar un abono mayor que el saldo pendiente.

> ⚠️ **Ojo con esto:** la aplicación **no** te impide marcar una orden como entregada si el cliente todavía te debe. Revisa el saldo en la pestaña *Detalle* antes de entregar la ropa. Es una mejora pendiente.

---

## 6. Telegram: tu asistente y tu red de seguridad

Ve a **Ajustes → Notificaciones de Telegram** y pega el token de tu bot y tu chat id.

**Respaldar BD.** Presiónalo al menos una vez por semana. La app te pedirá una **contraseña maestra**, cifrará todo y te lo mandará como archivo a tu chat privado.

> 🔑 **Esa contraseña maestra no se guarda en ninguna parte.** Si se te olvida, el respaldo no se puede abrir. Ni tú, ni nosotros, ni nadie. Anótala en un lugar seguro.

Dentro del archivo va todo: clientes, órdenes, prendas, pagos, historial, la configuración de tu bot y **las fotografías de las prendas** — siempre que entre todo en el tamaño que Telegram admite. Si tienes demasiadas fotos, la app te envía el respaldo igual pero sin ellas, y te lo dice claramente en el mensaje. Es preferible tener las cuentas a salvo que no tener nada.

**Restaurar BD.** Si cambiaste de teléfono: descarga el archivo que te mandó el bot, presiona *Restaurar BD*, búscalo y escribe tu contraseña maestra. Tu taller vuelve a estar intacto, con fotos incluidas. La app se reinicia sola al terminar.

**Recibos.** Desde el detalle de una orden puedes generar un recibo que el bot te manda a ti, para que tú se lo reenvíes al cliente.

---

## 7. Ayuda dentro de la app

En **Ajustes → Ayuda e Instrucciones** hay un tutorial guiado que te lleva de la mano por la pantalla: te señala dónde tocar para crear un cliente, una orden o registrar una prenda.

---

*Diseñado para que tu talento brille, mientras la aplicación hace el trabajo pesado.*
