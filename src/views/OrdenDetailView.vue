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
      <TimelineProgressBar v-if="ordenActual && ordenActual.id_estado_orden !== 5" :estadoOrden="ordenActual.id_estado_orden" />

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
    <OrdenModals 
      v-model:showPrendaForm="showPrendaForm"
      v-model:showPagoForm="showPagoForm"
      v-model:showActionSheet="showActionSheet"
      :tiposPrenda="tiposPrenda"
      :prendasLoading="prendasLoading"
      :prendasError="prendasError"
      :metodosPago="metodosPago"
      :saldoPendiente="ordenActual ? ordenActual.saldo_pendiente : 0"
      :pagosLoading="pagosLoading"
      :pagosError="pagosError"
      :showConfirmModal="showConfirmModal"
      :confirmMessage="confirmMessage"
      :showPromptModal="showPromptModal"
      :promptMessage="promptMessage"
      :actionSheetTitle="actionSheetTitle"
      :actionSheetMessage="actionSheetMessage"
      :actionSheetActions="actionSheetActions"
      @submitPrenda="handleAddPrenda"
      @submitPago="handleAddPago"
      @cancelConfirm="cancelConfirm"
      @executeConfirm="executeConfirm"
      @cancelPrompt="cancelPrompt"
      @executePrompt="executePrompt"
      @sheetAction="handleSheetAction"
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
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import SwipeItem from '../components/common/SwipeItem.vue';
import TabDetalle from '../components/ordenes/TabDetalle.vue';
import TabPrendas from '../components/ordenes/TabPrendas.vue';
import TabPagos from '../components/ordenes/TabPagos.vue';
import TimelineProgressBar from '../components/ordenes/TimelineProgressBar.vue';
import OrdenModals from '../components/ordenes/OrdenModals.vue';
import { useOrdenTelegram } from '../composables/useOrdenTelegram.js';
import { useOrdenModals } from '../composables/useOrdenModals.js';

const route = useRoute();
const router = useRouter();
const toast = inject('toast');

const tab = ref('detalle');


const {
  showConfirmModal, confirmMessage, requestConfirm, executeConfirm, cancelConfirm,
  showPromptModal, promptMessage, requestPrompt, executePrompt, cancelPrompt,
  showActionSheet, actionSheetTitle, actionSheetMessage, actionSheetActions, openDeleteSheet, handleSheetAction
} = useOrdenModals();


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
const { enviarAlertaOrdenListaBot, generarReciboTelegram, generarReciboNativo, notificarTelegram } = useOrdenTelegram(ordenActual);

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
    
    // Automatización: Auto-completado de Orden
    if (id_estado >= 3 && ordenActual.value && ordenActual.value.id_estado_orden < 3) {
      const allReady = prendas.value.every(p => p.id_estado_prenda >= 3);
      if (allReady) {
        requestConfirm("¡Todas las prendas están terminadas! ¿Deseas marcar la orden como 'Lista para Entregar'?", async () => {
          await cambiarEstado(3, 'Lista para Entregar');
        });
      }
    }
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

</style>
