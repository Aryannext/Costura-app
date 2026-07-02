<template>
  <div class="ordenes-view">
    <div class="header-actions">
      <h2 class="display-sm">Órdenes</h2>
      <button class="btn-primary" @click="showAddForm = true">+ Nueva</button>
    </div>

    <div class="search-bar">
      <input 
        type="text" 
        class="input-field" 
        v-model="searchQuery" 
        placeholder="Buscar por cliente..." 
      />
    </div>

    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: currentTab === 'activas' }" 
        @click="currentTab = 'activas'"
      >Activas</button>
      <button 
        class="tab-btn" 
        :class="{ active: currentTab === 'historial' }" 
        @click="currentTab = 'historial'"
      >Historial</button>
    </div>

    <div v-if="loading && ordenesFiltradas.length === 0" class="loading-state">
      <SkeletonLoader :count="4" height="88px" />
    </div>
    
    <div v-else-if="ordenesFiltradas.length === 0" class="empty-state">
      <p class="body-md">No hay órdenes en esta categoría.</p>
    </div>

    <transition-group name="stagger" tag="div" v-else class="ordenes-list stagger-list">
      <OrdenCard 
        v-for="orden in ordenesFiltradas" 
        :key="orden.id_orden" 
        :orden="orden"
        @click="goToDetail(orden.id_orden)"
      />
    </transition-group>

    <!-- Add Form Modal -->
    <transition name="modal">
      <div v-if="showAddForm" class="modal-overlay">
        <div class="modal-content card">
          <h3 class="headline-sm" style="margin-bottom: 16px;">Nueva Orden</h3>
          <OrdenForm 
            :fixedClienteId="preselectedClienteId"
            :loading="loading" 
            :error="error"
            @submit="handleAddOrden"
            @cancel="closeForm"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrdenes } from '../composables/useOrdenes.js';
import OrdenCard from '../components/ordenes/OrdenCard.vue';
import OrdenForm from '../components/ordenes/OrdenForm.vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';

const route = useRoute();
const router = useRouter();
const toast = inject('toast');
const { ordenes, loading, error, fetchOrdenes, saveOrden } = useOrdenes();

const currentTab = ref('activas');
const showAddForm = ref(false);
const preselectedClienteId = ref(null);
const searchQuery = ref('');

onMounted(() => {
  fetchOrdenes();
  // Check if we navigated here with intent to create an order for a client
  if (route.query.cliente) {
    preselectedClienteId.value = parseInt(route.query.cliente);
    showAddForm.value = true;
  }
});

const ordenesFiltradas = computed(() => {
  let filtradas = ordenes.value;

  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase();
    filtradas = filtradas.filter(o => o.cliente_nombre?.toLowerCase().includes(q));
  }

  if (currentTab.value === 'activas') {
    // Pendiente (1), En Proceso (2), Lista para Entregar (3)
    return filtradas.filter(o => [1, 2, 3].includes(o.id_estado_orden));
  } else {
    // Entregada (4), Cancelada (5)
    return filtradas.filter(o => [4, 5].includes(o.id_estado_orden));
  }
});

function goToDetail(id) {
  router.push(`/ordenes/${id}`);
}

function closeForm() {
  showAddForm.value = false;
  preselectedClienteId.value = null;
  
  if (route.query.cliente) {
    router.replace('/ordenes');
  }
}

async function handleAddOrden(ordenData) {
  try {
    const id = await saveOrden(ordenData);
    closeForm();
    toast('Orden creada exitosamente', 'success');
    goToDetail(id);
  } catch (err) {
    // Error is handled in composable and passed to form
  }
}
</script>

<style scoped>
.ordenes-view {
  padding: 24px 16px 80px 16px;
}
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header-actions h2 {
  margin: 0;
  color: var(--on-surface);
}
.search-bar {
  margin-bottom: 16px;
}
.search-bar input {
  width: 100%;
}
.tabs {
  display: flex;
  margin-bottom: 24px;
  background-color: var(--surface-container);
  border-radius: var(--radius-md);
  overflow: hidden;
  padding: 4px;
  gap: 4px;
}
.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px;
  border-radius: var(--radius-sm);
  color: var(--on-surface-variant);
  font-weight: 500;
  transition: all 0.2s ease;
}
.tab-btn.active {
  background-color: var(--surface-container-lowest);
  color: var(--primary);
  box-shadow: var(--shadow-level-1);
}
.empty-state {
  text-align: center;
  color: var(--on-surface-variant);
  padding: 40px 0;
}
.ordenes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
