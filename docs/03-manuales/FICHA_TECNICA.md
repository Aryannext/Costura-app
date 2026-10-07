# Ficha Técnica y Especificaciones Técnicas
**Nombre del Sistema:** Atelier Manager (Costura App)
**Versión:** 1.0.0
**Tipo de Aplicación:** Aplicación Móvil Híbrida (Web App empaquetada de forma nativa).
**Plataforma Objetivo:** Android e iOS (Ejecución offline).

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
- **Estructura Relacional:** 
  - `clientes` (Manejo de contactos y métricas de pedidos).
  - `ordenes` (Cabecera de pedidos con estados y finanzas).
  - `prendas` (Detalles de los artículos a reparar/confeccionar).
  - `fotografias_prenda` (Evidencia visual almacenada localmente).
  - `pagos` (Historial financiero).
  - `notificaciones` (Registro de interacciones con Telegram).

## 4. Integración Nativa (Capacitor)
El puente entre las tecnologías web y el hardware del teléfono se realiza a través de **Capacitor v8**. Los plugins nativos utilizados son:
- **`@capacitor/camera`**: Acceso al lente de la cámara y galería del dispositivo. Las imágenes se almacenan temporal/permanentemente en formato WebP/JPEG optimizado.
- **`@capacitor/haptics`**: Motor de vibración del teléfono para proveer retroalimentación táctil (micro-vibraciones) al realizar acciones (guardar, deslizar, eliminar).
- **`@capacitor/status-bar` y `splash-screen`**: Modificación de la barra superior del sistema operativo para igualar la paleta de colores de la aplicación, brindando una experiencia inmersiva.
- **`@capacitor/filesystem`**: Manejo de rutas de almacenamiento de fotografías.

## 5. Integraciones Externas (Cloud)
- **API de Telegram (Bot API):**
  - **Método de Conexión:** HTTP POST (API REST) vía Fetch.
  - **Uso:** Envíos unidireccionales (Notificaciones "push" locales).
  - **Seguridad:** El Token del Bot y el Chat ID se almacenan cifrados de manera local en `localStorage`.

## 6. Especificaciones de Despliegue
- **Android:** Requiere SDK Mínimo 22 (Android 5.1 Lollipop), Recomendado SDK 34 (Android 14).
- **Compilación:** Se utiliza Node.js para la construcción de los estáticos (`npm run build`), y Android Studio / Gradle para la firma y empaquetado del archivo final `.apk` o `.aab`.

## 7. Rendimiento y Seguridad
- **Cero Latencia:** Al no depender de solicitudes HTTPS a servidores externos para las operaciones CRUD, el tiempo de respuesta es casi instantáneo (< 50ms por transacción).
- **Privacidad:** Los datos de los clientes y transacciones monetarias no abandonan el dispositivo del administrador, asegurando total confidencialidad. Las copias de seguridad (Backups) hacia Telegram están cifradas bajo los protocolos de la plataforma de mensajería.
