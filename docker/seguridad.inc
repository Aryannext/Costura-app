# Encabezados de seguridad. Se incluyen en cada location porque en nginx un
# add_header dentro de un location anula los que se pusieron en el server.
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "DENY" always;
