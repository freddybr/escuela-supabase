import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { AsignacionService, ProgramaService, GradoService, PeriodoService } from '../services.js';

let containerElement = null;

export async function cargarVistaAsignaciones(container) {
    containerElement = container;
    container.innerHTML = '<div class="loading">Consultando Asignaciones...</div>';

    const [resVista, resProgramas, resGrados, resAnio] = await Promise.all([
        AsignacionService.getAsignacionesDetalles(),
        ProgramaService.getProgramasDisponibles(),
        GradoService.getGrados(),
        PeriodoService.getPeriodos()
    ]);

    if (resVista.error) {
        container.innerHTML = `<p class="error-msg">❌ Error al cargar asignaciones: ${resVista.error.message}</p>`;
        return;
    }

    if (resProgramas.error) mostrarMensaje('error', 'Error al cargar programas disponibles: ' + resProgramas.error.message);
    if (resGrados.error) mostrarMensaje('error', 'Error al cargar grados: ' + resGrados.error.message);
    if (resAnio.error) mostrarMensaje('error', 'Error al cargar períodos (año): ' + resAnio.error.message);

    const vistaAsignaciones = resVista.data || [];
    const programasDisponibles = resProgramas.data || [];
    const grados = resGrados.data || [];
    const anios = resAnio.data || [];

    const opcionesProgramas = programasDisponibles.map(p => 
        `<option value="${p.id}">#${p.id} - ${p.programa_tema}</option>`
    ).join('');

    const opcionesGrados = grados.map(g => 
        `<option value="${g.id}">${g.grado_nombre || g.grado_numero}</option>`
    ).join('');

    const opcionesAnios = anios.map(a => 
        `<option value="${a.id}">${a.anio_periodo}</option>`
    ).join('');

    let htmlTemplate = `
        ${renderHeaderSeccion('asignaciones', 'Asignaciones', 'Distribución de los programas entre los grados.', `<div class="header-action-container"><button id="btn-nueva-asignacion" class="btn-header-action" aria-label="Añadir">+</button></div>`)}

        <div class="table-responsive">
            <table class="data-table" id="tabla-asignaciones">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th># Prog</th>
                        <th>Programa</th>
                        <th>Grado</th>
                        <th>Estatus</th>
                        <th>Periodo</th>
                        <th>Materia</th>
                        <th># Clases</th>
                    </tr>
                </thead>
                <tbody>
                    ${vistaAsignaciones.map(n => `
                        <tr data-id="${n.asigna_id}" class="fila-asignacion" style="cursor:pointer;">
                            <td data-label="ID"><strong>${n.asigna_id}</strong></td>
                            <td data-label="# Prog" class="text-bold">${n.programa_id}</td>
                            <td data-label="Programa" class="text-bold">${n.programa_tema || 'Sin programa'}</td>
                            <td data-label="Grado"><span class="text-light">${n.grado_numero || 'N/A'}</span></td>
                            <td data-label="Estatus">
                                <span class="badge" style="background-color: ${n.asigna_estatus === 'Activa' ? '#c7f9cc' : '#ffe3e0'}; color: #000;">
                                    ${n.asigna_estatus}
                                </span>
                            </td>
                            <td data-label="Periodo"><span class="text-light">${n.anio_periodo || 'N/A'}</span></td>
                            <td data-label="Materia"><span class="text-light">${n.materia_nombre || 'N/A'}</span></td>
                            <td data-label="# Clases"><span class="text-light">${n.total_clases ?? 0}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div id="modal-asignacion" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-asignacion-title">Asignación</h3>
                    <button id="modal-asignacion-close" class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-asignacion">
                        <input type="hidden" id="asigna-id">
                        
                        <div class="form-row">
                            <label>Programa (Disponible)</label>
                            <select id="asigna-programa" required>
                                <option value="">-- Seleccionar Programa --</option>
                                ${opcionesProgramas}
                            </select>
                        </div>

                        <div class="form-row">
                            <label>Grado</label>
                            <select id="asigna-grado" required>
                                <option value="">-- Seleccionar Grado --</option>
                                ${opcionesGrados}
                            </select>
                        </div>

                        <div class="form-row">
                            <label>Periodo (Año)</label>
                            <select id="asigna-anio" required>
                                <option value="">-- Seleccionar Periodo --</option>
                                ${opcionesAnios}
                            </select>
                        </div>

                        <div class="form-row">
                            <label>Estatus de Asignación</label>
                            <select id="asigna-estatus" required>
                                <option value="Activa">Activa</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Terminada">Terminada</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button id="btn-cancelar-asignacion" class="btn-secondary">Cancelar</button>
                    <button id="btn-limpiar-asignacion" class="btn-tertiary">Limpiar</button>
                    <button id="btn-borrar-asignacion" class="btn-danger" style="display:none;">Eliminar</button>
                    <button id="btn-guardar-asignacion" class="btn-primary">Guardar</button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = htmlTemplate;

    document.getElementById('btn-nueva-asignacion').addEventListener('click', () => abrirModalAsignacion());

    document.querySelectorAll('.fila-asignacion').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: asigna } = await AsignacionService.getAsignacion(id);
            if (asigna) {
                abrirModalAsignacion(asigna);
            }
        });
    });

    document.getElementById('modal-asignacion-close').addEventListener('click', () => cerrarModalAsignacion());
    document.getElementById('btn-guardar-asignacion').addEventListener('click', guardarAsignacion);
    document.getElementById('btn-borrar-asignacion').addEventListener('click', borrarAsignacion);
    document.getElementById('btn-cancelar-asignacion').addEventListener('click', (e) => { e.preventDefault(); cerrarModalAsignacion(); });
    document.getElementById('btn-limpiar-asignacion').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioAsignacion(); });
}

function abrirModalAsignacion(asignacion = null) {
    const modal = document.getElementById('modal-asignacion');
    const titulo = document.getElementById('modal-asignacion-title');
    const inputId = document.getElementById('asigna-id');
    const selPrograma = document.getElementById('asigna-programa');
    const selGrado = document.getElementById('asigna-grado');
    const selAnio = document.getElementById('asigna-anio');
    const selEstatus = document.getElementById('asigna-estatus');
    const btnBorrar = document.getElementById('btn-borrar-asignacion');

    if (asignacion) {
        titulo.textContent = `Asignación #${asignacion.id}`;
        inputId.value = asignacion.id;
        selPrograma.value = asignacion.programa_id || '';
        selGrado.value = asignacion.grado_id || '';
        selAnio.value = asignacion.anio_id || '';
        selEstatus.value = asignacion.asigna_estatus || 'Activa';
        btnBorrar.style.display = 'inline-block';
    } else {
        titulo.textContent = 'Nueva Asignación';
        inputId.value = '';
        selPrograma.value = '';
        selGrado.value = '';
        selAnio.value = '';
        selEstatus.value = 'Activa';
        btnBorrar.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function cerrarModalAsignacion() {
    const modal = document.getElementById('modal-asignacion');
    if (modal) modal.style.display = 'none';
}

async function guardarAsignacion(e) {
    e.preventDefault();

    const id = document.getElementById('asigna-id').value;
    const programa_id = document.getElementById('asigna-programa').value;
    const grado_id = document.getElementById('asigna-grado').value;
    const anio_id = document.getElementById('asigna-anio').value;
    const asigna_estatus = document.getElementById('asigna-estatus').value;

    if (!programa_id) { mostrarMensaje('error', 'Seleccione un programa'); return; }
    if (!grado_id) { mostrarMensaje('error', 'Seleccione un grado'); return; }
    if (!anio_id) { mostrarMensaje('error', 'Seleccione un período (año)'); return; }

    const datos = {
        programa_id: parseInt(programa_id, 10),
        grado_id: parseInt(grado_id, 10),
        anio_id: parseInt(anio_id, 10),
        asigna_estatus: asigna_estatus
    };

    const { error } = await AsignacionService.saveAsignacion(id, datos);

    if (error) { 
        mostrarMensaje('error', `Error al ${id ? 'actualizar' : 'crear'} asignación: ` + error.message); 
        return; 
    }

    mostrarMensaje('success', `Asignación ${id ? 'actualizada' : 'creada'} correctamente`);
    cerrarModalAsignacion();
    if (containerElement) cargarVistaAsignaciones(containerElement);
}

async function borrarAsignacion(e) {
    e.preventDefault();
    const id = document.getElementById('asigna-id').value;
    if (!id) return;

    if (!confirm(`¿Desea eliminar la asignación #${id}? Esta acción no se puede deshacer.`)) return;

    const { error } = await AsignacionService.deleteAsignacion(id);
    if (error) { 
        mostrarMensaje('error', 'Error al eliminar asignación: ' + error.message); 
        return; 
    }

    mostrarMensaje('success', 'Asignación eliminada correctamente');
    cerrarModalAsignacion();
    if (containerElement) cargarVistaAsignaciones(containerElement);
}

function limpiarFormularioAsignacion() {
    document.getElementById('asigna-id').value = '';
    document.getElementById('asigna-programa').value = '';
    document.getElementById('asigna-grado').value = '';
    document.getElementById('asigna-anio').value = '';
    document.getElementById('asigna-estatus').value = 'Activa';
    document.getElementById('asigna-programa').focus();
}
