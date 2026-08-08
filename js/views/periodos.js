import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { PeriodoService } from '../services.js';

let containerElement = null;

export async function cargarVistaPeriodos(container) {
    containerElement = container;
    container.innerHTML = '<div class="loading">Consultando periodos...</div>';

    const { data: periodos, error } = await PeriodoService.getPeriodos();

    if (error) {
        container.innerHTML = `<p class="error-msg">❌ Error al cargar periodos: ${error.message}</p>`;
        return;
    }

    const listaPeriodos = periodos || [];

    let htmlTemplate = `
        ${renderHeaderSeccion('periodos', 'Períodos', 'Años académicos por período.', `<div class="header-action-container"><button id="btn-nuevo-periodo" class="btn-header-action" aria-label="Añadir">+</button></div>`)}

        <div class="table-responsive">
            <table class="data-table" id="tabla-periodos">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Período</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                    </tr>
                </thead>
                <tbody>
                    ${listaPeriodos.map(a => `
                        <tr data-id="${a.id}" class="fila-periodo" style="cursor:pointer;">
                            <td data-label="ID"><strong># ${a.id}</strong></td>
                            <td data-label="Período" class="text-bold">${a.anio_periodo}</td>
                            <td data-label="Fecha Inicio"><span class="text-light">${a.anio_inicio || 'Sin inicio'}</span></td>
                            <td data-label="Fecha Fin"><span class="text-light">${a.anio_fin || 'Sin fin'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Modal Periodos -->
        <div id="modal-periodo" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-periodo-title">Período</h3>
                    <button id="modal-periodo-close" class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-periodo">
                        <input type="hidden" id="periodo-id">
                        
                        <div class="form-row">
                            <label>Nombre del Período (Ej: 2025-2026)</label>
                            <input id="periodo-nombre" type="text" placeholder="Ej. 2025-2026" required>
                        </div>

                        <div class="form-row">
                            <label>Fecha de Inicio</label>
                            <input id="periodo-inicio" type="date" required>
                        </div>

                        <div class="form-row">
                            <label>Fecha de Fin</label>
                            <input id="periodo-fin" type="date" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button id="btn-cancelar-periodo" class="btn-secondary">Cancelar</button>
                    <button id="btn-limpiar-periodo" class="btn-tertiary">Limpiar</button>
                    <button id="btn-borrar-periodo" class="btn-danger" style="display:none;">Eliminar</button>
                    <button id="btn-guardar-periodo" class="btn-primary">Guardar</button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = htmlTemplate;

    document.getElementById('btn-nuevo-periodo').addEventListener('click', () => abrirModalPeriodo());

    document.querySelectorAll('.fila-periodo').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: item } = await PeriodoService.getPeriodo(id);
            if (item) abrirModalPeriodo(item);
        });
    });

    document.getElementById('modal-periodo-close').addEventListener('click', () => cerrarModalPeriodo());
    document.getElementById('btn-guardar-periodo').addEventListener('click', guardarPeriodo);
    document.getElementById('btn-borrar-periodo').addEventListener('click', borrarPeriodo);
    document.getElementById('btn-cancelar-periodo').addEventListener('click', (e) => { e.preventDefault(); cerrarModalPeriodo(); });
    document.getElementById('btn-limpiar-periodo').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioPeriodo(); });
}

function abrirModalPeriodo(periodo = null) {
    const modal = document.getElementById('modal-periodo');
    const titulo = document.getElementById('modal-periodo-title');
    const inputId = document.getElementById('periodo-id');
    const inpNombre = document.getElementById('periodo-nombre');
    const inpInicio = document.getElementById('periodo-inicio');
    const inpFin = document.getElementById('periodo-fin');
    const btnBorrar = document.getElementById('btn-borrar-periodo');

    if (periodo) {
        titulo.textContent = `Período #${periodo.id}`;
        inputId.value = periodo.id;
        inpNombre.value = periodo.anio_periodo || '';
        inpInicio.value = periodo.anio_inicio || '';
        inpFin.value = periodo.anio_fin || '';
        btnBorrar.style.display = 'inline-block';
    } else {
        titulo.textContent = 'Nuevo Período';
        inputId.value = '';
        inpNombre.value = '';
        inpInicio.value = '';
        inpFin.value = '';
        btnBorrar.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function cerrarModalPeriodo() {
    const modal = document.getElementById('modal-periodo');
    if (modal) modal.style.display = 'none';
}

async function guardarPeriodo(e) {
    e.preventDefault();

    const id = document.getElementById('periodo-id').value;
    const anio_periodo = document.getElementById('periodo-nombre').value.trim();
    const anio_inicio = document.getElementById('periodo-inicio').value;
    const anio_fin = document.getElementById('periodo-fin').value;

    if (!anio_periodo) { mostrarMensaje('error', 'El nombre del período es requerido'); return; }
    if (!anio_inicio) { mostrarMensaje('error', 'La fecha de inicio es requerida'); return; }
    if (!anio_fin) { mostrarMensaje('error', 'La fecha de fin es requerida'); return; }

    if (new Date(anio_inicio) > new Date(anio_fin)) {
        mostrarMensaje('error', 'La fecha de inicio no puede ser posterior a la fecha de fin');
        return;
    }

    const payload = {
        anio_periodo: anio_periodo,
        anio_inicio: anio_inicio,
        anio_fin: anio_fin
    };

    const { error } = await PeriodoService.savePeriodo(id, payload);

    if (error) {
        mostrarMensaje('error', `Error al ${id ? 'actualizar' : 'crear'} el período: ` + error.message);
        return;
    }

    mostrarMensaje('success', `Período ${id ? 'actualizado' : 'creado'} con éxito`);
    cerrarModalPeriodo();
    if (containerElement) cargarVistaPeriodos(containerElement);
}

async function borrarPeriodo(e) {
    e.preventDefault();
    const id = document.getElementById('periodo-id').value;
    if (!id) return;

    if (!confirm(`¿Estás seguro de eliminar el período #${id}? Esta acción afectará los registros vinculados.`)) return;

    const { error } = await PeriodoService.deletePeriodo(id);
    if (error) { 
        mostrarMensaje('error', 'Error al eliminar el período: ' + error.message); 
        return; 
    }

    mostrarMensaje('success', 'Período eliminado correctamente');
    cerrarModalPeriodo();
    if (containerElement) cargarVistaPeriodos(containerElement);
}

function limpiarFormularioPeriodo() {
    document.getElementById('periodo-id').value = '';
    document.getElementById('periodo-nombre').value = '';
    document.getElementById('periodo-inicio').value = '';
    document.getElementById('periodo-fin').value = '';
    document.getElementById('periodo-nombre').focus();
}
