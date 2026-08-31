<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { MateriaService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';
import BaseModal from '@/components/BaseModal.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const materias = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');

// Estado del Modal y Formulario
const showModal = ref(false);
const modalTitle = ref('');
const formData = ref({
  id: '',
  nombre: '',
  descripcion: ''
});

const loadMaterias = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const { data, error } = await MateriaService.getMaterias();
    if (error) throw error;
    materias.value = data || [];
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadMaterias();
});

const openNewMateriaModal = () => {
  if (authStore.isDocente) return;
  modalTitle.value = 'Nueva Materia';
  formData.value = { id: '', nombre: '', descripcion: '' };
  showModal.value = true;
};

const openEditMateriaModal = async (materia) => {
  modalTitle.value = materia ? `Materia #${materia.id}` : 'Materia';
  formData.value = {
    id: materia.id,
    nombre: materia.materia_nombre || '',
    descripcion: materia.materia_descripcion || ''
  };
  showModal.value = true;
};

const handleSave = async () => {
  if (authStore.isDocente) return;
  const nombre = formData.value.nombre.trim();
  const descripcion = formData.value.descripcion.trim();

  if (!nombre) {
    notificationStore.addNotification('El nombre es obligatorio', 'error');
    return;
  }

  const payload = { materia_nombre: nombre, materia_descripcion: descripcion };
  
  try {
    const { error } = await MateriaService.saveMateria(formData.value.id, payload);
    if (error) throw error;

    notificationStore.addNotification(
      `Materia ${formData.value.id ? 'actualizada' : 'creada'} correctamente`, 
      'success'
    );
    showModal.value = false;
    await loadMaterias();
  } catch (error) {
    notificationStore.addNotification(
      `Error al guardar materia: ${error.message}`, 
      'error'
    );
  }
};

const handleDelete = async () => {
  if (authStore.isDocente || !formData.value.id) return;
  if (!confirm('¿Eliminar esta materia? Esta acción no se puede deshacer.')) return;

  try {
    const { error } = await MateriaService.deleteMateria(formData.value.id);
    if (error) throw error;

    notificationStore.addNotification('Materia eliminada correctamente', 'success');
    showModal.value = false;
    await loadMaterias();
  } catch (error) {
    notificationStore.addNotification(`Error al eliminar materia: ${error.message}`, 'error');
  }
};
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="materias" 
      titulo="Materias" 
      subtitulo="Disciplinas académicas del diseño curricular."
    >
      <button 
        v-if="!authStore.isDocente" 
        @click="openNewMateriaModal" 
        class="btn-header-action" 
        aria-label="Añadir"
      >
        +
      </button>
    </HeaderSeccion>

    <!-- Tabla de Datos -->
    <div class="table-responsive table-materias-scroll">
      <table class="data-table" id="tabla-materias">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Descripción Académica</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="3" class="loading">Consultando materias...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="3" class="error-msg">❌ Error: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="materias.length === 0">
            <td colspan="3" style="text-align: center; padding: 20px;">No hay materias registradas.</td>
          </tr>
          <tr 
            v-else 
            v-for="m in materias" 
            :key="m.id" 
            @click="openEditMateriaModal(m)"
            class="fila-materia" 
            style="cursor: pointer;"
          >
            <td data-label="Código"><strong># {{ m.id }}</strong></td>
            <td data-label="Nombre" class="text-bold">{{ m.materia_nombre }}</td>
            <td data-label="Descripción">{{ m.materia_descripcion || 'Sin descripción' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Formulario -->
    <BaseModal 
      :show="showModal" 
      :titulo="modalTitle" 
      @close="showModal = false"
    >
      <form @submit.prevent="handleSave" id="form-materia">
        <div class="form-row">
          <label for="materia-nombre">Nombre</label>
          <input 
            id="materia-nombre" 
            v-model="formData.nombre" 
            type="text" 
            required
            :disabled="authStore.isDocente"
          >
        </div>
        <div class="form-row">
          <label for="materia-descripcion">Descripción</label>
          <textarea 
            id="materia-descripcion" 
            v-model="formData.descripcion" 
            rows="4"
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
