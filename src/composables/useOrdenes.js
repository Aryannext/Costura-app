import { ref } from 'vue';
import { getAllOrdenes, getOrdenById, createOrden, changeEstado as updateEstadoOrdenDB, getHistorialByOrden } from '../database/queries/ordenes.js';
import { validators } from '../services/validators.js';
import { useAsyncAction } from './useAsyncAction.js';

const ordenes = ref([]);
const ordenActual = ref(null);
const historial = ref([]);

export function useOrdenes() {

    const { loading, error, execute } = useAsyncAction();

    const fetchOrdenes = async () => {
        return execute(async () => {
            ordenes.value = await getAllOrdenes();
        });
    };

    const fetchOrden = async (id) => {
        return execute(async () => {
            ordenActual.value = await getOrdenById(id);
            if (ordenActual.value) {
                historial.value = await getHistorialByOrden(id);
            }
        });
    };

    const saveOrden = async (ordenData) => {
        return execute(async () => {
            validators.validateFechaRecepcion(ordenData.fecha_creacion);
            validators.validateFechaEntrega(ordenData.fecha_entrega_estimada, ordenData.fecha_creacion);
            const id = await createOrden(ordenData);
            return id;
        }, {
            successMessage: 'Orden creada exitosamente',
            toastError: true
        });
    };

    // Las reglas (prendas terminadas, no cancelar entregadas, reabrir) se validan
    // en la capa de datos; aquí solo se refresca y se muestra el resultado.
    const changeEstado = async (id_orden, id_estado_orden, estadoNombre) => {
        return execute(async () => {
            await updateEstadoOrdenDB(id_orden, id_estado_orden);
            await fetchOrden(id_orden); // refresh
        }, {
            successMessage: `Estado actualizado a: ${estadoNombre}`,
            toastError: true
        });
    };

    const clearCurrentState = () => {
        ordenActual.value = null;
        historial.value = [];
    };

    return {
        ordenes,
        loading,
        error,
        ordenActual,
        historial,
        fetchOrdenes,
        fetchOrden,
        saveOrden,
        changeEstado,
        clearCurrentState
    };
}
