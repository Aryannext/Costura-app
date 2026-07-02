# Diagramas Oficiales del Sistema: Atelier Manager

A continuación presento la re-creación de todos los diagramas del sistema solicitados, construidos con la arquitectura y lógica exacta que programamos para la aplicación. 

*(Nota: Estos diagramas están escritos en código Mermaid. Si abres este archivo en tu editor web o en GitHub, se dibujarán automáticamente de forma visual).*

---

## 1. Diagrama de Arquitectura
Muestra la organización tecnológica de la aplicación y cómo interactúan las capas de desarrollo con la base de datos local y los servicios en la nube.

```mermaid
flowchart TD
    subgraph Frontend ["Capa de Presentación (Frontend)"]
        VUE[Vue.js 3]
        VITE[Vite Bundler]
        CSS[Vanilla CSS]
    end

    subgraph Logica ["Capa de Lógica (Composables)"]
        OC[useOrdenes]
        PC[usePrendas]
        CC[useClientes]
        TC[useTelegram]
    end

    subgraph Hardware ["Capa de Datos Nativa (Capacitor)"]
        SQLite[(Base de Datos SQLite)]
        Camara[Hardware Cámara]
        Archivos[Sistema de Archivos]
    end

    subgraph Nube ["Servicios Externos"]
        Telegram[Bot de Telegram]
        Whatsapp[API de WhatsApp]
    end

    VUE --> Logica
    VUE --> VITE
    VUE --> CSS
    Logica <--> SQLite
    Logica --> Camara
    Logica --> Archivos
    TC --> Telegram
    OC --> Whatsapp
```

---

## 2. Diagrama Entidad-Relación (ER)
Representa la estructura exacta de la base de datos SQLite construida para el sistema.

```mermaid
erDiagram
    cliente {
        int id_cliente PK
        string nombre
        string telefono
        string direccion
    }
    orden_trabajo {
        int id_orden PK
        datetime fecha_creacion
        date fecha_entrega_estimada
        date fecha_entrega_real
        decimal valor_total
        decimal saldo_pendiente
        int id_cliente FK
        int id_estado_orden FK
    }
    prenda {
        int id_prenda PK
        string descripcion_arreglo
        decimal valor
        int id_orden FK
        int id_tipo_prenda FK
        int id_estado_prenda FK
    }
    observacion {
        int id_observacion PK
        string descripcion
        datetime fecha_registro
        int id_prenda FK
    }
    fotografia {
        int id_fotografia PK
        string ruta_archivo
        datetime fecha_registro
        int id_prenda FK
    }
    pago {
        int id_pago PK
        datetime fecha_pago
        decimal valor
        int id_orden FK
        int id_metodo_pago FK
    }
    notificacion {
        int id_notificacion PK
        string mensaje
        datetime fecha_envio
        int id_orden FK
        int id_tipo_notificacion FK
    }
    historial_actividad {
        int id_actividad PK
        string descripcion
        datetime fecha_hora
        int id_orden FK
        int id_tipo_actividad FK
    }
    usuario {
        int id_usuario PK
        string nombre_usuario
        string contrasena
    }
    estado_orden {
        int id_estado_orden PK
        string nombre
    }
    estado_prenda {
        int id_estado_prenda PK
        string nombre
    }
    tipo_prenda {
        int id_tipo_prenda PK
        string nombre
    }
    metodo_pago {
        int id_metodo_pago PK
        string nombre
    }
    tipo_notificacion {
        int id_tipo_notificacion PK
        string nombre
    }
    tipo_actividad {
        int id_tipo_actividad PK
        string nombre
    }

    cliente ||--o{ orden_trabajo : "tiene"
    estado_orden ||--o{ orden_trabajo : "define"
    
    orden_trabajo ||--|{ prenda : "contiene"
    tipo_prenda ||--o{ prenda : "clasifica"
    estado_prenda ||--o{ prenda : "define"

    prenda ||--o{ observacion : "detalla"
    prenda ||--o{ fotografia : "documenta"

    orden_trabajo ||--o{ pago : "recibe"
    metodo_pago ||--o{ pago : "usa"

    orden_trabajo ||--o{ notificacion : "genera"
    tipo_notificacion ||--o{ notificacion : "clasifica"

    orden_trabajo ||--o{ historial_actividad : "registra"
    tipo_actividad ||--o{ historial_actividad : "clasifica"
```

---

## 3. Diagrama de Casos de Uso
Muestra las acciones principales que la dueña (Modista) puede ejecutar dentro del sistema.

```mermaid
flowchart LR
    Actor((Modista / Dueña))

    subgraph Sistema ["Atelier Manager App"]
        C1(Registrar y Buscar Clientes)
        C2(Crear Órdenes de Trabajo)
        C3(Registrar Prendas y Tomar Fotos)
        C4(Registrar Abonos y Calcular Saldos)
        C5(Avisar al Cliente por WhatsApp)
        C6(Generar Backups hacia Telegram)
    end

    Actor --> C1
    Actor --> C2
    Actor --> C3
    Actor --> C4
    Actor --> C5
    Actor --> C6
```

---

## 4. Diagrama de Flujo del Negocio (Business Flow)
Muestra el paso a paso desde que un cliente entra por la puerta hasta que se lleva su ropa reparada.

```mermaid
flowchart TD
    Inicio([Cliente llega al Taller]) --> P1{¿Es cliente nuevo?}
    P1 -- Sí --> P2[Registrar Cliente en App]
    P1 -- No --> P3[Buscar Cliente en App]
    
    P2 --> P4[Crear Nueva Orden de Trabajo]
    P3 --> P4
    
    P4 --> P5[Añadir Prendas, Precios y Fotos]
    P5 --> P6{¿Deja Abono Inicial?}
    P6 -- Sí --> P7[Registrar Pago en App]
    P6 -- No --> P8[Guardar Orden Pendiente]
    P7 --> P8
    
    P8 --> P9[Realizar el trabajo de Costura]
    P9 --> P10[Marcar Orden como 'Lista']
    P10 --> P11[App envía Alerta por Telegram]
    P11 --> P12[Dueña envía WhatsApp al Cliente]
    
    P12 --> P13[Cliente regresa al taller]
    P13 --> P14[Pagar Saldo Pendiente]
    P14 --> Fin([Entregar Prenda y Cerrar Orden])
```

---

## 5. Diagrama Funcional por Módulos
Estructura funcional de las pantallas de la aplicación.

```mermaid
flowchart TB
    App[Atelier Manager]

    App --> ModInicio[Módulo de Inicio]
    App --> ModOrdenes[Módulo de Órdenes]
    App --> ModClientes[Módulo de Clientes]
    App --> ModReportes[Módulo de Reportes]
    App --> ModAjustes[Módulo de Ajustes]

    ModInicio --> Stats[Métricas Rápidas]
    ModInicio --> Vencidas[Órdenes Próximas a Vencer]

    ModOrdenes --> ListaO[Listado de Órdenes]
    ModOrdenes --> FormO[Creación de Órdenes]
    ModOrdenes --> DetalleO[Detalle, Pagos y Fotos]

    ModClientes --> ListaC[Listado de Clientes]
    ModClientes --> Historial[Historial Financiero del Cliente]

    ModReportes --> Ingresos[Gráficas de Ingresos]

    ModAjustes --> Backup[Respaldo de Base de Datos]
    ModAjustes --> Bot[Configuración Telegram]
```

---

## 6. Diagrama de Actividades (Gestión de una Prenda)
Describe el cambio de estado (el semáforo) de una prenda y su orden.

```mermaid
stateDiagram-v2
    [*] --> Pendiente : Cliente deja la ropa
    Pendiente --> En_Proceso : Inicia la costura
    En_Proceso --> Lista_Para_Entregar : Costura finalizada
    Lista_Para_Entregar --> Entregada : Cliente recoge y paga
    Entregada --> [*]
    
    Pendiente --> Cancelada : Cliente desiste
    Cancelada --> [*]
```
