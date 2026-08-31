<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { PeriodoService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';
import BaseModal from '@/components/BaseModal.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const periodos = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');

// Estado del Modal y Formulario
const showModal = ref(false);
const modalTitle = ref('');
const formData = ref({
  id: '',
  anio_periodo: '',
  anio_inicio: '',
  anio_fin: ''
});

// Formateador de fecha local (DD/MM/YYYY)
const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const parts = fechaStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return fechaStr;
};

const loadPeriodos = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const { data, error } = await PeriodoService.getPeriodos();
    if (error) throw error;
    periodos.value = data || [];
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadPeriodos();
});

const openNewPeriodoModal = () => {
  if (authStore.isDocente) return;
  modalTitle.value = 'Nuevo Período';
  formData.value = { id: '', anio_periodo: '', anio_inicio: '', anio_fin: '' };
  showModal.value = true;
};

const openEditPeriodoModal = async (periodo) => {
  modalTitle.value = periodo ? `Período #${periodo.id}` : 'Período';
  formData.value = {
    id: periodo.id,
    anio_periodo: periodo.anio_periodo || '',
    anio_inicio: periodo.anio_inicio || '',
    anio_fin: periodo.anio_fin || ''
  };
  showModal.value = true;
};

const handleSave = async () => {
  if (authStore.isDocente) return;
  const anio_periodo = formData.value.anio_periodo.trim();
  const anio_inicio = formData.value.anio_inicio;
  const anio_fin = formData.value.anio_fin;

  if (!anio_periodo) {
    notificationStore.addNotification('El nombre del período es requerido', 'error');
    return;
  }
  if (!anio_inicio) {
    notificationStore.addNotification('La fecha de inicio es requerida', 'error');
    return;
  }
  if (!anio_fin) {
    notificationStore.addNotification('La fecha de fin es requerida', 'error');
    return;
  }

  if (new Date(anio_inicio) > new Date(anio_fin)) {
    notificationStore.addNotification('La fecha de inicio no puede ser posterior a la fecha de fin', 'error');
    return;
  }

  const payload = {
    anio_periodo,
    anio_inicio,
    anio_fin
  };

  try {
    const { error } = await PeriodoService.savePeriodo(formData.value.id, payload);
    if (error) throw error;

    notificationStore.addNotification(
      `Período ${formData.value.id ? 'actualizado' : 'creado'} con éxito`,
      'success'
    );
    showModal.value = false;
    await loadPeriodos();
  } catch (error) {
    notificationStore.addNotification(
      `Error al guardar el período: ${error.message}`,
      'error'
    );
  }
};

const handleDelete = async () => {
  if (authStore.isDocente || !formData.value.id) return;
  if (!confirm(`¿Estás seguro de eliminar el período #${formData.value.id}? Esta acción afectará los registros vinculados.`)) return;

  try {
    const { error } = await PeriodoService.deletePeriodo(formData.value.id);
    if (error) throw error;

    notificationStore.addNotification('Período eliminado correctamente', 'success');
    showModal.value = false;
    await loadPeriodos();
  } catch (error) {
    notificationStore.addNotification(`Error al eliminar el período: ${error.message}`, 'error');
  }
};
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="periodos" 
      titulo="Períodos" 
      subtitulo="Años académicos por período."
    >
      <button 
        v-if="!authStore.isDocente" 
        @click="openNewPeriodoModal" 
        class="btn-header-action" 
        aria-label="Añadir"
      >
        +
      </button>
    </HeaderSeccion>

    <!-- Tabla de Datos -->
    <div class="table-responsive table-periodos-scroll">
      <table class="data-table" id="tabla-periodos">
        <thead>
          <tr>
            <th>ID</th>
            <th>Período</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="4" class="loading">Consultando períodos...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="4" class="error-msg">❌ Error al cargar periodos: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="periodos.length === 0">
            <td colspan="4" style="text-align: center; padding: 20px;">No hay períodos registrados.</td>
          </tr>
          <tr 
            v-else 
            v-for="p in periodos" 
            :key="p.id" 
            @click="openEditPeriodoModal(p)"
            class="fila-periodo" 
            style="cursor:pointer;"
          >
            <td data-label="ID"><strong># {{ p.id }}</strong></td>
            <td data-label="Período" class="text-bold">{{ p.anio_periodo }}</td>
            <td data-label="Fecha Inicio"><span class="text-light">{{ formatearFecha(p.anio_inicio) || 'Sin inicio' }}</span></td>
            <td data-label="Fecha Fin"><span class="text-light">{{ formatearFecha(p.anio_fin) || 'Sin fin' }}</span></td>
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
      <form @submit.prevent="handleSave" id="form-periodo">
        <div class="form-row">
          <label for="periodo-nombre">Nombre del Período (Ej: 2025-2026)</label>
          <input 
            id="periodo-nombre" 
            v-model="formData.anio_periodo" 
            type="text" 
            placeholder="Ej. 2025-2026" 
            required
            :disabled="authStore.isDocente"
          >
        </div>

        <div class="form-row">
          <label for="periodo-inicio">Fecha de Inicio</label>
          <input 
            id="periodo-inicio" 
            v-model="formData.anio_inicio" 
            type="date" 
            required
            :disabled="authStore.isDocente"
          >
        </div>

        <div class="form-row">
          <label for="periodo-fin">Fecha de Fin</label>
          <input 
            id="periodo-fin" 
            v-model="formData.anio_fin" 
            type="date" 
            required
            :disabled="authStore.isDocente"
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
