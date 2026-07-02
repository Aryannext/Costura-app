<template>
  <header class="app-header">
    <div class="logo">
      <h1 class="headline-md">Atelier Manager</h1>
    </div>

    <div class="header-actions">
      <button class="btn-ghost icon-btn-header" aria-label="Notifications" @click="toggleNotifications">
        <div class="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span v-if="urgentOrders.length > 0" class="badge-indicator">{{ urgentOrders.length }}</span>
        </div>
      </button>
    </div>

    <!-- Notifications Drawer/Modal -->
    <div v-if="showNotifications" class="notifications-overlay" @click.self="toggleNotifications">
      <div class="notifications-panel card">
        <div class="panel-header">
          <h3 class="headline-sm">Notificaciones</h3>
          <button class="btn-close" @click="toggleNotifications">×</button>
        </div>
        
        <div class="panel-body">
          <div v-if="urgentOrders.length === 0" class="empty-state">
            <p class="body-sm">No tienes órdenes atrasadas o por vencer pronto.</p>
          </div>
          
          <div v-else class="notification-list">
            <div 
              v-for="orden in urgentOrders" 
              :key="orden.id_orden" 
              class="notification-item"
              @click="goToOrder(orden.id_orden)"
            >
              <div class="notif-content">
                <strong>Orden #{{ orden.id_orden }} - {{ orden.cliente_nombre }}</strong>
                <p class="body-sm text-error" v-if="isAtrasada(orden)">¡Vencida el {{ formatDate(orden.fecha_entrega_estimada) }}!</p>
                <p class="body-sm text-warning" v-else>Vence el {{ formatDate(orden.fecha_entrega_estimada) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrdenes } from '../../composables/useOrdenes.js';

const router = useRouter();
const { ordenes, fetchOrdenes } = useOrdenes();
const showNotifications = ref(false);

onMounted(() => {
  fetchOrdenes();
});

const urgentOrders = computed(() => {
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  const futureDate = new Date();
  futureDate.setDate(todayDate.getDate() + 3); // Por vencer en los próximos 3 días
  
  return ordenes.value.filter(o => {
    // Solo órdenes activas (Pendiente, En Proceso, Lista)
    if (o.id_estado_orden > 3) return false;
    
    if (!o.fecha_entrega_estimada) return false;
    
    const entregaDate = new Date(o.fecha_entrega_estimada);
    // Include if past due or due within 3 days
    return entregaDate < futureDate;
  }).sort((a, b) => new Date(a.fecha_entrega_estimada) - new Date(b.fecha_entrega_estimada));
});

function isAtrasada(orden) {
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  const entregaDate = new Date(orden.fecha_entrega_estimada);
  return entregaDate < todayDate;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function toggleNotifications() {
  if (!showNotifications.value) {
    fetchOrdenes(); // refresh list when opening
  }
  showNotifications.value = !showNotifications.value;
}

function goToOrder(id) {
  showNotifications.value = false;
  router.push(`/ordenes/${id}`);
}
</script>

<style scoped>
.app-header {
  background-color: var(--surface-container-lowest);
  padding: 0 var(--spacing-md);
  height: 56px;
  border-bottom: 1px solid var(--surface-container-high);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.logo {
  flex-grow: 1;
}

h1 {
  margin: 0;
  color: var(--primary);
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
}

.icon-btn-header {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--on-surface-variant);
  padding: 0;
  border-radius: 50%;
  position: relative;
}

.icon-wrapper {
  position: relative;
  display: flex;
}

.badge-indicator {
  position: absolute;
  top: -4px;
  right: -6px;
  background-color: var(--error);
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--surface-container-lowest);
}

.notifications-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.notifications-panel {
  width: 320px;
  max-width: 80%;
  height: 100%;
  background-color: var(--surface-container-lowest);
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease;
  border-radius: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--surface-container-high);
}

.panel-header h3 {
  margin: 0;
  color: var(--on-surface);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: var(--on-surface-variant);
  cursor: pointer;
  padding: 0;
}

.panel-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.empty-state {
  text-align: center;
  color: var(--on-surface-variant);
  padding: 40px 0;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  background-color: var(--surface-container-low);
  border: 1px solid var(--surface-container-high);
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: var(--surface-container);
}

.notif-content strong {
  display: block;
  color: var(--on-surface);
  margin-bottom: 4px;
}

.text-error {
  color: var(--error);
  font-weight: 500;
}

.text-warning {
  color: #d97706; /* A slightly darker yellow/orange for warning */
  font-weight: 500;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
