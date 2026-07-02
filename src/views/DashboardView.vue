<template>
  <div class="dashboard-view">
    <div class="header" style="display: flex; justify-content: space-between; align-items: center;">
      <h2 class="display-lg">Resumen de tu taller</h2>
      <button class="btn-primary" @click="enviarRecordatorios" :disabled="notifLoading">
        <svg v-if="!notifLoading" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        {{ notifLoading ? 'Procesando...' : 'Enviar Recordatorios' }}
      </button>
    </div>

    <div v-if="loading" class="loading-state" style="padding-top: 20px;">
      <SkeletonLoader :count="4" height="100px" />
    </div>

    <div v-else class="dashboard-content">
      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card highlight-blue">
          <span class="kpi-value">{{ kpis.ordenesActivas || 0 }}</span>
          <span class="kpi-label">Órdenes Activas</span>
        </div>
        <div class="kpi-card highlight-yellow">
          <span class="kpi-value">{{ kpis.ordenesEnProceso || 0 }}</span>
          <span class="kpi-label">En Proceso</span>
        </div>
        <div class="kpi-card highlight-green">
          <span class="kpi-value">{{ kpis.ordenesListas || 0 }}</span>
          <span class="kpi-label">Listas para Entrega</span>
        </div>
        <div class="kpi-card highlight-red">
          <span class="kpi-value">{{ kpis.ordenesAtrasadas || 0 }}</span>
          <span class="kpi-label">Atrasadas</span>
        </div>
        <div class="kpi-card highlight-orange">
          <span class="kpi-value">{{ kpis.ordenesSinReclamar || 0 }}</span>
          <span class="kpi-label">Sin Reclamar</span>
        </div>
        <div class="kpi-card highlight-danger">
          <span class="kpi-value">${{ kpis.saldosPendientes || 0 }}</span>
          <span class="kpi-label">Pagos Pendientes</span>
        </div>
      </div>

      <!-- Próximas Entregas -->
      <div class="recent-orders section">
        <div class="section-header">
          <h3 class="headline-sm">Próximas entregas</h3>
          <button class="btn-ghost btn-small" @click="router.push('/ordenes')">Ver todas</button>
        </div>

        <div v-if="proximasEntregas.length === 0" class="empty-state card">
          <p class="body-md">No hay entregas próximas.</p>
        </div>

        <transition-group name="stagger" tag="div" v-else class="ordenes-list stagger-list">
          <div class="list-card" v-for="orden in proximasEntregas" :key="orden.id_orden" @click="goToDetail(orden.id_orden)">
             <div class="list-card-content">
                <div class="list-card-title">{{ orden.cliente_nombre }}</div>
                <div class="list-card-subtitle">Entrega: {{ formatDate(orden.fecha_entrega_estimada) }}</div>
             </div>
             <div class="badge" :class="getBadgeClass(orden.id_estado_orden)">{{ orden.estado_nombre }}</div>
          </div>
        </transition-group>
      </div>

      <!-- Actividad Reciente -->
      <div class="recent-orders section">
        <div class="section-header">
          <h3 class="headline-sm">Actividad reciente</h3>
        </div>

        <div v-if="ordenesRecientes.length === 0" class="empty-state card">
          <p class="body-md">No hay actividad reciente.</p>
        </div>

        <transition-group name="stagger" tag="div" v-else class="ordenes-list stagger-list">
          <div class="list-card" v-for="orden in ordenesRecientes" :key="orden.id_orden" @click="goToDetail(orden.id_orden)">
             <div class="list-card-content">
                <div class="list-card-title">Nueva orden: {{ orden.cliente_nombre }}</div>
                <div class="list-card-subtitle">Creada: {{ formatDate(orden.fecha_creacion) }}</div>
             </div>
             <div class="badge" :class="getBadgeClass(orden.id_estado_orden)">{{ orden.estado_nombre }}</div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useReportes } from '../composables/useReportes.js';
import { useNotificaciones } from '../composables/useNotificaciones.js';
import { useNotificacionesLocales } from '../composables/useNotificacionesLocales.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';

const router = useRouter();
const toast = inject('toast');
const { kpis, proximasEntregas, ordenesRecientes, loading, fetchDashboardData } = useReportes();
const { loading: notifLoading, triggerRecordatorios } = useNotificaciones();
const { requestPermissions, scheduleDailyReminders } = useNotificacionesLocales();

onMounted(async () => {
  await fetchDashboardData();
  
  // Set up native background tasks
  await requestPermissions();
  await scheduleDailyReminders();
});

async function enviarRecordatorios() {
  const count = await triggerRecordatorios();
  if (count > 0) {
    toast(`Se enviaron ${count} recordatorios automáticos.`, 'success');
  } else {
    toast('No hay nuevas órdenes pendientes de recordar hoy.', 'info');
  }
}

function goToDetail(id) {
  router.push(`/ordenes/${id}`);
}

function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    try {
        const date = new Date(dateString);
        return format(date, 'd MMM, yyyy', { locale: es });
    } catch(e) {
        return dateString;
    }
}

function getBadgeClass(idEstado) {
    switch(idEstado) {
        case 1: return 'badge-neutral'; // Recibida
        case 2: return 'badge-warning'; // En Proceso
        case 3: return 'badge-warning'; // Prueba
        case 4: return 'badge-success'; // Lista
        case 5: return 'badge-info'; // Entregada
        case 6: return 'badge-error'; // Cancelada
        default: return 'badge-neutral';
    }
}
</script>

<style scoped>
.dashboard-view {
  padding: 24px 16px 80px 16px;
}
.header {
  margin-bottom: 24px;
}
.header h2 {
  color: var(--on-surface);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}
.kpi-card {
  background-color: var(--surface-container-lowest);
  border: 1px solid var(--surface-container-high);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: var(--shadow-level-1);
}
.kpi-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--on-surface-variant);
  margin-top: 4px;
}
.kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--on-surface);
}

/* KPI Highlights mapping closely to the screenshot */
.highlight-blue { border-left: 4px solid var(--info-color); }
.highlight-blue .kpi-value { color: var(--info-text); }

.highlight-yellow { border-left: 4px solid var(--warning-color); }
.highlight-yellow .kpi-value { color: var(--warning-text); }

.highlight-green { border-left: 4px solid var(--success-color); }
.highlight-green .kpi-value { color: var(--success-text); }

.highlight-red { border-left: 4px solid var(--error); }
.highlight-red .kpi-value { color: var(--error); }

.highlight-orange { border-left: 4px solid #f97316; }
.highlight-orange .kpi-value { color: #c2410c; }

.highlight-danger { border-left: 4px solid var(--error-text); }
.highlight-danger .kpi-value { color: var(--error-text); }


.section {
  margin-bottom: 32px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h3 {
  color: var(--on-surface);
}

.ordenes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--surface-container-high);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.list-card:hover {
  background: var(--surface-container-low);
  border-color: var(--outline-variant);
}

.list-card-content {
  display: flex;
  flex-direction: column;
}
.list-card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--on-surface);
}
.list-card-subtitle {
  font-size: 12px;
  color: var(--on-surface-variant);
  margin-top: 2px;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--on-surface-variant);
}

/* Specific Badge Colors */
.badge-neutral { background: var(--surface-dim); color: var(--on-surface-variant); }
.badge-warning { background: var(--warning-bg); color: var(--warning-text); }
.badge-success { background: var(--success-bg); color: var(--success-text); }
.badge-info { background: var(--info-bg); color: var(--info-text); }
.badge-error { background: var(--error-container); color: var(--on-error-container); }
</style>
