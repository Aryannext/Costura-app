# Decisiones del proyecto y sus argumentos

Cada decisión dice **qué se eligió, qué se descartó y por qué**. Si el instructor pregunta "¿por qué no hizo X?", la respuesta está aquí. Si una decisión cambia, se actualiza este archivo con la fecha.

Estado: 7 de octubre de 2026, rama `integracion-octubre` (la rama de septiembre `fix/auditoria-produccion` + los cambios de octubre). Entrega: 25 de octubre de 2026.

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

**Costo de esta decisión:** si el teléfono se pierde, se pierden los datos. Por eso existe el respaldo cifrado por Telegram, que incluye las fotos mientras quepan en el límite de Telegram.

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

**Cómo lo cumple la app (7 oct):**
- **Aviso de privacidad** (`src/services/avisoPrivacidad.js`): para qué se usan los datos, quién es la responsable y qué derechos tiene la clienta. Se ve y se comparte desde **Ajustes → Datos de tus clientas**, y se puede abrir al registrarla.
- **Autorización previa:** una casilla obligatoria al registrar una clienta, en el formulario de Clientes y en el de una orden nueva. La regla se valida en `createCliente`, en la capa de datos, así que ninguna pantalla puede saltársela.
- **Prueba de la autorización:** la fecha se guarda en `cliente.fecha_autorizacion_datos` (migración 7).
- **Clientas registradas antes:** su detalle dice "Sin autorización de datos registrada" y permite enviarles el aviso por WhatsApp y registrar que autorizaron.
- **Derecho de supresión:** *Borrar sus datos personales*, en el detalle de la clienta, deja el nombre, el celular y la dirección vacíos. Sus órdenes y pagos se conservan sin datos personales, porque son la contabilidad del taller. No se permite con órdenes abiertas o saldo pendiente.

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

Antes, las reglas ("no marcar Lista con prendas sin terminar") solo estaban en los botones, y se podían saltar. Ahora el estado de la orden **se deriva de sus prendas** (`src/services/estadoOrden.js` y `src/database/queries/estadoOrden.js`). Las 40 reglas RN-01 a RN-40 son pruebas contra SQLite real en `src/__tests__/reglasNegocio.spec.js`, y hay una prueba que falla si alguna regla del documento queda sin probar.

**Argumento para la sustentación:** una regla de negocio que solo vive en la interfaz no es una regla, es una sugerencia.

## D-11. Entregar con deuda: permitido con advertencia

El manual decía que no se podía; el requisito RN-30 decía que sí se podía seguir cobrando después de entregar.

**Se eligió permitir**, porque en el contexto real se fía: la clienta se lleva la ropa y paga el viernes. Bloquearlo haría que la modista mintiera en la app (registrar un pago falso). La app avisa cuánto queda debiendo y el saldo sigue visible en *Pagos pendientes*.

## D-12. Clave propia y bloqueo al reanudar

- La clave de fábrica `admin123` es igual en todas las instalaciones, así que la app **obliga a cambiarla** en el primer ingreso.
- Si la app se cierra, o el teléfono queda un rato sin uso, se **bloquea**. Se desbloquea con huella o con la clave y se vuelve a la misma pantalla (RNF-09).

## D-13. Docker para la versión web, no para un servidor de datos

**Pedido:** usar Docker, que es como se despliega en el VPS del autor.

**Qué se hizo:** una imagen Docker (`Dockerfile`, `docker/nginx.conf`, `docker-compose.yml`) que sirve **la misma app de Vue** con nginx. El CI la construye, la levanta y la prueba con peticiones reales en cada cambio.

**Para qué sirve:**
1. **Demostración en la sustentación:** el instructor abre un enlace y usa la app sin instalar el APK.
2. **Página de descarga del APK:** el botón "Descargar App (Android)" del login.
3. **Evidencia del resultado de aprendizaje "desplegar el software de acuerdo con la arquitectura"** del proyecto formativo.

**Lo que no hace, y por qué:** no guarda datos en el servidor. Cada navegador tiene su propia base en IndexedDB, igual que cada teléfono tiene la suya (D-06). Meter un backend solo para "usar Docker" contradiría D-06 y D-08 (datos de terceros en tu servidor) y no cabe en 19 días.

**Aviso para la sustentación:** lo que alguien registre en la versión web se queda en su navegador. No sirve como "nube" para la modista.

---

## Pendientes conocidos (no resueltos en esta versión)

| ID | Pendiente | Riesgo |
| --- | --- | --- |
| P-01 | ~~El respaldo no incluye las fotos~~ **Resuelto en la rama de septiembre:** las incluye hasta el límite de Telegram y avisa si no caben | — |
| P-02 | ~~Clave `admin123` sin cambio obligatorio~~ **Resuelto en la rama de septiembre:** cambio obligatorio en el primer ingreso | — |
| P-03 | ~~Falta el texto de autorización de datos~~ **Resuelto (7 oct):** aviso, casilla obligatoria con fecha como prueba y borrado de datos personales (D-08) | — |
| P-04 | Verificar dónde y cómo se guarda el token de Telegram en la rama unida y que la ficha técnica lo describa igual | Afirmar en la sustentación algo que el código no hace |
| P-05 | ~~Capgo sin cuenta~~ **Resuelto (7 oct):** hay cuenta de Capgo; se mantienen las actualizaciones OTA | Documentar en el manual técnico cómo se publica una actualización |
| P-06 | Probar en un teléfono Android real: cámara, alarma de las 8 a. m., huella, abrir WhatsApp | Las pruebas automáticas corren en navegador, no en el teléfono |
| P-07 | Desplegar la imagen Docker en el VPS con dominio y HTTPS | Sin HTTPS el navegador puede bloquear funciones; para la demo se necesita un enlace estable |
