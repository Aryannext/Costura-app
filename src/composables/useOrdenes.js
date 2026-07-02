import { ref } from 'vue';
import { getAllOrdenes, getOrdenById, createOrden, changeEstado as updateEstadoOrdenDB, getHistorialByOrden } from '../database/queries/ordenes.js';
import { validators } from '../services/validators.js';

export function useOrdenes() {
    const ordenes = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const ordenActual = ref(null);
    const historial = ref([]);

    const fetchOrdenes = async () => {
        loading.value = true;
        error.value = null;
        try {
            ordenes.value = await getAllOrdenes();
        } catch (e) {
            error.value = "Error al cargar órdenes: " + e.message;
        } finally {
            loading.value = false;
        }
    };

    const fetchOrden = async (id) => {
        loading.value = true;
        error.value = null;
        try {
            ordenActual.value = await getOrdenById(id);
            if (ordenActual.value) {
                historial.value = await getHistorialByOrden(id);
            }
        } catch (e) {
            error.value = "Error al cargar la orden: " + e.message;
        } finally {
            loading.value = false;
        }
    };

    const saveOrden = async (ordenData) => {
        loading.value = true;
        error.value = null;
        try {
            validators.validateFechaEntrega(ordenData.fecha_entrega_estimada);
            const id = await createOrden(ordenData);
            return id;
        } catch (e) {
            error.value = e.message;
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const changeEstado = async (id_orden, id_estado_orden, estadoNombre, ordenActualData) => {
        loading.value = true;
        error.value = null;
        try {
            let accion = null;
            if (id_estado_orden === 5) accion = 'cancelar';
            else if (id_estado_orden === 1 && ordenActualData && ordenActualData.id_estado_orden === 4) accion = 'reabrir';
            
            if (accion && ordenActualData) {
                validators.validateOrdenAccionPermitida(ordenActualData, accion);
            }
            
            await updateEstadoOrdenDB(id_orden, id_estado_orden, estadoNombre, ordenActualData);
            await fetchOrden(id_orden); // refresh
        } catch (e) {
            error.value = e.message;
            throw e;
        } finally {
            loading.value = false;
        }
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
