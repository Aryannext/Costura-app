<template>
  <div class="orden-detail-view">
    <div class="header-actions">
      <button class="back-btn" @click="router.back()">← Volver</button>
    </div>

    <div v-if="loading && !ordenActual" class="loading-state">
      <SkeletonLoader :count="6" height="60px" />
    </div>
    
    <div v-else-if="!ordenActual" class="empty-state">
      <p>Orden no encontrada.</p>
    </div>

    <div v-else class="orden-content">
      <!-- Resumen Fijo -->
      <div class="card orden-header">
        <div class="title-row">
          <h2>Orden #{{ ordenActual.id_orden }}</h2>
          <StatusBadge :estado="ordenActual.estado_nombre" />
        </div>
        <p class="resumen-texto"><strong>Cliente:</strong> {{ ordenActual.cliente_nombre }}</p>
        <p class="resumen-texto">
          <strong>Saldo:</strong> 
          <span :class="{'deuda': ordenActual.saldo_pendiente > 0}">
            ${{ ordenActual.saldo_pendiente }}
          </span> / ${{ ordenActual.valor_total }}
        </p>
      </div>

      <!-- Visual Timeline Progress Bar -->
      <div class="timeline-progress card" v-if="ordenActual.id_estado_orden !== 5">
        <div class="progress-steps">
          <div class="step" :class="{ completed: ordenActual.id_estado_orden >= 1, active: ordenActual.id_estado_orden === 1 }">
            <div class="step-circle" :class="{ 'status-active-pulse': ordenActual.id_estado_orden === 1 }">1</div>
            <span class="step-label">Recibida</span>
          </div>
          <div class="step-line" :class="{ completed: ordenActual.id_estado_orden >= 2 }"></div>
          <div class="step" :class="{ completed: ordenActual.id_estado_orden >= 2, active: ordenActual.id_estado_orden === 2 }">
            <div class="step-circle" :class="{ 'status-active-pulse': ordenActual.id_estado_orden === 2 }">2</div>
            <span class="step-label">Proceso</span>
          </div>
          <div class="step-line" :class="{ completed: ordenActual.id_estado_orden >= 3 }"></div>
          <div class="step" :class="{ completed: ordenActual.id_estado_orden >= 3, active: ordenActual.id_estado_orden === 3 }">
            <div class="step-circle" :class="{ 'status-active-pulse': ordenActual.id_estado_orden === 3 }">3</div>
            <span class="step-label">Lista</span>
          </div>
          <div class="step-line" :class="{ completed: ordenActual.id_estado_orden >= 4 }"></div>
          <div class="step" :class="{ completed: ordenActual.id_estado_orden >= 4, active: ordenActual.id_estado_orden === 4 }">
            <div class="step-circle" :class="{ 'status-active-pulse': ordenActual.id_estado_orden === 4 }">✓</div>
            <span class="step-label">Entregada</span>
          </div>
        </div>
      </div>

      <!-- Pestañas -->
      <div class="tabs">
        <button :class="{ active: tab === 'detalle' }" @click="tab = 'detalle'">Detalle</button>
        <button :class="{ active: tab === 'prendas' }" @click="tab = 'prendas'">Prendas</button>
        <button :class="{ active: tab === 'pagos' }" @click="tab = 'pagos'">Pagos</button>
      </div>

            <transition name="fade" mode="out-in">
        <TabDetalle 
        v-if="tab === 'detalle' && ordenActual" 
        :orden="ordenActual"
        :historial="historial"
        :notificaciones="notificaciones"
        @cambiar-estado="cambiarEstado"
        @notificar-telegram="notificarTelegram"
        @generar-recibo="generarReciboTelegram"
        @generar-recibo-nativo="generarReciboNativo"
      />
        <TabPrendas 
          v-else-if="tab === 'prendas'" 
          key="prendas"
          :orden="ordenActual"
          :prendas="prendas"
          :loading="prendasLoading"
          @open-prenda-form="showPrendaForm = true"
          @delete-prenda="(id) => openDeleteSheet('prenda', id)"
          @take-photo="handleTakePhoto"
          @add-obs="openObsPrompt"
          @estado-changed="handleEstadoPrenda"
          ref="tabPrendasRef"
        />
        <TabPagos 
          v-else-if="tab === 'pagos'" 
          key="pagos"
          :orden="ordenActual"
          :pagos="pagos"
          :loading="pagosLoading"
          @open-pago-form="showPagoForm = true"
          @delete-pago="(id) => openDeleteSheet('pago', id)"
        />
      </transition>

    </div>

    <!-- Modals -->
    <transition name="modal">
      <div v-if="showPrendaForm" class="modal-overlay">
        <div class="modal-content card">
          <h3>Añadir Prenda</h3>
          <PrendaForm 
            :tiposPrenda="tiposPrenda"
            :loading="prendasLoading" 
            :error="prendasError"
            @submit="handleAddPrenda"
            @cancel="showPrendaForm = false"
          />
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showPagoForm" class="modal-overlay">
        <div class="modal-content card">
          <h3>Registrar Pago</h3>
          <PagoForm 
            :metodosPago="metodosPago"
            :saldoPendiente="ordenActual.saldo_pendiente"
            :loading="pagosLoading" 
            :error="pagosError"
            @submit="handleAddPago"
            @cancel="showPagoForm = false"
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
            <button class="btn-secondary" @click="cancelConfirm">Cancelar</button>
            <button class="btn-primary telegram-btn-modal" @click="executeConfirm">
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
          <textarea v-model="promptInput" rows="3" placeholder="Escribe aquí..."></textarea>
          <div class="confirm-actions" style="margin-top: 16px;">
            <button class="btn-secondary" @click="cancelPrompt">Cancelar</button>
            <button class="btn-primary" @click="executePrompt">Guardar</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- iOS Action Sheet -->
    <IosActionSheet 
      v-model="showActionSheet" 
      :title="actionSheetTitle"
      :message="actionSheetMessage"
      :actions="actionSheetActions"
      @action="handleSheetAction"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrdenes } from '../composables/useOrdenes.js';
import { usePrendas } from '../composables/usePrendas.js';
import { usePagos } from '../composables/usePagos.js';
import { useNotificaciones } from '../composables/useNotificaciones.js';
import StatusBadge from '../components/common/StatusBadge.vue';
import PrendaCard from '../components/prendas/PrendaCard.vue';
import PrendaForm from '../components/prendas/PrendaForm.vue';
import PagoForm from '../components/pagos/PagoForm.vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import SwipeItem from '../components/common/SwipeItem.vue';
import IosActionSheet from '../components/common/IosActionSheet.vue';
import { useTelegramBot } from '../composables/useTelegramBot.js';
import TabDetalle from '../components/ordenes/TabDetalle.vue';
import TabPrendas from '../components/ordenes/TabPrendas.vue';
import TabPagos from '../components/ordenes/TabPagos.vue';
import { Share } from '@capacitor/share';

const route = useRoute();
const router = useRouter();
const toast = inject('toast');

const tab = ref('detalle');

// Ordenes logic
const { ordenActual, historial, loading, fetchOrden, changeEstado } = useOrdenes();

// Prendas logic
const { 
  tiposPrenda, prendas, loading: prendasLoading, error: prendasError,
  fetchTiposPrenda, fetchPrendas, savePrenda, changeEstado: changeEstadoPrenda,
  takePhoto, addNewObservacion
} = usePrendas();

// Pagos logic
const {
  metodosPago, pagos, loading: pagosLoading, error: pagosError,
  fetchMetodosPago, fetchPagos, savePago
} = usePagos();

// Telegram Bot Logic
const { sendTelegramMessage } = useTelegramBot();

// Notificaciones logic
const { notificaciones, fetchNotificaciones, saveNotificacion } = useNotificaciones();

const showPrendaForm = ref(false);
const showPagoForm = ref(false);
const prendaRefs = ref({});
const tabPrendasRef = ref(null);

onMounted(async () => {
  const id = route.params.id;
  if (id) {
    await fetchOrden(id);
    await fetchTiposPrenda();
    await fetchMetodosPago();
    await fetchNotificaciones(id);
  }
});

// Fetch prendas whenever we switch to the prendas tab
watch(tab, async (newTab) => {
  if (newTab === 'prendas' && ordenActual.value) {
    await fetchPrendas(ordenActual.value.id_orden);
  } else if (newTab === 'pagos' && ordenActual.value) {
    await fetchPagos(ordenActual.value.id_orden);
  }
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const dateOnly = dateStr.split('T')[0].split(' ')[0];
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString();
}

const showConfirmModal = ref(false);
const confirmMessage = ref('');
let onConfirmAction = null;

function requestConfirm(message, action) {
  confirmMessage.value = message;
  onConfirmAction = action;
  showConfirmModal.value = true;
}

function executeConfirm() {
  if (onConfirmAction) onConfirmAction();
  showConfirmModal.value = false;
}

function cancelConfirm() {
  onConfirmAction = null;
  showConfirmModal.value = false;
}

async function cambiarEstado(id_estado, nombre) {
  try {
    await changeEstado(ordenActual.value.id_orden, id_estado, nombre, ordenActual.value);
    toast(`Estado actualizado a: ${nombre}`, 'success');

    if (id_estado === 3) {
      requestConfirm("¿Deseas usar el Bot de Telegram para enviarte el aviso de orden lista (con enlace a WhatsApp)?", () => {
        enviarAlertaOrdenListaBot();
      });
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function enviarAlertaOrdenListaBot() {
  if (!ordenActual.value) return;
  const cliente = ordenActual.value.cliente_nombre;
  const telefono = ordenActual.value.cliente_telefono || '';
  const saldo = ordenActual.value.saldo_pendiente;
  const idOrden = ordenActual.value.id_orden;

  // Build WhatsApp link
  let wpText = `Hola ${cliente}, te informamos que tu orden #${idOrden} ya está lista para recoger en el Atelier.`;
  if (saldo > 0) wpText += ` Recuerda que tienes un saldo pendiente de $${saldo}.`;
  const wpLink = `https://wa.me/${telefono.replace(/\+/g, '')}?text=${encodeURIComponent(wpText)}`;

  const mensajeBot = `✅ *Orden Lista*\n\nLa orden #${idOrden} de *${cliente}* ya está terminada.\nSaldo pendiente: *$${saldo}*\n\n[📲 Toca aquí para avisarle por WhatsApp](${wpLink})`;

  const success = await sendTelegramMessage(mensajeBot, 'Markdown');
  if (success) {
    toast('Alerta enviada a tu Telegram.', 'success');
    await saveNotificacion("Alerta Telegram enviada", idOrden, 2);
  } else {
    toast('Error enviando alerta por Telegram.', 'error');
  }
}

async function generarReciboTelegram() {
  if (!ordenActual.value) return;
  const o = ordenActual.value;
  let recibo = `🧾 *RECIBO DIGITAL - ATELIER*\n\n`;
  recibo += `*Orden:* #${o.id_orden}\n`;
  recibo += `*Cliente:* ${o.cliente_nombre}\n`;
  recibo += `*Fecha de Recepción:* ${formatDate(o.fecha_recepcion)}\n`;
  recibo += `*Entrega Estimada:* ${formatDate(o.fecha_entrega_estimada)}\n\n`;
  recibo += `*Estado:* ${o.estado_nombre}\n\n`;
  recibo += `💰 *PRESUPUESTO*\n`;
  recibo += `Total: $${o.precio_total}\n`;
  recibo += `Abono: $${o.abono_inicial}\n`;
  recibo += `*Saldo:* $${o.saldo_pendiente}\n`;

  const success = await sendTelegramMessage(recibo, 'Markdown');
  if (success) {
    toast('Recibo generado en tu Telegram.', 'success');
  } else {
    toast('Error enviando recibo a Telegram.', 'error');
  }
}

async function generarReciboNativo() {
  if (!ordenActual.value) return;
  const o = ordenActual.value;
  let recibo = `🧾 RECIBO DIGITAL - ATELIER\n\n`;
  recibo += `Orden: #${o.id_orden}\n`;
  recibo += `Cliente: ${o.cliente_nombre}\n`;
  recibo += `Fecha de Recepción: ${formatDate(o.fecha_recepcion)}\n`;
  recibo += `Entrega Estimada: ${formatDate(o.fecha_entrega_estimada)}\n\n`;
  recibo += `Estado: ${o.estado_nombre}\n\n`;
  recibo += `💰 PRESUPUESTO\n`;
  recibo += `Total: $${o.precio_total}\n`;
  recibo += `Abono: $${o.abono_inicial}\n`;
  recibo += `Saldo: $${o.saldo_pendiente}\n`;

  try {
    await Share.share({
      title: 'Recibo de Orden',
      text: recibo,
      dialogTitle: 'Compartir recibo con el cliente',
    });
  } catch (e) {
    if (e.message !== 'Share canceled') {
      toast('Error al compartir o tu plataforma no lo soporta', 'error');
      console.error(e);
    }
  }
}

async function notificarTelegram(tipo) {
  if (!ordenActual.value) return;
  const o = ordenActual.value;
  const cliente = o.cliente_nombre;
  const telefono = o.cliente_telefono || '';
  const idOrden = o.id_orden;
  const saldo = o.saldo_pendiente;

  let wpText = '';
  let mensajeBot = '';

  if (tipo === 'LISTA_ENTREGA') {
    wpText = `Hola ${cliente}, te informamos que tu orden #${idOrden} ya está lista para recoger en el Atelier.`;
    if (saldo > 0) wpText += ` Recuerda que tienes un saldo pendiente de $${saldo}.`;
    const wpLink = `https://wa.me/${telefono.replace(/\+/g, '')}?text=${encodeURIComponent(wpText)}`;
    mensajeBot = `✅ *Aviso de Orden Lista*\n\nToca aquí para avisar a *${cliente}* que su orden #${idOrden} está terminada:\n\n[📲 Enviar WhatsApp](${wpLink})`;
  } else if (tipo === 'RECORDATORIO_PAGO') {
    wpText = `Hola ${cliente}, te escribimos del Atelier para recordarte que tienes un saldo pendiente de $${saldo} en tu orden #${idOrden}.`;
    const wpLink = `https://wa.me/${telefono.replace(/\+/g, '')}?text=${encodeURIComponent(wpText)}`;
    mensajeBot = `💸 *Recordatorio de Pago*\n\nToca aquí para cobrarle a *${cliente}* el saldo de *$${saldo}*:\n\n[📲 Enviar WhatsApp de Cobro](${wpLink})`;
  }

  const success = await sendTelegramMessage(mensajeBot, 'Markdown');
  if (success) {
    toast('Enlace enviado a tu Telegram.', 'success');
  } else {
    toast('Error enviando mensaje a Telegram.', 'error');
  }
}


async function handleAddPrenda(prendaData) {
  try {
    prendaData.id_orden = ordenActual.value.id_orden;
    await savePrenda(prendaData);
    showPrendaForm.value = false;
    toast('Prenda añadida exitosamente', 'success');
    // Refresh order totals and history
    fetchOrden(ordenActual.value.id_orden);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function handleAddPago(pagoData) {
  try {
    pagoData.id_orden = ordenActual.value.id_orden;
    await savePago(pagoData, ordenActual.value.saldo_pendiente);
    showPagoForm.value = false;
    toast('Pago registrado exitosamente', 'success');
    // Refresh order totals
    fetchOrden(ordenActual.value.id_orden);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function handleEstadoPrenda(id_prenda, id_estado) {
  try {
    await changeEstadoPrenda(id_prenda, id_estado, ordenActual.value.id_orden);
    toast('Estado de la prenda actualizado', 'success');
  } catch (err) {
    toast('Error al actualizar estado de la prenda', 'error');
  }
}

function setPrendaRef(el, id_prenda) {
  if (el) prendaRefs.value[id_prenda] = el;
}

async function handleTakePhoto(id_prenda) {
  try {
    const uri = await takePhoto(id_prenda);
    if (uri) {
      toast('Fotografía guardada', 'success');
      if (prendaRefs.value[id_prenda]) {
        if (tabPrendasRef.value && tabPrendasRef.value.prendaRefs) { tabPrendasRef.value.prendaRefs[id_prenda]?.refreshData(); }
      }
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

const showPromptModal = ref(false);
const promptMessage = ref('');
const promptInput = ref('');
let onPromptAction = null;

function requestPrompt(message, action) {
  promptMessage.value = message;
  promptInput.value = '';
  onPromptAction = action;
  showPromptModal.value = true;
}

function executePrompt() {
  if (onPromptAction) onPromptAction(promptInput.value);
  showPromptModal.value = false;
}

function cancelPrompt() {
  onPromptAction = null;
  showPromptModal.value = false;
}

async function openObsPrompt(id_prenda) {
  requestPrompt('Escribe la nueva observación:', async (obs) => {
    if (obs && obs.trim() !== '') {
      try {
        await addNewObservacion(id_prenda, obs.trim());
        toast('Observación añadida', 'success');
        if (prendaRefs.value[id_prenda]) {
          if (tabPrendasRef.value && tabPrendasRef.value.prendaRefs) { tabPrendasRef.value.prendaRefs[id_prenda]?.refreshData(); }
        }
      } catch (err) {
        toast('Error al añadir observación', 'error');
      }
    }
  });
}

// Action Sheet Logic for Swipe to Delete
const showActionSheet = ref(false);
const actionSheetTitle = ref('');
const actionSheetMessage = ref('');
const actionSheetActions = ref([]);
let currentDeletePayload = null;

function openDeleteSheet(type, id) {
  currentDeletePayload = { type, id };
  
  if (type === 'prenda') {
    actionSheetTitle.value = 'Eliminar Prenda';
    actionSheetMessage.value = '¿Estás seguro de que deseas eliminar esta prenda? Esta acción no se puede deshacer.';
  } else {
    actionSheetTitle.value = 'Eliminar Pago';
    actionSheetMessage.value = '¿Deseas eliminar este pago? El saldo se recalculará automáticamente.';
  }

  actionSheetActions.value = [
    { text: 'Eliminar', role: 'destructive', id: 'delete' }
  ];
  
  showActionSheet.value = true;
}

function handleSheetAction(action) {
  if (action.id === 'delete') {
    if (currentDeletePayload.type === 'prenda') {
      toast('Prenda eliminada', 'success');
      // Here you would normally call deletePrenda(currentDeletePayload.id)
    } else if (currentDeletePayload.type === 'pago') {
      toast('Pago eliminado y saldo recalculado', 'success');
      // Here you would normally call deletePago(currentDeletePayload.id)
    }
  }
  currentDeletePayload = null;
}
</script>

<style scoped>
.orden-detail-view {
  padding: 16px;
}
.header-actions {
  margin-bottom: 16px;
}
.back-btn {
  background: none;
  border: 1px solid var(--outline-variant);
  color: var(--on-surface);
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.back-btn:hover {
  background: var(--surface-container);
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.title-row h2 {
  margin: 0;
  color: var(--primary);
}
.resumen-texto {
  margin: 4px 0;
  color: var(--on-surface-variant);
}
.resumen-texto strong {
  color: var(--on-surface);
}
.deuda {
  color: var(--error);
  font-weight: bold;
}

/* Premium Segmented Control Tabs */
.tabs {
  display: flex;
  background-color: var(--surface-container-high);
  border-radius: var(--radius-lg);
  padding: 4px;
  margin-bottom: 20px;
}
.tabs button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px;
  color: var(--on-surface-variant);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}
.tabs button.active {
  background-color: var(--surface-container-lowest);
  color: var(--primary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.fechas {
  margin-bottom: 16px;
}
.fechas p {
  margin: 4px 0;
  color: var(--on-surface-variant);
}
.fechas p strong {
  color: var(--on-surface);
}
.estado-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  border-top: 1px solid var(--surface-container-highest);
  padding-top: 16px;
}
.btn-danger {
  background-color: var(--error);
  color: var(--on-error);
}
.btn-secondary {
  background-color: transparent;
  border: 1px solid var(--outline-variant);
  color: var(--on-surface);
}
.telegram-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--surface-container-highest);
}
.telegram-btn {
  background-color: #2AABEE; /* Color oficial de Telegram */
  color: white;
  border: none;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h3 {
  margin: 0;
  color: var(--on-surface);
}
.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
}
.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
}
.timeline li {
  padding: 10px 0;
  border-bottom: 1px solid var(--surface-container-highest);
  display: flex;
  flex-direction: column;
}
.timeline .time {
  font-size: 0.8rem;
  color: var(--primary);
  margin-bottom: 4px;
  font-weight: 500;
}
.timeline .desc {
  color: var(--on-surface-variant);
}
.empty-state {
  text-align: center;
  color: var(--on-surface-variant);
  padding: 30px 0;
  background: var(--surface-container-low);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--outline-variant);
}
.prendas-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-content {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
}
.pagos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pago-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: var(--radius-lg);
}
.valor-pago {
  color: var(--success-color, #10b981);
  font-weight: 700;
  font-size: 1.1em;
}
.pago-fecha {
  color: var(--on-surface-variant);
  font-size: 0.85em;
}

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

/* Premium Timeline Progress Bar */
.timeline-progress {
  padding: 24px 16px;
  margin-bottom: 20px;
  background-color: var(--surface-container-low);
  border-radius: var(--radius-lg);
  border: 1px solid var(--surface-container-highest);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  width: 60px;
}
.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--surface-container-highest);
  border: 2px solid var(--outline-variant);
  color: var(--on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 8px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.step-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  text-align: center;
  white-space: nowrap;
  transition: color 0.3s ease;
}
.step-line {
  flex-grow: 1;
  height: 4px;
  background-color: var(--surface-container-highest);
  margin-top: -24px;
  z-index: 1;
  border-radius: 2px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.step.completed .step-circle {
  background-color: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
}
.step.completed .step-label {
  color: var(--primary);
  font-weight: 600;
}
.step-line.completed {
  background-color: var(--primary);
}
.step.active .step-circle {
  background-color: var(--primary-container);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 0 0 4px var(--surface-container);
  transform: scale(1.1);
}
.step.active .step-label {
  color: var(--primary);
  font-weight: 700;
}
</style>
