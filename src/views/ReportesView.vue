<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { AlumnoService, GradoService, AsistenciaService, ControlService, AsignacionService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// Listas globales de datos
const grados = ref([]);
const alumnos = ref([]);
const asistencias = ref([]);
const controles = ref([]);
const asignaciones = ref([]);

const isLoading = ref(true);
const errorMsg = ref('');
const showDenied = ref(false);

// Control de Pestañas
const activeTab = ref('alumno'); // 'alumno' | 'grado' | 'avance'

// --- PESTAÑA 1: REPORTE INDIVIDUAL ---
const repAlumnoGradoId = ref('');
const repAlumnoId = ref('');

const alumnosFiltradosGrado = computed(() => {
  if (!repAlumnoGradoId.value) return [];
  return alumnos.value
    .filter(a => String(a.grado_id) === String(repAlumnoGradoId.value))
    .sort((a, b) => (a.alumno_nombre || '').localeCompare(b.alumno_nombre || ''));
});

const selectedAlumnoNombre = computed(() => {
  const found = alumnos.value.find(a => String(a.id) === String(repAlumnoId.value));
  return found ? found.alumno_nombre : '';
});

// Métricas de alumno individual
const alumnoMetrics = computed(() => {
  if (!repAlumnoId.value || !repAlumnoGradoId.value) return null;

  const nombre = selectedAlumnoNombre.value;
  if (!nombre) return null;

  // Filtrar asistencias del alumno
  const asistenciasAlumno = asistencias.value.filter(as => 
    as.alumno && as.alumno.trim().toLowerCase() === nombre.trim().toLowerCase()
  );

  // Obtener grado
  const gradoObj = grados.value.find(g => String(g.id) === String(repAlumnoGradoId.value));
  const gradoNombre = gradoObj ? (gradoObj.grado_nombre || '') : '';
  const gradoNumero = gradoObj ? (gradoObj.grado_numero || '') : '';

  // Programas asignados al grado
  const asignacionesGrado = asignaciones.value.filter(asig => 
    (asig.grado_numero || '').trim().toLowerCase() === gradoNumero.trim().toLowerCase()
  );
  const nombresProg = asignacionesGrado.map(asig => (asig.programa_tema || '').trim().toLowerCase());

  // Clases registradas dictadas (Vista)
  const clasesRegistradas = controles.value.filter(c => 
    (c.grado_numero || '').trim().toLowerCase() === gradoNumero.trim().toLowerCase() &&
    nombresProg.includes((c.programa_tema || '').trim().toLowerCase()) &&
    c.control_estatus === 'Vista'
  ).length;

  // Asistencias presentes
  const presentes = asistenciasAlumno.filter(as => 
    (as.grado || '').trim().toLowerCase() === gradoNombre.trim().toLowerCase() &&
    nombresProg.includes((as.programa || '').trim().toLowerCase()) &&
    as.presente
  ).length;

  const inasistencias = Math.max(0, clasesRegistradas - presentes);
  const rawPct = clasesRegistradas > 0 ? (presentes / clasesRegistradas * 100) : 0;
  const porcentaje = Number.isInteger(rawPct) ? rawPct : Number(rawPct.toFixed(2));

  return {
    porcentaje,
    clasesRegistradas,
    presentes,
    inasistencias,
    detalles: asistenciasAlumno
  };
});

// --- PESTAÑA 2: REPORTE DE GRADO ---
const repGradoId = ref('');

const gradoMetrics = computed(() => {
  if (!repGradoId.value) return null;

  const alumnosGrado = alumnos.value.filter(a => String(a.grado_id) === String(repGradoId.value));
  if (alumnosGrado.length === 0) return { promedio: 0, totalAlumnos: 0, filas: [] };

  const gradoObj = grados.value.find(g => String(g.id) === String(repGradoId.value));
  const gradoNombre = gradoObj ? (gradoObj.grado_nombre || '') : '';
  const gradoNumero = gradoObj ? (gradoObj.grado_numero || '') : '';

  // Programas asignados al grado
  const asignacionesGrado = asignaciones.value.filter(asig => 
    (asig.grado_numero || '').trim().toLowerCase() === gradoNumero.trim().toLowerCase()
  );
  const nombresProg = asignacionesGrado.map(asig => (asig.programa_tema || '').trim().toLowerCase());

  // Clases dictadas
  const clasesRegistradas = controles.value.filter(c => 
    (c.grado_numero || '').trim().toLowerCase() === gradoNumero.trim().toLowerCase() &&
    nombresProg.includes((c.programa_tema || '').trim().toLowerCase()) &&
    c.control_estatus === 'Vista'
  ).length;

  let sumaPorcentajes = 0;
  let alumnosConDatos = 0;

  const filas = alumnosGrado.map(a => {
    const asistenciasAlumno = asistencias.value.filter(as => 
      as.alumno && as.alumno.trim().toLowerCase() === a.alumno_nombre.trim().toLowerCase()
    );

    const presentes = asistenciasAlumno.filter(as => 
      (as.grado || '').trim().toLowerCase() === gradoNombre.trim().toLowerCase() &&
      nombresProg.includes((as.programa || '').trim().toLowerCase()) &&
      as.presente
    ).length;

    const inasistencias = Math.max(0, clasesRegistradas - presentes);
    const rawPct = clasesRegistradas > 0 ? (presentes / clasesRegistradas * 100) : 0;
    const porcentaje = clasesRegistradas > 0 ? (Number.isInteger(rawPct) ? rawPct : Number(rawPct.toFixed(2))) : null;

    if (porcentaje !== null) {
      sumaPorcentajes += porcentaje;
      alumnosConDatos++;
    }

    return {
      id: a.id,
      nombre: a.alumno_nombre,
      email: a.alumno_email || '-',
      totalClases: clasesRegistradas,
      presentes,
      inasistencias,
      porcentaje
    };
  });

  const promedio = alumnosConDatos > 0 ? Math.round(sumaPorcentajes / alumnosConDatos) : 0;

  return {
    promedio,
    totalAlumnos: alumnosGrado.length,
    filas
  };
});

// --- PESTAÑA 3: REPORTE DE AVANCE PROGRAMÁTICO ---
const repAvanceAsignacionId = ref('');

const avanceMetrics = computed(() => {
  if (!repAvanceAsignacionId.value) return null;

  const controlesAsignacion = controles.value.filter(c => 
    String(c.asigna_id) === String(repAvanceAsignacionId.value)
  );

  if (controlesAsignacion.length === 0) return { porcentaje: 0, total: 0, dictadas: 0, filas: [] };

  const total = controlesAsignacion.length;
  const dictadas = controlesAsignacion.filter(c => c.control_estatus === 'Vista').length;
  const porcentaje = total > 0 ? Math.round((dictadas / total) * 100) : 0;

  // Ordenar de menor a mayor clase_num
  const sorted = [...controlesAsignacion].sort((a, b) => 
    (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0)
  );

  return {
    porcentaje,
    total,
    dictadas,
    filas: sorted
  };
});

// Resetear alumno cuando cambia el grado en Pestaña 1
watch(repAlumnoGradoId, () => {
  repAlumnoId.value = '';
});

// --- IMPRESIÓN ---
const printEmissionDate = ref('');
const printReportTitle = ref('');
const printReportFilter = ref('');

const configurarImpresion = (titulo, subtitulo) => {
  printEmissionDate.value = new Date().toLocaleDateString('es-ES');
  printReportTitle.value = titulo;
  printReportFilter.value = subtitulo;
};

const handlePrintAlumno = () => {
  const gradoNombre = grados.value.find(g => String(g.id) === String(repAlumnoGradoId.value))?.grado_nombre || '';
  configurarImpresion('Asistencia Individual de Alumno', `${selectedAlumnoNombre.value} (${gradoNombre})`);
  setTimeout(() => window.print(), 50);
};

const handlePrintGrado = () => {
  const gradoNombre = grados.value.find(g => String(g.id) === String(repGradoId.value))?.grado_nombre || '';
  configurarImpresion('Asistencia General del Grado', gradoNombre);
  setTimeout(() => window.print(), 50);
};

const handlePrintAvance = () => {
  const asig = asignaciones.value.find(a => String(a.asigna_id) === String(repAvanceAsignacionId.value));
  const asigNombre = asig ? `Asig #${asig.asigna_id} - Materia: ${asig.programa_tema} | Grado: ${asig.grado_numero}` : '';
  configurarImpresion('Avance Académico Programático', asigNombre);
  setTimeout(() => window.print(), 50);
};

const loadDatos = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  showDenied.value = false;

  // Comprobar rol de administrador
  if (!authStore.isAdminOrSuper) {
    isLoading.value = false;
    showDenied.value = true;
    return;
  }

  try {
    const [resGrados, resAlumnos, resAsistencias, resControles, resAsignaciones] = await Promise.all([
      GradoService.getGrados(),
      AlumnoService.getAlumnos(),
      AsistenciaService.getAsistenciasVista(),
      ControlService.getControlesVista(),
      AsignacionService.getAsignacionesDetalles()
    ]);

    if (resGrados.error) throw resGrados.error;
    if (resAlumnos.error) throw resAlumnos.error;
    if (resAsistencias.error) throw resAsistencias.error;
    if (resControles.error) throw resControles.error;
    if (resAsignaciones.error) throw resAsignaciones.error;

    grados.value = resGrados.data || [];
    alumnos.value = resAlumnos.data || [];
    asistencias.value = resAsistencias.data || [];
    controles.value = resControles.data || [];
    asignaciones.value = resAsignaciones.data || [];
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

const formatearFechaTab = (fechaStr) => {
  if (!fechaStr) return '';
  const parts = fechaStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return fechaStr;
};

onMounted(() => {
  loadDatos();
});
</script>

<template>
  <div>
    <!-- Contenedor de Acceso Denegado -->
    <div v-if="showDenied" class="reports-error-container" style="padding: 40px; text-align: center; color: #dc3545; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); margin: 20px;">
      <svg style="width: 64px; height: 64px; margin-bottom: 20px; color: #dc3545;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 10px;">Acceso Denegado</h3>
      <p style="color: var(--text-light);">No tienes los permisos necesarios para visualizar el módulo de reportes.</p>
    </div>

    <!-- Cargando spinner -->
    <div v-else-if="isLoading" class="loading">Cargando Módulo de Reportes...</div>

    <!-- Error de Carga -->
    <div v-else-if="errorMsg" class="reports-error-container" style="padding: 40px; text-align: center; color: #dc3545; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); margin: 20px;">
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 10px;">❌ Error al Cargar Reportes</h3>
      <p style="color: var(--text-light); margin-bottom: 15px;">No se pudieron cargar los datos necesarios para este módulo.</p>
      <code style="display: block; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px; font-size: 12px; max-width: 600px; margin: 0 auto 15px; word-break: break-all;">{{ errorMsg }}</code>
      <button @click="loadDatos" class="btn-primary" style="padding: 8px 16px; border-radius: 6px; cursor: pointer;">Reintentar</button>
    </div>

    <!-- Contenedor Principal de Reportes -->
    <div v-else class="reportes-layout">
      <!-- Header de Sección -->
      <HeaderSeccion 
        tipo="reportes" 
        titulo="Módulo de Reportes" 
        subtitulo="Visualice y exporte estadísticas académicas y de asistencias." 
      />

      <!-- Pestañas de Selección de Reporte -->
      <div class="report-tabs">
        <button 
          :class="['report-tab-btn', { active: activeTab === 'alumno' }]" 
          @click="activeTab = 'alumno'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Asistencia Individual
        </button>
        <button 
          :class="['report-tab-btn', { active: activeTab === 'grado' }]" 
          @click="activeTab = 'grado'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Asistencia de Grado
        </button>
        <button 
          :class="['report-tab-btn', { active: activeTab === 'avance' }]" 
          @click="activeTab = 'avance'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Avance Programático (Clases)
        </button>
      </div>

      <!-- CONTENIDOS DE LAS PESTAÑAS -->
      
      <!-- PESTAÑA 1: REPORTE INDIVIDUAL -->
      <div v-if="activeTab === 'alumno'" class="report-tab-content active">
        <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
          <div style="width: 220px;">
            <select v-model="repAlumnoGradoId" class="form-select">
              <option value="">-- Seleccionar Grado --</option>
              <option v-for="g in grados" :key="g.id" :value="g.id">{{ g.grado_nombre }}</option>
            </select>
          </div>
          <div style="width: 280px;">
            <select 
              v-model="repAlumnoId" 
              class="form-select" 
              :disabled="!repAlumnoGradoId || alumnosFiltradosGrado.length === 0"
            >
              <option value="">
                {{ repAlumnoGradoId ? (alumnosFiltradosGrado.length > 0 ? '-- Seleccionar Alumno --' : '-- Sin Alumnos en este Grado --') : '-- Seleccione un Grado primero --' }}
              </option>
              <option v-for="a in alumnosFiltradosGrado" :key="a.id" :value="a.id">
                {{ a.alumno_nombre }} (#{{ a.id }})
              </option>
            </select>
          </div>
          <button 
            v-if="alumnoMetrics" 
            @click="handlePrintAlumno" 
            class="btn-primary" 
            style="margin-left: auto;"
          >
            🖨️ Imprimir / PDF
          </button>
        </div>
        
        <div v-if="alumnoMetrics" class="report-results-scroll">
          <!-- Métricas -->
          <div class="metrics-row">
            <div class="metric-box">
              <h4>Porcentaje de Asistencia</h4>
              <div class="metric-number">{{ alumnoMetrics.porcentaje }}%</div>
              <div class="attendance-progress-container">
                <div class="attendance-progress-bar">
                  <div 
                    class="attendance-progress-fill" 
                    :class="alumnoMetrics.porcentaje >= 90 ? 'attendance-high' : alumnoMetrics.porcentaje >= 80 ? 'attendance-medium' : 'attendance-low'"
                    :style="{ width: `${alumnoMetrics.porcentaje}%` }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="metric-box">
              <h4>Clases Registradas</h4>
              <div class="metric-number">{{ alumnoMetrics.clasesRegistradas }}</div>
            </div>
            <div class="metric-box">
              <h4>Presentes</h4>
              <div class="metric-number" style="color: var(--success);">{{ alumnoMetrics.presentes }}</div>
            </div>
            <div class="metric-box">
              <h4>Faltas (Ausentes)</h4>
              <div class="metric-number" style="color: var(--danger);">{{ alumnoMetrics.inasistencias }}</div>
            </div>
          </div>

          <!-- Tabla de Detalle -->
          <div class="table-responsive table-rep-alumno-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Programa</th>
                  <th>Clase</th>
                  <th>Estatus Asistencia</th>
                  <th>Evaluación</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="as in alumnoMetrics.detalles" :key="as.asistencia_id">
                  <td data-label="Fecha"><strong>{{ formatearFechaTab(as.fecha) }}</strong></td>
                  <td data-label="Programa">{{ as.programa || '-' }}</td>
                  <td data-label="Clase">{{ as.clase || '-' }}</td>
                  <td data-label="Estatus Asistencia">
                    <span 
                      class="badge" 
                      :style="{
                        backgroundColor: as.presente ? '#198754' : '#dc3545',
                        color: '#ffffff'
                      }"
                    >
                      {{ as.presente ? 'Presente' : 'Ausente' }}
                    </span>
                  </td>
                  <td data-label="Evaluación">{{ as.evaluacion || '-' }}</td>
                  <td data-label="Observaciones"><span class="text-light">{{ as.observaciones || '' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-center" style="padding: 40px; color: var(--text-muted);">
          Por favor, seleccione un Grado y un Alumno para generar el reporte de asistencia individual.
        </div>
      </div>

      <!-- PESTAÑA 2: REPORTE DE GRADO -->
      <div v-if="activeTab === 'grado'" class="report-tab-content active">
        <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
          <div style="width: 220px;">
            <select v-model="repGradoId" class="form-select">
              <option value="">-- Seleccionar Grado --</option>
              <option v-for="g in grados" :key="g.id" :value="g.id">{{ g.grado_nombre }}</option>
            </select>
          </div>
          <button 
            v-if="gradoMetrics && gradoMetrics.totalAlumnos > 0" 
            @click="handlePrintGrado" 
            class="btn-primary" 
            style="margin-left: auto;"
          >
            🖨️ Imprimir / PDF
          </button>
        </div>

        <div v-if="gradoMetrics && gradoMetrics.totalAlumnos > 0" class="report-results-scroll">
          <!-- Métricas -->
          <div class="metrics-row">
            <div class="metric-box">
              <h4>Promedio Asistencia del Grado</h4>
              <div class="metric-number">{{ gradoMetrics.promedio }}%</div>
              <div class="attendance-progress-container">
                <div class="attendance-progress-bar">
                  <div 
                    class="attendance-progress-fill" 
                    :class="gradoMetrics.promedio >= 90 ? 'attendance-high' : gradoMetrics.promedio >= 80 ? 'attendance-medium' : 'attendance-low'"
                    :style="{ width: `${gradoMetrics.promedio}%` }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="metric-box">
              <h4>Estudiantes Registrados</h4>
              <div class="metric-number">{{ gradoMetrics.totalAlumnos }}</div>
            </div>
          </div>

          <!-- Tabla -->
          <div class="table-responsive table-rep-grado-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Alumno</th>
                  <th>Correo</th>
                  <th>Clases Evaluadas</th>
                  <th>Asistencias</th>
                  <th>Inasistencias</th>
                  <th>% Asistencia</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in gradoMetrics.filas" :key="f.id">
                  <td data-label="ID"><strong># {{ f.id }}</strong></td>
                  <td data-label="Alumno" class="text-bold">{{ f.nombre }}</td>
                  <td data-label="Correo">{{ f.email }}</td>
                  <td data-label="Clases Evaluadas">{{ f.totalClases }}</td>
                  <td data-label="Asistencias" style="color:#198754; font-weight:700;">{{ f.presentes }}</td>
                  <td data-label="Inasistencias" style="color:#dc3545; font-weight:700;">{{ f.inasistencias }}</td>
                  <td data-label="% Asistencia">
                    <span 
                      class="badge" 
                      :style="{
                        backgroundColor: f.porcentaje === null ? '#6c757d' : (f.porcentaje >= 90 ? '#198754' : f.porcentaje >= 80 ? '#f59e0b' : '#dc3545'),
                        color: '#ffffff'
                      }"
                    >
                      {{ f.porcentaje !== null ? `${f.porcentaje}%` : 'N/A' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-center" style="padding: 40px; color: var(--text-muted);">
          Por favor, seleccione un Grado para generar el reporte de asistencia general.
        </div>
      </div>

      <!-- PESTAÑA 3: REPORTE DE AVANCE PROGRAMÁTICO -->
      <div v-if="activeTab === 'avance'" class="report-tab-content active">
        <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
          <div style="width: 380px;">
            <select v-model="repAvanceAsignacionId" class="form-select">
              <option value="">-- Seleccionar Asignación Escolar --</option>
              <option v-for="asig in asignaciones" :key="asig.asigna_id" :value="asig.asigna_id">
                Asig #{{ asig.asigna_id }} - Materia: {{ asig.programa_tema }} | Grado: {{ asig.grado_numero }}
              </option>
            </select>
          </div>
          <button 
            v-if="avanceMetrics && avanceMetrics.total > 0" 
            @click="handlePrintAvance" 
            class="btn-primary" 
            style="margin-left: auto;"
          >
            🖨️ Imprimir / PDF
          </button>
        </div>

        <div v-if="avanceMetrics && avanceMetrics.total > 0" class="report-results-scroll">
          <!-- Métricas -->
          <div class="metrics-row">
            <div class="metric-box">
              <h4>Tasa de Avance Programático</h4>
              <div class="metric-number">{{ avanceMetrics.porcentaje }}%</div>
              <div class="attendance-progress-container">
                <div class="attendance-progress-bar">
                  <div 
                    class="attendance-progress-fill" 
                    :class="avanceMetrics.porcentaje >= 90 ? 'attendance-high' : avanceMetrics.porcentaje >= 70 ? 'attendance-medium' : 'attendance-low'"
                    :style="{ width: `${avanceMetrics.porcentaje}%` }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="metric-box">
              <h4>Clases Planificadas</h4>
              <div class="metric-number">{{ avanceMetrics.total }}</div>
            </div>
            <div class="metric-box">
              <h4>Clases Dictadas (Vistas)</h4>
              <div class="metric-number" style="color: var(--success);">{{ avanceMetrics.dictadas }}</div>
            </div>
          </div>

          <!-- Tabla -->
          <div class="table-responsive table-rep-avance-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th># Clase</th>
                  <th>Tema de Clase</th>
                  <th>Fecha Ejecución</th>
                  <th>Docente</th>
                  <th>Estatus</th>
                  <th>Observaciones de Clase</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in avanceMetrics.filas" :key="c.control_id">
                  <td data-label="# Clase"><strong># {{ c.clase_num || '' }}</strong></td>
                  <td data-label="Tema de Clase" class="text-bold">{{ c.clase_tema || '-' }}</td>
                  <td data-label="Fecha Ejecución">{{ formatearFechaTab(c.control_fecha) || 'Sin fecha' }}</td>
                  <td data-label="Docente">{{ c.profe_nombre || 'Sin asignar' }}</td>
                  <td data-label="Estatus">
                    <span 
                      class="badge" 
                      :style="{
                        backgroundColor: c.control_estatus === 'Vista' ? '#198754' : c.control_estatus === 'Programada' ? '#0d6efd' : '#f59e0b',
                        color: '#ffffff'
                      }"
                    >
                      {{ c.control_estatus || 'Pendiente' }}
                    </span>
                  </td>
                  <td data-label="Observaciones de Clase"><span class="text-light">{{ c.control_observaciones || '' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-center" style="padding: 40px; color: var(--text-muted);">
          Por favor, seleccione una Asignación para visualizar el avance programático de clases.
        </div>
      </div>

      <!-- CONTENEDORES INVISIBLES EXCLUSIVOS DE IMPRESIÓN A4 -->
      <div class="print-only-header">
        <div class="print-header-main">
          <div class="print-school-info">
            <h2>ESCUELA DIGITAL</h2>
            <p>Reporte Oficial de Rendimiento y Seguimiento Académico</p>
          </div>
          <div class="print-report-meta">
            <p><strong>Fecha Emisión:</strong> <span>{{ printEmissionDate }}</span></p>
            <p><strong>Reporte:</strong> {{ printReportTitle }}<br><strong>Filtro:</strong> {{ printReportFilter }}</p>
          </div>
        </div>
      </div>

      <div class="print-only-footer">
        <div class="signature-grid">
          <div>
            <div class="signature-line">Docente de Grado</div>
          </div>
          <div>
            <div class="signature-line">Coordinador / Dirección</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos locales si es necesario. Hereda clases de impresión de app.css */
</style>
