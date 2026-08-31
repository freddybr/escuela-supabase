<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { ProfesorService, GradoService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';
import BaseModal from '@/components/BaseModal.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const profesores = ref([]);
const grados = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');

// Filtros reactivos
const selectedGradoFiltro = ref('');

// Estado de Modal y Formulario
const showModal = ref(false);
const modalTitle = ref('');
const formData = ref({
  id: '',
  profe_nombre: '',
  grado_id: '',
  profe_email: '',
  profe_telf: '',
  profe_estatus: 'Activo',
  profe_rol: ''
});

// Lookup map de grados
const gradosMap = computed(() => {
  const map = new Map();
  grados.value.forEach(g => {
    map.set(String(g.id), g.grado_nombre);
  });
  return map;
});

// Privilegio para editar campo Rol (superadmin o correo admin específico)
const tienePermisoRol = computed(() => {
  return authStore.isAdminOrSuper;
});

// Grados que tienen al menos un profesor asignado (para la barra de filtros)
const gradosDeProfesoresConDatos = computed(() => {
  const list = profesores.value.map(p => {
    return gradosMap.value.get(String(p.grado_id)) || (p.grado_id ? `#${p.grado_id}` : 'Sin grado');
  }).filter(Boolean);
  return [...new Set(list)].sort();
});

// Lista filtrada de profesores para renderizado en tabla
const filteredProfesores = computed(() => {
  let list = [...profesores.value];

  // Ordenar por ID ascendente
  list.sort((a, b) => (a.id || 0) - (b.id || 0));

  // Filtrar por grado seleccionado
  if (selectedGradoFiltro.value) {
    list = list.filter(p => {
      const gNombre = gradosMap.value.get(String(p.grado_id)) || (p.grado_id ? `#${p.grado_id}` : 'Sin grado');
      return gNombre === selectedGradoFiltro.value;
    });
  }

  return list;
});

const loadDatos = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const [resProfesores, resGrados] = await Promise.all([
      ProfesorService.getProfesores(),
      GradoService.getGrados()
    ]);

    if (resProfesores.error) throw resProfesores.error;
    if (resGrados.error) throw resGrados.error;

    profesores.value = resProfesores.data || [];
    grados.value = resGrados.data || [];
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadDatos();
});

const getProfesorFoto = (p) => {
  if (p.profe_imagen_url && p.profe_imagen_url.trim() !== '') {
    return p.profe_imagen_url;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.profe_nombre || 'Profe')}&backgroundColor=4f46e5`;
};

const getGradoNombre = (gradoId) => {
  return gradosMap.value.get(String(gradoId)) || (gradoId ? `#${gradoId}` : 'Sin grado');
};

const openNewProfesorModal = () => {
  if (authStore.isDocente) return;
  modalTitle.value = 'Nuevo Profesor';
  formData.value = {
    id: '',
    profe_nombre: '',
    grado_id: '',
    profe_email: '',
    profe_telf: '',
    profe_estatus: 'Activo',
    profe_rol: ''
  };
  showModal.value = true;
};

const openEditProfesorModal = (profe) => {
  modalTitle.value = profe ? `Profesor #${profe.id}` : 'Profesor';
  formData.value = {
    id: profe.id,
    profe_nombre: profe.profe_nombre || '',
    grado_id: profe.grado_id || '',
    profe_email: profe.profe_email || '',
    profe_telf: profe.profe_telf || '',
    profe_estatus: profe.profe_estatus || 'Activo',
    profe_rol: profe.profe_rol || ''
  };
  showModal.value = true;
};

const handleSave = async () => {
  if (authStore.isDocente) return;

  const nombre = formData.value.profe_nombre.trim();
  const gradoId = formData.value.grado_id || null;
  const email = formData.value.profe_email.trim() || null;
  const telf = formData.value.profe_telf.trim() || null;
  const estatus = formData.value.profe_estatus;
  const rol = formData.value.profe_rol.trim() || null;

  if (!nombre) {
    notificationStore.addNotification('El nombre del profesor es obligatorio', 'error');
    return;
  }

  const payload = {
    profe_nombre: nombre,
    grado_id: gradoId ? parseInt(gradoId, 10) : null,
    profe_email: email,
    profe_telf: telf,
    profe_estatus: estatus
  };

  // Solo guardar el rol si se tiene permiso
  if (tienePermisoRol.value) {
    payload.profe_rol = rol;
  }

  try {
    if (formData.value.id) {
      const { error } = await ProfesorService.saveProfesor(formData.value.id, payload);
      if (error) throw error;
      notificationStore.addNotification('Profesor actualizado correctamente', 'success');
    } else {
      // Flujo de auto correlativo
      const { data: ultimoProfe, error: errorMax } = await ProfesorService.getUltimoProfesor();
      if (errorMax) throw errorMax;

      const siguienteId = ultimoProfe ? Number(ultimoProfe.id) + 1 : 1;
      payload.id = siguienteId;

      const { error } = await ProfesorService.saveProfesor(null, payload);
      if (error) throw error;
      notificationStore.addNotification(`Profesor #${siguienteId} registrado correctamente`, 'success');
    }
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(`Error al guardar profesor: ${error.message}`, 'error');
  }
};

const handleDelete = async () => {
  if (authStore.isDocente || !formData.value.id) return;
  if (!confirm(`¿Deseas eliminar al profesor #${formData.value.id}? Esta acción no se puede deshacer.`)) return;

  try {
    const { error } = await ProfesorService.deleteProfesor(formData.value.id);
    if (error) throw error;

    notificationStore.addNotification('Profesor eliminado correctamente', 'success');
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(`Error al eliminar profesor: ${error.message}`, 'error');
  }
};
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="profesores" 
      titulo="Profesores" 
      subtitulo="Información general y gestión de profesores."
    >
      <button 
        v-if="!authStore.isDocente" 
        @click="openNewProfesorModal" 
        class="btn-header-action" 
        aria-label="Añadir"
      >
        +
      </button>
    </HeaderSeccion>

    <!-- Filtros -->
    <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: center;">
      <div style="width: 220px;">
        <select v-model="selectedGradoFiltro" class="form-select">
          <option value="">Todos los Grados</option>
          <option v-for="grado in gradosDeProfesoresConDatos" :key="grado" :value="grado">
            {{ grado }}
          </option>
        </select>
      </div>
    </div>

    <!-- Tabla de Datos -->
    <div class="table-responsive table-profesores-scroll">
      <table class="data-table" id="tabla-profesores">
        <thead>
          <tr>
            <th>ID</th>
            <th style="width: 90px; text-align: center;">Foto</th>
            <th>Grado</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estatus</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="8" class="loading">Consultando Profesores...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="8" class="error-msg">❌ Error: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="filteredProfesores.length === 0">
            <td colspan="8" style="text-align: center; padding: 20px;">No hay profesores registrados.</td>
          </tr>
          <tr 
            v-else 
            v-for="p in filteredProfesores" 
            :key="p.id" 
            @click="openEditProfesorModal(p)"
            class="fila-profesor" 
            style="cursor: pointer;"
          >
            <td data-label="ID"><strong># {{ p.id }}</strong></td>
            <td data-label="Foto" style="text-align: center;">
              <img 
                :src="getProfesorFoto(p)" 
                :alt="p.profe_nombre" 
                class="tabla-avatar"
              >
            </td>
            <td data-label="Grado">
              <span class="badge" style="background-color: #e0e7ff; color: #3730a3;">
                {{ getGradoNombre(p.grado_id) }}
              </span>
            </td>
            <td data-label="Nombre" class="text-bold">{{ p.profe_nombre }}</td>
            <td data-label="Email"><span class="text-light">{{ p.profe_email || '-' }}</span></td>
            <td data-label="Teléfono"><span class="text-light">{{ p.profe_telf || '-' }}</span></td>
            <td data-label="Estatus">
              <span 
                class="badge" 
                :style="{
                  backgroundColor: p.profe_estatus === 'Activo' ? '#c7f9cc' : '#ffccd5',
                  color: '#000'
                }"
              >
                {{ p.profe_estatus || 'N/A' }}
              </span>
            </td>
            <td data-label="Rol"><span class="text-light">{{ p.profe_rol || '-' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Profesor -->
    <BaseModal 
      :show="showModal" 
      :titulo="modalTitle" 
      @close="showModal = false"
    >
      <form @submit.prevent="handleSave" id="form-profesor">
        <div class="form-row">
          <label for="profe-nombre">Nombre Completo *</label>
          <input 
            id="profe-nombre" 
            v-model="formData.profe_nombre" 
            type="text" 
            required 
            placeholder="Nombre del profesor"
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="profe-grado">Grado Asignado</label>
          <select 
            id="profe-grado" 
            v-model="formData.grado_id"
            :disabled="authStore.isDocente"
          >
            <option value="">-- Seleccionar Grado --</option>
            <option v-for="g in grados" :key="g.id" :value="g.id">
              {{ g.grado_nombre }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <label for="profe-email">Correo Electrónico</label>
          <input 
            id="profe-email" 
            v-model="formData.profe_email" 
            type="email" 
            placeholder="profesor@ejemplo.com"
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="profe-telf">Teléfono</label>
          <input 
            id="profe-telf" 
            v-model="formData.profe_telf" 
            type="tel" 
            placeholder="Ej: +58 412 0000000"
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="profe-estatus">Estatus</label>
          <select 
            id="profe-estatus" 
            v-model="formData.profe_estatus"
            :disabled="authStore.isDocente"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
        <div class="form-row">
          <label for="profe-rol">Rol</label>
          <input 
            id="profe-rol" 
            v-model="formData.profe_rol" 
            type="text" 
            placeholder="Ej: Titular, Auxiliar, Coordinador"
            :disabled="!tienePermisoRol"
          >
        </div>
      </form>

      <template #footer>
        <button @click="showModal = false" class="btn-secondary">Cancelar</button>
        <button 
          v-if="formData.id && !authStore.isDocente" 
          @click="handleDelete" 
          class="btn-danger"
        >
          Eliminar
        </button>
        <button 
          v-if="!authStore.isDocente" 
          @click="handleSave" 
          class="btn-primary"
        >
          Guardar
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
/* Utiliza los estilos heredados de app.css */
</style>
