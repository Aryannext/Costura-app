import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated, requiresPasswordChange } from '../services/auth.js';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
        meta: { requiresAuth: false, index: 0 }
    },
    {
        path: '/',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { requiresAuth: true, index: 1 }
    },
    {
        path: '/clientes',
        name: 'Clientes',
        component: () => import('../views/ClientesView.vue'),
        meta: { requiresAuth: true, index: 1 }
    },
    {
        path: '/ordenes',
        name: 'Ordenes',
        component: () => import('../views/OrdenesView.vue'),
        meta: { requiresAuth: true, index: 1 }
    },
    {
        path: '/ordenes/:id',
        name: 'OrdenDetail',
        component: () => import('../views/OrdenDetailView.vue'),
        meta: { requiresAuth: true, index: 2 }
    },
    {
        path: '/clientes/:id',
        name: 'ClienteDetail',
        component: () => import('../views/ClienteDetailView.vue'),
        meta: { requiresAuth: true, index: 2 }
    },
    {
        path: '/reportes',
        name: 'Reportes',
        component: () => import('../views/ReportesView.vue'),
        meta: { requiresAuth: true, index: 1 }
    },
    {
        path: '/ajustes',
        name: 'Ajustes',
        component: () => import('../views/AjustesView.vue'),
        meta: { requiresAuth: true, index: 1 }
    },
    {
        path: '/telegram',
        name: 'Telegram',
        component: () => import('../views/TelegramView.vue'),
        meta: { requiresAuth: true, index: 2 }
    },
    {
        path: '/ayuda',
        name: 'Ayuda',
        component: () => import('../views/AyudaView.vue'),
        meta: { requiresAuth: true, index: 1 }
    },
    {
        path: '/cambiar-clave',
        name: 'CambiarPassword',
        component: () => import('../views/CambiarPasswordView.vue'),
        meta: { requiresAuth: true, index: 2 }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach(async (to, from, next) => {
    const isAuth = await isAuthenticated();

    if (to.meta.requiresAuth && !isAuth) {
        next({ path: '/login', query: { redirect: to.fullPath } });
        return;
    }

    if (to.path === '/login' && isAuth) {
        next('/');
        return;
    }

    // Mientras la contraseña siga siendo la de fábrica no se puede usar el resto
    // de la aplicación: cualquier ruta autenticada desvía al cambio obligatorio.
    if (isAuth && requiresPasswordChange() && to.path !== '/cambiar-clave') {
        next('/cambiar-clave');
        return;
    }

    next();
});

export default router;
