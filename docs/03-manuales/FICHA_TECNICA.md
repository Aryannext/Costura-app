# Ficha Técnica · Atelier Manager (Costura App)

| | |
| --- | --- |
| **Versión** | 1.1.2 |
| **Versión del esquema** | 5 |
| **Tipo** | Aplicación móvil híbrida (web empaquetada de forma nativa) |
| **Plataforma objetivo** | Android. El proyecto iOS no está generado |
| **Modo de operación** | Offline-first, un solo dispositivo |
| **Revisión de este documento** | 9 de septiembre de 2026, contra el código fuente |

---

## 1. Arquitectura

**Single Page Application** sobre una arquitectura **local descentralizada**: el motor de base de datos vive en el almacenamiento interno del dispositivo y no existe servidor. No hay sincronización entre dispositivos, y es una decisión de diseño, no una carencia pendiente.

El código se organiza en cuatro capas con dependencias en una sola dirección:

| Capa | Carpeta | Responsabilidad |
| --- | --- | --- |
| Presentación | `src/views/`, `src/components/` | Vue 3 con `<script setup>`. No ejecuta SQL |
| Lógica de negocio | `src/composables/` | Estado reactivo, reglas y orquestación |
| Acceso a datos | `src/database/queries/` | Una consulta por entidad |
| Infraestructura | `src/database/connection.js`, `migrationRunner.js` | Conexión, migraciones, exportación e importación |

Transversalmente, `src/services/` agrupa lo que no pertenece a ninguna capa: `auth`, `cryptoService`, `validators`, `photoStorage`, `fechas` y `backupPayload`.

El plano completo está en [`docs/02-diseno/DIAGRAMAS.md`](../02-diseno/DIAGRAMAS.md).

## 2. Stack

- **Vue.js 3** · Composition API con `<script setup>`
- **Vite 8** · empaquetado y servidor de desarrollo
- **Vue Router 4** · enrutamiento con guardias de autenticación
- **CSS3 vanilla** · variables globales, sin framework de estilos
- **Chart.js + vue-chartjs** · gráficas del módulo de reportes
- **bcryptjs** · hash de contraseñas
- **driver.js** · tutorial guiado
- **Vitest + Vue Test Utils** · 332 pruebas, incluidas las 40 reglas de negocio
- **sql.js** · SQLite real en las pruebas de saldo, estados, pagos, prendas y migraciones

## 3. Base de datos

- **Motor:** SQLite mediante `@capacitor-community/sqlite` v8
- **Nombre:** `costura_db`, sin cifrado a nivel de fichero
- **Integridad referencial:** `PRAGMA foreign_keys = ON`
- **Versionado:** tabla `schema_migrations`; ver [Migraciones del esquema](README.md#-migraciones-del-esquema)

**Diecisiete tablas.** Ocho de negocio, seis catálogos y tres de soporte:

| Grupo | Tablas |
| --- | --- |
| Negocio | `cliente`, `orden_trabajo`, `prenda`, `observacion`, `fotografia`, `pago`, `notificacion`, `historial_actividad` |
| Catálogos | `estado_orden`, `estado_prenda`, `tipo_prenda`, `metodo_pago`, `tipo_notificacion`, `tipo_actividad` |
| Soporte | `usuario`, `configuracion`, `schema_migrations` |

Ocho índices sobre claves foráneas y campos de búsqueda, incluido `idx_orden_fecha_entrega`.

> El fichero `docs/02-diseno/historico/script_mysql_original.sql` es un **esquema histórico** que ya no corresponde a la base real. La única fuente válida es `src/database/migrations.js`.

## 4. Plugins nativos (Capacitor 8)

| Plugin | Uso |
| --- | --- |
| `@capacitor-community/sqlite` | Base de datos local |
| `@capacitor/camera` | Fotografías de prendas · JPEG calidad 60, ancho 1080 |
| `@capacitor/filesystem` | Almacenamiento permanente en `Directory.Data` |
| `@aparajita/capacitor-biometric-auth` | Acceso y desbloqueo por huella o rostro |
| `@capacitor/local-notifications` | Recordatorio diario de entregas |
| `@capacitor/preferences` | Persistencia de la sesión |
| `@capacitor/app` | Ciclo de vida, para el bloqueo al reanudar |
| `@capacitor/share` | Compartir recibos por el menú nativo |
| `@capacitor/haptics` | Retroalimentación táctil |
| `@capacitor/status-bar`, `@capacitor/splash-screen` | Integración visual con el sistema |
| `@capgo/capacitor-updater` | Actualizaciones OTA |

## 5. Integraciones externas

**Bot de Telegram** · HTTP POST contra `api.telegram.org` mediante `fetch`. Es el único destino de los respaldos y el canal de los recibos y avisos que la modista se envía a sí misma.

El token y el chat id se guardan en la tabla `configuracion` de SQLite — **no en `localStorage`** — para que entren en el respaldo cifrado y sobrevivan a una limpieza de datos del WebView. Se guardan en claro dentro de la base local del dispositivo.

**WhatsApp** · no hay integración con su API. La aplicación construye enlaces `wa.me` con el mensaje precargado; enviarlo es una acción manual.

**Capgo** · actualizaciones OTA con `autoUpdate` activado.

## 6. Seguridad

| Aspecto | Implementación |
| --- | --- |
| Contraseñas | bcrypt con salt de 10 rondas |
| Clave de fábrica | `admin`/`admin123`, con **cambio obligatorio** antes de acceder a ninguna pantalla |
| Sesión | Persistida en `Preferences`; bloqueo al pasar a segundo plano y desbloqueo por huella o contraseña tras 2 minutos de ausencia |
| Inactividad | Cierre de sesión automático a los 15 minutos |
| Respaldos | AES-256-GCM con clave derivada por PBKDF2-SHA256 y 600 000 iteraciones. **El cifrado es propio, no el de Telegram** |
| Datos en reposo | La base SQLite no está cifrada a nivel de fichero; la protección efectiva es la del sandbox de Android |
| Privacidad | Los datos de clientes y las transacciones no salen del dispositivo, salvo el respaldo que la modista envía a su propio chat |

## 7. Despliegue

- **minSdk 24** (Android 7.0) · **targetSdk 36** · **compileSdk 36**
- **Permisos:** `INTERNET`, `USE_BIOMETRIC`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`
- **Versionado:** `versionName` y `versionCode` se derivan de `package.json`; el `versionCode` se calcula como `mayor × 10000 + menor × 100 + parche`
- **Firma:** las credenciales del keystore se leen del entorno o de `gradle.properties`, nunca del repositorio
- **Guardia de compilación:** la tarea Gradle `verifyWebAssetsUpToDate` detiene el build si el bundle web empaquetado es más viejo que el código, para que no salga un APK con código antiguo

El procedimiento completo está en el [README](README.md#5-compilar-para-producción-y-generar-apk-nativo-android).

## 8. Calidad

- **332 pruebas** con Vitest. Las 40 reglas de negocio de la especificación tienen su propio bloque en `src/__tests__/reglasNegocio.spec.js`, y una prueba falla si alguna regla del catálogo queda sin probar. Los incumplimientos conocidos se marcan con `it.fails` y están listados en `docs/04-calidad/TRAZABILIDAD.md` sobre la capa de datos, los composables y los servicios. Las de saldo, estados de la orden, anulación de pagos, eliminación de prendas y migraciones corren contra SQLite real, no contra mocks
- **GitHub Actions** en cada push y pull request: `npm ci`, `npm run test:unit` y `npm run build`
- **Trinquete de cobertura** fijado justo por debajo de la cobertura real: la CI falla si alguien la hace bajar

## 9. Rendimiento

Sin peticiones de red en las operaciones CRUD, la respuesta la marca el hardware local. Los índices mantienen las búsquedas en tiempo logarítmico al crecer el volumen.

Salvedad conocida: `getPrendasByOrden` realiza dos consultas adicionales por prenda (problema N+1). Con una orden de doce prendas son veinticinco viajes al puente nativo. Registrado como P1-8 en [`docs/04-calidad/TRAZABILIDAD.md`](../04-calidad/TRAZABILIDAD.md).
