<template>
  <div class="card cliente-card" @click="$emit('click')">
    <div class="cliente-info">
      <h3>{{ cliente.nombre }}</h3>
      <p class="telefono">
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        {{ cliente.telefono }}
      </p>
      <p v-if="cliente.direccion" class="direccion">
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        {{ cliente.direccion }}
      </p>
    </div>
    <div class="cliente-action">
      <span>›</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  cliente: {
    type: Object,
    required: true
  }
});
defineEmits(['click']);
</script>

<style scoped>
.cliente-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.cliente-card:active {
  background-color: var(--border-color);
}
h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
}
p {
  margin: 0 0 4px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}
.direccion {
  font-size: 0.8rem;
}
.cliente-action {
  font-size: 1.5rem;
  color: var(--text-secondary);
}
</style>
