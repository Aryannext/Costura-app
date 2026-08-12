import { ref, inject } from 'vue';

export function useOrdenModals() {
  const toast = inject('toast');

  // Confirm Modal
  const showConfirmModal = ref(false);
  const confirmMessage = ref('');
  let onConfirmAction = null;

  function requestConfirm(message, action) {
    confirmMessage.value = message;
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
  let onPromptAction = null;

  function requestPrompt(message, action) {
    promptMessage.value = message;
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

  // Action Sheet (Swipe to Delete)
  const showActionSheet = ref(false);
  const actionSheetTitle = ref('');
  const actionSheetMessage = ref('');
  const actionSheetActions = ref([]);
  let currentDeletePayload = null;

  function openDeleteSheet(type, id) {
    currentDeletePayload = { type, id };
    
    if (type === 'prenda') {
      actionSheetTitle.value = 'Eliminar Prenda';
      actionSheetMessage.value = '¿Estás seguro de que deseas eliminar esta prenda? Esta acción no se puede deshacer.';
    } else {
      actionSheetTitle.value = 'Eliminar Pago';
      actionSheetMessage.value = '¿Deseas eliminar este pago? El saldo se recalculará automáticamente.';
    }

    actionSheetActions.value = [
      { text: 'Eliminar', role: 'destructive', id: 'delete' }
    ];
    
    showActionSheet.value = true;
  }

  function handleSheetAction(action) {
    if (action.id === 'delete') {
      if (currentDeletePayload?.type === 'prenda') {
        if (toast) toast('Prenda eliminada', 'success');
      } else if (currentDeletePayload?.type === 'pago') {
        if (toast) toast('Pago eliminado y saldo recalculado', 'success');
      }
    }
    currentDeletePayload = null;
  }

  return {
    // Confirm
    showConfirmModal,
    confirmMessage,
    requestConfirm,
    executeConfirm,
    cancelConfirm,
    
    // Prompt
    showPromptModal,
    promptMessage,
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
