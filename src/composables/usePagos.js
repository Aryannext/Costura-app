import { ref } from 'vue';
import { getMetodosPago, getPagosByOrden, registrarPago } from '../database/queries/pagos.js';
import { validators } from '../services/validators.js';

export function usePagos() {
    const metodosPago = ref([]);
    const pagos = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const fetchMetodosPago = async () => {
        try {
            metodosPago.value = await getMetodosPago();
        } catch (e) {
            console.error("Error fetching metodos de pago", e);
        }
    };

    const fetchPagos = async (id_orden) => {
        loading.value = true;
        error.value = null;
        try {
            pagos.value = await getPagosByOrden(id_orden);
        } catch (e) {
            error.value = "Error al cargar pagos: " + e.message;
        } finally {
            loading.value = false;
        }
    };

    const savePago = async (pagoData, saldoPendienteActual) => {
        loading.value = true;
        error.value = null;
        try {
            validators.validatePago(pagoData, saldoPendienteActual);
            
            const id = await registrarPago(pagoData);
            await fetchPagos(pagoData.id_orden); // refresh
            return id;
        } catch (e) {
            error.value = e.message;
            throw e;
        } finally {
            loading.value = false;
        }
    };

    return {
        metodosPago,
        pagos,
        loading,
        error,
        fetchMetodosPago,
        fetchPagos,
        savePago
    };
}
