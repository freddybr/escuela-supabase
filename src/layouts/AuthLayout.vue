<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // Configurar el tema predeterminado para el login/landing
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.className = `theme-${savedTheme}`;
});
</script>

<template>
  <div class="auth-layout-container">
    <slot />
  </div>
</template>

<style>
@import "@/assets/css/landing.css";
</style>
