import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { ProfesorService, GradoService } from '../services.js';

let containerElement = null;
let editandoProfeId = null;

export async function cargarVistaProfesores(container) {
    containerElement = container;
    container.innerHTML = '<div class="loading">Consultando Profesores...</div>';

    const [resProfesores, resGrados] = await Promise.all([
        ProfesorService.getProfesores(),
        GradoService.getGrados()
    ]);

    if (resProfesores.error) {
        container.innerHTML = `<p class="error-msg">❌ Error: ${resProfesores.error.message}</p>`;
        return;
    }

    if (resGrados.error) {
        container.innerHTML = `<p class="error-msg">❌ Error (grados): ${resGrados.error.message}</p>`;
        return;
    }

    const profesores = resProfesores.data || [];
    const grados = resGrados.data || [];
    const gradosById = new Map(grados.map(g => [String(g.id), g.grado_nombre]));
    const opcionesGrados = grados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('');

    profesores.sort((a, b) => (a.id || 0) - (b.id || 0));

    const gradosDeProfesores = [...new Set(
        profesores.map(p => gradosById.get(String(p.grado_id)) || (p.grado_id ? `#${p.grado_id}` : 'Sin grado')).filter(Boolean)
    )].sort();

    let htmlTemplate = `
        ${renderHeaderSeccion('profesores', 'Profesores', 'Información general y gestión de profesores.', `<div class="header-action-container"><button id="btn-nuevo-profesor" class="btn-header-action" aria-label="Añadir">+</button></div>`)}

        <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: center;">
            <div style="width: 220px;">
                <select id="filter-grado-profesores" class="form-select">
                    <option value="">Todos los Grados</option>
                    ${gradosDeProfesores.map(grado => `<option value="${grado}">${grado}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="table-responsive table-profesores-scroll">
            <table class="data-table" id="tabla-profesores">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th style="width: 90px; text-align: center;">Foto</th>
                        <th>Grado</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Estatus</th>
                        <th>Rol</th>
                    </tr>
                </thead>
                <tbody>
                    ${profesores.map(p => {
                        const fotoUrl = p.profe_imagen_url && p.profe_imagen_url.trim() !== ''
                            ? p.profe_imagen_url
                            : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.profe_nombre)}&backgroundColor=4f46e5`;

                        const nombreGrado = gradosById.get(String(p.grado_id)) || (p.grado_id ? `#${p.grado_id}` : 'Sin grado');

                        return `
                        <tr data-id="${p.id}" data-grado="${nombreGrado}" class="fila-profesor" style="cursor: pointer;">
                            <td data-label="ID"><strong># ${p.id}</strong></td>
                            <td data-label="Foto" style="text-align: center;">
                                <img src="${fotoUrl}" alt="${p.profe_nombre}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Profe&backgroundColor=4f46e5'">
                            </td>
                            <td data-label="Grado"><span class="badge" style="background-color: #e0e7ff; color: #3730a3;">${nombreGrado}</span></td>
                            <td data-label="Nombre" class="text-bold">${p.profe_nombre}</td>
                            <td data-label="Email"><span class="text-light">${p.profe_email || '-'}</span></td>
                            <td data-label="Teléfono"><span class="text-light">${p.profe_telf || '-'}</span></td>
                            <td data-label="Estatus">
                                <span class="badge" style="background-color: ${p.profe_estatus === 'Activo' ? '#c7f9cc' : '#ffccd5'}; color: #000;">
                                    ${p.profe_estatus || 'N/A'}
                                </span>
                            </td>
                            <td data-label="Rol"><span class="text-light">${p.profe_rol || '-'}</span></td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div id="modal-profesor" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-profesor-title">Profesor</h3>
                    <button id="modal-profesor-close" class="modal-close">✕</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form id="form-profesor">
                        <div class="form-row">
                            <label>Nombre Completo *</label>
                            <input id="profe-nombre" type="text" required placeholder="Nombre del profesor">
                        </div>
                        <div class="form-row">
                            <label>Grado Asignado</label>
                            <select id="profe-grado">
                                <option value="">-- Seleccionar Grado --</option>
                                ${opcionesGrados}
                            </select>
                        </div>
                        <div class="form-row">
                            <label>Correo Electrónico</label>
                            <input id="profe-email" type="email" placeholder="profesor@ejemplo.com">
                        </div>
                        <div class="form-row">
                            <label>Teléfono</label>
                            <input id="profe-telf" type="tel" placeholder="Ej: +58 412 0000000">
                        </div>
                        <div class="form-row">
                            <label>Estatus</label>
                            <select id="profe-estatus">
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>Rol</label>
                            <input id="profe-rol" type="text" placeholder="Ej: Titular, Auxiliar, Coordinador">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button id="btn-cancelar-profesor" class="btn-secondary">Cancelar</button>
                    <button id="btn-limpiar-profesor" class="btn-tertiary">Limpiar</button>
                    <button id="btn-borrar-profesor" class="btn-danger" style="display:none;">Eliminar</button>
                    <button id="btn-guardar-profesor" class="btn-primary">Guardar</button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = htmlTemplate;

    document.getElementById('btn-nuevo-profesor').addEventListener('click', () => abrirModalProfesor());

    document.querySelectorAll('.fila-profesor').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: profe } = await ProfesorService.getProfesor(id);
            if (profe) abrirModalProfesor(profe);
        });
    });

    document.getElementById('modal-profesor-close').addEventListener('click', () => cerrarModalProfesor());
    document.getElementById('btn-guardar-profesor').addEventListener('click', guardarProfesor);
    document.getElementById('btn-borrar-profesor').addEventListener('click', borrarProfesor);
    document.getElementById('btn-cancelar-profesor').addEventListener('click', (e) => { e.preventDefault(); cerrarModalProfesor(); });
    document.getElementById('btn-limpiar-profesor').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioProfesor(); });

    const filterGrado = document.getElementById('filter-grado-profesores');
    filterGrado?.addEventListener('change', () => {
        const gradoSel = filterGrado.value || '';
        const filas = document.querySelectorAll('#tabla-profesores tbody tr');
        filas.forEach(f => {
            const gradoFila = f.getAttribute('data-grado') || '';
            if (gradoSel === '' || gradoFila === gradoSel) {
                f.style.display = '';
            } else {
                f.style.display = 'none';
            }
        });
    });
}

function abrirModalProfesor(profe = null) {
    const modal = document.getElementById('modal-profesor');
    const titulo = document.getElementById('modal-profesor-title');
    const inpNombre = document.getElementById('profe-nombre');
    const selGrado = document.getElementById('profe-grado');
    const inpEmail = document.getElementById('profe-email');
    const inpTelf = document.getElementById('profe-telf');
    const selEstatus = document.getElementById('profe-estatus');
    const inpRol = document.getElementById('profe-rol');
    const btnBorrar = document.getElementById('btn-borrar-profesor');

    if (profe) {
        editandoProfeId = profe.id;
        titulo.textContent = `Profesor #${profe.id}`;
        inpNombre.value = profe.profe_nombre || '';
        selGrado.value = profe.grado_id || '';
        inpEmail.value = profe.profe_email || '';
        inpTelf.value = profe.profe_telf || '';
        selEstatus.value = profe.profe_estatus || 'Activo';
        inpRol.value = profe.profe_rol || '';
        btnBorrar.style.display = '';
    } else {
        editandoProfeId = null;
        titulo.textContent = 'Nuevo Profesor';
        inpNombre.value = '';
        selGrado.value = '';
        inpEmail.value = '';
        inpTelf.value = '';
        selEstatus.value = 'Activo';
        inpRol.value = '';
        btnBorrar.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function cerrarModalProfesor() {
    const modal = document.getElementById('modal-profesor');
    if (modal) modal.style.display = 'none';
}

async function guardarProfesor(e) {
    e.preventDefault();
    const nombre = document.getElementById('profe-nombre').value.trim();
    const grado_id = document.getElementById('profe-grado').value || null;
    const email = document.getElementById('profe-email').value.trim() || null;
    const telf = document.getElementById('profe-telf').value.trim() || null;
    const estatus = document.getElementById('profe-estatus').value;
    const rol = document.getElementById('profe-rol').value.trim() || null;

    if (!nombre) { mostrarMensaje('error', 'El nombre del profesor es obligatorio'); return; }

    const payload = {
        profe_nombre: nombre,
        grado_id: grado_id ? parseInt(grado_id, 10) : null,
        profe_email: email,
        profe_telf: telf,
        profe_estatus: estatus,
        profe_rol: rol
    };

    if (editandoProfeId) {
        const { error } = await ProfesorService.saveProfesor(editandoProfeId, payload);
        if (error) { mostrarMensaje('error', 'Error al actualizar profesor: ' + error.message); return; }
        mostrarMensaje('success', 'Profesor actualizado correctamente');
    } else {
        const { data: ultimoProfe, error: errorMax } = await ProfesorService.getUltimoProfesor();

        if (errorMax) {
            mostrarMensaje('error', 'Error al obtener correlativo de ID: ' + errorMax.message);
            return;
        }

        const siguienteId = ultimoProfe ? Number(ultimoProfe.id) + 1 : 1;
        payload.id = siguienteId;

        const { error } = await ProfesorService.saveProfesor(null, payload);

        if (error) { mostrarMensaje('error', 'Error al crear profesor: ' + error.message); return; }
        mostrarMensaje('success', `Profesor #${siguienteId} registrado correctamente`);
    }

    cerrarModalProfesor();
    if (containerElement) cargarVistaProfesores(containerElement);
}

async function borrarProfesor(e) {
    e.preventDefault();
    if (!editandoProfeId) return;

    if (!confirm(`¿Deseas eliminar al profesor #${editandoProfeId}? Esta acción no se puede deshacer.`)) return;

    const { error } = await ProfesorService.deleteProfesor(editandoProfeId);

    if (error) { mostrarMensaje('error', 'Error al eliminar profesor: ' + error.message); return; }
    mostrarMensaje('success', 'Profesor eliminado correctamente');

    cerrarModalProfesor();
    if (containerElement) cargarVistaProfesores(containerElement);
}

function limpiarFormularioProfesor() {
    document.getElementById('profe-nombre').value = '';
    document.getElementById('profe-grado').value = '';
    document.getElementById('profe-email').value = '';
    document.getElementById('profe-telf').value = '';
    document.getElementById('profe-estatus').value = 'Activo';
    document.getElementById('profe-rol').value = '';
    document.getElementById('profe-nombre').focus();
}
