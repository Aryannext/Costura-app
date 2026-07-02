<template>
  <div class="card orden-card" @click="$emit('click')">
    <div class="orden-header">
      <span class="orden-id">#{{ orden.id_orden }}</span>
      <StatusBadge :estado="orden.estado_nombre" />
    </div>
    <div class="orden-body">
      <h4>{{ orden.cliente_nombre }}</h4>
      <p class="fecha">Entrega: {{ formatDate(orden.fecha_entrega_estimada) }}</p>
      <p class="saldo" :class="{'deuda': orden.saldo_pendiente > 0}">
        Saldo: ${{ orden.saldo_pendiente }} / ${{ orden.valor_total }}
      </p>
    </div>
  </div>
</template>

<script setup>
import StatusBadge from '../common/StatusBadge.vue';

defineProps({
  orden: {
    type: Object,
    required: true
  }
});

defineEmits(['click']);

function formatDate(dateStr) {
  if (!dateStr) return '';
  // If the string contains T or space, it's a datetime. Otherwise just date.
  const dateOnly = dateStr.split('T')[0].split(' ')[0];
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}
</script>

<style scoped>
.orden-card {
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}
.orden-card:active {
  transform: scale(0.98);
  background-color: var(--border-color);
}
.orden-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.orden-id {
  font-weight: bold;
  color: var(--text-secondary);
}
.orden-body h4 {
  margin: 0 0 4px 0;
  color: var(--text-primary);
}
.orden-body p {
  margin: 2px 0;
  font-size: 0.9rem;
}
.deuda {
  color: var(--error-color);
  font-weight: bold;
}
</style>
