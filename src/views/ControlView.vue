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
  asigna_id: '',
  control_fecha: '',
  profe_id: '',
  control_observ: '',
  control_estatus: 'Pendiente'
});

// Estado de Modal de Asistencias
const showAsistenciasModal = ref(false);
const asistenciasModalTitle = ref('');
const asistenciasLoading = ref(false);
const isSavingAsistencias = ref(false);
const asistenciasList = ref([]);
const bulkEvaluacion = ref('');
const gradoNombreModal = ref('');

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
    const qClean = q.replace(/\s+/g, '');
    list = list.filter(c => {
      const fechaVal = c.control_fecha || '';
      const fechaFormateada = formatearFecha(fechaVal).toLowerCase();
      const fechaOriginal = fechaVal.toLowerCase();
      const clase = (c.clase_tema || '').toLowerCase();
      const profesor = (c.profe_nombre || '').toLowerCase();

      const num = c.clase_num;
      const numStr = (num !== undefined && num !== null && num !== '') ? String(num).trim().toLowerCase() : '';
      let matchClaseNum = false;
      if (numStr) {
        if (qClean === '#') {
          matchClaseNum = true;
        } else {
          const exactPatterns = [
            numStr,
            `#${numStr}`,
            `n°${numStr}`,
            `nº${numStr}`,
            `clase${numStr}`,
            `clase#${numStr}`
          ];
          if (exactPatterns.includes(qClean)) {
            matchClaseNum = true;
          } else {
            const queryMatch = qClean.match(/^(?:#|n°|nº|clase#?)?0*(\d+)$/);
            const targetMatch = numStr.match(/^0*(\d+)$/);
            if (queryMatch && targetMatch && queryMatch[1] === targetMatch[1]) {
              matchClaseNum = true;
            }
          }
        }
      }

      return fechaFormateada.includes(q) ||
             fechaOriginal.includes(q) ||
             clase.includes(q) ||
             profesor.includes(q) ||
             matchClaseNum;
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
      let gradoId = regControl.asignaciones ? regControl.asignaciones.grado_id : null;
      if (!gradoId && regControl.asigna_id) {
        const asig = asignaciones.value.find(a => String(a.asigna_id || a.id) === String(regControl.asigna_id));
        if (asig && asig.grado_id) {
          gradoId = asig.grado_id;
        } else {
          const { data: asigData } = await AsignacionService.getAsignacion(regControl.asigna_id);
          if (asigData) gradoId = asigData.grado_id;
        }
      }
      modalGradoId.value = gradoId;
      
      const infoClase = control.clase_num ? `Clase #${control.clase_num}: ` : '';
      modalTitle.value = `${infoClase}${control.clase_tema || 'Editar Clase'}`;

      formData.value = {
        id: regControl.id,
        asigna_id: regControl.asigna_id || control.asigna_id || '',
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

const getAlumnoFoto = (alumnoNombre, alumnoImagenUrl) => {
  if (alumnoImagenUrl && alumnoImagenUrl.trim() !== '') {
    return alumnoImagenUrl;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(alumnoNombre || 'Alumno')}&backgroundColor=0284c7`;
};

const openAsistenciasModal = async () => {
  const controlId = formData.value.id;
  if (!controlId) {
    notificationStore.addNotification('No se ha seleccionado una clase válida.', 'error');
    return;
  }

  showAsistenciasModal.value = true;
  asistenciasLoading.value = true;
  asistenciasList.value = [];
  bulkEvaluacion.value = '';

  try {
    let gradoId = modalGradoId.value;
    if (!gradoId && formData.value.asigna_id) {
      const { data: asigData } = await AsignacionService.getAsignacion(formData.value.asigna_id);
      if (asigData) {
        gradoId = asigData.grado_id;
        modalGradoId.value = gradoId;
      }
    }

    if (!gradoId) {
      throw new Error('No se pudo determinar el grado asociado a la asignación de esta clase.');
    }

    const asigFound = asignaciones.value.find(a => String(a.asigna_id || a.id) === String(formData.value.asigna_id));
    gradoNombreModal.value = asigFound?.grado_numero || `Grado #${gradoId}`;
    asistenciasModalTitle.value = `Asistencias - ${modalTitle.value || 'Clase'}`;

    const [resAlumnos, resAsistencias] = await Promise.all([
      AlumnoService.getAlumnosPorGrado(gradoId),
      AsistenciaService.getAsistenciasPorControl(controlId)
    ]);

    if (resAlumnos.error) throw resAlumnos.error;
    if (resAsistencias.error) throw resAsistencias.error;

    const alumnos = resAlumnos.data || [];
    const asistenciasExistentes = resAsistencias.data || [];

    const asistMap = new Map();
    asistenciasExistentes.forEach(a => {
      asistMap.set(String(a.alumno_id), a);
    });

    asistenciasList.value = alumnos.map(al => {
      const existente = asistMap.get(String(al.id));
      const esPresente = existente ? !!existente.asist_presente : false;
      return {
        alumno_id: al.id,
        alumno_nombre: al.alumno_nombre,
        alumno_imagen_url: al.alumno_imagen_url,
        asistencia_id: existente ? existente.id : null,
        // Por defecto "Ausente"
        presente: esPresente,
        // Si es Ausente, ni evaluación ni observaciones deben tener valor
        evaluacion: esPresente ? ((existente && existente.asist_evaluacion) ? existente.asist_evaluacion : 'Bueno') : '',
        observacion: esPresente ? (existente ? (existente.asist_observacion || '') : '') : ''
      };
    });
  } catch (err) {
    console.error('Error al cargar asistencias:', err);
    notificationStore.addNotification(`Error al cargar alumnos/asistencias: ${err.message}`, 'error');
  } finally {
    asistenciasLoading.value = false;
  }
};

const onPresenteChange = (item) => {
  if (!item.presente) {
    // Si es o cambia a Ausente, se eliminan los datos de evaluación y observación
    item.evaluacion = '';
    item.observacion = '';
  } else {
    // Si pasa a Presente y no tiene evaluación, se asigna 'Bueno' por defecto
    if (!item.evaluacion) {
      item.evaluacion = 'Bueno';
    }
  }
};

const togglePresente = (item) => {
  item.presente = !item.presente;
  onPresenteChange(item);
};

const todosPresentes = computed({
  get() {
    return asistenciasList.value.length > 0 && asistenciasList.value.every(a => a.presente);
  },
  set(val) {
    marcarTodos(val);
  }
});

const marcarTodos = (estado) => {
  asistenciasList.value.forEach(a => {
    a.presente = estado;
    if (!estado) {
      a.evaluacion = '';
      a.observacion = '';
    } else {
      if (!a.evaluacion) a.evaluacion = 'Bueno';
    }
  });
};

const aplicarEvaluacionGrupal = () => {
  if (!bulkEvaluacion.value) return;
  // Solo aplicar a los alumnos que estén Presentes
  asistenciasList.value.forEach(a => {
    if (a.presente) {
      a.evaluacion = bulkEvaluacion.value;
    }
  });
};

const conteoPresentes = computed(() => asistenciasList.value.filter(a => a.presente).length);
const conteoAusentes = computed(() => asistenciasList.value.filter(a => !a.presente).length);

const handleSaveAsistencias = async () => {
  const controlId = formData.value.id;
  if (!controlId) return;

  isSavingAsistencias.value = true;
  try {
    const promesas = asistenciasList.value.map(async (item) => {
      const payload = {
        control_id: parseInt(controlId, 10),
        alumno_id: parseInt(item.alumno_id, 10),
        asist_presente: !!item.presente,
        // Si está ausente, guardar null en evaluación y observación para eliminarlos
        asist_evaluacion: item.presente ? (item.evaluacion || 'Bueno') : null,
        asist_observacion: item.presente ? (item.observacion ? item.observacion.trim() : null) : null
      };

      if (item.asistencia_id) {
        return AsistenciaService.saveAsistencia(item.asistencia_id, payload);
      } else {
        const { data: existente } = await AsistenciaService.checkAsistenciaExistente(item.alumno_id, controlId);
        if (existente && existente.id) {
          return AsistenciaService.saveAsistencia(existente.id, payload);
        } else {
          return AsistenciaService.saveAsistencia(null, payload);
        }
      }
    });

    const resultados = await Promise.all(promesas);
    const errores = resultados.filter(r => r && r.error);
    if (errores.length > 0) {
      console.error('Errores al guardar asistencias:', errores);
      notificationStore.addNotification('Se guardaron algunas asistencias pero hubo errores en otras.', 'warning');
    } else {
      notificationStore.addNotification('Asistencias guardadas correctamente', 'success');
      showAsistenciasModal.value = false;
    }
  } catch (err) {
    console.error('Error al guardar asistencias:', err);
    notificationStore.addNotification(`Error al guardar asistencias: ${err.message}`, 'error');
  } finally {
    isSavingAsistencias.value = false;
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
              asist_evaluacion: null,      // Para Ausente no hay evaluación
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
          placeholder="Buscar Fecha, # Clase, Clase o Profesor..."
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
        <button 
          type="button" 
          @click="openAsistenciasModal" 
          class="btn-asistencias-trigger"
          :disabled="formData.control_estatus !== 'Vista'"
          :class="{ 'btn-disabled': formData.control_estatus !== 'Vista' }"
          :title="formData.control_estatus === 'Vista' ? 'Tomar y verificar asistencias de los alumnos de esta clase' : 'El botón se activa únicamente cuando el estatus es Vista'"
        >
          📋 Asistencias
        </button>
        <div style="display: flex; gap: 8px; margin-left: auto;">
          <button type="button" @click="showModal = false" class="btn-secondary">Cancelar</button>
          <button type="button" @click="handleSave" class="btn-primary">Guardar Cambios</button>
        </div>
      </template>
    </BaseModal>

    <!-- Modal Asistencias de la Clase -->
    <BaseModal 
      :show="showAsistenciasModal" 
      :titulo="asistenciasModalTitle" 
      max-width="880px"
      z-index="250"
      @close="showAsistenciasModal = false"
    >
      <div class="asistencias-modal-body">
        <!-- Banner Superior Informativo -->
        <div class="asist-info-banner">
          <div class="asist-info-left">
            <span class="asist-badge-grado">
              {{ gradoNombreModal }}
            </span>
            <span class="asist-subtitle-clase">
              {{ formData.control_fecha ? formatearFecha(formData.control_fecha) : 'Fecha sin definir' }}
            </span>
          </div>
          <div class="asist-stats-chips">
            <span class="chip chip-total">
              <strong>{{ asistenciasList.length }}</strong> Alumnos
            </span>
            <span class="chip chip-presentes">
              <strong>{{ conteoPresentes }}</strong> Presentes
            </span>
            <span class="chip chip-ausentes">
              <strong>{{ conteoAusentes }}</strong> Ausentes
            </span>
          </div>
        </div>

        <!-- Barra de Acciones Grupales -->
        <div class="asist-group-toolbar">
          <div class="group-actions-left">
            <span class="group-label">Asistencia Grupal:</span>
            <button 
              type="button" 
              class="btn-bulk-presentes"
              @click="marcarTodos(true)"
              title="Marcar a todos los alumnos como presentes"
            >
              ✓ Todos Presentes
            </button>
            <button 
              type="button" 
              class="btn-bulk-ausentes"
              @click="marcarTodos(false)"
              title="Marcar a todos los alumnos como ausentes"
            >
              ✕ Todos Ausentes
            </button>
          </div>

          <div class="group-actions-right">
            <label for="bulk-eval-select" class="group-label">Evaluación Grupal:</label>
            <select 
              id="bulk-eval-select" 
              v-model="bulkEvaluacion" 
              @change="aplicarEvaluacionGrupal"
              class="form-select-sm"
            >
              <option value="">-- Aplicar a todos --</option>
              <option value="Excelente">Excelente</option>
              <option value="Bueno">Bueno</option>
              <option value="Deficiente">Deficiente</option>
            </select>
          </div>
        </div>

        <!-- Estado de Carga -->
        <div v-if="asistenciasLoading" class="asist-loading-box">
          <span>Cargando lista de alumnos y asistencias...</span>
        </div>

        <!-- Sin Alumnos -->
        <div v-else-if="asistenciasList.length === 0" class="asist-empty-box">
          <p>No se encontraron alumnos registrados para el grado de esta asignación.</p>
        </div>

        <!-- Tabla de Alumnos para Asistencia -->
        <div v-else class="asist-table-wrapper">
          <table class="asist-custom-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input 
                    type="checkbox" 
                    v-model="todosPresentes" 
                    title="Alternar presencia de todos"
                    class="asist-check-master"
                  >
                </th>
                <th class="col-estado">Asistencia</th>
                <th class="col-foto">Foto</th>
                <th class="col-alumno">Alumno</th>
                <th class="col-eval">Evaluación</th>
                <th class="col-obs">Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in asistenciasList" 
                :key="item.alumno_id"
                :class="{ 'asist-row-presente': item.presente, 'asist-row-ausente': !item.presente }"
              >
                <!-- Checkbox Asistencia Individual -->
                <td class="col-check">
                  <input 
                    type="checkbox" 
                    v-model="item.presente" 
                    @change="onPresenteChange(item)"
                    class="asist-checkbox-row"
                    :id="`check-alumno-${item.alumno_id}`"
                  >
                </td>

                <!-- Badge Presente / Ausente -->
                <td class="col-estado">
                  <span 
                    @click="togglePresente(item)" 
                    class="asist-badge-pill"
                    :class="item.presente ? 'pill-presente' : 'pill-ausente'"
                    title="Click para alternar asistencia"
                  >
                    {{ item.presente ? 'Presente' : 'Ausente' }}
                  </span>
                </td>

                <!-- Foto Alumno -->
                <td class="col-foto">
                  <img 
                    :src="getAlumnoFoto(item.alumno_nombre, item.alumno_imagen_url)" 
                    :alt="item.alumno_nombre" 
                    class="asist-avatar-img"
                  >
                </td>

                <!-- Nombre Alumno -->
                <td class="col-alumno">
                  <label @click="togglePresente(item)" class="asist-nombre-label">
                    {{ item.alumno_nombre }}
                  </label>
                </td>

                <!-- Selector Evaluación Individual -->
                <td class="col-eval">
                  <select 
                    v-model="item.evaluacion" 
                    class="asist-select-eval"
                    :disabled="!item.presente"
                    :class="{ 'asist-disabled-field': !item.presente }"
                  >
                    <option value="">--</option>
                    <option value="Excelente">Excelente</option>
                    <option value="Bueno">Bueno</option>
                    <option value="Deficiente">Deficiente</option>
                  </select>
                </td>

                <!-- Observación Individual -->
                <td class="col-obs">
                  <input 
                    type="text" 
                    v-model="item.observacion" 
                    :placeholder="item.presente ? 'Observaciones...' : '-'" 
                    class="asist-input-obs"
                    :disabled="!item.presente"
                    :class="{ 'asist-disabled-field': !item.presente }"
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <button 
          type="button" 
          @click="showAsistenciasModal = false" 
          class="btn-secondary"
        >
          Cerrar
        </button>
        <button 
          type="button" 
          @click="handleSaveAsistencias" 
          class="btn-primary" 
          :disabled="isSavingAsistencias || asistenciasList.length === 0"
        >
          {{ isSavingAsistencias ? 'Guardando Asistencias...' : 'Guardar Asistencias' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
/* Botón para abrir modal de asistencias */
.btn-asistencias-trigger {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 9px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
}

.btn-asistencias-trigger:not(:disabled):hover {
  background: #0369a1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
}

.btn-asistencias-trigger:disabled,
.btn-asistencias-trigger.btn-disabled {
  background: #94a3b8 !important;
  color: #f8fafc !important;
  cursor: not-allowed !important;
  opacity: 0.65 !important;
  box-shadow: none !important;
  transform: none !important;
}

/* Modal Asistencias */
.asistencias-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.asist-info-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 10px;
}

.asist-info-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asist-badge-grado {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 10px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.85rem;
}

.asist-subtitle-clase {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.asist-stats-chips {
  display: flex;
  gap: 8px;
}

.chip {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.chip-total {
  background: #f1f5f9;
  color: #334155;
}

.chip-presentes {
  background: #dcfce7;
  color: #166534;
}

.chip-ausentes {
  background: #fee2e2;
  color: #991b1b;
}

/* Toolbar de Acciones Grupales */
.asist-group-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 10px 14px;
  border: 1px dashed #cbd5e1;
  border-radius: var(--radius-md);
  flex-wrap: wrap;
  gap: 12px;
}

.group-actions-left,
.group-actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
}

.btn-bulk-presentes {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-bulk-presentes:hover {
  background: #10b981;
  color: #ffffff;
  border-color: #10b981;
}

.btn-bulk-ausentes {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-bulk-ausentes:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
}

.form-select-sm {
  padding: 5px 10px;
  font-size: 0.82rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #1e293b;
  font-weight: 600;
}

/* Tabla Personalizada de Asistencias (Inmune a reglas de data-table) */
.asist-table-wrapper {
  max-height: 440px;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-md);
  background: #ffffff;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
}

.asist-custom-table {
  width: 100%;
  min-width: 660px;
  border-collapse: collapse;
  display: table !important;
  table-layout: fixed;
  font-size: 0.88rem;
  margin: 0;
}

.asist-custom-table thead {
  display: table-header-group !important;
  position: sticky;
  top: 0;
  background: #f8fafc;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.asist-custom-table tbody {
  display: table-row-group !important;
}

.asist-custom-table tr {
  display: table-row !important;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #e2e8f0;
}

.asist-custom-table th,
.asist-custom-table td {
  display: table-cell !important;
  vertical-align: middle !important;
  padding: 8px 10px !important;
  text-align: left;
  border: none !important;
  border-bottom: 1px solid #e2e8f0 !important;
  background: transparent;
  box-sizing: border-box;
}

.asist-custom-table thead th {
  color: #475569;
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #f8fafc !important;
  border-bottom: 2px solid #cbd5e1 !important;
}

/* Anchos exactos de columnas */
.asist-custom-table th.col-check,
.asist-custom-table td.col-check {
  width: 44px !important;
  text-align: center !important;
  padding-left: 10px !important;
  padding-right: 4px !important;
}

.asist-custom-table th.col-estado,
.asist-custom-table td.col-estado {
  width: 105px !important;
  text-align: center !important;
}

.asist-custom-table th.col-foto,
.asist-custom-table td.col-foto {
  width: 48px !important;
  text-align: center !important;
  padding: 4px !important;
}

.asist-custom-table th.col-alumno,
.asist-custom-table td.col-alumno {
  width: auto !important;
  min-width: 170px !important;
}

.asist-custom-table th.col-eval,
.asist-custom-table td.col-eval {
  width: 135px !important;
}

.asist-custom-table th.col-obs,
.asist-custom-table td.col-obs {
  width: 185px !important;
  padding-right: 12px !important;
}

.asist-avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #cbd5e1;
  display: block;
  margin: 0 auto;
}

.asist-nombre-label {
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.88rem;
}

.asist-check-master,
.asist-checkbox-row {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #198754;
  vertical-align: middle;
  margin: 0;
}

.asist-badge-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.74rem;
  letter-spacing: 0.03em;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.pill-presente {
  background-color: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.pill-presente:hover {
  background-color: #bbf7d0;
}

.pill-ausente {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.pill-ausente:hover {
  background-color: #fecaca;
}

.asist-row-presente {
  background-color: #ffffff;
}

.asist-row-presente:hover {
  background-color: #f0fdf4;
}

.asist-row-ausente {
  background-color: #fffbfa;
}

.asist-row-ausente:hover {
  background-color: #fef2f2;
}

.asist-select-eval {
  width: 100%;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
  outline: none;
  cursor: pointer;
}

.asist-select-eval:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}

.asist-input-obs {
  width: 100%;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  font-size: 0.82rem;
  color: #334155;
  box-sizing: border-box;
}

.asist-input-obs:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}

.asist-loading-box,
.asist-empty-box {
  padding: 30px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border-radius: var(--radius-md);
}

.asist-disabled-field {
  background-color: #f8fafc !important;
  color: #94a3b8 !important;
  border-color: #e2e8f0 !important;
  cursor: not-allowed !important;
}
</style>
