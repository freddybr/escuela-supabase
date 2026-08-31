<script setup>
import { useNotificationStore } from '@/stores/notifications';

const notificationStore = useNotificationStore();
</script>

<template>
  <!-- Renderiza la lista de notificaciones flotantes -->
  <div class="notifications-list">
    <div
      v-for="n in notificationStore.notifications"
      :key="n.id"
      :class="['notification', n.tipo, { visible: n.visible }]"
    >
      <!-- Icono SVG según el tipo -->
      <span v-if="n.tipo === 'success'" class="notification-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
      <span v-else class="notification-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </span>
      <span>{{ n.texto }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Las notificaciones utilizan los estilos globales de app.css */
.notifications-list {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}
.notification {
  pointer-events: auto;
  margin-bottom: 24px;
}
</style>
