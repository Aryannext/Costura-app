<template>
  <div class="ayuda-view">
    <div class="header-actions">
      <button class="btn-ghost back-btn" @click="$router.back()" style="margin-bottom: 12px;">
        ← Volver
      </button>
      <h2 class="display-sm">Centro de Ayuda</h2>
      <p class="subtitle">Aprende a usar Atelier Manager de forma fácil e interactiva.</p>
    </div>

    <div class="misiones-list">
      <div class="card mission-card" @click="playDashboardTour">
        <div class="mission-icon"><Icon name="home" className="mission-svg" /></div>
        <div class="mission-info">
          <h3 class="headline-sm">Tour Rápido</h3>
          <p class="body-sm">Conoce el panel principal y la barra de navegación.</p>
        </div>
        <div class="mission-action">
          <button class="btn-primary btn-small">Jugar</button>
        </div>
      </div>
      
      <!-- Misión: Clientes -->
      <div class="card mission-card" @click="playClienteTour">
        <div class="mission-icon"><Icon name="users" className="mission-svg" /></div>
        <div class="mission-info">
          <h3 class="headline-sm">Crear un Cliente</h3>
          <p class="body-sm">Descubre cómo registrar a tus clientes en tu agenda.</p>
        </div>
        <div class="mission-action">
          <button class="btn-primary btn-small">Jugar</button>
        </div>
      </div>

      <!-- Misión: Órdenes -->
      <div class="card mission-card" @click="playOrdenTour">
        <div class="mission-icon"><Icon name="clipboard" className="mission-svg" /></div>
        <div class="mission-info">
          <h3 class="headline-sm">Tu Primera Orden</h3>
          <p class="body-sm">Aprende paso a paso cómo registrar un trabajo nuevo.</p>
        </div>
        <div class="mission-action">
          <button class="btn-primary btn-small">Jugar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTutorial } from '../composables/useTutorial.js';
import Icon from '../components/common/Icon.vue';

const { startDashboardTour, startClienteTour, startOrdenTour } = useTutorial();

function playDashboardTour() {
  startDashboardTour();
}

function playClienteTour() {
  startClienteTour();
}

function playOrdenTour() {
  startOrdenTour();
}
</script>

<style scoped>
.ayuda-view {
  padding: 24px 16px 80px 16px;
}
.header-actions {
  margin-bottom: 24px;
}
.header-actions h2 {
  color: var(--on-surface);
}
.subtitle {
  color: var(--on-surface-variant);
  margin-top: 4px;
}

.misiones-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mission-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: var(--surface-container-lowest);
}
.mission-card:active {
  transform: scale(0.98);
}
.mission-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(1);
}
.mission-card.disabled:active {
  transform: none;
}

.mission-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-container-high);
  border-radius: 50%;
}

.mission-svg {
  width: 24px;
  height: 24px;
  color: var(--primary);
}

.mission-info {
  flex: 1;
}
.mission-info h3 {
  margin: 0;
  color: var(--on-surface);
}
.mission-info p {
  margin: 4px 0 0 0;
  color: var(--on-surface-variant);
}

.badge-neutral {
  background: var(--surface-dim); 
  color: var(--on-surface-variant);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
</style>
