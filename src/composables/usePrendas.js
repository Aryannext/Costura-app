import { ref } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { savePhotoFromBase64, deletePhotoFile } from '../services/photoStorage.js';
import { validators } from '../services/validators.js';
import { ESTADO_ORDEN } from '../services/estadoOrden.js';
import { useAsyncAction } from './useAsyncAction.js';
import { 
    getTiposPrenda, 
    getPrendasByOrden, 
    createPrenda, 
    updateEstadoPrenda, 
    addObservacion, 
    getObservacionesByPrenda, 
    saveFotografia, 
    getFotografiasByPrenda,
    deleteFotografia,
    updatePrenda,
    getContextoPrenda,
    eliminarPrenda,
    getDescripcionesFrecuentes
} from '../database/queries/prendas.js';
import { getOrdenById } from '../database/queries/ordenes.js';

const tiposPrenda = ref([]);
const prendas = ref([]);
const descripcionesFrecuentes = ref([]);

export function usePrendas() {

    const { loading, error, execute } = useAsyncAction();

    const fetchTiposPrenda = async () => {
        return execute(async () => {
            tiposPrenda.value = await getTiposPrenda();
        });
    };

    const fetchPrendas = async (id_orden) => {
        return execute(async () => {
            prendas.value = await getPrendasByOrden(id_orden);
        });
    };

    const savePrenda = async (prendaData) => {
        return execute(async () => {
            validators.validatePrenda(prendaData);

            // RN-12, P1-15: antes sólo la pantalla ocultaba el botón "+ Prenda".
            const orden = await getOrdenById(prendaData.id_orden);
            if (!orden) throw new Error("La orden no existe.");
            validators.validateOrdenAccionPermitida(orden, 'agregar_prenda');

            const id = await createPrenda(prendaData);
            await fetchPrendas(prendaData.id_orden); // refresh list
            return id;
        }, {
            successMessage: 'Prenda añadida exitosamente',
            toastError: true
        });
    };

    const editPrenda = async (id_prenda, descripcion_arreglo, valor, id_orden) => {
        return execute(async () => {
            if (!descripcion_arreglo || descripcion_arreglo.trim() === '') throw new Error("La descripción es obligatoria");

            const { totalOtrasPrendas, totalPagado } = await getContextoPrenda(id_prenda, id_orden);
            validators.validateValorPrendaContraPagos({ valorNuevo: valor, totalOtrasPrendas, totalPagado });

            await updatePrenda(id_prenda, descripcion_arreglo, valor, id_orden);
            await fetchPrendas(id_orden);
        }, {
            successMessage: 'Prenda actualizada exitosamente',
            toastError: true
        });
    };

    const removePrenda = async (id_prenda, id_orden) => {
        return execute(async () => {
            const contexto = await getContextoPrenda(id_prenda, id_orden);
            validators.validateEliminarPrenda(contexto);

            const rutasDeFotos = await eliminarPrenda(id_prenda, id_orden, contexto);
            await Promise.all(rutasDeFotos.map(deletePhotoFile));
            await fetchPrendas(id_orden);
        }, {
            successMessage: 'Prenda eliminada',
            toastError: true
        });
    };

    const changeEstado = async (id_prenda, id_estado_prenda, id_orden) => {
        return execute(async () => {
            // El <select> de PrendaCard entrega el valor como texto.
            const estadoNuevo = Number(id_estado_prenda);

            const { estadoPrenda } = await getContextoPrenda(id_prenda, id_orden);
            validators.validateCambioEstadoPrenda(estadoPrenda, estadoNuevo);

            const { desde, hacia } = await updateEstadoPrenda(id_prenda, estadoNuevo, id_orden);
            await fetchPrendas(id_orden);

            // La orden ya cambió sola (RN-06); la vista sólo ofrece el aviso.
            return { ordenPasoALista: hacia === ESTADO_ORDEN.LISTA && desde !== ESTADO_ORDEN.LISTA };
        }, {
            successMessage: 'Estado de la prenda actualizado',
            toastError: true
        });
    };

    const takePhoto = async (id_prenda) => {
        return execute(async () => {
            let image;
            try {
                image = await Camera.getPhoto({
                    quality: 60,
                    width: 1080,
                    allowEditing: false,
                    resultType: CameraResultType.Base64,
                    source: CameraSource.Prompt
                });
            } catch (e) {
                if (e.message === 'User cancelled photos app' || e.message === 'User cancelled') {
                    // Normal user cancellation - do NOT throw, just return null.
                    return null;
                }
                // Unexpected error from Camera plugin, throw it so execute catches and toasts it
                throw e;
            }

            // Se guarda sólo el nombre del archivo, no la ruta absoluta: el
            // directorio de datos cambia de sitio al reinstalar, y con rutas
            // absolutas las fotos quedaban apuntando a la nada.
            let rutaGuardada = '';

            if (image.base64String) {
                const fileName = `prenda_${id_prenda}_${new Date().getTime()}.jpeg`;
                rutaGuardada = await savePhotoFromBase64(image.base64String, fileName);
            } else if (image.webPath) {
                rutaGuardada = image.webPath;
            }

            if (rutaGuardada) {
                await saveFotografia(id_prenda, rutaGuardada);
                return rutaGuardada;
            }
            return null;
        }, {
            successMessage: 'Fotografía guardada',
            toastError: true
        });
    };

    const fetchFotos = async (id_prenda) => {
        return execute(async () => {
            return await getFotografiasByPrenda(id_prenda);
        });
    };

    const removeFoto = async (id_fotografia) => {
        return execute(async () => {
            await deleteFotografia(id_fotografia);
        }, {
            successMessage: 'Fotografía eliminada',
            toastError: 'Error al eliminar la fotografía'
        });
    };

    const addNewObservacion = async (id_prenda, descripcion) => {
        return execute(async () => {
            if (!descripcion || descripcion.trim() === '') return;
            await addObservacion(id_prenda, descripcion);
        }, {
            successMessage: 'Observación añadida',
            toastError: 'Error al añadir observación'
        });
    };

    const fetchObservaciones = async (id_prenda) => {
        return execute(async () => {
            return await getObservacionesByPrenda(id_prenda);
        });
    };

    const fetchDescripcionesFrecuentes = async () => {
        return execute(async () => {
            descripcionesFrecuentes.value = await getDescripcionesFrecuentes();
        });
    };

    const clearCurrentState = () => {
        prendas.value = [];
    };

    return {
        tiposPrenda,
        prendas,
        loading,
        error,
        fetchTiposPrenda,
        fetchPrendas,
        savePrenda,
        editPrenda,
        removePrenda,
        changeEstado,
        takePhoto,
        fetchFotos,
        removeFoto,
        addNewObservacion,
        fetchObservaciones,
        descripcionesFrecuentes,
        fetchDescripcionesFrecuentes,
        clearCurrentState
    };
}
