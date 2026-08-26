import { renderHeaderSeccion } from '../ui.js';
import { AlumnoService, ProfesorService, ClaseService, ControlService, AsignacionService, ProgramaService, GradoService, PeriodoService, AsistenciaService } from '../services.js';

function formatearFecha(dateValue) {
    if (!dateValue) return 'Sin fecha';
    let fecha;
    if (dateValue instanceof Date) {
        fecha = dateValue;
    } else if (typeof dateValue === 'string') {
        const parts = dateValue.split('T')[0].split('-');
        if (parts.length === 3) {
            fecha = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
            fecha = new Date(dateValue);
        }
    } else {
        fecha = new Date(dateValue);
    }

    if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(fecha);
}

function esFechaValida(fecha) {
    return fecha && !Number.isNaN(new Date(fecha).getTime());
}

function normalizePeriodo(record) {
    return record?.anio_periodo || record?.periodo || record?.periodo_nombre || record?.anio_nombre || 'Sin periodo';
}

function normalizeGrado(record) {
    return record?.grado_numero || record?.grado_nombre || record?.grado || `Grado ${record?.grado_id ?? 'N/A'}`;
}

function parseCalificacion(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = Number(valor);
    if (Number.isFinite(numero)) return numero;
    const texto = String(valor).trim().toLowerCase();
    if (texto === 'excelente') return 95;
    if (texto === 'bueno') return 85;
    if (texto === 'regular' || texto === 'suficiente') return 75;
    if (texto === 'deficiente') return 55;
    return null;
}

function countBy(items, keyFn) {
    return items.reduce((acc, item) => {
        const key = keyFn(item) || 'Sin dato';
        acc.set(key, (acc.get(key) || 0) + 1);
        return acc;
    }, new Map());
}

export async function cargarVistaDashboard() {
    const errorDisplay = document.getElementById('dashboard-error-display');
    if (errorDisplay) errorDisplay.style.display = 'none';

    try {
        const [resPeriodos, resAlumnos, resProfesores, resGrados, resProgramas, resProgramasDisponibles, resAsignacionesDetalles, resClases, resControlesVista, resAsistenciasVista] = await Promise.all([
            PeriodoService.getPeriodos(),
            AlumnoService.getAlumnos(),
            ProfesorService.getProfesores(),
            GradoService.getGrados(),
            ProgramaService.getProgramas(),
            ProgramaService.getProgramasDisponibles(),
            AsignacionService.getAsignacionesDetalles(),
            ClaseService.getClasesWithProgramas(),
            ControlService.getControlesVista(),
            AsistenciaService.getAsistenciasVista()
        ]);

        const errors = [
            { res: resPeriodos, name: 'periodos' },
            { res: resAlumnos, name: 'alumnos' },
            { res: resProfesores, name: 'profesores' },
            { res: resGrados, name: 'grados' },
            { res: resProgramas, name: 'programas' },
            { res: resProgramasDisponibles, name: 'programas disponibles' },
            { res: resAsignacionesDetalles, name: 'asignaciones' },
            { res: resClases, name: 'clases' },
            { res: resControlesVista, name: 'controles vista' },
            { res: resAsistenciasVista, name: 'asistencias vista' }
        ].filter(item => !item.res || item.res.error);

        if (errors.length) {
            console.error('Error al cargar datos del dashboard:', errors.map(e => `${e.name}:${e.res?.error?.message || 'Respuesta vacía'}`).join(', '));
            if (errorDisplay) {
                errorDisplay.style.display = 'block';
                errorDisplay.innerHTML = `
                    <div class="error-msg-container" style="padding: 20px; text-align: center; color: #991b1b; background: rgba(239, 68, 68, 0.08); border-radius: 12px; border: 1px solid #ef4444; margin: 20px;">
                        <h3>❌ Error al cargar datos del dashboard</h3>
                        <p>No se pudo obtener información de la base de datos para: ${errors.map(e => e.name).join(', ')}</p>
                        <p style="font-size: 0.85rem; color: #7f1d1d; margin-top: 5px;">Detalles: ${errors.map(e => e.res?.error?.message || 'Error de conexión').join(' | ')}</p>
                        <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 15px; padding: 8px 16px; border-radius: 8px; cursor: pointer;">Reintentar</button>
                    </div>
                `;
            }
            return;
        }

        const periodos = resPeriodos.data || [];
        const alumnos = resAlumnos.data || [];
        const profesores = resProfesores.data || [];
        const grados = resGrados.data || [];
        const programas = resProgramas.data || [];
        const programasDisponibles = resProgramasDisponibles.data || [];
        const asignacionesDetalles = resAsignacionesDetalles.data || [];
        const clases = resClases.data || [];
        const controlesVista = resControlesVista.data || [];
        const asistenciasVista = resAsistenciasVista.data || [];

        const hoy = new Date();
        const fechaActual = formatearFecha(hoy);
        const periodoVigente = periodos
            .filter(p => esFechaValida(p.anio_inicio) && esFechaValida(p.anio_fin))
            .find(p => new Date(p.anio_inicio) <= hoy && hoy <= new Date(p.anio_fin))
            || periodos[periodos.length - 1]
            || null;
        const periodoNombre = periodoVigente ? periodoVigente.anio_periodo : 'No definido';
        const periodoRango = periodoVigente ? `${formatearFecha(periodoVigente.anio_inicio)} – ${formatearFecha(periodoVigente.anio_fin)}` : 'Sin rango definido';

        const programasPorId = new Map(programas.map(p => [p.id, p]));
        const gradosPorId = new Map(grados.map(g => [g.id, g.grado_numero || g.grado_nombre || `Grado ${g.id}`]));

        const alumnosPorGrado = new Map();
        alumnos.forEach(alumno => {
            if (!alumno) return;
            const grado = gradosPorId.get(alumno.grado_id) || `Grado ${alumno.grado_id ?? 'N/A'}`;
            alumnosPorGrado.set(grado, (alumnosPorGrado.get(grado) || 0) + 1);
        });

        const profesPorGrado = new Map();
        profesores.forEach(profe => {
            if (!profe) return;
            const grado = gradosPorId.get(profe.grado_id) || `Grado ${profe.grado_id ?? 'N/A'}`;
            profesPorGrado.set(grado, (profesPorGrado.get(grado) || 0) + 1);
        });

        const asignadosPorPeriodo = countBy(asignacionesDetalles, item => normalizePeriodo(item));
        const totalAsignacionesCount = asignacionesDetalles.length;
        const activeAsignacionesCount = asignacionesDetalles.filter(item => item && String(item.asigna_estatus || '').toLowerCase() === 'activa').length;
        const pendingAsignacionesCount = asignacionesDetalles.filter(item => item && String(item.asigna_estatus || '').toLowerCase() === 'pendiente').length;
        const finishedAsignacionesCount = asignacionesDetalles.filter(item => item && String(item.asigna_estatus || '').toLowerCase() === 'terminada').length;

        const activePct = totalAsignacionesCount > 0 ? (activeAsignacionesCount / totalAsignacionesCount * 100) : 0;
        const pendingPct = totalAsignacionesCount > 0 ? (pendingAsignacionesCount / totalAsignacionesCount * 100) : 0;
        const finishedPct = totalAsignacionesCount > 0 ? (finishedAsignacionesCount / totalAsignacionesCount * 100) : 0;

        const programasElaborando = programas.filter(p => p && String(p.programa_estatus || '').toLowerCase() === 'elaborando').length;
        const programasCerrados = programas.filter(p => p && String(p.programa_estatus || '').toLowerCase().includes('cerrad')).length;
        const programasTotales = programas.length;
        const programasDisponiblesTotales = programasDisponibles.length;

        const disponiblesIds = new Set(programasDisponibles.map(p => p.id));
        const clasesPorPrograma = new Map();
        clases.forEach(item => {
            if (!item) return;
            const programaId = item.programa_id;
            if (!disponiblesIds.has(programaId)) return;
            const nombre = programasPorId.get(programaId)?.programa_tema || item.programas?.programa_tema || `Programa #${programaId}`;
            clasesPorPrograma.set(nombre, (clasesPorPrograma.get(nombre) || 0) + 1);
        });

        const estadoPorProgramaGrado = new Map();
        controlesVista.forEach(item => {
            if (!item) return;
            const estatus = String(item.control_estatus || item.estatus || '').trim() || 'Pendiente';
            const grado = normalizeGrado(item);
            const programa = programasPorId.get(item.programa_id)?.programa_tema || item.programa_tema || `Programa #${item.programa_id}`;
            if (!disponiblesIds.has(item.programa_id)) return;
            const key = `${programa}|||${grado}`;
            const resumen = estadoPorProgramaGrado.get(key) || { programa, grado, Vista: 0, Programada: 0, Pendiente: 0 };
            if (estatus.toLowerCase() === 'vista') resumen.Vista += 1;
            else if (estatus.toLowerCase() === 'programada') resumen.Programada += 1;
            else if (estatus.toLowerCase() === 'pendiente') resumen.Pendiente += 1;
            else resumen.Pendiente += 1;
            estadoPorProgramaGrado.set(key, resumen);
        });

        const activeAsignaciones = asignacionesDetalles.filter(item => item && String(item.asigna_estatus || '').toLowerCase() === 'activa');
        const activeAsignacionIds = new Set(activeAsignaciones.map(a => a.asigna_id || a.id));
        const activeGrades = new Set(activeAsignaciones.map(a => a.grado_numero));

        const activeGradeProgramKeys = new Set(
            activeAsignaciones.map(a => {
                const gradeName = a.grado_numero;
                const progName = a.programa_tema;
                return `${gradeName}|||${progName}`;
            })
        );

        const asistenciasPeriodo = asistenciasVista.filter(item => {
            if (!item) return false;
            const key = `${item.grado || ''}|||${item.programa || ''}`;
            return activeGradeProgramKeys.has(key);
        });

        const asistenciasPorGrado = new Map();
        asistenciasPeriodo.forEach(item => {
            if (!item) return;
            const grado = normalizeGrado(item);
            asistenciasPorGrado.set(grado, (asistenciasPorGrado.get(grado) || 0) + 1);
        });

        const calificacionesPorAlumno = new Map();
        const calificacionesPorGrado = new Map();
        asistenciasPeriodo.forEach(item => {
            if (!item) return;
            const valor = parseCalificacion(item.calificacion ?? item.nota ?? item.evaluacion ?? item.asist_evaluacion);
            if (valor === null) return;
            const alumno = item.alumno || item.alumno_nombre || 'Sin alumno';
            const grado = normalizeGrado(item);
            const alumnoData = calificacionesPorAlumno.get(alumno) || { total: 0, count: 0 };
            alumnoData.total += valor;
            alumnoData.count += 1;
            calificacionesPorAlumno.set(alumno, alumnoData);

            const gradoData = calificacionesPorGrado.get(grado) || { total: 0, count: 0 };
            gradoData.total += valor;
            gradoData.count += 1;
            calificacionesPorGrado.set(grado, gradoData);
        });

        const promedioAlumnoRows = Array.from(calificacionesPorAlumno.entries())
            .map(([alumno, data]) => ({ alumno, promedio: data.total / data.count }))
            .sort((a, b) => b.promedio - a.promedio)
            .slice(0, 6);

        const promedioGradoRows = Array.from(calificacionesPorGrado.entries())
            .map(([grado, data]) => ({ grado, promedio: data.total / data.count }))
            .sort((a, b) => b.promedio - a.promedio)
            .slice(0, 6);

        const mapaFotosProfesores = new Map();
        profesores.forEach(p => {
            if (p) {
                mapaFotosProfesores.set(p.id, p.profe_imagen_url);
            }
        });

        const clasesVistasPorGrupo = new Map();
        controlesVista
            .filter(item => {
                if (!item || String(item.control_estatus || '').toLowerCase() !== 'vista') return false;
                const asignaId = item.asigna_id;
                return asignaId && activeAsignacionIds.has(asignaId);
            })
            .forEach(item => {
                const key = `${normalizeGrado(item)}|||${item.programa_tema}`;
                clasesVistasPorGrupo.set(key, (clasesVistasPorGrupo.get(key) || 0) + 1);
            });

        const asistenciaPromedioAnios = new Map();
        asistenciasVista.forEach(item => {
            if (!item) return;
            const periodo = normalizePeriodo(item);
            const grado = normalizeGrado(item);
            const key = `${grado}|||${periodo}`;
            const data = asistenciaPromedioAnios.get(key) || { presentes: 0, totales: 0 };
            const isPresente = item.presente === true || 
                               String(item.presente).toLowerCase() === 'true' || 
                               String(item.presente).toLowerCase() === 'presente' ||
                               String(item.presente).toLowerCase() === 'asistió';
            if (isPresente) data.presentes += 1;
            data.totales += 1;
            asistenciaPromedioAnios.set(key, data);
        });

        const periodosUnicosList = Array.from(new Set(asistenciasVista.map(item => normalizePeriodo(item)).filter(Boolean)));
        periodosUnicosList.sort();
        const periodoAnteriorNombre = periodosUnicosList.length > 1 ? periodosUnicosList[periodosUnicosList.length - 2] : null;

        const gradeNormalizerMap = new Map();
        grados.forEach(g => {
            if (g && g.grado_numero) {
                const key = String(g.grado_numero).toLowerCase().trim();
                const standard = g.grado_numero;
                gradeNormalizerMap.set(key, standard);
                if (g.grado_nombre) {
                    gradeNormalizerMap.set(String(g.grado_nombre).toLowerCase().trim(), standard);
                }
            }
        });

        const getStandardGrade = (record) => {
            if (!record) return 'Sin grado';
            const val = record.grado_numero || record.grado_nombre || record.grado || (record.grado_id ? gradosPorId.get(record.grado_id) : '');
            if (!val) return 'Sin grado';
            const standard = gradeNormalizerMap.get(String(val).toLowerCase().trim());
            return standard || val;
        };

        const getGradeIcon = (grado) => {
            const standard = getStandardGrade({ grado });
            const match = grados.find(g => getStandardGrade(g) === standard);
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

        const clasesPorAsignacionActiva = new Map();
        controlesVista
            .filter(item => item && item.asigna_id && activeAsignacionIds.has(item.asigna_id))
            .forEach(item => {
                const key = item.asigna_id;
                clasesPorAsignacionActiva.set(key, (clasesPorAsignacionActiva.get(key) || 0) + 1);
            });

        const proximasClasesRows = [];
        const ultimoClasesVistasRows = [];

        activeAsignaciones.forEach(asig => {
            const asigId = asig.asigna_id || asig.id;
            const controlesDeAsig = controlesVista.filter(c => c && c.asigna_id === asigId);
            
            const proximas = controlesDeAsig
                .filter(c => c && String(c.control_estatus || '').toLowerCase() !== 'vista')
                .sort((a, b) => {
                    if (a.control_fecha && b.control_fecha) {
                        return new Date(a.control_fecha) - new Date(b.control_fecha);
                    }
                    return (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0);
                });

            const vistas = controlesDeAsig
                .filter(c => c && String(c.control_estatus || '').toLowerCase() === 'vista')
                .sort((a, b) => {
                    if (a.control_fecha && b.control_fecha) {
                        return new Date(b.control_fecha) - new Date(a.control_fecha);
                    }
                    return (Number(b.clase_num) || 0) - (Number(a.clase_num) || 0);
                });

            if (proximas.length > 0) {
                const p = proximas[0];
                proximasClasesRows.push({
                    grado: asig.grado_numero || 'N/A',
                    clase_num: p.clase_num,
                    clase: p.clase_tema || 'Sin tema',
                    profesor: p.profe_nombre || 'Sin asignar',
                    profe_id: p.profe_id,
                    estatus: String(p.control_estatus || '').toLowerCase(),
                    fecha: p.control_fecha
                });
            }

            if (vistas.length > 0) {
                const v = vistas[0];
                ultimoClasesVistasRows.push({
                    grado: asig.grado_numero || 'N/A',
                    clase_num: v.clase_num,
                    clase: v.clase_tema || 'Sin tema',
                    profesor: v.profe_nombre || 'Sin asignar',
                    profe_id: v.profe_id,
                    fecha: v.control_fecha
                });
            }
        });

        proximasClasesRows.sort((a, b) => {
            const gA = parseInt(a.grado, 10) || 999;
            const gB = parseInt(b.grado, 10) || 999;
            return gA - gB;
        });

        ultimoClasesVistasRows.sort((a, b) => {
            const gA = parseInt(a.grado, 10) || 999;
            const gB = parseInt(b.grado, 10) || 999;
            return gA - gB;
        });

        const clasesPorProgramaRows = Array.from(clasesPorPrograma.entries())
            .map(([programa, total]) => ({ programa, total }))
            .sort((a, b) => b.total - a.total);

        const estadoPorProgramaGradoRows = Array.from(estadoPorProgramaGrado.values())
            .sort((a, b) => {
                const gA = parseInt(a.grado, 10) || 0;
                const gB = parseInt(b.grado, 10) || 0;
                if (gA !== gB) return gA - gB;
                return a.programa.localeCompare(b.programa);
            });

        const gradosConAsistenciaPresente = new Set(
            asistenciasVista
                .filter(item => {
                    if (!item) return false;
                    const isPresente = item.presente === true || 
                                       String(item.presente).toLowerCase() === 'true' || 
                                       String(item.presente).toLowerCase() === 'presente' ||
                                       String(item.presente).toLowerCase() === 'asistió';
                    return isPresente;
                })
                .map(item => getStandardGrade(item))
        );

        const asistenciaPromedioAniosRows = Array.from(gradosPorId.values())
            .map(gradoName => {
                const standard = getStandardGrade({ grado_numero: gradoName });
                
                const dataActual = asistenciaPromedioAnios.get(`${standard}|||${periodoNombre}`) || { presentes: 0, totales: 0 };
                const pctActual = dataActual.totales > 0 ? Math.round(dataActual.presentes / dataActual.totales * 100) : 0;
                
                let pctAnterior = 0;
                if (periodoAnteriorNombre) {
                    const dataAnterior = asistenciaPromedioAnios.get(`${standard}|||${periodoAnteriorNombre}`) || { presentes: 0, totales: 0 };
                    pctAnterior = dataAnterior.totales > 0 ? Math.round(dataAnterior.presentes / dataAnterior.totales * 100) : 0;
                }

                return {
                    grado: standard,
                    gradoStandard: standard,
                    promedioActual: dataActual.totales > 0 ? `${pctActual}%` : '0%',
                    promedioUltimo: periodoAnteriorNombre ? (asistenciaPromedioAnios.has(`${standard}|||${periodoAnteriorNombre}`) ? `${pctAnterior}%` : '0%') : 'N/A'
                };
            })
            .filter(row => gradosConAsistenciaPresente.has(row.gradoStandard));

        const alumnosPorGradoRows = Array.from(alumnosPorGrado.entries()).map(([grado, total]) => ({ grado, total })).sort((a, b) => b.total - a.total);
        const profesPorGradoRows = Array.from(profesPorGrado.entries()).map(([grado, total]) => ({ grado, total })).sort((a, b) => b.total - a.total);

        document.getElementById('dashboard-periodo-nombre').textContent = periodoNombre;
        document.getElementById('dashboard-periodo-rango').textContent = periodoRango;
        document.getElementById('dashboard-fecha-actual').textContent = fechaActual;

        const tbodyProximas = document.getElementById('table-body-proximas-clases');
        if (tbodyProximas) {
            if (proximasClasesRows.length === 0) {
                tbodyProximas.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay clases programadas o pendientes.</td></tr>';
            } else {
                tbodyProximas.innerHTML = proximasClasesRows.map(row => {
                    const urlImagenBase = row.estatus === 'programada' ? mapaFotosProfesores.get(row.profe_id) : null;
                    const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                        ? urlImagenBase
                        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.estatus === 'programada' ? row.profesor : 'Sin Asignar')}&backgroundColor=cbd5e1`;

                    return `
                    <tr>
                        <td>
                            <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>
                            ${row.grado}
                        </td>
                        <td class="text-bold">${row.clase_num ?? '-'}</td>
                        <td>${row.clase}</td>
                        <td style="width: 40px; text-align: center; padding-right: 0;">
                            <img src="${fotoUrl}" alt="${row.profesor}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.estatus === 'programada' ? row.profesor : 'Sin Asignar')}&backgroundColor=cbd5e1'">
                        </td>
                        <td>${row.estatus === 'programada' ? row.profesor : 'Requiere programarse'}</td>
                        <td>
                            <span class="badge" style="background-color: ${row.estatus === 'programada' ? '#198754' : '#ffc107'}; color: ${row.estatus === 'programada' ? '#ffffff' : '#000000'};">
                                ${row.estatus === 'programada' ? 'Programada' : 'Pendiente'}
                            </span>
                        </td>
                        <td>${row.estatus === 'programada' ? formatearFecha(row.fecha) : 'Pendiente'}</td>
                    </tr>
                    `;
                }).join('');
            }
        }

        const tbodyUltimas = document.getElementById('table-body-ultimas-clases');
        if (tbodyUltimas) {
            if (ultimoClasesVistasRows.length === 0) {
                tbodyUltimas.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No se registran clases vistas aún.</td></tr>';
            } else {
                tbodyUltimas.innerHTML = ultimoClasesVistasRows.map(row => {
                    const urlImagenBase = mapaFotosProfesores.get(row.profe_id);
                    const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                        ? urlImagenBase
                        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.profesor || 'Profe')}&backgroundColor=cbd5e1`;

                    return `
                    <tr>
                        <td>
                            <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>
                            ${row.grado}
                        </td>
                        <td class="text-bold">${row.clase_num ?? '-'}</td>
                        <td>${row.clase}</td>
                        <td style="width: 40px; text-align: center; padding-right: 0;">
                            <img src="${fotoUrl}" alt="${row.profesor}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.profesor || 'Profe')}&backgroundColor=cbd5e1'">
                        </td>
                        <td>${row.profesor}</td>
                        <td>${formatearFecha(row.fecha)}</td>
                    </tr>
                    `;
                }).join('');
            }
        }

        const kpiTotales = document.getElementById('kpi-programas-totales');
        if (kpiTotales) kpiTotales.textContent = programasTotales;

        const kpiDisponibles = document.getElementById('kpi-programas-disponibles');
        if (kpiDisponibles) {
            kpiDisponibles.innerHTML = `<span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: var(--success, #10b981); box-shadow: 0 0 8px var(--success, #10b981);"></span> ${programasDisponiblesTotales}`;
        }

        const kpiElaborando = document.getElementById('kpi-programas-elaborando');
        if (kpiElaborando) {
            kpiElaborando.innerHTML = `<span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: var(--warning, #f59e0b); box-shadow: 0 0 8px var(--warning, #f59e0b);"></span> ${programasElaborando}`;
        }

        const kpiCerrados = document.getElementById('kpi-programas-cerrados');
        if (kpiCerrados) {
            kpiCerrados.innerHTML = `<span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: var(--danger, #ef4444); box-shadow: 0 0 8px var(--danger, #ef4444);"></span> ${programasCerrados}`;
        }

        const kpiAsignaTotales = document.getElementById('kpi-asignaciones-totales');
        if (kpiAsignaTotales) kpiAsignaTotales.textContent = totalAsignacionesCount;

        const asignaStatusBars = document.getElementById('asignaciones-status-bars');
        if (asignaStatusBars) {
            asignaStatusBars.innerHTML = `
                <!-- Activas -->
                <div class="status-bar-row" style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span>Activa</span>
                        <strong>${activeAsignacionesCount} (${activePct.toFixed(0)}%)</strong>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: #22c55e; width: ${activePct}%; height: 100%; border-radius: 4px;"></div>
                    </div>
                </div>
                <!-- Pendientes -->
                <div class="status-bar-row" style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span>Pendiente</span>
                        <strong>${pendingAsignacionesCount} (${pendingPct.toFixed(0)}%)</strong>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: #eab308; width: ${pendingPct}%; height: 100%; border-radius: 4px;"></div>
                    </div>
                </div>
                <!-- Terminadas -->
                <div class="status-bar-row" style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span>Terminada</span>
                        <strong>${finishedAsignacionesCount} (${finishedPct.toFixed(0)}%)</strong>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: #ef4444; width: ${finishedPct}%; height: 100%; border-radius: 4px;"></div>
                    </div>
                </div>
            `;
        }

        const tbodyClasesProg = document.getElementById('table-body-clases-por-programa');
        if (tbodyClasesProg) {
            tbodyClasesProg.innerHTML = clasesPorProgramaRows.map(row => `
                <tr>
                    <td>${row.programa}</td>
                    <td class="text-right">${row.total}</td>
                </tr>
            `).join('');
        }

        const listAsignadosPeriodo = document.getElementById('list-asignados-por-periodo');
        if (listAsignadosPeriodo) {
            listAsignadosPeriodo.innerHTML = Array.from(asignadosPorPeriodo.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([periodo, total]) => `<li><span>${periodo}</span><strong>${total}</strong></li>`)
                .join('');
        }

        const tbodyEstatusGrado = document.getElementById('table-body-estatus-programa-grado');
        if (tbodyEstatusGrado) {
            tbodyEstatusGrado.innerHTML = estadoPorProgramaGradoRows.map(row => `
                <tr>
                    <td>${row.programa}</td>
                    <td class="text-center">
                        <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>
                        ${row.grado}
                    </td>
                    <td class="text-center">${row.Vista}</td>
                    <td class="text-center">${row.Programada}</td>
                    <td class="text-center">${row.Pendiente}</td>
                </tr>
            `).join('');
        }

        const thPeriodoAnterior = document.getElementById('th-periodo-anterior');
        if (thPeriodoAnterior) thPeriodoAnterior.textContent = `Último (${periodoAnteriorNombre || 'N/A'})`;

        const thPeriodoActual = document.getElementById('th-periodo-actual');
        if (thPeriodoActual) thPeriodoActual.textContent = `Actual (${periodoNombre})`;

        const tbodyPromedioGrado = document.getElementById('table-body-promedio-grado-periodo');
        if (tbodyPromedioGrado) {
            tbodyPromedioGrado.innerHTML = asistenciaPromedioAniosRows.map(row => `
                <tr>
                    <td>
                        <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>
                        ${row.grado}
                    </td>
                    <td class="text-center">${row.promedioUltimo}</td>
                    <td class="text-center">${row.promedioActual}</td>
                </tr>
            `).join('');
        }

        const listAlumnosGrado = document.getElementById('list-alumnos-por-grado');
        if (listAlumnosGrado) {
            listAlumnosGrado.innerHTML = alumnosPorGradoRows.map(row => `<li><span><span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>${row.grado}</span><strong>${row.total}</strong></li>`).join('');
        }

        const listProfesGrado = document.getElementById('list-profesores-por-grado');
        if (listProfesGrado) {
            listProfesGrado.innerHTML = profesPorGradoRows.map(row => `<li><span><span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>${row.grado}</span><strong>${row.total}</strong></li>`).join('');
        }

    } catch (err) {
        console.error("Error al cargar la vista del dashboard:", err);
        if (errorDisplay) {
            errorDisplay.style.display = 'block';
            errorDisplay.innerHTML = `
                <div class="error-msg-container" style="padding: 40px; text-align: center; color: #991b1b; background: rgba(239, 68, 68, 0.08); border-radius: 12px; border: 1px solid #ef4444; margin: 20px;">
                    <h3>⚠️ Error al cargar el Dashboard</h3>
                    <p>Ocurrió un error inesperado al procesar los datos de la aplicación.</p>
                    <p style="font-size: 0.85rem; color: #7f1d1d; margin-top: 5px;">Detalles: ${err.message || err}</p>
                    <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 15px; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Actualizar página</button>
                </div>
            `;
        }
    }
}

if (window.layoutReady) {
    cargarVistaDashboard();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaDashboard();
    });
}
