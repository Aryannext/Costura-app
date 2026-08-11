<template>
  <div class="timeline-progress card" v-if="estadoOrden !== 5">
    <div class="progress-steps">
      <div class="step" :class="{ completed: estadoOrden >= 1, active: estadoOrden === 1 }">
        <div class="step-circle" :class="{ 'status-active-pulse': estadoOrden === 1 }">1</div>
        <span class="step-label">Recibida</span>
      </div>
      <div class="step-line" :class="{ completed: estadoOrden >= 2 }"></div>
      <div class="step" :class="{ completed: estadoOrden >= 2, active: estadoOrden === 2 }">
        <div class="step-circle" :class="{ 'status-active-pulse': estadoOrden === 2 }">2</div>
        <span class="step-label">Proceso</span>
      </div>
      <div class="step-line" :class="{ completed: estadoOrden >= 3 }"></div>
      <div class="step" :class="{ completed: estadoOrden >= 3, active: estadoOrden === 3 }">
        <div class="step-circle" :class="{ 'status-active-pulse': estadoOrden === 3 }">3</div>
        <span class="step-label">Lista</span>
      </div>
      <div class="step-line" :class="{ completed: estadoOrden >= 4 }"></div>
      <div class="step" :class="{ completed: estadoOrden >= 4, active: estadoOrden === 4 }">
        <div class="step-circle" :class="{ 'status-active-pulse': estadoOrden === 4 }">✓</div>
        <span class="step-label">Entregada</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  estadoOrden: {
    type: Number,
    required: true
  }
});
</script>

<style scoped>
/* Premium Timeline Progress Bar */
.timeline-progress {
  padding: 24px 16px;
  margin-bottom: 20px;
  background-color: var(--surface-container-low);
  border-radius: var(--radius-lg);
  border: 1px solid var(--surface-container-highest);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  width: 60px;
}
.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--surface-container-highest);
  border: 2px solid var(--outline-variant);
  color: var(--on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 8px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.step-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  text-align: center;
  white-space: nowrap;
  transition: color 0.3s ease;
}
.step-line {
  flex-grow: 1;
  height: 4px;
  background-color: var(--surface-container-highest);
  margin-top: -24px;
  z-index: 1;
  border-radius: 2px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.step.completed .step-circle {
  background-color: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
}
.step.completed .step-label {
  color: var(--primary);
  font-weight: 600;
}
.step-line.completed {
  background-color: var(--primary);
}
.step.active .step-circle {
  background-color: var(--primary-container);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 0 0 4px var(--surface-container);
  transform: scale(1.1);
}
.step.active .step-label {
  color: var(--primary);
  font-weight: 700;
}
</style>
