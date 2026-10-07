import { ref } from 'vue';
import { exportDatabaseObject, importDatabaseFromJson } from '../database/connection.js';
import { getTodasLasFotografias } from '../database/queries/prendas.js';
import { cryptoService } from '../services/cryptoService.js';
import {
    readPhotoAsBase64,
    savePhotoFromBase64,
    photoSizeInBytes,
    nombreDeArchivo,
    PHOTO_BACKUP_LIMIT_BYTES
} from '../services/photoStorage.js';
import { construirPayload, leerPayload, enMegabytes } from '../services/backupPayload.js';
import { fechaLocalISO } from '../services/fechas.js';
import { useTelegramBot } from './useTelegramBot.js';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export function useBackupRestore(toast, callbacks = {}) {
    const { sendTelegramDocument } = useTelegramBot();

    const showCryptoModal = ref(false);
    const cryptoModalMode = ref('backup');
    const isCryptoProcessing = ref(false);
    const cryptoError = ref('');
    let fileToRestore = null;

    const fileInput = ref(null);
    // Destino del respaldo: 'telegram' (bot de la modista) o 'archivo' (se
    // comparte desde el teléfono: WhatsApp, Drive, correo...). RNF-17.
    let destino = 'telegram';

    function openBackupModal(destinoElegido = 'telegram') {
        destino = destinoElegido === 'archivo' ? 'archivo' : 'telegram';
        cryptoModalMode.value = 'backup';
        cryptoError.value = '';
        showCryptoModal.value = true;
    }

    function triggerRestore() {
        if (fileInput.value) {
            fileInput.value.click();
        }
    }

    function handleRestore(event) {
        const file = event.target.files[0];
        if (!file) {
            event.target.value = null;
            return;
        }

        fileToRestore = file;
        cryptoModalMode.value = 'restore';
        cryptoError.value = '';
        showCryptoModal.value = true;

        event.target.value = null;
    }

    function closeCryptoModal() {
        showCryptoModal.value = false;
        cryptoError.value = '';
        fileToRestore = null;
    }

    async function executeCryptoAction(password) {
        cryptoError.value = '';
        isCryptoProcessing.value = true;

        try {
            if (cryptoModalMode.value === 'backup') {
                await respaldarBaseDatos(password);
            } else if (cryptoModalMode.value === 'restore') {
                await procesarRestauracion(password);
                if (callbacks.onRestoreSuccess) {
                    callbacks.onRestoreSuccess();
                }
            }
            closeCryptoModal();
        } catch (err) {
            cryptoError.value = err.message;
        } finally {
            isCryptoProcessing.value = false;
        }
    }

    /**
     * Lee del disco todas las fotografías referenciadas por la base de datos.
     * Si en conjunto pesan más de lo que admite un documento de Telegram, se
     * devuelven vacías: es preferible un respaldo sin fotos que ningún respaldo,
     * porque los datos del taller pesan mucho más que las imágenes.
     */
    async function recolectarFotografias() {
        const filas = await getTodasLasFotografias();
        const rutas = [...new Set(filas.map(f => f.ruta_archivo).filter(Boolean))];

        if (rutas.length === 0) {
            return { fotografias: {}, incluidas: 0, total: 0, excedeLimite: false, bytes: 0 };
        }

        let bytes = 0;
        for (const ruta of rutas) {
            bytes += await photoSizeInBytes(ruta);
        }

        if (bytes > PHOTO_BACKUP_LIMIT_BYTES) {
            return { fotografias: {}, incluidas: 0, total: rutas.length, excedeLimite: true, bytes };
        }

        const fotografias = {};
        let incluidas = 0;
        for (const ruta of rutas) {
            try {
                const base64 = await readPhotoAsBase64(ruta);
                if (base64) {
                    fotografias[nombreDeArchivo(ruta)] = base64;
                    incluidas++;
                }
            } catch (e) {
                console.warn(`No se pudo leer la fotografía ${ruta}`, e);
            }
        }

        return { fotografias, incluidas, total: rutas.length, excedeLimite: false, bytes };
    }

    async function respaldarBaseDatos(password) {
        toast('Preparando respaldo...', 'info');

        const baseDatos = await exportDatabaseObject();
        const fotos = await recolectarFotografias();

        toast('Cifrando respaldo...', 'info');
        const cifrado = await cryptoService.encryptBackup(
            construirPayload(baseDatos, fotos.fotografias),
            password
        );

        const nombreArchivo = `costura_backup_secure_${fechaLocalISO()}.json`;

        if (destino === 'archivo') {
            await compartirArchivo(cifrado, nombreArchivo);
            toast(
                fotos.excedeLimite
                    ? 'Copia lista SIN fotografías (pesan demasiado). Guárdala donde elegiste.'
                    : 'Copia de seguridad lista. Guárdala donde elegiste.',
                fotos.excedeLimite ? 'info' : 'success'
            );
            return;
        }

        const resumenFotos = fotos.excedeLimite
            ? `⚠️ Las ${fotos.total} fotografías ocupan ${enMegabytes(fotos.bytes)} MB y no caben en el archivo: NO van incluidas. Los datos del taller sí están completos.`
            : `Incluye ${fotos.incluidas} de ${fotos.total} fotografías.`;

        const enviado = await sendTelegramDocument(
            cifrado,
            nombreArchivo,
            `📦 Copia de seguridad CIFRADA de la base de datos.\n${resumenFotos}\nPara restaurarla usa el botón 'Restaurar BD' e ingresa tu contraseña maestra.`
        );

        if (!enviado) {
            throw new Error('No se pudo enviar el respaldo por Telegram. Revisa tu conexión y la configuración del bot.');
        }

        toast(
            fotos.excedeLimite
                ? 'Respaldo enviado SIN fotografías (pesan demasiado).'
                : 'Respaldo seguro enviado por Telegram.',
            fotos.excedeLimite ? 'info' : 'success'
        );
    }

    /**
     * Respaldo sin Telegram: guarda el archivo cifrado en la caché del teléfono y
     * abre el menú Compartir de Android para que la modista lo envíe o lo guarde.
     * En el navegador lo descarga. El archivo sigue cifrado: sin la contraseña
     * maestra no sirve a quien lo encuentre.
     */
    async function compartirArchivo(contenido, nombreArchivo) {
        if (!Capacitor.isNativePlatform()) {
            const url = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }));
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = nombreArchivo;
            enlace.click();
            URL.revokeObjectURL(url);
            return;
        }

        const { uri } = await Filesystem.writeFile({
            path: nombreArchivo,
            data: contenido,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
        });
        try {
            await Share.share({
                title: 'Copia de seguridad del taller',
                text: 'Copia de seguridad cifrada de Atelier Manager. Para abrirla se necesita la contraseña maestra.',
                files: [uri],
                dialogTitle: 'Guardar o enviar la copia de seguridad'
            });
        } catch (e) {
            if (!/cancel/i.test(e?.message || '')) throw e;
            throw new Error('No se guardó la copia: cerraste el menú sin elegir dónde guardarla.');
        }
    }

    function leerArchivoComoTexto(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Error al leer el archivo.'));
            reader.onabort = () => reject(new Error('Lectura de archivo cancelada.'));
            try {
                reader.readAsText(file);
            } catch (err) {
                reject(new Error('Error al iniciar lectura del archivo.'));
            }
        });
    }

    async function restaurarFotografias(fotografias) {
        const nombres = Object.keys(fotografias);
        if (nombres.length === 0) return 0;

        toast(`Restaurando ${nombres.length} fotografías...`, 'info');

        let restauradas = 0;
        for (const nombre of nombres) {
            try {
                await savePhotoFromBase64(fotografias[nombre], nombre);
                restauradas++;
            } catch (e) {
                console.warn(`No se pudo restaurar la fotografía ${nombre}`, e);
            }
        }
        return restauradas;
    }

    async function procesarRestauracion(password) {
        if (!fileToRestore) return;

        const contenido = await leerArchivoComoTexto(fileToRestore);
        const descifrado = await cryptoService.decryptBackup(contenido, password);
        const { formato, baseDatosJson, fotografias } = leerPayload(descifrado);

        // Las fotografías primero: son archivos sueltos y no dependen de la base
        // de datos. La importación va la última porque deja la conexión cerrada
        // — cualquier consulta posterior fallaría — y obliga a recargar la app.
        const restauradas = await restaurarFotografias(fotografias);

        toast('Descifrado exitoso, importando BD...', 'info');
        await importDatabaseFromJson(baseDatosJson);

        // Las rutas heredadas se normalizan en el siguiente arranque, que llega
        // enseguida: quien invoca esta restauración recarga la aplicación.

        if (formato === 1) {
            toast('Base de datos restaurada. Este respaldo es de un formato antiguo y no incluía fotografías.', 'info');
        } else {
            toast(`¡Restaurado! ${restauradas} fotografías recuperadas. Reiniciando app...`, 'success');
        }
    }

    return {
        showCryptoModal,
        cryptoModalMode,
        isCryptoProcessing,
        cryptoError,
        fileInput,
        openBackupModal,
        triggerRestore,
        handleRestore,
        closeCryptoModal,
        executeCryptoAction
    };
}
