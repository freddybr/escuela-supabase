// src/stores/notifications.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([]);

  const addNotification = (texto, tipo = 'success', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    notifications.value.push({ id, texto, tipo, visible: false });
    
    // Iniciar transición a visible
    setTimeout(() => {
      const index = notifications.value.findIndex(n => n.id === id);
      if (index !== -1) notifications.value[index].visible = true;
    }, 20);

    // Ocultar y remover después del tiempo transcurrido
    setTimeout(() => {
      const index = notifications.value.findIndex(n => n.id === id);
      if (index !== -1) {
        notifications.value[index].visible = false;
        setTimeout(() => {
          notifications.value = notifications.value.filter(n => n.id !== id);
        }, 300); // Duración de la transición
      }
    }, duration);
  };

  return {
    notifications,
    addNotification
  };
});
export function mostrarMensajeGlobal(tipo, texto) {
  // Función helper por si queremos importar fuera de componentes
  const store = useNotificationStore();
  store.addNotification(texto, tipo);
}
