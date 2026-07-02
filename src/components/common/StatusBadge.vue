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
  background-color: #ffb74d;
  color: #3e2723;
}

.status-proceso {
  background-color: #4fc3f7;
  color: #01579b;
}

.status-lista {
  background-color: #81c784;
  color: #1b5e20;
}

.status-entregada {
  background-color: #9e9e9e;
  color: #212121;
}

.status-cancelada {
  background-color: #e57373;
  color: #b71c1c;
}

.status-default {
  background-color: #e0e0e0;
  color: #424242;
}
</style>
