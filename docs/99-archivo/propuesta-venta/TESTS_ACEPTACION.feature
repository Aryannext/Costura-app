# language: es
# Borrador de criterios; no se ejecutó una implementación de estos escenarios.
Característica: Comercialización habilitada de prendas nuevas y usadas
  Como responsable del taller
  Quiero publicar prendas que puedo comercializar y gestionar sus reservas
  Para ofrecerlas al público con información completa y disponibilidad real

  Escenario: La falta de recogida no autoriza automáticamente una venta
    Dado que una prenda no fue recogida y el arreglo tiene saldo pendiente
    Y no existe fundamento de venta revisado y vigente
    Cuando el responsable intenta publicar la prenda
    Entonces el sistema rechaza la publicación
    Y conserva la orden y los pagos del arreglo

  Escenario: Publicación de una prenda usada habilitada
    Dado que el responsable está autenticado y tiene permiso para el taller
    Y existe un producto usado con fundamento de venta revisado y vigente
    Y se registraron precio, moneda, talla, medidas, defectos y fotos públicas
    Cuando el responsable confirma su publicación con conexión disponible
    Entonces la publicación aparece en el catálogo tras confirmación del servidor
    Y no se publica el dueño original ni sus datos personales ni su deuda

  Escenario: Dos compradores solicitan la misma unidad
    Dado que existe una sola unidad publicada y disponible
    Cuando dos compradores solicitan reservarla simultáneamente
    Entonces solo una solicitud obtiene una reserva activa
    Y la otra recibe un conflicto de disponibilidad

  Escenario: Reintento de una reserva
    Dado que el solicitante ya creó una reserva con una clave de idempotencia
    Cuando repite la misma solicitud con la misma clave
    Entonces recibe la misma reserva
    Y no se crea otra operación comercial

  Escenario: Una solicitud no representa una venta pagada
    Dado que existe una reserva activa
    Y el pago todavía no se ha verificado
    Cuando se consulta la operación comercial
    Entonces la operación permanece como reserva
    Y no aumenta los ingresos por ventas confirmadas

  Escenario: Confirmación de venta sin cambiar la contabilidad del arreglo
    Dado que existe una reserva activa y un pago verificado
    Y el responsable tiene permiso para confirmar ventas
    Cuando confirma la venta
    Entonces el producto deja de estar disponible
    Y se registra el ingreso comercial separado
    Y no se elimina ni se modifica silenciosamente el saldo del arreglo original

  Escenario: Vencimiento de reserva
    Dado que una reserva llegó a su vencimiento sin venta confirmada
    Y el producto conserva habilitación vigente
    Cuando el servidor procesa el vencimiento
    Entonces la reserva pasa a vencida
    Y el producto vuelve a estar disponible sin duplicarse

  Escenario: Publicación sin conexión
    Dado que el taller prepara una publicación sin conexión
    Cuando solicita publicarla
    Entonces la operación queda pendiente de confirmación
    Y no se anuncia como publicada ni aparece en el catálogo

  Escenario: Acceso comercial sin autorización
    Dado que una persona no tiene permiso sobre un producto del taller
    Cuando intenta publicarlo o confirmar su venta
    Entonces el servidor rechaza la operación
    Y no cambia el inventario ni los ingresos
