<template>
  <div class="tab-detalle">
    <!-- Siguiente paso: una sola acción principal, según el estado -->
    <section v-if="orden.id_estado_orden === 3" class="card paso">
      <span class="paso-estado paso-estado--ok">
        <svg class="ic ic16" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
        Todas las prendas están terminadas
      </span>
      <button class="btn-principal" @click="$emit('cambiar-estado', 4, 'Entregada')">
        <svg class="ic" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"></path><path d="M3 8l9 5 9-5"></path><path d="M12 13v8"></path></svg>
        Entregar orden
      </button>
      <span v-if="orden.saldo_pendiente > 0" class="paso-nota">
        El cliente aún debe {{ formatearMoneda(orden.saldo_pendiente) }}: te pediremos confirmar antes de entregar.
      </span>
    </section>

    <!-- RN-06 y RN-17: el estado avanza solo según las prendas -->
    <p v-else-if="orden.id_estado_orden === 1 || orden.id_estado_orden === 2" class="estado-ayuda">
      El estado avanza solo: la orden pasa a <strong>Lista para Entregar</strong> cuando todas sus prendas estén terminadas.
    </p>

    <section v-else-if="orden.id_estado_orden === 4" class="card paso">
      <span class="paso-estado">
        <svg class="ic ic16" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
        Entregada el {{ fechaCorta(orden.fecha_entrega_real) }}
      </span>
      <button class="btn-secundario" @click="$emit('cambiar-estado', 2, 'En Proceso')">Reabrir orden</button>
      <span class="paso-nota">Vuelve a En Proceso para corregir lo que haga falta.</span>
    </section>

    <!-- Avisos y recibos: una lista con nombre, en vez de cuatro botones de estilos distintos -->
    <section class="card lista">
      <template v-if="puedeAvisarLista || debeAlgo">
        <h3 class="grupo">Avisar al cliente</h3>
        <!-- RN-31: el aviso de orden lista sólo con la orden Lista para Entregar -->
        <button v-if="puedeAvisarLista" class="fila" @click="$emit('notificar-telegram', 'LISTA_ENTREGA')">
          <span class="fila-ic"><svg class="ic" viewBox="0 0 24 24"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4z"></path></svg></span>
          <span class="fila-t"><b>Avisar que está lista</b><small>Te llega a Telegram con el WhatsApp listo</small></span>
          <svg class="ic chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>
        </button>
        <button v-if="debeAlgo" class="fila" @click="$emit('notificar-telegram', 'RECORDATORIO_PAGO')">
          <span class="fila-ic"><svg class="ic" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2.5"></circle></svg></span>
          <span class="fila-t"><b>Recordar el pago</b><small>Debe {{ formatearMoneda(orden.saldo_pendiente) }}</small></span>
          <svg class="ic chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>
        </button>
      </template>

      <h3 class="grupo">Recibo</h3>
      <button class="fila" @click="$emit('generar-recibo')">
        <span class="fila-ic"><svg class="ic" viewBox="0 0 24 24"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"></path><path d="M9 7h6"></path><path d="M9 11h6"></path><path d="M9 15h4"></path></svg></span>
        <span class="fila-t"><b>Enviarme el recibo</b><small>Te llega a tu chat de Telegram</small></span>
        <svg class="ic chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>
      </button>
      <button class="fila" @click="$emit('generar-recibo-nativo')">
        <span class="fila-ic"><svg class="ic" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.6 13.5l6.8 4"></path><path d="M15.4 6.5l-6.8 4"></path></svg></span>
        <span class="fila-t"><b>Compartir recibo</b><small>WhatsApp, correo u otra app</small></span>
        <svg class="ic chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>
      </button>
    </section>

    <div class="historial-section">
      <h3>Historial de Actividad</h3>
      <ul class="timeline" v-if="historial && historial.length > 0">
        <li v-for="item in historial" :key="'act-'+item.id_actividad">
          <span class="time">{{ formatTime(item.fecha_hora) }}</span>
          <span class="desc">{{ item.descripcion }}</span>
        </li>
      </ul>
    </div>

    <div class="historial-section">
      <h3>Historial de Notificaciones</h3>
      <ul class="timeline" v-if="notificaciones && notificaciones.length > 0">
        <li v-for="notif in notificaciones" :key="'notif-'+notif.id_notificacion">
          <span class="time">{{ formatTime(notif.fecha_envio) }}</span>
          <span class="desc"><strong>Telegram ({{ notif.tipo_nombre }}):</strong> {{ notif.mensaje }}</span>
        </li>
      </ul>
      <p v-else class="empty-mini">No se han enviado notificaciones.</p>
    </div>

    <!-- Cancelar queda al final, lejos de la acción principal -->
    <section v-if="orden.id_estado_orden >= 1 && orden.id_estado_orden <= 3" class="zona-cancelar">
      <button class="btn-cancelar" @click="$emit('cambiar-estado', 5, 'Cancelada')">
        <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M5.6 5.6l12.8 12.8"></path></svg>
        Cancelar orden
      </button>
      <span>No admite más prendas ni pagos. Los pagos registrados se conservan.</span>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatearMoneda } from '../../services/formato.js';
import { fechaCorta } from '../../services/fechas.js';

const props = defineProps({
  orden: { type: Object, required: true },
  historial: { type: Array, default: () => [] },
  notificaciones: { type: Array, default: () => [] }
});

defineEmits(['cambiar-estado', 'notificar-telegram', 'generar-recibo', 'generar-recibo-nativo']);

const puedeAvisarLista = computed(() => props.orden.id_estado_orden === 3);
const debeAlgo = computed(() => props.orden.saldo_pendiente > 0 && props.orden.id_estado_orden !== 5);

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString();
}
</script>

<style scoped>
.tab-detalle { display: flex; flex-direction: column; gap: 16px; }
.card { margin: 0; }
.ic { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.ic16 { width: 16px; height: 16px; }

.paso { display: flex; flex-direction: column; gap: 10px; }
.paso-estado { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--on-surface-variant); }
.paso-estado--ok { color: var(--success-text); }
.paso-nota { font-size: 12px; color: var(--on-surface-variant); }
.btn-principal { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 600; }
.btn-secundario { width: 100%; background: transparent; border: 1px solid var(--outline-variant); color: var(--primary); }
.btn-secundario:hover:not(:disabled) { background: var(--surface-container-low); box-shadow: none; transform: none; }
.estado-ayuda { margin: 0; padding: 10px 12px; border-radius: var(--radius-md); background: var(--info-bg); color: var(--info-text); font-size: 13px; line-height: 1.4; }

.lista { padding: 0; overflow: hidden; }
.grupo { margin: 0; padding: 14px 16px 8px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--outline); }
.grupo + .fila, .fila + .fila { border-top: 1px solid var(--surface-container-high); }
.fila + .grupo { border-top: 1px solid var(--surface-container-high); }
.fila {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 10px 16px;
  background: transparent;
  color: var(--on-surface);
  border-radius: 0;
  text-align: left;
  font-weight: 400;
}
.fila:hover:not(:disabled) { background: var(--surface-container-low); transform: none; box-shadow: none; }
.fila-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--surface-container); color: var(--primary); display: flex; align-items: center; justify-content: center; flex: none; }
.fila-t { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.fila-t b { font-size: 15px; font-weight: 500; }
.fila-t small { font-size: 12px; color: var(--on-surface-variant); }
.chevron { color: var(--outline); }

.historial-section h3 { margin: 0 0 12px; font-size: 17px; color: var(--on-surface); }
.timeline { list-style: none; padding: 0; margin: 0; }
.timeline li { padding: 10px 0; border-bottom: 1px solid var(--surface-container-highest); display: flex; flex-direction: column; }
.timeline .time { font-size: 0.8rem; color: var(--primary); margin-bottom: 4px; font-weight: 500; }
.timeline .desc { color: var(--on-surface-variant); }
.empty-mini { margin: 0; font-size: 13px; color: var(--on-surface-variant); }

.zona-cancelar { display: flex; flex-direction: column; gap: 2px; padding-bottom: 8px; }
.zona-cancelar span { font-size: 12px; color: var(--on-surface-variant); }
.btn-cancelar {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  background: transparent;
  color: var(--error);
  font-size: 15px;
  font-weight: 600;
}
.btn-cancelar:hover:not(:disabled) { background: transparent; box-shadow: none; transform: none; text-decoration: underline; }
</style>
