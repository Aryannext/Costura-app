const fs = require('fs');
let file = fs.readFileSync('src/views/OrdenDetailView.vue', 'utf8');

const newTransitionBlock = `      <transition name="fade" mode="out-in">
        <TabDetalle 
          v-if="tab === 'detalle'" 
          key="detalle"
          :orden="ordenActual"
          :historial="historial"
          :notificaciones="notificaciones"
          @cambiar-estado="cambiarEstado"
          @notificar-telegram="notificarTelegram"
          @generar-recibo="generarReciboTelegram"
        />
        <TabPrendas 
          v-else-if="tab === 'prendas'" 
          key="prendas"
          :orden="ordenActual"
          :prendas="prendas"
          :loading="prendasLoading"
          @open-prenda-form="showPrendaForm = true"
          @delete-prenda="(id) => openDeleteSheet('prenda', id)"
          @take-photo="handleTakePhoto"
          @add-obs="openObsPrompt"
          @estado-changed="handleEstadoPrenda"
          ref="tabPrendasRef"
        />
        <TabPagos 
          v-else-if="tab === 'pagos'" 
          key="pagos"
          :orden="ordenActual"
          :pagos="pagos"
          :loading="pagosLoading"
          @open-pago-form="showPagoForm = true"
          @delete-pago="(id) => openDeleteSheet('pago', id)"
        />
      </transition>`;

// Find the start and end of the transition block
const startIdx = file.indexOf('<transition name="fade" mode="out-in">');
const endIdx = file.indexOf('</transition>', startIdx) + '</transition>'.length;

if(startIdx !== -1 && endIdx !== -1) {
  file = file.substring(0, startIdx) + newTransitionBlock + file.substring(endIdx);
} else {
  console.log('Transition block not found');
  process.exit(1);
}

// Now replace imports
const importTarget = "import { useTelegramBot } from '../composables/useTelegramBot.js';";
const newImports = importTarget + `
import TabDetalle from '../components/ordenes/TabDetalle.vue';
import TabPrendas from '../components/ordenes/TabPrendas.vue';
import TabPagos from '../components/ordenes/TabPagos.vue';`;
file = file.replace(importTarget, newImports);

// Add tabPrendasRef
const refTarget = "const prendaRefs = ref({});";
const newRefs = refTarget + `\nconst tabPrendasRef = ref(null);`;
file = file.replace(refTarget, newRefs);

// Change prendaRefs access
file = file.replace(/prendaRefs\.value\[id_prenda\]\.refreshData\(\);/g, 'if (tabPrendasRef.value && tabPrendasRef.value.prendaRefs) { tabPrendasRef.value.prendaRefs[id_prenda]?.refreshData(); }');

fs.writeFileSync('src/views/OrdenDetailView.vue', file);
console.log('Refactor complete');
