<template>
  <nav class="app-nav">
    <router-link to="/" class="nav-item" active-class="active" @click="onNavClick" aria-label="Inicio">
      <Icon name="home" className="nav-icon" />
      <span aria-hidden="true">Inicio</span>
    </router-link>
    <router-link to="/ordenes" class="nav-item" active-class="active" @click="onNavClick" aria-label="Órdenes">
      <Icon name="clipboard" className="nav-icon" />
      <span aria-hidden="true">Órdenes</span>
    </router-link>
    <router-link to="/clientes" class="nav-item" active-class="active" @click="onNavClick" aria-label="Clientes">
      <Icon name="users" className="nav-icon" />
      <span aria-hidden="true">Clientes</span>
    </router-link>
    <router-link to="/reportes" class="nav-item" active-class="active" @click="onNavClick" aria-label="Reportes">
      <Icon name="chart" className="nav-icon" />
      <span aria-hidden="true">Reportes</span>
    </router-link>
    <router-link to="/ajustes" class="nav-item" active-class="active" @click="onNavClick" aria-label="Ajustes">
      <Icon name="cog" className="nav-icon" />
      <span aria-hidden="true">Ajustes</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useHaptics } from '../../composables/useHaptics.js';
import Icon from '../common/Icon.vue';

const { hapticSelection } = useHaptics();

function onNavClick() {
  hapticSelection();
}
</script>

<style scoped>
.app-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  justify-content: space-around;
  padding: 8px 16px 16px 16px;
  border-top: 1px solid var(--surface-container-high);
  z-index: 1000;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--outline);
  text-decoration: none;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 64px;
}

.nav-item.active {
  color: var(--primary);
  font-weight: 600;
}

.nav-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}
</style>
