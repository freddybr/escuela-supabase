<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showModal = ref(false);
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMsg = ref('');
const isLoading = ref(false);

onMounted(async () => {
  // Verificar si ya hay una sesión activa, si es así, redirigir a dashboard
  const user = await authStore.checkSession();
  if (user) {
    router.push('/dashboard');
  }

  // Capturar redirección por inactividad
  if (route.query.reason === 'inactivity') {
    showModal.value = true;
    errorMsg.value = '⚠️ Su sesión ha expirado por inactividad. Inicie sesión nuevamente.';
  }
});

const handleLogin = async () => {
  errorMsg.value = '';
  isLoading.value = true;

  const { error } = await authStore.login(email.value, password.value);

  isLoading.value = false;
  if (error) {
    errorMsg.value = error.message;
  } else {
    router.push('/dashboard');
  }
};

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="landing-page-wrapper">
    <header class="navbar">
      <div class="logo">
        <svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10l9-6 9 6v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z"/>
          <path d="M9 21V12h6v9"/>
          <path d="M9 7h6"/>
        </svg>
        <span>Escuela Digital</span>
      </div>
    </header>

    <main class="hero">
      <div class="hero-container">
        <h1>Bienvenido al Sistema de Gestión Escolar</h1>
        <p>Accede al control de materias, grados y planificación académica en un solo lugar de manera rápida, limpia y profesional.</p>
        <button @click="showModal = true" class="btn-hero-cta">Ingresar al Portal</button>
      </div>
    </main>

    <!-- MODAL DE INICIO DE SESIÓN -->
    <div v-if="showModal" class="modal">
      <div class="modal-overlay" @click="showModal = false"></div>
      <div class="modal-content">
        <button @click="showModal = false" class="close" aria-label="Cerrar modal">&times;</button>
        <div class="login-card-header">
          <div class="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 10l9-6 9 6v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z"/>
              <path d="M9 21V12h6v9"/>
              <path d="M9 7h6"/>
            </svg>
          </div>
          <h2>Escuela Digital</h2>
          <p>Ingresa tus credenciales para acceder al sistema</p>
        </div>
        
        <form @submit.prevent="handleLogin" id="login-form">
          <div class="input-group">
            <input 
              type="email" 
              v-model="email" 
              placeholder="Correo electrónico" 
              required 
              autocomplete="email"
            >
          </div>
          <div class="input-group">
            <input 
              id="login-password"
              :type="showPassword ? 'text' : 'password'" 
              v-model="password" 
              placeholder="Contraseña" 
              required 
              autocomplete="current-password"
            >
            <button type="button" @click="togglePassword" class="toggle-password-btn" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <button type="submit" class="btn-submit" :disabled="isLoading">
            {{ isLoading ? 'Cargando...' : 'Iniciar Sesión' }}
          </button>
        </form>
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<style>
/* Los estilos específicos de landing se cargan mediante landing.css globalmente */
</style>
