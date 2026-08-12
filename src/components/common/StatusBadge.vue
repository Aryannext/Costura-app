<template>
  <span class="status-badge" :class="estadoClass">
    {{ estado }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  estado: {
    type: String,
    required: true
  }
});

const estadoClass = computed(() => {
  const map = {
    'Pendiente': 'status-pendiente',
    'En Proceso': 'status-proceso',
    'Lista para Entregar': 'status-lista',
    'Entregada': 'status-entregada',
    'Cancelada': 'status-cancelada',
    'Terminada': 'status-lista'
  };
  return map[props.estado] || 'status-default';
});
</script>

<style scoped>
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  display: inline-block;
  white-space: nowrap;
}

.status-pendiente {
  background-color: var(--warning-bg);
  color: var(--warning-text);
}

.status-proceso {
  background-color: var(--info-bg);
  color: var(--info-text);
}

.status-lista {
  background-color: var(--success-bg);
  color: var(--success-text);
}

.status-entregada {
  background-color: var(--surface-container-high);
  color: var(--on-surface-variant);
}

.status-cancelada {
  background-color: var(--error-bg);
  color: var(--error-text);
}

.status-default {
  background-color: var(--surface-container);
  color: var(--on-surface-variant);
}
</style>
