<template>
  <form @submit.prevent="handleSubmit" class="orden-form">
    <div class="form-group" v-if="!fixedClienteId">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <label for="cliente" style="margin-bottom: 0;">Cliente *</label>
        <button 
          type="button" 
          class="btn-ghost" 
          style="padding: 2px 8px; font-size: 12px; height: auto;"
          @click="toggleNuevoCliente"
        >
          {{ creandoCliente ? 'Usar existente' : '+ Nuevo Cliente' }}
        </button>
      </div>

      <!-- Select Existente -->
      <select id="cliente" v-model="form.id_cliente" required v-if="!creandoCliente">
        <option value="" disabled>Seleccione un cliente</option>
        <option v-for="c in clientesList" :key="c.id_cliente" :value="c.id_cliente">
          {{ c.nombre }} ({{ c.telefono }})
        </option>
      </select>

      <!-- Crear Nuevo -->
      <div v-else class="new-client-box">
        <input 
          type="text" 
          v-model="nuevoCliente.nombre" 
          placeholder="Nombre del cliente" 
          required 
          class="mb-2"
        />
        <input 
          type="tel" 
          v-model="nuevoCliente.telefono" 
          placeholder="Teléfono" 
        />
      </div>
    </div>

    <div class="form-group">
      <label for="fecha_entrega">Fecha estimada de entrega *</label>
      
      <div class="smart-dates mb-2">
        <button type="button" class="chip-btn" @click="setFecha(1)">Mañana</button>
        <button type="button" class="chip-btn" @click="setFecha(3)">En 3 días</button>
        <button type="button" class="chip-btn" @click="setFecha(7)">1 semana</button>
      </div>

      <input type="date" id="fecha_entrega" v-model="form.fecha_entrega_estimada" required :min="today" />
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">Cancelar</button>
      <button type="submit" :disabled="loading || isSubmittingLocal">
        {{ (loading || isSubmittingLocal) ? 'Creando...' : 'Crear Orden' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAllClientes, createCliente } from '../../database/queries/clientes.js';

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
const creandoCliente = ref(false);
const nuevoCliente = ref({ nombre: '', telefono: '' });
const isSubmittingLocal = ref(false);

// format today as YYYY-MM-DD for the min attribute of date input
const today = new Date().toISOString().split('T')[0];

onMounted(async () => {
  if (!props.fixedClienteId) {
    clientesList.value = await getAllClientes(1000, 0); 
  }
});

function toggleNuevoCliente() {
  creandoCliente.value = !creandoCliente.value;
  if (!creandoCliente.value) {
    nuevoCliente.value = { nombre: '', telefono: '' };
  } else {
    form.value.id_cliente = ''; // reset select
  }
}

function setFecha(daysAdded) {
  const date = new Date();
  date.setDate(date.getDate() + daysAdded);
  form.value.fecha_entrega_estimada = date.toISOString().split('T')[0];
}

async function handleSubmit() {
  isSubmittingLocal.value = true;
  try {
    if (creandoCliente.value) {
      // Registrar cliente primero
      const newId = await createCliente(nuevoCliente.value);
      form.value.id_cliente = newId;
    }
    emit('submit', form.value);
  } catch (err) {
    console.error(err);
  } finally {
    isSubmittingLocal.value = false;
  }
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

.new-client-box {
  background-color: var(--surface-container-low);
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--surface-container-highest);
}

.mb-2 {
  margin-bottom: 8px;
}

.smart-dates {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-btn {
  background-color: var(--surface-container);
  border: 1px solid var(--surface-container-high);
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--on-surface);
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip-btn:hover {
  background-color: var(--surface-container-high);
  color: var(--primary);
}
</style>
