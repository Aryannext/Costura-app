<template>
  <div>
    <div class="card">
      <div class="fechas">
        <p><strong>Creación:</strong> {{ formatDate(orden.fecha_creacion) }}</p>
        <p><strong>Entrega Estimada:</strong> {{ formatDate(orden.fecha_entrega_estimada) }}</p>
        <p v-if="orden.fecha_entrega_real"><strong>Entrega Real:</strong> {{ formatDate(orden.fecha_entrega_real) }}</p>
      </div>

      <div class="estado-actions" v-if="orden.id_estado_orden !== 4 && orden.id_estado_orden !== 5">
        <button v-if="orden.id_estado_orden === 1" @click="$emit('cambiar-estado', 2, 'En Proceso')">Iniciar Proceso</button>
        <button v-if="orden.id_estado_orden === 2" @click="$emit('cambiar-estado', 3, 'Lista para Entregar')">Marcar Lista</button>
        <button v-if="orden.id_estado_orden === 3" @click="$emit('cambiar-estado', 4, 'Entregada')">Entregar</button>
        <button class="btn-danger" @click="$emit('cambiar-estado', 5, 'Cancelada')">Cancelar Orden</button>
      </div>
      <div class="estado-actions" v-if="orden.id_estado_orden === 4">
        <button class="btn-secondary" @click="$emit('cambiar-estado', 1, 'Pendiente')">Reabrir Orden</button>
      </div>

      <div class="telegram-actions">
        <button class="btn-small telegram-btn" @click="$emit('notificar-telegram', 'LISTA_ENTREGA')">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          Avisar Lista
        </button>
        <button 
          class="btn-small telegram-btn" 
          @click="$emit('notificar-telegram', 'RECORDATORIO_PAGO')" 
          v-if="orden.saldo_pendiente > 0"
        >
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          Recordar Pago
        </button>
        
        <button 
          class="btn-primary" 
          @click="$emit('generar-recibo')"
        >
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="display:inline; width:18px; margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Recibo (Telegram)
        </button>

        <button 
          class="btn-primary" 
          style="background-color: var(--primary);" 
          @click="$emit('generar-recibo-nativo')"
        >
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="display:inline; width:18px; margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
          Compartir Recibo
        </button>
      </div>
    </div>

    <div class="historial-section">
      <h3>Historial de Actividad</h3>
      <ul class="timeline" v-if="historial && historial.length > 0">
        <li v-for="item in historial" :key="'act-'+item.id_actividad">
          <span class="time">{{ formatTime(item.fecha_hora) }}</span>
          <span class="desc">{{ item.descripcion }}</span>
        </li>
      </ul>
    </div>

    <div class="historial-section" style="margin-top: 24px;">
      <h3>Historial de Notificaciones</h3>
      <ul class="timeline" v-if="notificaciones && notificaciones.length > 0">
        <li v-for="notif in notificaciones" :key="'notif-'+notif.id_notificacion">
          <span class="time">{{ formatTime(notif.fecha_envio) }}</span>
          <span class="desc"><strong>Telegram ({{ notif.tipo_nombre }}):</strong> {{ notif.mensaje }}</span>
        </li>
      </ul>
      <p v-else class="empty-mini">No se han enviado notificaciones.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  orden: { type: Object, required: true },
  historial: { type: Array, default: () => [] },
  notificaciones: { type: Array, default: () => [] }
});

const emit = defineEmits(['cambiar-estado', 'notificar-telegram', 'generar-recibo', 'generar-recibo-nativo']);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const dateOnly = dateStr.split('T')[0].split(' ')[0];
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString();
}
</script>

<style scoped>
.fechas p { margin: 4px 0; color: var(--on-surface-variant); }
.fechas p strong { color: var(--on-surface); }
.estado-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; border-top: 1px solid var(--surface-container-highest); padding-top: 16px; }
.btn-danger { background-color: var(--error); color: var(--on-error); }
.btn-secondary { background-color: transparent; border: 1px solid var(--outline-variant); color: var(--on-surface); }
.telegram-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--surface-container-highest); }
.telegram-btn { background-color: #2AABEE; color: white; border: none; }
.historial-section { margin-top: 16px; }
.historial-section h3 { margin-bottom: 12px; color: var(--on-surface); }
.timeline { list-style: none; padding: 0; margin: 0; }
.timeline li { padding: 10px 0; border-bottom: 1px solid var(--surface-container-highest); display: flex; flex-direction: column; }
.timeline .time { font-size: 0.8rem; color: var(--primary); margin-bottom: 4px; font-weight: 500; }
.timeline .desc { color: var(--on-surface-variant); }
</style>
