<template>
  <div class="vitrina-view">
    <header class="encabezado">
      <h2 class="titulo">Mi vitrina</h2>
      <p class="sub">Publica en la <b>Vitrina de Modistas</b> las prendas que haces para vender y tus precios de arreglos. Los clientes te escriben por WhatsApp.</p>
    </header>

    <p v-if="cargando" class="card aviso">Conectando con la vitrina…</p>

    <div v-else-if="errorCarga" class="card aviso aviso--error">
      <p>{{ errorCarga }}</p>
      <button class="btn-secondary" @click="cargar">Intentar de nuevo</button>
    </div>

    <!-- ===== Sin vitrina: crearla o vincular una que ya existe ===== -->
    <template v-else-if="!vitrina">
      <form class="card bloque-form" @submit.prevent="crear">
        <h3 class="seccion-t">Crear mi vitrina</h3>
        <p class="nota">Esto es lo que verán los clientes. No pongas tu dirección exacta: con el barrio basta.</p>

        <label for="v-nombre">Nombre del taller *</label>
        <input id="v-nombre" v-model="perfil.nombre" required minlength="3" maxlength="60" placeholder="Ej. Arreglos Doña Rosa" />

        <div class="dos">
          <div>
            <label for="v-ciudad">Ciudad *</label>
            <input id="v-ciudad" v-model="perfil.ciudad" required maxlength="40" placeholder="Ej. Bogotá" />
          </div>
          <div>
            <label for="v-barrio">Barrio *</label>
            <input id="v-barrio" v-model="perfil.barrio" required maxlength="60" placeholder="Ej. Kennedy" />
          </div>
        </div>

        <label for="v-whatsapp">WhatsApp del taller *</label>
        <input id="v-whatsapp" v-model="perfil.whatsapp" required inputmode="tel" maxlength="16" placeholder="300 123 4567" />

        <label for="v-horario">Horario</label>
        <input id="v-horario" v-model="perfil.horario" maxlength="80" placeholder="Lun a sáb, 8 a. m. a 6 p. m." />

        <label for="v-descripcion">Presentación</label>
        <textarea id="v-descripcion" v-model="perfil.descripcion" rows="3" maxlength="400" placeholder="Cuántos años llevas cosiendo, en qué te especializas…"></textarea>

        <fieldset class="servicios">
          <legend>Arreglos que haces y desde cuánto cobras</legend>
          <div v-for="(s, i) in perfil.servicios" :key="i" class="servicio">
            <label :for="`v-serv-${i}`" class="sr-only">Arreglo</label>
            <input :id="`v-serv-${i}`" v-model="s.nombre" maxlength="60" placeholder="Ej. Dobladillo de pantalón" />
            <label :for="`v-serv-precio-${i}`" class="sr-only">Desde (pesos)</label>
            <input :id="`v-serv-precio-${i}`" v-model.number="s.desde" type="number" min="500" step="500" placeholder="12000" class="precio" />
            <button type="button" class="btn-ghost quitar" :aria-label="`Quitar ${s.nombre || 'arreglo'}`" @click="perfil.servicios.splice(i, 1)">✕</button>
          </div>
          <button v-if="perfil.servicios.length < 12" type="button" class="btn-secondary" @click="perfil.servicios.push({ nombre: '', desde: '' })">Añadir arreglo</button>
        </fieldset>

        <label class="acepto">
          <input v-model="perfil.aceptaCondiciones" type="checkbox" />
          <span>Acepto que el nombre del taller, la ciudad, el barrio, el WhatsApp, el horario y las fotos que publique se muestren a cualquier persona en la Vitrina de Modistas. Solo publicaré prendas que yo hice para vender, nunca ropa de una clienta. Puedo borrar mi vitrina cuando quiera.</span>
        </label>

        <p v-if="errorForm" class="error-message">{{ errorForm }}</p>
        <button type="submit" :disabled="enviando || !perfil.aceptaCondiciones">{{ enviando ? 'Creando…' : 'Crear mi vitrina' }}</button>
      </form>

      <form class="card bloque-form" @submit.prevent="vincular">
        <h3 class="seccion-t">¿Ya tienes una vitrina?</h3>
        <p class="nota">Si cambiaste de teléfono y no restauraste la copia de seguridad, pide un código nuevo a la administración y escríbelo aquí.</p>
        <label for="v-codigo">Código de tu vitrina</label>
        <input id="v-codigo" v-model="codigo" autocomplete="off" autocapitalize="off" spellcheck="false" />
        <p v-if="errorCodigo" class="error-message">{{ errorCodigo }}</p>
        <button type="submit" class="btn-secondary" :disabled="enviando || !codigo.trim()">Vincular</button>
      </form>
    </template>

    <!-- ===== Con vitrina ===== -->
    <template v-else>
      <section class="card perfil">
        <div class="perfil-cab">
          <div>
            <b class="perfil-nombre">{{ vitrina.perfil.nombre }}</b>
            <small>{{ vitrina.perfil.barrio }}, {{ vitrina.perfil.ciudad }}</small>
          </div>
          <span class="estado" :class="`estado--${vitrina.perfil.estado}`">{{ textoEstado }}</span>
        </div>
        <p v-if="vitrina.perfil.estado === 'pendiente'" class="nota">La administración tiene que aprobar tu vitrina antes de que los clientes la vean. Mientras tanto ya puedes subir prendas.</p>
        <p v-if="vitrina.perfil.estado === 'suspendida'" class="nota nota--error">Tu vitrina está suspendida y no se muestra. Escribe a la administración para saber por qué.</p>
        <button class="btn-secondary" @click="abrirVitrinaPublica">Ver la vitrina pública</button>
      </section>

      <button v-if="!mostrarFormPrenda && vitrina.perfil.estado !== 'suspendida'" class="publicar" @click="abrirFormPrenda">Publicar una prenda</button>

      <form v-if="mostrarFormPrenda" class="card bloque-form" @submit.prevent="publicar">
        <h3 class="seccion-t">Nueva prenda</h3>
        <button type="button" class="foto" :class="{ 'foto--lista': prenda.foto }" @click="tomarFoto">
          <img v-if="prenda.foto" :src="`data:image/jpeg;base64,${prenda.foto}`" alt="Foto de la prenda" />
          <span v-else>Tomar o elegir foto *</span>
        </button>

        <label for="p-titulo">Nombre de la prenda *</label>
        <input id="p-titulo" v-model="prenda.titulo" required minlength="3" maxlength="80" placeholder="Ej. Vestido cruzado en lino" />

        <div class="dos">
          <div>
            <label for="p-categoria">Categoría *</label>
            <select id="p-categoria" v-model="prenda.categoria" required>
              <option v-for="c in CATEGORIAS_VITRINA" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label for="p-precio">Precio (pesos) *</label>
            <input id="p-precio" v-model.number="prenda.precio" type="number" required min="1000" step="500" inputmode="numeric" />
          </div>
        </div>

        <div class="dos">
          <div>
            <label for="p-talla">Talla</label>
            <input id="p-talla" v-model="prenda.talla" maxlength="20" placeholder="M, 32, 6 años…" />
          </div>
          <div>
            <label for="p-tela">Tela</label>
            <input id="p-tela" v-model="prenda.tela" maxlength="40" placeholder="Lino, denim…" />
          </div>
        </div>

        <label for="p-medidas">Medidas</label>
        <input id="p-medidas" v-model="prenda.medidas" maxlength="160" placeholder="Busto 92 cm · Cintura 74 cm · Largo 108 cm" />

        <label for="p-descripcion">Descripción</label>
        <textarea id="p-descripcion" v-model="prenda.descripcion" rows="3" maxlength="500"></textarea>

        <p v-if="errorForm" class="error-message">{{ errorForm }}</p>
        <div class="acciones">
          <button type="button" class="btn-secondary" @click="mostrarFormPrenda = false">Cancelar</button>
          <button type="submit" :disabled="enviando || !prenda.foto">{{ enviando ? 'Publicando…' : 'Publicar' }}</button>
        </div>
      </form>

      <h3 class="seccion-t">Mis prendas ({{ aLaVenta }} a la venta)</h3>
      <p v-if="!vitrina.prendas.length" class="card aviso">Todavía no has publicado prendas.</p>
      <ul v-else class="lista">
        <li v-for="p in vitrina.prendas" :key="p.id" class="card item" :class="{ 'item--vendida': p.vendida }">
          <img :src="urlFotoVitrina(p.foto)" :alt="p.titulo" loading="lazy" />
          <div class="item-info">
            <b>{{ p.titulo }}</b>
            <span class="precio-item">{{ formatoPesos(p.precio) }}</span>
            <small>{{ p.categoria }}<template v-if="p.talla"> · talla {{ p.talla }}</template><template v-if="p.vendida"> · Vendida</template></small>
            <div class="item-acciones">
              <button class="btn-secondary" :disabled="enviando" @click="alternarVendida(p)">{{ p.vendida ? 'Volver a publicar' : 'Marcar vendida' }}</button>
              <button v-if="confirmarQuitar !== p.id" class="btn-ghost" :disabled="enviando" @click="confirmarQuitar = p.id">Quitar</button>
              <button v-else class="btn-peligro" :disabled="enviando" @click="quitar(p)">Sí, quitarla</button>
            </div>
          </div>
        </li>
      </ul>

      <section class="card zona-peligro">
        <b>Borrar mi vitrina</b>
        <p class="nota">Se borran del servidor tu perfil, todas tus prendas y sus fotos. Tus clientas y órdenes de la app no se tocan.</p>
        <button v-if="!confirmarBorrado" class="btn-secondary" @click="confirmarBorrado = true">Borrar mi vitrina</button>
        <div v-else class="acciones">
          <button class="btn-secondary" @click="confirmarBorrado = false">No, dejarla</button>
          <button class="btn-peligro" :disabled="enviando" @click="borrarTodo">Sí, borrar todo</button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  CATEGORIAS_VITRINA, URL_VITRINA, leerTokenVitrina, nombreDelTaller, cargarMiVitrina, crearVitrina, vincularVitrina,
  publicarPrenda, marcarVendida, quitarPrenda, borrarVitrina, olvidarVitrina, urlFotoVitrina
} from '../services/vitrina.js';

const toast = inject('toast');

const cargando = ref(true);
const errorCarga = ref('');
const errorForm = ref('');
const errorCodigo = ref('');
const enviando = ref(false);
const vitrina = ref(null);
const codigo = ref('');
const mostrarFormPrenda = ref(false);
const confirmarQuitar = ref(null);
const confirmarBorrado = ref(false);

const perfil = ref({
  nombre: '', ciudad: '', barrio: '', whatsapp: '', horario: '', descripcion: '',
  servicios: [{ nombre: '', desde: '' }],
  aceptaCondiciones: false
});

const prendaVacia = () => ({ foto: '', titulo: '', categoria: 'Vestidos', precio: '', talla: '', tela: '', medidas: '', descripcion: '' });
const prenda = ref(prendaVacia());

const textoEstado = computed(() => ({
  pendiente: 'Esperando aprobación',
  aprobada: 'Publicada',
  suspendida: 'Suspendida'
}[vitrina.value?.perfil.estado] || ''));

const aLaVenta = computed(() => vitrina.value?.prendas.filter(p => !p.vendida).length || 0);

const formatoPesos = n => '$' + Number(n).toLocaleString('es-CO');

async function cargar() {
  cargando.value = true;
  errorCarga.value = '';
  try {
    if (!(await leerTokenVitrina())) {
      vitrina.value = null;
      perfil.value.nombre = perfil.value.nombre || (await nombreDelTaller());
      return;
    }
    vitrina.value = await cargarMiVitrina();
  } catch (e) {
    if (e.estado === 401) {
      // El código ya no sirve (se borró la vitrina o la administración dio uno nuevo)
      await olvidarVitrina();
      vitrina.value = null;
      errorCodigo.value = e.message;
    } else {
      errorCarga.value = e.message;
    }
  } finally {
    cargando.value = false;
  }
}

async function crear() {
  errorForm.value = '';
  enviando.value = true;
  try {
    const servicios = perfil.value.servicios.filter(s => s.nombre.trim() || s.desde);
    vitrina.value = await crearVitrina({ ...perfil.value, servicios });
    toast('Tu vitrina quedó creada. Te avisaremos cuando la aprueben.', 'success');
  } catch (e) {
    errorForm.value = e.message;
  } finally {
    enviando.value = false;
  }
}

async function vincular() {
  errorCodigo.value = '';
  enviando.value = true;
  try {
    vitrina.value = await vincularVitrina(codigo.value);
    codigo.value = '';
    toast('Vitrina vinculada a este teléfono.', 'success');
  } catch (e) {
    errorCodigo.value = e.message;
  } finally {
    enviando.value = false;
  }
}

function abrirFormPrenda() {
  prenda.value = prendaVacia();
  errorForm.value = '';
  mostrarFormPrenda.value = true;
}

async function tomarFoto() {
  try {
    // La cámara vuelve a comprimir la foto; el servidor además le quita la ubicación
    const imagen = await Camera.getPhoto({
      quality: 70,
      width: 1280,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt
    });
    if (imagen.format && !/jpe?g/i.test(imagen.format)) {
      errorForm.value = 'La foto tiene que ser JPEG. Tómala con la cámara del teléfono.';
      return;
    }
    prenda.value.foto = imagen.base64String;
    errorForm.value = '';
  } catch (e) {
    if (!/cancel/i.test(e?.message || '')) errorForm.value = 'No se pudo abrir la cámara.';
  }
}

async function publicar() {
  errorForm.value = '';
  enviando.value = true;
  try {
    const nueva = await publicarPrenda(prenda.value);
    vitrina.value.prendas.unshift(nueva);
    mostrarFormPrenda.value = false;
    toast(vitrina.value.perfil.estado === 'aprobada' ? 'Prenda publicada.' : 'Prenda guardada. Se verá cuando aprueben tu vitrina.', 'success');
  } catch (e) {
    errorForm.value = e.message;
  } finally {
    enviando.value = false;
  }
}

async function alternarVendida(p) {
  enviando.value = true;
  try {
    Object.assign(p, await marcarVendida(p.id, !p.vendida));
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    enviando.value = false;
  }
}

async function quitar(p) {
  enviando.value = true;
  try {
    await quitarPrenda(p.id);
    vitrina.value.prendas = vitrina.value.prendas.filter(x => x.id !== p.id);
    confirmarQuitar.value = null;
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    enviando.value = false;
  }
}

async function borrarTodo() {
  enviando.value = true;
  try {
    await borrarVitrina();
    vitrina.value = null;
    confirmarBorrado.value = false;
    toast('Tu vitrina se borró del servidor.', 'success');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    enviando.value = false;
  }
}

function abrirVitrinaPublica() {
  window.open(`${URL_VITRINA}/`, '_blank');
}

onMounted(cargar);
</script>

<style scoped>
.vitrina-view { padding: 24px 16px 96px; display: flex; flex-direction: column; gap: 16px; }
.titulo { margin: 0 0 6px; color: var(--on-surface); }
.sub { margin: 0; color: var(--on-surface-variant); font-size: 14px; }
.seccion-t { margin: 0; font-size: 16px; color: var(--on-surface); }
.aviso { margin: 0; padding: 16px; color: var(--on-surface-variant); }
.aviso--error { display: flex; flex-direction: column; gap: 12px; color: var(--error-text); background: var(--error-bg); }
.aviso--error p { margin: 0; }
.nota { margin: 0; font-size: 13px; color: var(--on-surface-variant); }
.nota--error { color: var(--error); }
.error-message { margin: 0; color: var(--error); font-size: 13px; }

.bloque-form { padding: 20px; display: flex; flex-direction: column; gap: 8px; }
.bloque-form label { margin-bottom: 0; margin-top: 6px; }
.bloque-form > button[type="submit"] { margin-top: 8px; }
.dos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dos > div { min-width: 0; }

.servicios { border: 1px solid var(--outline-variant); border-radius: var(--radius-md); padding: 12px; margin: 8px 0 0; display: flex; flex-direction: column; gap: 8px; }
.servicios legend { font-size: 12px; font-weight: 500; color: var(--on-surface-variant); padding: 0 4px; }
.servicio { display: flex; gap: 6px; align-items: center; }
.servicio input { min-width: 0; }
.servicio .precio { width: 110px; flex: none; }
.quitar { flex: none; width: 44px; padding: 0; }

.acepto { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; line-height: 1.4; color: var(--on-surface); margin-top: 10px; }
.acepto input { width: 20px; height: 20px; flex: none; margin-top: 2px; }

.perfil { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.perfil-cab { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.perfil-cab > div { display: flex; flex-direction: column; min-width: 0; }
.perfil-nombre { font-size: 17px; color: var(--on-surface); }
.perfil-cab small { color: var(--on-surface-variant); font-size: 13px; }
.estado { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: var(--radius-pill); white-space: nowrap; }
.estado--pendiente { background: var(--warning-bg); color: var(--warning-text); }
.estado--aprobada { background: var(--success-bg); color: var(--success-text); }
.estado--suspendida { background: var(--error-bg); color: var(--error-text); }

.publicar { width: 100%; }

.foto { width: 100%; aspect-ratio: 4 / 3; padding: 0; overflow: hidden; background: var(--surface-container); color: var(--primary); border: 2px dashed var(--outline-variant); }
.foto--lista { border-style: solid; }
.foto img { width: 100%; height: 100%; object-fit: cover; }

.lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.item { display: flex; gap: 12px; padding: 10px; }
.item img { width: 88px; height: 110px; object-fit: cover; border-radius: var(--radius-sm); flex: none; background: var(--surface-container); }
.item-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.item-info b { color: var(--on-surface); overflow-wrap: anywhere; }
.item-info small { color: var(--on-surface-variant); }
.precio-item { font-weight: 600; color: var(--primary); }
.item--vendida img { opacity: 0.5; }
.item-acciones { display: flex; gap: 6px; flex-wrap: wrap; margin-top: auto; padding-top: 6px; }
.item-acciones button { min-height: 36px; padding: 6px 12px; font-size: 13px; }

.acciones { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
.btn-peligro { background: var(--error); color: var(--on-error); }
.zona-peligro { padding: 16px; display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.zona-peligro b { color: var(--error); }
</style>
