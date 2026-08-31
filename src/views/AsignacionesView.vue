<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { AsignacionService, ProgramaService, GradoService, PeriodoService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';
import BaseModal from '@/components/BaseModal.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const asignacionesDetalles = ref([]);
const programasDisponibles = ref([]);
const grados = ref([]);
const periodos = ref([]);

const isLoading = ref(true);
const errorMsg = ref('');

// Estado de Modal y Formulario
const showModal = ref(false);
const modalTitle = ref('');
const formData = ref({
  id: '',
  programa_id: '',
  grado_id: '',
  anio_id: '',
  asigna_estatus: 'Activa'
});

const loadDatos = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const [resVista, resProgramas, resGrados, resAnio] = await Promise.all([
      AsignacionService.getAsignacionesDetalles(),
      ProgramaService.getProgramasDisponibles(),
      GradoService.getGrados(),
      PeriodoService.getPeriodos()
    ]);

    if (resVista.error) throw resVista.error;
    
    asignacionesDetalles.value = resVista.data || [];
    programasDisponibles.value = resProgramas.data || [];
    grados.value = resGrados.data || [];
    periodos.value = resAnio.data || [];
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadDatos();
});

const openNewAsignacionModal = () => {
  if (authStore.isDocente) return;
  modalTitle.value = 'Nueva Asignación';
  formData.value = {
    id: '',
    programa_id: '',
    grado_id: '',
    anio_id: '',
    asigna_estatus: 'Activa'
  };
  showModal.value = true;
};

const openEditAsignacionModal = async (asigna) => {
  modalTitle.value = asigna ? `Asignación #${asigna.asigna_id}` : 'Asignación';
  
  // Buscar asignación por ID para cargar los valores del formulario
  try {
    const { data, error } = await AsignacionService.getAsignacion(asigna.asigna_id);
    if (error) throw error;
    
    if (data) {
      formData.value = {
        id: data.id,
        programa_id: data.programa_id || '',
        grado_id: data.grado_id || '',
        anio_id: data.anio_id || '',
        asigna_estatus: data.asigna_estatus || 'Activa'
      };
      showModal.value = true;
    }
  } catch (err) {
    notificationStore.addNotification(`Error al obtener asignación: ${err.message}`, 'error');
  }
};

const handleSave = async () => {
  if (authStore.isDocente) return;

  const programaId = formData.value.programa_id;
  const gradoId = formData.value.grado_id;
  const anioId = formData.value.anio_id;
  const estatus = formData.value.asigna_estatus;

  if (!programaId) {
    notificationStore.addNotification('Seleccione un programa', 'error');
    return;
  }
  if (!gradoId) {
    notificationStore.addNotification('Seleccione un grado', 'error');
    return;
  }
  if (!anioId) {
    notificationStore.addNotification('Seleccione un período (año)', 'error');
    return;
  }

  const payload = {
    programa_id: parseInt(programaId, 10),
    grado_id: parseInt(gradoId, 10),
    anio_id: parseInt(anioId, 10),
    asigna_estatus: estatus
  };

  try {
    const { error } = await AsignacionService.saveAsignacion(formData.value.id, payload);
    if (error) throw error;

    notificationStore.addNotification(
      `Asignación ${formData.value.id ? 'actualizada' : 'creada'} correctamente`,
      'success'
    );
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(
      `Error al guardar asignación: ${error.message}`,
      'error'
    );
  }
};

const handleDelete = async () => {
  if (authStore.isDocente || !formData.value.id) return;
  if (!confirm(`¿Desea eliminar la asignación #${formData.value.id}? Esta acción no se puede deshacer.`)) return;

  try {
    const { error } = await AsignacionService.deleteAsignacion(formData.value.id);
    if (error) throw error;

    notificationStore.addNotification('Asignación eliminada correctamente', 'success');
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(`Error al eliminar asignación: ${error.message}`, 'error');
  }
};
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="asignaciones" 
      titulo="Asignaciones" 
      subtitulo="Distribución de los programas entre los grados."
    >
      <button 
        v-if="!authStore.isDocente" 
        @click="openNewAsignacionModal" 
        class="btn-header-action" 
        aria-label="Añadir"
      >
        +
      </button>
    </HeaderSeccion>

    <!-- Tabla de Datos -->
    <div class="table-responsive table-asignaciones-scroll">
      <table class="data-table" id="tabla-asignaciones">
        <thead>
          <tr>
            <th>ID</th>
            <th># Prog</th>
            <th>Programa</th>
            <th>Grado</th>
            <th>Estatus</th>
            <th>Periodo</th>
            <th>Materia</th>
            <th># Clases</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="8" class="loading">Consultando Asignaciones...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="8" class="error-msg">❌ Error al cargar asignaciones: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="asignacionesDetalles.length === 0">
            <td colspan="8" style="text-align: center; padding: 20px;">No hay asignaciones registradas.</td>
          </tr>
          <tr 
            v-else 
            v-for="n in asignacionesDetalles" 
            :key="n.asigna_id" 
            @click="openEditAsignacionModal(n)"
            class="fila-asignacion" 
            style="cursor:pointer;"
          >
            <td data-label="ID"><strong># {{ n.asigna_id }}</strong></td>
            <td data-label="# Prog" class="text-bold">{{ n.programa_id }}</td>
            <td data-label="Programa" class="text-bold">{{ n.programa_tema || 'Sin programa' }}</td>
            <td data-label="Grado"><span class="text-light">{{ n.grado_numero || 'N/A' }}</span></td>
            <td data-label="Estatus">
              <span 
                class="badge" 
                :style="{
                  backgroundColor: n.asigna_estatus === 'Activa' ? '#c7f9cc' : '#ffe3e0',
                  color: '#000'
                }"
              >
                {{ n.asigna_estatus }}
              </span>
            </td>
            <td data-label="Periodo"><span class="text-light">{{ n.anio_periodo || 'N/A' }}</span></td>
            <td data-label="Materia"><span class="text-light">{{ n.materia_nombre || 'N/A' }}</span></td>
            <td data-label="# Clases"><span class="text-light">{{ n.total_clases ?? 0 }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Asignacion -->
    <BaseModal 
      :show="showModal" 
      :titulo="modalTitle" 
      @close="showModal = false"
    >
      <form @submit.prevent="handleSave" id="form-asignacion">
        <div class="form-row">
          <label for="asigna-programa">Programa (Disponible)</label>
          <select 
            id="asigna-programa" 
            v-model="formData.programa_id" 
            required
            :disabled="authStore.isDocente"
          >
            <option value="">-- Seleccionar Programa --</option>
            <option v-for="p in programasDisponibles" :key="p.id" :value="p.id">
              #{{ p.id }} - {{ p.programa_tema }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label for="asigna-grado">Grado</label>
          <select 
            id="asigna-grado" 
            v-model="formData.grado_id" 
            required
            :disabled="authStore.isDocente"
          >
            <option value="">-- Seleccionar Grado --</option>
            <option v-for="g in grados" :key="g.id" :value="g.id">
              {{ g.grado_nombre || g.grado_numero }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label for="asigna-anio">Periodo (Año)</label>
          <select 
            id="asigna-anio" 
            v-model="formData.anio_id" 
            required
            :disabled="authStore.isDocente"
          >
            <option value="">-- Seleccionar Periodo --</option>
            <option v-for="a in periodos" :key="a.id" :value="a.id">
              {{ a.anio_periodo }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label for="asigna-estatus">Estatus de Asignación</label>
          <select 
            id="asigna-estatus" 
            v-model="formData.asigna_estatus" 
            required
            :disabled="authStore.isDocente"
          >
            <option value="Activa">Activa</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Terminada">Terminada</option>
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
