# Manual técnico · Atelier Manager (Costura App)

Para quien tenga que instalar, compilar, probar o mantener la aplicación.

| | |
| --- | --- |
| **Versión de la app** | 1.2.0 (`package.json`) |
| **Versión del esquema** | 8 |
| **Identificador Android** | `com.costura.app` |
| **Tipo** | Aplicación móvil híbrida: web empaquetada como APK con Capacitor |
| **Plataforma** | Android 7.0 o superior (minSdk 24, targetSdk 36). iOS no está generado |
| **Modo de operación** | Offline-first, un solo dispositivo, sin servidor de datos |
| **Revisado contra el código** | 7 de octubre de 2026 |

Cómo está diseñada por dentro: [ARQUITECTURA.md](../02-diseno/ARQUITECTURA.md) y [MODELO_DE_DATOS.md](../02-diseno/MODELO_DE_DATOS.md).

---

## 1. Requisitos del entorno

| Herramienta | Versión | Para qué |
| --- | --- | --- |
| Git | cualquiera reciente | Clonar el repositorio |
| Node.js | 22.12 o superior (recomendado 24) | Vite 8 no corre en versiones anteriores |
| JDK | 21 (Temurin) | Gradle 8.14 no acepta JDK 17 ni 25 |
| Android SDK | plataforma 36 | Compilar el APK. Viene con Android Studio |
| Docker | opcional | Versión web en un VPS |

## 2. Estructura del proyecto

```
Costura-app/
├── src/
│   ├── views/            11 pantallas enrutadas
│   ├── components/       Componentes por módulo: clientes, ordenes, prendas, pagos, layout, common
│   ├── composables/      Lógica de la aplicación (useOrdenes, usePrendas, usePagos...)
│   ├── services/         Reglas y utilidades sin Vue (estadoOrden, validators, auth, whatsapp...)
│   ├── database/
│   │   ├── queries/        Una consulta por entidad
│   │   ├── connection.js   Conexión, exportar e importar
│   │   ├── migrationRunner.js
│   │   └── migrations.js   El esquema: la única fuente válida
│   ├── router/           Rutas y guardia de sesión
│   └── assets/css/       Estilos con variables de diseño
├── tests/e2e/            Pruebas de punta a punta con Playwright
├── android/              Proyecto nativo generado por Capacitor
├── docker/               Configuración de nginx
├── docs/                 Documentación (índice en docs/README.md)
├── Dockerfile, docker-compose.yml
└── .github/workflows/ci.yml
```

Junto a cada carpeta de `src/` viven sus pruebas en `__tests__/`.

## 3. Instalación y ejecución

```bash
git clone https://github.com/Aryannext/Costura-app.git
cd Costura-app
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Usuario `admin`; la clave de fábrica está en `src/database/queries/auth.js` y la app obliga a cambiarla en el primer ingreso. En el navegador, la huella y las notificaciones no están disponibles y la app lo indica sin fallar.

## 4. Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga |
| `npm run build` | Compila la app web en `dist/` |
| `npm run test:unit` | Pruebas unitarias con cobertura |
| `npx playwright test` | Pruebas de punta a punta (en Windows con Edge: `PW_CHANNEL=msedge`) |
| `npm run sync:android` | Compila y copia la app al proyecto Android |
| `npm run open:android` | Lo mismo y abre Android Studio |
| `docker compose up -d --build` | Versión web en el puerto 8080 |

## 5. Compilar el APK

```bash
npm run sync:android
cd android
./gradlew assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/`. Para el de producción, `./gradlew assembleRelease` con la firma configurada (abajo).

- **Nunca uses `npx cap sync android` solo:** copia lo que haya en `dist/`, que puede ser viejo. `sync:android` compila primero.
- **Guardia de Gradle:** la tarea `verifyWebAssetsUpToDate` detiene la compilación si el código web empaquetado es más viejo que `src/`.
- **Versión:** sale de `package.json`. El `versionCode` es `mayor × 10000 + menor × 100 + parche` (1.1.2 → 10102).
- **Firma:** las claves del keystore se leen de variables de entorno (`ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) o de `~/.gradle/gradle.properties`, nunca del repositorio.
- **Permisos:** `INTERNET`, `USE_BIOMETRIC`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`. El tráfico sin cifrar está desactivado (`usesCleartextTraffic="false"`).
- **Dependencias bloqueadas:** las versiones exactas de las librerías de Android están en `android/gradle.lockfile`, `android/app/gradle.lockfile` y `android/buildscript-gradle.lockfile`. Si se actualiza Capacitor o un plugin, se regeneran desde `android/` con `./gradlew buildEnvironment dependencies :app:dependencies --write-locks`.

## 6. Actualizar la app en el teléfono (gratis)

Una versión nueva se instala con un **APK nuevo encima del anterior**. Android lo reemplaza y **conserva los datos**: la base, las fotos y la configuración. No se necesita ningún servicio de pago ni la Play Store.

1. Subir la versión en `package.json`; tiene que ser mayor que la instalada: `npm version 1.2.1 --no-git-tag-version`.
2. Compilar el APK (sección 5).
3. Antes de instalar, en el teléfono: *Ajustes → Guardar copia de seguridad*.
4. Pasar el APK al teléfono por WhatsApp, Drive o cable, abrirlo y tocar *Actualizar*.

**Condiciones para que Android lo acepte encima del anterior:**
- **La misma firma.** Los APK de prueba se firman con la clave de depuración de este computador (`~/.android/debug.keystore`). Un APK compilado en otro computador tiene otra firma: Android pide desinstalar primero, y eso **borra los datos** (por eso el paso 3). Para la versión final se usa la clave de release de la sección 5.
- **Un `versionCode` mayor**, que se calcula solo desde `package.json`.

**Si la versión trae una migración de la base** (la 1.2.0 trae la 8), no se puede volver a un APK anterior: la versión vieja no entiende el esquema nuevo y se niega a abrir. Si algo sale mal, se corrige y se instala una versión más nueva. Por eso, antes de instalar en el teléfono de la dueña, se prueba en el emulador.

## 7. Base de datos

- **Motor:** SQLite con `@capacitor-community/sqlite` en el teléfono, y `jeep-sqlite` sobre IndexedDB en el navegador. Base `costura_db`.
- **Integridad:** `PRAGMA foreign_keys = ON`. Las escrituras de varias tablas van en una transacción.
- **Tablas y migraciones:** [MODELO_DE_DATOS.md](../02-diseno/MODELO_DE_DATOS.md).

**Agregar una migración.** Se añade una entrada al final del arreglo de `src/database/migrations.js`. **Nunca se modifica una migración ya publicada**: los teléfonos que la aplicaron no la vuelven a correr.

```js
{
  toVersion: 9,
  statements: [
    `ALTER TABLE cliente ADD COLUMN correo TEXT;`
  ]
}
```

Después hay que actualizar el diagrama en `MODELO_DE_DATOS.md`; la prueba de documentación falla mientras no coincidan.

## 8. Plugins nativos

| Plugin | Uso |
| --- | --- |
| `@capacitor-community/sqlite` | Base de datos local |
| `@capacitor/camera` | Fotos de prendas: JPEG calidad 60, ancho 1080 |
| `@capacitor/filesystem` | Fotos en `Directory.Data`; copia de seguridad en la caché |
| `@aparajita/capacitor-biometric-auth` | Entrar y desbloquear con huella |
| `@capacitor/local-notifications` | Aviso de las 8:00 |
| `@capacitor/preferences` | Sesión |
| `@capacitor/app` | Ciclo de vida, para el bloqueo al volver |
| `@capacitor/share` | Compartir recibos, el aviso de privacidad y la copia de seguridad |
| `@capacitor/haptics` | Vibración al tocar |
| `@capacitor/status-bar`, `@capacitor/splash-screen` | Barra de estado y pantalla de inicio |

## 9. Integraciones externas

| Servicio | Cómo se usa | Configuración |
| --- | --- | --- |
| WhatsApp | Enlaces `wa.me` con el número en +57 y el mensaje escrito. No hay API: enviar es una acción de la modista | Ninguna |
| Telegram (opcional) | `fetch` a `api.telegram.org` para enviarle a la modista recordatorios, recibos, el reporte diario y copias de seguridad | Token del bot y chat id en *Ajustes → Telegram*. Se guardan en la tabla `configuracion`, así entran en la copia de seguridad |

## 10. Seguridad

| Aspecto | Implementación |
| --- | --- |
| Contraseña | bcrypt con 10 rondas. La clave de fábrica obliga a cambiarla antes de entrar a cualquier pantalla |
| Sesión | En Preferences. Al arrancar en frío se entra bloqueado |
| Segundo plano | Bloqueo al salir; desbloqueo solo si vuelve antes de 2 minutos; después, huella o contraseña |
| Inactividad | Cierre de sesión a los 15 minutos |
| Copia de seguridad | AES-256-GCM; clave derivada con PBKDF2-SHA256 y 600 000 iteraciones. El cifrado es de la app, no de Telegram |
| Datos en reposo | La base no está cifrada como archivo; la protege el aislamiento de Android |
| Datos personales | Aviso de privacidad (versión 2), autorización con fecha y versión, y borrado a pedido. Salen del teléfono solo los avisos de WhatsApp, lo que la modista se manda a su Telegram, el recibo que comparte y la copia cifrada (D-08) |

## 11. Copia de seguridad

- **Formato 2:** la base completa (con la configuración) y las fotos en base64, mientras no pasen de 20 MB; si pasan, la copia sale sin fotos y la app lo dice. Las copias del formato 1, sin fotos, se siguen pudiendo restaurar.
- **Destinos:** archivo por el menú Compartir (desde Ajustes, sin Telegram) o el bot de Telegram.
- **Restauración:** primero las fotos, después una instantánea de la base, se cierra la conexión y se importa. Si la importación falla, se vuelve a la instantánea. Al final la app se recarga.

## 12. Versión web con Docker

```bash
docker compose up -d --build
```

- Construcción en dos etapas: Node 24 compila y nginx sin privilegios (usuario 101, puerto 8080) sirve.
- **No es un servidor de datos:** cada navegador guarda su propia base (D-13).
- Detrás de un proxy con dominio y HTTPS, se apunta al puerto 8080.
- **En una subruta** (por ejemplo `proyectosena.online/costura-app/`) se construye con `--build-arg BASE_PATH=/costura-app/`, y el proxy reenvía `/costura-app/` a la raíz del contenedor. La app arma sus enlaces, sus rutas y la ubicación de `sql-wasm.wasm` con esa base, así que una recarga en una ruta interna sigue funcionando.
- Para el botón de descarga del APK en el login, se define `VITE_APK_DOWNLOAD_URL` al construir.

## 13. Calidad e integración continua

- **Pruebas unitarias:** Vitest y Vue Test Utils. Las de saldo, estados, pagos, prendas y migraciones corren contra **SQLite real** (sql.js), no contra simulaciones. Las 40 reglas de negocio están en `src/__tests__/reglasNegocio.spec.js`, y una prueba falla si alguna regla del SRS queda sin probar.
- **Prueba de documentación:** `src/__tests__/documentacion.spec.js` falla si los documentos de diseño dejan de coincidir con el código (tablas, rutas, módulos y métodos del diagrama de clases), o si un enlace entre documentos está roto.
- **Pruebas de punta a punta:** 3 recorridos con Playwright en `tests/e2e/`. Se corren a mano; la CI no los ejecuta.
- **GitHub Actions** en cada cambio: `npm ci`, pruebas con cobertura, compilación y la imagen Docker probada con `curl`.
- **SonarCloud** revisa confiabilidad y seguridad en cada pull request.
- **Trinquete de cobertura:** la CI falla si la cobertura baja. Mínimos en `vitest.config.js`, medidos el 8 de octubre de 2026 sobre `database/`, `composables/` y `services/`:

  | Medida | Cobertura |
  | --- | --- |
  | Líneas | 66.2 % |
  | Funciones | 64.8 % |
  | Sentencias | 62.9 % |
  | Ramas | 60.0 % |

  Las vistas y componentes se prueban aparte, con Vue Test Utils y Playwright.
- **Por qué SonarCloud no muestra la cobertura:** el proyecto usa el análisis automático de SonarCloud, que no lee informes de cobertura. Para verla allí habría que pasar al análisis desde GitHub Actions con un `SONAR_TOKEN`.

## 14. Rendimiento

Sin red en las operaciones del día a día, la velocidad la marca el teléfono. Hay ocho índices sobre claves foráneas y campos de búsqueda, y el detalle de una orden carga notas y fotos de todas sus prendas en dos consultas.

**Pendiente:** medir en el teléfono de la dueña los tiempos de RNF-01 a RNF-03 con 500 órdenes.

## 15. Problemas conocidos

| Problema | Efecto | Estado |
| --- | --- | --- |
| Errores solo en consola (RNF-19) | No hay archivo de errores para diagnosticar en el taller | Pendiente |
| `main.spec.js` se pasa del tiempo en computadores lentos | Falla localmente con la batería completa; en GitHub pasa | Solo afecta el entorno local |
