import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { MateriaService } from '../services.js';

let containerElement = null;

export async function cargarVistaMaterias(container) {
    containerElement = container;
    container.innerHTML = '<div class="loading">Consultando materias...</div>';

    const { data: materias, error } = await MateriaService.getMaterias();

    if (error) {
        container.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    let htmlTemplate = `
        ${renderHeaderSeccion('materias', 'Materias', 'Disciplinas académicas del diseño curricular.', `<div class="header-action-container"><button id="btn-nueva-materia" class="btn-header-action" aria-label="Añadir">+</button></div>`)}
        <div class="table-responsive">
            <table class="data-table" id="tabla-materias">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Descripción Académica</th>
                    </tr>
                </thead>
                <tbody>
                    ${materias.map(m => `
                        <tr data-id="${m.id}" class="fila-materia" style="cursor: pointer;">
                            <td data-label="Código"><strong># ${m.id}</strong></td>
                            <td data-label="Nombre" class="text-bold">${m.materia_nombre}</td>
                            <td data-label="Descripción">${m.materia_descripcion || 'Sin descripción'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div id="modal-materia" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-title">Materia</h3>
                    <button id="modal-close" class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-materia">
                        <input type="hidden" id="materia-id">
                        <div class="form-row">
                            <label>Nombre</label>
                            <input id="materia-nombre" type="text" required>
                        </div>
                        <div class="form-row">
                            <label>Descripción</label>
                            <textarea id="materia-descripcion" rows="4"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button id="btn-cancelar-materia" class="btn-secondary">Cancelar</button>
                    <button id="btn-limpiar-materia" class="btn-tertiary">Limpiar</button>
                    <button id="btn-borrar-materia" class="btn-danger" style="display:none;">Eliminar</button>
                    <button id="btn-guardar-materia" class="btn-primary">Guardar</button>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = htmlTemplate;

    document.getElementById('btn-nueva-materia').addEventListener('click', () => abrirModalMateria());

    document.querySelectorAll('.fila-materia').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: materia } = await MateriaService.getMateria(id);
            if (materia) abrirModalMateria(materia);
        });
    });

    document.getElementById('modal-close').addEventListener('click', cerrarModalMateria);
    document.getElementById('btn-guardar-materia').addEventListener('click', guardarMateria);
    document.getElementById('btn-borrar-materia').addEventListener('click', borrarMateria);
    document.getElementById('btn-cancelar-materia').addEventListener('click', (ev) => { ev.preventDefault(); cerrarModalMateria(); });
    document.getElementById('btn-limpiar-materia').addEventListener('click', (ev) => { ev.preventDefault(); limpiarFormularioMateria(); });
}

function abrirModalMateria(materia = null) {
    const modal = document.getElementById('modal-materia');
    const titulo = document.getElementById('modal-title');
    const inputId = document.getElementById('materia-id');
    const inputNombre = document.getElementById('materia-nombre');
    const inputDesc = document.getElementById('materia-descripcion');
    const btnBorrar = document.getElementById('btn-borrar-materia');

    if (materia) {
        titulo.textContent = `Materia #${materia.id}`;
        inputId.value = materia.id;
        inputNombre.value = materia.materia_nombre || '';
        inputDesc.value = materia.materia_descripcion || '';
        btnBorrar.style.display = '';
    } else {
        titulo.textContent = 'Nueva Materia';
        inputId.value = '';
        inputNombre.value = '';
        inputDesc.value = '';
        btnBorrar.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function cerrarModalMateria() {
    const modal = document.getElementById('modal-materia');
    if (modal) modal.style.display = 'none';
}

async function guardarMateria(e) {
    e.preventDefault();
    const id = document.getElementById('materia-id').value;
    const nombre = document.getElementById('materia-nombre').value.trim();
    const descripcion = document.getElementById('materia-descripcion').value.trim();

    if (!nombre) {
        mostrarMensaje('error', 'El nombre es obligatorio');
        return;
    }

    const payload = { materia_nombre: nombre, materia_descripcion: descripcion };
    const { error } = await MateriaService.saveMateria(id, payload);

    if (error) {
        mostrarMensaje('error', `Error al ${id ? 'actualizar' : 'crear'} materia: ` + error.message);
        return;
    }

    mostrarMensaje('success', `Materia ${id ? 'actualizada' : 'creada'} correctamente`);
    cerrarModalMateria();
    if (containerElement) cargarVistaMaterias(containerElement);
}

async function borrarMateria(e) {
    e.preventDefault();
    const id = document.getElementById('materia-id').value;
    if (!id) return;
    if (!confirm('¿Eliminar esta materia? Esta acción no se puede deshacer.')) return;

    const { error } = await MateriaService.deleteMateria(id);
    if (error) {
        mostrarMensaje('error', 'Error al eliminar materia: ' + error.message);
        return;
    }
    mostrarMensaje('success', 'Materia eliminada correctamente');

    cerrarModalMateria();
    if (containerElement) cargarVistaMaterias(containerElement);
}

function limpiarFormularioMateria() {
    document.getElementById('materia-id').value = '';
    document.getElementById('materia-nombre').value = '';
    document.getElementById('materia-descripcion').value = '';
    document.getElementById('materia-nombre').focus();
}
