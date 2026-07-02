import { ref } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { validators } from '../services/validators.js';
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
    const loading = ref(false);
    const error = ref(null);

    const fetchTiposPrenda = async () => {
        try {
            tiposPrenda.value = await getTiposPrenda();
        } catch (e) {
            console.error("Error fetching tipos prenda", e);
        }
    };

    const fetchPrendas = async (id_orden) => {
        loading.value = true;
        error.value = null;
        try {
            prendas.value = await getPrendasByOrden(id_orden);
        } catch (e) {
            error.value = "Error al cargar prendas: " + e.message;
        } finally {
            loading.value = false;
        }
    };

    const savePrenda = async (prendaData) => {
        loading.value = true;
        error.value = null;
        try {
            validators.validatePrenda(prendaData);
            const id = await createPrenda(prendaData);
            await fetchPrendas(prendaData.id_orden); // refresh list
            return id;
        } catch (e) {
            error.value = e.message;
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const editPrenda = async (id_prenda, descripcion_arreglo, valor, id_orden) => {
        loading.value = true;
        error.value = null;
        try {
            if (valor <= 0) throw new Error("El valor debe ser mayor a cero");
            if (!descripcion_arreglo || descripcion_arreglo.trim() === '') throw new Error("La descripción es obligatoria");
            
            await updatePrenda(id_prenda, descripcion_arreglo, valor, id_orden);
            await fetchPrendas(id_orden);
        } catch (e) {
            error.value = e.message;
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const changeEstado = async (id_prenda, id_estado_prenda, id_orden) => {
        loading.value = true;
        error.value = null;
        try {
            await updateEstadoPrenda(id_prenda, id_estado_prenda, id_orden);
            await fetchPrendas(id_orden);
        } catch (e) {
            error.value = "Error al cambiar estado de la prenda: " + e.message;
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const takePhoto = async (id_prenda) => {
        try {
            const image = await Camera.getPhoto({
                quality: 60,
                width: 1080,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Prompt // Asks user: Camera or Gallery
            });

            let finalUri = '';
            
            if (image.base64String) {
                // Generar nombre de archivo único
                const fileName = `prenda_${id_prenda}_${new Date().getTime()}.jpeg`;
                
                // Guardar permanentemente en el disco del celular
                await Filesystem.writeFile({
                    path: fileName,
                    data: image.base64String,
                    directory: Directory.Data
                });
                
                // Obtener la URI nativa permanente
                const stat = await Filesystem.getUri({
                    path: fileName,
                    directory: Directory.Data
                });
                
                finalUri = stat.uri;
            } else if (image.webPath) {
                // Fallback para pruebas web
                finalUri = image.webPath;
            }
            
            if (finalUri) {
                await saveFotografia(id_prenda, finalUri);
                return finalUri;
            }
            return null;
        } catch (e) {
            if (e.message !== 'User cancelled photos app' && e.message !== 'User cancelled') {
                console.error("Error taking photo", e);
                throw new Error("Error al tomar o guardar la fotografía");
            }
            return null;
        }
    };

    const fetchFotos = async (id_prenda) => {
        return await getFotografiasByPrenda(id_prenda);
    };

    const removeFoto = async (id_fotografia) => {
        try {
            await deleteFotografia(id_fotografia);
        } catch (e) {
            console.error("Error deleting photo", e);
            throw new Error("Error al eliminar la fotografía");
        }
    };

    const addNewObservacion = async (id_prenda, descripcion) => {
        if (!descripcion || descripcion.trim() === '') return;
        await addObservacion(id_prenda, descripcion);
    };

    const fetchObservaciones = async (id_prenda) => {
        return await getObservacionesByPrenda(id_prenda);
    };

    const descripcionesFrecuentes = ref([]);
    const fetchDescripcionesFrecuentes = async () => {
        try {
            descripcionesFrecuentes.value = await getDescripcionesFrecuentes();
        } catch (e) {
            console.error("Error fetching descripciones frecuentes", e);
        }
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
