/**
 * DEF-11: «¡Misión Completada!» solo cuando el recorrido llega al último paso.
 * driver.js llama a onDestroyed tanto al terminar como al cerrar a medias, con
 * el índice del paso donde estaba.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const estado = vi.hoisted(() => ({ configs: [], toast: vi.fn(), push: vi.fn() }));

vi.mock('driver.js', () => ({
    driver: (config) => {
        estado.configs.push(config);
        return { drive: vi.fn() };
    }
}));
vi.mock('driver.js/dist/driver.css', () => ({}));
vi.mock('vue-router', () => ({
    useRouter: () => ({ currentRoute: { value: { path: '/ayuda' } }, push: estado.push })
}));
vi.mock('vue', async (importOriginal) => ({
    ...(await importOriginal()),
    inject: (clave) => (clave === 'toast' ? estado.toast : null)
}));

import { useTutorial } from '../useTutorial.js';

// Cierra el recorrido como lo hace driver.js: onDestroyed(elemento, paso, { config, index })
function cerrarEn(config, index) {
    config.onDestroyed(undefined, config.steps[index], { config, index, state: {}, driver: {} });
}

const misionCompletada = () => estado.toast.mock.calls.filter(([texto]) => texto.startsWith('¡Misión Completada!'));

describe('useTutorial · Misión Completada solo al terminar (DEF-11)', () => {
    beforeEach(() => {
        estado.configs.length = 0;
        estado.toast.mockReset();
        estado.push.mockReset().mockResolvedValue();
    });

    for (const recorrido of ['startDashboardTour', 'startClienteTour', 'startOrdenTour']) {
        describe(recorrido, () => {
            it('cerrarlo a mitad no lo cuenta como completado, pero vuelve a Ayuda', () => {
                useTutorial()[recorrido]();
                const [config] = estado.configs;
                expect(config.steps.length).toBeGreaterThan(1);

                cerrarEn(config, 0);

                expect(misionCompletada()).toHaveLength(0);
                expect(estado.push).toHaveBeenLastCalledWith('/ayuda');
            });

            it('llegar al último paso y cerrarlo sí lo cuenta', () => {
                useTutorial()[recorrido]();
                const [config] = estado.configs;

                cerrarEn(config, config.steps.length - 1);

                expect(misionCompletada()).toHaveLength(1);
                expect(estado.push).toHaveBeenLastCalledWith('/ayuda');
            });
        });
    }
});
