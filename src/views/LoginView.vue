<template>
  <div class="ios-login-container">
    <div class="login-content">
      <div class="header stagger-1">
        <h1 class="ios-title">Iniciar Sesión</h1>
        <p class="ios-subtitle">Bienvenido a Costura.app</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="ios-form">
        <div class="input-group stagger-2">
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="Usuario"
            required 
            autocomplete="username" 
            class="ios-input"
          />
        </div>
        
        <div class="input-group stagger-3">
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="Contraseña"
            required 
            autocomplete="current-password" 
            class="ios-input"
          />
        </div>
        
        <div v-if="error" class="error-message stagger-4">
          {{ error }}
        </div>
        
        <div class="actions-group stagger-4">
          <button type="submit" class="ios-button" :class="{ 'loading-btn': loading }" :disabled="loading">
            <span v-if="!loading">Entrar</span>
            <span v-else class="spinner"></span>
          </button>
          
          <button type="button" class="ios-button secondary-btn" @click="handleBiometricLogin" :disabled="loading">
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="display:inline; width:20px; margin-right:8px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg>
            Ingresar con Huella / FaceID
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { login, biometricLogin } from '../services/auth.js';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  loading.value = true;
  
  try {
    await login(username.value, password.value);
    router.push('/');
  } catch (err) {
    error.value = err.message || 'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
}

const biometryAvailable = ref(false);

onMounted(async () => {
  try {
    const info = await BiometricAuth.checkBiometry();
    if (info.isAvailable) {
      biometryAvailable.value = true;
    }
  } catch (e) {
    console.warn("Biometría no soportada en este entorno", e);
  }
});

async function handleBiometricLogin() {
  error.value = '';
  loading.value = true;
  try {
    const info = await BiometricAuth.checkBiometry();
    if (!info.isAvailable) {
      error.value = "Tu teléfono no tiene huella o no está configurada.";
      loading.value = false;
      return;
    }

    await BiometricAuth.authenticate({
      reason: 'Inicia sesión en Atelier Manager',
      cancelTitle: 'Cancelar'
    });
    
    // Si no tira error, autenticó exitosamente
    await biometricLogin();
    router.push('/');
  } catch (err) {
    console.error(err);
    if (err.message !== 'User cancelled') {
      error.value = 'Error del Lector: ' + err.message;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.ios-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  background-color: var(--background);
  padding: 24px;
}

.login-content {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.header {
  text-align: left;
  margin-bottom: 16px;
}

.ios-title {
  font-size: 34px;
  font-weight: 700;
  color: var(--on-surface);
  letter-spacing: -0.02em;
  margin: 0 0 8px 0;
}

.ios-subtitle {
  font-size: 17px;
  color: var(--on-surface-variant);
  margin: 0;
}

.ios-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  width: 100%;
}

.ios-input {
  width: 100%;
  background-color: #f2f2f7; /* Gris sutil de Apple */
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 16px 16px;
  font-size: 17px;
  color: var(--on-surface);
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  outline: none;
}

.ios-input::placeholder {
  color: #8e8e93; /* Gris placeholder Apple */
}

.ios-input:focus {
  background-color: #ffffff;
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(53, 37, 205, 0.1);
}

.actions-group {
  margin-top: 16px;
}

.ios-button {
  width: 100%;
  background-color: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  padding: 16px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.2s ease, opacity 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 56px;
}

.secondary-btn {
  background-color: transparent;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  margin-top: 12px;
}

.ios-button:active {
  transform: scale(0.96);
  opacity: 0.9;
}

.ios-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: var(--error-color);
  font-size: 14px;
  text-align: center;
  animation: shake 0.4s ease-in-out;
}

/* Spinner Animado */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

/* Animaciones de Entrada (Staggered) */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-1 { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.stagger-2 { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.1s; opacity: 0; }
.stagger-3 { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.15s; opacity: 0; }
.stagger-4 { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.2s; opacity: 0; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
}
</style>
