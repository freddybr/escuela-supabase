import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { AsistenciaService, AlumnoService, ControlService, ClaseService, AsignacionService, ProgramaService, GradoService } from '../services.js';

let containerElement = null;
let editandoAsistenciaId = null;
let listaAlumnosGlobal = [];
let listaControlGlobal = [];
let listaAsignacionesGlobal = [];

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

    // Mapear asignaciones agregando los nombres resueltos
    listaAsignacionesGlobal = (resAsignaciones.data || []).map(asig => ({
        ...asig,
        prog_nombre: mapaProgramas.get(asig.programa_id) || `Programa #${asig.programa_id}`,
        grado_nombre: mapaGrados.get(asig.grado_id) || `Grado #${asig.grado_id}`
    }));

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
    const gradosUnicos = [...new Set(vista_asistencias.map(n => n.grado).filter(Boolean))].sort();
    const profesoresUnicos = [...new Set(vista_asistencias.map(n => n.profesor).filter(Boolean))].sort();

    let htmlTemplate = `
    ${renderHeaderSeccion('asistencias', 'Asistencias', 'Registro diario de asistencias de alumnos.', `<div class="header-action-container"><button id="btn-nueva-asistencia" class="btn-header-action" aria-label="Añadir">+</button></div>`)}

    <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: flex-start;">
        <div style="flex: 1 1 100%; min-width: 140px;">
            <input type="text" id="filter-search-asist" class="form-control" placeholder="Buscar por Fecha, Programa, Clase u Observaciones...">
        </div>
        <div style="width: 180px;">
            <select id="filter-alumno" class="form-select">
                <option value="">Todos los Alumnos</option>
                ${alumnosUnicos.map(alumno => `<option value="${alumno}">${alumno}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-grado-asist" class="form-select">
                <option value="">Todos los Grados</option>
                ${gradosUnicos.map(grado => `<option value="${grado}">${grado}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-profesor" class="form-select">
                <option value="">Todos los Profesores</option>
                ${profesoresUnicos.map(profesor => `<option value="${profesor}">${profesor}</option>`).join('')}
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
                      class="fila-asistencia"
                      style="cursor: pointer;"
                    >
                        <td data-label="Fecha"><strong># ${n.fecha ?? 'Sin fecha'}</strong></td>
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
                    <div class="form-row">
                        <label>3. Alumno *</label>
                        <select id="asist-alumno-id" required disabled>
                            <option value="">-- Seleccione un Control primero --</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label>Estatus de Asistencia</label>
                        <select id="asist-presente" required disabled>
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
                </form>
            </div>
            <div class="modal-footer">
                <button id="btn-cancelar-asistencia" class="btn-secondary">Cancelar</button>
                <button id="btn-limpiar-asistencia" class="btn-tertiary">Limpiar</button>
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

    document.getElementById('modal-asistencia-close').addEventListener('click', () => cerrarModalAsistencia());
    document.getElementById('btn-guardar-asistencia').addEventListener('click', guardarAsistencia);
    document.getElementById('btn-borrar-asistencia').addEventListener('click', borrarAsistencia);
    document.getElementById('btn-cancelar-asistencia').addEventListener('click', (e) => { e.preventDefault(); cerrarModalAsistencia(); });
    document.getElementById('btn-limpiar-asistencia').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioAsistencia(); });

    // Filtros programáticos
    const inputSearch = document.getElementById('filter-search-asist');
    const selectAlumno = document.getElementById('filter-alumno');
    const selectGrado = document.getElementById('filter-grado-asist');
    const selectProfesor = document.getElementById('filter-profesor');

    const aplicarFiltrosAsistencias = () => {
        const textoBusqueda = (inputSearch?.value || '').toLowerCase();
        const alumnoSel = selectAlumno?.value || '';
        const gradoSel = selectGrado?.value || '';
        const profesorSel = selectProfesor?.value || '';

        const filas = document.querySelectorAll('#tabla-asistencias tbody tr');

        filas.forEach(row => {
            const fecha = row.getAttribute('data-fecha').toLowerCase();
            const programa = row.getAttribute('data-programa').toLowerCase();
            const clase = row.getAttribute('data-clase').toLowerCase();
            const observaciones = row.getAttribute('data-observaciones').toLowerCase();

            const alumno = row.getAttribute('data-alumno');
            const grado = row.getAttribute('data-grado');
            const profesor = row.getAttribute('data-profesor');

            const coincideTexto = !textoBusqueda || fecha.includes(textoBusqueda) || programa.includes(textoBusqueda) || clase.includes(textoBusqueda) || observaciones.includes(textoBusqueda);
            const coincideAlumno = !alumnoSel || alumno === alumnoSel;
            const coincideGrado = !gradoSel || grado === gradoSel;
            const coincideProfesor = !profesorSel || profesor === profesorSel;

            if (coincideTexto && coincideAlumno && coincideGrado && coincideProfesor) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

    inputSearch?.addEventListener('input', aplicarFiltrosAsistencias);
    selectAlumno?.addEventListener('change', aplicarFiltrosAsistencias);
    selectGrado?.addEventListener('change', aplicarFiltrosAsistencias);
    selectProfesor?.addEventListener('change', aplicarFiltrosAsistencias);
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

// Paso 2: Filtra estrictamente los alumnos por el grado_id de la asignación seleccionada
async function alCambiarControl() {
    const asignacionId = document.getElementById('asist-asignacion-id').value;
    const controlId = document.getElementById('asist-control-id').value;
    const selAlumno = document.getElementById('asist-alumno-id');
    const selPresente = document.getElementById('asist-presente');
    const selEvaluacion = document.getElementById('asist-evaluacion');
    const txtObservacion = document.getElementById('asist-observacion');

    if (!controlId || !asignacionId) {
        selAlumno.innerHTML = `<option value="">-- Seleccione un Control primero --</option>`;
        selAlumno.value = '';
        selAlumno.disabled = true;
        selPresente.disabled = true;
        selEvaluacion.disabled = true;
        txtObservacion.disabled = true;
        return;
    }

    // 1. Obtener la asignación para conocer su grado_id
    const asignacion = listaAsignacionesGlobal.find(a => String(a.id) === String(asignacionId));
    
    if (!asignacion || asignacion.grado_id === null || asignacion.grado_id === undefined) {
        selAlumno.innerHTML = `<option value="">-- Asignación sin grado asociado --</option>`;
        selAlumno.value = '';
        selAlumno.disabled = true;
        selPresente.disabled = true;
        selEvaluacion.disabled = true;
        txtObservacion.disabled = true;
        return;
    }

    // 2. Filtrar alumnos cuyo grado_id sea exactamente igual al grado_id de la asignación
    const targetGradoId = String(asignacion.grado_id);
    const alumnosDelGrado = listaAlumnosGlobal.filter(a => a.grado_id !== null && a.grado_id !== undefined && String(a.grado_id) === targetGradoId);

    // Si para ese grado no se han cargado alumnos en la base de datos
    if (alumnosDelGrado.length === 0) {
        selAlumno.innerHTML = `<option value="">-- No hay alumnos registrados para este grado --</option>`;
        selAlumno.value = '';
        selAlumno.disabled = true;
        selPresente.disabled = true;
        selEvaluacion.disabled = true;
        txtObservacion.disabled = true;
        return;
    }

    // 3. Consultar en la tabla 'asistencias' los alumnos ya procesados para este control_id
    const { data: asistenciasExistentes } = await AsistenciaService.getAlumnosProcesados(controlId);
    const idsRegistrados = new Set((asistenciasExistentes || []).map(a => String(a.alumno_id)));

    // 4. Excluir alumnos que ya cuentan con asistencia grabada en este control
    const alumnosDisponibles = alumnosDelGrado.filter(a => !idsRegistrados.has(String(a.id)));

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
    const btnLimpiar = document.getElementById('btn-limpiar-asistencia');

    if (asistencia) {
        editandoAsistenciaId = asistencia.id;
        titulo.textContent = `Editar Asistencia #${asistencia.id}`;
        
        if (containerAsignacion) containerAsignacion.style.display = 'none';

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
        btnLimpiar.style.display = 'none';

        selControl.disabled = true;
        selAlumno.disabled = true;
        selPresente.disabled = false;
        selEvaluacion.disabled = false;
        txtObservacion.disabled = false;
    } else {
        editandoAsistenciaId = null;
        titulo.textContent = 'Nueva Asistencia';
        
        if (containerAsignacion) containerAsignacion.style.display = '';
        limpiarFormularioAsistencia();

        btnBorrar.style.display = 'none';
        btnLimpiar.style.display = '';
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
    const control_id = document.getElementById('asist-control-id').value;
    const alumno_id = document.getElementById('asist-alumno-id').value;
    const asist_presente = document.getElementById('asist-presente').value === 'true';
    const asist_evaluacion = document.getElementById('asist-evaluacion').value || null;
    const asist_observacion = document.getElementById('asist-observacion').value.trim() || null;

    if (!control_id || !alumno_id) {
        mostrarMensaje('error', 'El Registro de Control y el Alumno son obligatorios');
        return;
    }

    const payload = {
        control_id: parseInt(control_id, 10),
        alumno_id: parseInt(alumno_id, 10),
        asist_presente: asist_presente,
        asist_evaluacion: asist_evaluacion,
        asist_observacion: asist_observacion
    };

    const { error } = await AsistenciaService.saveAsistencia(editandoAsistenciaId, payload);

    if (error) { 
        mostrarMensaje('error', `Error al ${editandoAsistenciaId ? 'actualizar' : 'registrar'} asistencia: ` + error.message); 
        return; 
    }

    mostrarMensaje('success', `Asistencia ${editandoAsistenciaId ? 'actualizada' : 'registrada'} correctamente`);
    cerrarModalAsistencia();
    if (containerElement) cargarVistaAsistencias(containerElement);
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
