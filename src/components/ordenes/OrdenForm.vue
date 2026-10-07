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
          placeholder="Celular (ej. 3001234567)" 
          inputmode="numeric"
          required
        />
      </div>
    </div>

    <div class="form-group">
      <label for="fecha_recepcion">¿Cuándo recibiste la ropa?</label>
      <!-- Por defecto hoy; se puede elegir un día anterior para pasar órdenes viejas a la app -->
      <input type="date" id="fecha_recepcion" v-model="form.fecha_recepcion" :max="today" required />
    </div>

    <div class="form-group">
      <label for="fecha_entrega">Fecha estimada de entrega *</label>
      
      <div class="smart-dates mb-2">
        <button type="button" class="chip-btn" @click="setFecha(1)">Mañana</button>
        <button type="button" class="chip-btn" @click="setFecha(3)">En 3 días</button>
        <button type="button" class="chip-btn" @click="setFecha(7)">1 semana</button>
      </div>

      <input type="date" id="fecha_entrega" v-model="form.fecha_entrega_estimada" required :min="form.fecha_recepcion" />
    </div>
    
    <div v-if="error || errorLocal" class="error-message">
      {{ errorLocal || error }}
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
import { validators } from '../../services/validators.js';
import { hoyLocal, sumarDias } from '../../services/fechas.js';

const props = defineProps({
  fixedClienteId: {
    type: Number,
    default: null
  },
  loading: Boolean,
  error: String
});

const emit = defineEmits(['submit', 'cancel']);

// Fechas locales: toISOString() adelantaba un día después de las 7 p. m. (A09)
const today = hoyLocal();

const form = ref({
  id_cliente: props.fixedClienteId || '',
  fecha_recepcion: today,
  fecha_entrega_estimada: ''
});
const errorLocal = ref('');

const clientesList = ref([]);
const creandoCliente = ref(false);
const nuevoCliente = ref({ nombre: '', telefono: '' });
const isSubmittingLocal = ref(false);


onMounted(async () => {
  if (!props.fixedClienteId) {
    clientesList.value = await getAllClientes();
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
  form.value.fecha_entrega_estimada = sumarDias(daysAdded);
}

async function handleSubmit() {
  isSubmittingLocal.value = true;
  errorLocal.value = '';
  try {
    if (creandoCliente.value) {
      // Misma validación que el formulario de Clientes (antes se saltaba, A07)
      validators.validateCliente(nuevoCliente.value);
      const newId = await createCliente(nuevoCliente.value);
      form.value.id_cliente = newId;
      creandoCliente.value = false;
      clientesList.value = await getAllClientes();
    }
    const { fecha_recepcion, ...orden } = form.value;
    // Hoy: SQLite guarda fecha y hora actuales. Día anterior: se guarda ese día.
    if (fecha_recepcion && fecha_recepcion < today) orden.fecha_creacion = `${fecha_recepcion} 12:00:00`;
    emit('submit', orden);
  } catch (err) {
    errorLocal.value = err.message;
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
