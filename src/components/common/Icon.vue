<template>
  <svg 
    :class="className" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    aria-hidden="true"
  >
    <!-- Inicio (Dashboard/Grid) -->
    <path v-if="name === 'home'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    
    <!-- Órdenes (Clipboard) -->
    <path v-else-if="name === 'clipboard'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    
    <!-- Clientes (Users) -->
    <path v-else-if="name === 'users'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    
    <!-- Reportes (Chart Bar) -->
    <path v-else-if="name === 'chart'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    
    <!-- Ajustes (Cog) -->
    <template v-else-if="name === 'cog'">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </template>
    
    <!-- Notificaciones (Bell) -->
    <template v-else-if="name === 'bell'">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </template>
    
    <!-- Recordatorios (Bell Ringing) -->
    <path v-else-if="name === 'bell-ringing'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    
    <!-- Búsqueda (Search) -->
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line>
    </template>
    
    <!-- Usuario Simple (User) -->
    <template v-else-if="name === 'user'">
      <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle stroke-width="2" stroke-linecap="round" stroke-linejoin="round" cx="12" cy="7" r="4"></circle>
    </template>
    
    <!-- Monitor (Monitor) -->
    <template v-else-if="name === 'monitor'">
      <rect stroke-width="2" stroke-linecap="round" stroke-linejoin="round" x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line stroke-width="2" stroke-linecap="round" stroke-linejoin="round" x1="8" y1="21" x2="16" y2="21"></line>
      <line stroke-width="2" stroke-linecap="round" stroke-linejoin="round" x1="12" y1="17" x2="12" y2="21"></line>
    </template>
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true
  },
  className: {
    type: String,
    default: ''
  }
});
</script>
