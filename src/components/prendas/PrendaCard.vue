<template>
  <div class="card prenda-card">
    <div class="prenda-header">
      <div class="title">
        <h4>{{ prenda.tipo_nombre }}</h4>
        <span class="valor" v-if="!isEditing">${{ prenda.valor }}</span>
        <input type="number" v-else v-model.number="editValor" class="edit-input-valor" />
      </div>
      <StatusBadge :estado="prenda.estado_nombre" />
    </div>
    
    <div class="prenda-body">
      <p class="desc" v-if="!isEditing">{{ prenda.descripcion_arreglo }}</p>
      <textarea v-else v-model="editDescripcion" class="edit-textarea" rows="3"></textarea>
    </div>

    <!-- Edit mode actions -->
    <div v-if="isEditing" class="edit-actions">
      <button class="btn btn-primary btn-sm" @click="saveEdit">Guardar</button>
      <button class="btn btn-outline btn-sm" @click="cancelEdit">Cancelar</button>
    </div>

    <!-- Acciones Rápidas -->
    <div class="prenda-actions" v-if="!readonly && !isEditing">
      <button class="icon-btn" @click="startEdit" title="Editar Información">
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
      </button>
      <button class="icon-btn" @click="$emit('take-photo')" title="Tomar Fotografía">
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </button>
      <button class="icon-btn" @click="$emit('add-obs')" title="Añadir Observación">
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      </button>
      
      <!-- Cambio de estado rápido -->
      <select v-model="estadoLocal" @change="onEstadoChange" class="estado-select">
        <option value="1">Pendiente</option>
        <option value="2">En Proceso</option>
        <option value="3">Terminada</option>
        <option value="4">Entregada</option>
      </select>
    </div>

    <!-- Toggles para ver fotos y observaciones -->
    <div class="prenda-footer">
      <button class="link-btn" @click="showFotos = !showFotos">
        {{ showFotos ? 'Ocultar Fotos' : 'Ver Fotos' }}
      </button>
      <button class="link-btn" @click="showObs = !showObs">
        {{ showObs ? 'Ocultar Obs.' : 'Ver Obs.' }}
      </button>
    </div>

    <!-- Galerías dinámicas -->
    <div v-if="showFotos" class="fotos-grid">
      <div v-if="fotos.length === 0" class="empty-mini">No hay fotos</div>
      <div 
        v-for="f in fotos" 
        :key="f.id_fotografia" 
        class="foto-container"
      >
        <img :src="getImgSrc(f.ruta_archivo)" class="foto-thumb" @click="openPhotoViewer(f)" />
        <button v-if="!readonly" class="delete-foto-btn" @click.stop="onDeleteFoto(f.id_fotografia)" title="Eliminar Foto">×</button>
      </div>
    </div>

    <div v-if="showObs" class="obs-list">
      <div v-if="observaciones.length === 0" class="empty-mini">No hay observaciones</div>
      <div v-for="o in observaciones" :key="o.id_observacion" class="obs-item">
        <small>{{ new Date(o.fecha_registro).toLocaleDateString() }}</small>
        <p>{{ o.descripcion }}</p>
      </div>
    </div>
    <!-- Photo Viewer Modal -->
    <PhotoViewerModal 
      v-model:show="showViewer"
      :photoUrl="selectedPhotoUrl"
    />
  </div>
</template>

<script setup>
import { ref, watch, inject } from 'vue';
import StatusBadge from '../common/StatusBadge.vue';
import PhotoViewerModal from '../common/PhotoViewerModal.vue';
import { usePrendas } from '../../composables/usePrendas.js';
import { Capacitor } from '@capacitor/core';

const getImgSrc = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return Capacitor.convertFileSrc(path);
};

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

const emit = defineEmits(['take-photo', 'add-obs', 'estado-changed']);

const { fetchFotos, fetchObservaciones, removeFoto, editPrenda } = usePrendas();

const estadoLocal = ref(props.prenda.id_estado_prenda);
const showFotos = ref(false);
const showObs = ref(false);
const fotos = ref([]);
const observaciones = ref([]);

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
    emit('estado-changed'); // Trigger refresh in parent
  } catch (e) {
    alert("Error al editar: " + e.message);
  }
}

watch(() => props.prenda.id_estado_prenda, (newVal) => {
  estadoLocal.value = newVal;
});

// Load data lazily when toggles are clicked
watch(showFotos, async (val) => {
  if (val && fotos.value.length === 0) {
    fotos.value = await fetchFotos(props.prenda.id_prenda);
  }
});

watch(showObs, async (val) => {
  if (val && observaciones.value.length === 0) {
    observaciones.value = await fetchObservaciones(props.prenda.id_prenda);
  }
});

// Expose refresh method so parent can trigger reload
const refreshData = async () => {
  if (showFotos.value) fotos.value = await fetchFotos(props.prenda.id_prenda);
  if (showObs.value) observaciones.value = await fetchObservaciones(props.prenda.id_prenda);
};

defineExpose({ refreshData });

const toast = inject('toast');

function onEstadoChange() {
  const newEstado = parseInt(estadoLocal.value);
  const oldEstado = props.prenda.id_estado_prenda;
  
  if (newEstado === 4 && oldEstado < 3) {
    // Cannot deliver if not finished
    estadoLocal.value = oldEstado; // revert
    toast('No se puede entregar una prenda que no está Terminada', 'error');
    return;
  }
  
  emit('estado-changed', props.prenda.id_prenda, newEstado);
}

// Photo Viewer Logic
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
      fotos.value = await fetchFotos(props.prenda.id_prenda);
      toast('Fotografía eliminada', 'success');
    } catch (e) {
      toast('Error al eliminar fotografía', 'error');
    }
  }
}
</script>

<style scoped>
.prenda-card {
  margin-bottom: 12px;
}
.prenda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title h4 {
  margin: 0;
  color: var(--primary);
}
.valor {
  font-weight: 600;
}
.edit-input-valor {
  width: 80px;
  padding: 4px;
  border: 1px solid var(--outline);
  border-radius: 4px;
}
.edit-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--outline);
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
}
.edit-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.prenda-body .desc {
  margin: 0 0 12px 0;
  font-size: 14px;
}
.prenda-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--surface-container-high);
}
.icon-btn {
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-md);
  padding: 6px 10px;
  cursor: pointer;
  color: var(--on-surface-variant);
}
.icon-btn:hover {
  background: var(--surface-container);
  color: var(--primary);
}
.estado-select {
  flex: 1;
  padding: 6px;
  min-height: unset;
}
.prenda-footer {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}
.link-btn {
  background: transparent !important;
  border: none;
  color: var(--primary);
  padding: 0;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
  min-height: unset;
  box-shadow: none !important;
}
.link-btn:hover, .link-btn:active, .link-btn:focus {
  text-decoration: underline;
  background-color: transparent !important;
  box-shadow: none !important;
  transform: none !important;
}
.fotos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.foto-container {
  position: relative;
  width: 100%;
  height: 80px;
}
.foto-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--outline-variant);
  cursor: pointer;
}
.delete-foto-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff3b30; /* Red */
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px !important;
  height: 24px !important;
  min-height: 24px !important;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  box-shadow: var(--shadow-level-1);
}
.obs-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.obs-item {
  background-color: var(--surface-container-low);
  padding: 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-container-high);
}
.obs-item small {
  color: var(--primary);
  font-weight: 500;
}
.obs-item p {
  margin: 4px 0 0 0;
  font-size: 13px;
}
.empty-mini {
  font-size: 12px;
  color: var(--on-surface-variant);
  font-style: italic;
}
</style>
