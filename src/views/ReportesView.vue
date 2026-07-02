<template>
  <div class="reportes-view">
    <div class="header">
      <h2 class="display-sm">Inteligencia Financiera</h2>
      <p class="body-md">Analiza el rendimiento de tu taller.</p>
    </div>

    <!-- Filtros -->
    <div class="card filters-card">
      <div class="quick-filters">
        <button class="btn-ghost btn-small" :class="{'active-filter': filterType === 'hoy'}" @click="setFilter('hoy')">Hoy</button>
        <button class="btn-ghost btn-small" :class="{'active-filter': filterType === 'semana'}" @click="setFilter('semana')">Esta Semana</button>
        <button class="btn-ghost btn-small" :class="{'active-filter': filterType === 'mes'}" @click="setFilter('mes')">Este Mes</button>
        <button class="btn-ghost btn-small" :class="{'active-filter': filterType === 'custom'}" @click="setFilter('custom')">Personalizado</button>
      </div>

      <div class="custom-dates" v-if="filterType === 'custom'">
        <div class="filter-group">
          <label>Inicio</label>
          <input type="date" class="input-field" v-model="fechaInicio" />
        </div>
        <div class="filter-group">
          <label>Fin</label>
          <input type="date" class="input-field" v-model="fechaFin" />
        </div>
      </div>

      <button class="btn-primary" @click="generarReporte" :disabled="loading">
        {{ loading ? 'Analizando...' : 'Generar Reporte' }}
      </button>
    </div>

    <!-- Resultados -->
    <div class="report-content" v-if="reporteGenerado">
      <!-- KPIs Grid -->
      <div class="kpi-grid">
        <div class="kpi-card highlight-green">
          <span class="kpi-value">${{ reporteData.kpis.ingresosTotales.toLocaleString() }}</span>
          <span class="kpi-label">Ingresos Totales</span>
        </div>
        <div class="kpi-card highlight-blue">
          <span class="kpi-value">{{ reporteData.kpis.ordenesNuevas }}</span>
          <span class="kpi-label">Órdenes Nuevas</span>
        </div>
        <div class="kpi-card highlight-orange">
          <span class="kpi-value">{{ reporteData.kpis.prendasProcesadas }}</span>
          <span class="kpi-label">Prendas Procesadas</span>
        </div>
        <div class="kpi-card highlight-purple">
          <span class="kpi-value">${{ parseFloat(reporteData.kpis.ticketPromedio).toLocaleString() }}</span>
          <span class="kpi-label">Ticket Promedio</span>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <div class="chart-card card">
          <h4>Ingresos a través del tiempo</h4>
          <div class="chart-wrapper">
            <LineChart v-if="lineChartData" :data="lineChartData" :options="lineOptions" />
            <div v-else class="empty-chart">No hay datos de ingresos en este período</div>
          </div>
        </div>
        
        <div class="chart-card card">
          <h4>Distribución de Órdenes</h4>
          <div class="chart-wrapper">
            <DoughnutChart v-if="doughnutChartData" :data="doughnutChartData" :options="doughnutOptions" />
            <div v-else class="empty-chart">No hay órdenes registradas en este período</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getReporteFinanciero } from '../database/queries/reportes.js';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line as LineChart, Doughnut as DoughnutChart } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const filterType = ref('mes');
const fechaInicio = ref('');
const fechaFin = ref('');
const loading = ref(false);
const reporteGenerado = ref(false);
const reporteData = ref(null);

function setFilter(type) {
  filterType.value = type;
  const now = new Date();
  
  if (type === 'hoy') {
    fechaInicio.value = format(startOfDay(now), 'yyyy-MM-dd');
    fechaFin.value = format(endOfDay(now), 'yyyy-MM-dd');
  } else if (type === 'semana') {
    // startOfWeek starts on Sunday by default.
    fechaInicio.value = format(startOfWeek(now, {weekStartsOn: 1}), 'yyyy-MM-dd');
    fechaFin.value = format(endOfDay(now), 'yyyy-MM-dd');
  } else if (type === 'mes') {
    fechaInicio.value = format(startOfMonth(now), 'yyyy-MM-dd');
    fechaFin.value = format(endOfDay(now), 'yyyy-MM-dd');
  }
}

onMounted(() => {
  setFilter('mes');
  generarReporte();
});

async function generarReporte() {
  if (!fechaInicio.value || !fechaFin.value) {
    alert("Por favor selecciona ambas fechas.");
    return;
  }
  
  if (new Date(fechaInicio.value) > new Date(fechaFin.value)) {
    alert("La fecha de inicio no puede ser mayor que la fecha fin.");
    return;
  }

  loading.value = true;
  try {
    reporteData.value = await getReporteFinanciero(fechaInicio.value, fechaFin.value);
    reporteGenerado.value = true;
  } catch (e) {
    console.error(e);
    alert("Error al generar el reporte.");
  } finally {
    loading.value = false;
  }
}

// Chart Computed Properties
const lineChartData = computed(() => {
  if (!reporteData.value || reporteData.value.graficos.ingresosPorDia.labels.length === 0) return null;
  return {
    labels: reporteData.value.graficos.ingresosPorDia.labels,
    datasets: [
      {
        label: 'Ingresos Diarios',
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        data: reporteData.value.graficos.ingresosPorDia.data,
        tension: 0.3,
        fill: false
      }
    ]
  };
});

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
};

const doughnutChartData = computed(() => {
  if (!reporteData.value || reporteData.value.graficos.estadoOrdenes.labels.length === 0) return null;
  
  // Dynamic colors based on standard status names
  const colors = reporteData.value.graficos.estadoOrdenes.labels.map(l => {
    if (l.includes('Entregada')) return '#10b981';
    if (l.includes('Cancelada')) return '#ef4444';
    if (l.includes('Lista')) return '#3b82f6';
    return '#f59e0b'; // En Proceso / Pendiente
  });

  return {
    labels: reporteData.value.graficos.estadoOrdenes.labels,
    datasets: [
      {
        backgroundColor: colors,
        data: reporteData.value.graficos.estadoOrdenes.data
      }
    ]
  };
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false
};

</script>

<style scoped>
.reportes-view {
  padding: 24px 16px 80px 16px;
}
.header {
  margin-bottom: 24px;
}

.filters-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.quick-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

.active-filter {
  background-color: var(--primary-container) !important;
  color: var(--on-primary-container) !important;
  border-color: var(--primary-container) !important;
}

.custom-dates {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.kpi-card {
  background-color: var(--surface-container-lowest);
  border: 1px solid var(--surface-container-high);
  border-radius: var(--radius-lg);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: var(--shadow-level-1);
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--on-surface);
}

.kpi-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--on-surface-variant);
  margin-top: 4px;
}

.highlight-green { border-bottom: 4px solid var(--success-color); }
.highlight-blue { border-bottom: 4px solid #3b82f6; }
.highlight-orange { border-bottom: 4px solid #f59e0b; }
.highlight-purple { border-bottom: 4px solid #8b5cf6; }

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .charts-grid { grid-template-columns: 1fr 1fr; }
}

.chart-card {
  padding: 16px;
}

.chart-card h4 {
  margin: 0 0 16px 0;
  color: var(--on-surface);
  text-align: center;
}

.chart-wrapper {
  position: relative;
  height: 250px;
  width: 100%;
}

.empty-chart {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-secondary);
  font-size: 14px;
  font-style: italic;
}
</style>
