import { mostrarMensaje } from '../ui.js';
import { ProfesorService, GradoService, AuthService } from '../services.js';

let editandoProfeId = null;
let _tienePermisoRol = false;
let modalInitialized = false;

export async function cargarVistaProfesores() {
    const tableBody = document.getElementById('tabla-profesores-body');
    const selectFilterGrado = document.getElementById('filter-grado-profesores');

    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading">Consultando Profesores...</td></tr>';
    }

    const [resProfesores, resGrados, resUser] = await Promise.all([
        ProfesorService.getProfesores(),
        GradoService.getGrados(),
        AuthService.getUser()
    ]);

    const userEmail = resUser.data?.user?.email || '';
    const { data: currentProfe } = userEmail ? await ProfesorService.getProfesorByEmail(userEmail) : { data: null };
    _tienePermisoRol = userEmail.toLowerCase() === 'freddybr.igle@gmail.com' || (currentProfe && currentProfe.profe_rol?.toLowerCase() === 'superadmin');

    if (resProfesores.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="error-msg">❌ Error: ${resProfesores.error.message}</td></tr>`;
        }
        return;
    }

    if (resGrados.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="error-msg">❌ Error (grados): ${resGrados.error.message}</td></tr>`;
        }
        return;
    }

    const profesores = resProfesores.data || [];
    const grados = resGrados.data || [];
    const gradosById = new Map(grados.map(g => [String(g.id), g.grado_nombre]));

    // Rellenar select del modal
    const selGradoModal = document.getElementById('profe-grado');
    if (selGradoModal) {
        selGradoModal.innerHTML = '<option value="">-- Seleccionar Grado --</option>' +
            grados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('');
    }

    // Rellenar select de filtro
    const gradosDeProfesores = [...new Set(
        profesores.map(p => gradosById.get(String(p.grado_id)) || (p.grado_id ? `#${p.grado_id}` : 'Sin grado')).filter(Boolean)
    )].sort();

    if (selectFilterGrado) {
        selectFilterGrado.innerHTML = '<option value="">Todos los Grados</option>' +
            gradosDeProfesores.map(grado => `<option value="${grado}">${grado}</option>`).join('');
    }

    profesores.sort((a, b) => (a.id || 0) - (b.id || 0));

    if (tableBody) {
        if (profesores.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No hay profesores registrados.</td></tr>';
        } else {
            tableBody.innerHTML = profesores.map(p => {
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
            }).join('');
        }
    }

    // Configurar botón nuevo profesor
    const btnNuevoProfesor = document.getElementById('btn-nuevo-profesor');
    if (btnNuevoProfesor) {
        if (window.usuarioEsDocente) {
            btnNuevoProfesor.style.display = 'none';
        } else {
            btnNuevoProfesor.style.display = '';
        }
    }

    if (!modalInitialized) {
        configurarListeners();
        modalInitialized = true;
    }

    // Configurar clics de las filas
    document.querySelectorAll('.fila-profesor').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: profe } = await ProfesorService.getProfesor(id);
            if (profe) abrirModalProfesor(profe);
        });
    });
}

function configurarListeners() {
    document.getElementById('btn-nuevo-profesor')?.addEventListener('click', () => abrirModalProfesor());
    document.getElementById('modal-profesor-close')?.addEventListener('click', () => cerrarModalProfesor());
    document.getElementById('btn-guardar-profesor')?.addEventListener('click', guardarProfesor);
    document.getElementById('btn-borrar-profesor')?.addEventListener('click', borrarProfesor);
    document.getElementById('btn-cancelar-profesor')?.addEventListener('click', (e) => { e.preventDefault(); cerrarModalProfesor(); });

    const filterGrado = document.getElementById('filter-grado-profesores');
    filterGrado?.addEventListener('change', () => {
        const gradoSel = filterGrado.value || '';
        const filas = document.querySelectorAll('#tabla-profesores tbody tr');
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

    if (!modal || !titulo || !inpNombre || !selGrado || !inpEmail || !inpTelf || !selEstatus || !inpRol || !btnBorrar) return;

    // Configurar habilitación del campo rol según privilegios
    inpRol.disabled = !_tienePermisoRol;

    if (profe) {
        editandoProfeId = profe.id;
        titulo.textContent = `Profesor #${profe.id}`;
        inpNombre.value = profe.profe_nombre || '';
        selGrado.value = profe.grado_id || '';
        inpEmail.value = profe.profe_email || '';
        inpTelf.value = profe.profe_telf || '';
        selEstatus.value = profe.profe_estatus || 'Activo';
        inpRol.value = profe.profe_rol || '';
        
        if (window.usuarioEsDocente) {
            btnBorrar.style.display = 'none';
        } else {
            btnBorrar.style.display = '';
        }
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
        profe_estatus: estatus
    };

    // Solo guardar el rol si se tiene permiso para editarlo
    if (_tienePermisoRol) {
        payload.profe_rol = rol;
    }

    if (editandoProfeId) {
        const { error } = await ProfesorService.saveProfesor(editandoProfeId, payload);
        if (error) { mostrarMensaje('error', 'Error al actualizar profesor: ' + error.message); return; }
        mostrarMensaje('success', 'Profesor actualizado correctamente');
    } else {
        const { data: ultimoProfe, error: errorMax } = await ProfesorService.getUltimoProfesor();

        if (errorMax) {
            mostrarMensaje('error', 'Error al obtener el correlativo de ID: ' + errorMax.message);
            return;
        }

        const siguienteId = ultimoProfe ? Number(ultimoProfe.id) + 1 : 1;
        payload.id = siguienteId;

        const { error } = await ProfesorService.saveProfesor(null, payload);

        if (error) { mostrarMensaje('error', 'Error al crear profesor: ' + error.message); return; }
        mostrarMensaje('success', `Profesor #${siguienteId} registrado correctamente`);
    }

    cerrarModalProfesor();
    cargarVistaProfesores();
}

async function borrarProfesor(e) {
    e.preventDefault();
    if (!editandoProfeId) return;

    if (!confirm(`¿Deseas eliminar al profesor #${editandoProfeId}? Esta acción no se puede deshacer.`)) return;

    const { error } = await ProfesorService.deleteProfesor(editandoProfeId);

    if (error) { mostrarMensaje('error', 'Error al eliminar profesor: ' + error.message); return; }
    mostrarMensaje('success', 'Profesor eliminado correctamente');

    cerrarModalProfesor();
    cargarVistaProfesores();
}

if (window.layoutReady) {
    cargarVistaProfesores();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaProfesores();
    });
}
