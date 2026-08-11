<template>
  <div>
    <!-- Prenda Form Modal -->
    <transition name="modal">
      <div v-if="showPrendaForm" class="modal-overlay">
        <div class="modal-content card">
          <h3>Añadir Prenda</h3>
          <PrendaForm 
            :tiposPrenda="tiposPrenda"
            :loading="prendasLoading" 
            :error="prendasError"
            @submit="(data) => emit('submitPrenda', data)"
            @cancel="emit('update:showPrendaForm', false)"
          />
        </div>
      </div>
    </transition>

    <!-- Pago Form Modal -->
    <transition name="modal">
      <div v-if="showPagoForm" class="modal-overlay">
        <div class="modal-content card">
          <h3>Registrar Pago</h3>
          <PagoForm 
            :metodosPago="metodosPago"
            :saldoPendiente="saldoPendiente"
            :loading="pagosLoading" 
            :error="pagosError"
            @submit="(data) => emit('submitPago', data)"
            @cancel="emit('update:showPagoForm', false)"
          />
        </div>
      </div>
    </transition>

    <!-- Confirm Modal -->
    <transition name="modal">
      <div v-if="showConfirmModal" class="modal-overlay">
        <div class="modal-content card confirm-modal">
          <h3>Confirmación</h3>
          <p>{{ confirmMessage }}</p>
          <div class="confirm-actions">
            <button class="btn-secondary" @click="emit('cancelConfirm')">Cancelar</button>
            <button class="btn-primary telegram-btn-modal" @click="emit('executeConfirm')">
              <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              Sí, Notificar
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Prompt Modal -->
    <transition name="modal">
      <div v-if="showPromptModal" class="modal-overlay">
        <div class="modal-content card confirm-modal">
          <h3>Añadir Observación</h3>
          <p>{{ promptMessage }}</p>
          <textarea v-model="localPromptInput" rows="3" placeholder="Escribe aquí..."></textarea>
          <div class="confirm-actions" style="margin-top: 16px;">
            <button class="btn-secondary" @click="emit('cancelPrompt')">Cancelar</button>
            <button class="btn-primary" @click="handleExecutePrompt">Guardar</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- iOS Action Sheet -->
    <IosActionSheet 
      :modelValue="showActionSheet"
      @update:modelValue="val => emit('update:showActionSheet', val)"
      :title="actionSheetTitle"
      :message="actionSheetMessage"
      :actions="actionSheetActions"
      @action="a => emit('sheetAction', a)"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import PrendaForm from '../prendas/PrendaForm.vue';
import PagoForm from '../pagos/PagoForm.vue';
import IosActionSheet from '../common/IosActionSheet.vue';

const props = defineProps({
  showPrendaForm: Boolean,
  tiposPrenda: Array,
  prendasLoading: Boolean,
  prendasError: String,
  
  showPagoForm: Boolean,
  metodosPago: Array,
  saldoPendiente: Number,
  pagosLoading: Boolean,
  pagosError: String,
  
  showConfirmModal: Boolean,
  confirmMessage: String,
  
  showPromptModal: Boolean,
  promptMessage: String,
  
  showActionSheet: Boolean,
  actionSheetTitle: String,
  actionSheetMessage: String,
  actionSheetActions: Array
});

const emit = defineEmits([
  'update:showPrendaForm',
  'update:showPagoForm',
  'update:showActionSheet',
  'submitPrenda',
  'submitPago',
  'cancelConfirm',
  'executeConfirm',
  'cancelPrompt',
  'executePrompt',
  'sheetAction'
]);

const localPromptInput = ref('');

watch(() => props.showPromptModal, (newVal) => {
  if (newVal) localPromptInput.value = '';
});

function handleExecutePrompt() {
  emit('executePrompt', localPromptInput.value);
}
</script>

<style scoped>
/* Confirm Modal Styles */
.confirm-modal {
  text-align: center;
  padding: 30px 20px;
}
.confirm-modal h3 {
  margin-top: 0;
  color: var(--on-surface);
}
.confirm-modal p {
  color: var(--on-surface-variant);
  margin-bottom: 24px;
}
.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.telegram-btn-modal {
  background-color: #2AABEE;
  color: white;
}
textarea {
  width: 100%;
  padding: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--outline);
  background-color: var(--surface-container);
  color: var(--on-surface);
}
</style>
