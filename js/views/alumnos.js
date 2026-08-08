import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { AlumnoService, GradoService } from '../services.js';

let containerElement = null;
let editandoId = null;

export async function cargarVistaAlumnos(container) {
    containerElement = container;
    container.innerHTML = '<div class="loading">Consultando Alumnos...</div>';

    const [resAlumnos, resGrados] = await Promise.all([
        AlumnoService.getAlumnos(),
        GradoService.getGrados()
    ]);

    if (resAlumnos.error) {
        container.innerHTML = `<p class="error-msg">❌ Error: ${resAlumnos.error.message}</p>`;
        return;
    }

    if (resGrados.error) {
        container.innerHTML = `<p class="error-msg">❌ Error (grados): ${resGrados.error.message}</p>`;
        return;
    }

    const alumnos = resAlumnos.data || [];
    const grados = resGrados.data || [];
    const gradosById = new Map(grados.map(g => [String(g.id), g.grado_nombre]));
    const opcionesGrados = grados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('');

    alumnos.sort((a, b) => (a.id || 0) - (b.id || 0));

    const gradosDeAlumnos = [...new Set(
        alumnos.map(a => gradosById.get(String(a.grado_id)) || (a.grado_id ? `#${a.grado_id}` : 'Sin grado')).filter(Boolean)
    )].sort();

    let htmlTemplate = `
        ${renderHeaderSeccion('alumnos', 'Alumnos', 'Información general y gestión de alumnos.', `<div class="header-action-container"><button id="btn-nuevo-alumno" class="btn-header-action" aria-label="Añadir">+</button></div>`) }

        <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: center;">
            <div style="width: 220px;">
                <select id="filter-grado-alumnos" class="form-select">
                    <option value="">Todos los Grados</option>
                    ${gradosDeAlumnos.map(grado => `<option value="${grado}">${grado}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="table-responsive table-alumnos-scroll">
            <table class="data-table" id="tabla-alumnos">
                <thead> 
                    <tr>
                        <th>ID</th>
                        <th style="width: 90px; text-align: center;">Foto</th>
                        <th>Nombre</th>
                        <th>Grado</th>
                        <th>Email</th>
                        <th>Nacimiento</th>
                        <th>Sexo</th>
                        <th>Representante</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                    </tr>
                </thead>
                <tbody>
                    ${alumnos.map(a => {
                        const fotoUrl = a.alumno_imagen_url && a.alumno_imagen_url.trim() !== ''
                            ? a.alumno_imagen_url
                            : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.alumno_nombre)}&backgroundColor=0284c7`;

                        const nombreGrado = gradosById.get(String(a.grado_id)) || (a.grado_id ? `#${a.grado_id}` : 'Sin grado');

                        return `
                        <tr data-id="${a.id}" data-grado="${nombreGrado}" class="fila-alumno" style="cursor: pointer;">
                            <td data-label="ID"><strong># ${a.id}</strong></td>
                            <td data-label="Foto" style="text-align: center;">
                                <img src="${fotoUrl}" alt="${a.alumno_nombre}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Alumno&backgroundColor=0284c7'">
                            </td>
                            <td data-label="Nombre" class="text-bold">${a.alumno_nombre}</td>
                            <td data-label="Grado"><span class="badge" style="background-color: #e0e7ff; color: #3730a3;">${nombreGrado}</span></td>
                            <td data-label="Email"><span class="text-light">${a.alumno_email || '-'}</span></td>
                            <td data-label="Nacimiento"><span class="text-light">${a.alumno_birthday || '-'}</span></td>
                            <td data-label="Sexo">
                                <span class="badge" style="background-color: ${a.alumno_sexo === 'Masculino' ? '#bde0fe' : '#ffafcc'}; color: #000;">
                                    ${a.alumno_sexo || 'N/A'}
                                </span>
                            </td>
                            <td data-label="Representante"><span class="text-light">${a.alumno_representante || '-'}</span></td>
                            <td data-label="Teléfono"><span class="text-light">${a.alumno_telf || '-'}</span></td>
                            <td data-label="Dirección"><span class="text-light">${a.alumno_direccion || '-'}</span></td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div id="modal-alumno" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-alumno-title">Alumno</h3>
                    <button id="modal-alumno-close" class="modal-close">✕</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form id="form-alumno">
                        <div class="form-row">
                            <label>Nombre Completo *</label>
                            <input id="alumno-nombre" type="text" required placeholder="Nombre del alumno">
                        </div>
                        <div class="form-row">
                            <label>Grado *</label>
                            <select id="alumno-grado" required>
                                <option value="">-- Seleccionar Grado --</option>
                                ${opcionesGrados}
                            </select>
                        </div>
                        <div class="form-row">
                            <label>Correo Electrónico</label>
                            <input id="alumno-email" type="email" placeholder="correo@ejemplo.com">
                        </div>
                        <div class="form-row">
                            <label>Fecha de Nacimiento</label>
                            <input id="alumno-birthday" type="date">
                        </div>
                        <div class="form-row">
                            <label>Sexo</label>
                            <select id="alumno-sexo">
                                <option value="">-- Seleccionar Sexo --</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>Representante</label>
                            <input id="alumno-representante" type="text" placeholder="Nombre del representante">
                        </div>
                        <div class="form-row">
                            <label>Teléfono</label>
                            <input id="alumno-telf" type="tel" placeholder="Ej: +58 412 0000000">
                        </div>
                        <div class="form-row">
                            <label>Dirección</label>
                            <textarea id="alumno-direccion" rows="2" placeholder="Dirección de residencia"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button id="btn-cancelar-alumno" class="btn-secondary">Cancelar</button>
                    <button id="btn-limpiar-alumno" class="btn-tertiary">Limpiar</button>
                    <button id="btn-borrar-alumno" class="btn-danger" style="display:none;">Eliminar</button>
                    <button id="btn-guardar-alumno" class="btn-primary">Guardar</button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = htmlTemplate;

    document.getElementById('btn-nuevo-alumno').addEventListener('click', () => abrirModalAlumno());

    document.querySelectorAll('.fila-alumno').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: alumno } = await AlumnoService.getAlumno(id);
            if (alumno) abrirModalAlumno(alumno);
        });
    });

    document.getElementById('modal-alumno-close').addEventListener('click', () => cerrarModalAlumno());
    document.getElementById('btn-guardar-alumno').addEventListener('click', guardarAlumno);
    document.getElementById('btn-borrar-alumno').addEventListener('click', borrarAlumno);
    document.getElementById('btn-cancelar-alumno').addEventListener('click', (e) => { e.preventDefault(); cerrarModalAlumno(); });
    document.getElementById('btn-limpiar-alumno').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioAlumno(); });

    const filterGrado = document.getElementById('filter-grado-alumnos');
    filterGrado?.addEventListener('change', () => {
        const gradoSel = filterGrado.value || '';
        const filas = document.querySelectorAll('#tabla-alumnos tbody tr');
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

function abrirModalAlumno(alumno = null) {
    const modal = document.getElementById('modal-alumno');
    const titulo = document.getElementById('modal-alumno-title');
    const inpNombre = document.getElementById('alumno-nombre');
    const selGrado = document.getElementById('alumno-grado');
    const inpEmail = document.getElementById('alumno-email');
    const inpBirthday = document.getElementById('alumno-birthday');
    const selSexo = document.getElementById('alumno-sexo');
    const inpRepresentante = document.getElementById('alumno-representante');
    const inpTelf = document.getElementById('alumno-telf');
    const inpDireccion = document.getElementById('alumno-direccion');
    const btnBorrar = document.getElementById('btn-borrar-alumno');

    if (alumno) {
        editandoId = alumno.id;
        titulo.textContent = `Alumno #${alumno.id}`;
        inpNombre.value = alumno.alumno_nombre || '';
        selGrado.value = alumno.grado_id || '';
        inpEmail.value = alumno.alumno_email || '';
        inpBirthday.value = alumno.alumno_birthday || '';
        selSexo.value = alumno.alumno_sexo || '';
        inpRepresentante.value = alumno.alumno_representante || '';
        inpTelf.value = alumno.alumno_telf || '';
        inpDireccion.value = alumno.alumno_direccion || '';
        btnBorrar.style.display = '';
    } else {
        editandoId = null;
        titulo.textContent = 'Nuevo Alumno';
        inpNombre.value = '';
        selGrado.value = '';
        inpEmail.value = '';
        inpBirthday.value = '';
        selSexo.value = '';
        inpRepresentante.value = '';
        inpTelf.value = '';
        inpDireccion.value = '';
        btnBorrar.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function cerrarModalAlumno() {
    const modal = document.getElementById('modal-alumno');
    if (modal) modal.style.display = 'none';
}

async function guardarAlumno(e) {
    e.preventDefault();
    const nombre = document.getElementById('alumno-nombre').value.trim();
    const grado_id = document.getElementById('alumno-grado').value || null;
    const email = document.getElementById('alumno-email').value.trim() || null;
    const birthday = document.getElementById('alumno-birthday').value || null;
    const sexo = document.getElementById('alumno-sexo').value || null;
    const representante = document.getElementById('alumno-representante').value.trim() || null;
    const telf = document.getElementById('alumno-telf').value.trim() || null;
    const direccion = document.getElementById('alumno-direccion').value.trim() || null;

    if (!nombre) { mostrarMensaje('error', 'El nombre del alumno es obligatorio'); return; }

    const payload = {
        alumno_nombre: nombre,
        grado_id: grado_id ? parseInt(grado_id, 10) : null,
        alumno_email: email,
        alumno_birthday: birthday,
        alumno_sexo: sexo,
        alumno_representante: representante,
        alumno_telf: telf,
        alumno_direccion: direccion
    };

    if (editandoId) {
        const { error } = await AlumnoService.saveAlumno(editandoId, payload);
        if (error) { mostrarMensaje('error', 'Error al actualizar alumno: ' + error.message); return; }
        mostrarMensaje('success', 'Alumno actualizado correctamente');
    } else {
        const { data: ultimoAlumno, error: errorMax } = await AlumnoService.getUltimoAlumno();

        if (errorMax) {
            mostrarMensaje('error', 'Error al obtener el correlativo de ID: ' + errorMax.message);
            return;
        }

        const siguienteId = ultimoAlumno ? Number(ultimoAlumno.id) + 1 : 1;
        payload.id = siguienteId;

        const { error } = await AlumnoService.saveAlumno(null, payload);

        if (error) { mostrarMensaje('error', 'Error al crear alumno: ' + error.message); return; }
        mostrarMensaje('success', `Alumno #${siguienteId} registrado correctamente`);
    }

    cerrarModalAlumno();
    if (containerElement) cargarVistaAlumnos(containerElement);
}

async function borrarAlumno(e) {
    e.preventDefault();
    if (!editandoId) return;

    if (!confirm(`¿Deseas eliminar al alumno #${editandoId}? Esta acción no se puede deshacer.`)) return;

    const { error } = await AlumnoService.deleteAlumno(editandoId);

    if (error) { mostrarMensaje('error', 'Error al eliminar alumno: ' + error.message); return; }
    mostrarMensaje('success', 'Alumno eliminado correctamente');

    cerrarModalAlumno();
    if (containerElement) cargarVistaAlumnos(containerElement);
}

function limpiarFormularioAlumno() {
    document.getElementById('alumno-nombre').value = '';
    document.getElementById('alumno-grado').value = '';
    document.getElementById('alumno-email').value = '';
    document.getElementById('alumno-birthday').value = '';
    document.getElementById('alumno-sexo').value = '';
    document.getElementById('alumno-representante').value = '';
    document.getElementById('alumno-telf').value = '';
    document.getElementById('alumno-direccion').value = '';
    document.getElementById('alumno-nombre').focus();
}
