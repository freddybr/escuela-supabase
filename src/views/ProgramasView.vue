<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { ProgramaService, MateriaService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';
import BaseModal from '@/components/BaseModal.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const programas = ref([]);
const materias = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');

// Para búsquedas rápidas por ID de materia
const materiasMap = ref(new Map());

// Estado de Modal y Formulario
const showModal = ref(false);
const modalTitle = ref('');
const formData = ref({
  id: '',
  materia_id: '',
  programa_tema: '',
  programa_objetivo: '',
  programa_texto: '',
  programa_estatus: 'Disponible'
});

const loadDatos = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const [resProgramas, resMaterias] = await Promise.all([
      ProgramaService.getProgramas(),
      MateriaService.getMaterias()
    ]);

    if (resProgramas.error) throw resProgramas.error;
    if (resMaterias.error) throw resMaterias.error;

    programas.value = resProgramas.data || [];
    materias.value = resMaterias.data || [];

    // Crear mapa de lookup
    const map = new Map();
    materias.value.forEach(m => {
      map.set(String(m.id), m.materia_nombre);
    });
    materiasMap.value = map;
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadDatos();
});

const getMateriaNombre = (materiaId) => {
  return materiasMap.value.get(String(materiaId)) || (materiaId ? `#${materiaId}` : 'Sin materia');
};

const openNewProgramaModal = () => {
  if (authStore.isDocente) return;
  modalTitle.value = 'Nuevo Programa';
  formData.value = {
    id: '',
    materia_id: '',
    programa_tema: '',
    programa_objetivo: '',
    programa_texto: '',
    programa_estatus: 'Disponible'
  };
  showModal.value = true;
};

const openEditProgramaModal = (programa) => {
  modalTitle.value = programa ? `Programa #${programa.id}` : 'Programa';
  formData.value = {
    id: programa.id,
    materia_id: programa.materia_id || '',
    programa_tema: programa.programa_tema || '',
    programa_objetivo: programa.programa_objetivo || '',
    programa_texto: programa.programa_texto || '',
    programa_estatus: programa.programa_estatus || 'Disponible'
  };
  showModal.value = true;
};

const handleSave = async () => {
  if (authStore.isDocente) return;

  const materiaId = formData.value.materia_id;
  const tema = formData.value.programa_tema.trim();
  const objetivo = formData.value.programa_objetivo.trim();
  const texto = formData.value.programa_texto.trim();
  const estatus = formData.value.programa_estatus;

  if (!materiaId) {
    notificationStore.addNotification('Seleccione una materia', 'error');
    return;
  }
  if (!tema) {
    notificationStore.addNotification('El título de programa es requerido', 'error');
    return;
  }

  const payload = {
    materia_id: parseInt(materiaId, 10),
    programa_tema: tema,
    programa_objetivo: objetivo || null,
    programa_texto: texto || null,
    programa_estatus: estatus
  };

  try {
    const { error } = await ProgramaService.savePrograma(formData.value.id, payload);
    if (error) throw error;

    notificationStore.addNotification(
      `Programa ${formData.value.id ? 'actualizado' : 'creado'} correctamente`,
      'success'
    );
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(
      `Error al guardar el programa: ${error.message}`,
      'error'
    );
  }
};

const handleDelete = async () => {
  if (authStore.isDocente || !formData.value.id) return;
  if (!confirm(`¿Estás seguro de eliminar el programa #${formData.value.id}? Esta acción no se puede deshacer.`)) return;

  try {
    const { error } = await ProgramaService.deletePrograma(formData.value.id);
    if (error) throw error;

    notificationStore.addNotification('Programa eliminado correctamente', 'success');
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(`Error al eliminar programa: ${error.message}`, 'error');
  }
};
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="programas" 
      titulo="Programas" 
      subtitulo="Contenido de programas."
    >
      <button 
        v-if="!authStore.isDocente" 
        @click="openNewProgramaModal" 
        class="btn-header-action" 
        aria-label="Añadir"
      >
        +
      </button>
    </HeaderSeccion>

    <!-- Tabla de Datos -->
    <div class="table-responsive table-programas-scroll">
      <table class="data-table" id="tabla-programas">
        <thead>
          <tr>
            <th>ID</th>
            <th>Materia</th>
            <th>Programa</th>
            <th>Objetivo</th>
            <th>Versículo</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="loading">Consultando Programas...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="6" class="error-msg">❌ Error: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="programas.length === 0">
            <td colspan="6" style="text-align: center; padding: 20px;">No hay programas registrados.</td>
          </tr>
          <tr 
            v-else 
            v-for="p in programas" 
            :key="p.id" 
            @click="openEditProgramaModal(p)"
            class="fila-programa" 
            style="cursor: pointer;"
          >
            <td data-label="ID"><strong># {{ p.id }}</strong></td>
            <td data-label="Materia" class="text-bold">{{ getMateriaNombre(p.materia_id) }}</td>
            <td data-label="Programa" class="text-bold">{{ p.programa_tema || '-' }}</td>
            <td data-label="Objetivo"><span class="text-light">{{ p.programa_objetivo || '-' }}</span></td>
            <td data-label="Versículo"><span class="text-light">{{ p.programa_texto || '-' }}</span></td>
            <td data-label="Estatus">
              <span 
                class="badge" 
                :style="{
                  backgroundColor: p.programa_estatus === 'Disponible' ? '#c7f9cc' : '#ffe3e0',
                  color: '#000'
                }"
              >
                {{ p.programa_estatus || '-' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Programa -->
    <BaseModal 
      :show="showModal" 
      :titulo="modalTitle" 
      @close="showModal = false"
    >
      <form @submit.prevent="handleSave" id="form-programa">
        <div class="form-row">
          <label for="programa-materia">Materia</label>
          <select 
            id="programa-materia" 
            v-model="formData.materia_id" 
            required
            :disabled="authStore.isDocente"
          >
            <option value="">-- Seleccionar Materia --</option>
            <option v-for="m in materias" :key="m.id" :value="m.id">
              {{ m.materia_nombre }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <label for="programa-tema">Programa (Título)</label>
          <input 
            id="programa-tema" 
            v-model="formData.programa_tema" 
            type="text" 
            required
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="programa-objetivo">Objetivo</label>
          <textarea 
            id="programa-objetivo" 
            v-model="formData.programa_objetivo" 
            rows="3"
            :disabled="authStore.isDocente"
          ></textarea>
        </div>
        <div class="form-row">
          <label for="programa-texto">Versículo / Texto</label>
          <textarea 
            id="programa-texto" 
            v-model="formData.programa_texto" 
            rows="3"
            :disabled="authStore.isDocente"
          ></textarea>
        </div>
        <div class="form-row">
          <label for="programa-estatus">Estatus</label>
          <select 
            id="programa-estatus" 
            v-model="formData.programa_estatus" 
            required
            :disabled="authStore.isDocente"
          >
            <option value="Disponible">Disponible</option>
            <option value="Elaborando">Elaborando</option>
          </select>
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
