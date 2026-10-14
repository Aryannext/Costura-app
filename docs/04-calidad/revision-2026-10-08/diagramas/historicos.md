# Diagramas históricos: fuera de alcance vigente

## DH-01 · docs/04-calidad/historico/AUDITORIA_APP_DOCUMENTACION.md

```mermaid
flowchart TD
    Cabecera[Crear orden Pendiente con total y saldo cero] --> Prendas[Añadir prendas y sumar sus valores]
    Prendas --> Proceso[Iniciar Proceso desde Detalle]
    Proceso --> Manual[Marcar Lista sin comprobar prendas]
    Prendas --> Auto[Terminar todas las prendas]
    Auto --> Lista[Orden pasa automáticamente a Lista]
    Lista --> Registro[Insertar notificación local sin envío]
    Manual --> Consulta[Ofrecer confirmación para enviar Telegram]
    Consulta --> Telegram[Mensaje al chat administrador con enlace WhatsApp]
    Manual --> General[Entrega general sin validar saldo]
    Lista --> Individual[Entregar prendas individualmente]
    Individual --> Todas{Todas entregadas}
    Todas -->|Sí| Entregada[Orden Entregada]
    General --> Entregada
    Entregada --> Reabrir[Reabrir a Pendiente conservando datos de entrega]
```

## DH-02 · docs/04-calidad/historico/FALLOS_APP_2026-10-06.md

```mermaid
flowchart TD
    Cabecera[Crear orden Pendiente con total y saldo cero] --> Prendas[Añadir prendas y sumar sus valores]
    Prendas --> Proceso[Iniciar Proceso desde Detalle]
    Proceso --> Manual[Marcar Lista sin comprobar prendas]
    Prendas --> Auto[Terminar todas las prendas]
    Auto --> Lista[Orden pasa automáticamente a Lista]
    Lista --> Registro[Insertar notificación local sin envío]
    Manual --> Consulta[Ofrecer confirmación para enviar Telegram]
    Consulta --> Telegram[Mensaje al chat administrador con enlace WhatsApp]
    Manual --> General[Entrega general sin validar saldo]
    Lista --> Individual[Entregar prendas individualmente]
    Individual --> Todas{Todas entregadas}
    Todas -->|Sí| Entregada[Orden Entregada]
    General --> Entregada
    Entregada --> Reabrir[Reabrir a Pendiente conservando datos de entrega]
```

## DH-03 · docs/04-calidad/historico/REVISION_EQUIPO_ANALISTAS_2026-10-07.md

```mermaid
sequenceDiagram
    actor E as Encargada
    participant A as Costura-app
    participant D as Base local
    participant W as WhatsApp
    E->>A: Solicitar aviso de orden lista
    A->>D: Consultar estado y datos actuales
    D-->>A: Orden
    alt La orden permite el aviso
        A->>W: Abrir mensaje preparado
        A->>D: Registrar aviso preparado
        Note over E,W: La encargada decide enviar o volver
        Note over A,W: La app no recibe confirmación de entrega
    else La orden no está lista
        A-->>E: Informar que no se puede avisar como lista
    end
```

## DH-04 · docs/99-archivo/propuesta-venta/ARQUITECTURA.md

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

## DH-05 · docs/99-archivo/propuesta-venta/ARQUITECTURA.md

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

## DH-06 · docs/99-archivo/propuesta-venta/ARQUITECTURA.md

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

## DH-07 · docs/99-archivo/propuesta-venta/ARQUITECTURA.md

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

## DH-08 · docs/99-archivo/PROPUESTA_WEB_APP.md

```mermaid
flowchart LR
    Modista[Modista o responsable] --> App[App del taller]
    App --> Local[(SQLite privada de arreglos)]
    App -->|Publicar datos seleccionados| Servicio[Servicio comercial con permisos]
    Servicio --> Datos[(Productos y disponibilidad)]
    Servicio --> Fotos[Fotografías públicas]
    Comprador[Comprador] --> Web[Web pública]
    Web -->|Consultar y reservar| Servicio
    Panel[Panel del taller] -->|Verificar pago y confirmar venta| Servicio
```

## DH-09 · docs/99-archivo/PROPUESTA_WEB_APP.md

```mermaid
flowchart TD
    Producto[Registrar producto nuevo o usado] --> Derecho{Existe derecho de venta válido y revisado}
    Derecho -->|No| Bloqueado[Conservar en gestión interna sin publicar]
    Derecho -->|Sí| Ficha[Preparar fotos y datos completos]
    Ficha --> Publicar[Solicitar publicación con internet]
    Publicar --> Catalogo[Servicio confirma y muestra el producto]
    Catalogo --> Solicitud[Comprador solicita reserva]
    Solicitud --> Disponible{La unidad está disponible}
    Disponible -->|No| Aviso[Informar indisponibilidad]
    Disponible -->|Sí| Reserva[Confirmar reserva y vencimiento]
    Reserva --> Pago{Pago verificado}
    Pago -->|Sí| Venta[Registrar venta y retirar disponibilidad]
    Pago -->|No al vencer la reserva| Vencida[Cancelar reserva y revisar disponibilidad]
    Venta --> Entrega[Registrar entrega o recogida]
```

## DH-10 · docs/99-archivo/PROPUESTA_WEB_APP.md

```mermaid
stateDiagram-v2
    [*] --> Borrador
    Borrador --> Publicado: Habilitación revisada y datos completos
    Publicado --> Reservado: Reserva confirmada
    Reservado --> Publicado: Reserva vencida o cancelada y producto habilitado
    Reservado --> Vendido: Pago verificado y venta confirmada
    Publicado --> Pausado: Pausa del responsable
    Pausado --> Publicado: Revisión favorable
    Publicado --> Retirado: Retiro de publicación
    Reservado --> Retirado: Incidencia resuelta y reserva cancelada
    Vendido --> [*]
    Retirado --> [*]
```
