import { ref, inject } from 'vue';

export function useAsyncAction() {
    const loading = ref(false);
    const error = ref(null);
    let toast = null;

    // Inject can only be used inside setup(), so we try to get it.
    // If we're outside setup or it doesn't exist, it will be null.
    try {
        toast = inject('toast', null);
    } catch(e) {
        toast = null;
    }

    /**
     * Executes an asynchronous action with standardized loading and error handling.
     * @param {Function} actionFn - The async function to execute.
     * @param {Object} options - Configuration options.
     * @param {string|null} [options.successMessage] - Optional message to show in toast on success.
     * @param {string|boolean} [options.toastError=false] - If true, toasts the original error message. If string, toasts the custom string.
     * @param {boolean} [options.throwError=true] - If true, propagates the error upwards.
     */
    const execute = async (actionFn, options = {}) => {
        const {
            successMessage = null,
            toastError = false,
            throwError = true
        } = options;

        loading.value = true;
        error.value = null;

        try {
            const result = await actionFn();
            if (successMessage && toast) {
                toast(successMessage, 'success');
            }
            return result;
        } catch (err) {
            error.value = err;
            if (toastError && toast) {
                const userMsg = typeof toastError === 'string' ? toastError : err.message;
                toast(userMsg, 'error');
            }
            // Logging the technical error separately
            console.error('[useAsyncAction Error]:', err);

            if (throwError) {
                throw err;
            }
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        error,
        execute
    };
}
