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
# Ejecutar:   docker run --rm -p 8080:80 costura-web   ->  http://localhost:8080

# ---- Etapa 1: compilar ----
FROM node:24-alpine AS build
WORKDIR /app

# Primero solo las dependencias: Docker reutiliza esta capa mientras no cambie el lockfile
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Enlace opcional del botón "Descargar App (Android)" del login
ARG VITE_APK_DOWNLOAD_URL=""
ENV VITE_APK_DOWNLOAD_URL=$VITE_APK_DOWNLOAD_URL

# vite.config.js usa base './' porque el APK lo necesita. En un servidor web eso
# rompe las rutas profundas: al recargar /ordenes/3 el navegador buscaría
# /ordenes/assets/... Aquí se compila con base '/'.
RUN npx vite build --base=/

# ---- Etapa 2: servir ----
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Extensión .inc: nginx solo carga automáticamente los *.conf de conf.d
COPY docker/seguridad.inc /etc/nginx/conf.d/seguridad.inc
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
