// src/stores/auth.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/services/supabase';
import { ProfesorService, AlumnoService } from '@/services/services';

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null);
  const user = ref(null);
  const userRole = ref(''); // 'docente', 'alumno', 'admin', 'superadmin', etc.
  const userEmail = ref('');
  const userAvatarUrl = ref('');
  const layoutReady = ref(false);
  const inactiveTimeoutMinutes = ref(30); // Default minutes

  const isDocente = computed(() => userRole.value === 'docente');
  const isAdminOrSuper = computed(() => {
    return userRole.value === 'admin' || 
           userRole.value === 'superadmin' || 
           userEmail.value.toLowerCase() === 'freddybr.igle@gmail.com';
  });

  const getFallbackAvatar = (seed = 'Usuario') => {
    const userSeed = encodeURIComponent(seed.substring(0, 2));
    return `https://api.dicebear.com/7.x/initials/svg?seed=${userSeed}&backgroundColor=4f46e5`;
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      session.value = data.session;
      user.value = data.user;
      await loadUserProfile(data.user);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    session.value = null;
    user.value = null;
    userRole.value = '';
    userEmail.value = '';
    userAvatarUrl.value = '';
    layoutReady.value = false;
  };

  const loadUserProfile = async (currentUser) => {
    if (!currentUser) return;
    userEmail.value = currentUser.email || '';
    let fotoUrl = null;

    try {
      // 1. Buscar si es profesor
      const { data: profe } = await ProfesorService.getProfesorByEmail(currentUser.email);
      if (profe) {
        if (profe.profe_imagen_url && profe.profe_imagen_url.trim() !== '') {
          fotoUrl = profe.profe_imagen_url;
        }
        userRole.value = (profe.profe_rol || '').trim().toLowerCase();
      } else {
        // 2. Buscar si es alumno
        const { data: alumno } = await AlumnoService.getAlumnoImagenByEmail(currentUser.email);
        if (alumno && alumno.alumno_imagen_url && alumno.alumno_imagen_url.trim() !== '') {
          fotoUrl = alumno.alumno_imagen_url;
        }
        userRole.value = 'alumno';
      }
      
      // Exponer en window para compatibilidad hacia atrás si es necesario
      window.usuarioEsDocente = userRole.value === 'docente';
      window.usuarioRol = userRole.value;
      window.usuarioEmail = userEmail.value;

      userAvatarUrl.value = fotoUrl || getFallbackAvatar(currentUser.email || 'Usuario');
      layoutReady.value = true;
    } catch (err) {
      console.error('Error al cargar perfil de usuario:', err);
      userAvatarUrl.value = getFallbackAvatar(currentUser.email || 'Usuario');
    }
  };

  const checkSession = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      session.value = currentSession;
      user.value = currentSession.user;
      await loadUserProfile(currentSession.user);
      return currentSession.user;
    }
    return null;
  };

  // Manejo de inactividad
  let inactivityTimer = null;

  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }

    const minutes = parseInt(localStorage.getItem('inactiveTimeout') || '0', 10);
    if (minutes <= 0) return;

    inactivityTimer = setTimeout(async () => {
      console.warn(`Sesión cerrada por inactividad de ${minutes} minutos.`);
      await logout();
      window.location.href = '/?reason=inactivity';
    }, minutes * 60 * 1000);
  };

  const setupInactivityMonitoring = () => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    window.addEventListener('inactiveTimeoutChanged', () => {
      resetInactivityTimer();
    });

    resetInactivityTimer();
  };

  const removeInactivityMonitoring = () => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.removeEventListener(event, resetInactivityTimer);
    });
  };

  return {
    session,
    user,
    userRole,
    userEmail,
    userAvatarUrl,
    layoutReady,
    isDocente,
    isAdminOrSuper,
    login,
    logout,
    checkSession,
    setupInactivityMonitoring,
    removeInactivityMonitoring,
    resetInactivityTimer
  };
});
