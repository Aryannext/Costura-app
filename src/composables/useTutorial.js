import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useRouter } from 'vue-router';

export function useTutorial() {
    const router = useRouter();

    const getSvg = (name) => {
        const base = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 20px; height: 20px; margin-right: 8px; vertical-align: text-bottom; color: var(--primary);">`;
        
        if (name === 'user') return base + `<path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle stroke-width="2" stroke-linecap="round" stroke-linejoin="round" cx="12" cy="7" r="4"></circle></svg>`;
        
        if (name === 'chart') return base + `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`;
        
        if (name === 'search') return base + `<circle cx="11" cy="11" r="8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line></svg>`;

        if (name === 'home') return base + `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>`;
        
        return '';
    };

    const startDashboardTour = () => {
        const driverObj = driver({
            showProgress: true,
            doneBtnText: '¡Entendido!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Atrás',
            popoverClass: 'app-tutorial-popover',
            steps: [
                {
                    popover: { 
                        title: `${getSvg('user')} ¡Hola! Soy tu asistente`, 
                        description: 'Te doy la bienvenida a Atelier Manager. Vamos a dar un rápido recorrido para que aprendas a moverte por la app.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '.kpi-grid',
                    popover: {
                        title: `${getSvg('chart')} Tu resumen del día`,
                        description: 'Aquí verás un escáner rápido de tu negocio: cuántas prendas hay en proceso, si tienes órdenes atrasadas y el dinero pendiente.',
                        side: 'bottom'
                    }
                },
                {
                    element: '.global-search-container',
                    popover: {
                        title: `${getSvg('search')} Buscador Mágico`,
                        description: 'No pierdas tiempo. Escribe el nombre de un cliente, su teléfono o el # de orden y aparecerá al instante.',
                        side: 'bottom'
                    }
                },
                {
                    element: '.app-nav',
                    popover: {
                        title: `${getSvg('home')} Navegación`,
                        description: 'Usa esta barra para cambiar entre Inicio, Clientes, Órdenes y Ajustes. ¡Ya estás listo para empezar a trabajar!',
                        side: 'top',
                        align: 'center'
                    }
                }
            ]
        });
        
        // Si no estamos en el dashboard, vamos para allá primero
        if (router.currentRoute.value.path !== '/') {
            router.push('/').then(() => {
                // Pequeño timeout para dejar que la vista cargue
                setTimeout(() => driverObj.drive(), 400);
            });
        } else {
            driverObj.drive();
        }
    };

    const startClienteTour = () => {
        const driverObj = driver({
            showProgress: true,
            doneBtnText: '¡Entendido!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Atrás',
            popoverClass: 'app-tutorial-popover',
            steps: [
                {
                    popover: { 
                        title: `${getSvg('user')} La Agenda`, 
                        description: 'Antes de tomar una orden, siempre debes registrar a la persona. Veamos cómo hacerlo.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '.clientes-view .header-actions button',
                    popover: {
                        title: 'Añadir Nuevo',
                        description: 'Toca aquí para abrir el formulario. Solo necesitas su nombre y teléfono (vital para enviarle recibos por WhatsApp).',
                        side: 'bottom'
                    }
                },
                {
                    element: '.clientes-view .search-bar input',
                    popover: {
                        title: 'Búsqueda Rápida',
                        description: 'Si el cliente ya vino antes, búscalo por nombre o teléfono aquí. ¡No lo registres dos veces!',
                        side: 'bottom'
                    }
                }
            ]
        });
        
        if (router.currentRoute.value.path !== '/clientes') {
            router.push('/clientes').then(() => setTimeout(() => driverObj.drive(), 400));
        } else {
            driverObj.drive();
        }
    };

    const startOrdenTour = () => {
        const driverObj = driver({
            showProgress: true,
            doneBtnText: '¡Entendido!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Atrás',
            popoverClass: 'app-tutorial-popover',
            steps: [
                {
                    popover: { 
                        title: `${getSvg('chart')} Tu Primera Orden`, 
                        description: 'La Orden es el corazón del taller. Funciona como el "ticket" o recibo donde metes todas las prendas.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '.ordenes-view .header-actions button',
                    popover: {
                        title: 'Nueva Orden',
                        description: 'Al tocar aquí creas un ticket en blanco. Después podrás ir metiéndole ropa, tomando fotos de los daños y registrando los pagos.',
                        side: 'bottom'
                    }
                },
                {
                    element: '.ordenes-view .tabs',
                    popover: {
                        title: 'Organización',
                        description: 'Tus órdenes se organizan en "Activas" (lo que estás cosiendo ahora) y "Historial" (lo ya entregado).',
                        side: 'bottom'
                    }
                }
            ]
        });
        
        if (router.currentRoute.value.path !== '/ordenes') {
            router.push('/ordenes').then(() => setTimeout(() => driverObj.drive(), 400));
        } else {
            driverObj.drive();
        }
    };

    return {
        startDashboardTour,
        startClienteTour,
        startOrdenTour
    };
}
