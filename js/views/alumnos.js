import { mostrarMensaje } from '../ui.js';
import { AlumnoService, GradoService } from '../services.js';

let editandoId = null;
let modalInitialized = false;

export async function cargarVistaAlumnos() {
    const tableBody = document.getElementById('tabla-alumnos-body');
    const selectFilterGrado = document.getElementById('filter-grado-alumnos');

    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="10" class="loading">Consultando Alumnos...</td></tr>';
    }

    const [resAlumnos, resGrados] = await Promise.all([
        AlumnoService.getAlumnos(),
        GradoService.getGrados()
    ]);

    if (resAlumnos.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="10" class="error-msg">❌ Error: ${resAlumnos.error.message}</td></tr>`;
        }
        return;
    }

    if (resGrados.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="10" class="error-msg">❌ Error (grados): ${resGrados.error.message}</td></tr>`;
        }
        return;
    }

    const alumnos = resAlumnos.data || [];
    const grados = resGrados.data || [];
    const gradosById = new Map(grados.map(g => [String(g.id), g.grado_nombre]));

    // Rellenar select del modal
    const selGradoModal = document.getElementById('alumno-grado');
    if (selGradoModal) {
        selGradoModal.innerHTML = '<option value="">-- Seleccionar Grado --</option>' +
            grados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('');
    }

    // Rellenar select de filtro
    const gradosDeAlumnos = [...new Set(
        alumnos.map(a => gradosById.get(String(a.grado_id)) || (a.grado_id ? `#${a.grado_id}` : 'Sin grado')).filter(Boolean)
    )].sort();

    if (selectFilterGrado) {
        selectFilterGrado.innerHTML = '<option value="">Todos los Grados</option>' +
            gradosDeAlumnos.map(grado => `<option value="${grado}">${grado}</option>`).join('');
    }

    alumnos.sort((a, b) => (a.id || 0) - (b.id || 0));

    if (tableBody) {
        if (alumnos.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">No hay alumnos registrados.</td></tr>';
        } else {
            tableBody.innerHTML = alumnos.map(a => {
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
            }).join('');
        }
    }

    // Configurar permisos botón nuevo alumno
    const btnNuevoAlumno = document.getElementById('btn-nuevo-alumno');
    if (btnNuevoAlumno) {
        if (window.usuarioEsDocente) {
            btnNuevoAlumno.style.display = 'none';
        } else {
            btnNuevoAlumno.style.display = '';
        }
    }

    if (!modalInitialized) {
        configurarListeners();
        modalInitialized = true;
    }

    // Configurar clics de las filas
    document.querySelectorAll('.fila-alumno').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: alumno } = await AlumnoService.getAlumno(id);
            if (alumno) abrirModalAlumno(alumno);
        });
    });
}

function configurarListeners() {
    document.getElementById('btn-nuevo-alumno')?.addEventListener('click', () => abrirModalAlumno());
    document.getElementById('modal-alumno-close')?.addEventListener('click', () => cerrarModalAlumno());
    document.getElementById('btn-guardar-alumno')?.addEventListener('click', guardarAlumno);
    document.getElementById('btn-borrar-alumno')?.addEventListener('click', borrarAlumno);
    document.getElementById('btn-cancelar-alumno')?.addEventListener('click', (e) => { e.preventDefault(); cerrarModalAlumno(); });

    const filterGrado = document.getElementById('filter-grado-alumnos');
    filterGrado?.addEventListener('change', () => {
        const gradoSel = filterGrado.value || '';
        const filas = document.querySelectorAll('#tabla-alumnos tbody tr');
        filas.forEach(f => {
            const gradoFila = f.getAttribute('data-grado') || '';
            if (gradoSel === '' || gradoFila === gradoSel) {
                f.style.removeProperty('display');
            } else {
                f.style.setProperty('display', 'none', 'important');
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

    if (!modal || !titulo || !inpNombre || !selGrado || !inpEmail || !inpBirthday || !selSexo || !inpRepresentante || !inpTelf || !inpDireccion || !btnBorrar) return;

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
        
        if (window.usuarioEsDocente) {
            btnBorrar.style.display = 'none';
        } else {
            btnBorrar.style.display = '';
        }
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
    cargarVistaAlumnos();
}

async function borrarAlumno(e) {
    e.preventDefault();
    if (!editandoId) return;

    if (!confirm(`¿Deseas eliminar al alumno #${editandoId}? Esta acción no se puede deshacer.`)) return;

    const { error } = await AlumnoService.deleteAlumno(editandoId);

    if (error) { mostrarMensaje('error', 'Error al eliminar alumno: ' + error.message); return; }
    mostrarMensaje('success', 'Alumno eliminado correctamente');

    cerrarModalAlumno();
    cargarVistaAlumnos();
}

if (window.layoutReady) {
    cargarVistaAlumnos();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaAlumnos();
    });
}
