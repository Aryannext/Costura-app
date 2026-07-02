import { ref } from 'vue';
import { createNotificacion, getNotificacionesByOrden, getNotificacionesByCliente, executeRecordatoriosMasivos } from '../database/queries/notificaciones.js';

export function useNotificaciones() {
    const notificaciones = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const fetchNotificaciones = async (id_orden) => {
        loading.value = true;
        error.value = null;
        try {
            notificaciones.value = await getNotificacionesByOrden(id_orden);
        } catch (e) {
            error.value = "Error al cargar notificaciones: " + e.message;
        } finally {
            loading.value = false;
        }
    };

    const fetchNotificacionesCliente = async (id_cliente) => {
        loading.value = true;
        error.value = null;
        try {
            notificaciones.value = await getNotificacionesByCliente(id_cliente);
        } catch (e) {
            error.value = "Error al cargar notificaciones del cliente: " + e.message;
        } finally {
            loading.value = false;
        }
    };

    const saveNotificacion = async (mensaje, id_orden, id_tipo_notificacion) => {
        try {
            await createNotificacion(mensaje, id_orden, id_tipo_notificacion);
            // Refresh if notificaciones is currently populated for order
            // Note: in a generic use case, this might just append or we let caller refresh
        } catch (e) {
            console.error("Error al guardar notificación:", e);
        }
    };

    const triggerRecordatorios = async () => {
        loading.value = true;
        error.value = null;
        try {
            const count = await executeRecordatoriosMasivos();
            return count;
        } catch (e) {
            error.value = "Error al ejecutar recordatorios: " + e.message;
            return 0;
        } finally {
            loading.value = false;
        }
    };

    return {
        notificaciones,
        loading,
        error,
        fetchNotificaciones,
        fetchNotificacionesCliente,
        saveNotificacion,
        triggerRecordatorios
    };
}
