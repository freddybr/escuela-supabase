// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import LoginView from '@/views/LoginView.vue';

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView,
    meta: { layout: 'auth' }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/materias',
    name: 'materias',
    component: () => import('@/views/MateriasView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/programas',
    name: 'programas',
    component: () => import('@/views/ProgramasView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/clases',
    name: 'clases',
    component: () => import('@/views/ClasesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/periodos',
    name: 'periodos',
    component: () => import('@/views/PeriodosView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/asignaciones',
    name: 'asignaciones',
    component: () => import('@/views/AsignacionesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/control',
    name: 'control',
    component: () => import('@/views/ControlView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/asistencias',
    name: 'asistencias',
    component: () => import('@/views/AsistenciasView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reportes',
    name: 'reportes',
    component: () => import('@/views/ReportesView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/grados',
    name: 'grados',
    component: () => import('@/views/GradosView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/alumnos',
    name: 'alumnos',
    component: () => import('@/views/AlumnosView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profesores',
    name: 'profesores',
    component: () => import('@/views/ProfesoresView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracion',
    name: 'configuracion',
    component: () => import('@/views/ConfiguracionView.vue'),
    meta: { requiresAuth: true }
  },
  // Redireccionar rutas no válidas al login o al dashboard
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Guardias de Navegación
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Esperar a que se verifique la sesión si aún no se ha hecho
  if (authStore.user === null) {
    await authStore.checkSession();
  }

  const isAuthenticated = !!authStore.user;

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Si requiere auth y no está autenticado, al login
    next({ name: 'login' });
  } else if (to.name === 'login' && isAuthenticated) {
    // Si está autenticado y va al login, al dashboard
    next({ name: 'dashboard' });
  } else if (to.meta.requiresAdmin && !authStore.isAdminOrSuper) {
    // Si requiere rol admin y no lo tiene, al dashboard
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
