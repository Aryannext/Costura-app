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
        <button class="btn-secondary" @click="respaldarBaseDatos" :disabled="loading || !botToken || !chatId">
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
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useTelegramBot } from '../composables/useTelegramBot.js';
import { exportDatabaseToJson, importDatabaseFromJson } from '../database/connection.js';
import { useOrdenes } from '../composables/useOrdenes.js';

const botToken = ref('');
const chatId = ref('');
const loading = ref(false);
const fileInput = ref(null);
const toast = inject('toast');
const { sendTelegramMessage, sendTelegramDocument } = useTelegramBot();
const { ordenes, fetchOrdenes } = useOrdenes();

onMounted(() => {
    // In a real app we would load this from the 'configuracion' table in the DB.
    // For now we will use localStorage as a fallback.
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

async function respaldarBaseDatos() {
    loading.value = true;
    try {
        toast('Generando respaldo...', 'info');
        const jsonContent = await exportDatabaseToJson();
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `costura_backup_${dateStr}.json`;
        
        const success = await sendTelegramDocument(jsonContent, filename, "📦 Aquí tienes tu copia de seguridad de la base de datos. Para restaurarla, descarga el archivo JSON y usa el botón 'Restaurar BD'.");
        
        if (success) {
            toast('Respaldo enviado por Telegram.', 'success');
        } else {
            toast('Error al enviar el respaldo.', 'error');
        }
    } catch (e) {
        console.error(e);
        toast('Error al generar respaldo.', 'error');
    } finally {
        loading.value = false;
    }
}

function triggerRestore() {
    if (confirm("⚠️ ADVERTENCIA: Restaurar una copia de seguridad sobrescribirá TODOS tus datos actuales. ¿Estás seguro de continuar?")) {
        fileInput.value.click();
    }
}

async function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    loading.value = true;
    try {
        toast('Leyendo archivo de respaldo...', 'info');
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                await importDatabaseFromJson(content);
                toast('¡Base de datos restaurada con éxito! Reiniciando app...', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (err) {
                console.error(err);
                toast('Error al procesar el archivo JSON. Verifica que sea válido.', 'error');
                loading.value = false;
            }
        };
        reader.readAsText(file);
    } catch (err) {
        toast('Error al leer el archivo.', 'error');
        loading.value = false;
    } finally {
        // Clear input to allow uploading the same file again if needed
        event.target.value = null;
    }
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
</style>
