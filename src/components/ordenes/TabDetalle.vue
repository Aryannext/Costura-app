<template>
  <div>
    <div class="card">
      <div class="fechas">
        <p><strong>Recibida:</strong> {{ formatDate(orden.fecha_creacion) }}</p>
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
        <!-- Reabrir vuelve a En Proceso (RN-16), no a Pendiente -->
        <button class="btn-secondary" @click="$emit('cambiar-estado', 2, 'En Proceso')">Reabrir Orden</button>
      </div>

      <!-- Avisos al cliente: abren WhatsApp con el mensaje escrito; la modista pulsa Enviar -->
      <div class="aviso-actions" v-if="orden.id_estado_orden !== 5">
        <button v-if="orden.id_estado_orden <= 2" class="btn-small whatsapp-btn" @click="$emit('avisar-whatsapp', 'RECIBIDA')">
          WhatsApp: recibimos tu ropa
        </button>
        <button v-if="orden.id_estado_orden === 3" class="btn-small whatsapp-btn" @click="$emit('avisar-whatsapp', 'LISTA_ENTREGA')">
          WhatsApp: tu orden está lista
        </button>
        <button v-if="orden.saldo_pendiente > 0" class="btn-small whatsapp-btn" @click="$emit('avisar-whatsapp', 'RECORDATORIO_PAGO')">
          WhatsApp: recordar saldo
        </button>
        <button class="btn-small" @click="$emit('generar-recibo-nativo')">Compartir recibo</button>
        <button class="btn-small btn-secondary" @click="$emit('generar-recibo')">Copia del recibo a mi Telegram</button>
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
          <span class="desc"><strong>{{ notif.tipo_nombre }}:</strong> {{ notif.mensaje }}</span>
        </li>
      </ul>
      <p v-else class="empty-mini">Todavía no se han preparado avisos.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  orden: { type: Object, required: true },
  historial: { type: Array, default: () => [] },
  notificaciones: { type: Array, default: () => [] }
});

const emit = defineEmits(['cambiar-estado', 'avisar-whatsapp', 'generar-recibo', 'generar-recibo-nativo']);

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
.aviso-actions { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--surface-container-highest); }
.aviso-actions button { min-height: 48px; font-size: 1rem; }
.whatsapp-btn { background-color: #25D366; color: #0b3d1f; border: none; font-weight: 600; }
.historial-section { margin-top: 16px; }
.historial-section h3 { margin-bottom: 12px; color: var(--on-surface); }
.timeline { list-style: none; padding: 0; margin: 0; }
.timeline li { padding: 10px 0; border-bottom: 1px solid var(--surface-container-highest); display: flex; flex-direction: column; }
.timeline .time { font-size: 0.8rem; color: var(--primary); margin-bottom: 4px; font-weight: 500; }
.timeline .desc { color: var(--on-surface-variant); }
</style>
