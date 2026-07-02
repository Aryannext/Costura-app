import { ref } from 'vue';
import { getDashboardData, getReporteFinanciero } from '../database/queries/reportes.js';

export function useReportes() {
    const kpis = ref({
        ordenesActivas: 0,
        ordenesEnProceso: 0,
        ordenesListas: 0,
        ordenesAtrasadas: 0,
        ordenesSinReclamar: 0,
        saldosPendientes: 0
    });
    const ordenesRecientes = ref([]);
    const proximasEntregas = ref([]);
    const loading = ref(true);

    const fetchDashboardData = async () => {
        try {
            loading.value = true;
            const data = await getDashboardData();
            kpis.value = data.kpis;
            ordenesRecientes.value = data.ordenesRecientes;
            proximasEntregas.value = data.proximasEntregas;
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            loading.value = false;
        }
    };

    return {
        kpis,
        ordenesRecientes,
        proximasEntregas,
        loading,
        fetchDashboardData
    };
}
