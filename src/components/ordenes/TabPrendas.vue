<template>
  <div>
    <div class="section-header">
      <h3>Lista de Prendas</h3>
      <button 
        @click="$emit('open-prenda-form')" 
        class="btn-small" 
        v-if="orden.id_estado_orden !== 4 && orden.id_estado_orden !== 5"
      >+ Prenda</button>
    </div>

    <div v-if="loading && prendas.length === 0" class="loading-state">
      <SkeletonLoader :count="3" height="120px" />
    </div>
    
    <div v-else-if="prendas.length === 0" class="empty-state">
      <p>No hay prendas registradas en esta orden.</p>
    </div>

    <transition-group name="stagger" tag="div" class="prendas-list stagger-list">
      <SwipeItem 
        v-for="prenda in prendas" 
        :key="prenda.id_prenda" 
        @delete="$emit('delete-prenda', prenda.id_prenda)"
      >
        <PrendaCard 
          :prenda="prenda"
          :readonly="orden.id_estado_orden === 4 || orden.id_estado_orden === 5"
          @take-photo="$emit('take-photo', prenda.id_prenda)"
          @add-obs="$emit('add-obs', prenda.id_prenda)"
          @estado-changed="(id_prenda, id_estado) => $emit('estado-changed', id_prenda, id_estado)"
          :ref="el => setPrendaRef(el, prenda.id_prenda)"
        />
      </SwipeItem>
    </transition-group>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SwipeItem from '../common/SwipeItem.vue';
import PrendaCard from '../prendas/PrendaCard.vue';
import SkeletonLoader from '../common/SkeletonLoader.vue';

const props = defineProps({
  orden: { type: Object, required: true },
  prendas: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits([
  'open-prenda-form',
  'delete-prenda',
  'take-photo',
  'add-obs',
  'estado-changed'
]);

const prendaRefs = ref({});

function setPrendaRef(el, id_prenda) {
  if (el) prendaRefs.value[id_prenda] = el;
}

// Exponer prendaRefs para que el padre pueda llamar a refreshData() después de foto/obs
defineExpose({ prendaRefs });
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header h3 { margin: 0; color: var(--on-surface); }
.btn-small { padding: 6px 12px; font-size: 0.85rem; }
.loading { padding: 20px; text-align: center; color: var(--on-surface-variant); }
.empty-state { text-align: center; color: var(--on-surface-variant); padding: 30px 0; background: var(--surface-container-low); border-radius: var(--radius-lg); border: 1px dashed var(--outline-variant); }
.prendas-list { display: flex; flex-direction: column; gap: 12px; }
</style>
