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
            { res: resControlesVista, name: 'controles' },
            { res: resAsistenciasVista, name: 'asistencias' }
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
        const asignadosPeriodoActual = asignadosPorPeriodo.get(periodoNombre) || 0;

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

        const periodoActualNombre = periodoNombre;
        const asistenciasPeriodo = asistenciasVista.filter(item => {
            if (!item) return false;
            const periodo = normalizePeriodo(item);
            return periodoActualNombre === periodo;
        });
        const asistenciasPorGrado = new Map();
        asistenciasPeriodo.forEach(item => {
            if (!item) return;
            const grado = normalizeGrado(item);
            asistenciasPorGrado.set(grado, (asistenciasPorGrado.get(grado) || 0) + 1);
        });

        const calificacionesPorAlumno = new Map();
        const calificacionesPorGrado = new Map();
        asistenciasVista.forEach(item => {
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

        const clasesVistasPorGrupo = new Map();
        controlesVista
            .filter(item => item && String(item.control_estatus || '').toLowerCase() === 'vista')
            .forEach(item => {
                const grado = normalizeGrado(item);
                const fecha = esFechaValida(item.control_fecha) ? new Date(item.control_fecha).getTime() : 0;
                const actual = clasesVistasPorGrupo.get(grado);
                if (!actual || fecha > actual.fechaValor) {
                    clasesVistasPorGrupo.set(grado, {
                        grado,
                        programa: programasPorId.get(item.programa_id)?.programa_tema || item.programa_tema || `Programa #${item.programa_id}`,
                        clase: item.clase_tema || item.clase || 'Sin clase',
                        profesor: item.profe_nombre || item.profesor || 'Sin profesor',
                        fecha: item.control_fecha,
                        fechaValor: fecha
                    });
                }
            });

        const proximasClasesPorGrupo = new Map();
        const gruposPendientes = new Map();
        controlesVista.forEach(item => {
            if (!item) return;
            const grado = normalizeGrado(item);
            const estatus = String(item.control_estatus || '').toLowerCase() || 'pendiente';
            const fecha = esFechaValida(item.control_fecha) ? new Date(item.control_fecha).getTime() : null;
            const registro = {
                grado,
                clase: item.clase_tema || item.clase || 'Sin clase',
                profesor: item.profe_nombre || item.profesor || 'Sin profesor',
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

        const activeAsignaciones = asignacionesDetalles.filter(item => item && String(item.asigna_estatus || '').toLowerCase() === 'activa');
        const asignacionGrades = new Map();
        activeAsignaciones.forEach(item => {
            const grado = normalizeGrado(item);
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

        const proximasClasesRows = Array.from(gradosPorId.values()).map(grado => {
            const pending = gruposPendientes.get(grado);
            const programada = proximasClasesPorGrupo.get(grado);
            return programada ? programada : pending ? pending : null;
        }).filter(Boolean);

        const alumnosPorGradoRows = Array.from(alumnosPorGrado.entries()).map(([grado, total]) => ({ grado, total })).sort((a, b) => b.total - a.total);
        const profesPorGradoRows = Array.from(profesPorGrado.entries()).map(([grado, total]) => ({ grado, total })).sort((a, b) => b.total - a.total);

        container.innerHTML = `
            ${renderHeaderSeccion('dashboard', 'Panel General', 'Indicadores clave del colegio por categoría: Contenido, Seguimiento y Comunidad.')}

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
                <h3 class="dashboard-section-title">Contenido</h3>
                <div class="dashboard-grid">
                    <div class="kpi-card">
                        <h3>Total de Programas</h3>
                        <div class="kpi-value">${programasTotales}</div>
                        <p class="kpi-caption">Incluye todos los estados registrados.</p>
                    </div>
                    <div class="kpi-card">
                        <h3>Programas Asignados (${periodoNombre})</h3>
                        <div class="kpi-value">${asignadosPeriodoActual}</div>
                        <p class="kpi-caption">Programas asignados en el periodo vigente.</p>
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
                <h3 class="dashboard-section-title">Seguimiento</h3>
                
                <div class="dashboard-grid">
                    <div class="kpi-card">
                        <h3>Promedio de calificaciones por alumno</h3>
                        <div class="kpi-value">${promedioAlumnoRows.length ? promedioAlumnoRows[0].promedio.toFixed(1) : 'N/A'}</div>
                        <p class="kpi-caption">Mejor promedio entre los últimos registros.</p>
                    </div>
                    <div class="kpi-card">
                        <h3>Promedio de calificaciones por grado</h3>
                        <div class="kpi-value">${promedioGradoRows.length ? promedioGradoRows[0].promedio.toFixed(1) : 'N/A'}</div>
                        <p class="kpi-caption">Mejor grado según calificaciones históricas.</p>
                    </div>
                </div>

                <div class="charts-grid" style="margin-top: 16px;">
                    <div class="chart-card">
                        <h3>Clases por estatus, programa y grado</h3>
                        <div class="table-responsive">
                            <table class="small-table">
                                <thead>
                                    <tr><th>Programa</th><th>Grado</th><th>Vista</th><th>Programada</th><th>Pendiente</th></tr>
                                </thead>
                                <tbody>
                                    ${estadoPorProgramaGradoRows.map(row => `
                                        <tr>
                                            <td>${row.programa}</td>
                                            <td>${row.grado}</td>
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
                        <h3>Asistencias por grado (${periodoNombre})</h3>
                        <div class="table-responsive">
                            <table class="small-table">
                                <thead>
                                    <tr><th>Grado</th><th class="text-right">Asistencias</th></tr>
                                </thead>
                                <tbody>
                                    ${asistenciaPorGradoRows.map(row => `
                                        <tr>
                                            <td>${row.grado}</td>
                                            <td class="text-right">${row.total}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="chart-card" style="margin-top: 16px;">
                    <h3>Últimas clases vistas por grupo</h3>
                    <div class="table-responsive">
                        <table class="small-table">
                            <thead>
                                <tr><th>Grado</th><th>Clase</th><th>Profesor</th><th>Fecha</th></tr>
                            </thead>
                            <tbody>
                                ${ultimoClasesVistasRows.map(row => `
                                    <tr>
                                        <td>${row.grado}</td>
                                        <td>${row.clase}</td>
                                        <td>${row.profesor}</td>
                                        <td>${formatearFecha(row.fecha)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="chart-card" style="margin-top: 16px;">
                    <h3>Próxima clase a ver por grupo</h3>
                    <div class="table-responsive">
                        <table class="small-table">
                            <thead>
                                <tr><th>Grado</th><th>Clase</th><th>Profesor</th><th>Estatus</th><th>Fecha</th></tr>
                            </thead>
                            <tbody>
                                ${proximasClasesRows.map(row => `
                                    <tr>
                                        <td>${row.grado}</td>
                                        <td>${row.clase}</td>
                                        <td>${row.estatus === 'programada' ? row.profesor : 'Requiere programarse'}</td>
                                        <td>${row.estatus === 'programada' ? 'Programada' : 'Pendiente'}</td>
                                        <td>${row.estatus === 'programada' ? formatearFecha(row.fecha) : 'Pendiente'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section class="dashboard-section">
                <h3 class="dashboard-section-title">Comunidad</h3>
                <div class="charts-grid">
                    <div class="chart-card">
                        <h3>Alumnos por grado</h3>
                        <ul class="stat-list">
                            ${alumnosPorGradoRows.map(row => `<li><span>${row.grado}</span><strong>${row.total}</strong></li>`).join('')}
                        </ul>
                    </div>
                    <div class="chart-card">
                        <h3>Profesores por grado</h3>
                        <ul class="stat-list">
                            ${profesPorGradoRows.map(row => `<li><span>${row.grado}</span><strong>${row.total}</strong></li>`).join('')}
                        </ul>
                    </div>
                    <div class="chart-card">
                        <h3>Asistencias promedio por grupo (Activas)</h3>
                        <div class="table-responsive">
                            <table class="small-table">
                                <thead>
                                    <tr><th>Grado</th><th class="text-right">Promedio</th><th class="text-right">Alumnos</th></tr>
                                </thead>
                                <tbody>
                                    ${asistenciaPromedioRows.map(row => `
                                        <tr>
                                            <td>${row.grado}</td>
                                            <td class="text-right">${row.promedio}</td>
                                            <td class="text-right">${row.totalAlumnos}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
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
