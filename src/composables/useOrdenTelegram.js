import { inject } from 'vue';
import { useTelegramBot } from './useTelegramBot.js';
import { useNotificaciones } from './useNotificaciones.js';
import { getOrdenById } from '../database/queries/ordenes.js';
import { validators } from '../services/validators.js';
import { formatearMoneda } from '../services/formato.js';
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
export function construirRecibo(orden, { markdown = true } = {}) {
  const negrita = (texto) => (markdown ? `*${texto}*` : texto);
  const pagado = orden.valor_total - orden.saldo_pendiente;

  return [
    `🧾 ${negrita('RECIBO DIGITAL - ATELIER')}`,
    '',
    `${negrita('Orden:')} #${orden.id_orden}`,
    `${negrita('Cliente:')} ${orden.cliente_nombre}`,
    `${negrita('Fecha de Recepción:')} ${formatDate(orden.fecha_creacion)}`,
    `${negrita('Entrega Estimada:')} ${formatDate(orden.fecha_entrega_estimada)}`,
    '',
    `${negrita('Estado:')} ${orden.estado_nombre}`,
    '',
    `💰 ${negrita('PRESUPUESTO')}`,
    `Total: ${formatearMoneda(orden.valor_total)}`,
    `Pagado: ${formatearMoneda(pagado)}`,
    `${negrita('Saldo:')} ${formatearMoneda(orden.saldo_pendiente)}`,
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
    const wpLink = `https://wa.me/${telefono.replace(/\+/g, '')}?text=${encodeURIComponent(wpText)}`;

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

    const success = await sendTelegramMessage(construirRecibo(o), 'Markdown');
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
        text: construirRecibo(o, { markdown: false }),
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
      const wpLink = `https://wa.me/${telefono.replace(/\+/g, '')}?text=${encodeURIComponent(wpText)}`;
      mensajeBot = `✅ *Aviso de Orden Lista*\n\nToca aquí para avisar a *${cliente}* que su orden #${idOrden} está terminada:\n\n[📲 Enviar WhatsApp](${wpLink})`;
    } else if (tipo === 'RECORDATORIO_PAGO') {
      wpText = `Hola ${cliente}, te escribimos del Atelier para recordarte que tienes un saldo pendiente de ${formatearMoneda(saldo)} en tu orden #${idOrden}.`;
      const wpLink = `https://wa.me/${telefono.replace(/\+/g, '')}?text=${encodeURIComponent(wpText)}`;
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
    enviarAlertaOrdenListaBot,
    generarReciboTelegram,
    generarReciboNativo,
    notificarTelegram
  };
}
