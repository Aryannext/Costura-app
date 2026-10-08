# Versión web de Atelier Manager servida con nginx.
#
# Qué es y qué no es:
# - Sirve la MISMA app de Vue que va dentro del APK, para usarla desde un navegador:
#   demostración en la sustentación, pruebas y página para descargar el APK.
# - NO es un servidor de datos. La app sigue siendo offline-first: cada navegador
#   guarda su propia base SQLite en IndexedDB. Lo que se registre en la web no
#   aparece en el teléfono, ni al revés (ver docs/05-gestion/DECISIONES.md, D-06).
#
# Construir:  docker build -t costura-web .
# Ejecutar:   docker run --rm -p 8080:8080 costura-web   ->  http://localhost:8080
# En una subruta, por ejemplo proyectosena.online/costura-app/:
#             docker build --build-arg BASE_PATH=/costura-app/ -t costura-web .
#             y el proxy del VPS reenvía /costura-app/ a la raíz del contenedor.

# ---- Etapa 1: compilar ----
FROM node:24-alpine AS build
WORKDIR /app

# Primero solo las dependencias: Docker reutiliza esta capa mientras no cambie el lockfile.
# --ignore-scripts: ninguna dependencia de este proyecto necesita scripts de instalación
# (solo fsevents, que es de macOS), y así no se ejecuta código de terceros al instalar.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .

# Enlace opcional del botón "Descargar App (Android)" del login
ARG VITE_APK_DOWNLOAD_URL=""
ENV VITE_APK_DOWNLOAD_URL=$VITE_APK_DOWNLOAD_URL

# Ruta pública de la app: "/" en un dominio propio, "/costura-app/" en una subruta.
# Termina en "/". Vite la usa para los enlaces a /assets y Vue Router para las rutas.
ARG BASE_PATH=/

# vite.config.js usa base './' porque el APK lo necesita. En un servidor web eso
# rompe las rutas profundas: al recargar /ordenes/3 el navegador buscaría
# /ordenes/assets/... Aquí se compila con una base absoluta (BASE_PATH).
# Se usa el vite fijado en package-lock.json, no npx (que podría descargar otra versión).
RUN node node_modules/vite/bin/vite.js build --base=$BASE_PATH

# ---- Etapa 2: servir ----
# Imagen oficial de nginx que corre como usuario sin privilegios (uid 101), no como
# root. Por eso escucha en el 8080: un usuario normal no puede abrir el puerto 80.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Extensión .inc: nginx solo carga automáticamente los *.conf de conf.d
COPY docker/seguridad.inc /etc/nginx/conf.d/seguridad.inc
COPY --from=build /app/dist /usr/share/nginx/html

USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
