import { inject } from 'vue';
import { useTelegramBot } from './useTelegramBot.js';
import { useNotificaciones } from './useNotificaciones.js';
import { Share } from '@capacitor/share';

export function useOrdenTelegram(ordenActual) {
  const toast = inject('toast');
  const { sendTelegramMessage } = useTelegramBot();
  const { saveNotificacion } = useNotificaciones();

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const dateOnly = dateStr.split('T')[0].split(' ')[0];
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  }

  async function enviarAlertaOrdenListaBot() {
    if (!ordenActual.value) return;
    const cliente = ordenActual.value.cliente_nombre;
    const telefono = ordenActual.value.cliente_telefono || '';
    const saldo = ordenActual.value.saldo_pendiente;
    const idOrden = ordenActual.value.id_orden;

    let wpText = `Hola ${cliente}, te informamos que tu orden #${idOrden} ya está lista para recoger en el Atelier.`;
    if (saldo > 0) wpText += ` Recuerda que tienes un saldo pendiente de $${saldo}.`;
    const wpLink = `https://wa.me/${telefono.replace(/\+/g, '')}?text=${encodeURIComponent(wpText)}`;

    const mensajeBot = `✅ *Orden Lista*\n\nLa orden #${idOrden} de *${cliente}* ya está terminada.\nSaldo pendiente: *$${saldo}*\n\n[📲 Toca aquí para avisarle por WhatsApp](${wpLink})`;

    const success = await sendTelegramMessage(mensajeBot, 'Markdown');
    if (success) {
      toast('Alerta enviada a tu Telegram.', 'success');
      await saveNotificacion("Alerta Telegram enviada", idOrden, 2);
    } else {
      toast('Error enviando alerta por Telegram.', 'error');
    }
  }

  async function generarReciboTelegram() {
    if (!ordenActual.value) return;
    const o = ordenActual.value;
    let recibo = `🧾 *RECIBO DIGITAL - ATELIER*\n\n`;
    recibo += `*Orden:* #${o.id_orden}\n`;
    recibo += `*Cliente:* ${o.cliente_nombre}\n`;
    recibo += `*Fecha de Recepción:* ${formatDate(o.fecha_recepcion)}\n`;
    recibo += `*Entrega Estimada:* ${formatDate(o.fecha_entrega_estimada)}\n\n`;
    recibo += `*Estado:* ${o.estado_nombre}\n\n`;
    recibo += `💰 *PRESUPUESTO*\n`;
    recibo += `Total: $${o.precio_total || o.valor_total}\n`;
    recibo += `Abono: $${o.abono_inicial || (o.valor_total - o.saldo_pendiente)}\n`;
    recibo += `*Saldo:* $${o.saldo_pendiente}\n`;

    const success = await sendTelegramMessage(recibo, 'Markdown');
    if (success) {
      toast('Recibo generado en tu Telegram.', 'success');
    } else {
      toast('Error enviando recibo a Telegram.', 'error');
    }
  }

  async function generarReciboNativo() {
    if (!ordenActual.value) return;
    const o = ordenActual.value;
    let recibo = `🧾 RECIBO DIGITAL - ATELIER\n\n`;
    recibo += `Orden: #${o.id_orden}\n`;
    recibo += `Cliente: ${o.cliente_nombre}\n`;
    recibo += `Fecha de Recepción: ${formatDate(o.fecha_recepcion)}\n`;
    recibo += `Entrega Estimada: ${formatDate(o.fecha_entrega_estimada)}\n\n`;
    recibo += `Estado: ${o.estado_nombre}\n\n`;
    recibo += `💰 PRESUPUESTO\n`;
    recibo += `Total: $${o.precio_total || o.valor_total}\n`;
    recibo += `Abono: $${o.abono_inicial || (o.valor_total - o.saldo_pendiente)}\n`;
    recibo += `Saldo: $${o.saldo_pendiente}\n`;

    try {
      await Share.share({
        title: 'Recibo de Orden',
        text: recibo,
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
    if (!ordenActual.value) return;
    const o = ordenActual.value;
    const cliente = o.cliente_nombre;
    const telefono = o.cliente_telefono || '';
    const idOrden = o.id_orden;
    const saldo = o.saldo_pendiente;

    let wpText = '';
    let mensajeBot = '';

    if (tipo === 'LISTA_ENTREGA') {
      wpText = `Hola ${cliente}, te informamos que tu orden #${idOrden} ya está lista para recoger en el Atelier.`;
      if (saldo > 0) wpText += ` Recuerda que tienes un saldo pendiente de $${saldo}.`;
      const wpLink = `https://wa.me/${telefono.replace(/\+/g, '')}?text=${encodeURIComponent(wpText)}`;
      mensajeBot = `✅ *Aviso de Orden Lista*\n\nToca aquí para avisar a *${cliente}* que su orden #${idOrden} está terminada:\n\n[📲 Enviar WhatsApp](${wpLink})`;
    } else if (tipo === 'RECORDATORIO_PAGO') {
      wpText = `Hola ${cliente}, te escribimos del Atelier para recordarte que tienes un saldo pendiente de $${saldo} en tu orden #${idOrden}.`;
      const wpLink = `https://wa.me/${telefono.replace(/\+/g, '')}?text=${encodeURIComponent(wpText)}`;
      mensajeBot = `💸 *Recordatorio de Pago*\n\nToca aquí para cobrarle a *${cliente}* el saldo de *$${saldo}*:\n\n[📲 Enviar WhatsApp de Cobro](${wpLink})`;
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
