<template>
  <div class="dashboard-view">
    <header class="hoy">
      <h2>Hoy en el taller</h2>
      <span class="hoy-fecha">{{ fechaHoy }}</span>
    </header>

    <!-- Buscador Global -->
    <div class="global-search-container">
      <div class="search-input-wrapper">
        <Icon name="search" className="search-icon icon-sm" />
        <input
          type="text"
          class="input-field global-search-input"
          v-model="globalQuery"
          @input="performSearch"
          placeholder="Buscar cliente, teléfono o # de orden"
        />
      </div>
    </div>

    <div v-if="globalQuery" class="search-results">
      <div v-if="searchLoading" class="loading-state pt-4">
        <SkeletonLoader :count="3" height="60px" />
      </div>
      <div v-else>
        <div class="grupo" v-if="searchResults.clientes.length > 0">
          <h3 class="grupo-t">Clientes</h3>
          <div class="card lista">
            <button class="fila" v-for="c in searchResults.clientes" :key="c.id_cliente" @click="router.push(`/clientes/${c.id_cliente}`)">
              <span class="fila-t"><b>{{ c.nombre }}</b><small>{{ c.telefono || 'Sin teléfono' }}</small></span>
            </button>
          </div>
        </div>

        <div class="grupo" v-if="searchResults.ordenes.length > 0">
          <h3 class="grupo-t">Órdenes</h3>
          <div class="card lista">
            <button class="fila" v-for="o in searchResults.ordenes" :key="o.id_orden" @click="goToDetail(o.id_orden)">
              <span class="fila-t"><b>{{ o.cliente_nombre }} · #{{ o.id_orden }}</b></span>
              <StatusBadge :estado="o.estado_nombre" />
            </button>
          </div>
        </div>

        <div v-if="searchResults.clientes.length === 0 && searchResults.ordenes.length === 0" class="card vacio">
          No se encontraron resultados para "{{ globalQuery }}"
        </div>
      </div>
    </div>

    <div v-else>
      <div v-if="loading" class="loading-state pt-4">
        <SkeletonLoader :count="4" height="80px" />
      </div>

      <!-- En vez de seis cifras, lo que hay que hacer hoy, de lo más urgente a lo menos -->
      <div v-else class="dashboard-content">
        <!-- HU-36: la cifra lleva a la lista de órdenes que la componen -->
        <button class="card por-cobrar kpi-card--enlace" @click="irAPorCobrar">
          <span class="por-cobrar-t">
            <small>Por cobrar</small>
            <span class="por-cobrar-valor">
              <b class="kpi-value">{{ formatearMoneda(kpis.saldosPendientes) }}</b>
              <small v-if="kpis.ordenesPorCobrar">en {{ plural(kpis.ordenesPorCobrar, 'orden', 'órdenes') }}</small>
            </span>
          </span>
          <svg class="ic chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>
        </button>

        <section v-if="atrasadas.length > 0" class="grupo grupo--atrasadas">
          <h3 class="grupo-t"><i class="punto punto--error"></i>Atrasadas<span class="cuenta">{{ kpis.ordenesAtrasadas }}</span></h3>
          <div class="card lista">
            <button class="fila" v-for="orden in atrasadas" :key="orden.id_orden" @click="goToDetail(orden.id_orden)">
              <span class="fila-t">
                <b>{{ orden.cliente_nombre }} · #{{ orden.id_orden }}</b>
                <small class="texto-error">Debía entregarse el {{ fechaCorta(orden.fecha_entrega_estimada) }}</small>
              </span>
              <StatusBadge :estado="orden.estado_nombre" />
            </button>
          </div>
        </section>

        <section class="grupo grupo--proximas">
          <h3 class="grupo-t"><i class="punto punto--info"></i>Para entregar pronto<span class="cuenta">{{ proximasEntregas.length }}</span></h3>
          <div v-if="proximasEntregas.length === 0" class="card vacio">No hay entregas próximas.</div>
          <div v-else class="card lista">
            <button class="fila" v-for="orden in proximasEntregas" :key="orden.id_orden" @click="goToDetail(orden.id_orden)">
              <span class="fila-t">
                <b>{{ orden.cliente_nombre }} · #{{ orden.id_orden }}</b>
                <small>Entrega: {{ etiquetaDia(orden.fecha_entrega_estimada) }}<template v-if="orden.saldo_pendiente > 0"> · debe {{ formatearMoneda(orden.saldo_pendiente) }}</template></small>
              </span>
              <StatusBadge :estado="orden.estado_nombre" />
            </button>
          </div>
        </section>

        <section v-if="kpis.ordenesListas > 0" class="grupo grupo--listas">
          <h3 class="grupo-t"><i class="punto punto--ok"></i>Listas, esperando al cliente<span class="cuenta">{{ kpis.ordenesListas }}</span></h3>
          <div class="card listas">
            <span class="fila-t">
              <b>{{ plural(kpis.ordenesListas, 'orden lista', 'órdenes listas') }}</b>
              <small v-if="kpis.ordenesSinReclamar > 0">{{ plural(kpis.ordenesSinReclamar, 'lleva', 'llevan') }} más de {{ kpis.diasSinReclamar }} días sin que la recojan</small>
              <small v-else>{{ kpis.ordenesListas === 1 ? 'Espera que el cliente pase a recogerla' : 'Esperan que los clientes pasen a recogerlas' }}</small>
            </span>
            <button class="btn-recordar" @click="enviarRecordatorios" :disabled="notifLoading">
              <svg class="ic" viewBox="0 0 24 24"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4z"></path></svg>
              {{ notifLoading ? 'Enviando...' : (kpis.ordenesListas === 1 ? 'Recordar al cliente' : `Recordar a los ${kpis.ordenesListas} clientes`) }}
            </button>
          </div>
        </section>
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
import { useSearch } from '../composables/useSearch.js';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import Icon from '../components/common/Icon.vue';
// P1-13: el mapa propio de colores estaba desplazado en uno (4 se pintaba como
// Lista, 5 como Entregada). StatusBadge colorea por nombre, igual que el resto.
import StatusBadge from '../components/common/StatusBadge.vue';
import { formatearMoneda } from '../services/formato.js';
import { fechaCorta, fechaLarga, etiquetaDia } from '../services/fechas.js';

const router = useRouter();
const toast = inject('toast');
const { kpis, atrasadas, proximasEntregas, loading, fetchDashboardData } = useReportes();
const { loading: notifLoading, triggerRecordatorios } = useNotificaciones();
const { requestPermissions, scheduleDailyReminders } = useNotificacionesLocales();

// Búsqueda Global (Delegada al composable para DIP)
const { globalQuery, searchLoading, searchResults, performSearch } = useSearch();

const fechaHoy = fechaLarga(new Date());

onMounted(async () => {
  try {
    await fetchDashboardData();
  } catch (err) {
    // Error is handled natively by useAsyncAction
  }
  // Set up native background tasks
  await requestPermissions();
  await scheduleDailyReminders();
});

/** "1 orden", "3 órdenes". */
function plural(n, singular, varios) {
  return `${n} ${n === 1 ? singular : varios}`;
}

async function enviarRecordatorios() {
  try {
    const count = await triggerRecordatorios();
    if (count > 0) {
      toast(`Te llegó a Telegram la lista de ${count} cliente(s) para recordar por WhatsApp.`, 'success');
    } else {
      toast('Ya se les recordó hoy a estos clientes.', 'info');
    }
  } catch (err) {
    // El composable ya mostró el error
  }
}

function goToDetail(id) {
  router.push(`/ordenes/${id}`);
}

function irAPorCobrar() {
  router.push({ path: '/ordenes', query: { tab: 'por-cobrar' } });
}
</script>

<style scoped>
.dashboard-view {
  padding: 20px 16px 80px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pt-4 { padding-top: 8px; }
.icon-sm { width: 20px; height: 20px; }
.ic { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.card { margin: 0; }

.hoy { display: flex; flex-direction: column; gap: 2px; }
.hoy h2 { margin: 0; font-size: 24px; line-height: 30px; font-weight: 700; letter-spacing: -0.03em; color: var(--on-surface); }
.hoy-fecha { font-size: 14px; color: var(--on-surface-variant); }

.search-input-wrapper { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 16px; color: var(--on-surface-variant); }
.global-search-input {
  width: 100%;
  font-size: 16px;
  padding: 12px 16px 12px 44px;
  border-radius: var(--radius-lg);
  background-color: var(--surface-container-lowest);
  border: 1px solid var(--surface-container-high);
  box-shadow: var(--shadow-level-1);
}
.global-search-input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }

.dashboard-content, .search-results > div { display: flex; flex-direction: column; gap: 20px; }

.por-cobrar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface-container-lowest);
  color: var(--on-surface);
  text-align: left;
  font-weight: 400;
}
.por-cobrar:hover:not(:disabled) { background: var(--surface-container-low); transform: none; box-shadow: var(--shadow-level-1); }
.kpi-card--enlace { cursor: pointer; }
.por-cobrar-t { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.por-cobrar-t > small { font-size: 13px; font-weight: 500; color: var(--on-surface-variant); }
.por-cobrar-valor { display: flex; align-items: baseline; gap: 8px; }
.por-cobrar-valor small { font-size: 13px; color: var(--on-surface-variant); }
.kpi-value { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
.chevron { color: var(--outline); }

.grupo { display: flex; flex-direction: column; gap: 8px; }
.grupo-t { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--on-surface-variant); }
.punto { width: 8px; height: 8px; border-radius: 4px; flex: none; }
.punto--error { background: var(--error); }
.punto--info { background: var(--info-color); }
.punto--ok { background: var(--success-color); }
.cuenta { margin-left: auto; font-size: 12px; color: var(--outline); font-variant-numeric: tabular-nums; }

.lista { padding: 0; overflow: hidden; }
.fila {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 12px 16px;
  background: transparent;
  color: var(--on-surface);
  border-radius: 0;
  text-align: left;
  font-weight: 400;
}
.fila + .fila { border-top: 1px solid var(--surface-container-high); }
.fila:hover:not(:disabled) { background: var(--surface-container-low); transform: none; box-shadow: none; }
.fila-t { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.fila-t b { font-size: 15px; font-weight: 600; }
.fila-t small { font-size: 12px; color: var(--on-surface-variant); }
.texto-error { color: var(--error) !important; }

.listas { display: flex; flex-direction: column; gap: 12px; }
.btn-recordar { display: flex; align-items: center; justify-content: center; gap: 8px; background: transparent; border: 1px solid var(--outline-variant); color: var(--primary); }
.btn-recordar:hover:not(:disabled) { background: var(--surface-container-low); box-shadow: none; transform: none; }

.vacio { text-align: center; padding: 24px; color: var(--on-surface-variant); font-size: 14px; }
</style>
