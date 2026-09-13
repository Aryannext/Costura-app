import { ref } from 'vue';

export function useOrdenModals() {
  // Confirm Modal
  const showConfirmModal = ref(false);
  const confirmMessage = ref('');
  // El botón decía "Sí, Notificar" para cualquier confirmación, incluida la de
  // entregar con saldo. Cada llamada indica ahora qué está confirmando.
  const confirmText = ref('Confirmar');
  let onConfirmAction = null;

  function requestConfirm(message, action, { textoConfirmar = 'Confirmar' } = {}) {
    confirmMessage.value = message;
    confirmText.value = textoConfirmar;
    onConfirmAction = action;
    showConfirmModal.value = true;
  }

  function executeConfirm() {
    if (onConfirmAction) onConfirmAction();
    showConfirmModal.value = false;
  }

  function cancelConfirm() {
    onConfirmAction = null;
    showConfirmModal.value = false;
  }

  // Prompt Modal
  const showPromptModal = ref(false);
  const promptMessage = ref('');
  const promptTitle = ref('');
  let onPromptAction = null;

  function requestPrompt(message, action, { titulo = 'Añadir Observación' } = {}) {
    promptMessage.value = message;
    promptTitle.value = titulo;
    onPromptAction = action;
    showPromptModal.value = true;
  }

  function executePrompt(input) {
    if (onPromptAction) onPromptAction(input);
    showPromptModal.value = false;
  }

  function cancelPrompt() {
    onPromptAction = null;
    showPromptModal.value = false;
  }

  // Action Sheet (deslizar para eliminar o anular)
  // Antes esta hoja sólo mostraba "Pago eliminado y saldo recalculado" sin tocar
  // la base de datos (P1-9). Ahora ejecuta la acción que le pasa la vista.
  const showActionSheet = ref(false);
  const actionSheetTitle = ref('');
  const actionSheetMessage = ref('');
  const actionSheetActions = ref([]);
  let onSheetAction = null;

  function openDeleteSheet(type, id, onConfirm) {
    onSheetAction = onConfirm;

    if (type === 'prenda') {
      actionSheetTitle.value = 'Eliminar Prenda';
      actionSheetMessage.value = 'Se borrarán también sus fotos y observaciones. Quedará registrado en el historial de la orden.';
      actionSheetActions.value = [{ text: 'Eliminar', role: 'destructive', id: 'delete' }];
    } else {
      actionSheetTitle.value = 'Anular Pago';
      actionSheetMessage.value = 'El pago no se borra: queda tachado, con el motivo, y deja de contar en el saldo.';
      actionSheetActions.value = [{ text: 'Anular', role: 'destructive', id: 'delete' }];
    }

    showActionSheet.value = true;
  }

  function handleSheetAction(action) {
    const accion = onSheetAction;
    onSheetAction = null;
    if (action.id === 'delete' && accion) accion();
  }

  return {
    // Confirm
    showConfirmModal,
    confirmMessage,
    confirmText,
    requestConfirm,
    executeConfirm,
    cancelConfirm,

    // Prompt
    showPromptModal,
    promptMessage,
    promptTitle,
    requestPrompt,
    executePrompt,
    cancelPrompt,

    // Action Sheet
    showActionSheet,
    actionSheetTitle,
    actionSheetMessage,
    actionSheetActions,
    openDeleteSheet,
    handleSheetAction
  };
}
