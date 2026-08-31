<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { 
  PeriodoService, 
  ProgramaService, 
  ClaseService, 
  AsignacionService, 
  AsistenciaService, 
  ControlService, 
  AlumnoService, 
  ProfesorService, 
  GradoService 
} from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';

const authStore = useAuthStore();

// Listas de datos cargadas de la DB
const periodoVigente = ref(null);
const programas = ref([]);
const clases = ref([]);
const asignacionesDetalles = ref([]);
const asistenciasVista = ref([]);
const controlesVista = ref([]);
const alumnos = ref([]);
const profesores = ref([]);
const grados = ref([]);

const isLoading = ref(true);
const errorMsg = ref('');

// Carga inicial
const loadDatos = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const [
      resPeriodo,
      resProgramas,
      resClases,
      resAsignaciones,
      resAsistencias,
      resControles,
      resAlumnos,
      resProfesores,
      resGrados
    ] = await Promise.all([
      PeriodoService.getPeriodoVigente(),
      ProgramaService.getProgramas(),
      ClaseService.getClases(),
      AsignacionService.getAsignacionesDetalles(),
      AsistenciaService.getAsistenciasVista(),
      ControlService.getControlesVista(),
      AlumnoService.getAlumnos(),
      ProfesorService.getProfesores(),
      GradoService.getGrados()
    ]);

    if (resPeriodo.error) console.warn("No hay período vigente o falló la consulta");
    if (resProgramas.error) throw resProgramas.error;
    if (resClases.error) throw resClases.error;
    if (resAsignaciones.error) throw resAsignaciones.error;
    if (resAsistencias.error) throw resAsistencias.error;
    if (resControles.error) throw resControles.error;
    if (resAlumnos.error) throw resAlumnos.error;
    if (resProfesores.error) throw resProfesores.error;
    if (resGrados.error) throw resGrados.error;

    periodoVigente.value = resPeriodo.data || null;
    programas.value = resProgramas.data || [];
    clases.value = resClases.data || [];
    asignacionesDetalles.value = resAsignaciones.data || [];
    asistenciasVista.value = resAsistencias.data || [];
    controlesVista.value = resControles.data || [];
    alumnos.value = resAlumnos.data || [];
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

// --- LOOKUP MAPS ---
const programasPorId = computed(() => {
  const map = new Map();
  programas.value.forEach(p => {
    if (p && p.id !== undefined) map.set(p.id, p);
  });
  return map;
});

const gradosPorId = computed(() => {
  const map = new Map();
  grados.value.forEach(g => {
    if (g && g.id !== undefined) map.set(g.id, g.grado_numero || g.grado_nombre || `Grado ${g.id}`);
  });
  return map;
});

const mapaFotosProfesores = computed(() => {
  const map = new Map();
  profesores.value.forEach(p => {
    if (p && p.id !== undefined) map.set(p.id, p.profe_imagen_url);
  });
  return map;
});

// --- NORMALIZADORES ---
const normalizeGrado = (record) => {
  if (!record) return 'Sin grado';
  const val = record.grado_numero || record.grado_nombre || record.grado || (record.grado_id ? gradosPorId.value.get(record.grado_id) : '');
  if (!val) return 'Sin grado';
  // Normalizar grado
  const clean = String(val).toLowerCase().trim();
  if (clean.includes('1') || clean.includes('primer')) return '1er Grado';
  if (clean.includes('2') || clean.includes('segund')) return '2do Grado';
  if (clean.includes('3') || clean.includes('tercer')) return '3er Grado';
  if (clean.includes('4') || clean.includes('cuart')) return '4to Grado';
  if (clean.includes('5') || clean.includes('quint')) return '5to Grado';
  if (clean.includes('6') || clean.includes('sext')) return '6to Grado';
  return val;
};

const normalizePeriodo = (record) => {
  if (!record) return 'Sin período';
  return record.anio_periodo || record.periodo_nombre || record.periodo || 'Sin período';
};

const gradeNormalizerMap = computed(() => {
  const map = new Map();
  grados.value.forEach(g => {
    if (g && g.grado_numero) {
      const key = String(g.grado_numero).toLowerCase().trim();
      const standard = g.grado_numero;
      map.set(key, standard);
      if (g.grado_nombre) {
        map.set(String(g.grado_nombre).toLowerCase().trim(), standard);
      }
    }
  });
  return map;
});

const getStandardGrade = (record) => {
  if (!record) return 'Sin grado';
  const val = record.grado_numero || record.grado_nombre || record.grado || (record.grado_id ? gradosPorId.value.get(record.grado_id) : '');
  if (!val) return 'Sin grado';
  const standard = gradeNormalizerMap.value.get(String(val).toLowerCase().trim());
  return standard || val;
};

const getGradeIcon = (gradoName) => {
  const standard = getStandardGrade({ grado_numero: gradoName });
  const match = grados.value.find(g => getStandardGrade(g) === standard);
  if (match && match.grado_nombre) {
    const parts = match.grado_nombre.split(' ');
    if (parts.length > 0) {
      const emoji = parts[0];
      if (emoji.match(/\p{Emoji}/u)) {
        return emoji;
      }
    }
  }
  return '📚';
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const parts = fechaStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return fechaStr;
};

// --- WIDGETS & DATOS TOPBAR ---
const currentPeriodoNombre = computed(() => {
  return periodoVigente.value ? (periodoVigente.value.anio_periodo || periodoVigente.value.periodo_nombre || 'N/A') : 'N/A';
});

const currentPeriodoRango = computed(() => {
  if (!periodoVigente.value) return 'No hay períodos activos';
  const inicio = periodoVigente.value.anio_inicio || periodoVigente.value.periodo_inicio;
  const fin = periodoVigente.value.anio_fin || periodoVigente.value.periodo_fin;
  return `Desde ${formatearFecha(inicio)} hasta ${formatearFecha(fin)}`;
});

const fechaActualFormato = computed(() => {
  return new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});


// --- SECCIÓN 1: CARTELERA ---
const proximasClases = computed(() => {
  const list = [];
  const activeAsig = asignacionesDetalles.value.filter(a => a.asigna_estatus === 'Activa');
  
  activeAsig.forEach(asig => {
    const asigId = asig.asigna_id || asig.id;
    const controlesDeAsig = controlesVista.value.filter(c => c && c.asigna_id === asigId);
    
    // Programadas o Pendientes ordenadas por fecha o número
    const proximas = controlesDeAsig
      .filter(c => c && String(c.control_estatus || '').toLowerCase() !== 'vista')
      .sort((a, b) => {
        if (a.control_fecha && b.control_fecha) {
          return new Date(a.control_fecha) - new Date(b.control_fecha);
        }
        return (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0);
      });

    if (proximas.length > 0) {
      const p = proximas[0];
      list.push({
        grado: asig.grado_numero || 'N/A',
        clase_num: p.clase_num,
        clase: p.clase_tema || 'Sin tema',
        profesor: p.profe_nombre || 'Sin asignar',
        profe_id: p.profe_id,
        estatus: String(p.control_estatus || '').toLowerCase(),
        fecha: p.control_fecha
      });
    }
  });

  return list.sort((a, b) => {
    const gA = parseInt(a.grado, 10) || 999;
    const gB = parseInt(b.grado, 10) || 999;
    return gA - gB;
  });
});

const ultimasClasesVistas = computed(() => {
  const list = [];
  const activeAsig = asignacionesDetalles.value.filter(a => a.asigna_estatus === 'Activa');

  activeAsig.forEach(asig => {
    const asigId = asig.asigna_id || asig.id;
    const controlesDeAsig = controlesVista.value.filter(c => c && c.asigna_id === asigId);

    // Vistas ordenadas por fecha o número
    const vistas = controlesDeAsig
      .filter(c => c && String(c.control_estatus || '').toLowerCase() === 'vista')
      .sort((a, b) => {
        if (a.control_fecha && b.control_fecha) {
          return new Date(b.control_fecha) - new Date(a.control_fecha);
        }
        return (Number(b.clase_num) || 0) - (Number(a.clase_num) || 0);
      });

    if (vistas.length > 0) {
      const v = vistas[0];
      list.push({
        grado: asig.grado_numero || 'N/A',
        clase_num: v.clase_num,
        clase: v.clase_tema || 'Sin tema',
        profesor: v.profe_nombre || 'Sin asignar',
        profe_id: v.profe_id,
        fecha: v.control_fecha
      });
    }
  });

  return list.sort((a, b) => {
    const gA = parseInt(a.grado, 10) || 999;
    const gB = parseInt(b.grado, 10) || 999;
    return gA - gB;
  });
});

const getProfesorFotoUrl = (nombre, id) => {
  const url = id ? mapaFotosProfesores.value.get(id) : null;
  if (url && url.trim() !== '') return url;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nombre || 'Sin Asignar')}&backgroundColor=cbd5e1`;
};


// --- SECCIÓN 2: CONTENIDO ---
const programasTotalesCount = computed(() => programas.value.length);
const programasDisponiblesCount = computed(() => programas.value.filter(p => String(p.programa_estatus).toLowerCase() === 'disponible').length);
const programasElaborandoCount = computed(() => programas.value.filter(p => String(p.programa_estatus).toLowerCase() === 'elaborando').length);
const programasCerradosCount = computed(() => programas.value.filter(p => String(p.programa_estatus).toLowerCase().includes('cerrad')).length);

const asignacionesTotalesCount = computed(() => asignacionesDetalles.value.length);

const asignacionesStats = computed(() => {
  const total = asignacionesDetalles.value.length;
  if (total === 0) return { active: 0, pending: 0, finished: 0, activePct: 0, pendingPct: 0, finishedPct: 0 };
  
  const active = asignacionesDetalles.value.filter(a => String(a.asigna_estatus).toLowerCase() === 'activa').length;
  const pending = asignacionesDetalles.value.filter(a => String(a.asigna_estatus).toLowerCase() === 'pendiente').length;
  const finished = asignacionesDetalles.value.filter(a => String(a.asigna_estatus).toLowerCase().includes('terminad')).length;

  return {
    active,
    pending,
    finished,
    activePct: Math.round((active / total) * 100),
    pendingPct: Math.round((pending / total) * 100),
    finishedPct: Math.round((finished / total) * 100)
  };
});

const clasesPorProgramaList = computed(() => {
  const disponibles = programas.value.filter(p => String(p.programa_estatus).toLowerCase() === 'disponible');
  const disponiblesIds = new Set(disponibles.map(p => p.id));
  const counts = new Map();

  clases.value.forEach(c => {
    if (!c) return;
    const progId = c.programa_id;
    if (!disponiblesIds.has(progId)) return;
    const name = programasPorId.value.get(progId)?.programa_tema || `Programa #${progId}`;
    counts.set(name, (counts.get(name) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([programa, total]) => ({ programa, total }))
    .sort((a, b) => b.total - a.total);
});

const asignadosPorPeriodoList = computed(() => {
  const counts = new Map();
  asignacionesDetalles.value.forEach(item => {
    if (!item) return;
    const p = normalizePeriodo(item);
    counts.set(p, (counts.get(p) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([periodo, total]) => ({ periodo, total }));
});


// --- SECCIÓN 3: SEGUIMIENTO ---
const clasesEstatusProgramaGrado = computed(() => {
  const disponibles = programas.value.filter(p => String(p.programa_estatus).toLowerCase() === 'disponible');
  const disponiblesIds = new Set(disponibles.map(p => p.id));
  const counts = new Map();

  controlesVista.value.forEach(item => {
    if (!item || !disponiblesIds.has(item.programa_id)) return;
    const estatus = String(item.control_estatus || item.estatus || '').trim() || 'Pendiente';
    const grado = normalizeGrado(item);
    const programa = programasPorId.value.get(item.programa_id)?.programa_tema || item.programa_tema || `Programa #${item.programa_id}`;
    
    const key = `${programa}|||${grado}`;
    const resumen = counts.get(key) || { programa, grado, Vista: 0, Programada: 0, Pendiente: 0 };
    
    if (estatus.toLowerCase() === 'vista') resumen.Vista += 1;
    else if (estatus.toLowerCase() === 'programada') resumen.Programada += 1;
    else resumen.Pendiente += 1;
    
    counts.set(key, resumen);
  });

  return Array.from(counts.values())
    .sort((a, b) => {
      const gA = parseInt(a.grado, 10) || 0;
      const gB = parseInt(b.grado, 10) || 0;
      if (gA !== gB) return gA - gB;
      return a.programa.localeCompare(b.programa);
    });
});

const periodosUnicosList = computed(() => {
  const names = asistenciasVista.value.map(item => normalizePeriodo(item)).filter(Boolean);
  return [...new Set(names)].sort();
});

const periodoAnteriorNombre = computed(() => {
  const list = periodosUnicosList.value;
  return list.length > 1 ? list[list.length - 2] : null;
});

const asistenciasPromedioGradoPeriodo = computed(() => {
  const counts = new Map();
  asistenciasVista.value.forEach(item => {
    if (!item) return;
    const periodo = normalizePeriodo(item);
    const grado = normalizeGrado(item);
    const key = `${grado}|||${periodo}`;
    const data = counts.get(key) || { presentes: 0, totales: 0 };
    
    const isPresente = item.presente === true || 
                       String(item.presente).toLowerCase() === 'true' || 
                       String(item.presente).toLowerCase() === 'presente';
    if (isPresente) data.presentes += 1;
    data.totales += 1;
    counts.set(key, data);
  });

  const activeGrades = new Set(
    asistenciasVista.value
      .filter(item => item.presente === true || String(item.presente).toLowerCase() === 'true')
      .map(item => getStandardGrade(item))
  );

  return Array.from(gradosPorId.value.values())
    .map(gradoName => {
      const standard = getStandardGrade({ grado_numero: gradoName });
      
      const dataActual = counts.get(`${standard}|||${currentPeriodoNombre.value}`) || { presentes: 0, totales: 0 };
      const pctActual = dataActual.totales > 0 ? Math.round((dataActual.presentes / dataActual.totales) * 100) : 0;
      
      let pctAnterior = 0;
      if (periodoAnteriorNombre.value) {
        const dataAnterior = counts.get(`${standard}|||${periodoAnteriorNombre.value}`) || { presentes: 0, totales: 0 };
        pctAnterior = dataAnterior.totales > 0 ? Math.round((dataAnterior.presentes / dataAnterior.totales) * 100) : 0;
      }

      return {
        grado: standard,
        gradoStandard: standard,
        promedioActual: dataActual.totales > 0 ? `${pctActual}%` : '0%',
        promedioUltimo: periodoAnteriorNombre.value ? (counts.has(`${standard}|||${periodoAnteriorNombre.value}`) ? `${pctAnterior}%` : '0%') : 'N/A'
      };
    })
    .filter(row => activeGrades.has(row.gradoStandard));
});


// --- SECCIÓN 4: COMUNIDAD ---
const alumnosPorGradoList = computed(() => {
  const counts = new Map();
  alumnos.value.forEach(a => {
    if (!a) return;
    const grado = normalizeGrado(a);
    counts.set(grado, (counts.get(grado) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([grado, total]) => ({ grado, total }))
    .sort((a, b) => b.total - a.total);
});

const profesoresPorGradoList = computed(() => {
  const counts = new Map();
  profesores.value.forEach(p => {
    if (!p) return;
    const grado = normalizeGrado(p);
    counts.set(grado, (counts.get(grado) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([grado, total]) => ({ grado, total }))
    .sort((a, b) => b.total - a.total);
});
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="dashboard" 
      titulo="Panel General" 
      subtitulo="Indicadores clave del colegio por categoría: Cartelera, Contenido, Seguimiento y Comunidad." 
    />

    <!-- Topbar del Dashboard -->
    <div class="dashboard-topbar">
      <div class="topbar-card">
        <span class="topbar-label">Periodo vigente</span>
        <strong id="dashboard-periodo-nombre">{{ isLoading ? 'Cargando...' : currentPeriodoNombre }}</strong>
        <span id="dashboard-periodo-rango" class="topbar-subtitle">{{ isLoading ? 'Cargando fechas...' : currentPeriodoRango }}</span>
      </div>
      <div class="topbar-card highlight-card">
        <span class="topbar-label">Fecha de referencia</span>
        <strong id="dashboard-fecha-actual">{{ isLoading ? 'Cargando...' : fechaActualFormato }}</strong>
        <span class="topbar-subtitle">Datos actualizados en tiempo real</span>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Cargando datos del panel general...</div>
    <div v-else-if="errorMsg" class="error-msg-container" style="padding: 40px; text-align: center; color: #991b1b; background: rgba(239, 68, 68, 0.08); border-radius: 12px; border: 1px solid #ef4444; margin: 20px;">
      <h3>⚠️ Error al cargar el Dashboard</h3>
      <p>Ocurrió un error inesperado al procesar los datos de la aplicación.</p>
      <p style="font-size: 0.85rem; color: #7f1d1d; margin-top: 5px;">Detalles: {{ errorMsg }}</p>
      <button @click="loadDatos" class="btn-primary" style="margin-top: 15px; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Reintentar</button>
    </div>

    <div v-else>
      <!-- SECCIÓN 1: CARTELERA -->
      <section class="dashboard-section">
        <h3 class="dashboard-section-title">
          <svg class="dashboard-section-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Cartelera
        </h3>

        <div class="chart-card">
          <h3>Próxima clase</h3>
          <div class="table-responsive table-cartelera-scroll">
            <table class="small-table">
              <thead>
                <tr><th>Grado</th><th># Clase</th><th>Clase</th><th></th><th>Profesor</th><th>Estatus</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                <tr v-if="proximasClases.length === 0">
                  <td colspan="7" style="text-align: center; padding: 20px;">No hay clases programadas o pendientes.</td>
                </tr>
                <tr v-else v-for="(row, idx) in proximasClases" :key="idx">
                  <td>
                    <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">{{ getGradeIcon(row.grado) }}</span>
                    {{ row.grado }}
                  </td>
                  <td class="text-bold"># {{ row.clase_num ?? '-' }}</td>
                  <td>{{ row.clase }}</td>
                  <td style="width: 40px; text-align: center; padding-right: 0;">
                    <img 
                      :src="getProfesorFotoUrl(row.profesor, row.profe_id)" 
                      :alt="row.profesor" 
                      class="tabla-avatar"
                    >
                  </td>
                  <td>{{ row.estatus === 'programada' ? row.profesor : 'Requiere programarse' }}</td>
                  <td>
                    <span 
                      class="badge" 
                      :style="{
                        backgroundColor: row.estatus === 'programada' ? '#198754' : '#ffc107',
                        color: row.estatus === 'programada' ? '#ffffff' : '#000000'
                      }"
                    >
                      {{ row.estatus === 'programada' ? 'Programada' : 'Pendiente' }}
                    </span>
                  </td>
                  <td>{{ row.estatus === 'programada' ? formatearFecha(row.fecha) : 'Pendiente' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="chart-card" style="margin-top: 16px;">
          <h3>Últimas clases vistas</h3>
          <div class="table-responsive table-cartelera-scroll">
            <table class="small-table">
              <thead>
                <tr><th>Grado</th><th># Clase</th><th>Clase</th><th></th><th>Profesor</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                <tr v-if="ultimasClasesVistas.length === 0">
                  <td colspan="6" style="text-align: center; padding: 20px;">No se registran clases vistas aún.</td>
                </tr>
                <tr v-else v-for="(row, idx) in ultimasClasesVistas" :key="idx">
                  <td>
                    <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">{{ getGradeIcon(row.grado) }}</span>
                    {{ row.grado }}
                  </td>
                  <td class="text-bold"># {{ row.clase_num ?? '-' }}</td>
                  <td>{{ row.clase }}</td>
                  <td style="width: 40px; text-align: center; padding-right: 0;">
                    <img 
                      :src="getProfesorFotoUrl(row.profesor, row.profe_id)" 
                      :alt="row.profesor" 
                      class="tabla-avatar"
                    >
                  </td>
                  <td>{{ row.profesor }}</td>
                  <td>{{ formatearFecha(row.fecha) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- SECCIÓN 2: CONTENIDO -->
      <section class="dashboard-section">
        <h3 class="dashboard-section-title">
          <svg class="dashboard-section-icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Contenido
        </h3>
        
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
          <h4 style="margin: 0; font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Programas</h4>
          <div class="dashboard-grid" style="margin-bottom: 1rem;">
            <div class="kpi-card">
              <h3>Total de Programas</h3>
              <div class="kpi-value">{{ programasTotalesCount }}</div>
              <p class="kpi-caption">Incluye todos los estados registrados.</p>
            </div>
            <div class="kpi-card">
              <h3>Programas Disponibles</h3>
              <div class="kpi-value" style="display: flex; align-items: center; gap: 10px;">
                <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: var(--success, #10b981); box-shadow: 0 0 8px var(--success, #10b981);"></span>
                {{ programasDisponiblesCount }}
              </div>
              <p class="kpi-caption">Contenidos listos para asignar.</p>
            </div>
            <div class="kpi-card">
              <h3>Programas en Elaboración</h3>
              <div class="kpi-value" style="display: flex; align-items: center; gap: 10px;">
                <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: var(--warning, #f59e0b); box-shadow: 0 0 8px var(--warning, #f59e0b);"></span>
                {{ programasElaborandoCount }}
              </div>
              <p class="kpi-caption">Contenidos en desarrollo.</p>
            </div>
            <div class="kpi-card">
              <h3>Programas Cerrados</h3>
              <div class="kpi-value" style="display: flex; align-items: center; gap: 10px;">
                <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: var(--danger, #ef4444); box-shadow: 0 0 8px var(--danger, #ef4444);"></span>
                {{ programasCerradosCount }}
              </div>
              <p class="kpi-caption">Programas finalizados o archivados.</p>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
          <h4 style="margin: 0; font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Asignaciones</h4>
          <div class="dashboard-grid">
            <div class="kpi-card">
              <h3>Total de Asignaciones</h3>
              <div class="kpi-value">{{ asignacionesTotalesCount }}</div>
              <p class="kpi-caption">Historial acumulado de asignaciones.</p>
            </div>
            <div class="kpi-card" style="grid-column: span 2; min-height: 140px;">
              <h3>Asignaciones por Estatus</h3>
              <div class="status-bars-container" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                <!-- Activas -->
                <div class="status-bar-row" style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                    <span>Activa</span>
                    <strong>{{ asignacionesStats.active }} ({{ asignacionesStats.activePct }}%)</strong>
                  </div>
                  <div style="background: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div :style="{ background: '#22c55e', width: `${asignacionesStats.activePct}%` }" style="height: 100%; border-radius: 4px;"></div>
                  </div>
                </div>
                <!-- Pendientes -->
                <div class="status-bar-row" style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                    <span>Pendiente</span>
                    <strong>{{ asignacionesStats.pending }} ({{ asignacionesStats.pendingPct }}%)</strong>
                  </div>
                  <div style="background: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div :style="{ background: '#eab308', width: `${asignacionesStats.pendingPct}%` }" style="height: 100%; border-radius: 4px;"></div>
                  </div>
                </div>
                <!-- Terminadas -->
                <div class="status-bar-row" style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                    <span>Terminada</span>
                    <strong>{{ asignacionesStats.finished }} ({{ asignacionesStats.finishedPct }}%)</strong>
                  </div>
                  <div style="background: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div :style="{ background: '#ef4444', width: `${asignacionesStats.finishedPct}%` }" style="height: 100%; border-radius: 4px;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h3>Clases por Programa Disponible</h3>
          <div class="table-responsive">
            <table class="small-table">
              <thead>
                <tr><th>Programa</th><th class="text-right">Clases</th></tr>
              </thead>
              <tbody>
                <tr v-if="clasesPorProgramaList.length === 0">
                  <td colspan="2" style="text-align: center; padding: 20px;">No se encontraron datos de clases.</td>
                </tr>
                <tr v-else v-for="(row, idx) in clasesPorProgramaList" :key="idx">
                  <td>{{ row.programa }}</td>
                  <td class="text-right">{{ row.total }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="chart-card">
          <h3>Programas asignados por período</h3>
          <ul class="stat-list">
            <li v-for="(item, idx) in asignadosPorPeriodoList" :key="idx">
              <span>{{ item.periodo }}</span>
              <strong>{{ item.total }}</strong>
            </li>
          </ul>
        </div>
      </section>

      <!-- SECCIÓN 3: SEGUIMIENTO -->
      <section class="dashboard-section">
        <h3 class="dashboard-section-title">
          <svg class="dashboard-section-icon" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Seguimiento
        </h3>
        
        <div class="charts-grid" style="margin-top: 16px;">
          <div class="chart-card">
            <h3>Clases por estatus, programa y grado</h3>
            <div class="table-responsive">
              <table class="small-table">
                <thead>
                  <tr><th>Programa</th><th class="text-center">Grado</th><th class="text-center">Vista</th><th class="text-center">Programada</th><th class="text-center">Pendiente</th></tr>
                </thead>
                <tbody>
                  <tr v-if="clasesEstatusProgramaGrado.length === 0">
                    <td colspan="5" style="text-align: center; padding: 20px;">No hay datos de clases por grado y programa.</td>
                  </tr>
                  <tr v-else v-for="(row, idx) in clasesEstatusProgramaGrado" :key="idx">
                    <td>{{ row.programa }}</td>
                    <td class="text-center">
                      <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">{{ getGradeIcon(row.grado) }}</span>
                      {{ row.grado }}
                    </td>
                    <td class="text-center">{{ row.Vista }}</td>
                    <td class="text-center">{{ row.Programada }}</td>
                    <td class="text-center">{{ row.Pendiente }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="chart-card">
            <h3>Asistencias promedio por grado y período</h3>
            <div class="table-responsive">
              <table class="small-table">
                <thead>
                  <tr>
                    <th>Grado</th>
                    <th class="text-center">Último ({{ periodoAnteriorNombre || 'N/A' }})</th>
                    <th class="text-center">Actual ({{ currentPeriodoNombre }})</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="asistenciasPromedioGradoPeriodo.length === 0">
                    <td colspan="3" style="text-align: center; padding: 20px;">No hay datos de asistencias registrados.</td>
                  </tr>
                  <tr v-else v-for="(row, idx) in asistenciasPromedioGradoPeriodo" :key="idx">
                    <td>
                      <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">{{ getGradeIcon(row.grado) }}</span>
                      {{ row.grado }}
                    </td>
                    <td class="text-center">{{ row.promedioUltimo }}</td>
                    <td class="text-center">{{ row.promedioActual }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <!-- SECCIÓN 4: COMUNIDAD -->
      <section class="dashboard-section">
        <h3 class="dashboard-section-title">
          <svg class="dashboard-section-icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Comunidad
        </h3>
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Alumnos por grado</h3>
            <ul class="stat-list">
              <li v-for="(row, idx) in alumnosPorGradoList" :key="idx">
                <span>
                  <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">{{ getGradeIcon(row.grado) }}</span>
                  {{ row.grado }}
                </span>
                <strong>{{ row.total }}</strong>
              </li>
            </ul>
          </div>
          <div class="chart-card">
            <h3>Profesores por grado</h3>
            <ul class="stat-list">
              <li v-for="(row, idx) in profesoresPorGradoList" :key="idx">
                <span>
                  <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">{{ getGradeIcon(row.grado) }}</span>
                  {{ row.grado }}
                </span>
                <strong>{{ row.total }}</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Utiliza los estilos heredados de app.css */
</style>
