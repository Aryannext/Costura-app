<template>
  <div class="cliente-detail-view">
    <div class="header-actions">
      <button class="back-btn" @click="router.back()">← Volver</button>
      <button class="edit-btn" @click="showEditForm = true" v-if="clienteActual">Editar</button>
    </div>

    <div v-if="loading && !clienteActual" class="loading-state">
      <SkeletonLoader :count="4" height="80px" />
    </div>
    
    <div v-else-if="!clienteActual" class="empty-state">
      <p>Cliente no encontrado.</p>
    </div>

    <div v-else class="cliente-content">
      <div class="card cliente-header">
        <h2>{{ clienteActual.nombre }}</h2>
        <p>
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          {{ clienteActual.telefono }}
        </p>
        <p v-if="clienteActual.direccion">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {{ clienteActual.direccion }}
        </p>
      </div>

      <div class="tabs" style="margin-bottom: 16px;">
        <button :class="{ active: tab === 'ordenes' }" @click="tab = 'ordenes'">Historial de Órdenes</button>
        <button :class="{ active: tab === 'notificaciones' }" @click="tab = 'notificaciones'">Notificaciones</button>
      </div>

      <transition name="fade" mode="out-in">
        <div v-if="tab === 'ordenes'" key="ordenes" class="ordenes-section">
          <div class="section-header">
            <h3>Órdenes</h3>
            <button @click="goToNuevaOrden" class="btn-small">+ Orden</button>
          </div>

          <div v-if="ordenesCliente.length === 0" class="empty-state card">
            <p>No hay órdenes registradas para este cliente.</p>
          </div>

          <div v-else class="ordenes-list">
            <div 
              v-for="orden in ordenesCliente" 
              :key="orden.id_orden" 
              class="card orden-card"
              @click="goToOrdenDetail(orden.id_orden)"
            >
              <div class="orden-info">
                <h4>Orden #{{ orden.id_orden }}</h4>
                <p>
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {{ formatDate(orden.fecha_creacion) }}
                </p>
                <p>
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ${{ orden.valor_total }}
                </p>
              </div>
              <div class="orden-status">
                <StatusBadge :estado="orden.estado_nombre" />
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="tab === 'notificaciones'" key="notificaciones" class="notificaciones-section">
          <div class="section-header">
            <h3>Historial de Notificaciones</h3>
          </div>
          
          <div v-if="notifLoading" class="loading-state">
            <SkeletonLoader :count="2" height="50px" />
          </div>
          <div v-else-if="notificaciones.length === 0" class="empty-state card">
            <p>No existen notificaciones registradas para este cliente.</p>
          </div>
          <div v-else class="notificaciones-list">
            <div v-for="notif in notificaciones" :key="notif.id_notificacion" class="card notif-card">
              <div class="notif-header">
                <strong>Orden #{{ notif.id_orden }}</strong>
                <span class="time">{{ new Date(notif.fecha_envio).toLocaleString() }}</span>
              </div>
              <div class="notif-body">
                <span class="badge">{{ notif.tipo_nombre }}</span>
                <p>{{ notif.mensaje }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Edit Form Modal -->
    <div v-if="showEditForm" class="modal-overlay">
      <div class="modal-content card">
        <h3>Editar Cliente</h3>
        <ClienteForm 
          :initialData="clienteActual"
          :loading="loading" 
          :error="error"
          @submit="handleEditCliente"
          @cancel="showEditForm = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClientes } from '../composables/useClientes.js';
import { useNotificaciones } from '../composables/useNotificaciones.js';
import ClienteForm from '../components/clientes/ClienteForm.vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import StatusBadge from '../components/common/StatusBadge.vue';

const route = useRoute();
const router = useRouter();
const toast = inject('toast');
const { clienteActual, ordenesCliente, loading, error, fetchCliente, saveCliente } = useClientes();
const { notificaciones, loading: notifLoading, fetchNotificacionesCliente } = useNotificaciones();

const showEditForm = ref(false);
const tab = ref('ordenes');

onMounted(() => {
  const id = route.params.id;
  if (id) {
    fetchCliente(id);
    fetchNotificacionesCliente(id);
  }
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

function goToOrdenDetail(id) {
  router.push(`/ordenes/${id}`);
}

function goToNuevaOrden() {
  router.push({ path: '/ordenes/crear', query: { cliente: clienteActual.value.id_cliente } });
}

async function handleEditCliente(clienteData) {
  try {
    await saveCliente(clienteData);
    showEditForm.value = false;
    toast('Cliente actualizado exitosamente', 'success');
    fetchCliente(clienteData.id_cliente);
  } catch (err) {
    // Error is handled in composable and passed to form
  }
}
</script>

<style scoped>
.cliente-detail-view {
  padding: 16px;
}
.header-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.back-btn, .edit-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}
.cliente-header {
  margin-bottom: 24px;
}
.cliente-header h2 {
  margin: 0 0 8px 0;
  color: var(--accent-color);
}
.cliente-header p {
  margin: 4px 0;
  color: var(--text-secondary);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-header h3 {
  margin: 0;
}
.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
}
.ordenes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.orden-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.orden-card:active {
  background-color: var(--border-color);
}
.orden-info h4 {
  margin: 0 0 4px 0;
}
.orden-info p {
  margin: 2px 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 30px 0;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}
.modal-content {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}
.tabs button {
  flex: 1;
  background: none;
  border: none;
  padding: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
}
.tabs button.active {
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}

.notif-card {
  padding: 12px;
  margin-bottom: 12px;
}
.notif-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.notif-header .time {
  font-size: 12px;
  color: var(--text-secondary);
}
.notif-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.notif-body p {
  margin: 0;
  font-size: 14px;
}
.badge {
  align-self: flex-start;
  background: var(--surface-container-high);
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: bold;
}
</style>
