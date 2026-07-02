import { ref } from 'vue';
import { getAllClientes, getClienteById, createCliente, updateCliente, searchClientes, getOrdenesByCliente } from '../database/queries/clientes.js';
import { validators } from '../services/validators.js';

export function useClientes() {
    const clientes = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const clienteActual = ref(null);
    const ordenesCliente = ref([]);

    const fetchClientes = async () => {
        loading.value = true;
        error.value = null;
        try {
            clientes.value = await getAllClientes();
        } catch (e) {
            error.value = "Error al cargar clientes: " + e.message;
        } finally {
            loading.value = false;
        }
    };

    const fetchCliente = async (id) => {
        loading.value = true;
        error.value = null;
        try {
            clienteActual.value = await getClienteById(id);
            if (clienteActual.value) {
                ordenesCliente.value = await getOrdenesByCliente(id);
            }
        } catch (e) {
            error.value = "Error al cargar el cliente: " + e.message;
        } finally {
            loading.value = false;
        }
    };

    const search = async (query) => {
        if (!query || query.trim() === '') {
            return fetchClientes();
        }
        loading.value = true;
        error.value = null;
        try {
            clientes.value = await searchClientes(query);
        } catch (e) {
            error.value = "Error en la búsqueda: " + e.message;
        } finally {
            loading.value = false;
        }
    };

    const saveCliente = async (clienteData) => {
        loading.value = true;
        error.value = null;
        try {
            validators.validateCliente(clienteData);
            let id;
            if (clienteData.id_cliente) {
                await updateCliente(clienteData.id_cliente, clienteData);
                id = clienteData.id_cliente;
            } else {
                id = await createCliente(clienteData);
            }
            return id;
        } catch (e) {
            error.value = e.message;
            throw e;
        } finally {
            loading.value = false;
        }
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
