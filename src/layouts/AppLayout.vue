<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isMobileMenuOpen = ref(false);

onMounted(() => {
  // Aplicar tema persistido
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.className = `theme-${savedTheme}`;

  // Iniciar monitoreo de inactividad
  authStore.setupInactivityMonitoring();
});

onUnmounted(() => {
  // Limpiar monitoreo de inactividad
  authStore.removeInactivityMonitoring();
});

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/');
};
</script>

<template>
  <!-- Header de la Aplicación -->
    <header class="app-header">
      <button 
        @click="toggleMobileMenu" 
        :class="['menu-toggle-btn', { open: isMobileMenuOpen }]" 
        aria-label="Abrir menú"
      >
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <div class="app-logo">
        <span class="app-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10l9-6 9 6v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z"/>
            <path d="M9 21V12h6v9"/>
            <path d="M9 7h6"/>
          </svg>
        </span>
        Escuela Digital
      </div>
      
      <div class="user-control">
        <div class="user-avatar-container">
          <img 
            :src="authStore.userAvatarUrl" 
            alt="Avatar" 
            class="user-avatar"
          >
        </div>
        <button @click="handleLogout" class="btn-logout" title="Cerrar Sesión">Salir</button>
      </div>
    </header>

    <div class="app-body">
      <!-- Menú Lateral (Sidebar) -->
      <aside :class="['app-aside', { open: isMobileMenuOpen }]">
        <div class="aside-header">
          <h3>Menú Académico</h3>
        </div>
        <nav class="menu-nav">
          <h4 class="menu-group-title">Contenido</h4>
          
          <!-- Dashboard -->
          <RouterLink to="/dashboard" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
            <span>Dashboard</span>
          </RouterLink>

          <!-- Materias -->
          <RouterLink to="/materias" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span>Materias</span>
          </RouterLink>

          <!-- Programas -->
          <RouterLink to="/programas" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>Programas</span>
          </RouterLink>

          <!-- Clases -->
          <RouterLink to="/clases" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span>Clases</span>
          </RouterLink>

          <h4 class="menu-group-title">Seguimiento</h4>

          <!-- Períodos -->
          <RouterLink to="/periodos" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Períodos</span>
          </RouterLink>

          <!-- Asignaciones -->
          <RouterLink to="/asignaciones" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            <span>Asignaciones</span>
          </RouterLink>

          <!-- Ejecución -->
          <RouterLink to="/control" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>Ejecución</span>
          </RouterLink>

          <!-- Asistencias -->
          <RouterLink to="/asistencias" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Asistencias</span>
          </RouterLink>

          <!-- Reportes (solo Admin/Superadmin) -->
          <RouterLink 
            v-if="authStore.isAdminOrSuper" 
            to="/reportes" 
            @click="closeMobileMenu" 
            class="menu-btn" 
            active-class="active"
          >
            <svg class="menu-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Reportes</span>
          </RouterLink>

          <h4 class="menu-group-title">Comunidad</h4>

          <!-- Grados -->
          <RouterLink to="/grados" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            <span>Grados</span>
          </RouterLink>

          <!-- Alumnos -->
          <RouterLink to="/alumnos" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Alumnos</span>
          </RouterLink>

          <!-- Profesores -->
          <RouterLink to="/profesores" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Profesores</span>
          </RouterLink>

          <h4 class="menu-group-title">Ajustes</h4>

          <!-- Configuración -->
          <RouterLink to="/configuracion" @click="closeMobileMenu" class="menu-btn" active-class="active">
            <svg class="menu-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>Configuración</span>
          </RouterLink>
        </nav>
      </aside>

      <!-- Overlay móvil -->
      <div 
        @click="closeMobileMenu" 
        :class="['aside-overlay', { open: isMobileMenuOpen }]"
      ></div>

      <!-- Área de Contenido Principal -->
      <main id="main-content" class="app-main">
        <slot />
      </main>
    </div>
</template>

<style>
/* Los estilos globales del layout y de la aplicación se importan en main.js */
</style>
