# 🧵 Atelier Manager (Costura App)

¡Bienvenido al código fuente de **Atelier Manager**! 

Este proyecto nació con un propósito muy claro: **ayudar a organizar una sastrería/taller de costura de forma moderna, rápida y segura**. Tradicionalmente, los talleres llevan sus cuentas en cuadernos de papel que se pueden perder o dañar. Esta aplicación resuelve ese problema convirtiendo un teléfono móvil en un centro de mando profesional, sin necesidad de pagar servidores mensuales ni requerir conexión constante a internet.

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
- **Notificaciones PUSH Locales (Alarma Cron 8:00 AM):** Integrado con `@capacitor/local-notifications`. Programa alarmas automáticas dentro del reloj interno del celular que notifican a primera hora las prendas que deben entregarse en el día, funcionando 100% offline sin servidor ni internet.
- **Compartir Nativo (Share Sheet API):** Integrado con `@capacitor/share`. Al tocar "Compartir Recibo", abre el menú nativo del celular para compartir por WhatsApp, Correo, Bluetooth o Telegram.
- **Cámara y Almacenamiento Permanente:** Toma fotos de prendas y las guarda directamente en la memoria persistente del celular (`Directory.Data`), sobreviviendo a borrados de caché.
- **Seguridad Antisección en Memoria RAM:** Para evitar el secuestro de sesión por restauración de segundo plano de Android, la sesión se almacena de forma volátil en la memoria RAM del motor Javascript, destruyéndose al 100% cada vez que se cierra la aplicación.
- **El Vibrador (Haptics) y Barra de Estado:** Retroalimentación táctil al pulsar botones y coloreado nativo de la barra superior.
- **El Disco Duro Nativo (SQLite):** Bóveda relacional local (`@capacitor-community/sqlite`) optimizada con índices de alto rendimiento (`idx_orden_fecha_entrega`, etc.).

---

## 📂 ¿Cómo está organizado el código? (Estructura de Carpetas)

Si abres la carpeta del proyecto (`costura.app`), verás la siguiente estructura arquitectónica:

- 📁 **`android/`**: Proyecto nativo de Android Studio generado por Capacitor donde se compilan las librerías nativas y permisos (`AndroidManifest.xml`).
- 📁 **`docs/`**: **¡Bóveda de Documentación de Ingeniería!** Contiene todos los manuales, diagramas y especificaciones formales del sistema.
- 📁 **`src/`**: **Cerebro y código fuente de la aplicación Vue 3.**
  - 📂 **`assets/`**: Estilos modulares de Vanilla CSS, variables de diseño y recursos visuales.
  - 📂 **`components/`**: Arquitectura de micro-componentes modulares y reutilizables (`SkeletonLoader.vue`, `TabDetalle.vue`, `TabPrendas.vue`, `TabPagos.vue`).
  - 📂 **`composables/`**: Controladores de lógica de negocio reactiva (`useOrdenes.js`, `useNotificacionesLocales.js`, `useTelegramBot.js`).
  - 📂 **`database/`**: Conector de base de datos SQLite (`connection.js`), migraciones (`migrations.js`) y consultas organizadas por entidad (`queries/`).
  - 📂 **`views/`**: Vistas principales del sistema conectadas al enrutador Vue Router (`DashboardView.vue`, `LoginView.vue`, etc.).

---

## 📚 Mapa Documental de Ingeniería (`/docs`)

Para comprender a fondo las especificaciones técnicas y operativas del proyecto, consulta los documentos de la carpeta `/docs/`:

1. **`FICHA_TECNICA.md`**: Resumen ejecutivo de arquitectura, estándares de código, dependencias y protocolos de seguridad de la aplicación.
2. **`MANUAL_USUARIO.md`**: Guía operativa visual y paso a paso para modistas, administradores y personal de atención en el taller.
3. **`MEJORAS_ADICIONALES_FASE1.md`**: Documento de ingeniería formal con Requisitos Funcionales (RF), Requisitos No Funcionales (RNF) e Historias de Usuario de las integraciones nativas de hardware y optimizaciones.
4. **`DIAGRAMAS.md`**: Planos arquitectónicos en Mermaid (Entidad-Relación de SQLite, casos de uso, arquitectura de software y flujo de estados).
5. **`COSTURA_FASE2_REQUISITOS.md`**: Especificaciones y planificación de la próxima etapa evolutiva del sistema (Inventario de Bodega y Pruebas de Vestuario).

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
Cuando desees compilar la aplicación para instalarla en tu teléfono móvil físico:

1. **Empaquetar el frontend web:**
   ```bash
   npm run build
   ```
2. **Sincronizar el código y plugins con el cascarón nativo de Android:**
   ```bash
   npx cap sync android
   ```
3. **Abrir el proyecto en Android Studio:**
   ```bash
   npx cap open android
   ```
4. Dentro de Android Studio, espera a que finalice la sincronización de Gradle y selecciona **Build > Build Bundle / APK > Build APK(s)** o presiona el botón **Play (Run)** con tu dispositivo móvil conectado.

---

¡Disfruta de **Atelier Manager**! Un sistema construido con máxima disciplina arquitectónica, código limpio y amor por el detalle visual y táctil. 🧵✨
