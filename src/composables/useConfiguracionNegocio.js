import { ref } from 'vue';
import { getConfig, updateConfig } from '../database/queries/configuracion.js';
import { validators } from '../services/validators.js';
import { DIAS_ANTICIPACION_POR_DEFECTO, interpretarDiasAnticipacion } from '../services/vencimientos.js';

export const CLAVE_DIAS_ANTICIPACION = 'dias_anticipacion_vencer';

// Compartido entre componentes: al guardarlo en Ajustes, la campana del
// encabezado se recalcula sin recargar la aplicación.
const diasAnticipacion = ref(DIAS_ANTICIPACION_POR_DEFECTO);

export async function cargarDiasAnticipacion() {
    try {
        diasAnticipacion.value = interpretarDiasAnticipacion(await getConfig(CLAVE_DIAS_ANTICIPACION));
    } catch (error) {
        // Sin base de datos todavía se puede avisar con el valor por defecto.
        console.warn("No se pudieron leer los días de anticipación", error);
    }
    return diasAnticipacion.value;
}

export async function guardarDiasAnticipacion(dias) {
    // Un <input type="number"> vacío llega como '' y Number('') es 0: se trata como inválido.
    const valor = dias === '' || dias === null || dias === undefined ? Number.NaN : Number(dias);
    validators.validateDiasAnticipacion(valor);

    await updateConfig(CLAVE_DIAS_ANTICIPACION, String(valor));
    diasAnticipacion.value = valor;
}

export function useConfiguracionNegocio() {
    return { diasAnticipacion, cargarDiasAnticipacion, guardarDiasAnticipacion };
}
