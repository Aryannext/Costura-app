import { ref } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { validators } from '../services/validators.js';
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
    getDescripcionesFrecuentes
} from '../database/queries/prendas.js';

export function usePrendas() {
    const tiposPrenda = ref([]);
    const prendas = ref([]);
    const descripcionesFrecuentes = ref([]);

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
            if (valor <= 0) throw new Error("El valor debe ser mayor a cero");
            if (!descripcion_arreglo || descripcion_arreglo.trim() === '') throw new Error("La descripción es obligatoria");
            
            await updatePrenda(id_prenda, descripcion_arreglo, valor, id_orden);
            await fetchPrendas(id_orden);
        }, {
            successMessage: 'Prenda actualizada exitosamente',
            toastError: true
        });
    };

    const changeEstado = async (id_prenda, id_estado_prenda, id_orden) => {
        return execute(async () => {
            await updateEstadoPrenda(id_prenda, id_estado_prenda, id_orden);
            await fetchPrendas(id_orden);
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

            let finalUri = '';
            
            if (image.base64String) {
                const fileName = `prenda_${id_prenda}_${new Date().getTime()}.jpeg`;
                await Filesystem.writeFile({
                    path: fileName,
                    data: image.base64String,
                    directory: Directory.Data
                });
                const stat = await Filesystem.getUri({
                    path: fileName,
                    directory: Directory.Data
                });
                finalUri = stat.uri;
            } else if (image.webPath) {
                finalUri = image.webPath;
            }
            
            if (finalUri) {
                await saveFotografia(id_prenda, finalUri);
                return finalUri;
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

    return {
        tiposPrenda,
        prendas,
        loading,
        error,
        fetchTiposPrenda,
        fetchPrendas,
        savePrenda,
        editPrenda,
        changeEstado,
        takePhoto,
        fetchFotos,
        removeFoto,
        addNewObservacion,
        fetchObservaciones,
        descripcionesFrecuentes,
        fetchDescripcionesFrecuentes
    };
}
