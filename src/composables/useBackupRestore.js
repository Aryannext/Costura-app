import { ref } from 'vue';
import { exportDatabaseToJson, importDatabaseFromJson } from '../database/connection.js';
import { cryptoService } from '../services/cryptoService.js';
import { useTelegramBot } from './useTelegramBot.js';

export function useBackupRestore(toast) {
    const { sendTelegramDocument } = useTelegramBot();
    
    const showCryptoModal = ref(false);
    const cryptoModalMode = ref('backup');
    const isCryptoProcessing = ref(false);
    const cryptoError = ref('');
    let fileToRestore = null;

    const fileInput = ref(null);

    function openBackupModal() {
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
            }
            closeCryptoModal();
        } catch (err) {
            cryptoError.value = err.message;
        } finally {
            isCryptoProcessing.value = false;
        }
    }

    async function respaldarBaseDatos(password) {
        toast('Cifrando respaldo...', 'info');
        try {
            const jsonContent = await exportDatabaseToJson();
            const encryptedBlobString = await cryptoService.encryptBackup(jsonContent, password);
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `costura_backup_secure_${dateStr}.json`;

            const success = await sendTelegramDocument(encryptedBlobString, filename, "📦 Copia de seguridad CIFRADA de la base de datos.\nPara restaurarla usa el botón 'Restaurar BD' e ingresa tu contraseña maestra.");

            if (success) {
                toast('Respaldo seguro enviado por Telegram.', 'success');
            } else {
                throw new Error('Error al enviar el respaldo cifrado por Telegram.');
            }
        } catch (e) {
            console.error("Backup error:", e);
            throw new Error('Error de conexión o fallo al enviar el respaldo.');
        }
    }

    async function procesarRestauracion(password) {
        if (!fileToRestore) return;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const encryptedContent = e.target.result;
                    const decryptedJson = await cryptoService.decryptBackup(encryptedContent, password);

                    toast('Descifrado exitoso, importando BD...', 'info');
                    await importDatabaseFromJson(decryptedJson);

                    toast('¡Base de datos restaurada con éxito! Reiniciando app...', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                    resolve();
                } catch (err) {
                    console.error("Restore error:", err);
                    reject(new Error(err.message === 'Contraseña incorrecta o archivo corrupto.' ? err.message : 'Error al procesar el archivo JSON cifrado.'));
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo.'));
            reader.onabort = () => reject(new Error('Lectura de archivo cancelada.'));
            try {
                reader.readAsText(fileToRestore);
            } catch (err) {
                reject(new Error('Error al iniciar lectura del archivo.'));
            }
        });
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
