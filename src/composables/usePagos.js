import { ref } from 'vue';
import { getMetodosPago, getPagosByOrden, registrarPago } from '../database/queries/pagos.js';
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
