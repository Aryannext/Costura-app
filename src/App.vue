<template>
  <div id="app-container">
    <AppHeader v-if="showLayout" />
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <AppNav v-if="showLayout" />
    <AppToast ref="toastRef" />
  </div>
</template>

<script setup>
import { computed, ref, provide, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './components/layout/AppHeader.vue';
import AppNav from './components/layout/AppNav.vue';
import AppToast from './components/layout/AppToast.vue';
import { App as CapacitorApp } from '@capacitor/app';
import { logout } from './services/auth.js';

const route = useRoute();
const toastRef = ref(null);
const transitionName = ref('slide-left');

const showLayout = computed(() => {
  return route.name !== 'Login';
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

// Force logout when app goes to background
CapacitorApp.addListener('appStateChange', ({ isActive }) => {
  if (!isActive) {
    logout();
  }
});
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
