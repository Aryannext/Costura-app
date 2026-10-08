<template>
  <div class="orden-detail-view">
    <div v-if="loading && !ordenActual" class="loading-state">
      <SkeletonLoader :count="6" height="60px" />
    </div>
    
    <div v-else-if="!ordenActual" class="empty-state">
      <p>Orden no encontrada.</p>
    </div>

    <div v-else class="orden-content">
      <!-- Resumen Fijo -->
      <!-- Cabecera: quién es, cuándo, cuánto debe y en qué va, en una sola tarjeta -->
      <div class="card orden-header">
        <div class="title-row">
          <button class="back-btn" @click="router.back()" aria-label="Volver">
            <svg class="ic" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg>
          </button>
          <h2>Orden #{{ ordenActual.id_orden }}</h2>
          <StatusBadge :estado="ordenActual.estado_nombre" />
        </div>
        <div class="cliente">
          <span class="cliente-nombre">{{ ordenActual.cliente_nombre }}</span>
          <span class="cliente-fechas">
            Recibida el {{ fechaCorta(ordenActual.fecha_creacion) }} ·
            <span :class="{ 'entrega-atrasada': atrasada }">{{ atrasada ? 'Debía entregarse' : 'Entrega' }} el {{ fechaCorta(ordenActual.fecha_entrega_estimada) }}</span>
          </span>
        </div>
        <TimelineProgressBar v-if="ordenActual.id_estado_orden !== 5" :estadoOrden="ordenActual.id_estado_orden" />
        <div class="saldo-row">
          <p class="saldo">
            <span class="saldo-label">Saldo </span>
            <span class="saldo-valor" :class="{'deuda': ordenActual.saldo_pendiente > 0}">{{ formatearMoneda(ordenActual.saldo_pendiente) }}</span>
            <span class="saldo-total"> de {{ formatearMoneda(ordenActual.valor_total) }}</span>
          </p>
          <!-- RN-28 y HU-37: estado de pago derivado del saldo -->
          <span
            v-if="estadoPago"
            class="pago-chip"
            :class="estadoPago === ESTADO_PAGO.PAGADA ? 'pago-chip--pagada' : 'pago-chip--pendiente'"
          >{{ estadoPago === ESTADO_PAGO.PAGADA ? 'Pagada' : 'Por cobrar' }}</span>
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
        @avisar-whatsapp="avisarCliente"
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
          @delete-prenda="confirmarEliminarPrenda"
          @take-photo="handleTakePhoto"
          @add-obs="openObsPrompt"
          @estado-changed="handleEstadoPrenda"
          @prenda-actualizada="refrescarTotales"
          ref="tabPrendasRef"
        />
        <TabPagos 
          v-else-if="tab === 'pagos'" 
          key="pagos"
          :orden="ordenActual"
          :pagos="pagos"
          :loading="pagosLoading"
          @open-pago-form="showPagoForm = true"
          @delete-pago="confirmarAnularPago"
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
      :confirmText="confirmText"
      :showPromptModal="showPromptModal"
      :promptMessage="promptMessage"
      :promptTitle="promptTitle"
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
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue';
import { estadoDePago, ESTADO_PAGO, esOrdenActiva } from '../services/estadoOrden.js';
import { formatearMoneda } from '../services/formato.js';
import { fechaCorta, diasDeDiferencia } from '../services/fechas.js';
import { useRoute, useRouter } from 'vue-router';
import { useOrdenes, mensajeConfirmacionEntrega } from '../composables/useOrdenes.js';
import { usePrendas } from '../composables/usePrendas.js';
import { usePagos } from '../composables/usePagos.js';
import { useNotificaciones } from '../composables/useNotificaciones.js';
import StatusBadge from '../components/common/StatusBadge.vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
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
  showConfirmModal, confirmMessage, confirmText, requestConfirm, executeConfirm, cancelConfirm,
  showPromptModal, promptMessage, promptTitle, requestPrompt, executePrompt, cancelPrompt,
  showActionSheet, actionSheetTitle, actionSheetMessage, actionSheetActions, openDeleteSheet, handleSheetAction
} = useOrdenModals();


// Ordenes logic
const { ordenActual, historial, loading, fetchOrden, changeEstado, clearCurrentState: clearOrdenState } = useOrdenes();
const estadoPago = computed(() => estadoDePago(ordenActual.value));

// Mismo criterio que "Atrasadas" en el panel: activa y con la fecha ya pasada.
const atrasada = computed(() => esOrdenActiva(ordenActual.value)
  && !!ordenActual.value.fecha_entrega_estimada
  && diasDeDiferencia(new Date(), ordenActual.value.fecha_entrega_estimada) < 0);

// Prendas logic
const { 
  tiposPrenda, prendas, loading: prendasLoading, error: prendasError,
  fetchTiposPrenda, fetchPrendas, savePrenda, changeEstado: changeEstadoPrenda,
  takePhoto, addNewObservacion, removePrenda, clearCurrentState: clearPrendasState
} = usePrendas();

// Pagos logic
const {
  metodosPago, pagos, loading: pagosLoading, error: pagosError,
  fetchMetodosPago, fetchPagos, savePago, anularPago
} = usePagos();

// Telegram Bot Logic
const { avisarWhatsApp, generarReciboTelegram, generarReciboNativo } = useOrdenTelegram(ordenActual);

// Notificaciones logic
const { notificaciones, fetchNotificaciones, saveNotificacion } = useNotificaciones();

const showPrendaForm = ref(false);
const showPagoForm = ref(false);
const tabPrendasRef = ref(null);

onMounted(async () => {
  const id = route.params.id;
  if (id) {
    await fetchOrden(id);
    // Mientras quedan prendas por terminar, el trabajo del día está en Prendas;
    // una orden lista, entregada o cancelada se abre en Detalle.
    if (ordenActual.value && [1, 2].includes(ordenActual.value.id_estado_orden)) {
      tab.value = 'prendas';
    }
    await fetchTiposPrenda();
    await fetchMetodosPago();
    await fetchNotificaciones(id);
  }
});

onUnmounted(() => {
  clearOrdenState();
  clearPrendasState();
});

// Fetch prendas whenever we switch to the prendas tab
watch(tab, async (newTab) => {
  if (newTab === 'prendas' && ordenActual.value) {
    await fetchPrendas(ordenActual.value.id_orden);
  } else if (newTab === 'pagos' && ordenActual.value) {
    await fetchPagos(ordenActual.value.id_orden);
  }
});





function cambiarEstado(id_estado, nombre) {
  const advertencia = id_estado === 4 ? mensajeConfirmacionEntrega(ordenActual.value) : null;
  if (advertencia) {
    requestConfirm(advertencia, () => aplicarCambioEstado(id_estado, nombre), { textoConfirmar: 'Sí, entregar' });
    return;
  }
  return aplicarCambioEstado(id_estado, nombre);
}

async function aplicarCambioEstado(id_estado, nombre) {
  try {
    await changeEstado(ordenActual.value.id_orden, id_estado, nombre, ordenActual.value);
    toast(`Estado actualizado a: ${nombre}`, 'success');
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
    await savePago(pagoData);
    showPagoForm.value = false;
    toast('Pago registrado exitosamente', 'success');
    // Refresh order totals
    fetchOrden(ordenActual.value.id_orden);
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Cambiar el precio de una prenda mueve el total y el saldo de la cabecera.
function refrescarTotales() {
  fetchOrden(ordenActual.value.id_orden);
}

// P1-9. Los errores de regla (orden cerrada, saldo que quedaría negativo, motivo
// vacío) ya los muestra useAsyncAction como toast; aquí sólo se evita que
// terminen como promesa rechazada sin capturar.
function confirmarEliminarPrenda(id_prenda) {
  openDeleteSheet('prenda', id_prenda, async () => {
    try {
      await removePrenda(id_prenda, ordenActual.value.id_orden);
      refrescarTotales();
    } catch (err) {
      console.error(err);
    }
  });
}

function confirmarAnularPago(id_pago) {
  openDeleteSheet('pago', id_pago, () => {
    requestPrompt('¿Por qué se anula este pago? El motivo queda en el historial de la orden.', async (motivo) => {
      try {
        await anularPago(id_pago, motivo);
        refrescarTotales();
      } catch (err) {
        console.error(err);
      }
    }, { titulo: 'Anular Pago' });
  });
}

async function handleEstadoPrenda(id_prenda, id_estado) {
  try {
    const result = await changeEstadoPrenda(id_prenda, id_estado, ordenActual.value.id_orden);
    // El estado de la orden pudo cambiar solo: la cabecera tiene que reflejarlo.
    refrescarTotales();
    
    // El sistema ya pasó la orden a Lista para Entregar (RN-06); sólo queda ofrecer el aviso.
    if (result?.ordenPasoALista) {
      requestConfirm("Todas las prendas están terminadas y la orden pasó a 'Lista para Entregar'. ¿Quieres avisarle al cliente por WhatsApp?", () => {
        avisarCliente('LISTA_ENTREGA');
      }, { textoConfirmar: 'Sí, avisar por WhatsApp' });
    }
  } catch (err) {
    // Errores ya son manejados por el useAsyncAction del composable
    console.error(err);
  }
}

// Abre WhatsApp con el mensaje escrito y refresca el historial de avisos (D-03)
async function avisarCliente(tipo) {
  if (await avisarWhatsApp(tipo)) {
    await fetchNotificaciones(ordenActual.value.id_orden);
  }
}

// A15: las tarjetas viven dentro de TabPrendas, que expone sus referencias.
// Antes se revisaba un mapa local de esta vista que nunca se llenaba, y la
// galería abierta no mostraba la foto o nota nueva hasta salir y volver.
function refrescarTarjeta(id_prenda) {
  tabPrendasRef.value?.prendaRefs?.[id_prenda]?.refreshData();
}

async function handleTakePhoto(id_prenda) {
  try {
    const uri = await takePhoto(id_prenda);
    if (uri) {
      toast('Fotografía guardada', 'success');
      refrescarTarjeta(id_prenda);
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
        refrescarTarjeta(id_prenda);
      } catch (err) {
        console.error('Error al añadir observación', err);
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
.ic { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.orden-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.back-btn {
  width: 40px;
  min-height: 40px;
  padding: 0;
  margin-left: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--on-surface);
  flex: none;
}
.back-btn:hover:not(:disabled) {
  background: var(--surface-container);
  box-shadow: none;
  transform: none;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.title-row h2 {
  margin: 0;
  flex: 1;
  font-size: 22px;
  color: var(--primary);
}
.cliente {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cliente-nombre {
  font-size: 16px;
  font-weight: 600;
  color: var(--on-surface);
}
.entrega-atrasada {
  color: var(--error);
  font-weight: 600;
}
.cliente-fechas {
  font-size: 13px;
  color: var(--on-surface-variant);
}
.saldo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--surface-container-high);
}
.saldo {
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 14px;
}
.saldo-label {
  font-weight: 500;
}
.saldo-valor {
  font-size: 20px;
  font-weight: 700;
  color: var(--on-surface);
  font-variant-numeric: tabular-nums;
}
.deuda {
  color: var(--error);
  font-weight: bold;
}
.pago-chip {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  white-space: nowrap;
}
.pago-chip--pagada {
  background-color: var(--success-bg);
  color: var(--success-text);
}
.pago-chip--pendiente {
  background-color: var(--warning-bg);
  color: var(--warning-text);
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
