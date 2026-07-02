<template>
  <div>
    <div class="section-header">
      <h3>Historial de Pagos</h3>
      <button 
        @click="$emit('open-pago-form')" 
        class="btn-small" 
        v-if="orden.saldo_pendiente > 0 && orden.id_estado_orden !== 5"
      >+ Registrar Pago</button>
    </div>

    <div v-if="loading && pagos.length === 0" class="loading-state">
      <SkeletonLoader :count="3" height="70px" />
    </div>
    
    <div v-else-if="pagos.length === 0" class="empty-state">
      <p>No hay pagos registrados para esta orden.</p>
    </div>

    <transition-group name="stagger" tag="div" class="pagos-list stagger-list">
      <SwipeItem 
        v-for="pago in pagos" 
        :key="pago.id_pago"
        @delete="$emit('delete-pago', pago.id_pago)"
      >
        <div class="card pago-card">
          <div class="pago-info">
            <span class="valor-pago">${{ pago.valor }}</span> - {{ pago.metodo_nombre }}
          </div>
          <div class="pago-fecha">
            {{ formatTime(pago.fecha_pago) }}
          </div>
        </div>
      </SwipeItem>
    </transition-group>
  </div>
</template>

<script setup>
import SwipeItem from '../common/SwipeItem.vue';
import SkeletonLoader from '../common/SkeletonLoader.vue';

const props = defineProps({
  orden: { type: Object, required: true },
  pagos: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['open-pago-form', 'delete-pago']);

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString();
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header h3 { margin: 0; color: var(--on-surface); }
.btn-small { padding: 6px 12px; font-size: 0.85rem; }
.loading { padding: 20px; text-align: center; color: var(--on-surface-variant); }
.empty-state { text-align: center; color: var(--on-surface-variant); padding: 30px 0; background: var(--surface-container-low); border-radius: var(--radius-lg); border: 1px dashed var(--outline-variant); }
.pagos-list { display: flex; flex-direction: column; gap: 12px; }
.pago-card { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-radius: var(--radius-lg); }
.valor-pago { color: var(--success-color, #10b981); font-weight: 700; font-size: 1.1em; }
.pago-fecha { color: var(--on-surface-variant); font-size: 0.85em; }
</style>
