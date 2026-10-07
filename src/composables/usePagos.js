import { ref } from 'vue';
import { getMetodosPago, getPagosByOrden, registrarPago, deletePago } from '../database/queries/pagos.js';
import { validators } from '../services/validators.js';
import { useAsyncAction } from './useAsyncAction.js';

export function usePagos() {
    const metodosPago = ref([]);
    const pagos = ref([]);

    // Unificamos el manejo asíncrono utilizando nuestro nuevo composable
    const { loading, error, execute } = useAsyncAction();

    const fetchMetodosPago = async () => {
        return execute(async () => {
            metodosPago.value = await getMetodosPago();
        });
    };

    const fetchPagos = async (id_orden) => {
        return execute(async () => {
            pagos.value = await getPagosByOrden(id_orden);
        });
    };

    const savePago = async (pagoData, saldoPendienteActual) => {
        return execute(async () => {
            validators.validatePago(pagoData, saldoPendienteActual);

            const id = await registrarPago(pagoData);
            await fetchPagos(pagoData.id_orden); // refresh
            return id;
        }, {
            successMessage: 'Pago registrado exitosamente',
            toastError: true
        });
    };

    const removePago = async (id_pago, id_orden) => {
        return execute(async () => {
            await deletePago(id_pago);
            await fetchPagos(id_orden);
        }, {
            successMessage: 'Pago eliminado y saldo recalculado',
            toastError: true
        });
    };

    return {
        removePago,
        metodosPago,
        pagos,
        loading,
        error,
        fetchMetodosPago,
        fetchPagos,
        savePago
    };
}
