import { ref } from 'vue';
import { getAllClientes, getClienteById, createCliente, updateCliente, searchClientes, getOrdenesByCliente, registrarAutorizacionDatos, anonimizarCliente } from '../database/queries/clientes.js';
import { validators } from '../services/validators.js';
import { useAsyncAction } from './useAsyncAction.js';

const clientes = ref([]);
const clienteActual = ref(null);
const ordenesCliente = ref([]);

export function useClientes() {

    const { loading, error, execute } = useAsyncAction();

    const fetchClientes = async () => {
        return execute(async () => {
            clientes.value = await getAllClientes();
        });
    };

    const fetchCliente = async (id) => {
        return execute(async () => {
            clienteActual.value = await getClienteById(id);
            if (clienteActual.value) {
                ordenesCliente.value = await getOrdenesByCliente(id);
            }
        });
    };

    const search = async (query) => {
        if (!query || query.trim() === '') {
            return fetchClientes();
        }
        return execute(async () => {
            clientes.value = await searchClientes(query);
        });
    };

    const saveCliente = async (clienteData) => {
        return execute(async () => {
            validators.validateCliente(clienteData);
            let id;
            let successMessage = 'Cliente registrado exitosamente';

            if (clienteData.id_cliente) {
                await updateCliente(clienteData.id_cliente, clienteData);
                id = clienteData.id_cliente;
                successMessage = 'Cliente actualizado exitosamente';
            } else {
                id = await createCliente(clienteData);
            }
            // Passing options dynamically requires us to just return the result and configure execute options. Wait!
            // I can't easily configure dynamic successMessage here because execute takes static options unless I pass it conditionally.
            return { id, isUpdate: !!clienteData.id_cliente };
        }, {
            // We'll let the view handle the success message depending on insert/update or we can just say "Cliente guardado".
            // Since we must remove manual toasts from view, we will just use a generic success message or we can dynamically throw the success message.
            // Let's use a generic success message:
            successMessage: 'Datos del cliente guardados exitosamente',
            toastError: true
        }).then((res) => res?.id);
    };

    // Ley 1581: autorización de clientas registradas antes de la versión 7
    const registrarAutorizacion = async (id_cliente) => {
        return execute(async () => {
            await registrarAutorizacionDatos(id_cliente);
            await fetchCliente(id_cliente);
        }, { successMessage: 'Autorización registrada', toastError: true });
    };

    // Ley 1581: derecho de supresión. Las órdenes quedan, sin datos personales.
    const borrarDatosPersonales = async (id_cliente) => {
        return execute(async () => {
            await anonimizarCliente(id_cliente);
            await fetchCliente(id_cliente);
        }, { successMessage: 'Datos personales borrados', toastError: true });
    };

    const clearCurrentState = () => {
        clienteActual.value = null;
        ordenesCliente.value = [];
    };

    return {
        clientes,
        loading,
        error,
        clienteActual,
        ordenesCliente,
        fetchClientes,
        fetchCliente,
        search,
        saveCliente,
        registrarAutorizacion,
        borrarDatosPersonales,
        clearCurrentState
    };
}
