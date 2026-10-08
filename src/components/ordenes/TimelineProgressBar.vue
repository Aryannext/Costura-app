<template>
  <!-- Franja compacta dentro de la cabecera de la orden. Antes era una tarjeta
       propia de más de 100 px que repetía el estado y empujaba las acciones
       fuera de la pantalla. -->
  <ol class="timeline-progress" v-if="estadoOrden !== 5" aria-label="Avance de la orden">
    <li
      v-for="paso in PASOS"
      :key="paso.estado"
      class="step"
      :class="{ completed: estadoOrden >= paso.estado, active: estadoOrden === paso.estado }"
      :aria-current="estadoOrden === paso.estado ? 'step' : undefined"
    >
      <div class="step-bar"></div>
      <span class="step-label">{{ paso.nombre }}</span>
    </li>
  </ol>
</template>

<script setup>
defineProps({
  estadoOrden: {
    type: Number,
    required: true
  }
});

const PASOS = [
  { estado: 1, nombre: 'Pendiente' },
  { estado: 2, nombre: 'En proceso' },
  { estado: 3, nombre: 'Lista' },
  { estado: 4, nombre: 'Entregada' }
];
</script>

<style scoped>
.timeline-progress {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
}
.step {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.step-bar {
  height: 6px;
  border-radius: 3px;
  background-color: var(--surface-container-highest);
  transition: background-color 0.3s ease;
}
.step-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--outline);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.step.completed .step-bar {
  background-color: var(--primary);
}
.step.completed .step-label {
  color: var(--on-surface-variant);
}
.step.active .step-label {
  color: var(--primary);
  font-weight: 700;
}
</style>
