<template>
  <form @submit.prevent="handleSubmit" class="orden-form">
    <div class="form-group" v-if="!fixedClienteId">
      <label for="cliente">Cliente *</label>
      <select id="cliente" v-model="form.id_cliente" required>
        <option value="" disabled>Seleccione un cliente</option>
        <option v-for="c in clientesList" :key="c.id_cliente" :value="c.id_cliente">
          {{ c.nombre }} ({{ c.telefono }})
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="fecha_entrega">Fecha estimada de entrega *</label>
      <input type="date" id="fecha_entrega" v-model="form.fecha_entrega_estimada" required :min="today" />
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">Cancelar</button>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Creando...' : 'Crear Orden' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAllClientes } from '../../database/queries/clientes.js';

const props = defineProps({
  fixedClienteId: {
    type: Number,
    default: null
  },
  loading: Boolean,
  error: String
});

const emit = defineEmits(['submit', 'cancel']);

const form = ref({
  id_cliente: props.fixedClienteId || '',
  fecha_entrega_estimada: ''
});

const clientesList = ref([]);
// format today as YYYY-MM-DD for the min attribute of date input
const today = new Date().toISOString().split('T')[0];

onMounted(async () => {
  if (!props.fixedClienteId) {
    clientesList.value = await getAllClientes(1000, 0); 
  }
});

function handleSubmit() {
  emit('submit', form.value);
}
</script>

<style scoped>
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
.btn-secondary {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}
.error-message {
  color: var(--error-color);
  margin-bottom: 16px;
  font-size: 0.9em;
}
</style>
