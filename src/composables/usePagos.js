import { ref } from 'vue';
import { getMetodosPago, getPagosByOrden, registrarPago, getPagoById, anularPago as anularPagoDB } from '../database/queries/pagos.js';
import { getOrdenById } from '../database/queries/ordenes.js';
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

    const savePago = async (pagoData) => {
        return execute(async () => {
            // P1-16: el saldo se relee aquí. Antes lo pasaba la vista y podía estar
            // desactualizado. registrarPago lo vuelve a comprobar dentro del INSERT.
            const orden = await getOrdenById(pagoData.id_orden);
            if (!orden) throw new Error("La orden no existe.");

            validators.validateOrdenAccionPermitida(orden, 'registrar_pago'); // RN-13, P1-15
            validators.validatePago(pagoData, orden.saldo_pendiente);          // RN-26, RN-27

            const id = await registrarPago(pagoData);
            await fetchPagos(pagoData.id_orden); // refresh
            return id;
        }, {
            successMessage: 'Pago registrado exitosamente',
            toastError: true
        });
    };

    const anularPago = async (id_pago, motivo) => {
        return execute(async () => {
            const pago = await getPagoById(id_pago);
            validators.validateAnularPago(pago, motivo);

            await anularPagoDB(pago, motivo.trim());
            await fetchPagos(pago.id_orden);
        }, {
            successMessage: 'Pago anulado. El saldo se recalculó.',
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
        savePago,
        anularPago
    };
}
