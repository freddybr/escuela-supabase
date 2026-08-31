<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { ProfesorService, AlumnoService, AuthService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const activeTab = ref('perfil'); // 'perfil' | 'cuenta' | 'apariencia'
const isLoading = ref(true);

// Datos cargados en memoria
const profesores = ref([]);
const alumnos = ref([]);

// --- SECCIÓN PERFIL (ASOCIACIÓN FOTOS) ---
const perfilTipo = ref('profesor'); // 'profesor' | 'alumno'
const perfilIdRegistro = ref('');
const perfilFotoPreview = ref('');
const perfilFotoFile = ref(null);
const fileInput = ref(null);
const isUploading = ref(false);
const isNewPhotoSelected = ref(false);

const perfilRegistrosOptions = computed(() => {
  const list = perfilTipo.value === 'profesor' ? profesores.value : alumnos.value;
  return list.map(item => ({
    id: item.id,
    nombre: perfilTipo.value === 'profesor' ? item.profe_nombre : item.alumno_nombre,
    foto: perfilTipo.value === 'profesor' ? item.profe_imagen_url : item.alumno_imagen_url
  })).sort((a, b) => a.nombre.localeCompare(b.nombre));
});

const selectedRegistroData = computed(() => {
  if (!perfilIdRegistro.value) return null;
  return perfilRegistrosOptions.value.find(r => String(r.id) === String(perfilIdRegistro.value)) || null;
});

// Watch para actualizar el preview al cambiar tipo o registro
watch(perfilTipo, () => {
  perfilIdRegistro.value = '';
  perfilFotoPreview.value = '';
  perfilFotoFile.value = null;
  isNewPhotoSelected.value = false;
  if (fileInput.value) fileInput.value.value = '';
  
  if (perfilRegistrosOptions.value.length > 0) {
    perfilIdRegistro.value = perfilRegistrosOptions.value[0].id;
  }
});

watch(perfilIdRegistro, (newVal) => {
  if (isNewPhotoSelected.value) return; // No sobreescribir la vista previa si acaban de elegir un archivo
  if (!newVal) {
    perfilFotoPreview.value = '';
    return;
  }
  const reg = selectedRegistroData.value;
  if (reg && reg.foto && reg.foto.trim() !== '') {
    perfilFotoPreview.value = reg.foto;
  } else {
    const name = reg ? reg.nombre : 'Usuario';
    const seed = encodeURIComponent(name.substring(0, 2));
    perfilFotoPreview.value = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=4f46e5`;
  }
});

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    perfilFotoFile.value = file;
    isNewPhotoSelected.value = true;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      perfilFotoPreview.value = event.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const handleCancelPhoto = () => {
  perfilFotoFile.value = null;
  isNewPhotoSelected.value = false;
  if (fileInput.value) fileInput.value.value = '';
  
  // Forzar actualización del preview al valor original
  const reg = selectedRegistroData.value;
  if (reg && reg.foto && reg.foto.trim() !== '') {
    perfilFotoPreview.value = reg.foto;
  } else {
    const name = reg ? reg.nombre : 'Usuario';
    const seed = encodeURIComponent(name.substring(0, 2));
    perfilFotoPreview.value = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=4f46e5`;
  }
};

const handleUploadPhoto = async () => {
  if (!perfilIdRegistro.value) {
    notificationStore.addNotification('Seleccione un registro válido', 'error');
    return;
  }
  if (!perfilFotoFile.value) {
    notificationStore.addNotification('Seleccione un archivo de imagen antes de guardar', 'error');
    return;
  }

  isUploading.value = true;
  try {
    const { error } = perfilTipo.value === 'profesor'
      ? await ProfesorService.updateProfesorImagen(perfilIdRegistro.value, perfilFotoFile.value)
      : await AlumnoService.updateAlumnoImagen(perfilIdRegistro.value, perfilFotoFile.value);

    if (error) throw error;

    notificationStore.addNotification('Fotografía actualizada correctamente', 'success');
    isNewPhotoSelected.value = false;
    perfilFotoFile.value = null;
    
    // Recargar datos y refrescar perfil global si afecta al usuario actual
    await loadDatos();
    await authStore.loadUserProfile(authStore.user);
  } catch (error) {
    notificationStore.addNotification(`Error al guardar la fotografía: ${error.message}`, 'error');
  } finally {
    isUploading.value = false;
  }
};


// --- SECCIÓN SEGURIDAD Y CUENTA ---
const userAccountInfo = ref({
  email: 'N/A',
  created: 'N/A',
  id: 'N/A'
});

const changePasswordTargetUser = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isUpdatingPassword = ref(false);

const changePasswordUserOptions = computed(() => {
  const options = [];
  const myEmail = userAccountInfo.value.email;
  options.push({ value: myEmail, text: `Mi propia cuenta (${myEmail})` });

  profesores.value.forEach(p => {
    if (p.profe_email && p.profe_email.toLowerCase() !== myEmail.toLowerCase()) {
      options.push({ value: p.profe_email, text: `Profesor: ${p.profe_nombre} (${p.profe_email})` });
    }
  });

  alumnos.value.forEach(a => {
    if (a.alumno_email && a.alumno_email.toLowerCase() !== myEmail.toLowerCase()) {
      options.push({ value: a.alumno_email, text: `Alumno: ${a.alumno_nombre} (${a.alumno_email})` });
    }
  });

  return options;
});

const handleUpdatePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    notificationStore.addNotification('Las contraseñas no coinciden', 'error');
    return;
  }

  isUpdatingPassword.value = true;
  const targetEmail = changePasswordTargetUser.value || userAccountInfo.value.email;

  try {
    let res;
    if (targetEmail.toLowerCase() === userAccountInfo.value.email.toLowerCase()) {
      res = await AuthService.updatePassword(newPassword.value);
    } else {
      res = await AuthService.updatePasswordOtroUsuario(targetEmail, newPassword.value);
    }

    if (res.error) throw res.error;

    notificationStore.addNotification(`Contraseña de ${targetEmail} actualizada correctamente.`, 'success');
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err) {
    notificationStore.addNotification(`Error al actualizar contraseña: ${err.message}`, 'error');
  } finally {
    isUpdatingPassword.value = false;
  }
};


// --- INACTIVIDAD ---
const inactivityTimeout = ref('0');

const handleInactivityChange = () => {
  localStorage.setItem('inactiveTimeout', inactivityTimeout.value);
  notificationStore.addNotification('Preferencias de sesión actualizadas', 'success');
  
  // Disparar evento para alertar al store
  window.dispatchEvent(new CustomEvent('inactiveTimeoutChanged', { detail: inactivityTimeout.value }));
};


// --- APARIENCIA (TEMAS) ---
const activeTheme = ref('light');
const themes = [
  { key: 'light', name: '☀️ Claro', dots: ['#f8fafc', '#ffffff', '#4f46e5'] },
  { key: 'dark', name: '🌙 Oscuro', dots: ['#0b1329', '#1e293b', '#818cf8'] },
  { key: 'sepia', name: '🍂 Sepia', dots: ['#f4ecd8', '#fdf6e3', '#b45309'] },
  { key: 'indigo', name: '🌊 Océano Blue', dots: ['#f0f4ff', '#ffffff', '#4f46e5'] },
  { key: 'forest', name: '🌲 Bosque', dots: ['#f2f7f5', '#ffffff', '#10b981'] }
];

const handleThemeChange = (themeKey, themeName) => {
  activeTheme.value = themeKey;
  
  // Quitar clases previas del tema en el body
  const bodyClasses = Array.from(document.body.classList);
  bodyClasses.forEach(cls => {
    if (cls.startsWith('theme-')) {
      document.body.classList.remove(cls);
    }
  });

  // Aplicar nuevo tema
  document.body.classList.add(`theme-${themeKey}`);
  localStorage.setItem('theme', themeKey);
  notificationStore.addNotification(`Tema cambiado a: ${themeName}`, 'success');
};


// --- CARGAR DATOS ---
const loadDatos = async () => {
  isLoading.value = true;
  try {
    // Info de cuenta del store
    const currentUser = authStore.user;
    if (currentUser) {
      userAccountInfo.value = {
        email: currentUser.email || 'N/A',
        id: currentUser.id || 'N/A',
        created: currentUser.created_at ? new Date(currentUser.created_at).toLocaleString('es-ES') : 'N/A'
      };
      changePasswordTargetUser.value = currentUser.email;
    }

    // Cargar listas
    const [resProfesores, resAlumnos] = await Promise.all([
      ProfesorService.getProfesores(),
      AlumnoService.getAlumnos()
    ]);

    profesores.value = resProfesores.data || [];
    alumnos.value = resAlumnos.data || [];

    // Ajustar tab por defecto si es docente (oculta perfil)
    if (authStore.isDocente) {
      activeTab.value = 'cuenta';
    } else {
      activeTab.value = 'perfil';
      if (perfilRegistrosOptions.value.length > 0) {
        perfilIdRegistro.value = perfilRegistrosOptions.value[0].id;
      }
    }

    // Cargar configuraciones del localStorage
    activeTheme.value = localStorage.getItem('theme') || 'light';
    inactivityTimeout.value = localStorage.getItem('inactiveTimeout') || '0';

  } catch (error) {
    console.error('Error al cargar configuraciones:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadDatos();
});
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="configuracion" 
      titulo="Configuración de Sistema" 
      subtitulo="Gestione sus datos de perfil, seguridad de cuenta y personalice la apariencia." 
    />

    <div v-if="isLoading" class="loading">Cargando Módulo de Configuración...</div>

    <div v-else class="config-layout">
      <!-- BARRA LATERAL DE CONFIGURACIÓN -->
      <div class="config-sidebar">
        <button 
          v-if="!authStore.isDocente"
          type="button" 
          :class="['config-tab-btn', { active: activeTab === 'perfil' }]" 
          @click="activeTab = 'perfil'"
        >
          <svg class="config-tab-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Perfil</span>
        </button>
        
        <button 
          type="button" 
          :class="['config-tab-btn', { active: activeTab === 'cuenta' }]" 
          @click="activeTab = 'cuenta'"
        >
          <svg class="config-tab-icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>Seguridad</span>
        </button>
        
        <button 
          type="button" 
          :class="['config-tab-btn', { active: activeTab === 'apariencia' }]" 
          @click="activeTab = 'apariencia'"
        >
          <svg class="config-tab-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M12 12h10"/></svg>
          <span>Apariencia</span>
        </button>
      </div>

      <!-- CONTENIDO DE CONFIGURACIÓN -->
      <div class="config-content">
        
        <!-- 1. SECCIÓN PERFIL -->
        <div v-if="activeTab === 'perfil' && !authStore.isDocente" class="config-section active">
          <h3 class="config-section-title">Asociación de Perfil</h3>
          <p class="config-section-subtitle">Gestión e inyección de fotografías para usuarios en la base de datos.</p>
          
          <div class="profile-panel" style="margin: 0; max-width: 100%; box-shadow: none; border: none; padding: 0;">
            <div class="profile-row">
              <label for="perfil-tipo-usuario">Tipo de Usuario</label>
              <select id="perfil-tipo-usuario" v-model="perfilTipo" class="form-select">
                <option value="profesor">Profesor</option>
                <option value="alumno">Alumno</option>
              </select>
            </div>

            <div class="profile-row">
              <label for="perfil-id-registro">Seleccionar Registro</label>
              <select id="perfil-id-registro" v-model="perfilIdRegistro" class="form-select">
                <option v-for="r in perfilRegistrosOptions" :key="r.id" :value="r.id">
                  {{ r.nombre }} (#{{ r.id }})
                </option>
              </select>
            </div>

            <div class="profile-avatar-card">
              <p class="profile-avatar-title">
                {{ isNewPhotoSelected ? '✨ Vista Previa de la Nueva Foto' : 'Fotografía Actual' }}
              </p>
              <div style="position: relative; width: 120px; height: 120px; margin: 0 auto;">
                <img 
                  :src="perfilFotoPreview" 
                  alt="Vista previa" 
                  class="profile-avatar-image"
                >
              </div>
            </div>

            <div class="profile-row">
              <label for="perfil-input-file">Seleccionar Nueva Foto</label>
              <input 
                type="file" 
                ref="fileInput"
                id="perfil-input-file" 
                accept="image/*" 
                class="form-control"
                @change="handleFileChange"
              >
            </div>

            <div class="profile-button-row">
              <button 
                v-if="isNewPhotoSelected" 
                type="button" 
                @click="handleCancelPhoto" 
                class="btn-secondary-alt"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                @click="handleUploadPhoto" 
                class="btn-primary-alt"
                :disabled="isUploading || !perfilFotoFile"
              >
                {{ isUploading ? 'Guardando...' : 'Guardar Fotografía' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 2. SECCIÓN SEGURIDAD Y CUENTA -->
        <div v-if="activeTab === 'cuenta'" class="config-section active">
          <h3 class="config-section-title">Seguridad y Cuenta</h3>
          <p class="config-section-subtitle">Gestione la autenticación, contraseña y la sesión de su usuario.</p>
          
          <div class="config-card">
            <div class="config-card-title">
              <svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Datos de la Cuenta
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; font-size: 0.88rem;">
              <div>
                <strong style="color:var(--text-secondary)">Correo Electrónico:</strong>
                <p style="color:var(--text-muted); margin-top:4px;">{{ userAccountInfo.email }}</p>
              </div>
              <div>
                <strong style="color:var(--text-secondary)">Creado el:</strong>
                <p style="color:var(--text-muted); margin-top:4px;">{{ userAccountInfo.created }}</p>
              </div>
              <div>
                <strong style="color:var(--text-secondary)">Usuario ID:</strong>
                <p style="color:var(--text-muted); margin-top:4px; font-family:monospace; word-break:break-all;">{{ userAccountInfo.id }}</p>
              </div>
            </div>
          </div>

          <div class="config-card">
            <div class="config-card-title">
              <svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Cambiar Contraseña
            </div>
            <form @submit.prevent="handleUpdatePassword" style="display: flex; flex-direction: column; gap: 16px;">
              <div v-if="authStore.isAdminOrSuper">
                <div class="form-row">
                  <label for="change-password-target-user" style="font-weight:600; font-size:0.85rem; color:var(--text-secondary);">Seleccionar Usuario</label>
                  <select 
                    id="change-password-target-user" 
                    v-model="changePasswordTargetUser" 
                    class="form-select"
                  >
                    <option v-for="opt in changePasswordUserOptions" :key="opt.value" :value="opt.value">
                      {{ opt.text }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <label for="new-password" style="font-weight:600; font-size:0.85rem; color:var(--text-secondary);">Nueva Contraseña</label>
                <input 
                  type="password" 
                  id="new-password" 
                  v-model="newPassword" 
                  class="form-control" 
                  placeholder="Escriba su nueva contraseña" 
                  required 
                  minlength="6"
                >
              </div>
              
              <div class="form-row">
                <label for="confirm-password" style="font-weight:600; font-size:0.85rem; color:var(--text-secondary);">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  id="confirm-password" 
                  v-model="confirmPassword" 
                  class="form-control" 
                  placeholder="Repita su nueva contraseña" 
                  required 
                  minlength="6"
                >
              </div>
              
              <div style="display:flex; justify-content:flex-end;">
                <button 
                  type="submit" 
                  class="btn-primary-alt"
                  :disabled="isUpdatingPassword"
                >
                  {{ isUpdatingPassword ? 'Actualizando...' : 'Actualizar Contraseña' }}
                </button>
              </div>
            </form>
          </div>

          <div class="config-card">
            <div class="config-card-title">
              <svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Gestión de Sesión por Inactividad
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
              Para proteger su información, el sistema puede cerrar sesión de forma automática si no se detecta actividad en el navegador.
            </div>
            <div class="form-row" style="max-width: 300px;">
              <label for="select-inactivity" style="font-weight:600; font-size:0.85rem; color:var(--text-secondary);">Cerrar sesión automáticamente tras:</label>
              <select 
                id="select-inactivity" 
                v-model="inactivityTimeout" 
                @change="handleInactivityChange" 
                class="form-select"
              >
                <option value="0">Nunca cerrar sesión automáticamente</option>
                <option value="1">1 Minuto (Para pruebas)</option>
                <option value="15">15 Minutos</option>
                <option value="30">30 Minutos</option>
                <option value="60">60 Minutos (1 hora)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 3. SECCIÓN APARIENCIA -->
        <div v-if="activeTab === 'apariencia'" class="config-section active">
          <h3 class="config-section-title">Personalización de Apariencia</h3>
          <p class="config-section-subtitle">Ajuste la paleta cromática de la aplicación según sus preferencias.</p>
          
          <div class="theme-grid">
            <div 
              v-for="t in themes" 
              :key="t.key"
              :class="['theme-card', { active: activeTheme === t.key }]"
              @click="handleThemeChange(t.key, t.name)"
            >
              <div class="theme-preview-dots">
                <span 
                  v-for="(dotColor, dIdx) in t.dots" 
                  :key="dIdx" 
                  class="theme-dot" 
                  :style="{ backgroundColor: dotColor }"
                ></span>
              </div>
              <span class="theme-card-name">{{ t.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utiliza los estilos heredados de app.css */
</style>
