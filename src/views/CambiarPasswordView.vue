<template>
  <div class="password-view">
    <div class="header-actions">
      <button v-if="!forzado" class="btn-ghost back-btn" @click="$router.back()">
        ← Volver
      </button>
      <h2 class="display-sm">Cambiar Contraseña</h2>
      <p class="subtitle">Esta es la clave con la que entras a la aplicación.</p>
    </div>

    <div v-if="forzado" class="card aviso">
      <h3 class="headline-sm">Primero, protege tu taller</h3>
      <p class="body-md">
        Sigues usando la contraseña que trae la aplicación de fábrica. Es la misma en
        todas las instalaciones, así que cualquiera que la conozca puede abrir los
        datos de tus clientes. Elige una nueva para continuar.
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="card password-form">
      <div class="form-group">
        <label for="actual">Contraseña actual</label>
        <input
          id="actual"
          type="password"
          v-model="actual"
          autocomplete="current-password"
          required
        />
      </div>

      <div class="form-group">
        <label for="nueva">Contraseña nueva</label>
        <input
          id="nueva"
          type="password"
          v-model="nueva"
          autocomplete="new-password"
          required
        />
        <small class="help-text">Mínimo {{ MIN_PASSWORD_LENGTH }} caracteres.</small>
      </div>

      <div class="form-group">
        <label for="confirmacion">Repite la contraseña nueva</label>
        <input
          id="confirmacion"
          type="password"
          v-model="confirmacion"
          autocomplete="new-password"
          required
        />
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="form-actions">
        <button
          type="button"
          class="btn-secondary"
          :disabled="loading"
          @click="forzado ? handleLogout() : $router.back()"
        >
          {{ forzado ? 'Cerrar sesión' : 'Cancelar' }}
        </button>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Guardando...' : 'Guardar contraseña' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { changePassword, logout, requiresPasswordChange, DEFAULT_PASSWORD } from '../services/auth.js';
import { validators, MIN_PASSWORD_LENGTH } from '../services/validators.js';

const router = useRouter();
const toast = inject('toast');

const actual = ref('');
const nueva = ref('');
const confirmacion = ref('');
const error = ref('');
const loading = ref(false);

// Se captura al entrar: al guardar, la obligación desaparece y la pantalla no
// debe cambiar de forma mientras se sale de ella.
const forzado = ref(requiresPasswordChange());

async function handleSubmit() {
  error.value = '';

  try {
    validators.validateCambioPassword(
      { actual: actual.value, nueva: nueva.value, confirmacion: confirmacion.value },
      { passwordPorDefecto: DEFAULT_PASSWORD }
    );
  } catch (e) {
    error.value = e.message;
    return;
  }

  loading.value = true;
  try {
    await changePassword(actual.value, nueva.value);
    if (toast) toast('Contraseña actualizada.', 'success');
    router.replace(forzado.value ? '/' : '/ajustes');
  } catch (e) {
    error.value = e.message || 'No se pudo cambiar la contraseña.';
  } finally {
    loading.value = false;
  }
}

async function handleLogout() {
  await logout();
}
</script>

<style scoped>
.password-view {
  padding: 16px;
  max-width: 520px;
  margin: 0 auto;
}

.header-actions {
  margin-bottom: 24px;
}
.header-actions h2 {
  color: var(--on-surface);
}
.back-btn {
  margin-bottom: 12px;
}
.subtitle {
  color: var(--on-surface-variant);
  margin-top: 4px;
}

.aviso {
  border-left: 4px solid var(--error);
  background-color: var(--error-container);
  margin-bottom: 16px;
}
.aviso h3 {
  color: var(--on-error-container);
  margin: 0 0 6px 0;
}
.aviso p {
  color: var(--on-error-container);
  margin: 0;
}

.password-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}
.help-text {
  display: block;
  margin-top: 4px;
  color: var(--on-surface-variant);
}

.error-message {
  color: var(--error);
  margin-bottom: 16px;
  font-size: 0.9em;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 4px;
}
</style>
