<template>
  <dialog open class="lock-overlay" aria-modal="true" aria-label="Aplicación bloqueada">
    <div class="lock-content">
      <svg class="lock-glyph" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>

      <h1 class="lock-title">Taller bloqueado</h1>
      <p class="lock-subtitle">
        <template v-if="username">Sesión de <strong>{{ username }}</strong>. </template>
        Identifícate para seguir donde lo dejaste.
      </p>

      <form @submit.prevent="handleUnlock" class="lock-form">
        <label for="lock-password" class="sr-only">Contraseña</label>
        <input
          id="lock-password"
          type="password"
          v-model="password"
          placeholder="Contraseña"
          autocomplete="current-password"
          class="ios-input"
          required
        />

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="ios-button" :disabled="loading">
          {{ loading ? 'Comprobando...' : 'Desbloquear' }}
        </button>

        <button
          v-if="biometryAvailable"
          type="button"
          class="ios-button secondary-btn"
          :disabled="loading"
          @click="handleBiometric"
        >
          Usar huella / FaceID
        </button>

        <button type="button" class="lock-logout" :disabled="loading" @click="handleLogout">
          Cerrar sesión
        </button>
      </form>
    </div>
  </dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import {
  getCurrentUser,
  unlockWithPassword,
  unlockAfterBiometrics,
  logout
} from '../../services/auth.js';

const password = ref('');
const error = ref('');
const loading = ref(false);
const username = ref('');
const biometryAvailable = ref(false);

onMounted(async () => {
  const session = await getCurrentUser();
  username.value = session?.username || '';

  try {
    const info = await BiometricAuth.checkBiometry();
    biometryAvailable.value = !!info.isAvailable;
  } catch (e) {
    console.warn("Biometría no soportada en este entorno", e);
    return;
  }

  // Se ofrece el lector de una vez: es el camino rápido y el que la dueña
  // usará casi siempre. Si lo cancela, queda el campo de contraseña.
  if (biometryAvailable.value) {
    handleBiometric({ silencioso: true });
  }
});

async function handleBiometric({ silencioso = false } = {}) {
  error.value = '';
  loading.value = true;
  try {
    await BiometricAuth.authenticate({
      reason: 'Desbloquea Atelier Manager',
      cancelTitle: 'Usar contraseña'
    });
    unlockAfterBiometrics();
  } catch (err) {
    // Cancelar el lector no es un fallo: queda la contraseña como alternativa.
    console.warn('Huella no verificada', err);
    if (!silencioso) {
      error.value = 'No se pudo verificar la huella. Usa tu contraseña.';
    }
  } finally {
    loading.value = false;
  }
}

async function handleUnlock() {
  error.value = '';
  loading.value = true;
  try {
    await unlockWithPassword(password.value);
    password.value = '';
  } catch (err) {
    error.value = err.message || 'No se pudo desbloquear.';
  } finally {
    loading.value = false;
  }
}

async function handleLogout() {
  password.value = '';
  await logout();
}
</script>

<style scoped>
.lock-overlay {
  /* Es un <dialog>: se anulan el tamaño, el borde y el color que trae el navegador */
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  border: 0;
  color: inherit;
  /* Opaco a propósito: detrás sigue montada la vista con datos de clientes. */
  background-color: var(--background);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

.lock-content {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.lock-glyph {
  width: 48px;
  height: 48px;
  color: var(--primary);
  margin-bottom: 16px;
}

.lock-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--on-surface);
  letter-spacing: -0.02em;
  margin: 0 0 8px 0;
}

.lock-subtitle {
  font-size: 16px;
  color: var(--on-surface-variant);
  margin: 0 0 28px 0;
}

.lock-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ios-input {
  width: 100%;
  background-color: var(--surface-container);
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 16px;
  font-size: 17px;
  color: var(--on-surface);
  outline: none;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.ios-input:focus {
  background-color: var(--surface-container-lowest);
  border-color: var(--primary);
}

.ios-button {
  width: 100%;
  background-color: var(--primary);
  color: var(--on-primary);
  border: none;
  border-radius: 14px;
  padding: 16px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  min-height: 56px;
}
.secondary-btn {
  background-color: transparent;
  color: var(--primary);
  border: 1.5px solid var(--primary);
}
.ios-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.lock-logout {
  background: none;
  border: none;
  box-shadow: none;
  color: var(--error);
  font-size: 15px;
  padding: 12px;
  cursor: pointer;
  margin-top: 4px;
}

.error-message {
  color: var(--error);
  font-size: 14px;
}
</style>
