# Comportamiento · Atelier Manager

Cómo se mueve la aplicación: sus pantallas, los estados de órdenes y prendas, y lo que pasa por dentro en las operaciones importantes. Todo está sacado de `src/`.

> **Revisado contra el código:** 7 de octubre de 2026

---

## 1. Navegación

Las 11 rutas de `src/router/index.js`. Cualquier otra dirección vuelve al inicio.

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
    Aju --> Actualiza[Buscar actualización OTA]
```

- **Guardia de sesión:** sin sesión, cualquier ruta lleva a `/login`. Con la clave de fábrica, cualquier ruta lleva a `/cambiar-clave`.
- **La copia de seguridad está en dos lugares:** en Ajustes se guarda como archivo (sin Telegram); en `/telegram` se envía al bot. Restaurar funciona desde los dos.

## 2. Estados

Son **dos** máquinas de estados distintas: la de cada prenda y la de la orden.

### 2.1 Estado de una prenda (`estado_prenda`)

```mermaid
%%{init: {'theme': 'neutral'}}%%
stateDiagram-v2
    [*] --> Pendiente : la prenda se registra
    Pendiente --> En_Proceso : empieza la costura
    En_Proceso --> Terminada : costura finalizada
    Terminada --> Entregada : el cliente la recoge
    Entregada --> [*]
```

Cuatro estados. Una prenda **no** se cancela: se cancela la orden completa. Solo pasa a *Entregada* desde *Terminada*.

### 2.2 Estado de una orden (`estado_orden`)

```mermaid
%%{init: {'theme': 'neutral'}}%%
stateDiagram-v2
    [*] --> Pendiente : orden creada, sin prendas
    Pendiente --> En_Proceso : se agrega una prenda
    En_Proceso --> Pendiente : se elimina la última prenda
    En_Proceso --> Lista_para_Entregar : todas las prendas Terminadas
    Lista_para_Entregar --> En_Proceso : prenda nueva o prenda que vuelve a proceso
    Lista_para_Entregar --> Entregada : botón Entregar o todas las prendas Entregadas
    Entregada --> En_Proceso : reabrir (RN-16)

    Pendiente --> Cancelada : el cliente desiste
    En_Proceso --> Cancelada : el cliente desiste
    Lista_para_Entregar --> Cancelada : el cliente desiste

    Entregada --> [*]
    Cancelada --> [*]
```

**Transiciones automáticas.** *Pendiente*, *En Proceso* y *Lista para Entregar* no se eligen a mano: las decide `derivarEstadoOrden` (`services/estadoOrden.js`) cada vez que se crea, cambia de estado o elimina una prenda, en la misma transacción.

| Prendas de la orden | Estado de la orden | Regla |
| --- | --- | --- |
| Ninguna | Pendiente | RN-04 |
| Alguna *Pendiente* o *En Proceso* | En Proceso | RN-17 |
| Todas *Terminada* o *Entregada*, alguna sin entregar | Lista para Entregar · se registra "falta avisarle al cliente" | RN-06, RN-10 |
| Todas *Entregada* | Entregada · se sella la fecha de entrega real | RN-09 |

Una orden *Entregada* o *Cancelada* no cambia por sus prendas.

**Acciones manuales** (`validators.validateCambioManualEstado`):
- *Entregar*: solo desde *Lista para Entregar*. Pone todas las prendas en *Entregada*.
- *Cancelar*: cualquier orden que no esté *Entregada*. Los pagos se conservan.
- *Reabrir*: solo una *Entregada*; vuelve a *En Proceso*.
- Una orden *Cancelada* no admite prendas ni pagos.

**Otros estados que se calculan, no se guardan:**

| Concepto | Regla | Dónde |
| --- | --- | --- |
| Orden activa | Solo *En Proceso* y *Lista para Entregar* (RN-04). Una *Pendiente* no cuenta en atrasadas, próximas ni recordatorios | `ESTADOS_ORDEN_ACTIVA` |
| Estado de pago | *Pagada* si el saldo es cero, *Pendiente* si queda saldo (RN-28) | `estadoDePago` |
| Próxima a vencer | Entrega entre hoy y hoy + N días, con N de 0 a 30 en Ajustes (RN-38) | `clasificarVencimiento` |
| Sin reclamar | Lista y más de N días (30) desde la fecha más tardía entre `fecha_lista` y la fecha prometida (RN-37). Es una alerta, no el procedimiento legal de la Ley 1480 | `queries/reportes.js` |
| Saldo | `valor_total = suma de prendas`; `saldo = total − pagos no anulados`. Se recalcula en cada escritura; nunca se suman diferencias | `queries/saldo.js` |

## 3. Secuencias

### 3.1 Agregar una prenda

Muestra por qué el estado y el saldo nunca se descuadran: todo va en una sola transacción.

```mermaid
%%{init: {'theme': 'neutral'}}%%
sequenceDiagram
    actor M as Modista
    participant F as PrendaForm
    participant U as usePrendas
    participant V as validators
    participant Q as queries/prendas
    participant E as estadoOrden
    participant BD as SQLite

    M->>F: tipo, arreglo y precio
    F->>U: savePrenda()
    U->>V: validar descripción, precio y orden abierta
    alt dato inválido
        V-->>M: mensaje de error, no se guarda nada
    else válido
        U->>Q: createPrenda()
        Q->>BD: leer estados de la orden y sus prendas
        Q->>E: derivarEstadoOrden(prendas + la nueva)
        E-->>Q: En Proceso
        Q->>BD: BEGIN
        Q->>BD: cambio de estado de la orden e historial
        Q->>BD: INSERT prenda (Pendiente)
        Q->>BD: recalcular total y saldo
        Q->>BD: COMMIT
        U-->>M: prenda agregada
    end
```

Si cualquier sentencia falla, la transacción se deshace completa: no queda una prenda sin su total ni una orden con el estado equivocado.

### 3.2 Registrar un abono

```mermaid
%%{init: {'theme': 'neutral'}}%%
sequenceDiagram
    actor M as Modista
    participant F as PagoForm
    participant U as usePagos
    participant V as validators
    participant Q as queries/pagos
    participant BD as SQLite

    M->>F: valor, medio y fecha
    F->>U: savePago()
    U->>V: orden no cancelada, valor positivo y dentro del saldo
    U->>Q: registrarPago()
    Q->>BD: BEGIN
    Q->>BD: INSERT historial "Abono registrado"
    Q->>BD: INSERT pago, con la comprobación dentro de la misma sentencia
    Note over Q,BD: si el valor no es positivo, pasa el saldo<br/>o la orden está cancelada, el valor queda NULL<br/>y la base rechaza toda la transacción
    alt rechazado
        BD-->>Q: ROLLBACK
        Q-->>M: "El pago no se registró porque supera el saldo"
    else aceptado
        Q->>BD: recalcular total y saldo
        Q->>BD: COMMIT
        U-->>M: abono registrado
    end
```

La comprobación se hace **dos veces**: antes, en `validators`, para dar un mensaje claro; y dentro de la sentencia que escribe, porque un doble toque lanza dos guardados que leerían el mismo saldo.

### 3.3 Sesión: acceso y bloqueo

```mermaid
%%{init: {'theme': 'neutral'}}%%
sequenceDiagram
    actor M as Modista
    participant L as LoginView
    participant A as services/auth
    participant BD as usuario (SQLite)
    participant P as Preferences
    participant R as Router

    M->>L: usuario y contraseña
    L->>A: login()
    A->>BD: getUsuarioByUsername()
    BD-->>A: password_hash
    A->>A: bcrypt.compare()
    A->>A: ¿el hash es el de fábrica?
    A->>P: guardar sesión
    A-->>R: autenticada

    alt clave todavía de fábrica
        R->>M: /cambiar-clave (obligatorio)
    else clave propia
        R->>M: panel de inicio
    end

    Note over M,R: la app pasa a segundo plano
    A->>A: lockSession() inmediato
    Note over A: se bloquea al SALIR, para que la miniatura<br/>del selector de apps no muestre datos

    alt regresa antes de 2 minutos
        A->>A: se quita el bloqueo solo
    else regresa después, o arranque en frío
        A->>M: pantalla de bloqueo (huella o contraseña)
    end
```

Además, la sesión se cierra tras 15 minutos sin tocar la pantalla.

### 3.4 Copia de seguridad y restauración

```mermaid
%%{init: {'theme': 'neutral'}}%%
sequenceDiagram
    actor M as Modista
    participant V as Ajustes o Telegram
    participant B as useBackupRestore
    participant BD as SQLite
    participant F as Filesystem
    participant C as cryptoService
    participant S as Compartir de Android
    participant T as Bot de Telegram

    Note over M,T: COPIA
    M->>V: Guardar copia + contraseña maestra
    V->>B: executeCryptoAction()
    B->>BD: exportar la base completa
    B->>F: medir y leer cada foto
    alt las fotos superan 20 MB
        B->>B: se excluyen y se avisa
    end
    B->>C: encryptBackup(datos, contraseña)
    Note over C: PBKDF2-SHA256 600 000 · AES-256-GCM
    C-->>B: archivo cifrado
    alt desde Ajustes
        B->>F: escribir en la caché
        B->>S: abrir Compartir (Drive, WhatsApp...)
    else desde Telegram
        B->>T: sendDocument()
    end

    Note over M,T: RESTAURACIÓN
    M->>V: Restaurar + archivo + contraseña
    V->>B: executeCryptoAction()
    B->>C: decryptBackup()
    C-->>B: datos en claro
    B->>B: leerPayload() · formato 1 o 2
    B->>F: escribir las fotografías
    B->>BD: instantánea de seguridad
    B->>BD: cerrar la conexión e importar
    alt la importación falla
        B->>BD: volver a la instantánea
    end
    B->>V: recargar la aplicación
```

**Qué lleva la copia (formato 2):** la base de datos completa (incluida la configuración del bot y la contraseña como hash) y las fotografías mientras no pasen de 20 MB. Las copias del formato 1, sin fotos, se siguen pudiendo restaurar.
