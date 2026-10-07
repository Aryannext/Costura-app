# Arquitectura conceptual propuesta para la venta de prendas

Estado: borrador, no arquitectura final. Aplican el alcance, reglas y decisiones pendientes de PRD.md. Este modelo amplía el análisis; no describe tablas que ya existan en la app.

Contexto del piloto confirmado: Florencia, Caquetá, Colombia. Usar America/Bogota para fechas de negocio y COP para precios. La disponibilidad declarada de 240 horas por persona orienta la estimación; no resuelve aún el número de talleres, pagos, permisos ni proveedor de infraestructura.

## 1. Visión General del Sistema

- **Patrón propuesto:** app del taller + servicio comercial compartido + catálogo público. La web no puede leer por internet la SQLite privada del teléfono.
- **Frontend:** aprovechar Vue para las interfaces; el canal de alojamiento queda pendiente.
- **Backend / API:** necesario para disponibilidad, reservas, permisos y venta. Lenguaje, autenticación y proveedor pendientes.
- **Base de datos:** persistencia compartida con transacciones para el dominio comercial; SQLite sigue siendo la fuente actual de los arreglos locales mientras no se acuerde migrarlos.
- **Infraestructura:** servicio web y almacenamiento de imágenes; proveedor, costos y política de conservación por decidir. No se han contratado recursos.

Una opción para limitar el trabajo es publicar solo productos y sus fotos seleccionadas, sin sincronizar todas las tablas del taller. Una publicación offline queda pendiente y no aparece en el catálogo hasta confirmación del servidor.

```mermaid
flowchart LR
    Modista[Responsable del taller] --> App[App del taller]
    App --> Local[(SQLite de arreglos y pagos)]
    App -->|Publicar datos seleccionados con internet| API[Servicio comercial con permisos]
    API --> DB[(Disponibilidad y operaciones comerciales)]
    API --> Fotos[Imágenes destinadas al catálogo]
    Comprador[Comprador] --> Web[Catálogo público]
    Web -->|Consultar y solicitar reserva| API
    Panel[Panel autorizado de ventas] -->|Confirmar pago y entrega| API
```

## 2. Diagrama Entidad Relación

Modelo lógico comercial. Una referencia a la prenda local es un dato de trazabilidad, no una clave foránea entre la base del teléfono y el servidor.

```mermaid
erDiagram
    taller ||--o{ producto : administra
    producto ||--o{ derecho_venta : acredita
    producto ||--o{ publicacion : presenta
    publicacion ||--o{ reserva : recibe
    reserva ||--o| venta : se_confirma
    producto ||--o| venta : se_vende
    taller {
        uuid id PK
        string nombre_publico
    }
    producto {
        uuid id PK
        uuid taller_id FK
        string referencia_prenda_local
        string origen
        string condicion
        string talla
        string medidas
        string defectos
    }
    derecho_venta {
        uuid id PK
        uuid producto_id FK
        string fundamento
        string evidencia_privada
        string estado_revision
        datetime fecha_revision
    }
    publicacion {
        uuid id PK
        uuid producto_id FK
        string titulo
        string descripcion
        bigint precio_minor
        string moneda
        string estado
        datetime fecha_publicacion
    }
    reserva {
        uuid id PK
        uuid publicacion_id FK
        string estado
        bigint precio_minor_acordado
        string moneda
        datetime vence_en
        string idempotency_key UK
    }
    venta {
        uuid id PK
        uuid reserva_id FK
        uuid producto_id FK
        bigint importe_minor
        string moneda
        string estado_entrega
        datetime fecha_pago_confirmado
    }
```

Este dibujo omite deliberadamente el esquema de cuentas, datos de compradores, fotos e historial hasta cerrar permisos y privacidad. El modelo físico debe añadirlos y las restricciones de una reserva activa, una venta por producto y una publicación activa por unidad. No es una migración ejecutable.

## 3. Diagrama de Secuencia del Flujo Comercial

```mermaid
sequenceDiagram
    actor Modista
    participant App as App o panel autorizado
    participant API as Servicio comercial
    participant DB as Base comercial
    actor Comprador
    participant Web as Catálogo
    Modista->>App: Preparar producto y fundamento de venta
    App->>API: Solicitar publicación con fotos seleccionadas
    API->>API: Verificar permisos y habilitación vigente
    alt Falta habilitación válida
        API-->>App: Rechazo y motivo
    else Puede publicarse
        API->>DB: Guardar publicación y disponibilidad
        API-->>App: Publicación confirmada
        Comprador->>Web: Consultar y solicitar reserva
        Web->>API: Reserva con clave de idempotencia
        API->>DB: Comprobar y reservar en transacción
        alt Unidad ya reservada o vendida
            API-->>Web: Conflicto de disponibilidad
        else Disponible
            API-->>Web: Reserva y vencimiento confirmados
            Modista->>App: Verificar pago y confirmar venta
            App->>API: Confirmar venta de la reserva
            API->>DB: Registrar venta y retirar disponibilidad
            API-->>App: Venta confirmada
        end
    end
```

## 4. Topología y Límites de Dominio

- **Arreglos:** conserva orden, cliente original, prendas, pagos del servicio e historial privado.
- **Comercio:** maneja productos, habilitación, publicaciones, reservas y ventas. El servidor es la autoridad de disponibilidad.
- **Catálogo:** expone únicamente información aprobada como pública; no recibe automáticamente fotos ni observaciones del arreglo.
- **Pagos:** el escenario propuesto usa confirmación manual de pago externo al catálogo. Si se elige pasarela, se necesita otra secuencia con webhook verificado, idempotencia, reembolsos y conciliación.

### Estados comerciales separados de los estados del arreglo

```mermaid
stateDiagram-v2
    [*] --> Borrador
    Borrador --> Publicado: Habilitación vigente y datos completos
    Publicado --> Reservado: Reserva atómica confirmada
    Reservado --> Publicado: Reserva vencida o cancelada y producto habilitado
    Reservado --> Vendido: Pago verificado y venta confirmada
    Publicado --> Pausado: Pausa del vendedor
    Pausado --> Publicado: Revisión favorable
    Publicado --> Retirado: Publicación retirada
    Reservado --> Retirado: Incidencia resuelta y reserva cancelada
    Vendido --> [*]
    Retirado --> [*]
```

No existe una transición automática «No pagada/No reclamada → Publicado». Las devoluciones posteriores a una venta se especificarán según el país y el modo de compra aprobado.
