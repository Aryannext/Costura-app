<template>
  <teleport to="body">
    <transition name="sheet-fade">
      <div class="ios-action-sheet-overlay" v-if="modelValue" @click.self="close">
        <transition name="sheet-slide">
          <div class="ios-action-sheet" v-if="modelValue">
            <div class="sheet-header" v-if="title || message">
              <h3 class="sheet-title" v-if="title">{{ title }}</h3>
              <p class="sheet-message" v-if="message">{{ message }}</p>
            </div>
            
            <div class="sheet-actions">
              <button 
                v-for="(action, index) in actions" 
                :key="index"
                class="sheet-btn"
                :class="{ 'destructive': action.role === 'destructive' }"
                @click="handleAction(action)"
              >
                {{ action.text }}
              </button>
            </div>
            
            <div class="sheet-cancel">
              <button class="sheet-btn cancel-btn" @click="close">
                {{ cancelText || 'Cancelar' }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { useHaptics } from '../../composables/useHaptics.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  actions: { type: Array, default: () => [] },
  cancelText: { type: String, default: 'Cancelar' }
});

const emit = defineEmits(['update:modelValue', 'action']);
const { hapticSelection, hapticImpactLight } = useHaptics();

function close() {
  hapticSelection();
  emit('update:modelValue', false);
}

function handleAction(action) {
  hapticImpactLight();
  emit('action', action);
  emit('update:modelValue', false);
}
</script>

<style scoped>
.ios-action-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.ios-action-sheet {
  width: 100%;
  padding: 8px 16px 32px 16px;
  max-width: 500px;
  margin: 0 auto;
}

.sheet-header {
  background: rgba(242, 242, 247, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  text-align: center;
  padding: 16px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.sheet-title {
  margin: 0;
  font-size: 13px;
  color: #8e8e93;
  font-weight: 600;
}

.sheet-message {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #8e8e93;
}

.sheet-actions {
  background: rgba(242, 242, 247, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  overflow: hidden;
  margin-bottom: 8px;
}

/* If no header, first button gets top radius */
.sheet-header + .sheet-actions {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.sheet-btn {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  padding: 18px;
  font-size: 20px;
  color: #007aff;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.2s;
}

.sheet-btn:last-child {
  border-bottom: none;
}

.sheet-btn:active {
  background: rgba(0,0,0,0.05);
}

.sheet-btn.destructive {
  color: #ff3b30;
}

.sheet-cancel .cancel-btn {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  font-weight: 600;
  color: #007aff;
  border: none;
}

/* Animations */
.sheet-fade-enter-active, .sheet-fade-leave-active {
  transition: opacity 0.3s;
}
.sheet-fade-enter-from, .sheet-fade-leave-to {
  opacity: 0;
}

.sheet-slide-enter-active, .sheet-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.sheet-slide-enter-from, .sheet-slide-leave-to {
  transform: translateY(100%);
}
</style>
