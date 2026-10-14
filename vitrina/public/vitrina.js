/* Página pública de la Vitrina de Modistas. Lee la API del mismo servidor
   con rutas relativas, así funciona igual en /vitrina/ que en un dominio propio.
   Todo texto que viene de una modista se escapa antes de ponerlo en la página. */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const COP = (n) => '$' + Number(n).toLocaleString('es-CO');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const iniciales = (n) => n.split(/\s+/).filter((w) => w.length > 2).slice(-2).map((w) => w[0]).join('').toUpperCase() || n.slice(0, 1).toUpperCase();
  const CATEGORIAS = ['Todas', 'Vestidos', 'Blusas', 'Faldas', 'Pantalones', 'Chaquetas', 'Niños', 'Uniformes', 'Otros'];

  const estado = { categoria: 'Todas', q: '', ciudad: '', modistas: [], prendas: [] };
  const porId = (id) => estado.modistas.find((m) => m.id === id);

  function enlaceWhatsApp(numero, mensaje) {
    return 'https://wa.me/' + encodeURIComponent(numero) + '?text=' + encodeURIComponent(mensaje);
  }

  async function pedir(ruta) {
    const r = await fetch(ruta, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function parametros(extra) {
    const p = new URLSearchParams();
    if (estado.q) p.set('q', estado.q);
    if (estado.ciudad) p.set('ciudad', estado.ciudad);
    Object.entries(extra || {}).forEach(([k, v]) => v && p.set(k, v));
    return p.toString();
  }

  async function cargar() {
    try {
      const [m, p] = await Promise.all([
        pedir('api/modistas?' + parametros()),
        pedir('api/prendas?' + parametros({ categoria: estado.categoria === 'Todas' ? '' : estado.categoria }))
      ]);
      // Para las tarjetas de prenda hacen falta todas las modistas, no solo las filtradas
      if (!estado.ciudades) {
        estado.ciudades = m.ciudades;
        $('#ciudad').insertAdjacentHTML('beforeend', m.ciudades.map((c) => `<option>${esc(c)}</option>`).join(''));
      }
      if (!estado.q && !estado.ciudad) estado.todas = m.modistas;
      estado.modistas = m.modistas;
      estado.prendas = p.prendas;
      pintarPrendas();
      pintarModistas();
    } catch (e) {
      const aviso = '<p class="empty">No pudimos cargar la vitrina. Revisa tu conexión y recarga la página.</p>';
      $('#prendas').innerHTML = aviso;
      $('#modistas').innerHTML = aviso;
    }
  }

  function modistaDe(id) {
    return porId(id) || (estado.todas || []).find((m) => m.id === id) || { nombre: 'Modista', barrio: '', ciudad: '' };
  }

  function pintarPrendas() {
    $('#categorias').innerHTML = CATEGORIAS.map((c) =>
      `<button class="chip" aria-pressed="${c === estado.categoria}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    $('#n-prendas').textContent = estado.prendas.length;
    $('#prendas').innerHTML = estado.prendas.length ? estado.prendas.map((p, i) => {
      const m = modistaDe(p.modistaId);
      return `<button class="card" data-p="${i}">
        <div class="pic"><img src="${esc(p.foto)}" alt="${esc(p.titulo)}" loading="lazy"><span class="tag">${COP(p.precio)}</span></div>
        <div class="body"><span class="unica">Pieza única${p.talla ? ' · talla ' + esc(p.talla) : ''}</span><h3>${esc(p.titulo)}</h3>
        <span class="meta">${esc(m.nombre)} · ${esc(m.barrio)}, ${esc(m.ciudad)}</span>
        ${p.medidas ? `<span class="meas">${esc(p.medidas)}</span>` : ''}</div>
      </button>`;
    }).join('') : '<p class="empty">Todavía no hay prendas con ese filtro. Prueba con otra ciudad o categoría.</p>';
  }

  function pintarModistas() {
    $('#n-modistas').textContent = estado.modistas.length;
    $('#modistas').innerHTML = estado.modistas.length ? estado.modistas.map((m) => `
      <article class="mcard">
        <div class="mhead"><div class="avatar" aria-hidden="true">${esc(iniciales(m.nombre))}</div>
          <div><h3>${esc(m.nombre)}</h3><div class="meta">${esc(m.barrio)}, ${esc(m.ciudad)}</div></div></div>
        ${m.descripcion ? `<p class="desc">${esc(m.descripcion)}</p>` : ''}
        ${m.servicios.length ? `<ul class="prices">${m.servicios.map((s) => `<li><span>${esc(s.nombre)}</span><b>desde ${COP(s.desde)}</b></li>`).join('')}</ul>` : ''}
        ${m.horario ? `<div class="meta">${esc(m.horario)}</div>` : ''}
        <div class="row">
          <a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(enlaceWhatsApp(m.whatsapp, `Hola ${m.nombre}, te encontré en la Vitrina de Modistas. Quisiera preguntarte por un arreglo.`))}">Escribir por WhatsApp</a>
          ${m.prendas ? `<button class="btn btn-ghost" data-ver="${m.id}">Ver sus prendas (${m.prendas})</button>` : ''}
        </div>
      </article>`).join('') : '<p class="empty">Todavía no hay talleres con ese filtro.</p>';
  }

  function abrirPrenda(i) {
    const p = estado.prendas[i];
    const m = modistaDe(p.modistaId);
    const mensaje = `Hola ${m.nombre}, vi en la Vitrina de Modistas "${p.titulo}"${p.talla ? ` (talla ${p.talla})` : ''} por ${COP(p.precio)}. ¿Todavía está disponible?`;
    const dlg = $('#detalle');
    dlg.innerHTML = `<div class="panel">
      <button class="close" aria-label="Cerrar" data-cerrar>✕</button>
      <div class="pic"><img src="${esc(p.foto)}" alt="${esc(p.titulo)}"></div>
      <div class="pinfo">
        <span class="unica">Pieza única · lista para entregar</span>
        <h2 id="detalle-titulo">${esc(p.titulo)}</h2><div class="price">${COP(p.precio)}</div>
        <dl class="specs">
          <dt>Categoría</dt><dd>${esc(p.categoria)}</dd>
          ${p.talla ? `<dt>Talla</dt><dd>${esc(p.talla)}</dd>` : ''}
          ${p.tela ? `<dt>Tela</dt><dd>${esc(p.tela)}</dd>` : ''}
          ${p.medidas ? `<dt>Medidas</dt><dd>${esc(p.medidas)}</dd>` : ''}
        </dl>
        ${p.descripcion ? `<p class="desc">${esc(p.descripcion)}</p>` : ''}
        <div class="who"><div class="avatar" aria-hidden="true">${esc(iniciales(m.nombre))}</div>
          <div><b>${esc(m.nombre)}</b><div class="meta">${esc(m.barrio)}, ${esc(m.ciudad)}</div></div></div>
        ${m.whatsapp ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(enlaceWhatsApp(m.whatsapp, mensaje))}">Pedir por WhatsApp</a>` : ''}
        <p class="meta">El precio, el pago y la entrega se acuerdan directamente con la modista.</p>
      </div></div>`;
    dlg.showModal();
  }

  function pestaña(cual) {
    const prendas = cual === 'prendas';
    $('#t-prendas').setAttribute('aria-selected', String(prendas));
    $('#t-arreglos').setAttribute('aria-selected', String(!prendas));
    $('#v-prendas').hidden = !prendas;
    $('#v-arreglos').hidden = prendas;
  }

  document.addEventListener('click', (e) => {
    const dlg = $('#detalle');
    if (e.target === dlg || e.target.closest('[data-cerrar]')) return dlg.close();
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 't-prendas') pestaña('prendas');
    else if (b.id === 't-arreglos') pestaña('arreglos');
    else if (b.dataset.cat) { estado.categoria = b.dataset.cat; cargar(); }
    else if (b.dataset.p !== undefined) abrirPrenda(Number(b.dataset.p));
    else if (b.dataset.ver) {
      const m = porId(Number(b.dataset.ver));
      estado.q = m.nombre; $('#q').value = m.nombre; estado.categoria = 'Todas';
      pestaña('prendas'); cargar(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  let espera;
  $('#q').addEventListener('input', (e) => {
    clearTimeout(espera);
    espera = setTimeout(() => { estado.q = e.target.value.trim(); cargar(); }, 250);
  });
  $('#ciudad').addEventListener('change', (e) => { estado.ciudad = e.target.value; cargar(); });
  $('#buscar').addEventListener('submit', (e) => e.preventDefault());

  cargar();
})();
