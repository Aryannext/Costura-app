<template>
  <div class="swipe-container" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <div class="swipe-actions right-actions">
      <button class="action-btn delete-btn" @click.stop="onDelete">
        Eliminar
      </button>
    </div>
    <div class="swipe-content" :style="{ transform: `translateX(${currentX}px)`, transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useHaptics } from '../../composables/useHaptics.js';

const emit = defineEmits(['delete']);
const { hapticImpactHeavy } = useHaptics();

const startX = ref(0);
const startY = ref(0);
const currentX = ref(0);
const isSwiping = ref(false);

const threshold = -80; // Distance to reveal delete button

function onTouchStart(e) {
  startX.value = e.touches[0].clientX;
  startY.value = e.touches[0].clientY;
  isSwiping.value = true;
}

function onTouchMove(e) {
  if (!isSwiping.value) return;
  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;
  
  // If moving vertically more than horizontally, cancel swipe (it's a scroll)
  if (Math.abs(y - startY.value) > Math.abs(x - startX.value)) {
    isSwiping.value = false;
    currentX.value = currentX.value < threshold / 2 ? threshold : 0;
    return;
  }
  
  const diff = x - startX.value;
  // Allow only swiping left
  if (diff < 0) {
    // Add friction if swiping past threshold
    currentX.value = diff < threshold ? threshold + (diff - threshold) * 0.2 : diff;
  } else {
    currentX.value = 0;
  }
}

function onTouchEnd() {
  isSwiping.value = false;
  if (currentX.value < threshold / 1.5) {
    currentX.value = threshold; // Keep open
  } else {
    currentX.value = 0; // Snap back
  }
}

function onDelete() {
  hapticImpactHeavy();
  currentX.value = 0;
  emit('delete');
}
</script>

<style scoped>
.swipe-container {
  position: relative;
  overflow: hidden;
  width: 100%;
}

.swipe-content {
  position: relative;
  z-index: 2;
  background: var(--surface-container-lowest);
  width: 100%;
}

.swipe-actions {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 100px;
  display: flex;
  justify-content: flex-end;
  z-index: 1;
}

.action-btn {
  height: 100%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0 24px;
}

.delete-btn {
  background-color: #ff3b30; /* iOS Red */
  width: 100%;
}
</style>
