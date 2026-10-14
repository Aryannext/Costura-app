# Diagramas vigentes modificados después de la revisión: fuentes en 4252f22

Copia literal de los bloques Mermaid que cambiaron entre `a2c18ff` y `4252f22`. No sustituye a las fuentes. Las de `a2c18ff` siguen en [fuentes.md](fuentes.md).

## DG-01 · docs/02-diseno/ARQUITECTURA.md:41 · 1

![DG-01 en 4252f22](./actual-1.png)

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    P["1. Presentación<br/>views/ · components/ · router/"]
    L["2. Lógica de la aplicación<br/>composables/"]
    S["3a. Servicios<br/>services/ · reglas y utilidades"]
    D["3b. Acceso a datos<br/>database/queries/ · saldo · migraciones"]
    BD[("SQLite<br/>en el teléfono")]
    N["Plugins de Capacitor<br/>cámara, archivos, huella, avisos, compartir"]
    E["Servicios externos<br/>WhatsApp · Telegram"]

    P --> L
    L --> S
    L --> D
    D --> S
    D --> BD
    L --> N
    S --> N
    L --> E
    S --> E
```

## DG-02 · docs/02-diseno/ARQUITECTURA.md:163 · 2

![DG-02 en 4252f22](./actual-2.png)

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TD
    Start([main.js · bootstrap]) --> Init[initDatabase]
    Init --> Conn[Abrir conexión SQLite]
    Conn --> Tabla[Crear schema_migrations si falta]
    Tabla --> Leer[Leer versiones aplicadas]

    Leer --> Guardia{¿La base es más nueva<br/>que la aplicación?}
    Guardia -- Sí --> Bloqueo[/Error: actualiza la aplicación/]
    Guardia -- No --> Pend{¿Migraciones pendientes?}

    Pend -- No --> Usuario
    Pend -- Sí --> Trans[BEGIN TRANSACTION]
    Trans --> Ejec[Ejecutar sentencias]
    Ejec --> Ok{¿Todas correctas?}
    Ok -- No --> Roll[ROLLBACK] --> Falla[/Error crítico: no arranca/]
    Ok -- Sí --> Reg[Registrar versión] --> Commit[COMMIT] --> Pend

    Usuario[setupDefaultUser] --> Mant

    subgraph Mant ["Puestas al día · no bloquean el arranque"]
        M1[initPhotoStorage]
        M2[Migrar config de Telegram]
        M3[Normalizar rutas de fotos]
        M4[Reprogramar el aviso de las 8:00]
    end

    Mant --> Mount[Montar Vue] --> Bloqueo2[initAppLock]

    Bloqueo --> Pantalla[/Pantalla de Error Crítico/]
    Falla --> Pantalla
```

## DG-03 · docs/02-diseno/ARQUITECTURA.md:203 · 3

![DG-03 en 4252f22](./actual-3.png)

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart LR
    DEV["Computador del desarrollador<br/>Gradle compila el APK"]
    GH["GitHub Actions<br/>pruebas, compilación e imagen Docker"]
    VPS["VPS · contenedor Docker<br/>nginx con la app compilada"]
    NAV["Navegador<br/>app web + SQLite en IndexedDB"]
    TEL["Teléfono Android<br/>APK + SQLite + fotos"]
    WA["WhatsApp<br/>del cliente"]
    TG["Telegram<br/>de la modista"]

    DEV -->|"APK, también para cada versión nueva"| TEL
    GH -.->|"imagen · pendiente P-07"| VPS
    VPS -->|archivos estáticos| NAV
    TEL -->|enlace wa.me| WA
    TEL -->|recordatorios, recibos y copias| TG
```

## DG-09 · docs/02-diseno/CASOS_DE_USO.md:182 · 6

![DG-09 en 4252f22](./actual-9.png)

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart LR
    M["Modista"]
    K1(["Configurar nombre del taller"])
    K2(["Configurar garantía y condiciones del recibo"])
    K3(["Configurar días de aviso"])
    K4(["Ver o compartir el aviso de privacidad"])
    K5(["Activar el aviso de las 8:00"])
    K6(["Conectar el bot de Telegram"])
    K7(["Guardar copia de seguridad"])
    K8(["Enviar copia a Telegram"])
    K9(["Restaurar una copia"])
    K10(["Ver el tutorial"])
    TG["Bot de Telegram"]

    M --- K1
    M --- K2
    M --- K3
    M --- K4
    M --- K5
    M --- K6
    M --- K7
    M --- K8
    M --- K9
    M --- K10
    K8 --- TG
```

## DG-13 · docs/02-diseno/COMPORTAMIENTO.md:13 · 1

![DG-13 en 4252f22](./actual-13.png)

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    Login["/login"]
    Clave["/cambiar-clave"]

    Login -->|"credenciales correctas"| Guardia{¿Clave de fábrica?}
    Guardia -- Sí --> Clave
    Guardia -- No --> Dash

    Clave -->|"clave cambiada"| Dash

    subgraph Nav ["Barra de navegación inferior"]
        Dash["/ · Inicio"]
        Ord["/ordenes"]
        Cli["/clientes"]
        Rep["/reportes"]
        Aju["/ajustes"]
    end

    Dash --> Buscador[Buscador global]
    Dash --> Panel[Atrasadas, próximas, listas y por cobrar]

    Ord --> OrdDet["/ordenes/:id"]
    OrdDet --> TabD[Pestaña Detalle: entregar, avisos, recibo, historial]
    OrdDet --> TabP[Pestaña Prendas]
    OrdDet --> TabPa[Pestaña Pagos]

    Cli --> CliDet["/clientes/:id"]

    Aju --> Copia[Guardar y restaurar copia]
    Aju --> Tele["/telegram · bot, copia y reporte diario"]
    Aju --> Clave
    Aju --> Ayuda["/ayuda · tutorial guiado"]
```
