import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ReportesView from '../ReportesView.vue';
import * as reportesDb from '../../database/queries/reportes.js';

// Mock chart.js to prevent canvas errors
vi.mock('chart.js', () => ({
    Chart: { register: vi.fn() },
    CategoryScale: {},
    LinearScale: {},
    PointElement: {},
    LineElement: {},
    ArcElement: {},
    Title: {},
    Tooltip: {},
    Legend: {}
}));
vi.mock('vue-chartjs', () => ({
    Line: { template: '<div>LineChart</div>' },
    Doughnut: { template: '<div>DoughnutChart</div>' }
}));

vi.mock('../../database/queries/reportes.js', () => ({
    getReporteFinanciero: vi.fn().mockResolvedValue({
        kpis: { ingresosTotales: 0, ordenesNuevas: 0, prendasProcesadas: 0, ticketPromedio: 0 },
        graficos: { ingresosPorDia: { labels: [] }, ordenesPorDia: { labels: [] }, estadoOrdenes: { labels: [] } }
    })
}));

describe('ReportesView.vue', () => {
    let mockToast;

    beforeEach(() => {
        vi.clearAllMocks();
        mockToast = vi.fn();
    });

    const createWrapper = () => {
        return mount(ReportesView, {
            global: {
                provide: {
                    toast: mockToast
                }
            }
        });
    };

    it('should show toast if dates are empty on submit', async () => {
        const wrapper = createWrapper();

        // Clear inputs
        wrapper.vm.fechaInicio = '';
        wrapper.vm.fechaFin = '';

        await wrapper.vm.generarReporte();

        expect(mockToast).toHaveBeenCalledWith('Por favor selecciona ambas fechas.', 'error');
        expect(reportesDb.getReporteFinanciero).toHaveBeenCalledTimes(1); // Once on mount
    });

    it('should show toast if start date is greater than end date', async () => {
        const wrapper = createWrapper();

        wrapper.vm.fechaInicio = '2023-12-31';
        wrapper.vm.fechaFin = '2023-12-01';

        await wrapper.vm.generarReporte();

        expect(mockToast).toHaveBeenCalledWith('La fecha de inicio no puede ser mayor que la fecha fin.', 'error');
        expect(reportesDb.getReporteFinanciero).toHaveBeenCalledTimes(1); // Once on mount
    });

    it('should show toast if generating report fails', async () => {
        reportesDb.getReporteFinanciero.mockRejectedValueOnce(new Error('DB Error'));
        const wrapper = createWrapper();

        wrapper.vm.fechaInicio = '2023-12-01';
        wrapper.vm.fechaFin = '2023-12-31';

        await wrapper.vm.generarReporte();
        // Wait for async
        await new Promise(process.nextTick);

        expect(mockToast).toHaveBeenCalledWith('Error al generar el reporte.', 'error');
    });

    it('should not contain any alert calls', () => {
        const spyAlert = vi.spyOn(window, 'alert');
        const wrapper = createWrapper();
        wrapper.vm.generarReporte();
        expect(spyAlert).not.toHaveBeenCalled();
    });
});
