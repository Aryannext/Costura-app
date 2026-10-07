<template>
  <!-- Ley 1581 de 2012: autorización de la clienta para guardar sus datos -->
  <div class="autorizacion">
    <label class="autorizacion-check" :for="idCasilla">
      <input :id="idCasilla" type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" required />
      <span>La clienta autorizó guardar sus datos (Ley 1581)</span>
    </label>
    <button type="button" class="btn-link" @click="verAviso = !verAviso">
      {{ verAviso ? 'Ocultar aviso' : 'Ver el aviso para leérselo' }}
    </button>
    <pre v-if="verAviso" class="aviso-texto">{{ texto }}</pre>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { textoAvisoPrivacidad } from '../../services/avisoPrivacidad.js';
import { getConfig } from '../../database/queries/configuracion.js';

defineProps({
  modelValue: { type: Boolean, default: false },
  idCasilla: { type: String, default: 'autoriza_datos' }
});
defineEmits(['update:modelValue']);

const verAviso = ref(false);
const texto = ref(textoAvisoPrivacidad(''));

onMounted(async () => {
  try {
    texto.value = textoAvisoPrivacidad(await getConfig('nombre_taller'));
  } catch (e) {
    // Sin base de datos se muestra el aviso con el nombre genérico
  }
});
</script>

<style scoped>
.autorizacion { margin: 12px 0; display: flex; flex-direction: column; gap: 6px; }
.autorizacion-check { display: flex; gap: 10px; align-items: flex-start; font-size: 0.95rem; cursor: pointer; }
.autorizacion-check input { width: 22px; height: 22px; flex-shrink: 0; margin-top: 1px; }
.btn-link { align-self: flex-start; background: none; border: none; padding: 0; color: var(--primary); text-decoration: underline; cursor: pointer; font-size: 0.9rem; }
.aviso-texto { white-space: pre-wrap; font-family: inherit; font-size: 0.85rem; background: var(--surface-container-low); border-radius: var(--radius-md); padding: 10px; margin: 0; }
</style>
