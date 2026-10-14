# Vitrina de Modistas

Página pública donde las modistas que usan la app publican las prendas que hicieron para vender, y donde los clientes encuentran talleres para arreglar su ropa. Por qué existe y qué datos guarda: [D-15](../docs/05-gestion/DECISIONES.md).

- **Clientes:** abren `https://proyectosena.online/vitrina/`, ven prendas y talleres, y escriben por WhatsApp.
- **Modistas:** desde la app, en *Ajustes → Mi vitrina*.
- **Administración:** aprueba o suspende talleres con la clave `VITRINA_CLAVE_ADMIN`.

Es Node 22.13 o superior sin dependencias de npm (`node:http`, `node:sqlite`, `node:crypto`). La base SQLite y las fotos quedan en la carpeta `VITRINA_DATOS`.

## Probarla en el computador

```bash
cd vitrina
VITRINA_DATOS=./datos-locales PUERTO=8081 VITRINA_CLAVE_ADMIN=una-clave-larga-de-al-menos-24 npm start
# http://localhost:8081
```

Para que la app hable con esa vitrina y no con la publicada, compílala con `VITE_VITRINA_URL=http://localhost:8081`.

Las pruebas corren con las del resto del proyecto: `npm run test:unit` en la raíz.

## Desplegar en el VPS

1. En Dokploy, en el servicio que usa `docker/compose.vps.yml`, agrega la variable `VITRINA_CLAVE_ADMIN` con una clave aleatoria de al menos 24 caracteres (por ejemplo, la salida de `openssl rand -base64 30`). Sin ella la vitrina funciona, pero nadie puede aprobar talleres.
2. Vuelve a desplegar. Se levanta el contenedor `vitrina` en `127.0.0.1:3015`, con el volumen `vitrina-datos`.
3. Copia el bloque `/vitrina/` de `docker/nginx-vps.conf` al nginx del portafolio y recarga nginx. Lleva `client_max_body_size 5m` porque las fotos viajan dentro de la petición.

**Copia de seguridad del servidor:** todo está en el volumen `vitrina-datos` (`vitrina.sqlite` y la carpeta `fotos/`).

## Aprobar talleres

Un taller nuevo queda **pendiente** y no se muestra. Con la clave de administración:

```bash
CLAVE='la clave de VITRINA_CLAVE_ADMIN'
URL=https://proyectosena.online/vitrina

# Ver los pendientes (nombre, barrio, WhatsApp, fecha en que aceptó las condiciones)
curl -s -H "Authorization: Bearer $CLAVE" "$URL/api/admin/modistas?estado=pendiente"

# Aprobar (o "suspendida" para ocultarlo, o "pendiente" para volver atrás)
curl -s -X POST -H "Authorization: Bearer $CLAVE" -H 'Content-Type: application/json' \
     -d '{"estado":"aprobada"}' "$URL/api/admin/modistas/ID/estado"
```

Antes de aprobar, conviene escribirle a ese WhatsApp para confirmar que el taller existe.

## Si una modista pierde el teléfono

Si restaura la copia de seguridad, la vitrina vuelve sola (el código viaja en la copia). Si no la tiene, genera un código nuevo; el anterior deja de servir:

```bash
curl -s -X POST -H "Authorization: Bearer $CLAVE" "$URL/api/admin/modistas/ID/token"
```

Pásale el código por WhatsApp y que lo escriba en *Mi vitrina → ¿Ya tienes una vitrina?*.

## API

| Ruta | Quién | Para qué |
| --- | --- | --- |
| `GET /api/prendas?ciudad=&categoria=&q=&modista=` | Cualquiera | Prendas a la venta de talleres aprobados |
| `GET /api/modistas?ciudad=&q=` | Cualquiera | Talleres aprobados y las ciudades con talleres |
| `POST /api/modistas` | Cualquiera (5 por hora por conexión) | Crear una vitrina; devuelve su código una sola vez |
| `GET / PUT / DELETE /api/mi-vitrina` | Modista | Ver, editar o borrar su vitrina completa |
| `POST /api/mi-vitrina/prendas` | Modista | Publicar una prenda con su foto JPEG en base64 |
| `PATCH / DELETE /api/mi-vitrina/prendas/:id` | Modista | Cambiar precio o vendida, o quitarla |
| `GET /api/admin/modistas?estado=` | Administración | Listar talleres |
| `POST /api/admin/modistas/:id/estado` | Administración | Aprobar, suspender o volver a pendiente |
| `POST /api/admin/modistas/:id/token` | Administración | Código nuevo para un teléfono perdido |
