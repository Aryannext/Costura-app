import { ref } from 'vue';
import { getAllClientes, getClienteById, createCliente, updateCliente, searchClientes, getOrdenesByCliente } from '../database/queries/clientes.js';
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

    return {
        clientes,
        loading,
        error,
        clienteActual,
        ordenesCliente,
        fetchClientes,
        fetchCliente,
        search,
        saveCliente
    };
}
