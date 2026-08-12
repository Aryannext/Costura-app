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
            validators.validateFechaEntrega(ordenData.fecha_entrega_estimada);
            const id = await createOrden(ordenData);
            return id;
        }, {
            successMessage: 'Orden creada exitosamente',
            toastError: true
        });
    };

    const changeEstado = async (id_orden, id_estado_orden, estadoNombre, ordenActualData) => {
        return execute(async () => {
            let accion = null;
            if (id_estado_orden === 5) accion = 'cancelar';
            else if (id_estado_orden === 1 && ordenActualData && ordenActualData.id_estado_orden === 4) accion = 'reabrir';

            if (accion && ordenActualData) {
                validators.validateOrdenAccionPermitida(ordenActualData, accion);
            }

            await updateEstadoOrdenDB(id_orden, id_estado_orden, estadoNombre, ordenActualData);
            await fetchOrden(id_orden); // refresh
        }, {
            successMessage: `Estado actualizado a: ${estadoNombre}`,
            toastError: true
        });
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
        changeEstado
    };
}
