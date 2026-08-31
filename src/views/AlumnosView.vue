<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { AlumnoService, GradoService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';
import BaseModal from '@/components/BaseModal.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const alumnos = ref([]);
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
  alumno_nombre: '',
  grado_id: '',
  alumno_email: '',
  alumno_birthday: '',
  alumno_sexo: '',
  alumno_representante: '',
  alumno_telf: '',
  alumno_direccion: ''
});

// Lookup map de grados
const gradosMap = computed(() => {
  const map = new Map();
  grados.value.forEach(g => {
    map.set(String(g.id), g.grado_nombre);
  });
  return map;
});

// Grados que tienen al menos un alumno asignado (para la barra de filtros)
const gradosDeAlumnosConDatos = computed(() => {
  const list = alumnos.value.map(a => {
    return gradosMap.value.get(String(a.grado_id)) || (a.grado_id ? `#${a.grado_id}` : 'Sin grado');
  }).filter(Boolean);
  return [...new Set(list)].sort();
});

// Lista filtrada de alumnos para renderizado en tabla
const filteredAlumnos = computed(() => {
  let list = [...alumnos.value];

  // Ordenar por ID ascendente
  list.sort((a, b) => (a.id || 0) - (b.id || 0));

  // Filtrar por grado seleccionado
  if (selectedGradoFiltro.value) {
    list = list.filter(a => {
      const gNombre = gradosMap.value.get(String(a.grado_id)) || (a.grado_id ? `#${a.grado_id}` : 'Sin grado');
      return gNombre === selectedGradoFiltro.value;
    });
  }

  return list;
});

const loadDatos = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const [resAlumnos, resGrados] = await Promise.all([
      AlumnoService.getAlumnos(),
      GradoService.getGrados()
    ]);

    if (resAlumnos.error) throw resAlumnos.error;
    if (resGrados.error) throw resGrados.error;

    alumnos.value = resAlumnos.data || [];
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

const getMateriaFoto = (alumno) => {
  if (alumno.alumno_imagen_url && alumno.alumno_imagen_url.trim() !== '') {
    return alumno.alumno_imagen_url;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(alumno.alumno_nombre || 'Alumno')}&backgroundColor=0284c7`;
};

const getGradoNombre = (gradoId) => {
  return gradosMap.value.get(String(gradoId)) || (gradoId ? `#${gradoId}` : 'Sin grado');
};

const openNewAlumnoModal = () => {
  if (authStore.isDocente) return;
  modalTitle.value = 'Nuevo Alumno';
  formData.value = {
    id: '',
    alumno_nombre: '',
    grado_id: '',
    alumno_email: '',
    alumno_birthday: '',
    alumno_sexo: '',
    alumno_representante: '',
    alumno_telf: '',
    alumno_direccion: ''
  };
  showModal.value = true;
};

const openEditAlumnoModal = (alumno) => {
  modalTitle.value = alumno ? `Alumno #${alumno.id}` : 'Alumno';
  formData.value = {
    id: alumno.id,
    alumno_nombre: alumno.alumno_nombre || '',
    grado_id: alumno.grado_id || '',
    alumno_email: alumno.alumno_email || '',
    alumno_birthday: alumno.alumno_birthday || '',
    alumno_sexo: alumno.alumno_sexo || '',
    alumno_representante: alumno.alumno_representante || '',
    alumno_telf: alumno.alumno_telf || '',
    alumno_direccion: alumno.alumno_direccion || ''
  };
  showModal.value = true;
};

const handleSave = async () => {
  if (authStore.isDocente) return;

  const nombre = formData.value.alumno_nombre.trim();
  const gradoId = formData.value.grado_id;
  const email = formData.value.alumno_email.trim() || null;
  const birthday = formData.value.alumno_birthday || null;
  const sexo = formData.value.alumno_sexo || null;
  const representante = formData.value.alumno_representante.trim() || null;
  const telf = formData.value.alumno_telf.trim() || null;
  const direccion = formData.value.alumno_direccion.trim() || null;

  if (!nombre) {
    notificationStore.addNotification('El nombre del alumno es obligatorio', 'error');
    return;
  }
  if (!gradoId) {
    notificationStore.addNotification('El grado es obligatorio', 'error');
    return;
  }

  const payload = {
    alumno_nombre: nombre,
    grado_id: parseInt(gradoId, 10),
    alumno_email: email,
    alumno_birthday: birthday,
    alumno_sexo: sexo,
    alumno_representante: representante,
    alumno_telf: telf,
    alumno_direccion: direccion
  };

  try {
    if (formData.value.id) {
      const { error } = await AlumnoService.saveAlumno(formData.value.id, payload);
      if (error) throw error;
      notificationStore.addNotification('Alumno actualizado correctamente', 'success');
    } else {
      // Flujo de auto correlativo
      const { data: ultimoAlumno, error: errorMax } = await AlumnoService.getUltimoAlumno();
      if (errorMax) throw errorMax;

      const siguienteId = ultimoAlumno ? Number(ultimoAlumno.id) + 1 : 1;
      payload.id = siguienteId;

      const { error } = await AlumnoService.saveAlumno(null, payload);
      if (error) throw error;
      notificationStore.addNotification(`Alumno #${siguienteId} registrado correctamente`, 'success');
    }
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(`Error al guardar alumno: ${error.message}`, 'error');
  }
};

const handleDelete = async () => {
  if (authStore.isDocente || !formData.value.id) return;
  if (!confirm(`¿Deseas eliminar al alumno #${formData.value.id}? Esta acción no se puede deshacer.`)) return;

  try {
    const { error } = await AlumnoService.deleteAlumno(formData.value.id);
    if (error) throw error;

    notificationStore.addNotification('Alumno eliminado correctamente', 'success');
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(`Error al eliminar alumno: ${error.message}`, 'error');
  }
};
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="alumnos" 
      titulo="Alumnos" 
      subtitulo="Información general y gestión de alumnos."
    >
      <button 
        v-if="!authStore.isDocente" 
        @click="openNewAlumnoModal" 
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
          <option v-for="grado in gradosDeAlumnosConDatos" :key="grado" :value="grado">
            {{ grado }}
          </option>
        </select>
      </div>
    </div>

    <!-- Tabla de Datos -->
    <div class="table-responsive table-alumnos-scroll">
      <table class="data-table" id="tabla-alumnos">
        <thead> 
          <tr>
            <th>ID</th>
            <th style="width: 90px; text-align: center;">Foto</th>
            <th>Nombre</th>
            <th>Grado</th>
            <th>Email</th>
            <th>Nacimiento</th>
            <th>Sexo</th>
            <th>Representante</th>
            <th>Teléfono</th>
            <th>Dirección</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="10" class="loading">Consultando Alumnos...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="10" class="error-msg">❌ Error: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="filteredAlumnos.length === 0">
            <td colspan="10" style="text-align: center; padding: 20px;">No hay alumnos registrados.</td>
          </tr>
          <tr 
            v-else 
            v-for="a in filteredAlumnos" 
            :key="a.id" 
            @click="openEditAlumnoModal(a)"
            class="fila-alumno" 
            style="cursor: pointer;"
          >
            <td data-label="ID"><strong># {{ a.id }}</strong></td>
            <td data-label="Foto" style="text-align: center;">
              <img 
                :src="getMateriaFoto(a)" 
                :alt="a.alumno_nombre" 
                class="tabla-avatar"
              >
            </td>
            <td data-label="Nombre" class="text-bold">{{ a.alumno_nombre }}</td>
            <td data-label="Grado">
              <span class="badge" style="background-color: #e0e7ff; color: #3730a3;">
                {{ getGradoNombre(a.grado_id) }}
              </span>
            </td>
            <td data-label="Email"><span class="text-light">{{ a.alumno_email || '-' }}</span></td>
            <td data-label="Nacimiento"><span class="text-light">{{ a.alumno_birthday || '-' }}</span></td>
            <td data-label="Sexo">
              <span 
                class="badge" 
                :style="{
                  backgroundColor: a.alumno_sexo === 'Masculino' ? '#bde0fe' : '#ffafcc',
                  color: '#000'
                }"
              >
                {{ a.alumno_sexo || 'N/A' }}
              </span>
            </td>
            <td data-label="Representante"><span class="text-light">{{ a.alumno_representante || '-' }}</span></td>
            <td data-label="Teléfono"><span class="text-light">{{ a.alumno_telf || '-' }}</span></td>
            <td data-label="Dirección"><span class="text-light">{{ a.alumno_direccion || '-' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Alumno -->
    <BaseModal 
      :show="showModal" 
      :titulo="modalTitle" 
      @close="showModal = false"
    >
      <form @submit.prevent="handleSave" id="form-alumno">
        <div class="form-row">
          <label for="alumno-nombre">Nombre Completo *</label>
          <input 
            id="alumno-nombre" 
            v-model="formData.alumno_nombre" 
            type="text" 
            required 
            placeholder="Nombre del alumno"
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="alumno-grado">Grado *</label>
          <select 
            id="alumno-grado" 
            v-model="formData.grado_id" 
            required
            :disabled="authStore.isDocente"
          >
            <option value="">-- Seleccionar Grado --</option>
            <option v-for="g in grados" :key="g.id" :value="g.id">
              {{ g.grado_nombre }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <label for="alumno-email">Correo Electrónico</label>
          <input 
            id="alumno-email" 
            v-model="formData.alumno_email" 
            type="email" 
            placeholder="correo@ejemplo.com"
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="alumno-birthday">Fecha de Nacimiento</label>
          <input 
            id="alumno-birthday" 
            v-model="formData.alumno_birthday" 
            type="date"
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="alumno-sexo">Sexo</label>
          <select 
            id="alumno-sexo" 
            v-model="formData.alumno_sexo"
            :disabled="authStore.isDocente"
          >
            <option value="">-- Seleccionar Sexo --</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
        </div>
        <div class="form-row">
          <label for="alumno-representante">Representante</label>
          <input 
            id="alumno-representante" 
            v-model="formData.alumno_representante" 
            type="text" 
            placeholder="Nombre del representante"
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="alumno-telf">Teléfono</label>
          <input 
            id="alumno-telf" 
            v-model="formData.alumno_telf" 
            type="tel" 
            placeholder="Ej: +58 412 0000000"
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="alumno-direccion">Dirección</label>
          <textarea 
            id="alumno-direccion" 
            v-model="formData.alumno_direccion" 
            rows="2" 
            placeholder="Dirección de residencia"
            :disabled="authStore.isDocente"
          ></textarea>
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
