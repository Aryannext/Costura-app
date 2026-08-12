<template>
  <div class="ayuda-view">
    <div class="header-actions">
      <button class="btn-ghost back-btn" @click="$router.back()" style="margin-bottom: 12px;">
        ← Volver
      </button>
      <h2>Centro de Ayuda</h2>
      <p class="subtitle">Guía rápida para sacarle el máximo provecho a Atelier Manager.</p>
    </div>

    <div class="ayuda-content">
      <!-- 1. Dashboard -->
      <div class="card ayuda-section">
        <h3>1. El Panel de Inicio (Dashboard)</h3>
        <p>Al entrar a la aplicación, verás un resumen completo de cómo está tu taller hoy:</p>
        <ul>
          <li><strong>Tarjetas Superiores:</strong> Muestran los números grandes: cuántas órdenes tienes activas, atrasadas y pagos pendientes.</li>
          <li><strong>Próximas Entregas:</strong> Lista rápida con los pedidos más urgentes para priorizar tu trabajo del día.</li>
        </ul>
      </div>

      <!-- 2. Clientes -->
      <div class="card ayuda-section">
        <h3>2. Módulo de Clientes (La Agenda)</h3>
        <p>Antes de crear una orden, registra al cliente.</p>
        <ol>
          <li>Ve al menú inferior y toca <strong>"Clientes"</strong>.</li>
          <li>Para añadir alguien nuevo, presiona <strong>"+ Nuevo Cliente"</strong>.</li>
          <li>Ingresa su Nombre, Teléfono (muy importante para WhatsApp) y una pequeña nota de sus medidas o gustos.</li>
          <li>Si tocas el nombre de un cliente, verás todo su <strong>Historial</strong> de trabajos y pagos.</li>
        </ol>
      </div>

      <!-- 3. Órdenes -->
      <div class="card ayuda-section">
        <h3>3. Módulo de Órdenes (El Corazón del Taller)</h3>
        <p>Aquí creas el "ticket" cuando el cliente trae ropa.</p>
        <p><strong>¿Cómo crear una orden?</strong></p>
        <ol>
          <li>Ve a <strong>"Órdenes"</strong> y presiona <strong>"+ Nueva Orden"</strong>.</li>
          <li>Selecciona al Cliente y el Precio Total. Anota si dejó Abono.</li>
          <li>Selecciona la Fecha de Recepción y Entrega, luego Guardar.</li>
        </ol>
        <p><strong>Dentro de una orden encontrarás:</strong></p>
        <ul>
          <li><strong>A. Detalle:</strong> Cambia el estado de la orden y genera recibos.</li>
          <li><strong>B. Prendas:</strong> Agrega cada ropa, ponle un precio y toma fotos al daño. Puedes añadir notas como "Cortar 2 dedos".</li>
          <li><strong>C. Pagos:</strong> Si el cliente viene después a abonar, regístralo aquí.</li>
        </ul>
      </div>

      <!-- 4. Estados -->
      <div class="card ayuda-section">
        <h3>4. Los Estados de una Orden (El Semáforo)</h3>
        <ul>
          <li>🔵 <strong>Recibida:</strong> La ropa está en el mostrador.</li>
          <li>🟡 <strong>En Proceso:</strong> Estás trabajando en ella.</li>
          <li>🟢 <strong>Lista:</strong> Terminaste (La app te sugerirá avisarle por WhatsApp).</li>
          <li>⚫ <strong>Entregada:</strong> El cliente pagó y se la llevó. (La app no dejará entregarla si aún debe dinero).</li>
        </ul>
      </div>

      <!-- 5. Telegram -->
      <div class="card ayuda-section">
        <h3>5. Asistente de Telegram</h3>
        <p>En Ajustes > Telegram, puedes conectar un asistente robótico para:</p>
        <ul>
          <li><strong>Respaldar / Restaurar BD:</strong> Guarda una copia de seguridad en el chat por si cambias de celular.</li>
          <li><strong>Generar Recibos:</strong> Te manda recibos digitales para reenviar al cliente.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ayuda-view {
  padding: 16px;
  padding-bottom: 80px;
}
.header-actions {
  margin-bottom: 20px;
}
.header-actions h2 {
  margin: 0;
  color: var(--primary);
}
.subtitle {
  color: var(--on-surface-variant);
  margin-top: 4px;
  font-size: 0.95rem;
}
.ayuda-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ayuda-section {
  padding: 20px;
  border-left: 4px solid var(--primary);
}
.ayuda-section h3 {
  margin-top: 0;
  color: var(--on-surface);
  margin-bottom: 12px;
}
.ayuda-section p, .ayuda-section li {
  color: var(--on-surface-variant);
  line-height: 1.5;
  font-size: 0.95rem;
  margin-bottom: 8px;
}
.ayuda-section strong {
  color: var(--on-surface);
}
.ayuda-section ul, .ayuda-section ol {
  padding-left: 20px;
  margin-top: 8px;
  margin-bottom: 0;
}
</style>
