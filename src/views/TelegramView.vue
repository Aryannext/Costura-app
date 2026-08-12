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
        <button class="btn-secondary" @click="handleGenerarReporte" :disabled="loading || !botToken || !chatId">
          Reporte Diario
        </button>
      </div>

      <!-- Hidden file input for DB restore -->
      <input type="file" ref="fileInput" accept=".json" style="display:none" @change="handleRestore" />
    </div>

    <CryptoModal 
      :show="showCryptoModal"
      :mode="cryptoModalMode"
      :isProcessing="isCryptoProcessing"
      :error="cryptoError"
      @close="closeCryptoModal"
      @confirm="executeCryptoAction"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject } from 'vue';
import { useTelegramBot } from '../composables/useTelegramBot.js';
import { useBackupRestore } from '../composables/useBackupRestore.js';
import { useTelegramReports } from '../composables/useTelegramReports.js';
import CryptoModal from '../components/telegram/CryptoModal.vue';

const botToken = ref('');
const chatId = ref('');
const loading = ref(false);
const toast = inject('toast');
const { sendTelegramMessage } = useTelegramBot();

const { 
  showCryptoModal, cryptoModalMode, isCryptoProcessing, cryptoError, 
  fileInput, openBackupModal, triggerRestore, handleRestore, 
  closeCryptoModal, executeCryptoAction 
} = useBackupRestore(toast, {
  onRestoreSuccess: () => {
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
});

const { generarReporte } = useTelegramReports(toast);

let saveTimeout = null;

onMounted(() => {
    botToken.value = localStorage.getItem('telegram_bot_token') || '';
    chatId.value = localStorage.getItem('telegram_chat_id') || '';
});

onUnmounted(() => {
    if (saveTimeout) clearTimeout(saveTimeout);
});

function guardarConfiguracion() {
    loading.value = true;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
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
        const success = await sendTelegramMessage(
            "¡Hola! La integración de tu bot de Costura App está funcionando correctamente. ✅", 
            'Markdown', 
            { botToken: botToken.value, chatId: chatId.value }
        );
        if (success) toast('Mensaje de prueba enviado a Telegram.', 'success');
        else toast('Error al enviar el mensaje.', 'error');
    } finally {
        loading.value = false;
    }
}

async function handleGenerarReporte() {
    loading.value = true;
    try {
        await generarReporte();
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
