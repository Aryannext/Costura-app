// Aviso de privacidad para las clientas (Ley 1581 de 2012 y Decreto 1377 de 2013,
// compilado en el Decreto 1074 de 2015). La responsable de los datos es la dueña
// del taller; la app solo le ayuda a informar, pedir la autorización y guardar
// la prueba (fecha) de que la clienta la dio. Ver docs/05-gestion/DECISIONES.md, D-08.

export function textoAvisoPrivacidad(taller) {
    const nombre = (taller || '').trim() || 'el taller';
    return [
        `Aviso de privacidad – ${nombre}`,
        '',
        `${nombre} guarda tu nombre, tu número de celular y, si nos la das, tu dirección.`,
        'Los usamos solo para:',
        '• registrar tus prendas y los arreglos que pediste,',
        '• avisarte por WhatsApp cuando tu ropa esté lista,',
        '• llevar las cuentas de tus abonos y saldos.',
        '',
        'No vendemos ni compartimos tus datos con nadie. Se guardan en el celular del taller.',
        '',
        'Tienes derecho a conocer, actualizar y corregir tus datos, y a pedir que los borremos ' +
        'cuando no tengas trabajos ni saldos pendientes. Para eso escríbenos a este mismo número.',
        '',
        'Ley 1581 de 2012 de protección de datos personales.'
    ].join('\n');
}

export const MENSAJE_FALTA_AUTORIZACION =
    'Para registrar a la clienta necesitas su autorización para guardar sus datos ' +
    '(Ley 1581 de 2012). Léele o envíale el aviso de privacidad y marca la casilla.';
