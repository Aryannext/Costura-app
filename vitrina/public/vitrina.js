/* Página pública de la Vitrina de Modistas. Lee la API del mismo servidor
   con rutas relativas, así funciona igual en /vitrina/ que en un dominio propio.
   Todo se arma con nodos del DOM y textContent: lo que escribe una modista
   nunca se interpreta como HTML. */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const COP = (n) => '$' + Number(n).toLocaleString('es-CO');
  const iniciales = (n) => n.split(/\s+/).filter((w) => w.length > 2).slice(-2).map((w) => w[0]).join('').toUpperCase() || n.slice(0, 1).toUpperCase();
  const CATEGORIAS = ['Todas', 'Vestidos', 'Blusas', 'Faldas', 'Pantalones', 'Chaquetas', 'Niños', 'Uniformes', 'Otros'];
  const FOTO = /^fotos\/[a-f0-9]{32}\.jpg$/;

  /** h('div', { class: 'x' }, 'texto', otroNodo): los textos entran como nodos de texto */
  function h(etiqueta, atributos, ...hijos) {
    const el = document.createElement(etiqueta);
    Object.entries(atributos || {}).forEach(([k, v]) => {
      if (v === false || v === null || v === undefined) return;
      if (k.startsWith('data-')) el.dataset[k.slice(5)] = String(v);
      else el.setAttribute(k, String(v));
    });
    hijos.flat().forEach((hijo) => {
      if (hijo === null || hijo === undefined || hijo === false || hijo === '') return;
      el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
    });
    return el;
  }

  function vaciarCon(contenedor, ...nodos) {
    contenedor.replaceChildren(...nodos.flat());
  }

  const estado = { categoria: 'Todas', q: '', ciudad: '', modistas: [], prendas: [], todas: [], ciudades: null };
  const porId = (id) => estado.modistas.find((m) => m.id === id);

  function enlaceWhatsApp(numero, mensaje) {
    const digitos = String(numero).replace(/\D/g, '');
    return 'https://wa.me/' + digitos + '?text=' + encodeURIComponent(mensaje);
  }

  function fotoSegura(ruta) {
    return FOTO.test(ruta) ? ruta : '';
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

  const vacio = (texto) => h('p', { class: 'empty' }, texto);

  async function cargar() {
    try {
      const [m, p] = await Promise.all([
        pedir('api/modistas?' + parametros()),
        pedir('api/prendas?' + parametros({ categoria: estado.categoria === 'Todas' ? '' : estado.categoria }))
      ]);
      if (!estado.ciudades) {
        estado.ciudades = m.ciudades;
        $('#ciudad').append(...m.ciudades.map((c) => h('option', null, c)));
      }
      // Las tarjetas de prenda necesitan todas las modistas, no solo las filtradas
      if (!estado.q && !estado.ciudad) estado.todas = m.modistas;
      estado.modistas = m.modistas;
      estado.prendas = p.prendas;
      pintarPrendas();
      pintarModistas();
    } catch (e) {
      const aviso = 'No pudimos cargar la vitrina. Revisa tu conexión y recarga la página.';
      vaciarCon($('#prendas'), vacio(aviso));
      vaciarCon($('#modistas'), vacio(aviso));
    }
  }

  function modistaDe(id) {
    return porId(id) || estado.todas.find((m) => m.id === id) || { nombre: 'Modista', barrio: '', ciudad: '', whatsapp: '' };
  }

  const lugar = (m) => [m.barrio, m.ciudad].filter(Boolean).join(', ');

  function pintarPrendas() {
    vaciarCon($('#categorias'), CATEGORIAS.map((c) =>
      h('button', { class: 'chip', 'aria-pressed': c === estado.categoria, 'data-cat': c }, c)));
    $('#n-prendas').textContent = estado.prendas.length;
    if (!estado.prendas.length) {
      return vaciarCon($('#prendas'), vacio('Todavía no hay prendas con ese filtro. Prueba con otra ciudad o categoría.'));
    }
    vaciarCon($('#prendas'), estado.prendas.map((p, i) => {
      const m = modistaDe(p.modistaId);
      return h('button', { class: 'card', 'data-p': i },
        h('div', { class: 'pic' },
          h('img', { src: fotoSegura(p.foto), alt: p.titulo, loading: 'lazy' }),
          h('span', { class: 'tag' }, COP(p.precio))),
        h('div', { class: 'body' },
          h('span', { class: 'unica' }, 'Pieza única' + (p.talla ? ' · talla ' + p.talla : '')),
          h('h3', null, p.titulo),
          h('span', { class: 'meta' }, m.nombre + ' · ' + lugar(m)),
          p.medidas && h('span', { class: 'meas' }, p.medidas)));
    }));
  }

  function pintarModistas() {
    $('#n-modistas').textContent = estado.modistas.length;
    if (!estado.modistas.length) return vaciarCon($('#modistas'), vacio('Todavía no hay talleres con ese filtro.'));
    vaciarCon($('#modistas'), estado.modistas.map((m) => h('article', { class: 'mcard' },
      h('div', { class: 'mhead' },
        h('div', { class: 'avatar', 'aria-hidden': 'true' }, iniciales(m.nombre)),
        h('div', null, h('h3', null, m.nombre), h('div', { class: 'meta' }, lugar(m)))),
      m.descripcion && h('p', { class: 'desc' }, m.descripcion),
      m.servicios.length > 0 && h('ul', { class: 'prices' }, m.servicios.map((s) =>
        h('li', null, h('span', null, s.nombre), h('b', null, 'desde ' + COP(s.desde))))),
      m.horario && h('div', { class: 'meta' }, m.horario),
      h('div', { class: 'row' },
        h('a', {
          class: 'btn btn-wa', target: '_blank', rel: 'noopener',
          href: enlaceWhatsApp(m.whatsapp, `Hola ${m.nombre}, te encontré en la Vitrina de Modistas. Quisiera preguntarte por un arreglo.`)
        }, 'Escribir por WhatsApp'),
        m.prendas > 0 && h('button', { class: 'btn btn-ghost', 'data-ver': m.id }, `Ver sus prendas (${m.prendas})`)))));
  }

  function abrirPrenda(i) {
    const p = estado.prendas[i];
    const m = modistaDe(p.modistaId);
    const mensaje = `Hola ${m.nombre}, vi en la Vitrina de Modistas "${p.titulo}"${p.talla ? ` (talla ${p.talla})` : ''} por ${COP(p.precio)}. ¿Todavía está disponible?`;
    const fila = (dt, dd) => dd ? [h('dt', null, dt), h('dd', null, dd)] : [];
    const dlg = $('#detalle');
    vaciarCon(dlg, h('div', { class: 'panel' },
      h('button', { class: 'close', 'aria-label': 'Cerrar', 'data-cerrar': '1' }, '✕'),
      h('div', { class: 'pic' }, h('img', { src: fotoSegura(p.foto), alt: p.titulo })),
      h('div', { class: 'pinfo' },
        h('span', { class: 'unica' }, 'Pieza única · lista para entregar'),
        h('h2', { id: 'detalle-titulo' }, p.titulo),
        h('div', { class: 'price' }, COP(p.precio)),
        h('dl', { class: 'specs' }, fila('Categoría', p.categoria), fila('Talla', p.talla), fila('Tela', p.tela), fila('Medidas', p.medidas)),
        p.descripcion && h('p', { class: 'desc' }, p.descripcion),
        h('div', { class: 'who' },
          h('div', { class: 'avatar', 'aria-hidden': 'true' }, iniciales(m.nombre)),
          h('div', null, h('b', null, m.nombre), h('div', { class: 'meta' }, lugar(m)))),
        m.whatsapp && h('a', { class: 'btn btn-wa', target: '_blank', rel: 'noopener', href: enlaceWhatsApp(m.whatsapp, mensaje) }, 'Pedir por WhatsApp'),
        h('p', { class: 'meta' }, 'El precio, el pago y la entrega se acuerdan directamente con la modista.'))));
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
