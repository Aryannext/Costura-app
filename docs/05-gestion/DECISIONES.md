# Decisiones del proyecto y sus argumentos

Cada decisión dice **qué se eligió, qué se descartó y por qué**. Si el instructor pregunta "¿por qué no hizo X?", la respuesta está aquí. Si una decisión cambia, se actualiza este archivo con la fecha.

Estado: 7 de octubre de 2026. Entrega: 25 de octubre de 2026.

---

## D-01. El problema real es físico y de memoria, no de "falta de una app"

**Observación (taller de la mamá del autor, Florencia):** se confunde de quién es cada prenda, olvida qué arreglo pidió cada cliente, olvida la fecha prometida cuando prioriza lo fácil, y hay ropa que nadie recoge.

**Consecuencia para el diseño:** una app sola no evita que dos bolsas se revuelvan en la mesa. Necesita un **puente físico**: el número de la orden escrito o pegado en la bolsa. La app aporta la memoria (qué, para quién, para cuándo, cuánto); la etiqueta aporta la identificación.

## D-02. Etiqueta en la bolsa: sí. Impresora térmica: todavía no

**Propuesta del autor:** comprar una impresora de tirillas y pegar en la bolsa el nombre del cliente y el número de la orden.

**Lo que está bien:** ataca la causa D-01. Además, ponerla en la bolsa y no en la prenda evita dañar la tela con el adhesivo.

**Por qué no ahora:**
1. **Costo:** una impresora térmica Bluetooth cuesta dinero, y la app promete ser gratis para la modista. Si la etiqueta exige comprar un aparato, deja de ser gratis.
2. **Tiempo:** imprimir por Bluetooth desde Capacitor requiere un plugin nativo y el protocolo ESC/POS, más pruebas en un teléfono real. Con 19 días eso pone en riesgo lo que sí hay que entregar.
3. **Hay una alternativa de costo cero que resuelve lo mismo:** número grande con marcador sobre cinta de enmascarar, o fichas numeradas reutilizables (como en lavanderías o parqueaderos). La app ya muestra el número grande en la orden.

**Cómo dejarlo preparado:** muchas impresoras térmicas baratas traen su propia app que recibe texto con "Compartir". El botón **Compartir recibo** ya lo permite, así que quien tenga impresora puede usarla **sin cambiar el código**.

**Detalle a decidir:** si las prendas salen de la bolsa mientras se trabajan, la etiqueta debería ir por prenda: `#23-2` (orden 23, prenda 2).

## D-03. Avisos al cliente por WhatsApp (enlace wa.me), no por Telegram ni por la API de WhatsApp

| Opción | Costo | Problema |
| --- | --- | --- |
| **Enlace wa.me** (elegida) | Gratis | No es automático: la modista pulsa Enviar |
| Bot de Telegram al cliente | Gratis | Un bot **no puede escribirle primero** a nadie: el cliente tendría que instalar Telegram y escribirle al bot. Las clientas usan WhatsApp |
| API oficial de WhatsApp (Cloud API) | Cobro por mensaje desde julio de 2025, verificación del negocio con Meta y plantillas aprobadas | Requiere servidor, cuenta empresarial y pago |
| Librerías no oficiales (whatsapp-web.js, Baileys) | Gratis | Violan los términos de WhatsApp y el número puede ser bloqueado. Inaceptable en un proyecto que se presenta como real |

**Argumento clave:** que la modista pulse Enviar no es un defecto. Ella ve el mensaje antes de que salga, lo puede cambiar, y el cliente recibe el mensaje desde el número que ya conoce.

**Telegram se queda** para la modista: copias de seguridad, reportes y la lista diaria de recordatorios.

## D-04. Mensajes por orden, no por cada prenda

**Propuesta del autor:** avisar cada vez que una prenda pasa a "en proceso" o "lista".

**Contraargumento:** una orden con 4 prendas generaría hasta 8 mensajes. El cliente quiere saber una cosa: **cuándo puede recoger**. Muchos mensajes se vuelven spam y el cliente deja de leerlos.

**Decisión:** la app **ofrece** (no obliga) avisar en tres momentos de la orden: recibida, en proceso (opcional) y lista. Más el recordatorio de saldo y el de "no ha recogido". El estado por prenda sigue existiendo para la modista.

## D-05. La app no procesa pagos; solo los registra

**Propuesta del autor:** que sea gratis y no cobren comisión como Nequi Negocios.

**Decisión:** la app **no mueve dinero**. Registra cómo pagó el cliente: efectivo, Nequi, Daviplata, transferencia o **Bre-B**.

**Argumentos:**
1. Integrar una pasarela obliga a contratos, comisiones y obligaciones de seguridad para manejar datos de pago.
2. **Bre-B** (Banco de la República, en operación desde 2025) permite transferencias inmediatas entre bancos y billeteras **sin costo para personas** usando una "llave" (celular, cédula o correo). La modista le da su llave al cliente y luego registra el pago en la app. Cero comisión y cero integración.

## D-06. Sin servidor: la app funciona en el celular (offline-first)

El documento de requisitos original hablaba de "navegador en la red local" con un computador servidor. La app real guarda todo en SQLite **dentro del teléfono**.

**Por qué es mejor para esta usuaria:** no tiene computador. Sin servidor no hay costo mensual ni datos de clientes en manos de terceros (ver D-08). Además funciona sin internet.

**Costo de esta decisión:** si el teléfono se pierde, se pierden los datos. Por eso existe el respaldo por Telegram (ver pendiente P-01: el respaldo no incluye las fotos).

**Acción pendiente:** marcar en el documento de requisitos los RNF de red local como **reemplazados** por esta decisión.

## D-07. Tienda web de ropa de segunda mano: fuera del alcance de esta entrega

**Propuesta del autor:** que cada modista tenga una tienda en una web; los compradores eligen prendas por categoría, arman un carrito y al "comprar" se abre el WhatsApp de la tienda.

**Lo que está bien:** cerrar la venta por WhatsApp evita pasarelas y comisiones (coherente con D-05).

**Por qué no ahora (argumentos, de más fuerte a más débil):**
1. **Choca con la ley si la ropa es "dejada".** La ropa que un cliente no recoge **no es de la modista**. La Ley 1480 de 2011 (art. 18) y el Decreto 1413 de 2018 exigen requerir al cliente un mes después de la fecha de devolución. Si no la retira en los dos meses siguientes, se considera abandonada y queda sujeta a un procedimiento antes de disponer de ella. Publicarla para venderla antes de eso es vender algo ajeno.
2. **Es otro producto, no una función.** Exige servidor, base de datos central, cuentas de usuario, alojamiento de fotos, moderación y control de fraudes entre desconocidos. La app actual no tiene servidor (D-06).
3. **Ya existe gratis:** el **catálogo de WhatsApp Business** y Facebook Marketplace hacen exactamente "ver productos → escribir por WhatsApp". No sería lo innovador del proyecto.
4. **Obligaciones legales nuevas:** con datos de muchas personas en tu servidor pasas a ser **responsable del tratamiento** (Ley 1581 de 2012). Como portal que conecta vendedores y compradores, también tendrías deberes de información según el Estatuto del Consumidor.
5. **No resuelve el problema planteado** (D-01). El instructor evalúa contra el problema del proyecto.

**Dónde queda:** como **trabajo futuro (fase 2)** en la sustentación, con estos riesgos ya identificados. Existe una propuesta anterior en `docs/99-archivo/PROPUESTA_WEB_APP.md`.

## D-08. Datos personales (Ley 1581 de 2012)

La app guarda nombre y celular de los clientes de la modista. Ella es la **responsable del tratamiento**. El desarrollador no recibe esos datos porque todo queda en el teléfono (D-06).

**Pendiente mínimo (P-03):** un texto corto de autorización que la modista pueda leerle o enviarle al cliente al registrarlo, y un aviso de privacidad en la app.

**Datos que salen del teléfono** (hay que decirlo en la ficha técnica):
- Los mensajes de WhatsApp que la modista decide enviar.
- El respaldo cifrado que va a su propio chat de Telegram.

## D-09. Recibo con los datos del art. 18 de la Ley 1480

Cuando un negocio recibe un bien para prestar un servicio, debe entregar un recibo con:
- fecha de recepción;
- identificación del bien y servicio pedido;
- sumas abonadas;
- valor y fecha de devolución, si se conocen.

El recibo de la app incluye todo eso. **No es una factura electrónica.** Una modista independiente normalmente no está obligada a facturar electrónicamente, pero eso depende de su situación tributaria y no lo decide la app.

## D-10. Reglas de estados en la capa de datos

Antes, las reglas ("no marcar Lista con prendas sin terminar") solo estaban en los botones, y se podían saltar. Ahora viven en `src/services/reglasOrden.js`, se validan dentro de `src/database/queries/` y se prueban contra SQLite real.

**Argumento para la sustentación:** una regla de negocio que solo vive en la interfaz no es una regla, es una sugerencia.

## D-11. Entregar con deuda: permitido con advertencia

El manual decía que no se podía; el requisito RN-30 decía que sí se podía seguir cobrando después de entregar.

**Se eligió permitir**, porque en el contexto real se fía: la clienta se lleva la ropa y paga el viernes. Bloquearlo haría que la modista mintiera en la app (registrar un pago falso). La app avisa cuánto queda debiendo y el saldo sigue visible en *Pagos pendientes*.

## D-12. Sesión de 15 minutos

Si la app se cierra y se abre antes de 15 minutos sin uso, no pide la clave otra vez; después sí (RNF-09). Con huella digital es un toque.

---

## Pendientes conocidos (no resueltos en esta versión)

| ID | Pendiente | Riesgo |
| --- | --- | --- |
| P-01 | El respaldo no incluye las fotos (A17) | En un teléfono nuevo se recuperan los datos pero no las fotos |
| P-02 | La clave inicial es `admin123` y no se obliga a cambiarla | Cualquiera que conozca la app puede entrar. Lo primero que el instructor puede señalar en seguridad |
| P-03 | Falta el texto de autorización de datos (D-08) | Requisito legal |
| P-04 | El token de Telegram se guarda sin cifrar en localStorage | La ficha técnica decía lo contrario; ya se corrigió el texto, falta el código |
| P-05 | Capgo (`autoUpdate: true`) es un servicio externo con plan de pago | Verificar si hay cuenta. Si no, desactivarlo para no depender de un tercero |
| P-06 | Probar en un teléfono Android real: cámara, alarma de las 8 a. m., huella, abrir WhatsApp | Las pruebas automáticas corren en navegador, no en el teléfono |
