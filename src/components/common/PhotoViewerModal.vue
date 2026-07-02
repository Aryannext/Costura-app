<template>
  <teleport to="body">
    <transition name="fade-scale">
      <div v-if="show" class="photo-viewer-overlay" @click.self="close">
        <div class="photo-viewer-header">
          <button class="close-btn" @click="close">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="photo-viewer-content" @click.self="close">
          <img :src="getImgSrc(photoUrl)" class="photo-img" />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { useHaptics } from '../../composables/useHaptics.js';
import { Capacitor } from '@capacitor/core';

const getImgSrc = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return Capacitor.convertFileSrc(path);
};

const props = defineProps({
  show: Boolean,
  photoUrl: String
});

const emit = defineEmits(['update:show']);
const { hapticSelection } = useHaptics();

function close() {
  hapticSelection();
  emit('update:show', false);
}
</script>

<style scoped>
.photo-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.photo-viewer-header {
  padding: env(safe-area-inset-top, 16px) 16px 16px 16px;
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.photo-viewer-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  overflow: hidden;
}

.photo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

/* Transitions */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
}

.fade-scale-enter-from .photo-img,
.fade-scale-leave-to .photo-img {
  transform: scale(0.9);
}
</style>
