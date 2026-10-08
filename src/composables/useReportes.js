import { ref } from 'vue';
import { getDashboardData } from '../database/queries/reportes.js';
import { useAsyncAction } from './useAsyncAction.js';

export function useReportes() {
    const kpis = ref({
        ordenesActivas: 0,
        ordenesEnProceso: 0,
        ordenesListas: 0,
        ordenesAtrasadas: 0,
        ordenesSinReclamar: 0,
        diasSinReclamar: 0,
        saldosPendientes: 0,
        ordenesPorCobrar: 0
    });
    const atrasadas = ref([]);
    const ordenesRecientes = ref([]);
    const proximasEntregas = ref([]);

    // Initialize loading to true so that it acts like the original
    const { loading, error, execute } = useAsyncAction();
    loading.value = true;

    const fetchDashboardData = async () => {
        return execute(async () => {
            const data = await getDashboardData();
            kpis.value = data.kpis;
            atrasadas.value = data.atrasadas;
            ordenesRecientes.value = data.ordenesRecientes;
            proximasEntregas.value = data.proximasEntregas;
        });
    };

    return {
        kpis,
        atrasadas,
        ordenesRecientes,
        proximasEntregas,
        loading,
        error,
        fetchDashboardData
    };
}
