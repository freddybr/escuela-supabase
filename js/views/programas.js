import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { ProgramaService, MateriaService } from '../services.js';

let containerElement = null;

export async function cargarVistaProgramas(container) {
    containerElement = container;
    container.innerHTML = '<div class="loading">Consultando Programas...</div>';

    const [resProgramas, resMaterias] = await Promise.all([
        ProgramaService.getProgramas(),
        MateriaService.getMaterias()
    ]);

    if (resProgramas.error) {
        container.innerHTML = `<p class="error-msg">❌ Error: ${resProgramas.error.message}</p>`;
        return;
    }

    if (resMaterias.error) {
        container.innerHTML = `<p class="error-msg">❌ Error (materias): ${resMaterias.error.message}</p>`;
        return;
    }

    const programas = resProgramas.data || [];
    const materias = resMaterias.data || [];
    const materiasById = new Map(materias.map(m => [String(m.id), m.materia_nombre]));
    const opcionesMaterias = materias.map(m => `<option value="${m.id}">${m.materia_nombre}</option>`).join('');

    let htmlTemplate = `
        ${renderHeaderSeccion('programas', 'Programas', 'Contenido de programas.', `<div class="header-action-container"><button id="btn-nuevo-programa" class="btn-header-action" aria-label="Añadir">+</button></div>`)}
        <div class="table-responsive">
            <table class="data-table" id="tabla-programas">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Materia</th>
                        <th>Programa</th>
                        <th>Objetivo</th>
                        <th>Versículo</th>
                        <th>Estatus</th>
                    </tr>
                </thead>
                <tbody>
                    ${programas.map(p => {
                        const nombreMateria = materiasById.get(String(p.materia_id)) || (p.materia_id ? `#${p.materia_id}` : 'Sin materia');
                        return `
                        <tr data-id="${p.id}" class="fila-programa" style="cursor: pointer;">
                            <td data-label="ID"><strong># ${p.id}</strong></td>
                            <td data-label="Materia" class="text-bold">${nombreMateria}</td>
                            <td data-label="Programa" class="text-bold">${p.programa_tema}</td>
                            <td data-label="Objetivo"><span class="text-light">${p.programa_objetivo}</span></td>
                            <td data-label="Versículo"><span class="text-light">${p.programa_texto}</span></td>
                            <td data-label="Estatus">
                                <span class="badge" style="background-color: ${p.programa_estatus === 'Disponible' ? '#c7f9cc' : '#ffe3e0'}; color: #000;">
                                    ${p.programa_estatus}
                                </span>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div id="modal-programa" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-programa-title">Programa</h3>
                    <button id="modal-programa-close" class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-programa">
                        <input type="hidden" id="programa-id">
                        <div class="form-row">
                            <label>Materia</label>
                            <select id="programa-materia" required>
                                <option value="">-- Seleccionar Materia --</option>
                                ${opcionesMaterias}
                            </select>
                        </div>
                        <div class="form-row">
                            <label>Programa (Título)</label>
                            <input id="programa-tema" type="text" required>
                        </div>
                        <div class="form-row">
                            <label>Objetivo</label>
                            <textarea id="programa-objetivo" rows="3"></textarea>
                        </div>
                        <div class="form-row">
                            <label>Versículo / Texto</label>
                            <textarea id="programa-texto" rows="3"></textarea>
                        </div>
                        <div class="form-row">
                            <label>Estatus</label>
                            <select id="programa-estatus" required>
                                <option value="Disponible">Disponible</option>
                                <option value="Elaborando">Elaborando</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button id="btn-cancelar-programa" class="btn-secondary">Cancelar</button>
                    <button id="btn-limpiar-programa" class="btn-tertiary">Limpiar</button>
                    <button id="btn-borrar-programa" class="btn-danger" style="display:none;">Eliminar</button>
                    <button id="btn-guardar-programa" class="btn-primary">Guardar</button>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = htmlTemplate;

    document.getElementById('btn-nuevo-programa').addEventListener('click', () => abrirModalPrograma());

    document.querySelectorAll('.fila-programa').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: prog } = await ProgramaService.getPrograma(id);
            if (prog) abrirModalPrograma(prog);
        });
    });

    document.getElementById('modal-programa-close').addEventListener('click', () => cerrarModalPrograma());
    document.getElementById('btn-guardar-programa').addEventListener('click', guardarPrograma);
    document.getElementById('btn-borrar-programa').addEventListener('click', borrarPrograma);
    document.getElementById('btn-cancelar-programa').addEventListener('click', (ev) => { ev.preventDefault(); cerrarModalPrograma(); });
    document.getElementById('btn-limpiar-programa').addEventListener('click', (ev) => { ev.preventDefault(); limpiarFormularioPrograma(); });
}

function abrirModalPrograma(programa = null) {
    const modal = document.getElementById('modal-programa');
    const titulo = document.getElementById('modal-programa-title');
    const inputId = document.getElementById('programa-id');
    const selMateria = document.getElementById('programa-materia');
    const inpTema = document.getElementById('programa-tema');
    const inpObjetivo = document.getElementById('programa-objetivo');
    const inpTexto = document.getElementById('programa-texto');
    const selEstatus = document.getElementById('programa-estatus');
    const btnBorrar = document.getElementById('btn-borrar-programa');

    if (programa) {
        titulo.textContent = `Programa #${programa.id}`;
        inputId.value = programa.id;
        selMateria.value = programa.materia_id || '';
        inpTema.value = programa.programa_tema || '';
        inpObjetivo.value = programa.programa_objetivo || '';
        inpTexto.value = programa.programa_texto || '';
        selEstatus.value = programa.programa_estatus || 'Disponible';
        btnBorrar.style.display = '';
    } else {
        titulo.textContent = 'Nuevo Programa';
        inputId.value = '';
        selMateria.value = '';
        inpTema.value = '';
        inpObjetivo.value = '';
        inpTexto.value = '';
        selEstatus.value = 'Disponible';
        btnBorrar.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function cerrarModalPrograma() {
    const modal = document.getElementById('modal-programa');
    if (modal) modal.style.display = 'none';
}

async function guardarPrograma(e) {
    e.preventDefault();
    const id = document.getElementById('programa-id').value;
    const materia_id = document.getElementById('programa-materia').value;
    const tema = document.getElementById('programa-tema').value.trim();
    const objetivo = document.getElementById('programa-objetivo').value.trim();
    const texto = document.getElementById('programa-texto').value.trim();
    const estatus = document.getElementById('programa-estatus').value;

    if (!materia_id) { mostrarMensaje('error', 'Seleccione una materia'); return; }
    if (!tema) { mostrarMensaje('error', 'El título del programa es obligatorio'); return; }
    if (!['Disponible','Elaborando'].includes(estatus)) { mostrarMensaje('error', 'Estatus inválido'); return; }

    const payload = { materia_id: materia_id, programa_tema: tema, programa_objetivo: objetivo, programa_texto: texto, programa_estatus: estatus };
    const { error } = await ProgramaService.savePrograma(id, payload);

    if (error) {
        mostrarMensaje('error', `Error al ${id ? 'actualizar' : 'crear'} programa: ` + error.message);
        return;
    }

    mostrarMensaje('success', `Programa ${id ? 'actualizado' : 'creado'} correctamente`);
    cerrarModalPrograma();
    if (containerElement) cargarVistaProgramas(containerElement);
}

async function borrarPrograma(e) {
    e.preventDefault();
    const id = document.getElementById('programa-id').value;
    if (!id) return;
    if (!confirm('¿Eliminar este programa? Esta acción no se puede deshacer.')) return;

    const { error } = await ProgramaService.deletePrograma(id);
    if (error) { mostrarMensaje('error', 'Error al eliminar programa: ' + error.message); return; }
    mostrarMensaje('success', 'Programa eliminado correctamente');

    cerrarModalPrograma();
    if (containerElement) cargarVistaProgramas(containerElement);
}

function limpiarFormularioPrograma() {
    document.getElementById('programa-id').value = '';
    document.getElementById('programa-materia').value = '';
    document.getElementById('programa-tema').value = '';
    document.getElementById('programa-objetivo').value = '';
    document.getElementById('programa-texto').value = '';
    document.getElementById('programa-estatus').value = 'Disponible';
    document.getElementById('programa-materia').focus();
}
