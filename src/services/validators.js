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
        const phoneRegex = /^\+?[0-9\s\-]{7,15}$/;
        if (!phoneRegex.test(cliente.telefono.trim())) {
            throw new Error("El número de teléfono no es válido. Solo se permiten números, espacios y el signo +.");
        }
        return true;
    },

    // RN-05: fecha_entrega_estimada >= fecha_creacion
    validateFechaEntrega: (fechaEntregaEstimada, fechaCreacion) => {
        const entrega = new Date(fechaEntregaEstimada);
        const creacion = fechaCreacion ? new Date(fechaCreacion) : new Date();
        // compare only the dates without time
        entrega.setHours(0,0,0,0);
        creacion.setHours(0,0,0,0);
        
        if (entrega < creacion) {
            throw new Error("La fecha estimada de entrega no puede ser anterior a la fecha de creación.");
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
    }
};
