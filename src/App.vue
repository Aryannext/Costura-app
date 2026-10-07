<template>
  <!-- `inert` mientras está bloqueado: el overlay tapa la vista, pero sin esto
       el teclado todavía podía tabular hasta el buscador de clientes de detrás. -->
  <div id="app-container" :inert="isLocked">
    <AppHeader v-if="showLayout" />
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition :name="transitionName" mode="out-in">
          <!-- La clave por ruta vuelve a montar la vista al pasar de /ordenes/3 a /ordenes/2
               (p. ej. desde la campana): reutilizarla dejaba a la vista la orden anterior. -->
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </main>
    
    <AppNav v-if="showLayout" />
    <AppToast ref="toastRef" />
  </div>

  <!-- Fuera del contenedor inerte, para que sí se pueda usar. Cubre la app
       sin desmontar la vista: al desbloquear se sigue justo donde se estaba,
       con el formulario a medio llenar intacto. -->
  <AppLockScreen v-if="isLocked" />
</template>

<script setup>
import { computed, ref, provide, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './components/layout/AppHeader.vue';
import AppNav from './components/layout/AppNav.vue';
import AppToast from './components/layout/AppToast.vue';
import AppLockScreen from './components/layout/AppLockScreen.vue';
import { mustChangePassword, isLocked } from './services/auth.js';

const route = useRoute();
const toastRef = ref(null);
const transitionName = ref('slide-left');

const showLayout = computed(() => {
  if (route.name === 'Login') return false;
  // Durante el cambio obligatorio de contraseña se oculta la navegación: no hay
  // ningún otro sitio al que se pueda ir hasta que la clave deje de ser la de fábrica.
  if (route.name === 'CambiarPassword' && mustChangePassword.value) return false;
  return true;
});

watch(
  () => route,
  (to, from) => {
    const toIndex = to.meta.index || 0;
    const fromIndex = from.meta.index || 0;
    // Default to a fade if same level, or slide based on depth
    if (toIndex === fromIndex) {
      transitionName.value = 'fade';
    } else {
      transitionName.value = toIndex > fromIndex ? 'slide-left' : 'slide-right';
    }
  },
  { deep: true }
);

// Provide toast function globally
provide('toast', (msg, type) => {
  if (toastRef.value) {
    toastRef.value.show(msg, type);
  }
});

// Removed aggressive logout on appStateChange to prevent session loss on web reloads.
// The 15-minute inactivity timer in auth.js already handles security.
</script>

<style>
#app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-bottom: 60px; /* Space for AppNav */
  overflow-y: auto;
  position: relative;
  /* En pantallas anchas la app es una columna centrada, no pegada a la izquierda */
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

/* iOS Slide Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  position: absolute;
  width: 100%;
}

.slide-left-enter-from {
  transform: translateX(100%);
}
.slide-left-leave-to {
  transform: translateX(-30%);
  opacity: 0.5;
}

.slide-right-enter-from {
  transform: translateX(-100%);
}
.slide-right-leave-to {
  transform: translateX(30%);
  opacity: 0.5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
