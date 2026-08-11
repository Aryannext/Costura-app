<template>
  <div class="telegram-view">
    <div class="header">
      <h2 class="display-sm">Telegram</h2>
      <p class="body-md">Integra alertas automáticas usando un Bot de Telegram.</p>
    </div>

    <div class="card telegram-config">
      <div class="info-banner">
        <p class="body-sm">
          <strong>Nota:</strong> Actualmente la app permite compartir mensajes predefinidos abriendo directamente tu aplicación de Telegram mediante enlaces (t.me). Si deseas enviar alertas automáticas en segundo plano a ti mismo (o a un grupo), debes crear un Bot en Telegram y configurar su token aquí.
        </p>
      </div>

      <div class="form-group">
        <label>Token del Bot</label>
        <input type="text" class="input-field" v-model="botToken" placeholder="Ej: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
        <small class="hint">Obtén este token desde @BotFather en Telegram.</small>
      </div>

      <div class="form-group">
        <label>ID del Chat (Admin)</label>
        <input type="text" class="input-field" v-model="chatId" placeholder="Ej: 123456789" />
        <small class="hint">El ID de tu chat para recibir notificaciones (usa @userinfobot para saber tu ID).</small>
      </div>

      <button class="btn-primary" @click="guardarConfiguracion" :disabled="loading">
        {{ loading ? 'Guardando...' : 'Guardar Configuración' }}
      </button>

      <div class="actions-grid">
        <button class="btn-secondary" @click="probarMensaje" :disabled="loading || !botToken || !chatId">
          Probar Mensaje
        </button>
        <button class="btn-secondary" @click="openBackupModal" :disabled="loading || !botToken || !chatId">
          Respaldar BD
        </button>
        <button class="btn-secondary" @click="triggerRestore" :disabled="loading" style="border-color: var(--primary); color: var(--primary);">
          Restaurar BD
        </button>
        <button class="btn-secondary" @click="generarReporte" :disabled="loading || !botToken || !chatId">
          Reporte Diario
        </button>
      </div>

      <!-- Hidden file input for DB restore -->
      <input type="file" ref="fileInput" accept=".json" style="display:none" @change="handleRestore" />
    </div>

    <!-- Crypto Modal -->
    <div v-if="showCryptoModal" class="modal-overlay">
      <div class="modal-content card">
        <h3>{{ cryptoModalMode === 'backup' ? 'Proteger Respaldo' : 'Restaurar Respaldo' }}</h3>

        <div v-if="cryptoModalMode === 'backup'" class="alert-warning" style="background: #ffebee; color: #c62828; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 14px;">
          ⚠️ <strong>Advertencia Crítica:</strong> Si olvidas esta contraseña será matemáticamente imposible recuperar los datos. No la guardamos en ningún lado.
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label>Contraseña Maestra</label>
          <input type="password" class="input-field" v-model="cryptoPassword" :disabled="isCryptoProcessing" placeholder="Ej. mi-secreto-seguro-123" />
        </div>

        <p v-if="isCryptoProcessing" class="hint" style="color: var(--primary); font-weight: bold; margin-bottom: 12px;">⏳ Procesando cifrado de alta seguridad...</p>
        <p v-if="cryptoError" class="hint" style="color: #c62828; font-weight: bold; margin-bottom: 12px;">{{ cryptoError }}</p>

        <div class="modal-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn-ghost" @click="closeCryptoModal" :disabled="isCryptoProcessing">Cancelar</button>
          <button class="btn-primary" @click="executeCryptoAction" :disabled="!cryptoPassword || isCryptoProcessing">
            {{ cryptoModalMode === 'backup' ? 'Cifrar y Enviar' : 'Descifrar e Importar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useTelegramBot } from '../composables/useTelegramBot.js';
import { exportDatabaseToJson, importDatabaseFromJson } from '../database/connection.js';
import { useOrdenes } from '../composables/useOrdenes.js';
import { cryptoService } from '../services/cryptoService.js';

const botToken = ref('');
const chatId = ref('');
const loading = ref(false);
const fileInput = ref(null);
const toast = inject('toast');
const { sendTelegramMessage, sendTelegramDocument } = useTelegramBot();
const { ordenes, fetchOrdenes } = useOrdenes();

// Crypto Modal State
const showCryptoModal = ref(false);
const cryptoModalMode = ref('backup');
const cryptoPassword = ref('');
const isCryptoProcessing = ref(false);
const cryptoError = ref('');
let fileToRestore = null;

onMounted(() => {
    botToken.value = localStorage.getItem('telegram_bot_token') || '';
    chatId.value = localStorage.getItem('telegram_chat_id') || '';
});

function guardarConfiguracion() {
    loading.value = true;
    setTimeout(() => {
        localStorage.setItem('telegram_bot_token', botToken.value);
        localStorage.setItem('telegram_chat_id', chatId.value);
        toast('Configuración guardada exitosamente.', 'success');
        loading.value = false;
    }, 500);
}

async function probarMensaje() {
    if (!botToken.value || !chatId.value) return;
    loading.value = true;
    try {
        const success = await sendTelegramMessage("¡Hola! La integración de tu bot de Costura App está funcionando correctamente. ✅");
        if (success) toast('Mensaje de prueba enviado a Telegram.', 'success');
        else toast('Error al enviar el mensaje.', 'error');
    } finally {
        loading.value = false;
    }
}

function openBackupModal() {
    cryptoModalMode.value = 'backup';
    cryptoPassword.value = '';
    cryptoError.value = '';
    showCryptoModal.value = true;
}

function closeCryptoModal() {
    showCryptoModal.value = false;
    cryptoPassword.value = '';
    cryptoError.value = '';
    fileToRestore = null;
}

async function executeCryptoAction() {
    cryptoError.value = '';
    isCryptoProcessing.value = true;

    try {
        if (cryptoModalMode.value === 'backup') {
            await respaldarBaseDatos(cryptoPassword.value);
        } else if (cryptoModalMode.value === 'restore') {
            await procesarRestauracion(cryptoPassword.value);
        }
        closeCryptoModal();
    } catch (err) {
        cryptoError.value = err.message;
    } finally {
        isCryptoProcessing.value = false;
        cryptoPassword.value = '';
    }
}

async function respaldarBaseDatos(password) {
    loading.value = true;
    toast('Cifrando respaldo...', 'info');
    try {
        const jsonContent = await exportDatabaseToJson();

        // Encrypt the JSON content
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
    } finally {
        loading.value = false;
    }
}

function triggerRestore() {
    fileInput.value.click();
}

function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    fileToRestore = file;
    cryptoModalMode.value = 'restore';
    cryptoPassword.value = '';
    cryptoError.value = '';
    showCryptoModal.value = true;

    event.target.value = null; // reset input
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
        reader.readAsText(fileToRestore);
    });
}

async function generarReporte() {
    loading.value = true;
    try {
        await fetchOrdenes();
        const activas = ordenes.value.filter(o => o.id_estado_orden < 4);
        const terminadas = ordenes.value.filter(o => o.id_estado_orden === 3);
        const atrasadas = activas.filter(o => new Date(o.fecha_entrega) < new Date());

        let reporte = `📊 *Reporte Diario - Costura App*\n\n`;
        reporte += `🔹 *Órdenes Activas:* ${activas.length}\n`;
        reporte += `✅ *Listas para Entregar:* ${terminadas.length}\n`;
        if (atrasadas.length > 0) {
            reporte += `⚠️ *Órdenes Atrasadas:* ${atrasadas.length}\n`;
        }

        const success = await sendTelegramMessage(reporte, 'Markdown');
        if (success) toast('Reporte diario enviado.', 'success');
        else toast('Error al enviar reporte.', 'error');
    } catch (e) {
        console.error("Reporte Error:", e);
        toast('Error al generar reporte.', 'error');
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.telegram-view {
  padding: 24px 16px 80px 16px;
}
.header {
  margin-bottom: 24px;
}
.header h2 {
  color: var(--on-surface);
  margin-bottom: 8px;
}
.header p {
  color: var(--on-surface-variant);
}

.telegram-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.info-banner {
  background-color: var(--info-color);
  color: var(--info-text);
  padding: 12px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
}
.hint {
  font-size: 12px;
  color: var(--on-surface-variant);
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: var(--surface);
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: var(--on-surface);
}
</style>
