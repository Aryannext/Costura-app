import { inject } from 'vue';
import { Share } from '@capacitor/share';
import { useTelegramBot } from './useTelegramBot.js';
import { useNotificaciones } from './useNotificaciones.js';
import { getPrendasByOrden } from '../database/queries/prendas.js';
import { getPagosByOrden } from '../database/queries/pagos.js';
import { getConfig } from '../database/queries/configuracion.js';
import { abrirWhatsApp, mensajes } from '../services/whatsapp.js';
import { construirRecibo } from '../services/recibo.js';

// Avisos de una orden. El canal principal es WhatsApp (wa.me, gratis y es lo que usan
// las clientas); Telegram queda solo para la modista: recibos de respaldo y reportes.
export function useOrdenTelegram(ordenActual) {
  const toast = inject('toast');
  const { sendTelegramMessage } = useTelegramBot();
  const { saveNotificacion } = useNotificaciones();

  async function nombreTaller() {
    return (await getConfig('nombre_taller')) || 'el taller';
  }

  // tipo: 'RECIBIDA' | 'EN_PROCESO' | 'LISTA_ENTREGA' | 'RECORDATORIO_PAGO'
  // Se registra como "preparado" porque la app no puede saber si la modista pulsó Enviar.
  async function avisarWhatsApp(tipo) {
    const o = ordenActual.value;
    if (!o) return;
    try {
      const taller = await nombreTaller();
      const plantillas = {
        RECIBIDA: async () => [mensajes.recibida(o, await getPrendasByOrden(o.id_orden), taller), 4],
        EN_PROCESO: async () => [mensajes.enProceso(o, taller), 5],
        LISTA_ENTREGA: async () => [mensajes.lista(o, taller), 2],
        RECORDATORIO_PAGO: async () => [mensajes.recordatorioPago(o, taller), 6]
      };
      const [texto, idTipo] = await plantillas[tipo]();
      abrirWhatsApp(o.cliente_telefono, texto);
      await saveNotificacion(`Aviso por WhatsApp preparado: ${texto.split('\n')[0]}`, o.id_orden, idTipo);
    } catch (e) {
      toast(e.message || 'No se pudo abrir WhatsApp', 'error');
    }
  }

  async function reciboActual() {
    const o = ordenActual.value;
    const [prendas, pagos, taller] = await Promise.all([
      getPrendasByOrden(o.id_orden),
      getPagosByOrden(o.id_orden),
      getConfig('nombre_taller')
    ]);
    return construirRecibo(o, prendas, pagos, taller);
  }

  async function generarReciboTelegram() {
    if (!ordenActual.value) return;
    const success = await sendTelegramMessage(await reciboActual(), null);
    if (success) {
      toast('Recibo enviado a tu Telegram.', 'success');
    } else {
      toast('No se pudo enviar el recibo. Revisa la configuración de Telegram.', 'error');
    }
  }

  // Abre el menú "Compartir" de Android: la modista elige WhatsApp, SMS, etc.
  async function generarReciboNativo() {
    if (!ordenActual.value) return;
    try {
      await Share.share({
        title: `Recibo orden #${ordenActual.value.id_orden}`,
        text: await reciboActual(),
        dialogTitle: 'Compartir recibo con el cliente',
      });
    } catch (e) {
      if (e.message !== 'Share canceled') {
        toast('Error al compartir o tu plataforma no lo soporta', 'error');
        console.error(e);
      }
    }
  }

  return {
    avisarWhatsApp,
    generarReciboTelegram,
    generarReciboNativo
  };
}
