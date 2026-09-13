# 🧵 Atelier Manager (Costura App)

¡Bienvenido al código fuente de **Atelier Manager**! 

Este proyecto nació con un propósito muy claro: **ayudar a organizar una sastrería/taller de costura de forma moderna, rápida y segura**. Tradicionalmente, los talleres llevan sus cuentas en cuadernos de papel que se pueden perder o dañar. Esta aplicación resuelve ese problema convirtiendo un teléfono móvil en un centro de mando profesional, sin necesidad de pagar servidores mensuales ni requerir conexión constante a internet.

Es uno de los tres proyectos de mi portafolio: **[proyectosena.online](https://proyectosena.online)** — donde también puedes probarlo en [/costura](https://proyectosena.online/costura).

---

## 💡 ¿Qué construimos y por qué lo hicimos?

Construimos una **Aplicación Móvil Híbrida**. Esto significa que usamos tecnologías web (las mismas que se usan para crear páginas web) para diseñar la aplicación, pero la empaquetamos de tal forma que se instala como una aplicación real en tu teléfono Android o iPhone.

**¿Por qué lo hicimos así?**
1. **Velocidad de desarrollo:** Es mucho más rápido diseñar pantallas bonitas con tecnologías web que programar en lenguajes nativos de Android (Java/Kotlin).
2. **Funcionamiento Offline:** Decidimos que la aplicación debía funcionar **sin internet**. Los talleres de costura necesitan acceso rápido a sus datos sin importar si tienen buena señal o si pagaron el plan de datos.
3. **Cero costos de servidor:** En lugar de guardar los datos en "la nube" (lo cual cuesta dinero mensual), la aplicación guarda absolutamente toda la información en la memoria interna del teléfono. 

---

## 🛠️ El Stack Tecnológico (¿Con qué está hecho?)

Para lograr que todo funcionara fluido, elegimos herramientas muy modernas y potentes:

### 1. Vue.js 3 (Framework Visual)
Vue es el motor de nuestra interfaz. Lo elegimos porque es extremadamente rápido y nos permite crear aplicaciones "reactivas" (donde tocas un botón y la pantalla cambia instantáneamente sin tener que recargar).

### 2. Vite (El Motor de Arranque)
Vite es la herramienta que enciende nuestra aplicación mientras la programamos. Antiguamente se usaban herramientas que tardaban minutos en encender; Vite enciende el proyecto en milisegundos y prepara todo el código para que sea súper ligero.

### 3. Vanilla CSS (Estilos y Diseño)
No usamos plantillas genéricas ni cosas pesadas como Bootstrap. Todo el diseño (colores, sombras, botones redondeados, animaciones táctiles) fue hecho "a mano" con puro CSS moderno. Esto garantiza que la app luzca **Premium**, como una app real de iPhone o Android, pero pesando muy poco.

### 4. SQLite Nativo (La Base de Datos)
Aquí es donde se guarda todo (clientes, órdenes, prendas, medidas). En lugar de usar una base de datos web que se borra al limpiar el caché, usamos un plugin especial llamado `@capacitor-community/sqlite`. Esto crea un archivo real y permanente dentro de las tripas de tu teléfono.

### 5. Telegram Bot API (El Asistente en la Nube)
Dado que la app no tiene servidor propio, integramos Telegram. El bot actúa como un asistente gratuito que:
- Te envía alertas diarias.
- Recibe archivos `.json` con la copia de seguridad de tu base de datos para que nunca pierdas información.
- Genera enlaces mágicos hacia WhatsApp para cobrar a los clientes.

---

## ⚡ La Magia Principal: ¿Qué es Capacitor?

**Capacitor** es el "puente mágico" de nuestro proyecto. Creado por la empresa Ionic, su trabajo es fascinante: 

**¿Para qué sirve?**
Imagina que hiciste una página web muy bonita. Normalmente, la gente tiene que abrir Google Chrome para verla. Capacitor toma esa página web, la mete dentro de una "caja protectora" invisible, y la convierte en un archivo instalable (un `.apk` para Android). 

**¿Cómo funciona en este proyecto?**
Gracias a Capacitor, nuestra página web (hecha en Vue) ahora tiene **Súper Poderes Híbridos y Nativos**. Le pedimos a Capacitor que nos prestara herramientas del celular físico:
- **Seguridad Biométrica Nativa (Huella / FaceID):** Integrado mediante `@aparajita/capacitor-biometric-auth`. Permite iniciar sesión en 1 segundo usando el lector de huellas o reconocimiento facial del teléfono, saltándose la contraseña con total seguridad.
- **Recordatorios locales a las 8:00 AM:** Integrado con `@capacitor/local-notifications`, funcionando 100% offline. Se programa **un aviso independiente por cada uno de los próximos 7 días que tenga entregas**, cada uno con la cuenta real de ese día. Se rearman en cada arranque de la aplicación, así que las cifras se refrescan solas. No se usa una notificación repetitiva porque su texto queda congelado con la cuenta del día en que se programó, y a partir de ahí miente cada mañana.
- **Compartir Nativo (Share Sheet API):** Integrado con `@capacitor/share`. Al tocar "Compartir Recibo", abre el menú nativo del celular para compartir por WhatsApp, Correo, Bluetooth o Telegram.
- **Cámara y Almacenamiento Permanente:** Toma fotos de prendas y las guarda directamente en la memoria persistente del celular (`Directory.Data`), sobreviviendo a borrados de caché.
- **Bloqueo al Reanudar:** La sesión se conserva entre aperturas, pero la aplicación se **bloquea** al pasar a segundo plano y exige huella o contraseña para volver a mostrar los datos si la ausencia superó los 2 minutos. En arranque en frío siempre se entra bloqueado. Salir un momento a responder un mensaje no cuesta una autenticación; dejar el teléfono encima del mostrador, sí. El bloqueo cubre la pantalla sin desmontar la vista, así que al desbloquear se sigue justo donde se estaba, con el formulario a medio llenar intacto. Por encima sigue actuando el cierre de sesión automático a los 15 minutos de inactividad.
- **El Vibrador (Haptics) y Barra de Estado:** Retroalimentación táctil al pulsar botones y coloreado nativo de la barra superior.
- **El Disco Duro Nativo (SQLite):** Bóveda relacional local (`@capacitor-community/sqlite`) optimizada con índices de alto rendimiento (`idx_orden_fecha_entrega`, etc.).
- **Actualizaciones Silenciosas OTA (Over-The-Air):** Gracias a `@capgo/capacitor-updater`, la aplicación se puede actualizar automáticamente en segundo plano sin necesidad de pasar por la revisión de las tiendas de aplicaciones (Play Store / App Store).

---

## 🔐 Primer Inicio de Sesión

Toda instalación nueva crea un único usuario de fábrica:

| Usuario | Contraseña |
| --- | --- |
| `admin` | `admin123` |

Estas credenciales son idénticas en todas las instalaciones, así que **la aplicación obliga a cambiarlas antes de dejar entrar a ninguna pantalla**. Al iniciar sesión por primera vez (con contraseña o con huella) la app desvía a *Cambiar Contraseña* y no permite navegar a ninguna otra ruta hasta que la clave deje de ser la de fábrica; la única salida alternativa es cerrar sesión.

La obligación no se guarda como una bandera: se deduce comparando el hash almacenado contra la contraseña de fábrica cada vez que arranca la sesión. Así, si se restaura un respaldo que traía la contraseña original, la app vuelve a exigir el cambio.

Después, la contraseña se puede cambiar cuando se quiera desde **Ajustes → Cambiar Contraseña**. La nueva debe tener al menos 8 caracteres, ser distinta de la actual y no puede ser la de fábrica.

---

## 🗄️ Migraciones del Esquema

El esquema está versionado. Las migraciones aplicadas se registran en la tabla `schema_migrations`, que se puede consultar con cualquier visor de SQLite para saber en qué versión está el teléfono de alguien.

**Para añadir una migración**, se agrega una entrada nueva al array de [`src/database/migrations.js`](src/database/migrations.js) — nunca se toca una ya publicada, porque los teléfonos que ya la aplicaron no la volverán a ejecutar:

```js
{
  toVersion: 4,
  statements: [
    `ALTER TABLE cliente ADD COLUMN correo TEXT;`
  ]
}
```

Reglas que impone [`migrationRunner.js`](src/database/migrationRunner.js):

- Cada migración corre **dentro de su propia transacción**. Si una sentencia falla, se revierte entera y la versión no se registra.
- Un fallo **detiene el arranque** y muestra la pantalla de error crítico. Antes los errores se registraban en consola y la aplicación seguía con el esquema a medio aplicar, que es la peor combinación posible.
- Sólo se ejecuta lo pendiente, en orden de `toVersion`. Las migraciones ya aplicadas no se repiten, así que un `INSERT OR IGNORE` de datos semilla no resucita filas que la dueña borró a propósito.
- **Guardia contra reversiones OTA:** si la base de datos está en una versión más alta de la que entiende el código, la aplicación se niega a arrancar y pide actualizar. Capgo tiene `autoUpdate` activado y puede devolver el teléfono a un bundle anterior; dejar que ese código escriba sobre un esquema más nuevo corrompe los datos en silencio.

> El número de versión que se pasa a `createConnection` es el del mecanismo de upgrade del plugin, que **no** se usa. Debe quedarse en `1`.

---

## 💾 Respaldo y Restauración

El respaldo se cifra en el teléfono y se envía como documento al chat privado de Telegram configurado en **Ajustes → Notificaciones de Telegram**. El cifrado es AES-256-GCM con la clave derivada por PBKDF2-SHA256 y 600 000 iteraciones: **sin la contraseña maestra el archivo no se puede abrir, y no hay forma de recuperarla**.

Dentro del archivo cifrado va todo lo necesario para levantar la instalación en un teléfono nuevo:

| Contenido | Incluido |
| --- | --- |
| Clientes, órdenes, prendas, pagos, historial | Sí |
| Configuración del bot de Telegram | Sí |
| Fotografías de las prendas | Sí, si en conjunto no superan 20 MB |
| Contraseña de acceso | Sí (como hash, nunca en claro) |

**Límite de fotografías.** El bot de Telegram rechaza documentos de más de 50 MB, y entre el base64 y el cifrado el archivo final pesa cerca del doble que las fotos en crudo. Si las fotografías superan los 20 MB, el respaldo se envía **igualmente pero sin ellas**, y el mensaje que acompaña al archivo lo dice con claridad: es preferible un respaldo sin fotos que ningún respaldo.

**Restaurar.** Desde la misma pantalla, *Restaurar BD* pide el archivo y la contraseña maestra. Antes de tocar nada se toma una instantánea de la base de datos actual: si la importación falla, se revierte sola. Al terminar, la aplicación se recarga — es obligatorio, porque la conexión a la base de datos se cierra durante la importación.

Los respaldos generados por versiones anteriores (que no llevaban fotografías) se siguen pudiendo restaurar; la aplicación los detecta y avisa de que no traen imágenes.

---

## 🛡️ Calidad de Código e Integración Continua (CI/CD)

- **Pruebas automatizadas:** **91 pruebas** con Vitest y Vue Test Utils sobre la capa de datos, los composables y los servicios. Cubren las reglas de negocio (validaciones de cliente, prenda, pago y fechas de entrega), el cifrado y la restauración de respaldos, el bloqueo de sesión y el arranque de la aplicación.
- **GitHub Actions:** en cada push y cada pull request a `main` se instalan las dependencias con `npm ci`, se ejecuta `npm run test:unit` y se compila el proyecto. `npm ci` instala exactamente lo que dice el lockfile y falla si `package.json` y `package-lock.json` no concuerdan, de modo que una dependencia sin declarar rompe la CI en lugar de colarse como transitiva.
- **Trinquete de cobertura:** los umbrales de `vitest.config.js` están fijados justo por debajo de la cobertura real, así que la CI falla si alguien la hace bajar. Al añadir pruebas, hay que subirlos.

```bash
npm run test:unit
```

---

## 📂 Estructura del Código

La aplicación tiene **cuatro capas con dependencias en una sola dirección**: una vista nunca habla con la base de datos, y una consulta nunca sabe de Vue. El plano completo está en [`docs/DIAGRAMAS.md`](docs/DIAGRAMAS.md).

```
src/
├── views/          Presentación · 11 vistas enrutadas
├── components/     Presentación · componentes reutilizables
│   ├── layout/       AppHeader, AppNav, AppToast, AppLockScreen
│   ├── ordenes/      OrdenForm, OrdenCard, TabDetalle, TabPrendas, TabPagos
│   ├── prendas/      PrendaForm, PrendaCard
│   ├── clientes/     ClienteForm, ClienteCard
│   └── common/       SkeletonLoader, StatusBadge, SwipeItem, PhotoViewerModal
│
├── composables/    Lógica de negocio · estado reactivo y orquestación
│                     useOrdenes, usePrendas, useClientes, usePagos, useReportes,
│                     useBackupRestore, useNotificacionesLocales, useAppLock,
│                     useTelegramBot, useUpdates, useSearch, useAsyncAction…
│
├── services/       Transversal · no pertenece a ninguna capa
│                     auth · sesión, bloqueo y cambio de contraseña
│                     cryptoService · AES-256-GCM para los respaldos
│                     validators · reglas de negocio, con pruebas
│                     photoStorage · fotografías en Directory.Data
│                     fechas · todo lo que toque fechas, en hora local
│                     backupPayload · formato del archivo de respaldo
│
├── database/       Acceso a datos e infraestructura
│   ├── queries/      Una consulta por entidad
│   ├── connection.js   Conexión, exportación e importación
│   ├── migrationRunner.js  Migraciones versionadas
│   └── migrations.js       El esquema, única fuente válida
│
├── router/         Rutas y guardias de autenticación
└── assets/css/     CSS vanilla con variables de diseño
```

Junto a cada carpeta viven sus pruebas en `__tests__/`.

- 📁 **`android/`**: proyecto nativo generado por Capacitor. `app/build.gradle` contiene el versionado derivado de `package.json`, la firma de release y la guardia que impide compilar un APK con código viejo.
- 📁 **`docs/`**: especificaciones, diagramas y matriz de trazabilidad.

---

## 📚 Mapa Documental

| Documento | Qué contiene |
| --- | --- |
| [`docs/TRAZABILIDAD.md`](docs/TRAZABILIDAD.md) | **Empieza por aquí.** Cada requisito, su estado real y el archivo que lo implementa. Incluye los defectos abiertos |
| [`docs/DIAGRAMAS.md`](docs/DIAGRAMAS.md) | Nueve diagramas Mermaid regenerados desde el código: arquitectura, entidad-relación, casos de uso, flujo de negocio, navegación, estados, sesión, respaldo y arranque |
| [`FICHA_TECNICA.md`](FICHA_TECNICA.md) | Resumen técnico: stack, esquema, plugins, seguridad y despliegue |
| [`MANUAL_USUARIO.md`](MANUAL_USUARIO.md) | Guía operativa para el taller |
| [`docs/Costura.md`](docs/Costura.md) | Especificación original de Fase 1. Documento histórico, no se edita |
| [`docs/MEJORAS_ADICIONALES_FASE1.md`](docs/MEJORAS_ADICIONALES_FASE1.md) | Valor añadido sobre la especificación original |
| [`docs/COSTURA_FASE2_REQUISITOS.md`](docs/COSTURA_FASE2_REQUISITOS.md) | Alcance de la siguiente etapa |

---

## 🚀 Guía de Clonado e Instalación desde GitHub

Cualquier desarrollador o usuario puede descargar este proyecto desde GitHub, compilarlo y ejecutarlo localmente en minutos siguiendo estos pasos:

### 1. Prerequisitos de Software
Asegúrate de tener instalado en tu sistema:
- **Git**: Para clonar el repositorio.
- **Node.js (v18 o superior)**: Entorno de ejecución de Javascript.
- **Android Studio (Opcional)**: Requerido solo si deseas compilar y generar el instalador móvil (`.APK` o `.AAB`).

### 2. Clonar el Proyecto desde GitHub
Abre tu terminal y descarga el código fuente directamente desde el repositorio oficial:
```bash
git clone https://github.com/Aryannext/Costura-app.git
cd Costura-app
```

### 3. Instalar las Dependencias del Proyecto
Descarga las librerías e integraciones nativas declaradas en el proyecto:
```bash
npm install
```

### 4. Probar la Aplicación en Modo Desarrollo (Local)
Para levantar un servidor de pruebas en vivo con recarga instantánea en el navegador de tu PC:
```bash
npm run dev
```
*(Se abrirá el servidor local en una dirección como `http://localhost:5173`).*
> **Nota:** En el navegador web de PC, las funciones nativas (Huella biométrica, notificaciones locales PUSH) operan bajo **Degradación Elegante**, ocultándose o simulando su respuesta silenciosamente para evitar errores en entornos sin hardware móvil.

### 5. Compilar para Producción y Generar APK Nativo (Android)

Un solo comando empaqueta el frontend, lo copia al cascarón nativo y abre Android Studio:

```bash
npm run open:android
```

Dentro de Android Studio, espera a que finalice la sincronización de Gradle y selecciona **Build > Build Bundle / APK > Build APK(s)**, o presiona **Play (Run)** con tu dispositivo conectado.

Si sólo quieres actualizar el proyecto nativo sin abrir el IDE:

```bash
npm run sync:android
```

> **Nunca ejecutes `npx cap sync android` a secas.** Ese comando copia lo que haya en `dist/`, que puede ser un build viejo. Los scripts `sync:android` y `open:android` compilan primero y luego sincronizan, en ese orden.

**Guardia automática contra APKs con código viejo.** El build de Gradle incluye la tarea `verifyWebAssetsUpToDate`, que compara la fecha del bundle empaquetado en `android/app/src/main/assets/public` con la del código en `src/`. Si compilas desde Android Studio sin haber sincronizado, el build se detiene con un mensaje que indica qué archivo quedó fuera, en lugar de producir un instalable con código viejo. Para saltarla de forma deliberada: `-PskipWebAssetCheck`.

#### Versionado

La versión vive **únicamente en `package.json`**. `android/app/build.gradle` la lee y deriva el `versionCode` con la fórmula `mayor × 10000 + menor × 100 + parche`:

| `package.json` | `versionName` | `versionCode` |
| --- | --- | --- |
| `1.1.2` | `1.1.2` | `10102` |
| `1.2.0` | `1.2.0` | `10200` |
| `2.0.0` | `2.0.0` | `20000` |

Para publicar una actualización basta con subir la versión en `package.json`; Play Store exige que el `versionCode` sea siempre mayor que el de la subida anterior. Si necesitas recompilar una misma versión (por ejemplo, un reintento de subida), define `ANDROID_VERSION_CODE` en el entorno para sobreescribir el valor derivado.

#### Firma del release

Las credenciales del keystore se leen del entorno o de `gradle.properties` (nunca del repositorio). Sin ellas, `assembleRelease` produce un APK **sin firmar** y Gradle lo avisa en consola.

Variables de entorno, útiles en CI:

```bash
ANDROID_KEYSTORE_PATH=/ruta/al/costura.keystore
ANDROID_KEYSTORE_PASSWORD=...
ANDROID_KEY_ALIAS=costura
ANDROID_KEY_PASSWORD=...
```

Equivalente en `~/.gradle/gradle.properties` para trabajo local (fuera del repositorio, para que las claves no se versionen nunca):

```properties
costuraKeystorePath=/ruta/al/costura.keystore
costuraKeystorePassword=...
costuraKeyAlias=costura
costuraKeyPassword=...
```

#### Enlace de descarga del APK

La pantalla de login muestra un botón de descarga cuando la app corre en un navegador. Su URL se inyecta en el build mediante `VITE_APK_DOWNLOAD_URL` (ver `.env.example`) y debe apuntar al instalable del release vigente. Si la variable no está definida, el botón no se muestra: es preferible a ofrecer una versión antigua.

---

¡Disfruta de **Atelier Manager**! Un sistema construido con máxima disciplina arquitectónica, código limpio y amor por el detalle visual y táctil. 🧵✨
