<template>
  <transition name="toast-slide">
    <div v-if="visible" class="toast" :class="type">
      {{ message }}
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);
const message = ref('');
const type = ref('success');

function show(msg, t = 'success') {
  message.value = msg;
  type.value = t;
  visible.value = true;
  
  setTimeout(() => {
    visible.value = false;
  }, 3000);
}

defineExpose({ show });
</script>

<style scoped>
.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.9rem;
  z-index: 2000;
  box-shadow: var(--shadow-level-2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.success {
  background-color: var(--success-color, #10b981);
  color: #ffffff;
}

.error {
  background-color: var(--error, #ba1a1a);
  color: var(--on-error, #ffffff);
}

.info {
  background-color: var(--surface-container-high, #eae6f4);
  color: var(--on-surface, #1b1b24);
  border: 1px solid var(--outline-variant);
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
