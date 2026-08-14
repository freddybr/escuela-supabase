import { renderHeaderSeccion } from '../ui.js';
import { AlumnoService, ProfesorService, ClaseService, ControlService, AsignacionService, ProgramaService, GradoService, PeriodoService, AsistenciaService } from '../services.js';

function formatearFecha(dateValue) {
    const fecha = new Date(dateValue);
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

export async function cargarVistaDashboard(container) {
    container.innerHTML = '<div class="loading">Cargando dashboard...</div>';

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
            container.innerHTML = `
                <div class="error-msg-container" style="padding: 20px; text-align: center; color: #991b1b; background: rgba(239, 68, 68, 0.08); border-radius: 12px; border: 1px solid #ef4444; margin: 20px;">
                    <h3>❌ Error al cargar datos del dashboard</h3>
                    <p>No se pudo obtener información de la base de datos para: ${errors.map(e => e.name).join(', ')}</p>
                    <p style="font-size: 0.85rem; color: #7f1d1d; margin-top: 5px;">Detalles: ${errors.map(e => e.res?.error?.message || 'Error de conexión').join(' | ')}</p>
                    <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 15px; padding: 8px 16px; border-radius: 8px; cursor: pointer;">Reintentar</button>
                </div>
            `;
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

        // 1. Identificar Asignaciones Activas y construir conjuntos de filtrado por ID
        const activeAsignaciones = asignacionesDetalles.filter(item => item && String(item.asigna_estatus || '').toLowerCase() === 'activa');
        const activeAsignacionIds = new Set(activeAsignaciones.map(a => a.asigna_id || a.id));
        const activeGrades = new Set(activeAsignaciones.map(a => a.grado_numero));

        // Claves activas formateadas como "NombreGrado|||NombrePrograma" para filtrar asistenciasVista
        const activeGradeProgramKeys = new Set(
            activeAsignaciones.map(a => {
                const gradeName = a.grado_numero;
                const progName = a.programa_tema;
                return `${gradeName}|||${progName}`;
            })
        );

        // 2. Filtrar asistencias en base a las claves de Asignaciones Activas (usando solo las vistas)
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

        // 3. Promedios de calificaciones en base a Asignaciones Activas (usando asistenciasPeriodo)
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

        // 4. Mapa de fotos de profesores
        const mapaFotosProfesores = new Map();
        profesores.forEach(p => {
            if (p) {
                mapaFotosProfesores.set(p.id, p.profe_imagen_url);
            }
        });

        // 5. Clases vistas por grupo (Últimas Clases) filtrando por asigna_id de la Asignación Activa
        const clasesVistasPorGrupo = new Map();
        controlesVista
            .filter(item => {
                if (!item || String(item.control_estatus || '').toLowerCase() !== 'vista') return false;
                const asignaId = item.asigna_id;
                return asignaId && activeAsignacionIds.has(asignaId);
            })
            .forEach(item => {
                const grado = normalizeGrado(item);
                const fecha = esFechaValida(item.control_fecha) ? new Date(item.control_fecha).getTime() : 0;
                const actual = clasesVistasPorGrupo.get(grado);
                if (!actual || fecha > actual.fechaValor) {
                    clasesVistasPorGrupo.set(grado, {
                        grado,
                        clase_num: item.clase_num,
                        programa: programasPorId.get(item.programa_id)?.programa_tema || item.programa_tema || `Programa #${item.programa_id}`,
                        clase: item.clase_tema || item.clase || 'Sin clase',
                        profesor: item.profe_nombre || item.profesor || 'Sin profesor',
                        profe_id: item.profe_id,
                        fecha: item.control_fecha,
                        fechaValor: fecha
                    });
                }
            });

        // 6. Próximas clases y grupos pendientes filtrando por asigna_id de la Asignación Activa
        const proximasClasesPorGrupo = new Map();
        const gruposPendientes = new Map();
        controlesVista.forEach(item => {
            if (!item) return;
            const asignaId = item.asigna_id;
            if (!asignaId || !activeAsignacionIds.has(asignaId)) {
                return; // Ignorar si no pertenece a una asignación activa
            }

            const grado = normalizeGrado(item);
            const estatus = String(item.control_estatus || '').toLowerCase() || 'pendiente';
            const fecha = esFechaValida(item.control_fecha) ? new Date(item.control_fecha).getTime() : null;
            const registro = {
                grado,
                clase_num: item.clase_num,
                clase: item.clase_tema || item.clase || 'Sin clase',
                profesor: item.profe_nombre || item.profesor || 'Sin profesor',
                profe_id: item.profe_id,
                fecha: item.control_fecha,
                estatus,
                fechaValor: fecha ?? Infinity
            };
            if (estatus === 'programada') {
                const actual = proximasClasesPorGrupo.get(grado);
                if (!actual || registro.fechaValor < actual.fechaValor) {
                    proximasClasesPorGrupo.set(grado, registro);
                }
            }
            if (estatus === 'pendiente') {
                const actual = gruposPendientes.get(grado);
                if (!actual || registro.fechaValor < actual.fechaValor) {
                    gruposPendientes.set(grado, registro);
                }
            }
        });

        // 7. Calcular métricas de asistencia para Asignaciones Activas
        const asignacionGrades = new Map();
        activeAsignaciones.forEach(item => {
            const grado = item.grado_numero || gradosPorId.get(item.grado_id) || `Grado ${item.grado_id}`;
            asignacionGrades.set(grado, (asignacionGrades.get(grado) || 0) + 1);
        });

        const asistenciaPorGrupoActiva = new Map();
        asistenciasPeriodo.forEach(item => {
            const grado = normalizeGrado(item);
            const presente = item.presente === true || String(item.presente).toLowerCase() === 'true' || String(item.presente).toLowerCase() === 'presente';
            asistenciaPorGrupoActiva.set(grado, {
                presentes: (asistenciaPorGrupoActiva.get(grado)?.presentes || 0) + (presente ? 1 : 0),
                total: (asistenciaPorGrupoActiva.get(grado)?.total || 0) + 1
            });
        });

        const asistenciaPromedioRows = Array.from(asignacionGrades.entries()).map(([grado]) => {
            const alumnosCount = alumnosPorGrado.get(grado) || 0;
            const stats = asistenciaPorGrupoActiva.get(grado) || { presentes: 0, total: 0 };
            const promedio = alumnosCount > 0 ? (stats.presentes / alumnosCount).toFixed(1) : 'N/A';
            return {
                grado,
                promedio,
                totalAlumnos: alumnosCount,
                totalAsistencias: stats.presentes
            };
        });

        const clasesPorProgramaRows = Array.from(clasesPorPrograma.entries())
            .map(([programa, total]) => ({ programa, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);

        const estadoPorProgramaGradoRows = Array.from(estadoPorProgramaGrado.values())
            .sort((a, b) => b.Vista + b.Programada + b.Pendiente - (a.Vista + a.Programada + a.Pendiente))
            .slice(0, 8);

        const asistenciaPorGradoRows = Array.from(asistenciasPorGrado.entries())
            .map(([grado, total]) => ({ grado, total }))
            .sort((a, b) => b.total - a.total);

        const ultimoClasesVistasRows = Array.from(clasesVistasPorGrupo.values())
            .sort((a, b) => b.fechaValor - a.fechaValor);

        const proximasClasesRows = Array.from(activeGrades).map(grado => {
            const pending = gruposPendientes.get(grado);
            const programada = proximasClasesPorGrupo.get(grado);
            return programada ? programada : pending ? pending : null;
        }).filter(Boolean);

        // Obtener el período anterior dinámicamente
        let periodoAnteriorNombre = null;
        if (periodoNombre !== 'No definido') {
            const match = periodoNombre.match(/^(\d{4})-(\d{4})$/);
            if (match) {
                const prevStart = parseInt(match[1]) - 1;
                const prevEnd = parseInt(match[2]) - 1;
                const expectedPrev = `${prevStart}-${prevEnd}`;
                const found = periodos.find(p => p.anio_periodo === expectedPrev);
                if (found) {
                    periodoAnteriorNombre = expectedPrev;
                }
            }
        }
        if (!periodoAnteriorNombre && periodoNombre !== 'No definido') {
            const sortedPeriodos = [...periodos].sort((a, b) => (a.anio_periodo || '').localeCompare(b.anio_periodo || ''));
            const idx = sortedPeriodos.findIndex(p => p.anio_periodo === periodoNombre);
            if (idx > 0) {
                periodoAnteriorNombre = sortedPeriodos[idx - 1].anio_periodo;
            }
        }

        const getPeriodoForFecha = (fechaStr) => {
            if (!fechaStr) return 'No definido';
            const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!match) {
                const date = new Date(fechaStr);
                if (Number.isNaN(date.getTime())) return 'No definido';
                const y = date.getFullYear();
                const m = date.getMonth() + 1;
                if (m >= 8) {
                    return `${y}-${y + 1}`;
                } else {
                    return `${y - 1}-${y}`;
                }
            }
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            if (month >= 8) {
                return `${year}-${year + 1}`;
            } else {
                return `${year - 1}-${year}`;
            }
        };

        // Construir un normalizador de grados utilizando la base de datos
        const gradeNormalizerMap = new Map();
        grados.forEach(g => {
            if (g) {
                const num = g.grado_numero;
                const name = g.grado_nombre;
                
                if (num) {
                    gradeNormalizerMap.set(num.toLowerCase().trim(), num);
                }
                if (name) {
                    gradeNormalizerMap.set(name.toLowerCase().trim(), num);
                    const cleanName = name.replace(/\p{Emoji}\s*/u, '').toLowerCase().trim();
                    gradeNormalizerMap.set(cleanName, num);
                }
            }
        });

        const getStandardGrade = (record) => {
            if (!record) return 'Sin grado';
            const val = record.grado_numero || record.grado_nombre || record.grado || (record.grado_id ? gradosPorId.get(record.grado_id) : '');
            if (!val) return 'Sin grado';
            const standard = gradeNormalizerMap.get(val.toLowerCase().trim());
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

        const gradosConAsistenciaPresente = new Set(
            asistenciasVista
                .filter(item => {
                    if (!item) return false;
                    const isPresente = item.presente === true || 
                                       String(item.presente).toLowerCase() === 'true' || 
                                       String(item.presente).toLowerCase() === 'presente' ||
                                       item.asist_presente === true || 
                                       String(item.asist_presente).toLowerCase() === 'true';
                    return isPresente;
                })
                .map(item => getStandardGrade(item))
                .filter(g => g !== 'Sin grado')
        );

        const asistenciaPromedioAniosRows = Array.from(gradosPorId.values())
            .map(gName => {
                const gradoStandard = getStandardGrade({ grado: gName });

                // Actual (periodoNombre)
                const fechasVistasActual = new Set(
                    controlesVista
                        .filter(c => {
                            if (!c || String(c.control_estatus || '').toLowerCase() !== 'vista') return false;
                            if (getStandardGrade(c) !== gradoStandard) return false;
                            return getPeriodoForFecha(c.control_fecha) === periodoNombre;
                        })
                        .map(c => c.control_fecha)
                        .filter(Boolean)
                );
                const clasesVistasCountActual = fechasVistasActual.size;

                const presentesSumActual = asistenciasVista
                    .filter(item => {
                        if (!item) return false;
                        if (getStandardGrade(item) !== gradoStandard) return false;
                        if (getPeriodoForFecha(item.fecha) !== periodoNombre) return false;
                        const isPresente = item.presente === true || 
                                           String(item.presente).toLowerCase() === 'true' || 
                                           String(item.presente).toLowerCase() === 'presente' ||
                                           item.asist_presente === true || 
                                           String(item.asist_presente).toLowerCase() === 'true';
                        return isPresente;
                    })
                    .length;

                const promedioActual = (clasesVistasCountActual > 0 && presentesSumActual > 0) 
                    ? (presentesSumActual / clasesVistasCountActual).toFixed(1) 
                    : '-';

                // Último (periodoAnteriorNombre)
                let clasesVistasCountUltimo = 0;
                let presentesSumUltimo = 0;
                if (periodoAnteriorNombre) {
                    const fechasVistasUltimo = new Set(
                        controlesVista
                            .filter(c => {
                                if (!c || String(c.control_estatus || '').toLowerCase() !== 'vista') return false;
                                if (getStandardGrade(c) !== gradoStandard) return false;
                                return getPeriodoForFecha(c.control_fecha) === periodoAnteriorNombre;
                            })
                            .map(c => c.control_fecha)
                            .filter(Boolean)
                    );
                    clasesVistasCountUltimo = fechasVistasUltimo.size;

                    presentesSumUltimo = asistenciasVista
                        .filter(item => {
                            if (!item) return false;
                            if (getStandardGrade(item) !== gradoStandard) return false;
                            if (getPeriodoForFecha(item.fecha) !== periodoAnteriorNombre) return false;
                            const isPresente = item.presente === true || 
                                               String(item.presente).toLowerCase() === 'true' || 
                                               String(item.presente).toLowerCase() === 'presente' ||
                                               item.asist_presente === true || 
                                               String(item.asist_presente).toLowerCase() === 'true';
                            return isPresente;
                        })
                        .length;
                }
                
                const promedioUltimo = (clasesVistasCountUltimo > 0 && presentesSumUltimo > 0) 
                    ? (presentesSumUltimo / clasesVistasCountUltimo).toFixed(1) 
                    : '-';

                return {
                    grado: gName,
                    gradoStandard,
                    promedioActual,
                    promedioUltimo
                };
            })
            .filter(row => gradosConAsistenciaPresente.has(row.gradoStandard));

        const alumnosPorGradoRows = Array.from(alumnosPorGrado.entries()).map(([grado, total]) => ({ grado, total })).sort((a, b) => b.total - a.total);
        const profesPorGradoRows = Array.from(profesPorGrado.entries()).map(([grado, total]) => ({ grado, total })).sort((a, b) => b.total - a.total);

        container.innerHTML = `
            ${renderHeaderSeccion('dashboard', 'Panel General', 'Indicadores clave del colegio por categoría: Cartelera, Contenido, Seguimiento y Comunidad.')}

            <div class="dashboard-topbar">
                <div class="topbar-card">
                    <span class="topbar-label">Periodo vigente</span>
                    <strong>${periodoNombre}</strong>
                    <span class="topbar-subtitle">${periodoRango}</span>
                </div>
                <div class="topbar-card highlight-card">
                    <span class="topbar-label">Fecha de referencia</span>
                    <strong>${fechaActual}</strong>
                    <span class="topbar-subtitle">Datos actualizados en tiempo real</span>
                </div>
            </div>

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
                                ${proximasClasesRows.map(row => {
                                    const urlImagenBase = row.estatus === 'programada' ? mapaFotosProfesores.get(row.profe_id) : null;
                                    const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                                        ? urlImagenBase
                                        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.estatus === 'programada' ? row.profesor : 'Sin Asignar')}&backgroundColor=cbd5e1`;

                                    return `
                                    <tr>
                                        <td>${row.grado}</td>
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
                                }).join('')}
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
                                ${ultimoClasesVistasRows.map(row => {
                                    const urlImagenBase = mapaFotosProfesores.get(row.profe_id);
                                    const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                                        ? urlImagenBase
                                        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.profesor || 'Profe')}&backgroundColor=cbd5e1`;

                                    return `
                                    <tr>
                                        <td>${row.grado}</td>
                                        <td class="text-bold">${row.clase_num ?? '-'}</td>
                                        <td>${row.clase}</td>
                                        <td style="width: 40px; text-align: center; padding-right: 0;">
                                            <img src="${fotoUrl}" alt="${row.profesor}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.profesor || 'Profe')}&backgroundColor=cbd5e1'">
                                        </td>
                                        <td>${row.profesor}</td>
                                        <td>${formatearFecha(row.fecha)}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

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
                            <div class="kpi-value">${programasTotales}</div>
                            <p class="kpi-caption">Incluye todos los estados registrados.</p>
                        </div>
                        <div class="kpi-card">
                            <h3>Programas Disponibles</h3>
                            <div class="kpi-value">${programasDisponiblesTotales}</div>
                            <p class="kpi-caption">Contenidos listos para asignar.</p>
                        </div>
                        <div class="kpi-card">
                            <h3>Programas en Elaboración</h3>
                            <div class="kpi-value">${programasElaborando}</div>
                            <p class="kpi-caption">Contenidos en desarrollo.</p>
                        </div>
                        <div class="kpi-card">
                            <h3>Programas Cerrados</h3>
                            <div class="kpi-value">${programasCerrados}</div>
                            <p class="kpi-caption">Programas finalizados o archivados.</p>
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <h4 style="margin: 0; font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Asignaciones</h4>
                    <div class="dashboard-grid">
                        <div class="kpi-card">
                            <h3>Total de Asignaciones</h3>
                            <div class="kpi-value">${totalAsignacionesCount}</div>
                            <p class="kpi-caption">Historial acumulado de asignaciones.</p>
                        </div>
                        <div class="kpi-card" style="grid-column: span 2; min-height: 140px;">
                            <h3>Asignaciones por Estatus</h3>
                            <div class="status-bars-container" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
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
                                ${clasesPorProgramaRows.map(row => `
                                    <tr>
                                        <td>${row.programa}</td>
                                        <td class="text-right">${row.total}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="chart-card">
                    <h3>Programas asignados por período</h3>
                    <ul class="stat-list">
                        ${Array.from(asignadosPorPeriodo.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([periodo, total]) => `<li><span>${periodo}</span><strong>${total}</strong></li>`)
                            .join('')}
                    </ul>
                </div>
            </section>

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
                                    <tr><th>Programa</th><th>Grado</th><th class="text-right">Vista</th><th class="text-right">Programada</th><th class="text-right">Pendiente</th></tr>
                                </thead>
                                <tbody>
                                    ${estadoPorProgramaGradoRows.map(row => `
                                        <tr>
                                            <td>${row.programa}</td>
                                            <td>
                                                <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>
                                                ${row.grado}
                                            </td>
                                            <td class="text-right">${row.Vista}</td>
                                            <td class="text-right">${row.Programada}</td>
                                            <td class="text-right">${row.Pendiente}</td>
                                        </tr>
                                    `).join('')}
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
                                        <th class="text-right">Último (${periodoAnteriorNombre || 'N/A'})</th>
                                        <th class="text-right">Actual (${periodoNombre})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${asistenciaPromedioAniosRows.map(row => `
                                        <tr>
                                            <td>
                                                <span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>
                                                ${row.grado}
                                            </td>
                                            <td class="text-right">${row.promedioUltimo}</td>
                                            <td class="text-right">${row.promedioActual}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            <section class="dashboard-section">
                <h3 class="dashboard-section-title">
                    <svg class="dashboard-section-icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Comunidad
                </h3>
                <div class="charts-grid">
                    <div class="chart-card">
                        <h3>Alumnos por grado</h3>
                        <ul class="stat-list">
                            ${alumnosPorGradoRows.map(row => `<li><span><span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>${row.grado}</span><strong>${row.total}</strong></li>`).join('')}
                        </ul>
                    </div>
                    <div class="chart-card">
                        <h3>Profesores por grado</h3>
                        <ul class="stat-list">
                            ${profesPorGradoRows.map(row => `<li><span><span style="margin-right: 8px; font-size: 1.1rem; vertical-align: middle;">${getGradeIcon(row.grado)}</span>${row.grado}</span><strong>${row.total}</strong></li>`).join('')}
                        </ul>
                    </div>

                </div>
            </section>
        `;
    } catch (err) {
        console.error("Error al cargar la vista del dashboard:", err);
        container.innerHTML = `
            <div class="error-msg-container" style="padding: 40px; text-align: center; color: #991b1b; background: rgba(239, 68, 68, 0.08); border-radius: 12px; border: 1px solid #ef4444; margin: 20px;">
                <h3>⚠️ Error al cargar el Dashboard</h3>
                <p>Ocurrió un error inesperado al procesar los datos de la aplicación.</p>
                <p style="font-size: 0.85rem; color: #7f1d1d; margin-top: 5px;">Detalles: ${err.message || err}</p>
                <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 15px; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Actualizar página</button>
            </div>
        `;
    }
}
