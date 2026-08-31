<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { AsistenciaService, AlumnoService, ControlService, ClaseService, AsignacionService, ProgramaService, GradoService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';
import BaseModal from '@/components/BaseModal.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// Listas globales de datos
const asistenciasVista = ref([]);
const alumnos = ref([]);
const controles = ref([]);
const clases = ref([]);
const asignacionesActivas = ref([]);
const programas = ref([]);
const grados = ref([]);

const isLoading = ref(true);
const errorMsg = ref('');

// Filtros reactivos
const searchQuery = ref('');
const filterAlumno = ref('');
const filterAsignacion = ref('');
const filterProfesor = ref('');
const filterAsistVal = ref('');

// Estado de Modal y Formulario
const showModal = ref(false);
const modalTitle = ref('');
const editandoAsistenciaId = ref(null);

// Variables del Formulario
const formControlId = ref('');
const formAlumnoId = ref('');
const formAlumnoNombre = ref('');
const formPresente = ref(true);
const formEvaluacion = ref('');
const formObservacion = ref('');

// Lookup maps
const mapaClaseNum = ref(new Map());
const mapaFotosAlumnos = ref(new Map());

const loadDatos = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const [resVista, resAlumnos, resControl, resClases, resAsignaciones, resProgramas, resGrados, resRawAsistencias] = await Promise.all([
      AsistenciaService.getAsistenciasVista(),
      AlumnoService.getAlumnos(),
      ControlService.getControles(),
      ClaseService.getClasesTemaYPrograma(),
      AsignacionService.getAsignacionesActivas(),
      ProgramaService.getProgramas(),
      GradoService.getGrados(),
      AsistenciaService.getAsistencias()
    ]);

    if (resVista.error) throw resVista.error;
    if (resAlumnos.error) throw resAlumnos.error;
    if (resControl.error) throw resControl.error;
    if (resClases.error) throw resClases.error;
    if (resAsignaciones.error) throw resAsignaciones.error;
    if (resRawAsistencias.error) throw resRawAsistencias.error;

    // Crear mapa de asistencias crudas
    const rawAsistMap = new Map();
    (resRawAsistencias.data || []).forEach(ra => {
      rawAsistMap.set(String(ra.id), ra);
    });

    asistenciasVista.value = (resVista.data || []).map(a => {
      const raw = rawAsistMap.get(String(a.asistencia_id));
      return {
        ...a,
        control_id: raw ? raw.control_id : null,
        alumno_id: raw ? raw.alumno_id : null
      };
    });
    alumnos.value = resAlumnos.data || [];
    clases.value = resClases.data || [];
    asignacionesActivas.value = resAsignaciones.data || [];
    programas.value = resProgramas.data || [];
    grados.value = resGrados.data || [];

    // Mapear fotos de alumnos
    const fotoMap = new Map();
    alumnos.value.forEach(a => {
      if (a.alumno_nombre) {
        fotoMap.set(a.alumno_nombre.trim().toLowerCase(), a.alumno_imagen_url);
      }
    });
    mapaFotosAlumnos.value = fotoMap;

    // Mapear números de clase
    const progMap = new Map();
    programas.value.forEach(p => {
      progMap.set(p.id, p.programa_tema || `Programa #${p.id}`);
    });

    // Mapear nombres de grados
    const gradoMap = new Map();
    grados.value.forEach(g => {
      gradoMap.set(g.id, g.grado_numero || g.grado_nombre || `Grado #${g.id}`);
    });

    // Mapear programas y grados a las asignaciones activas
    asignacionesActivas.value = (resAsignaciones.data || []).map(asig => ({
      ...asig,
      asigna_id: asig.id,
      prog_nombre: progMap.get(asig.programa_id) || `Prog #${asig.programa_id}`,
      grado_nombre: gradoMap.get(asig.grado_id) || `Grado #${asig.grado_id}`
    }));

    const claseNumMap = new Map();
    clases.value.forEach(c => {
      const progNombre = progMap.get(c.programa_id) || '';
      const claveCompuesta = `${progNombre}_${c.clase_tema || ''}`.trim().toLowerCase();
      claseNumMap.set(claveCompuesta, c.clase_num || '');

      const claveSimple = (c.clase_tema || '').trim().toLowerCase();
      if (!claseNumMap.has(claveSimple)) {
        claseNumMap.set(claveSimple, c.clase_num || '');
      }
    });
    mapaClaseNum.value = claseNumMap;

    // Inicializar controles con el tema de la clase
    const temaMap = new Map();
    clases.value.forEach(c => {
      temaMap.set(c.id, c.clase_tema || 'Clase sin tema');
    });

    controles.value = (resControl.data || [])
      .map(ctrl => ({
        ...ctrl,
        clase_tema: temaMap.get(ctrl.clase_id) || 'Clase sin tema'
      }))
      .sort((a, b) => Number(a.id) - Number(b.id));

  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadDatos();
});

// Ayudante para obtener número de clase
const obtenerClaseNum = (n) => {
  const claveCompuesta = `${n.programa || ''}_${n.clase || ''}`.trim().toLowerCase();
  if (mapaClaseNum.value.has(claveCompuesta)) {
    return mapaClaseNum.value.get(claveCompuesta);
  }
  const claveSimple = (n.clase || '').trim().toLowerCase();
  return mapaClaseNum.value.get(claveSimple) || '';
};

// Ayudante para color de badge de evaluación
const getEvalBg = (evaluacion) => {
  const evalLower = (evaluacion || '').toLowerCase();
  if (evalLower === 'excelente') return '#0d6efd';
  if (evalLower === 'bueno') return '#198754';
  if (evalLower === 'deficiente') return '#dc3545';
  return '#6c757d';
};

const getAlumnoFoto = (alumnoNombre) => {
  const clave = (alumnoNombre || '').trim().toLowerCase();
  const url = mapaFotosAlumnos.value.get(clave);
  if (url && url.trim() !== '') return url;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(alumnoNombre || 'Alumno')}&backgroundColor=0284c7`;
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const parts = fechaStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return fechaStr;
};

// Selectores para filtros en barra superior
const alumnosUnicos = computed(() => {
  const names = asistenciasVista.value.map(a => a.alumno).filter(Boolean);
  return [...new Set(names)].sort();
});
const profesoresUnicos = computed(() => {
  const profNames = asistenciasVista.value.map(a => a.profesor).filter(Boolean);
  return [...new Set(profNames)].sort();
});

// Función auxiliar para filtrar asistencias por las relaciones completas de la asignación seleccionada
const filtrarPorAsignacion = (a, asignaId) => {
  if (!asignaId) return true;
  const selectedAsig = asignacionesActivas.value.find(asig => String(asig.asigna_id) === String(asignaId));
  if (!selectedAsig) return false;

  // 1. Encontrar el control de la asistencia para validar el asigna_id
  const ctrl = controles.value.find(c => String(c.id) === String(a.control_id));
  if (!ctrl) return false;
  const matchAsigna = String(ctrl.asigna_id) === String(selectedAsig.asigna_id);

  // 2. Encontrar el alumno para validar el grado_id
  const alum = alumnos.value.find(al => String(al.id) === String(a.alumno_id));
  const matchGrado = alum && String(alum.grado_id) === String(selectedAsig.grado_id);

  return matchAsigna && matchGrado;
};

// Contador total basado en el filtro de asignación
const totalCountForAsignacion = computed(() => {
  if (!filterAsignacion.value) return asistenciasVista.value.length;
  return asistenciasVista.value.filter(a => filtrarPorAsignacion(a, filterAsignacion.value)).length;
});

// Asistencias filtradas para la tabla principal
const filteredAsistencias = computed(() => {
  let list = [...asistenciasVista.value];

  // Ordenar por fecha y luego ID
  list.sort((a, b) => {
    if (!a.fecha && !b.fecha) return (a.asistencia_id || 0) - (b.asistencia_id || 0);
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    const cmp = new Date(a.fecha) - new Date(b.fecha);
    if (cmp === 0) return (a.asistencia_id || 0) - (b.asistencia_id || 0);
    return cmp;
  });

  // Filtrar por alumno
  if (filterAlumno.value) {
    list = list.filter(a => a.alumno === filterAlumno.value);
  }
  // Filtrar por asignación
  if (filterAsignacion.value) {
    list = list.filter(a => filtrarPorAsignacion(a, filterAsignacion.value));
  }
  // Filtrar por profesor
  if (filterProfesor.value) {
    list = list.filter(a => a.profesor === filterProfesor.value);
  }
  // Filtrar por presencia
  if (filterAsistVal.value) {
    const checkPresent = filterAsistVal.value === 'presente';
    list = list.filter(a => !!a.presente === checkPresent);
  }
  // Filtrar por búsqueda libre
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(a => {
      const f = formatearFecha(a.fecha).toLowerCase();
      const prog = (a.programa || '').toLowerCase();
      const cls = (a.clase || '').toLowerCase();
      const obs = (a.observaciones || '').toLowerCase();
      return f.includes(q) || prog.includes(q) || cls.includes(q) || obs.includes(q);
    });
  }

  return list;
});

const openEditAsistenciaModal = (asist) => {
  editandoAsistenciaId.value = asist.asistencia_id;
  modalTitle.value = `Editar Asistencia #${asist.asistencia_id}`;
  
  formControlId.value = asist.control_id || '';
  formAlumnoId.value = asist.alumno_id || '';
  formAlumnoNombre.value = asist.alumno || '';
  formPresente.value = asist.presente !== undefined ? asist.presente : false;
  formEvaluacion.value = asist.evaluacion || '';
  formObservacion.value = asist.observaciones || '';
  
  showModal.value = true;
};

const handleSave = async () => {
  if (editandoAsistenciaId.value === null) return;

  const payload = {
    asist_presente: formPresente.value,
    asist_evaluacion: formEvaluacion.value || null,
    asist_observacion: formObservacion.value.trim() || null
  };

  if (formControlId.value) payload.control_id = parseInt(formControlId.value, 10);
  if (formAlumnoId.value) payload.alumno_id = parseInt(formAlumnoId.value, 10);

  try {
    const { error } = await AsistenciaService.saveAsistencia(editandoAsistenciaId.value, payload);
    if (error) throw error;

    notificationStore.addNotification('Asistencia actualizada correctamente', 'success');
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(`Error al actualizar asistencia: ${error.message}`, 'error');
  }
};

const handleDelete = async () => {
  if (!editandoAsistenciaId.value) return;
  if (!confirm(`¿Deseas eliminar el registro de asistencia #${editandoAsistenciaId.value}? Esta acción no se puede deshacer.`)) return;

  try {
    const { error } = await AsistenciaService.deleteAsistencia(editandoAsistenciaId.value);
    if (error) throw error;

    notificationStore.addNotification('Asistencia eliminada correctamente', 'success');
    showModal.value = false;
    await loadDatos();
  } catch (error) {
    notificationStore.addNotification(`Error al eliminar asistencia: ${error.message}`, 'error');
  }
};
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="asistencias" 
      titulo="Asistencias" 
      subtitulo="Solo Asignaciones Activas"
    >
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="control-counter-badge">
          <span class="counter-dot"></span>
          <span id="asistencias-contador-texto">
            {{ isLoading ? 'Cargando asistencias...' : (filteredAsistencias.length === totalCountForAsignacion ? `${totalCountForAsignacion} asistencias` : `${filteredAsistencias.length} de ${totalCountForAsignacion} asistencias`) }}
          </span>
        </span>
      </div>
    </HeaderSeccion>

    <!-- Barra de Filtros -->
    <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: flex-start;">
      <div style="flex: 1 1 100%; min-width: 140px;">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-control" 
          placeholder="Buscar por Fecha, Programa, Clase u Observaciones..."
        >
      </div>
      <div style="width: 180px;">
        <select v-model="filterAlumno" class="form-select">
          <option value="">Alumnos</option>
          <option v-for="name in alumnosUnicos" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>
      <div style="width: 320px; max-width: 100%;">
        <select v-model="filterAsignacion" class="form-select">
          <option value="">Asignaciones</option>
          <option v-for="asig in asignacionesActivas" :key="asig.asigna_id" :value="asig.asigna_id">
            Asig #{{ asig.asigna_id }} - Prog #{{ asig.programa_id }}: {{ asig.prog_nombre }} | Grado: {{ asig.grado_nombre }}
          </option>
        </select>
      </div>
      <div style="width: 180px;">
        <select v-model="filterProfesor" class="form-select">
          <option value="">Profesores</option>
          <option v-for="name in profesoresUnicos" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>
      <div style="width: 180px;">
        <select v-model="filterAsistVal" class="form-select">
          <option value="">Asistencia (Todos)</option>
          <option value="presente">Presente</option>
          <option value="ausente">Ausente</option>
        </select>
      </div>
    </div>

    <!-- Tabla de Datos -->
    <div class="table-responsive table-asistencias-scroll">
      <table class="data-table" id="tabla-asistencias">
        <thead>
          <tr>
            <th>Asistencia</th>
            <th>Fecha</th>
            <th style="width: 70px; text-align: center;">Foto</th>
            <th>Alumno</th>
            <th>Profesor</th>
            <th>Programa</th>
            <th style="text-align: center;">Nº Clase</th>
            <th>Clase</th>
            <th>Grado</th>
            <th>Evaluación</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="11" class="loading">Consultando registros de asistencias...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="11" class="error-msg">❌ Error: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="filteredAsistencias.length === 0">
            <td colspan="11" style="text-align: center; padding: 20px;">
              No se encontraron asistencias registradas.
            </td>
          </tr>
          <tr 
            v-else 
            v-for="n in filteredAsistencias" 
            :key="n.asistencia_id" 
            @click="openEditAsistenciaModal(n)"
            class="fila-asistencia"
            style="cursor: pointer;"
          >
            <td data-label="Asistencia">
              <span 
                class="badge" 
                :style="{
                  backgroundColor: n.presente ? '#198754' : '#dc3545',
                  color: '#ffffff'
                }"
              >
                {{ n.presente ? 'Presente' : 'Ausente' }}
              </span>
            </td>
            <td data-label="Fecha"><strong>{{ formatearFecha(n.fecha) || 'Sin fecha' }}</strong></td>
            <td data-label="Foto" style="text-align: center;">
              <img 
                :src="getAlumnoFoto(n.alumno)" 
                :alt="n.alumno || 'Alumno'" 
                class="tabla-avatar"
              >
            </td>
            <td data-label="Alumno" class="text-bold">{{ n.alumno || '-' }}</td>
            <td data-label="Profesor"><span class="text-light">{{ n.profesor || '-' }}</span></td>
            <td data-label="Programa"><span class="text-light">{{ n.programa || '-' }}</span></td>
            <td data-label="Nº Clase" style="text-align: center;"><strong># {{ obtenerClaseNum(n) || '-' }}</strong></td>
            <td data-label="Clase"><span class="text-light">{{ n.clase || '-' }}</span></td>
            <td data-label="Grado" class="text-bold">{{ n.grado || '-' }}</td>
            <td data-label="Evaluación">
              <span 
                class="badge" 
                :style="{
                  backgroundColor: getEvalBg(n.evaluacion),
                  color: '#ffffff'
                }"
              >
                {{ n.evaluacion ?? 'N/A' }}
              </span>
            </td>
            <td data-label="Observaciones"><span class="text-light">{{ n.observaciones ?? '' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal CRUD para Asistencias -->
    <BaseModal 
      :show="showModal" 
      :titulo="modalTitle" 
      @close="showModal = false"
    >
      <form @submit.prevent="handleSave" id="form-asistencia">
        <div style="grid-column: span 2;">
          <div class="form-row">
            <label for="asist-alumno-nombre">Alumno *</label>
            <input 
              type="text" 
              id="asist-alumno-nombre" 
              :value="formAlumnoNombre" 
              class="form-control" 
              disabled
            >
          </div>
          <div class="form-row">
            <label for="asist-presente">Estatus de Asistencia</label>
            <select id="asist-presente" v-model="formPresente">
              <option :value="true">Presente</option>
              <option :value="false">Ausente</option>
            </select>
          </div>
          <div class="form-row">
            <label for="asist-evaluacion">Evaluación</label>
            <select id="asist-evaluacion" v-model="formEvaluacion">
              <option value="">-- Sin Evaluación --</option>
              <option value="Excelente">Excelente</option>
              <option value="Bueno">Bueno</option>
              <option value="Deficiente">Deficiente</option>
            </select>
          </div>
          <div class="form-row">
            <label for="asist-observacion">Observación</label>
            <textarea 
              id="asist-observacion" 
              v-model="formObservacion" 
              rows="3" 
              placeholder="Observaciones sobre la asistencia..."
            ></textarea>
          </div>
        </div>
      </form>

      <template #footer>
        <button @click="showModal = false" class="btn-secondary">Cancelar</button>
        <button 
          v-if="editandoAsistenciaId !== null" 
          @click="handleDelete" 
          class="btn-danger"
        >
          Eliminar
        </button>
        <button 
          @click="handleSave" 
          class="btn-primary"
        >
          Guardar
        </button>
      </template>
    </BaseModal>
  </div>
</template>


