# Encabezados de seguridad. Se incluyen en cada location porque en nginx un
# add_header dentro de un location anula los que se pusieron en el server.
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "DENY" always;

# Qué puede cargar la página (DEF-03). Solo la versión web pasa por aquí; el APK no.
# - script-src: solo los archivos de la app. 'wasm-unsafe-eval' deja compilar el
#   WebAssembly de SQLite (sql.js); no permite eval de JavaScript.
# - style-src 'unsafe-inline': Vue y driver.js ponen estilos en atributos style.
# - Google Fonts: la hoja de estilos y las fuentes (H30).
# - img-src data: blob:: las fotos de las prendas en el navegador.
# - connect-src: Telegram es el único servicio externo al que la app le habla.
#   WhatsApp (wa.me) se abre como navegación y la CSP no lo limita.
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.telegram.org; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;

# Funciones del navegador: solo la cámara, para las fotos de las prendas
add_header Permissions-Policy "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" always;
