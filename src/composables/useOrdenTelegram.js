import { inject } from 'vue';
import { useTelegramBot } from './useTelegramBot.js';
import { useNotificaciones } from './useNotificaciones.js';
import { getOrdenById } from '../database/queries/ordenes.js';
import { validators } from '../services/validators.js';
import { formatearMoneda } from '../services/formato.js';
import { enlaceWhatsApp, abrirWhatsApp, mensajes } from '../services/whatsapp.js';
import { getPrendasByOrden } from '../database/queries/prendas.js';
import { getPagosByOrden } from '../database/queries/pagos.js';
import { getConfig } from '../database/queries/configuracion.js';
import { Share } from '@capacitor/share';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const dateOnly = dateStr.split('T')[0].split(' ')[0];
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Texto del recibo de una orden, con o sin formato Markdown de Telegram.
 * Pura para poder probarla.
 *
 * P1-18: antes leía `fecha_recepcion`, `precio_total` y `abono_inicial`,
 * columnas que no existen. La fecha de recepción salía en blanco.
 */
export function construirRecibo(orden, { markdown = true, prendas = [], pagos = [], taller = '', garantiaDias = '', condiciones = '' } = {}) {
  const negrita = (texto) => (markdown ? `*${texto}*` : texto);
  const pagado = orden.valor_total - orden.saldo_pendiente;

  // RF-42 y Ley 1480 art. 18: el recibo identifica cada prenda con su arreglo
  // y valor, y los abonos recibidos. Los pagos anulados no se listan.
  const detallePrendas = prendas.length
    ? ['', `🧵 ${negrita('PRENDAS')}`, ...prendas.map((p, i) =>
        `${i + 1}. ${p.tipo_nombre} – ${p.descripcion_arreglo}: ${formatearMoneda(p.valor)}`)]
    : [];
  const vigentes = pagos.filter(p => !p.anulado_en);
  const detalleAbonos = vigentes.length
    ? ['', `💵 ${negrita('ABONOS')}`, ...vigentes.map(p =>
        `${formatDate(p.fecha_pago)} ${p.metodo_nombre}: ${formatearMoneda(p.valor)}`)]
    : [];
  // ANA-H02: el art. 18 también pide el teléfono y la dirección de quien entrega
  // y el término de la garantía. Lo que no está configurado no se imprime.
  const contacto = [
    orden.cliente_telefono ? `${negrita('Celular:')} ${orden.cliente_telefono}` : null,
    orden.cliente_direccion ? `${negrita('Dirección:')} ${orden.cliente_direccion}` : null
  ].filter(Boolean);
  const dias = Number.parseInt(garantiaDias, 10);
  const condicionesTaller = [
    dias > 0 ? `${negrita('Garantía del arreglo:')} ${dias} días` : null,
    condiciones?.trim() ? `${negrita('Condiciones:')} ${condiciones.trim()}` : null
  ].filter(Boolean);

  return [
    `🧾 ${negrita(`RECIBO DIGITAL - ${taller ? taller.toUpperCase() : 'ATELIER'}`)}`,
    '',
    `${negrita('Orden:')} #${orden.id_orden}`,
    `${negrita('Cliente:')} ${orden.cliente_nombre}`,
    ...contacto,
    `${negrita('Fecha de Recepción:')} ${formatDate(orden.fecha_creacion)}`,
    `${negrita('Entrega Estimada:')} ${formatDate(orden.fecha_entrega_estimada)}`,
    '',
    `${negrita('Estado:')} ${orden.estado_nombre}`,
    ...detallePrendas,
    ...detalleAbonos,
    '',
    `💰 ${negrita('PRESUPUESTO')}`,
    `Total: ${formatearMoneda(orden.valor_total)}`,
    `Pagado: ${formatearMoneda(pagado)}`,
    `${negrita('Saldo:')} ${formatearMoneda(orden.saldo_pendiente)}`,
    ...(condicionesTaller.length ? ['', ...condicionesTaller] : []),
    ''
  ].join('\n');
}

export function useOrdenTelegram(ordenActual) {
  const toast = inject('toast');
  const { sendTelegramMessage } = useTelegramBot();
  const { saveNotificacion } = useNotificaciones();

  // RN-34 y P1-18: lo que se envía se arma con la orden tal como está en la base
  // en ese momento, no con la copia que tiene la pantalla. Un pago recién
  // registrado ya cuenta aunque la vista no se haya refrescado.
  async function ordenAlEnviar() {
    if (!ordenActual.value) return null;
    return (await getOrdenById(ordenActual.value.id_orden)) ?? ordenActual.value;
  }

  async function nombreTaller() {
    return (await getConfig('nombre_taller')) || '';
  }

  async function reciboCompleto(o, opciones) {
    const [prendas, pagos, taller, garantiaDias, condiciones] = await Promise.all([
      getPrendasByOrden(o.id_orden), getPagosByOrden(o.id_orden), nombreTaller(),
      getConfig('garantia_dias'), getConfig('condiciones_recibo')
    ]);
    return construirRecibo(o, { ...opciones, prendas, pagos, taller, garantiaDias: garantiaDias || '', condiciones: condiciones || '' });
  }

  // Aviso directo al cliente: abre WhatsApp con el mensaje escrito (D-03).
  // tipo: 'RECIBIDA' | 'EN_PROCESO' | 'LISTA_ENTREGA' | 'RECORDATORIO_PAGO'
  // Se registra como "preparado": la app no puede saber si se pulsó Enviar.
  async function avisarWhatsApp(tipo) {
    const o = await ordenAlEnviar();
    if (!o) return false;
    if (tipo === 'LISTA_ENTREGA' && !puedeAvisarOrdenLista(o)) return false;
    try {
      const taller = (await nombreTaller()) || 'el taller';
      let texto;
      let idTipo;
      if (tipo === 'RECIBIDA') { texto = mensajes.recibida(o, await getPrendasByOrden(o.id_orden), taller); idTipo = 4; }
      else if (tipo === 'EN_PROCESO') { texto = mensajes.enProceso(o, taller); idTipo = 5; }
      else if (tipo === 'LISTA_ENTREGA') { texto = mensajes.lista(o, taller); idTipo = 2; }
      else { texto = mensajes.recordatorioPago(o, taller); idTipo = 6; }

      abrirWhatsApp(o.cliente_telefono, texto);
      await saveNotificacion(`Aviso por WhatsApp preparado: ${texto.split('\n')[0]}`, o.id_orden, idTipo);
      return true;
    } catch (e) {
      toast(e.message || 'No se pudo abrir WhatsApp', 'error');
      return false;
    }
  }

  // RN-31 y P1-17: el aviso de orden lista sólo sale con la orden Lista para
  // Entregar. La vista ya oculta el botón; esto cubre cualquier otro camino.
  function puedeAvisarOrdenLista(o) {
    try {
      validators.validateAvisoOrdenLista(o);
      return true;
    } catch (error) {
      toast(error.message, 'error');
      return false;
    }
  }

  async function enviarAlertaOrdenListaBot() {
    const o = await ordenAlEnviar();
    if (!o || !puedeAvisarOrdenLista(o)) return;
    const cliente = o.cliente_nombre;
    const telefono = o.cliente_telefono || '';
    const saldo = o.saldo_pendiente;
    const idOrden = o.id_orden;

    let wpText = `Hola ${cliente}, te informamos que tu orden #${idOrden} ya está lista para recoger en el Atelier.`;
    if (saldo > 0) wpText += ` Recuerda que tienes un saldo pendiente de ${formatearMoneda(saldo)}.`;
    const wpLink = enlaceWhatsApp(telefono, wpText);

    const mensajeBot = `✅ *Orden Lista*\n\nLa orden #${idOrden} de *${cliente}* ya está terminada.\nSaldo pendiente: *${formatearMoneda(saldo)}*\n\n[📲 Toca aquí para avisarle por WhatsApp](${wpLink})`;

    const success = await sendTelegramMessage(mensajeBot, 'Markdown');
    if (success) {
      toast('Alerta enviada a tu Telegram.', 'success');
      await saveNotificacion("Alerta Telegram enviada", idOrden, 2);
    } else {
      toast('Error enviando alerta por Telegram.', 'error');
    }
  }

  async function generarReciboTelegram() {
    const o = await ordenAlEnviar();
    if (!o) return;

    const success = await sendTelegramMessage(await reciboCompleto(o), 'Markdown');
    if (success) {
      toast('Recibo generado en tu Telegram.', 'success');
    } else {
      toast('Error enviando recibo a Telegram.', 'error');
    }
  }

  async function generarReciboNativo() {
    const o = await ordenAlEnviar();
    if (!o) return;

    try {
      await Share.share({
        title: 'Recibo de Orden',
        text: await reciboCompleto(o, { markdown: false }),
        dialogTitle: 'Compartir recibo con el cliente',
      });
    } catch (e) {
      if (e.message !== 'Share canceled') {
        toast('Error al compartir o tu plataforma no lo soporta', 'error');
        console.error(e);
      }
    }
  }

  async function notificarTelegram(tipo) {
    const o = await ordenAlEnviar();
    if (!o) return;
    const cliente = o.cliente_nombre;
    const telefono = o.cliente_telefono || '';
    const idOrden = o.id_orden;
    const saldo = o.saldo_pendiente;

    let wpText = '';
    let mensajeBot = '';

    if (tipo === 'LISTA_ENTREGA') {
      if (!puedeAvisarOrdenLista(o)) return;
      wpText = `Hola ${cliente}, te informamos que tu orden #${idOrden} ya está lista para recoger en el Atelier.`;
      if (saldo > 0) wpText += ` Recuerda que tienes un saldo pendiente de ${formatearMoneda(saldo)}.`;
      const wpLink = enlaceWhatsApp(telefono, wpText);
      mensajeBot = `✅ *Aviso de Orden Lista*\n\nToca aquí para avisar a *${cliente}* que su orden #${idOrden} está terminada:\n\n[📲 Enviar WhatsApp](${wpLink})`;
    } else if (tipo === 'RECORDATORIO_PAGO') {
      wpText = `Hola ${cliente}, te escribimos del Atelier para recordarte que tienes un saldo pendiente de ${formatearMoneda(saldo)} en tu orden #${idOrden}.`;
      const wpLink = enlaceWhatsApp(telefono, wpText);
      mensajeBot = `💸 *Recordatorio de Pago*\n\nToca aquí para cobrarle a *${cliente}* el saldo de *${formatearMoneda(saldo)}*:\n\n[📲 Enviar WhatsApp de Cobro](${wpLink})`;
    }

    const success = await sendTelegramMessage(mensajeBot, 'Markdown');
    if (success) {
      toast('Enlace enviado a tu Telegram.', 'success');
    } else {
      toast('Error enviando mensaje a Telegram.', 'error');
    }
  }

  return {
    avisarWhatsApp,
    enviarAlertaOrdenListaBot,
    generarReciboTelegram,
    generarReciboNativo,
    notificarTelegram
  };
}
