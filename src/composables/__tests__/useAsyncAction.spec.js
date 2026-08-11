import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAsyncAction } from '../useAsyncAction.js';
import { inject } from 'vue';

vi.mock('vue', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        inject: vi.fn()
    };
});

describe('useAsyncAction', () => {
    let mockToast;
    let consoleSpy;

    beforeEach(() => {
        mockToast = vi.fn();
        inject.mockImplementation((key) => {
            if (key === 'toast') return mockToast;
            return null;
        });
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });


    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should handle success flow (loading states and result)', async () => {
        const { loading, error, execute } = useAsyncAction();
        let loadingDuringOperation = false;

        const fakeOperation = async () => {
            loadingDuringOperation = loading.value;
            return 'success_result';
        };

        expect(loading.value).toBe(false);
        const result = await execute(fakeOperation);

        expect(loadingDuringOperation).toBe(true);
        expect(loading.value).toBe(false);
        expect(error.value).toBeNull();
        expect(result).toBe('success_result');
        expect(mockToast).not.toHaveBeenCalled(); // No toast by default
    });

    it('should show successMessage only when requested', async () => {
        const { execute } = useAsyncAction();
        await execute(async () => 'ok', { successMessage: 'Operation completed' });

        expect(mockToast).toHaveBeenCalledWith('Operation completed', 'success');
    });

    it('should handle error flow, keep error available, and propagate it by default', async () => {
        const { loading, error, execute } = useAsyncAction();
        const fakeError = new Error('Op failed');

        const fakeOperation = async () => {
            throw fakeError;
        };

        await expect(execute(fakeOperation)).rejects.toThrow('Op failed');

        expect(loading.value).toBe(false); // finally executed
        expect(error.value).toBe(fakeError); // error remains available
        expect(mockToast).not.toHaveBeenCalled(); // No error toast by default
        expect(consoleSpy).toHaveBeenCalledWith('[useAsyncAction Error]:', fakeError);
    });

    it('should show toast for error only when requested (toastError=true)', async () => {
        const { execute } = useAsyncAction();
        const fakeError = new Error('Technical issue');

        await expect(execute(async () => { throw fakeError; }, { toastError: true })).rejects.toThrow('Technical issue');

        expect(mockToast).toHaveBeenCalledWith('Technical issue', 'error');
    });

    it('should show custom toast for error if toastError is a string', async () => {
        const { execute } = useAsyncAction();
        const fakeError = new Error('Technical issue');

        await expect(execute(async () => { throw fakeError; }, { toastError: 'Friendly message' })).rejects.toThrow('Technical issue');

        expect(mockToast).toHaveBeenCalledWith('Friendly message', 'error');
    });

    it('should not propagate error if throwError is false', async () => {
        const { error, execute } = useAsyncAction();
        const fakeError = new Error('Silenced error');

        // It shouldn't throw an exception outwards
        const result = await execute(async () => { throw fakeError; }, { throwError: false });

        expect(result).toBeUndefined();
        expect(error.value).toBe(fakeError);
    });

    it('concurrent actions from separate composable instances should not share loading states', async () => {
        const action1 = useAsyncAction();
        const action2 = useAsyncAction();

        let resolve1;
        const promise1 = new Promise(r => resolve1 = r);

        const exec1 = action1.execute(() => promise1);

        expect(action1.loading.value).toBe(true);
        expect(action2.loading.value).toBe(false); // Independent

        resolve1();
        await exec1;

        expect(action1.loading.value).toBe(false);
    });
});
