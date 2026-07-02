<template>
  <div class="clientes-view">
    <div class="header-actions">
      <h2>Clientes</h2>
      <button @click="showAddForm = true">+ Nuevo</button>
    </div>

    <div class="search-bar">
      <input type="text" v-model="searchQuery" @input="onSearch" placeholder="Buscar por nombre o teléfono..." />
    </div>

    <div v-if="loading && clientes.length === 0" class="loading-state">
      <SkeletonLoader :count="5" height="72px" />
    </div>
    
    <div v-else-if="clientes.length === 0" class="empty-state">
      <p>No se encontraron clientes.</p>
    </div>

    <transition-group name="stagger" tag="div" v-else class="clientes-list stagger-list">
      <ClienteCard 
        v-for="cliente in clientes" 
        :key="cliente.id_cliente" 
        :cliente="cliente"
        @click="goToDetail(cliente.id_cliente)"
      />
    </transition-group>

    <!-- Add Form Modal -->
    <transition name="modal">
      <div v-if="showAddForm" class="modal-overlay">
        <div class="modal-content card">
          <h3>Nuevo Cliente</h3>
          <ClienteForm 
            :loading="loading" 
            :error="error"
            @submit="handleAddCliente"
            @cancel="showAddForm = false"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useClientes } from '../composables/useClientes.js';
import ClienteCard from '../components/clientes/ClienteCard.vue';
import ClienteForm from '../components/clientes/ClienteForm.vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';

const router = useRouter();
const toast = inject('toast');
const { clientes, loading, error, fetchClientes, search, saveCliente } = useClientes();

const searchQuery = ref('');
const showAddForm = ref(false);
let searchTimeout = null;

onMounted(() => {
  fetchClientes();
});

function onSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    search(searchQuery.value);
  }, 300);
}

function goToDetail(id) {
  router.push(`/clientes/${id}`);
}

async function handleAddCliente(clienteData) {
  try {
    const id = await saveCliente(clienteData);
    showAddForm.value = false;
    toast('Cliente registrado exitosamente', 'success');
    goToDetail(id);
  } catch (err) {
    // Error is handled in composable and passed to form
  }
}
</script>

<style scoped>
.clientes-view {
  padding: 16px;
}
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.header-actions h2 {
  margin: 0;
}
.search-bar {
  margin-bottom: 16px;
}
.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
}
.clientes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

</style>
