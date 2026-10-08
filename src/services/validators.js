import { aFechaLocal } from './fechas.js';
import { DIAS_ANTICIPACION_MAXIMO } from './vencimientos.js';
import { formatearMoneda } from './formato.js';

// Longitud mínima de la contraseña de acceso a la aplicación.
export const MIN_PASSWORD_LENGTH = 8;

export const validators = {
    // RN-01: nombre + teléfono obligatorios
    validateCliente: (cliente) => {
        if (!cliente.nombre || cliente.nombre.trim() === '') {
            throw new Error("El nombre del cliente es obligatorio.");
        }
        if (!cliente.telefono || cliente.telefono.trim() === '') {
            throw new Error("El número de teléfono es obligatorio.");
        }
        
        // Regex para validar teléfonos: opcional +, seguido de 7 a 15 dígitos
        const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
        if (!phoneRegex.test(cliente.telefono.trim())) {
            throw new Error("El número de teléfono no es válido. Solo se permiten números, espacios y el signo +.");
        }
        return true;
    },

    // RN-05: fecha_entrega_estimada >= fecha_creacion
    validateFechaEntrega: (fechaEntregaEstimada, fechaCreacion) => {
        const entrega = aFechaLocal(fechaEntregaEstimada);
        const creacion = aFechaLocal(fechaCreacion || new Date());

        if (entrega < creacion) {
            throw new Error("La fecha estimada de entrega no puede ser anterior a la fecha de creación.");
        }
        return true;
    },

    // La ropa pudo recibirse antes de usar la app, pero nunca en el futuro.
    validateFechaRecepcion: (fechaRecepcion) => {
        if (!fechaRecepcion) return true;
        if (aFechaLocal(String(fechaRecepcion).slice(0, 10)) > aFechaLocal(new Date())) {
            throw new Error("La fecha de recepción no puede ser posterior a hoy.");
        }
        return true;
    },

    // RN-11: orden entregada NO se puede cancelar
    // RN-12, RN-13: orden cancelada no recibe prendas ni pagos
    validateOrdenAccionPermitida: (orden, accion) => {
        // accion = 'cancelar', 'agregar_prenda', 'registrar_pago', 'reabrir'
        // estado_orden (id): 1: Pendiente, 2: En Proceso, 3: Lista para Entregar, 4: Entregada, 5: Cancelada
        
        if (accion === 'cancelar' && orden.id_estado_orden === 4) {
            throw new Error("Una orden entregada no se puede cancelar.");
        }
        
        if (accion === 'agregar_prenda' && orden.id_estado_orden === 5) {
            throw new Error("No se pueden agregar prendas a una orden cancelada.");
        }

        // Una prenda nueva en una orden entregada la dejaría Entregada con
        // costuras pendientes. Para corregir está la reapertura (RN-16).
        if (accion === 'agregar_prenda' && orden.id_estado_orden === 4) {
            throw new Error("No se pueden agregar prendas a una orden entregada. Reábrela primero.");
        }
        
        if (accion === 'registrar_pago' && orden.id_estado_orden === 5) {
            throw new Error("No se pueden registrar pagos a una orden cancelada.");
        }
        
        if (accion === 'reabrir' && orden.id_estado_orden !== 4) {
            throw new Error("Solo se pueden reabrir órdenes que se encuentren Entregadas.");
        }
        
        return true;
    },

    // RN-19: descripción obligatoria
    // RN-20: valor > 0
    // RN-24: tipo obligatorio
    validatePrenda: (prenda) => {
        if (!prenda.descripcion_arreglo || prenda.descripcion_arreglo.trim() === '') {
            throw new Error("La descripción del arreglo es obligatoria.");
        }
        if (!prenda.id_tipo_prenda) {
            throw new Error("El tipo de prenda es obligatorio.");
        }
        if (prenda.valor == null || prenda.valor <= 0) {
            throw new Error("El valor de la prenda debe ser mayor a cero.");
        }
        return true;
    },

    // RN-26: valor abono > 0
    // RN-27: SUM(abonos) <= valor_total -> en este caso lo validamos contra el saldo pendiente
    validatePago: (pago, saldoPendiente) => {
        if (pago.valor == null || pago.valor <= 0) {
            throw new Error("El valor del abono debe ser mayor a cero.");
        }
        if (pago.valor > saldoPendiente) {
            throw new Error(`El valor del abono (${pago.valor}) no puede superar el saldo pendiente (${saldoPendiente}).`);
        }
        return true;
    },

    // RN-20: valor > 0
    // RN-27 y RN-29: al corregir el precio de una prenda, el total de la orden
    // no puede quedar por debajo de lo ya pagado, o el saldo sería negativo.
    validateValorPrendaContraPagos: ({ valorNuevo, totalOtrasPrendas, totalPagado }) => {
        if (valorNuevo == null || valorNuevo <= 0) {
            throw new Error("El valor de la prenda debe ser mayor a cero.");
        }
        const nuevoTotal = totalOtrasPrendas + valorNuevo;
        if (nuevoTotal < totalPagado) {
            throw new Error(
                `Con ese valor la orden quedaría en ${formatearMoneda(nuevoTotal)}, pero el cliente ya pagó ${formatearMoneda(totalPagado)}. ` +
                `El saldo no puede quedar negativo.`
            );
        }
        return true;
    },

    // RN-06, RN-16, RN-17 (HU-23): Pendiente, En Proceso y Lista para Entregar
    // los decide el sistema según las prendas. A mano sólo se entrega, se
    // cancela o se reabre.
    validateCambioManualEstado: (orden, destino) => {
        if (destino === 5) {
            return validators.validateOrdenAccionPermitida(orden, 'cancelar');
        }
        if (destino === 4) {
            if (orden.id_estado_orden !== 3) {
                throw new Error("Sólo se puede entregar una orden Lista para Entregar, es decir, con todas sus prendas terminadas.");
            }
            return true;
        }
        if (destino === 2 && orden.id_estado_orden === 4) {
            return validators.validateOrdenAccionPermitida(orden, 'reabrir');
        }
        throw new Error("El estado de la orden cambia solo según sus prendas: no se puede fijar a mano.");
    },

    // RN-38: el período de anticipación de "próximas a vencer" lo configura el negocio.
    validateDiasAnticipacion: (dias) => {
        if (!Number.isInteger(dias) || dias < 0 || dias > DIAS_ANTICIPACION_MAXIMO) {
            throw new Error(`Los días de anticipación deben ser un número entero entre 0 y ${DIAS_ANTICIPACION_MAXIMO}.`);
        }
        return true;
    },

    // RN-31: el aviso de orden lista sólo se envía con la orden Lista para Entregar.
    validateAvisoOrdenLista: (orden) => {
        if (orden?.id_estado_orden !== 3) {
            throw new Error("Sólo se avisa al cliente cuando la orden está Lista para Entregar.");
        }
        return true;
    },

    // RN-08 y CP-18: una prenda sólo se entrega cuando está terminada.
    validateCambioEstadoPrenda: (estadoActual, estadoNuevo) => {
        if (estadoNuevo === 4 && estadoActual !== 3 && estadoActual !== 4) {
            throw new Error("Sólo se puede entregar una prenda terminada. Márcala primero como Terminada.");
        }
        return true;
    },

    // P1-9: eliminar una prenda es corregir un error de captura, no deshacer
    // trabajo entregado ni dejar la cuenta en negativo (RN-29).
    validateEliminarPrenda: ({ estadoOrden, estadoPrenda, totalOtrasPrendas, totalPagado }) => {
        if (estadoOrden === 4) {
            throw new Error("No se pueden eliminar prendas de una orden entregada.");
        }
        if (estadoOrden === 5) {
            throw new Error("No se pueden eliminar prendas de una orden cancelada.");
        }
        if (estadoPrenda === 4) {
            throw new Error("Una prenda ya entregada al cliente no se puede eliminar.");
        }
        if (totalOtrasPrendas < totalPagado) {
            throw new Error(
                `Sin esta prenda la orden quedaría en ${formatearMoneda(totalOtrasPrendas)}, pero el cliente ya pagó ${formatearMoneda(totalPagado)}. ` +
                `Anula primero el pago que corresponda.`
            );
        }
        return true;
    },

    // P1-9, RN-14, RN-35: un pago se anula con motivo, nunca se borra.
    validateAnularPago: (pago, motivo) => {
        if (!pago) {
            throw new Error("El pago no existe.");
        }
        if (pago.anulado_en) {
            throw new Error("Este pago ya está anulado.");
        }
        if (!motivo || motivo.trim() === '') {
            throw new Error("Escribe el motivo de la anulación.");
        }
        return true;
    },

    // RNF-07, RNF-08: la clave de acceso debe poder cambiarse y nunca quedarse
    // en la que trae la app de fábrica.
    // `passwordPorDefecto` se recibe como opción para no acoplar los validadores
    // a la capa de base de datos.
    validateCambioPassword: ({ actual, nueva, confirmacion }, { passwordPorDefecto } = {}) => {
        if (!actual || actual.trim() === '') {
            throw new Error("Debes escribir tu contraseña actual.");
        }
        if (!nueva || nueva.length < MIN_PASSWORD_LENGTH) {
            throw new Error(`La contraseña nueva debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
        }
        if (nueva === actual) {
            throw new Error("La contraseña nueva debe ser distinta de la actual.");
        }
        if (passwordPorDefecto && nueva === passwordPorDefecto) {
            throw new Error("No puedes usar la contraseña que trae la aplicación de fábrica.");
        }
        if (nueva !== confirmacion) {
            throw new Error("La confirmación no coincide con la contraseña nueva.");
        }
        return true;
    }
};
