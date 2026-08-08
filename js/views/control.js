import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { ControlService, ProfesorService } from '../services.js';

let containerElement = null;
let todosProfesores = [];

export async function cargarVistaControl(container, filtrosPrevios = null) {
    containerElement = container;
    container.innerHTML = '<div class="loading">Consultando Ejecución de Clases...</div>';

    const [resVista, resProfesores] = await Promise.all([
        ControlService.getControlesVista(),
        ProfesorService.getProfesoresParaControl()
    ]);

    if (resVista.error) {
        container.innerHTML = `<p class="error-msg">❌ Error: ${resVista.error.message}</p>`;
        return;
    }

    if (resProfesores.error) {
        container.innerHTML = `<p class="error-msg">❌ Error al cargar profesores: ${resProfesores.error.message}</p>`;
        return;
    }

    todosProfesores = resProfesores.data || [];
    const vista_control = resVista.data || [];

    const mapaFotosProfesores = new Map();
    todosProfesores.forEach(p => {
        mapaFotosProfesores.set(p.id, p.profe_imagen_url);
    });

    const gradosUnicos = [...new Set(vista_control.map(n => n.grado_numero).filter(Boolean))].sort((a, b) => a - b);
    
    const mapaProgramas = new Map();
    vista_control.forEach(n => {
        if (n.programa_id && !mapaProgramas.has(n.programa_id)) {
            mapaProgramas.set(n.programa_id, n.programa_tema || `Programa ${n.programa_id}`);
        }
    });
    const programasOrdenados = Array.from(mapaProgramas.entries()).sort((a, b) => a[0] - b[0]);

    const estatusUnicos = [...new Set(vista_control.map(n => n.control_estatus).filter(Boolean))].sort();

    let htmlTemplate = `
    ${renderHeaderSeccion('control', 'Ejecución', 'Control de ejecución de clases.')}

    <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: flex-start;">
        <div style="flex: 1 1 100%; min-width: 140px;">
            <input type="text" id="filter-search" class="form-control" placeholder="Buscar Fecha, Clase o Profesor...">
        </div>
        <div style="width: 180px;">
            <select id="filter-grado" class="form-select">
                <option value="">Todos los Grados</option>
                ${gradosUnicos.map(grado => `<option value="${grado}">Grado ${grado}</option>`).join('')}
            </select>
        </div>
        <div style="width: 220px;">
            <select id="filter-programa" class="form-select">
                <option value="">Todos los Programas</option>
                ${programasOrdenados.map(([id, tema]) => `<option value="${id}" data-nombre="${tema}">${tema}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-estatus" class="form-select">
                <option value="">Todos los Estatus</option>
                ${estatusUnicos.map(e => `<option value="${e}">${e}</option>`).join('')}
            </select>
        </div>
    </div>

    <div class="table-responsive table-control-scroll">
        <table class="data-table" id="tabla-control">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th># Clase</th>
                    <th>Clase</th>
                    <th style="width: 90px; text-align: center;">Foto</th>
                    <th>Profesor</th>
                    <th>Observaciones</th>
                    <th># Estatus</th>
                </tr>
            </thead>
            <tbody>
                ${[...vista_control]
                    .sort((a, b) => {
                        const gradoA = parseInt(a.grado_numero, 10) || 0;
                        const gradoB = parseInt(b.grado_numero, 10) || 0;
                        if (gradoA !== gradoB) return gradoA - gradoB;
                        return (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0);
                    })
                    .map(n => {
                        const urlImagenBase = mapaFotosProfesores.get(n.profe_id);
                        const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                            ? urlImagenBase
                            : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n.profe_nombre || 'Profe')}&backgroundColor=4f46e5`;

                        return `
                        <tr 
                            data-id="${n.control_id}"
                            data-fecha="${n.control_fecha || ''}" 
                            data-grado="${n.grado_numero || ''}"
                            data-programa="${n.programa_id || ''}" 
                            data-clase-num="${n.clase_num || ''}"
                            data-clase-tema="${n.clase_tema || ''}" 
                            data-profesor="${n.profe_nombre || ''}" 
                            data-estatus="${n.control_estatus || ''}"
                            class="fila-control"
                            style="cursor: pointer;"
                        >
                            <td data-label="Fecha"><strong># ${n.control_fecha ?? 'Sin fecha'}</strong></td>
                            <td data-label="# Clase"><span class="text-light">${n.clase_num ?? ''}</span></td>
                            <td data-label="Clase"><span class="text-light">${n.clase_tema ?? ''}</span></td>
                            <td data-label="Foto" style="text-align: center;">
                                <img src="${fotoUrl}" alt="${n.profe_nombre || 'Profesor'}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Profe&backgroundColor=4f46e5'">
                            </td>
                            <td data-label="Profesor"><span class="text-light">${n.profe_nombre || 'Sin asignar'}</span></td>
                            <td data-label="Observaciones"><span class="text-light">${n.control_observaciones || ''}</span></td>
                            <td data-label="Estatus">
                                <span class="badge" style="background-color: ${n.control_estatus === 'Pendiente' ? '#ffc107' : n.control_estatus === 'Programada' ? '#198754' : n.control_estatus === 'Vista' ? '#dc3545' : '#6c757d'}; color: ${n.control_estatus === 'Pendiente' ? '#000000' : '#ffffff'};">
                                    ${n.control_estatus || 'Pendiente'}
                                </span>
                            </td>
                        </tr>
                        `;
                    }).join('')}
            </tbody>
        </table>
    </div>

    <div id="modal-control" class="modal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-control-title">Editar Ejecución de Clase</h3>
                <button id="modal-control-close" class="modal-close">✕</button>
            </div>
            <div class="modal-body">
                <form id="form-control">
                    <input type="hidden" id="control-id">

                    <div class="form-row">
                        <label>Fecha de Clase</label>
                        <input id="control-fecha" type="date" required>
                    </div>

                    <div class="form-row">
                        <label>Profesor (Filtrado por Grado)</label>
                        <select id="control-profe">
                            <option value="">-- Seleccionar Profesor --</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <label>Observaciones</label>
                        <textarea id="control-observ" rows="3" placeholder="Ingresa observaciones de la clase..."></textarea>
                    </div>

                    <div class="form-row">
                        <label>Estatus</label>
                        <select id="control-estatus" required>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Programada">Programada</option>
                            <option value="Vista">Vista</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button id="btn-cancelar-control" class="btn-secondary">Cancelar</button>
                <button id="btn-limpiar-control" class="btn-tertiary">Limpiar</button>
                <button id="btn-guardar-control" class="btn-primary">Guardar Cambios</button>
            </div>
        </div>
    </div>
    `;

    container.innerHTML = htmlTemplate;

    const inputSearch = document.getElementById('filter-search');
    const selectGrado = document.getElementById('filter-grado');
    const selectPrograma = document.getElementById('filter-programa');
    const selectEstatus = document.getElementById('filter-estatus');

    const aplicarFiltrosControl = () => {
        const textoBusqueda = (inputSearch?.value || '').toLowerCase();
        const gradoSel = selectGrado?.value || '';
        const programaSel = selectPrograma?.value || '';
        const estatusSel = selectEstatus?.value || '';

        const tituloHeader = document.getElementById('titulo-control-header');
        if (tituloHeader) {
            if (programaSel && selectPrograma.selectedIndex > 0) {
                const nombrePrograma = selectPrograma.options[selectPrograma.selectedIndex].getAttribute('data-nombre');
                tituloHeader.textContent = `Ejecución - ${nombrePrograma}`;
            } else {
                tituloHeader.textContent = 'Ejecución';
            }
        }

        const filas = document.querySelectorAll('#tabla-control tbody tr');

        filas.forEach(row => {
            const fecha = row.getAttribute('data-fecha').toLowerCase();
            const clase = (row.getAttribute('data-clase-tema') || '').toLowerCase();
            const profesor = row.getAttribute('data-profesor').toLowerCase();
            const grado = row.getAttribute('data-grado');
            const programa = row.getAttribute('data-programa');
            const estatus = row.getAttribute('data-estatus');

            const coincideTexto = !textoBusqueda || fecha.includes(textoBusqueda) || clase.includes(textoBusqueda) || profesor.includes(textoBusqueda);
            const coincideGrado = !gradoSel || grado === gradoSel;
            const coincidePrograma = !programaSel || programa === programaSel;
            const coincideEstatus = !estatusSel || estatus === estatusSel;

            if (coincideTexto && coincideGrado && coincidePrograma && coincideEstatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

    inputSearch?.addEventListener('input', aplicarFiltrosControl);
    selectGrado?.addEventListener('change', aplicarFiltrosControl);
    selectPrograma?.addEventListener('change', aplicarFiltrosControl);
    selectEstatus?.addEventListener('change', aplicarFiltrosControl);

    if (filtrosPrevios) {
        if (inputSearch) inputSearch.value = filtrosPrevios.texto;
        if (selectGrado) selectGrado.value = filtrosPrevios.grado;
        if (selectPrograma) selectPrograma.value = filtrosPrevios.programa;
        if (selectEstatus) selectEstatus.value = filtrosPrevios.estatus;
        
        aplicarFiltrosControl();
    }

    document.querySelectorAll('.fila-control').forEach(row => {
        row.addEventListener('click', async () => {
            const controlId = row.getAttribute('data-id');
            const claseNum = row.getAttribute('data-clase-num') || '';
            const claseTema = row.getAttribute('data-clase-tema') || '';

            const { data: regControl, error: errControl } = await ControlService.getControlConAsignacion(controlId);

            if (errControl || !regControl) {
                mostrarMensaje('error', 'Error al obtener datos del registro.');
                return;
            }

            const gradoIdClase = regControl.asignaciones ? regControl.asignaciones.grado_id : null;
            const profesoresDelGrado = todosProfesores.filter(p => p.grado_id === gradoIdClase);

            abrirModalControl(regControl, profesoresDelGrado, claseNum, claseTema);
        });
    });

    document.getElementById('modal-control-close').addEventListener('click', () => cerrarModalControl());
    document.getElementById('btn-guardar-control').addEventListener('click', guardarControl);
    document.getElementById('btn-cancelar-control').addEventListener('click', (e) => { e.preventDefault(); cerrarModalControl(); });
    document.getElementById('btn-limpiar-control').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioControl(); });
}

function obtenerEstadoFiltros() {
    return {
        texto: document.getElementById('filter-search')?.value || '',
        grado: document.getElementById('filter-grado')?.value || '',
        programa: document.getElementById('filter-programa')?.value || '',
        estatus: document.getElementById('filter-estatus')?.value || ''
    };
}

function abrirModalControl(registro, profesoresDisponibles, claseNum = '', claseTema = '') {
    const modal = document.getElementById('modal-control');
    const titulo = document.getElementById('modal-control-title');
    const inputId = document.getElementById('control-id');
    const inpFecha = document.getElementById('control-fecha');
    const selProfe = document.getElementById('control-profe');
    const txtObserv = document.getElementById('control-observ');
    const selEstatus = document.getElementById('control-estatus');

    const infoClase = claseNum ? `Clase #${claseNum}: ` : '';
    titulo.textContent = `${infoClase}${claseTema || 'Editar Clase'}`;

    inputId.value = registro.id;
    inpFecha.value = registro.control_fecha || '';
    txtObserv.value = registro.control_observ || '';
    selEstatus.value = registro.control_estatus || 'Pendiente';

    if (profesoresDisponibles && profesoresDisponibles.length > 0) {
        selProfe.innerHTML = '<option value="">-- Seleccionar Profesor --</option>' +
            profesoresDisponibles.map(p => `<option value="${p.id}">${p.profe_nombre}</option>`).join('');
    } else {
        selProfe.innerHTML = '<option value="">-- No hay profesores registrados para este grado --</option>';
    }

    selProfe.value = registro.profe_id || '';
    modal.style.display = 'flex';
}

function cerrarModalControl() {
    const modal = document.getElementById('modal-control');
    if (modal) modal.style.display = 'none';
}

async function guardarControl(e) {
    e.preventDefault();

    const id = document.getElementById('control-id').value;
    const control_fecha = document.getElementById('control-fecha').value || null;
    const profe_id_val = document.getElementById('control-profe').value;
    const control_observ = document.getElementById('control-observ').value.trim();
    const control_estatus = document.getElementById('control-estatus').value;

    if (!id) return;

    const filtrosActuales = obtenerEstadoFiltros();

    const payload = {
        control_fecha: control_fecha,
        profe_id: profe_id_val ? parseInt(profe_id_val, 10) : null,
        control_observ: control_observ || null,
        control_estatus: control_estatus
    };

    const { error } = await ControlService.saveControl(id, payload);

    if (error) {
        mostrarMensaje('error', 'Error al actualizar el registro: ' + error.message);
        return;
    }

    mostrarMensaje('success', 'Registro de ejecución actualizado correctamente');
    cerrarModalControl();

    if (containerElement) cargarVistaControl(containerElement, filtrosActuales);
}

function limpiarFormularioControl() {
    document.getElementById('control-fecha').value = '';
    document.getElementById('control-profe').value = '';
    document.getElementById('control-observ').value = '';
    document.getElementById('control-estatus').value = 'Pendiente';
    document.getElementById('control-fecha').focus();
}
