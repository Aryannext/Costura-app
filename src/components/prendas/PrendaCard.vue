<template>
  <div class="card prenda-card">
    <div class="prenda-top">
      <div class="prenda-titulo">
        <h4>{{ prenda.tipo_nombre }}</h4>
        <p class="desc" v-if="!isEditing">{{ prenda.descripcion_arreglo }}</p>
      </div>
      <span class="valor" v-if="!isEditing">{{ formatearMoneda(prenda.valor) }}</span>
    </div>

    <div v-if="isEditing" class="edicion">
      <label class="campo">
        <span>Arreglo</span>
        <textarea v-model="editDescripcion" class="edit-textarea" rows="2"></textarea>
      </label>
      <label class="campo">
        <span>Valor</span>
        <input type="number" inputmode="numeric" v-model.number="editValor" class="edit-input-valor" />
      </label>
      <div class="edit-actions">
        <button class="btn-guardar" @click="saveEdit">Guardar</button>
        <button class="btn-cancelar-edicion" @click="cancelEdit">Cancelar</button>
      </div>
    </div>

    <!-- Los cuatro estados a la vista: se ve dónde va la prenda y se cambia de un toque.
         El valor viene siempre de la prenda, no de un estado propio (P1-14). -->
    <div class="estados" role="group" aria-label="Estado de la prenda">
      <button
        v-for="e in ESTADOS"
        :key="e.id"
        type="button"
        class="estado-btn"
        :class="[`estado-btn--${e.clase}`, { 'is-actual': prenda.id_estado_prenda === e.id }]"
        :aria-pressed="prenda.id_estado_prenda === e.id"
        :disabled="readonly || bloqueado(e.id)"
        :title="bloqueado(e.id) ? 'Primero márcala como Terminada' : undefined"
        @click="cambiarEstado(e.id)"
      >{{ e.nombre }}</button>
    </div>

    <div class="acciones">
      <button type="button" class="accion" :class="{ 'is-abierta': showFotos }" :aria-expanded="showFotos" @click="showFotos = !showFotos">
        <svg class="ic" viewBox="0 0 24 24"><path d="M3 9a2 2 0 0 1 2-2h.9a2 2 0 0 0 1.7-.9l.8-1.2A2 2 0 0 1 10.1 4h3.8a2 2 0 0 1 1.7.9l.8 1.2a2 2 0 0 0 1.7.9H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><circle cx="12" cy="13" r="3"></circle></svg>
        Fotos<span v-if="numFotos" class="cnt">{{ numFotos }}</span>
      </button>
      <button type="button" class="accion" :class="{ 'is-abierta': showObs }" :aria-expanded="showObs" @click="showObs = !showObs">
        <svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        Notas<span v-if="numNotas" class="cnt">{{ numNotas }}</span>
      </button>
      <button v-if="!readonly" type="button" class="accion" :disabled="isEditing" @click="startEdit">
        <svg class="ic" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
        Editar
      </button>
    </div>

    <div v-if="showFotos" class="panel fotos-grid">
      <div v-for="f in fotos" :key="f.id_fotografia" class="foto-container">
        <img :src="resolvePhotoSrc(f.ruta_archivo)" class="foto-thumb" alt="Fotografía de la prenda" @click="openPhotoViewer(f)" />
        <button v-if="!readonly" class="delete-foto-btn" @click.stop="onDeleteFoto(f.id_fotografia)" aria-label="Eliminar foto">×</button>
      </div>
      <button v-if="!readonly" type="button" class="foto-nueva" @click="$emit('take-photo')">
        <svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
        <span>Tomar foto</span>
      </button>
      <p v-else-if="fotos.length === 0" class="empty-mini">No hay fotos</p>
    </div>

    <div v-if="showObs" class="panel obs-list">
      <div v-for="o in observaciones" :key="o.id_observacion" class="obs-item">
        <small>{{ new Date(o.fecha_registro).toLocaleDateString() }}</small>
        <p>{{ o.descripcion }}</p>
      </div>
      <p v-if="observaciones.length === 0 && readonly" class="empty-mini">No hay notas</p>
      <button v-if="!readonly" type="button" class="nota-nueva" @click="$emit('add-obs')">
        <svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
        Añadir nota
      </button>
    </div>

    <PhotoViewerModal
      v-model:show="showViewer"
      :photoUrl="selectedPhotoUrl"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue';
import PhotoViewerModal from '../common/PhotoViewerModal.vue';
import { usePrendas } from '../../composables/usePrendas.js';
import { resolvePhotoSrc } from '../../services/photoStorage.js';
import { formatearMoneda } from '../../services/formato.js';

const ESTADOS = [
  { id: 1, nombre: 'Pendiente', clase: 'pendiente' },
  { id: 2, nombre: 'En proceso', clase: 'proceso' },
  { id: 3, nombre: 'Terminada', clase: 'terminada' },
  { id: 4, nombre: 'Entregada', clase: 'entregada' }
];

const props = defineProps({
  prenda: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['take-photo', 'add-obs', 'estado-changed', 'prenda-actualizada']);

const { fetchFotos, fetchObservaciones, removeFoto, editPrenda } = usePrendas();
const toast = inject('toast', null);

const showFotos = ref(false);
const showObs = ref(false);
const fotos = ref([]);
const observaciones = ref([]);
const fotosCargadas = ref(false);
const notasCargadas = ref(false);

// Antes de abrir el panel, el conteo sale de lo que ya trae la prenda.
const numFotos = computed(() => fotosCargadas.value ? fotos.value.length : (props.prenda.fotografias?.length || 0));
const numNotas = computed(() => notasCargadas.value ? observaciones.value.length : (props.prenda.observaciones?.length || 0));

// CP-18: una prenda sólo se entrega cuando ya está terminada.
function bloqueado(estado) {
  return estado === 4 && props.prenda.id_estado_prenda < 3;
}

function cambiarEstado(estado) {
  if (estado === props.prenda.id_estado_prenda) return;
  if (bloqueado(estado)) {
    if (toast) toast('Primero marca la prenda como Terminada', 'error');
    return;
  }
  emit('estado-changed', props.prenda.id_prenda, estado);
}

const isEditing = ref(false);
const editValor = ref(0);
const editDescripcion = ref('');

function startEdit() {
  isEditing.value = true;
  editValor.value = props.prenda.valor;
  editDescripcion.value = props.prenda.descripcion_arreglo;
}

function cancelEdit() {
  isEditing.value = false;
}

async function saveEdit() {
  try {
    await editPrenda(props.prenda.id_prenda, editDescripcion.value, editValor.value, props.prenda.id_orden);
    isEditing.value = false;
    // Evento propio: 'estado-changed' sin argumentos se interpretaba como un
    // cambio de estado de la prenda undefined y no refrescaba el saldo.
    emit('prenda-actualizada', props.prenda.id_prenda);
  } catch (e) {
    // Error is natively handled by useAsyncAction
  }
}

async function cargarFotos() {
  fotos.value = (await fetchFotos(props.prenda.id_prenda)) || [];
  fotosCargadas.value = true;
}

async function cargarNotas() {
  observaciones.value = (await fetchObservaciones(props.prenda.id_prenda)) || [];
  notasCargadas.value = true;
}

watch(showFotos, (abierto) => { if (abierto && !fotosCargadas.value) cargarFotos(); });
watch(showObs, (abierto) => { if (abierto && !notasCargadas.value) cargarNotas(); });

// El padre la llama después de tomar una foto o añadir una nota.
const refreshData = async () => {
  if (showFotos.value || fotosCargadas.value) await cargarFotos();
  if (showObs.value || notasCargadas.value) await cargarNotas();
};

defineExpose({ refreshData });

const showViewer = ref(false);
const selectedPhotoUrl = ref('');

function openPhotoViewer(foto) {
  selectedPhotoUrl.value = foto.ruta_archivo;
  showViewer.value = true;
}

async function onDeleteFoto(id_fotografia) {
  if (confirm("¿Estás seguro de eliminar esta fotografía?")) {
    try {
      await removeFoto(id_fotografia);
      await cargarFotos();
    } catch (e) {
      // Error natively handled
    }
  }
}
</script>

<style scoped>
/* Sin margin-bottom: la separación la pone la lista (gap). Un margen dentro del
   contenedor deslizable dejaba ver la franja roja de "Eliminar" bajo cada tarjeta. */
.prenda-card {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ic { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex: none; }

.prenda-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.prenda-titulo { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.prenda-titulo h4 { margin: 0; font-size: 16px; font-weight: 700; color: var(--primary); }
.desc { margin: 0; font-size: 14px; color: var(--on-surface-variant); }
.valor { font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }

.edicion { display: flex; flex-direction: column; gap: 10px; }
.campo { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 500; color: var(--on-surface-variant); }
.edit-textarea { width: 100%; font-family: inherit; resize: vertical; }
.edit-input-valor { width: 140px; }
.edit-actions { display: flex; gap: 8px; }
.btn-guardar { flex: 1; }
.btn-cancelar-edicion { flex: 1; background: transparent; border: 1px solid var(--outline-variant); color: var(--primary); }
.btn-cancelar-edicion:hover:not(:disabled) { background: var(--surface-container-low); box-shadow: none; transform: none; }

.estados {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: var(--surface-container-low);
}
.estado-btn {
  min-height: 36px;
  padding: 4px 2px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--on-surface-variant);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}
.estado-btn:hover:not(:disabled) { background: var(--surface-container-high); color: var(--on-surface); box-shadow: none; transform: none; }
.estado-btn:disabled { opacity: 1; background: transparent; color: var(--outline-variant); cursor: not-allowed; }
.estado-btn.is-actual { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06); }
.estado-btn--pendiente.is-actual, .estado-btn--pendiente.is-actual:disabled { background: var(--warning-bg); color: var(--warning-text); }
.estado-btn--proceso.is-actual, .estado-btn--proceso.is-actual:disabled { background: var(--info-bg); color: var(--info-text); }
.estado-btn--terminada.is-actual, .estado-btn--terminada.is-actual:disabled { background: var(--success-bg); color: var(--success-text); }
.estado-btn--entregada.is-actual, .estado-btn--entregada.is-actual:disabled { background: var(--surface-container-highest); color: var(--on-surface); }

.acciones { display: flex; gap: 8px; }
.accion {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 6px;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  color: var(--primary);
  font-size: 14px;
}
.accion:hover:not(:disabled) { background: var(--surface-container-low); box-shadow: none; transform: none; }
.accion.is-abierta { background: var(--surface-container); border-color: var(--primary); }
.cnt {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--surface-container);
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.panel { padding-top: 4px; }
.fotos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}
.foto-container { position: relative; width: 100%; height: 80px; }
.foto-thumb { width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--outline-variant); cursor: pointer; }
.delete-foto-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--error);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.foto-nueva {
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: transparent;
  border: 1px dashed var(--outline);
  color: var(--primary);
  font-size: 12px;
}
.foto-nueva:hover:not(:disabled) { background: var(--surface-container-low); box-shadow: none; transform: none; }

.obs-list { display: flex; flex-direction: column; gap: 8px; }
.obs-item { background-color: var(--surface-container-low); padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--surface-container-high); }
.obs-item small { color: var(--primary); font-weight: 500; }
.obs-item p { margin: 4px 0 0 0; font-size: 13px; }
.nota-nueva { display: flex; align-items: center; justify-content: center; gap: 6px; background: transparent; border: 1px dashed var(--outline); color: var(--primary); }
.nota-nueva:hover:not(:disabled) { background: var(--surface-container-low); box-shadow: none; transform: none; }
.empty-mini { margin: 0; font-size: 12px; color: var(--on-surface-variant); font-style: italic; }
</style>
