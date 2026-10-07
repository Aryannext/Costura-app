import { describe, it, expect } from 'vitest';
import { validators, MIN_PASSWORD_LENGTH } from '../validators.js';

const dosDigitos = n => String(n).padStart(2, '0');
const enISO = f => `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`;

describe('validators.validateCliente', () => {
    it('Nombre y teléfono válidos -> pasa', () => {
        expect(validators.validateCliente({ nombre: 'Rosa Sastre', telefono: '3101112222' })).toBe(true);
    });

    it('Teléfono con espacios y guiones -> pasa', () => {
        expect(validators.validateCliente({ nombre: 'Ana', telefono: '+57 310-111' })).toBe(true);
    });

    it('Sin nombre -> rechazo', () => {
        expect(() => validators.validateCliente({ nombre: '  ', telefono: '3101112222' }))
            .toThrow('El nombre del cliente es obligatorio.');
    });

    it('Sin teléfono -> rechazo', () => {
        expect(() => validators.validateCliente({ nombre: 'Ana', telefono: '' }))
            .toThrow('El número de teléfono es obligatorio.');
    });

    it('Teléfono con letras -> rechazo', () => {
        expect(() => validators.validateCliente({ nombre: 'Ana', telefono: '310ABC1234' }))
            .toThrow('El número de teléfono no es válido. Solo se permiten números, espacios y el signo +.');
    });

    it('Teléfono demasiado corto -> rechazo', () => {
        expect(() => validators.validateCliente({ nombre: 'Ana', telefono: '12345' }))
            .toThrow('El número de teléfono no es válido. Solo se permiten números, espacios y el signo +.');
    });
});

describe('validators.validateFechaEntrega', () => {
    // Regresión: 'YYYY-MM-DD' se leía como medianoche UTC, que al oeste de
    // Greenwich cae el día anterior. En Colombia no se podía registrar una
    // orden para entregar hoy mismo.
    it('Entrega HOY -> se acepta', () => {
        expect(validators.validateFechaEntrega(enISO(new Date()))).toBe(true);
    });

    it('Entrega mañana -> se acepta', () => {
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        expect(validators.validateFechaEntrega(enISO(manana))).toBe(true);
    });

    it('Entrega ayer -> rechazo', () => {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        expect(() => validators.validateFechaEntrega(enISO(ayer)))
            .toThrow('La fecha estimada de entrega no puede ser anterior a la fecha de creación.');
    });

    it('Entrega anterior a una fecha de creación explícita -> rechazo', () => {
        expect(() => validators.validateFechaEntrega('2026-03-01', '2026-03-15'))
            .toThrow('La fecha estimada de entrega no puede ser anterior a la fecha de creación.');
    });

    it('Entrega el mismo día de la creación -> se acepta', () => {
        expect(validators.validateFechaEntrega('2026-03-15', '2026-03-15')).toBe(true);
    });
});

describe('validators.validateOrdenAccionPermitida', () => {
    it('RN-11: una orden entregada no se puede cancelar', () => {
        expect(() => validators.validateOrdenAccionPermitida({ id_estado_orden: 4 }, 'cancelar'))
            .toThrow('Una orden entregada no se puede cancelar.');
    });

    it('Una orden en proceso sí se puede cancelar', () => {
        expect(validators.validateOrdenAccionPermitida({ id_estado_orden: 2 }, 'cancelar')).toBe(true);
    });

    it('RN-12: no se añaden prendas a una orden cancelada', () => {
        expect(() => validators.validateOrdenAccionPermitida({ id_estado_orden: 5 }, 'agregar_prenda'))
            .toThrow('No se pueden agregar prendas a una orden cancelada.');
    });

    it('tampoco a una orden entregada: hay que reabrirla', () => {
        expect(() => validators.validateOrdenAccionPermitida({ id_estado_orden: 4 }, 'agregar_prenda'))
            .toThrow('No se pueden agregar prendas a una orden entregada. Reábrela primero.');
        expect(validators.validateOrdenAccionPermitida({ id_estado_orden: 2 }, 'agregar_prenda')).toBe(true);
    });

    it('RN-13: no se registran pagos en una orden cancelada', () => {
        expect(() => validators.validateOrdenAccionPermitida({ id_estado_orden: 5 }, 'registrar_pago'))
            .toThrow('No se pueden registrar pagos a una orden cancelada.');
    });

    it('Sólo se reabren órdenes entregadas', () => {
        expect(validators.validateOrdenAccionPermitida({ id_estado_orden: 4 }, 'reabrir')).toBe(true);
        expect(() => validators.validateOrdenAccionPermitida({ id_estado_orden: 3 }, 'reabrir'))
            .toThrow('Solo se pueden reabrir órdenes que se encuentren Entregadas.');
    });
});

describe('validators.validatePrenda', () => {
    const prenda = { descripcion_arreglo: 'Ruedo de vestido', id_tipo_prenda: 3, valor: 80000 };

    it('Prenda completa -> pasa', () => {
        expect(validators.validatePrenda(prenda)).toBe(true);
    });

    it('Sin descripción -> rechazo', () => {
        expect(() => validators.validatePrenda({ ...prenda, descripcion_arreglo: '   ' }))
            .toThrow('La descripción del arreglo es obligatoria.');
    });

    it('Sin tipo de prenda -> rechazo', () => {
        expect(() => validators.validatePrenda({ ...prenda, id_tipo_prenda: null }))
            .toThrow('El tipo de prenda es obligatorio.');
    });

    it('RN-20: valor cero o negativo -> rechazo', () => {
        expect(() => validators.validatePrenda({ ...prenda, valor: 0 }))
            .toThrow('El valor de la prenda debe ser mayor a cero.');
        expect(() => validators.validatePrenda({ ...prenda, valor: -100 }))
            .toThrow('El valor de la prenda debe ser mayor a cero.');
    });
});

describe('validators.validatePago', () => {
    it('Abono dentro del saldo -> pasa', () => {
        expect(validators.validatePago({ valor: 30000 }, 80000)).toBe(true);
    });

    it('Abono exacto del saldo -> pasa', () => {
        expect(validators.validatePago({ valor: 80000 }, 80000)).toBe(true);
    });

    it('RN-26: abono de cero o negativo -> rechazo', () => {
        expect(() => validators.validatePago({ valor: 0 }, 80000))
            .toThrow('El valor del abono debe ser mayor a cero.');
    });

    it('RN-27: abono mayor que el saldo pendiente -> rechazo', () => {
        expect(() => validators.validatePago({ valor: 90000 }, 80000))
            .toThrow('El valor del abono (90000) no puede superar el saldo pendiente (80000).');
    });
});

describe('validators.validateValorPrendaContraPagos', () => {
    it('Subir el precio con pagos registrados -> pasa', () => {
        expect(validators.validateValorPrendaContraPagos({
            valorNuevo: 120000, totalOtrasPrendas: 0, totalPagado: 100000
        })).toBe(true);
    });

    it('Bajar el precio hasta igualar lo pagado -> pasa', () => {
        expect(validators.validateValorPrendaContraPagos({
            valorNuevo: 60000, totalOtrasPrendas: 0, totalPagado: 60000
        })).toBe(true);
    });

    it('RN-29: bajar el precio por debajo de lo pagado -> rechazo', () => {
        expect(() => validators.validateValorPrendaContraPagos({
            valorNuevo: 60000, totalOtrasPrendas: 0, totalPagado: 100000
        })).toThrow('Con ese valor la orden quedaría en $60.000, pero el cliente ya pagó $100.000. El saldo no puede quedar negativo.');
    });

    it('RN-29: cuenta las demás prendas de la orden', () => {
        expect(validators.validateValorPrendaContraPagos({
            valorNuevo: 10000, totalOtrasPrendas: 50000, totalPagado: 60000
        })).toBe(true);
        expect(() => validators.validateValorPrendaContraPagos({
            valorNuevo: 9999, totalOtrasPrendas: 50000, totalPagado: 60000
        })).toThrow('El saldo no puede quedar negativo.');
    });

    it('RN-20: valor cero o negativo -> rechazo', () => {
        expect(() => validators.validateValorPrendaContraPagos({
            valorNuevo: 0, totalOtrasPrendas: 0, totalPagado: 0
        })).toThrow('El valor de la prenda debe ser mayor a cero.');
    });
});

describe('validators.validateCambioManualEstado (RN-06, RN-16, RN-17)', () => {
    const A_MANO = 'El estado de la orden cambia solo según sus prendas: no se puede fijar a mano.';

    it('Entregar una orden Lista para Entregar -> pasa', () => {
        expect(validators.validateCambioManualEstado({ id_estado_orden: 3 }, 4)).toBe(true);
    });

    it('Entregar una orden con prendas sin terminar -> rechazo', () => {
        expect(() => validators.validateCambioManualEstado({ id_estado_orden: 2 }, 4))
            .toThrow('Sólo se puede entregar una orden Lista para Entregar, es decir, con todas sus prendas terminadas.');
    });

    it('Cancelar una orden abierta -> pasa; una entregada -> rechazo', () => {
        expect(validators.validateCambioManualEstado({ id_estado_orden: 2 }, 5)).toBe(true);
        expect(() => validators.validateCambioManualEstado({ id_estado_orden: 4 }, 5))
            .toThrow('Una orden entregada no se puede cancelar.');
    });

    it('RN-16 / CP-22: reabrir una orden entregada a En Proceso -> pasa', () => {
        expect(validators.validateCambioManualEstado({ id_estado_orden: 4 }, 2)).toBe(true);
    });

    it('Fijar a mano Pendiente, En Proceso o Lista -> rechazo', () => {
        for (const [actual, destino] of [[1, 2], [2, 3], [3, 1], [4, 1]]) {
            expect(() => validators.validateCambioManualEstado({ id_estado_orden: actual }, destino)).toThrow(A_MANO);
        }
    });
});

describe('validators.validateAvisoOrdenLista (RN-31)', () => {
    it('orden Lista para Entregar -> pasa', () => {
        expect(validators.validateAvisoOrdenLista({ id_estado_orden: 3 })).toBe(true);
    });

    it('cualquier otro estado, o sin orden -> rechazo', () => {
        for (const orden of [{ id_estado_orden: 1 }, { id_estado_orden: 2 }, { id_estado_orden: 4 }, { id_estado_orden: 5 }, null]) {
            expect(() => validators.validateAvisoOrdenLista(orden))
                .toThrow('Sólo se avisa al cliente cuando la orden está Lista para Entregar.');
        }
    });
});

describe('validators.validateCambioEstadoPrenda (CP-18)', () => {
    it('Terminada -> Entregada pasa', () => {
        expect(validators.validateCambioEstadoPrenda(3, 4)).toBe(true);
    });

    it('Pendiente o En Proceso -> Entregada rechazo', () => {
        for (const actual of [1, 2]) {
            expect(() => validators.validateCambioEstadoPrenda(actual, 4))
                .toThrow('Sólo se puede entregar una prenda terminada. Márcala primero como Terminada.');
        }
    });

    it('Retroceder de estado -> pasa', () => {
        expect(validators.validateCambioEstadoPrenda(3, 2)).toBe(true);
        expect(validators.validateCambioEstadoPrenda(4, 3)).toBe(true);
    });
});

describe('validators.validateDiasAnticipacion (RN-38)', () => {
    it('0 a 30 días enteros -> pasa', () => {
        expect(validators.validateDiasAnticipacion(0)).toBe(true);
        expect(validators.validateDiasAnticipacion(30)).toBe(true);
    });

    it('fuera de rango, decimal o no numérico -> rechazo', () => {
        for (const dias of [-1, 31, 2.5, NaN]) {
            expect(() => validators.validateDiasAnticipacion(dias))
                .toThrow('Los días de anticipación deben ser un número entero entre 0 y 30.');
        }
    });
});

describe('validators.validateEliminarPrenda (P1-9)', () => {
    const contexto = { estadoOrden: 2, estadoPrenda: 1, totalOtrasPrendas: 30000, totalPagado: 20000 };

    it('Prenda pendiente en orden abierta, lo pagado sigue cubierto -> pasa', () => {
        expect(validators.validateEliminarPrenda(contexto)).toBe(true);
    });

    it('Orden entregada -> rechazo', () => {
        expect(() => validators.validateEliminarPrenda({ ...contexto, estadoOrden: 4 }))
            .toThrow('No se pueden eliminar prendas de una orden entregada.');
    });

    it('Orden cancelada -> rechazo', () => {
        expect(() => validators.validateEliminarPrenda({ ...contexto, estadoOrden: 5 }))
            .toThrow('No se pueden eliminar prendas de una orden cancelada.');
    });

    it('Prenda ya entregada -> rechazo', () => {
        expect(() => validators.validateEliminarPrenda({ ...contexto, estadoPrenda: 4 }))
            .toThrow('Una prenda ya entregada al cliente no se puede eliminar.');
    });

    it('RN-29: sin la prenda el total quedaría por debajo de lo pagado -> rechazo', () => {
        expect(() => validators.validateEliminarPrenda({ ...contexto, totalOtrasPrendas: 10000 }))
            .toThrow('Sin esta prenda la orden quedaría en $10.000, pero el cliente ya pagó $20.000. Anula primero el pago que corresponda.');
    });
});

describe('validators.validateAnularPago (P1-9)', () => {
    const pago = { id_pago: 1, valor: 30000, id_orden: 1, anulado_en: null };

    it('Pago vigente con motivo -> pasa', () => {
        expect(validators.validateAnularPago(pago, 'Se registró dos veces')).toBe(true);
    });

    it('Pago inexistente -> rechazo', () => {
        expect(() => validators.validateAnularPago(null, 'x')).toThrow('El pago no existe.');
    });

    it('Pago ya anulado -> rechazo', () => {
        expect(() => validators.validateAnularPago({ ...pago, anulado_en: '2026-09-13 10:00:00' }, 'x'))
            .toThrow('Este pago ya está anulado.');
    });

    it('Sin motivo -> rechazo', () => {
        expect(() => validators.validateAnularPago(pago, '   ')).toThrow('Escribe el motivo de la anulación.');
    });
});

describe('validators.validateCambioPassword', () => {
    const PASSWORD_FABRICA = 'admin123';
    const valido = {
        actual: 'admin123',
        nueva: 'CosturaSegura2026',
        confirmacion: 'CosturaSegura2026'
    };

    it('Cambio correcto -> pasa', () => {
        expect(
            validators.validateCambioPassword(valido, { passwordPorDefecto: PASSWORD_FABRICA })
        ).toBe(true);
    });

    it('Sin contraseña actual -> rechazo', () => {
        expect(() =>
            validators.validateCambioPassword({ ...valido, actual: '   ' })
        ).toThrow('Debes escribir tu contraseña actual.');
    });

    it(`Menos de ${MIN_PASSWORD_LENGTH} caracteres -> rechazo`, () => {
        const corta = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
        expect(() =>
            validators.validateCambioPassword({ ...valido, nueva: corta, confirmacion: corta })
        ).toThrow(`La contraseña nueva debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    });

    it('Nueva igual a la actual -> rechazo', () => {
        expect(() =>
            validators.validateCambioPassword({
                actual: 'CosturaSegura2026',
                nueva: 'CosturaSegura2026',
                confirmacion: 'CosturaSegura2026'
            })
        ).toThrow('La contraseña nueva debe ser distinta de la actual.');
    });

    it('Nueva igual a la de fábrica -> rechazo', () => {
        expect(() =>
            validators.validateCambioPassword(
                { actual: 'otraClaveLarga', nueva: PASSWORD_FABRICA, confirmacion: PASSWORD_FABRICA },
                { passwordPorDefecto: PASSWORD_FABRICA }
            )
        ).toThrow('No puedes usar la contraseña que trae la aplicación de fábrica.');
    });

    it('Confirmación distinta -> rechazo', () => {
        expect(() =>
            validators.validateCambioPassword({ ...valido, confirmacion: 'OtraCosaDistinta' })
        ).toThrow('La confirmación no coincide con la contraseña nueva.');
    });
});
