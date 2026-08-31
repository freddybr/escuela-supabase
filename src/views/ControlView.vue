<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { ControlService, ProfesorService, AsignacionService, AlumnoService, AsistenciaService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';
import BaseModal from '@/components/BaseModal.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const controlVista = ref([]);
const profesores = ref([]);
const asignaciones = ref([]);

const isLoading = ref(true);
const errorMsg = ref('');

// Filtros reactivos
const searchQuery = ref('');
const selectedAsignacion = ref('');
const selectedEstatus = ref('');

// Estado de Modal y Formulario
const showModal = ref(false);
const modalTitle = ref('');
const modalGradoId = ref(null);

const formData = ref({
  id: '',
  control_fecha: '',
  profe_id: '',
  control_observ: '',
  control_estatus: 'Pendiente'
});

const loadDatos = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const [resVista, resProfesores, resAsignaciones] = await Promise.all([
      ControlService.getControlesVista(),
      ProfesorService.getProfesoresParaControl(),
      AsignacionService.getAsignacionesDetalles()
    ]);

    if (resVista.error) throw resVista.error;
    if (resProfesores.error) throw resProfesores.error;
    if (resAsignaciones.error) throw resAsignaciones.error;

    controlVista.value = resVista.data || [];
    profesores.value = resProfesores.data || [];
    asignaciones.value = resAsignaciones.data || [];
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadDatos();
});

// Lista única de estatus para filtro
const estatusUnicos = computed(() => {
  const estatus = controlVista.value
    .map(c => c.control_estatus)
    .filter(Boolean);
  return [...new Set(estatus)].sort();
});

// Asignaciones activas para filtro
const asignacionesActivas = computed(() => {
  return asignaciones.value.filter(asig => asig.asigna_estatus === 'Activa');
});

// Profesores correspondientes al grado de la clase seleccionada en el modal
const profesoresFiltradosModal = computed(() => {
  if (!modalGradoId.value) return [];
  return profesores.value.filter(p => p.grado_id === modalGradoId.value);
});

// Título dinámico para el header basado en la asignación seleccionada
const dynamicTitle = computed(() => {
  if (selectedAsignacion.value) {
    const found = asignaciones.value.find(a => String(a.asigna_id) === String(selectedAsignacion.value));
    if (found) {
      return `Ejecución - #${found.asigna_id} Prog: ${found.programa_tema} | Grado: ${found.grado_numero}`;
    }
  }
  return 'Ejecución';
});

// Contador total basado en el filtro de asignación
const totalCountForAsignacion = computed(() => {
  if (!selectedAsignacion.value) return controlVista.value.length;
  return controlVista.value.filter(c => String(c.asigna_id) === String(selectedAsignacion.value)).length;
});

// Clases filtradas por texto, asignación y estatus
const filteredControl = computed(() => {
  let list = [...controlVista.value];

  // Ordenar: Grado y luego número de clase
  list.sort((a, b) => {
    const gradoA = parseInt(a.grado_numero, 10) || 0;
    const gradoB = parseInt(b.grado_numero, 10) || 0;
    if (gradoA !== gradoB) return gradoA - gradoB;
    return (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0);
  });

  // Filtrar por asignación
  if (selectedAsignacion.value) {
    list = list.filter(c => String(c.asigna_id) === String(selectedAsignacion.value));
  }

  // Filtrar por estatus
  if (selectedEstatus.value) {
    list = list.filter(c => c.control_estatus === selectedEstatus.value);
  }

  // Filtrar por texto
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(c => {
      const fechaVal = c.control_fecha || '';
      const fechaFormateada = formatearFecha(fechaVal).toLowerCase();
      const fechaOriginal = fechaVal.toLowerCase();
      const clase = (c.clase_tema || '').toLowerCase();
      const profesor = (c.profe_nombre || '').toLowerCase();

      return fechaFormateada.includes(q) ||
             fechaOriginal.includes(q) ||
             clase.includes(q) ||
             profesor.includes(q);
    });
  }

  return list;
});

const getProfesorFoto = (profeId, profeNombre) => {
  const found = profesores.value.find(p => p.id === profeId);
  if (found && found.profe_imagen_url && found.profe_imagen_url.trim() !== '') {
    return found.profe_imagen_url;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profeNombre || 'Profe')}&backgroundColor=4f46e5`;
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const parts = fechaStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return fechaStr;
};

const openEditControlModal = async (control) => {
  try {
    const { data: regControl, error } = await ControlService.getControlConAsignacion(control.control_id);
    if (error) throw error;

    if (regControl) {
      modalGradoId.value = regControl.asignaciones ? regControl.asignaciones.grado_id : null;
      
      const infoClase = control.clase_num ? `Clase #${control.clase_num}: ` : '';
      modalTitle.value = `${infoClase}${control.clase_tema || 'Editar Clase'}`;

      formData.value = {
        id: regControl.id,
        control_fecha: regControl.control_fecha || '',
        profe_id: regControl.profe_id || '',
        control_observ: regControl.control_observ || '',
        control_estatus: regControl.control_estatus || 'Pendiente'
      };

      showModal.value = true;
    }
  } catch (err) {
    notificationStore.addNotification(`Error al obtener datos: ${err.message}`, 'error');
  }
};

const handleSave = async () => {
  const id = formData.value.id;
  if (!id) return;

  const payload = {
    control_fecha: formData.value.control_fecha || null,
    profe_id: formData.value.profe_id ? parseInt(formData.value.profe_id, 10) : null,
    control_observ: formData.value.control_observ || null,
    control_estatus: formData.value.control_estatus
  };

  try {
    const { error } = await ControlService.saveControl(id, payload);
    if (error) throw error;

    // Crear asistencias automáticas si el estatus se cambia a "Vista"
    if (payload.control_estatus === 'Vista') {
      if (modalGradoId.value) {
        const [resAlumnos, resAsistenciasProcesadas] = await Promise.all([
          AlumnoService.getAlumnos(),
          AsistenciaService.getAlumnosProcesados(id)
        ]);

        if (resAlumnos.error) throw resAlumnos.error;
        if (resAsistenciasProcesadas.error) throw resAsistenciasProcesadas.error;

        const alumnosGrado = (resAlumnos.data || []).filter(
          a => a.grado_id !== null && String(a.grado_id) === String(modalGradoId.value)
        );

        const idsProcesados = new Set(
          (resAsistenciasProcesadas.data || []).map(ap => String(ap.alumno_id))
        );

        const alumnosFaltantes = alumnosGrado.filter(
          a => !idsProcesados.has(String(a.id))
        );

        if (alumnosFaltantes.length > 0) {
          const promesasAsist = alumnosFaltantes.map(alumno => {
            const payloadAsist = {
              control_id: parseInt(id, 10),
              alumno_id: parseInt(alumno.id, 10),
              asist_presente: false,       // Por defecto "Ausente"
              asist_evaluacion: null,       // Por defecto "sin evaluación"
              asist_observacion: null
            };
            return AsistenciaService.saveAsistencia(null, payloadAsist);
          });

          const resultados = await Promise.all(promesasAsist);
          const errores = resultados.filter(r => r.error);
          if (errores.length > 0) {
            console.error('Hubo errores al crear las asistencias automáticas:', errores);
            notificationStore.addNotification('Se actualizó el control, pero hubo errores al crear las asistencias automáticas.', 'warning');
          }
        }
      }
    }

    notificationStore.addNotification('Registro de ejecución actualizado correctamente', 'success');
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(`Error al actualizar el registro: ${error.message}`, 'error');
  }
};
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="control" 
      :titulo="dynamicTitle" 
      subtitulo="Control de ejecución de clases."
    >
      <span class="control-counter-badge">
        <span class="counter-dot"></span>
        <span id="control-contador-texto">
          {{ isLoading ? 'Cargando clases...' : (filteredControl.length === totalCountForAsignacion ? `${totalCountForAsignacion} clases` : `${filteredControl.length} de ${totalCountForAsignacion} clases`) }}
        </span>
      </span>
    </HeaderSeccion>

    <!-- Filtros -->
    <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: flex-start;">
      <div style="flex: 1 1 100%; min-width: 140px;">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-control" 
          placeholder="Buscar Fecha, Clase o Profesor..."
        >
      </div>
      <div style="width: 320px; max-width: 100%;">
        <select v-model="selectedAsignacion" class="form-select">
          <option value="">Asignaciones</option>
          <option v-for="asig in asignacionesActivas" :key="asig.asigna_id" :value="asig.asigna_id">
            #{{ asig.asigna_id }} - Prog: {{ asig.programa_tema }} | Grado: {{ asig.grado_numero }}
          </option>
        </select>
      </div>
      <div style="width: 180px;">
        <select v-model="selectedEstatus" class="form-select">
          <option value="">Estatus</option>
          <option v-for="e in estatusUnicos" :key="e" :value="e">
            {{ e }}
          </option>
        </select>
      </div>
    </div>

    <!-- Tabla de Datos -->
    <div class="table-responsive table-control-scroll">
      <table class="data-table" id="tabla-control">
        <thead>
          <tr>
            <th>Estatus</th>    
            <th>Fecha</th>
            <th># Clase</th>
            <th>Clase</th>
            <th style="width: 90px; text-align: center;">Foto</th>
            <th>Profesor</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="7" class="loading">Consultando Ejecución de Clases...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="7" class="error-msg">❌ Error: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="filteredControl.length === 0">
            <td colspan="7" style="text-align: center; padding: 20px;">
              No se encontraron registros de ejecución.
            </td>
          </tr>
          <tr 
            v-else 
            v-for="n in filteredControl" 
            :key="n.control_id" 
            @click="openEditControlModal(n)"
            class="fila-control"
            style="cursor: pointer;"
          >
            <td data-label="Estatus">
              <span 
                class="badge" 
                :style="{
                  backgroundColor: n.control_estatus === 'Pendiente' ? '#ffc107' : n.control_estatus === 'Programada' ? '#198754' : n.control_estatus === 'Vista' ? '#dc3545' : '#6c757d',
                  color: n.control_estatus === 'Pendiente' ? '#000000' : '#ffffff'
                }"
              >
                {{ n.control_estatus || 'Pendiente' }}
              </span>
            </td>    
            <td data-label="Fecha"><strong>{{ formatearFecha(n.control_fecha) || 'Sin fecha' }}</strong></td>
            <td data-label="# Clase"><span class="text-light">{{ n.clase_num ?? '' }}</span></td>
            <td data-label="Clase"><span class="text-light">{{ n.clase_tema ?? '' }}</span></td>
            <td data-label="Foto" style="text-align: center;">
              <img 
                :src="getProfesorFoto(n.profe_id, n.profe_nombre)" 
                :alt="n.profe_nombre || 'Profesor'" 
                class="tabla-avatar"
              >
            </td>
            <td data-label="Profesor"><span class="text-light">{{ n.profe_nombre || 'Sin asignar' }}</span></td>
            <td data-label="Observaciones"><span class="text-light">{{ n.control_observaciones || '' }}</span></td>                            
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Editar Ejecución -->
    <BaseModal 
      :show="showModal" 
      :titulo="modalTitle" 
      @close="showModal = false"
    >
      <form @submit.prevent="handleSave" id="form-control">
        <div class="form-row">
          <label for="control-fecha">Fecha de Clase</label>
          <input id="control-fecha" v-model="formData.control_fecha" type="date" required>
        </div>

        <div class="form-row">
          <label for="control-profe">Profesor (Filtrado por Grado)</label>
          <select id="control-profe" v-model="formData.profe_id">
            <option value="">-- Seleccionar Profesor --</option>
            <option v-for="p in profesoresFiltradosModal" :key="p.id" :value="p.id">
              {{ p.profe_nombre }}
            </option>
            <option v-if="profesoresFiltradosModal.length === 0" disabled value="">
              -- No hay profesores registrados para este grado --
            </option>
          </select>
        </div>

        <div class="form-row">
          <label for="control-observ">Observaciones</label>
          <textarea 
            id="control-observ" 
            v-model="formData.control_observ" 
            rows="3" 
            placeholder="Ingresa observaciones de la clase..."
          ></textarea>
        </div>

        <div class="form-row">
          <label for="control-estatus">Estatus</label>
          <select id="control-estatus" v-model="formData.control_estatus" required>
            <option value="Pendiente">Pendiente</option>
            <option value="Programada">Programada</option>
            <option value="Vista">Vista</option>
          </select>
        </div>
      </form>

      <template #footer>
        <button @click="showModal = false" class="btn-secondary">Cancelar</button>
        <button @click="handleSave" class="btn-primary">Guardar Cambios</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
/* Utiliza los estilos heredados de app.css */
</style>
