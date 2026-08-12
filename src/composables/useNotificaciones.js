import { ref } from 'vue';
import { createNotificacion, getNotificacionesByOrden, getNotificacionesByCliente, executeRecordatoriosMasivos } from '../database/queries/notificaciones.js';
import { useAsyncAction } from './useAsyncAction.js';

export function useNotificaciones() {
    const notificaciones = ref([]);
    const { loading, error, execute } = useAsyncAction();

    const fetchNotificaciones = async (id_orden) => {
        return execute(async () => {
            notificaciones.value = await getNotificacionesByOrden(id_orden);
        });
    };

    const fetchNotificacionesCliente = async (id_cliente) => {
        return execute(async () => {
            notificaciones.value = await getNotificacionesByCliente(id_cliente);
        });
    };

    const saveNotificacion = async (mensaje, id_orden, id_tipo_notificacion) => {
        return execute(async () => {
            await createNotificacion(mensaje, id_orden, id_tipo_notificacion);
        });
    };

    const triggerRecordatorios = async () => {
        return execute(async () => {
            const count = await executeRecordatoriosMasivos();
            return count;
        });
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
