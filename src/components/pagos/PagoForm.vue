<template>
  <form @submit.prevent="handleSubmit" class="pago-form">
    <div class="info-saldo">
      <p>Saldo Pendiente: <strong>${{ saldoPendiente }}</strong></p>
    </div>

    <div class="form-group">
      <label for="metodo">Método de Pago *</label>
      <select id="metodo" v-model="form.id_metodo_pago" required>
        <option value="" disabled>Seleccione un método</option>
        <option v-for="m in metodosPago" :key="m.id_metodo_pago" :value="m.id_metodo_pago">
          {{ m.nombre }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="valor">Valor del Abono/Pago ($) *</label>
      <input 
        type="number" 
        id="valor" 
        v-model.number="form.valor" 
        required 
        min="1" 
        :max="saldoPendiente"
        step="0.01" 
      />
      <small class="help-text">
        <button type="button" class="btn-link" @click="form.valor = saldoPendiente">
          Pagar el total
        </button>
      </small>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">Cancelar</button>
      <button type="submit" :disabled="loading || form.valor <= 0 || form.valor > saldoPendiente">
        {{ loading ? 'Registrando...' : 'Registrar Pago' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  metodosPago: {
    type: Array,
    required: true
  },
  saldoPendiente: {
    type: Number,
    required: true
  },
  loading: Boolean,
  error: String
});

const emit = defineEmits(['submit', 'cancel']);

const form = ref({
  id_metodo_pago: '',
  valor: ''
});

onMounted(() => {
    if (props.metodosPago && props.metodosPago.length > 0) {
        form.value.id_metodo_pago = props.metodosPago[0].id_metodo_pago;
    }
});

watch(() => props.metodosPago, (newVal) => {
    if (newVal && newVal.length > 0 && !form.value.id_metodo_pago) {
        form.value.id_metodo_pago = newVal[0].id_metodo_pago;
    }
}, { immediate: true });

function handleSubmit() {
  emit('submit', { ...form.value });
}
</script>

<style scoped>
.info-saldo {
  background-color: rgba(255,255,255,0.05);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  text-align: center;
  font-size: 1.1rem;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}
.help-text {
  display: block;
  margin-top: 4px;
  text-align: right;
}
.btn-link {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
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
