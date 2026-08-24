import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { AsistenciaService, AlumnoService, ControlService, ClaseService, AsignacionService, ProgramaService, GradoService } from '../services.js';

let containerElement = null;
let editandoAsistenciaId = null;
let listaAlumnosGlobal = [];
let listaControlGlobal = [];
let listaAsignacionesGlobal = [];
let alumnosAsistenciaEstado = [];

export async function cargarVistaAsistencias(container) {
    containerElement = container;
    container.innerHTML = '<div class="loading">Consultando Registro de Asistencias...</div>';

    // Consulta de datos según el DDL exacto
    const [resVista, resAlumnos, resControl, resClases, resAsignaciones, resProgramas, resGrados] = await Promise.all([
        AsistenciaService.getAsistenciasVista(),
        AlumnoService.getAlumnos(),
        ControlService.getControles(),
        ClaseService.getClasesTemaYPrograma(),
        AsignacionService.getAsignacionesActivas(),
        ProgramaService.getProgramas(),
        GradoService.getGrados()
    ]);

    if (resVista.error) {
        container.innerHTML = `<p class="error-msg">❌ Error: ${resVista.error.message}</p>`;
        return;
    }

    if (resAlumnos.error) {
        container.innerHTML = `<p class="error-msg">❌ Error al cargar alumnos: ${resAlumnos.error.message}</p>`;
        return;
    }

    if (resControl.error) {
        container.innerHTML = `<p class="error-msg">❌ Error al cargar registros de control: ${resControl.error.message}</p>`;
        return;
    }

    if (resClases.error) {
        container.innerHTML = `<p class="error-msg">❌ Error al cargar clases: ${resClases.error.message}</p>`;
        return;
    }

    if (resAsignaciones.error) {
        container.innerHTML = `<p class="error-msg">❌ Error al cargar asignaciones: ${resAsignaciones.error.message}</p>`;
        return;
    }

    // Mapa de Clases para obtener el tema de cada clase
    const mapaClases = new Map();
    (resClases.data || []).forEach(c => {
        mapaClases.set(c.id, c.clase_tema || 'Clase sin tema');
    });

    // Mapear y ORDENAR de menor a mayor por ID (#Control)
    listaControlGlobal = (resControl.data || [])
        .map(ctrl => ({
            ...ctrl,
            clase_tema: mapaClases.get(ctrl.clase_id) || 'Clase sin tema'
        }))
        .sort((a, b) => Number(a.id) - Number(b.id));

    // Mapas para resolver nombres de programas y grados
    const mapaProgramas = new Map();
    (resProgramas.data || []).forEach(p => {
        const nombreProg = p.programa_tema || p.prog_nombre || `Programa #${p.id}`;
        mapaProgramas.set(p.id, nombreProg);
    });

    const mapaGrados = new Map();
    (resGrados.data || []).forEach(g => {
        const nombreGrado = g.grado_nombre || `Grado #${g.id}`;
        mapaGrados.set(g.id, nombreGrado);
    });

    const mapaFotosAlumnos = new Map();
    (resAlumnos.data || []).forEach(a => {
        if (a.alumno_nombre) {
            mapaFotosAlumnos.set(a.alumno_nombre.trim().toLowerCase(), a.alumno_imagen_url);
        }
    });

    const vista_asistencias = resVista.data || [];
    listaAlumnosGlobal = resAlumnos.data || [];

    listaAsignacionesGlobal = (resAsignaciones.data || []).map(asig => ({
        ...asig,
        prog_nombre: mapaProgramas.get(asig.programa_id) || `Programa #${asig.programa_id}`,
        grado_nombre: mapaGrados.get(asig.grado_id) || `Grado #${asig.grado_id}`
    }));

    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return '';
        const parts = fechaStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return fechaStr;
    };

    // Ordenar vista asistencias por fecha y luego ID
    vista_asistencias.sort((a, b) => {
        if (!a.fecha && !b.fecha) return (a.asistencia_id || 0) - (b.asistencia_id || 0);
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;

        const comparacionFecha = new Date(a.fecha) - new Date(b.fecha);
        if (comparacionFecha === 0) {
            return (a.asistencia_id || 0) - (b.asistencia_id || 0);
        }
        return comparacionFecha;
    });

    const opcionesAsignaciones = listaAsignacionesGlobal.map(asig => {
        return `<option value="${asig.id}">#${asig.id} - Prog: ${asig.prog_nombre} | Grado: ${asig.grado_nombre}</option>`;
    }).join('');

    // Filtros
    const alumnosUnicos = [...new Set(vista_asistencias.map(n => n.alumno).filter(Boolean))].sort();
    const programasUnicos = [...new Set(vista_asistencias.map(n => n.programa).filter(Boolean))].sort();
    const gradosUnicos = [...new Set(vista_asistencias.map(n => n.grado).filter(Boolean))].sort();
    const profesoresUnicos = [...new Set(vista_asistencias.map(n => n.profesor).filter(Boolean))].sort();

    let htmlTemplate = `
    ${renderHeaderSeccion('asistencias', 'Asistencias', 'Registro diario de asistencias de alumnos. Solo Asignaciones Activas', `
        <div class="header-action-container" style="display: flex; align-items: center; gap: 12px;">
            <span class="control-counter-badge">
                <span class="counter-dot"></span>
                <span id="asistencias-contador-texto">Cargando asistencias...</span>
            </span>
            <button id="btn-nueva-asistencia" class="btn-header-action" aria-label="Añadir">+</button>
        </div>
    `)}

    <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: flex-start;">
        <div style="flex: 1 1 100%; min-width: 140px;">
            <input type="text" id="filter-search-asist" class="form-control" placeholder="Buscar por Fecha, Programa, Clase u Observaciones...">
        </div>
        <div style="width: 180px;">
            <select id="filter-alumno" class="form-select">
                <option value="">Alumnos</option>
                ${alumnosUnicos.map(alumno => `<option value="${alumno}">${alumno}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-programa-asist" class="form-select">
                <option value="">Programas</option>
                ${programasUnicos.map(prog => `<option value="${prog}">${prog}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-grado-asist" class="form-select">
                <option value="">Grados</option>
                ${gradosUnicos.map(grado => `<option value="${grado}">${grado}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-profesor" class="form-select">
                <option value="">Profesores</option>
                ${profesoresUnicos.map(profesor => `<option value="${profesor}">${profesor}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-asistencia" class="form-select">
                <option value="">Asistencia (Todos)</option>
                <option value="presente">Presente</option>
                <option value="ausente">Ausente</option>
            </select>
        </div>
    </div>

    <div class="table-responsive table-asistencias-scroll">
        <table class="data-table" id="tabla-asistencias">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th style="width: 70px; text-align: center;">Foto</th>
                    <th>Alumno</th>
                    <th>Profesor</th>
                    <th>Programa</th>
                    <th>Clase</th>
                    <th>Grado</th>
                    <th>Asistencia</th>
                    <th>Evaluación</th>
                    <th>Observaciones</th>
                </tr>
            </thead>
            <tbody>
                ${vista_asistencias.map(n => {
                    const claveNombre = (n.alumno || '').trim().toLowerCase();
                    const urlImagenBase = mapaFotosAlumnos.get(claveNombre);

                    const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                        ? urlImagenBase
                        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n.alumno || 'Alumno')}&backgroundColor=0284c7`;

                    const evalLower = (n.evaluacion || '').toLowerCase();
                    const evalBg = evalLower === 'excelente' ? '#0d6efd' : evalLower === 'bueno' ? '#198754' : evalLower === 'deficiente' ? '#dc3545' : '#6c757d';

                    return `
                    <tr 
                      data-id="${n.asistencia_id}"
                      data-fecha="${n.fecha || ''}" 
                      data-alumno="${n.alumno || ''}"
                      data-profesor="${n.profesor || ''}" 
                      data-programa="${n.programa || ''}" 
                      data-clase="${n.clase || ''}" 
                      data-grado="${n.grado || ''}"
                      data-observaciones="${n.observaciones || ''}"
                      data-presente="${n.presente}"
                      class="fila-asistencia"
                      style="cursor: pointer;"
                    >
                        <td data-label="Fecha"><strong>${formatearFecha(n.fecha) || 'Sin fecha'}</strong></td>
                        <td data-label="Foto" style="text-align: center;">
                            <img src="${fotoUrl}" alt="${n.alumno || 'Alumno'}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Alumno&backgroundColor=0284c7'">
                        </td>
                        <td data-label="Alumno" class="text-bold">${n.alumno || '-'}</td>
                        <td data-label="Profesor"><span class="text-light">${n.profesor || '-'}</span></td>
                        <td data-label="Programa"><span class="text-light">${n.programa || '-'}</span></td>
                        <td data-label="Clase"><span class="text-light">${n.clase || '-'}</span></td>
                        <td data-label="Grado" class="text-bold">${n.grado || '-'}</td>
                        <td data-label="Asistencia">
                            <span class="badge" style="background-color: ${n.presente ? '#198754' : '#dc3545'}; color: #ffffff;">
                                ${n.presente ? 'Presente' : 'Ausente'}
                            </span>
                        </td>
                        <td data-label="Evaluación">
                            <span class="badge" style="background-color: ${evalBg}; color: #ffffff;">
                                ${n.evaluacion ?? 'N/A'}
                            </span>
                        </td>
                        <td data-label="Observaciones"><span class="text-light">${n.observaciones ?? ''}</span></td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <!-- Modal CRUD para Asistencias -->
    <div id="modal-asistencia" class="modal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-asistencia-title">Asistencia</h3>
                <button id="modal-asistencia-close" class="modal-close">✕</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <form id="form-asistencia">
                    <div class="form-row" id="container-asist-asignacion">
                        <label>1. Asignación Activa *</label>
                        <select id="asist-asignacion-id" required>
                            <option value="">-- Seleccionar Asignación --</option>
                            ${opcionesAsignaciones}
                        </select>
                    </div>
                    <div class="form-row">
                        <label>2. Registro de Control *</label>
                        <select id="asist-control-id" required disabled>
                            <option value="">-- Seleccione una Asignación primero --</option>
                        </select>
                    </div>
                    <!-- Contenedor Individual (Edición) -->
                    <div id="container-asist-individual" style="display:none; grid-column: span 2;">
                        <div class="form-row">
                            <label>3. Alumno *</label>
                            <select id="asist-alumno-id" disabled>
                                <option value="">-- Seleccione un Control primero --</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>Estatus de Asistencia</label>
                            <select id="asist-presente" disabled>
                                <option value="true">Presente</option>
                                <option value="false">Ausente</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>Evaluación</label>
                            <select id="asist-evaluacion" disabled>
                                <option value="">-- Sin Evaluación --</option>
                                <option value="Excelente">Excelente</option>
                                <option value="Bueno">Bueno</option>
                                <option value="Deficiente">Deficiente</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>Observación</label>
                            <textarea id="asist-observacion" rows="3" placeholder="Observaciones sobre la asistencia..." disabled></textarea>
                        </div>
                    </div>

                    <!-- Contenedor Grupal (Creación por lotes) -->
                    <div id="container-asist-grupal" style="display:none; grid-column: span 2;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; background: #e2e8f0; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                            <span style="font-size: 13px; font-weight: 600; color: #334155;">3. Registrar Asistencia Alumnos:</span>
                            <div style="display: flex; gap: 8px;">
                                <button type="button" id="btn-marcar-todos-presentes" style="font-size: 11px; padding: 4px 8px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; color: #334155;">Todos Presente</button>
                                <button type="button" id="btn-marcar-todos-ausentes" style="font-size: 11px; padding: 4px 8px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; color: #334155;">Todos Ausente</button>
                            </div>
                        </div>
                        <div id="asist-alumnos-list" style="max-height: 40vh; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 8px;">
                            <!-- Lista dinámica de alumnos -->
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button id="btn-cancelar-asistencia" class="btn-secondary">Cancelar</button>
                <button id="btn-borrar-asistencia" class="btn-danger" style="display:none;">Eliminar</button>
                <button id="btn-guardar-asistencia" class="btn-primary">Guardar</button>
            </div>
        </div>
    </div>
    `;

    container.innerHTML = htmlTemplate;

    // Event listeners
    document.getElementById('btn-nueva-asistencia').addEventListener('click', () => abrirModalAsistencia());

    document.querySelectorAll('.fila-asistencia').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: asistencia } = await AsistenciaService.getAsistencia(id);
            if (asistencia) abrirModalAsistencia(asistencia);
        });
    });

    // Manejadores en cascada
    document.getElementById('asist-asignacion-id').addEventListener('change', alCambiarAsignacion);
    document.getElementById('asist-control-id').addEventListener('change', alCambiarControl);

    // Botones de marcado grupal
    document.getElementById('btn-marcar-todos-presentes').addEventListener('click', (e) => {
        e.preventDefault();
        alumnosAsistenciaEstado.forEach(a => { 
            a.presente = true; 
            if (!a.evaluacion) a.evaluacion = 'Bueno';
        });
        renderListaAlumnosGrupal();
    });
    document.getElementById('btn-marcar-todos-ausentes').addEventListener('click', (e) => {
        e.preventDefault();
        alumnosAsistenciaEstado.forEach(a => { 
            a.presente = false; 
            a.evaluacion = '';
        });
        renderListaAlumnosGrupal();
    });

    document.getElementById('modal-asistencia-close').addEventListener('click', () => cerrarModalAsistencia());
    document.getElementById('btn-guardar-asistencia').addEventListener('click', guardarAsistencia);
    document.getElementById('btn-borrar-asistencia').addEventListener('click', borrarAsistencia);
    document.getElementById('btn-cancelar-asistencia').addEventListener('click', (e) => { e.preventDefault(); cerrarModalAsistencia(); });

    // Filtros programáticos
    const inputSearch = document.getElementById('filter-search-asist');
    const selectAlumno = document.getElementById('filter-alumno');
    const selectPrograma = document.getElementById('filter-programa-asist');
    const selectGrado = document.getElementById('filter-grado-asist');
    const selectProfesor = document.getElementById('filter-profesor');
    const selectAsistencia = document.getElementById('filter-asistencia');

    const aplicarFiltrosAsistencias = (event) => {
        const textoBusqueda = (inputSearch?.value || '').toLowerCase();
        const alumnoSel = selectAlumno?.value || '';
        const programaSel = selectPrograma?.value || '';
        const gradoSel = selectGrado?.value || '';
        const profesorSel = selectProfesor?.value || '';
        const asistenciaSel = selectAsistencia?.value || '';

        const filas = document.querySelectorAll('#tabla-asistencias tbody tr');
        const countTotal = filas.length;
        let countVisible = 0;

        filas.forEach(row => {
            const fechaVal = row.getAttribute('data-fecha') || '';
            const programaVal = row.getAttribute('data-programa') || '';
            const claseVal = row.getAttribute('data-clase') || '';
            const observacionesVal = row.getAttribute('data-observaciones') || '';

            const alumno = row.getAttribute('data-alumno') || '';
            const grado = row.getAttribute('data-grado') || '';
            const profesor = row.getAttribute('data-profesor') || '';

            const fechaFormateada = formatearFecha(fechaVal).toLowerCase();
            const fechaOriginal = fechaVal.toLowerCase();
            const programa = programaVal.toLowerCase();
            const clase = claseVal.toLowerCase();
            const observaciones = observacionesVal.toLowerCase();
            const presenteVal = row.getAttribute('data-presente') === 'true';

            const coincideTexto = !textoBusqueda || 
                                  fechaFormateada.includes(textoBusqueda) || 
                                  fechaOriginal.includes(textoBusqueda) || 
                                  programa.includes(textoBusqueda) || 
                                  clase.includes(textoBusqueda) || 
                                  observaciones.includes(textoBusqueda);

            const coincideAlumno = !alumnoSel || alumno === alumnoSel;
            const coincidePrograma = !programaSel || programaVal === programaSel;
            const coincideGrado = !gradoSel || grado === gradoSel;
            const coincideProfesor = !profesorSel || profesor === profesorSel;
            const coincideAsistencia = !asistenciaSel || 
                                       (asistenciaSel === 'presente' && presenteVal) || 
                                       (asistenciaSel === 'ausente' && !presenteVal);

            if (coincideTexto && coincideAlumno && coincidePrograma && coincideGrado && coincideProfesor && coincideAsistencia) {
                row.style.removeProperty('display');
                countVisible++;
            } else {
                row.style.setProperty('display', 'none', 'important');
            }
        });

        const contadorElemento = document.getElementById('asistencias-contador-texto');
        if (contadorElemento) {
            const hasFilter = textoBusqueda || alumnoSel || programaSel || gradoSel || profesorSel || asistenciaSel;
            if (!hasFilter) {
                contadorElemento.textContent = `${countTotal} asistencias`;
            } else {
                contadorElemento.textContent = `${countVisible} de ${countTotal} asistencias`;
            }
        }
    };

    inputSearch?.addEventListener('input', aplicarFiltrosAsistencias);
    selectAlumno?.addEventListener('change', aplicarFiltrosAsistencias);
    selectPrograma?.addEventListener('change', aplicarFiltrosAsistencias);
    selectGrado?.addEventListener('change', aplicarFiltrosAsistencias);
    selectProfesor?.addEventListener('change', aplicarFiltrosAsistencias);
    selectAsistencia?.addEventListener('change', aplicarFiltrosAsistencias);

    // Inicializar el contador al cargar la vista
    aplicarFiltrosAsistencias();
}

// Paso 1: Al cambiar Asignación desbloquea SOLO Registro Control y resetea Alumnos
function alCambiarAsignacion() {
    const asignacionId = document.getElementById('asist-asignacion-id').value;
    const selControl = document.getElementById('asist-control-id');
    const selAlumno = document.getElementById('asist-alumno-id');
    const selPresente = document.getElementById('asist-presente');
    const selEvaluacion = document.getElementById('asist-evaluacion');
    const txtObservacion = document.getElementById('asist-observacion');

    // Reiniciar y bloquear de inmediato los campos en cascada
    selControl.value = '';
    selAlumno.innerHTML = `<option value="">-- Seleccione un Control primero --</option>`;
    selAlumno.value = '';
    selAlumno.disabled = true;
    selPresente.disabled = true;
    selEvaluacion.disabled = true;
    txtObservacion.disabled = true;

    if (!asignacionId) {
        selControl.innerHTML = `<option value="">-- Seleccione una Asignación primero --</option>`;
        selControl.disabled = true;
        return;
    }

    // Filtrar controles pertenecientes a esa asignación por `asigna_id`
    const controlesFiltrados = listaControlGlobal.filter(c => String(c.asigna_id) === String(asignacionId));

    if (controlesFiltrados.length > 0) {
        selControl.innerHTML = `<option value="">-- Seleccionar Control --</option>` + 
            controlesFiltrados.map(c => `<option value="${c.id}">Control #${c.id} - ${c.control_fecha || 'Sin fecha'} (${c.clase_tema})</option>`).join('');
        selControl.disabled = false;
    } else {
        selControl.innerHTML = `<option value="">-- No hay controles registrados en esta asignación --</option>`;
        selControl.disabled = true;
    }
}

// Paso 2: Filtra los alumnos y pobla el estado grupal o individual
async function alCambiarControl() {
    const asignacionId = document.getElementById('asist-asignacion-id').value;
    const controlId = document.getElementById('asist-control-id').value;
    const selAlumno = document.getElementById('asist-alumno-id');
    const selPresente = document.getElementById('asist-presente');
    const selEvaluacion = document.getElementById('asist-evaluacion');
    const txtObservacion = document.getElementById('asist-observacion');

    if (!controlId || !asignacionId) {
        if (editandoAsistenciaId === null) {
            alumnosAsistenciaEstado = [];
            renderListaAlumnosGrupal();
        } else {
            selAlumno.innerHTML = `<option value="">-- Seleccione un Control primero --</option>`;
            selAlumno.value = '';
            selAlumno.disabled = true;
            selPresente.disabled = true;
            selEvaluacion.disabled = true;
            txtObservacion.disabled = true;
        }
        return;
    }

    // 1. Obtener la asignación para conocer su grado_id
    const asignacion = listaAsignacionesGlobal.find(a => String(a.id) === String(asignacionId));
    
    if (!asignacion || asignacion.grado_id === null || asignacion.grado_id === undefined) {
        if (editandoAsistenciaId === null) {
            alumnosAsistenciaEstado = [];
            const listCont = document.getElementById('asist-alumnos-list');
            if (listCont) listCont.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 12px;">⚠️ Asignación sin grado asociado</p>';
        } else {
            selAlumno.innerHTML = `<option value="">-- Asignación sin grado asociado --</option>`;
            selAlumno.value = '';
            selAlumno.disabled = true;
            selPresente.disabled = true;
            selEvaluacion.disabled = true;
            txtObservacion.disabled = true;
        }
        return;
    }

    // 2. Filtrar alumnos cuyo grado_id sea exactamente igual al grado_id de la asignación
    const targetGradoId = String(asignacion.grado_id);
    const alumnosDelGrado = listaAlumnosGlobal.filter(a => a.grado_id !== null && a.grado_id !== undefined && String(a.grado_id) === targetGradoId);

    // Si para ese grado no se han cargado alumnos en la base de datos
    if (alumnosDelGrado.length === 0) {
        if (editandoAsistenciaId === null) {
            alumnosAsistenciaEstado = [];
            const listCont = document.getElementById('asist-alumnos-list');
            if (listCont) listCont.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 12px;">⚠️ No hay alumnos registrados para este grado</p>';
        } else {
            selAlumno.innerHTML = `<option value="">-- No hay alumnos registrados para este grado --</option>`;
            selAlumno.value = '';
            selAlumno.disabled = true;
            selPresente.disabled = true;
            selEvaluacion.disabled = true;
            txtObservacion.disabled = true;
        }
        return;
    }

    // 3. Consultar en la tabla 'asistencias' los alumnos ya procesados para este control_id
    const { data: asistenciasExistentes } = await AsistenciaService.getAlumnosProcesados(controlId);
    const idsRegistrados = new Set((asistenciasExistentes || []).map(a => String(a.alumno_id)));

    // 4. Excluir alumnos que ya cuentan con asistencia grabada en este control
    const alumnosDisponibles = alumnosDelGrado.filter(a => !idsRegistrados.has(String(a.id)));

    if (editandoAsistenciaId === null) {
        alumnosAsistenciaEstado = alumnosDisponibles.map(a => ({
            id: a.id,
            nombre: a.alumno_nombre || `Alumno #${a.id}`,
            presente: false,
            evaluacion: '', // Sin evaluación por defecto
            observacion: '',
            expandido: false
        }));
        renderListaAlumnosGrupal();
    } else {
        if (alumnosDisponibles.length > 0) {
            selAlumno.innerHTML = `<option value="">-- Seleccionar Alumno --</option>` + 
                alumnosDisponibles.map(a => `<option value="${a.id}">${a.alumno_nombre || `Alumno #${a.id}`}</option>`).join('');
            
            selAlumno.disabled = false;
            selPresente.disabled = false;
            selEvaluacion.disabled = false;
            txtObservacion.disabled = false;
        } else {
            selAlumno.innerHTML = `<option value="">-- Todos los alumnos de este grado ya tienen asistencia en este control --</option>`;
            selAlumno.value = '';
            selAlumno.disabled = true;
            selPresente.disabled = true;
            selEvaluacion.disabled = true;
            txtObservacion.disabled = true;
        }
    }
}

function abrirModalAsistencia(asistencia = null) {
    const modal = document.getElementById('modal-asistencia');
    const titulo = document.getElementById('modal-asistencia-title');
    const containerAsignacion = document.getElementById('container-asist-asignacion');
    const selControl = document.getElementById('asist-control-id');
    const selAlumno = document.getElementById('asist-alumno-id');
    const selPresente = document.getElementById('asist-presente');
    const selEvaluacion = document.getElementById('asist-evaluacion');
    const txtObservacion = document.getElementById('asist-observacion');
    const btnBorrar = document.getElementById('btn-borrar-asistencia');

    const containerIndividual = document.getElementById('container-asist-individual');
    const containerGrupal = document.getElementById('container-asist-grupal');

    if (asistencia) {
        editandoAsistenciaId = asistencia.id;
        titulo.textContent = `Editar Asistencia #${asistencia.id}`;
        
        if (containerAsignacion) containerAsignacion.style.display = 'none';
        if (containerIndividual) containerIndividual.style.display = 'block';
        if (containerGrupal) containerGrupal.style.display = 'none';

        // En edición mostramos la lista completa deshabilitada
        selControl.innerHTML = `<option value="">-- Seleccionar Control --</option>` + 
            listaControlGlobal.map(c => `<option value="${c.id}">Control #${c.id} - ${c.control_fecha || 'Sin fecha'} (${c.clase_tema})</option>`).join('');
        selAlumno.innerHTML = `<option value="">-- Seleccionar Alumno --</option>` + 
            listaAlumnosGlobal.map(a => `<option value="${a.id}">${a.alumno_nombre || `Alumno #${a.id}`}</option>`).join('');

        selControl.value = asistencia.control_id || '';
        selAlumno.value = asistencia.alumno_id || '';
        selPresente.value = asistencia.asist_presente !== undefined ? String(asistencia.asist_presente) : 'false';
        selEvaluacion.value = asistencia.asist_evaluacion || '';
        txtObservacion.value = asistencia.asist_observacion || '';

        btnBorrar.style.display = '';

        selControl.disabled = true;
        selAlumno.disabled = true;
        selPresente.disabled = false;
        selEvaluacion.disabled = false;
        txtObservacion.disabled = false;
    } else {
        editandoAsistenciaId = null;
        titulo.textContent = 'Nueva Asistencia';
        
        if (containerAsignacion) containerAsignacion.style.display = '';
        if (containerIndividual) containerIndividual.style.display = 'none';
        if (containerGrupal) containerGrupal.style.display = 'block';
        
        // Limpiar el estado grupal anterior
        alumnosAsistenciaEstado = [];
        const listCont = document.getElementById('asist-alumnos-list');
        if (listCont) listCont.innerHTML = '';

        limpiarFormularioAsistencia();

        btnBorrar.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function cerrarModalAsistencia() {
    const modal = document.getElementById('modal-asistencia');
    if (modal) modal.style.display = 'none';
}

function limpiarFormularioAsistencia() {
    const selAsignacion = document.getElementById('asist-asignacion-id');
    if (selAsignacion) selAsignacion.value = '';

    document.getElementById('asist-presente').value = 'true';
    document.getElementById('asist-evaluacion').value = '';
    document.getElementById('asist-observacion').value = '';

    // Reiniciar bloqueos en cadena
    alCambiarAsignacion();
}

async function guardarAsistencia(e) {
    e.preventDefault();
    const btnGuardar = document.getElementById('btn-guardar-asistencia');
    const control_id = document.getElementById('asist-control-id').value;

    if (!control_id) {
        mostrarMensaje('error', 'El Registro de Control es obligatorio');
        return;
    }

    if (editandoAsistenciaId !== null) {
        // --- FLUJO INDIVIDUAL (EDICIÓN) ---
        const alumno_id = document.getElementById('asist-alumno-id').value;
        const asist_presente = document.getElementById('asist-presente').value === 'true';
        const asist_evaluacion = document.getElementById('asist-evaluacion').value || null;
        const asist_observacion = document.getElementById('asist-observacion').value.trim() || null;

        if (!alumno_id) {
            mostrarMensaje('error', 'El Alumno es obligatorio');
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        const payload = {
            control_id: parseInt(control_id, 10),
            alumno_id: parseInt(alumno_id, 10),
            asist_presente: asist_presente,
            asist_evaluacion: asist_evaluacion,
            asist_observacion: asist_observacion
        };

        const { error } = await AsistenciaService.saveAsistencia(editandoAsistenciaId, payload);

        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar';

        if (error) { 
            mostrarMensaje('error', 'Error al actualizar asistencia: ' + error.message); 
            return; 
        }

        mostrarMensaje('success', 'Asistencia actualizada correctamente');
        cerrarModalAsistencia();
        if (containerElement) cargarVistaAsistencias(containerElement);

    } else {
        // --- FLUJO GRUPAL (NUEVA ASISTENCIA MASIVA) ---
        if (alumnosAsistenciaEstado.length === 0) {
            mostrarMensaje('error', 'No hay alumnos disponibles para registrar asistencia.');
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        try {
            const promesas = alumnosAsistenciaEstado.map(alum => {
                const payload = {
                    control_id: parseInt(control_id, 10),
                    alumno_id: parseInt(alum.id, 10),
                    asist_presente: alum.presente,
                    asist_evaluacion: alum.evaluacion || null,
                    asist_observacion: alum.observacion || null
                };
                return AsistenciaService.saveAsistencia(null, payload);
            });

            const resultados = await Promise.all(promesas);
            const errores = resultados.filter(r => r.error);

            if (errores.length > 0) {
                console.error('[Error Guardar Grupal] Errores al registrar asistencias:', errores);
                mostrarMensaje('error', `Se registraron algunas asistencias, pero hubo ${errores.length} errores.`);
            } else {
                mostrarMensaje('success', 'Todas las asistencias fueron registradas correctamente');
            }

            cerrarModalAsistencia();
            if (containerElement) cargarVistaAsistencias(containerElement);

        } catch (err) {
            console.error('[Error Guardar Grupal] Excepción fatal:', err);
            mostrarMensaje('error', 'Excepción fatal al guardar las asistencias: ' + err.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar';
        }
    }
}

async function borrarAsistencia(e) {
    e.preventDefault();
    if (!editandoAsistenciaId) return;

    if (!confirm(`¿Deseas eliminar el registro de asistencia #${editandoAsistenciaId}? Esta acción no se puede deshacer.`)) return;

    const { error } = await AsistenciaService.deleteAsistencia(editandoAsistenciaId);

    if (error) { mostrarMensaje('error', 'Error al eliminar asistencia: ' + error.message); return; }
    mostrarMensaje('success', 'Asistencia eliminada correctamente');

    cerrarModalAsistencia();
    if (containerElement) cargarVistaAsistencias(containerElement);
}

function renderListaAlumnosGrupal() {
    const contenedor = document.getElementById('asist-alumnos-list');
    if (!contenedor) return;

    if (alumnosAsistenciaEstado.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: #64748b; padding: 12px; font-style: italic; width: 100%;">No hay alumnos disponibles para registrar asistencia en este control.</p>';
        return;
    }

    // Guardar el estado de foco actual para restaurarlo si re-renderizamos
    const activeElementId = document.activeElement ? document.activeElement.id : null;
    const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
    const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

    contenedor.innerHTML = alumnosAsistenciaEstado.map((alum, index) => {
        const expandidoStyle = alum.expandido ? 'display: block;' : 'display: none;';
        const badgeColor = alum.evaluacion === 'Excelente' ? '#0d6efd' : alum.evaluacion === 'Bueno' ? '#198754' : alum.evaluacion === 'Deficiente' ? '#dc3545' : '#6c757d';
        
        return `
        <div class="alumno-asistencia-item" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background-color: #f8fafc; transition: all 0.2s;">
            <div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;" class="alumno-item-header" data-index="${index}">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="chk-presente" data-index="${index}" ${alum.presente ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-weight: 600; font-size: 14px; color: #1e293b;">${alum.nombre}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge badge-eval-display" style="background-color: ${badgeColor}; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                        ${alum.evaluacion || 'Sin Evaluación'}
                    </span>
                    <span class="obs-indicator" style="font-size: 12px; min-width: 16px; text-align: center;">${alum.observacion ? '📝' : ''}</span>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: bold;">${alum.expandido ? '▲' : '▼'}</span>
                </div>
            </div>
            <div class="alumno-item-body" id="body-alumno-${index}" style="${expandidoStyle} margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                <div class="form-row" style="margin-bottom: 8px;">
                    <label style="font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 4px;">Evaluación</label>
                    <select class="sel-eval-individual form-select" data-index="${index}" style="width: 100%; padding: 6px; font-size: 13px; border-radius: 4px; border: 1px solid #cbd5e1; background-color: #ffffff;">
                        <option value="" ${alum.evaluacion === '' || !alum.evaluacion ? 'selected' : ''}>-- Sin Evaluación --</option>
                        <option value="Excelente" ${alum.evaluacion === 'Excelente' ? 'selected' : ''}>Excelente</option>
                        <option value="Bueno" ${alum.evaluacion === 'Bueno' ? 'selected' : ''}>Bueno</option>
                        <option value="Deficiente" ${alum.evaluacion === 'Deficiente' ? 'selected' : ''}>Deficiente</option>
                    </select>
                </div>
                <div class="form-row">
                    <label style="font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 4px;">Observación</label>
                    <input type="text" id="obs-input-${index}" class="txt-obs-individual form-control" data-index="${index}" value="${alum.observacion || ''}" placeholder="Escribe observaciones aquí..." style="width: 100%; padding: 6px; font-size: 13px; border-radius: 4px; border: 1px solid #cbd5e1; background-color: #ffffff;">
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Registrar Eventos para checkboxes
    contenedor.querySelectorAll('.chk-presente').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const idx = parseInt(chk.getAttribute('data-index'), 10);
            alumnosAsistenciaEstado[idx].presente = chk.checked;
            if (chk.checked) {
                // Al marcar como presente, se asigna "Bueno" si estaba sin evaluación
                if (!alumnosAsistenciaEstado[idx].evaluacion) {
                    alumnosAsistenciaEstado[idx].evaluacion = 'Bueno';
                }
            } else {
                // Al desmarcar como inasistente, se quita la evaluación
                alumnosAsistenciaEstado[idx].evaluacion = '';
            }
            renderListaAlumnosGrupal();
        });
    });

    // Registrar Eventos para expandir/colapsar al hacer clic en la cabecera (excluyendo el checkbox)
    contenedor.querySelectorAll('.alumno-item-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.classList.contains('chk-presente')) return;
            const idx = parseInt(header.getAttribute('data-index'), 10);
            alumnosAsistenciaEstado[idx].expandido = !alumnosAsistenciaEstado[idx].expandido;
            renderListaAlumnosGrupal();
        });
    });

    // Registrar Eventos para cambio de evaluación individual
    contenedor.querySelectorAll('.sel-eval-individual').forEach(sel => {
        sel.addEventListener('change', () => {
            const idx = parseInt(sel.getAttribute('data-index'), 10);
            alumnosAsistenciaEstado[idx].evaluacion = sel.value;
            
            // Actualizar solo el badge del elemento sin re-renderizar todo
            const badgeColor = sel.value === 'Excelente' ? '#0d6efd' : sel.value === 'Bueno' ? '#198754' : sel.value === 'Deficiente' ? '#dc3545' : '#6c757d';
            const headerBadge = contenedor.querySelector(`.alumno-item-header[data-index="${idx}"] .badge-eval-display`);
            if (headerBadge) {
                headerBadge.style.backgroundColor = badgeColor;
                headerBadge.textContent = sel.value || 'Sin Evaluación';
            }
        });
    });

    // Registrar Eventos para cambios de observación individual (sin perder el foco)
    contenedor.querySelectorAll('.txt-obs-individual').forEach(input => {
        input.addEventListener('input', () => {
            const idx = parseInt(input.getAttribute('data-index'), 10);
            alumnosAsistenciaEstado[idx].observacion = input.value;
            
            // Actualizar el icono de lápiz en el header correspondiente
            const headerObs = contenedor.querySelector(`.alumno-item-header[data-index="${idx}"] .obs-indicator`);
            if (headerObs) {
                headerObs.textContent = input.value.trim() ? '📝' : '';
            }
        });
    });

    // Restaurar foco si es necesario
    if (activeElementId) {
        const el = document.getElementById(activeElementId);
        if (el) {
            el.focus();
            if (selectionStart !== null && selectionEnd !== null) {
                try { el.setSelectionRange(selectionStart, selectionEnd); } catch (err) {}
            }
        }
    }
}
