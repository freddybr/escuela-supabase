<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import Notification from '@/components/Notification.vue';

const route = useRoute();

// Elegir el layout en base a la metadata de la ruta activa
const layout = computed(() => {
  return route.meta.layout === 'auth' ? AuthLayout : AppLayout;
});
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
  
  <!-- Contenedor global de notificaciones toast -->
  <Notification />
</template>

<style>
/* El body hereda la clase de tema cargada dinámicamente desde el layout */
</style>
