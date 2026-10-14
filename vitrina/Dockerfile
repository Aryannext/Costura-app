# Vitrina de Modistas (D-15): página pública + API donde las modistas publican
# las prendas que hicieron para vender. Sin dependencias de npm: solo Node.
#
# Construir:  docker build -t costura-vitrina vitrina
# Ejecutar:   docker run --rm -p 8081:8080 -v vitrina-datos:/datos costura-vitrina
#             -> http://localhost:8081
FROM node:24-alpine

WORKDIR /app
COPY server.js ./
COPY src ./src
COPY public ./public
COPY package.json ./

# La base y las fotos viven en un volumen; el usuario "node" no es root
RUN mkdir -p /datos && chown node:node /datos
VOLUME /datos
ENV VITRINA_DATOS=/datos PUERTO=8080

USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
