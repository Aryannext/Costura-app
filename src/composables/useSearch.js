import { ref } from 'vue';
import { globalSearch } from '../database/queries/search.js';

export function useSearch() {
  const globalQuery = ref('');
  const searchLoading = ref(false);
  const searchResults = ref({ clientes: [], ordenes: [] });
  let searchTimeout = null;

  function performSearch() {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (!globalQuery.value.trim()) {
      searchResults.value = { clientes: [], ordenes: [] };
      return;
    }

    searchLoading.value = true;
    searchTimeout = setTimeout(async () => {
      try {
        searchResults.value = await globalSearch(globalQuery.value);
      } catch (error) {
        console.error('Error en búsqueda global:', error);
      } finally {
        searchLoading.value = false;
      }
    }, 400); // Debounce de 400ms
  }

  return {
    globalQuery,
    searchLoading,
    searchResults,
    performSearch
  };
}
