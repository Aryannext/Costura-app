# Ficha Técnica y Especificaciones Técnicas
**Nombre del Sistema:** Atelier Manager (Costura App)
**Versión:** 1.1.2 (package.json) – esquema de base de datos v2
**Tipo de Aplicación:** Aplicación Móvil Híbrida (Web App empaquetada de forma nativa).
**Plataforma Objetivo:** Android (proyecto nativo incluido). iOS es posible con Capacitor pero **no se ha compilado ni probado**.

---

## 1. Arquitectura del Sistema
El sistema está construido bajo el patrón de **Single Page Application (SPA)**, lo que significa que la interfaz gráfica se carga una sola vez y la navegación ocurre sin recargar la pantalla.
No utiliza una arquitectura Cliente-Servidor tradicional web, sino una arquitectura **Descentralizada Local (Offline-First)**, donde el motor de base de datos reside directamente en el almacenamiento interno del dispositivo del usuario.

## 2. Stack Tecnológico (Frontend)
- **Framework Visual:** Vue.js 3 (Composition API / `<script setup>`).
- **Empaquetador de Módulos:** Vite (Garantiza tiempos de compilación ultrarrápidos y optimización de assets).
- **Estilos:** CSS3 Vanilla. Diseño responsivo con variables globales (Custom Properties) para soporte de temas y consistencia visual (Glassmorphism, animaciones fluidas).
- **Enrutamiento:** Vue Router (Manejo de historial y transiciones de pantalla).

## 3. Base de Datos y Almacenamiento
- **Motor de Base de Datos:** SQLite.
- **Implementación:** Plugin `@capacitor-community/sqlite` v8.x.
- **Fuente de verdad del esquema:** `src/database/migrations.js` (versionado en `configuracion.schema_version`).
- **Tablas principales:** `cliente`, `orden_trabajo`, `prenda`, `observacion`, `fotografia`, `pago`, `notificacion`, `historial_actividad`, `usuario`, `configuracion`.
- **Catálogos:** `estado_orden`, `estado_prenda`, `tipo_prenda`, `metodo_pago`, `tipo_notificacion`, `tipo_actividad`.
- **En navegador** (desarrollo y pruebas) se usa `jeep-sqlite` + `sql.js` (SQLite en WebAssembly guardado en IndexedDB).
- `docs/02-diseno/historico/script_mysql_original.sql` es el diseño inicial en MySQL y **no** lo usa la app.

## 4. Integración Nativa (Capacitor)
El puente entre las tecnologías web y el hardware del teléfono se realiza a través de **Capacitor v8**. Los plugins nativos utilizados son:
- **`@capacitor/camera`**: Acceso al lente de la cámara y galería del dispositivo. Las imágenes se almacenan temporal/permanentemente en formato WebP/JPEG optimizado.
- **`@capacitor/haptics`**: Motor de vibración del teléfono para proveer retroalimentación táctil (micro-vibraciones) al realizar acciones (guardar, deslizar, eliminar).
- **`@capacitor/status-bar` y `splash-screen`**: Modificación de la barra superior del sistema operativo para igualar la paleta de colores de la aplicación, brindando una experiencia inmersiva.
- **`@capacitor/filesystem`**: Manejo de rutas de almacenamiento de fotografías.

## 5. Integraciones Externas (Cloud)
- **WhatsApp (enlace `wa.me`):** abre WhatsApp con el mensaje escrito; no usa API ni servidor. La modista confirma cada envío.
- **API de Telegram (Bot API):**
  - **Método de Conexión:** HTTP POST (API REST) vía Fetch.
  - **Uso:** solo hacia el chat de la propia modista. Envía copias de seguridad, recibos, reporte diario y la lista de recordatorios.
  - **Seguridad:** el token del bot y el Chat ID se guardan **sin cifrar** en `localStorage` (pendiente P-04 en `docs/05-gestion/DECISIONES.md`).

## 6. Especificaciones de Despliegue
- **Android:** SDK mínimo 24 (Android 7.0); compileSdk y targetSdk 36.
- **Compilación:** Se utiliza Node.js 22.12 o superior (recomendado 24) para la construcción de los estáticos (`npm run build`), y Android Studio / Gradle para la firma y empaquetado del archivo final `.apk` o `.aab`.

## 7. Rendimiento y Seguridad
- **Cero Latencia:** Al no depender de solicitudes HTTPS a servidores externos para las operaciones CRUD, el tiempo de respuesta es casi instantáneo (< 50ms por transacción).
- **Privacidad:** los datos se guardan en el teléfono. Salen solo por acción de la modista:
  - los mensajes de WhatsApp que decide enviar (nombre del cliente, número de orden y saldo);
  - el recibo y el reporte que envía a su Telegram;
  - el respaldo, cifrado con **AES-GCM 256** y una clave derivada con **PBKDF2** a partir de una contraseña que ella elige.
- **Limitación del respaldo:** incluye las tablas, **no los archivos de fotos** (pendiente P-01).
- **Sesión:** vence tras 15 minutos sin actividad, también si la app se cierra y se vuelve a abrir.
- **Pruebas:** `npm run test:unit` usa Vitest con SQLite real en memoria para las reglas de negocio. `PW_CHANNEL=msedge npx playwright test` ejecuta el flujo completo en el navegador.
