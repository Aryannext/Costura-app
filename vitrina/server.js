/**
 * Arranque de la Vitrina de Modistas. Configuración por variables de entorno:
 *
 *   PUERTO                 puerto donde escucha (8080)
 *   VITRINA_DATOS          carpeta con la base y las fotos (/datos). Va en un volumen.
 *   VITRINA_CLAVE_ADMIN    clave para aprobar talleres. Vacía = sin administración.
 *   VITRINA_CONFIAR_PROXY  "1" si delante hay un nginx que pone X-Forwarded-For
 */
import { createServer } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearVitrina } from './src/app.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const datos = process.env.VITRINA_DATOS || '/datos';
const claveAdmin = process.env.VITRINA_CLAVE_ADMIN || '';

if (claveAdmin && claveAdmin.length < 24) {
    console.error('VITRINA_CLAVE_ADMIN tiene que tener al menos 24 caracteres.');
    process.exit(1);
}

const vitrina = crearVitrina({
    archivoBd: join(datos, 'vitrina.sqlite'),
    carpetaFotos: join(datos, 'fotos'),
    carpetaPublica: join(aqui, 'public'),
    claveAdmin,
    confiarEnProxy: process.env.VITRINA_CONFIAR_PROXY === '1'
});

const servidor = createServer(vitrina.manejar);
servidor.requestTimeout = 60_000;
servidor.listen(Number(process.env.PUERTO || 8080), () => {
    console.log(`Vitrina escuchando en el puerto ${servidor.address().port}`);
});

for (const senal of ['SIGTERM', 'SIGINT']) {
    process.on(senal, () => servidor.close(() => {
        vitrina.cerrar();
        process.exit(0);
    }));
}
