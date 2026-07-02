import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '../services/auth.js';

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
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to, from, next) => {
    const isAuth = await isAuthenticated();
    
    if (to.meta.requiresAuth && !isAuth) {
        next('/login');
    } else if (to.path === '/login' && isAuth) {
        next('/');
    } else {
        next();
    }
});

export default router;
