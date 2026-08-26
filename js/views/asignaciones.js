import { mostrarMensaje } from '../ui.js';
import { AsignacionService, ProgramaService, GradoService, PeriodoService } from '../services.js';

let modalInitialized = false;

export async function cargarVistaAsignaciones() {
    const tableBody = document.getElementById('tabla-asignaciones-body');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading">Consultando Asignaciones...</td></tr>';
    }

    const [resVista, resProgramas, resGrados, resAnio] = await Promise.all([
        AsignacionService.getAsignacionesDetalles(),
        ProgramaService.getProgramasDisponibles(),
        GradoService.getGrados(),
        PeriodoService.getPeriodos()
    ]);

    if (resVista.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="error-msg">❌ Error al cargar asignaciones: ${resVista.error.message}</td></tr>`;
        }
        return;
    }

    if (resProgramas.error) mostrarMensaje('error', 'Error al cargar programas disponibles: ' + resProgramas.error.message);
    if (resGrados.error) mostrarMensaje('error', 'Error al cargar grados: ' + resGrados.error.message);
    if (resAnio.error) mostrarMensaje('error', 'Error al cargar períodos (año): ' + resAnio.error.message);

    const vistaAsignaciones = resVista.data || [];
    const programasDisponibles = resProgramas.data || [];
    const grados = resGrados.data || [];
    const anios = resAnio.data || [];

    // Rellenar selects del modal
    const selPrograma = document.getElementById('asigna-programa');
    if (selPrograma) {
        selPrograma.innerHTML = '<option value="">-- Seleccionar Programa --</option>' +
            programasDisponibles.map(p => `<option value="${p.id}">#${p.id} - ${p.programa_tema}</option>`).join('');
    }

    const selGrado = document.getElementById('asigna-grado');
    if (selGrado) {
        selGrado.innerHTML = '<option value="">-- Seleccionar Grado --</option>' +
            grados.map(g => `<option value="${g.id}">${g.grado_nombre || g.grado_numero}</option>`).join('');
    }

    const selAnio = document.getElementById('asigna-anio');
    if (selAnio) {
        selAnio.innerHTML = '<option value="">-- Seleccionar Periodo --</option>' +
            anios.map(a => `<option value="${a.id}">${a.anio_periodo}</option>`).join('');
    }

    if (tableBody) {
        if (vistaAsignaciones.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No hay asignaciones registradas.</td></tr>';
        } else {
            tableBody.innerHTML = vistaAsignaciones.map(n => `
                <tr data-id="${n.asigna_id}" class="fila-asignacion" style="cursor:pointer;">
                    <td data-label="ID"><strong># ${n.asigna_id}</strong></td>
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
            `).join('');
        }
    }

    // Configurar botón nueva asignación
    const btnNuevaAsignacion = document.getElementById('btn-nueva-asignacion');
    if (btnNuevaAsignacion) {
        if (window.usuarioEsDocente) {
            btnNuevaAsignacion.style.display = 'none';
        } else {
            btnNuevaAsignacion.style.display = '';
        }
    }

    if (!modalInitialized) {
        configurarListeners();
        modalInitialized = true;
    }

    document.querySelectorAll('.fila-asignacion').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: asigna } = await AsignacionService.getAsignacion(id);
            if (asigna) {
                abrirModalAsignacion(asigna);
            }
        });
    });
}

function configurarListeners() {
    document.getElementById('btn-nueva-asignacion')?.addEventListener('click', () => abrirModalAsignacion());
    document.getElementById('modal-asignacion-close')?.addEventListener('click', () => cerrarModalAsignacion());
    document.getElementById('btn-guardar-asignacion')?.addEventListener('click', guardarAsignacion);
    document.getElementById('btn-borrar-asignacion')?.addEventListener('click', borrarAsignacion);
    document.getElementById('btn-cancelar-asignacion')?.addEventListener('click', (e) => { e.preventDefault(); cerrarModalAsignacion(); });
}

function abrirModalAsignacion(asigna = null) {
    const modal = document.getElementById('modal-asignacion');
    const titulo = document.getElementById('modal-asignacion-title');
    const inputId = document.getElementById('asigna-id');
    const selPrograma = document.getElementById('asigna-programa');
    const selGrado = document.getElementById('asigna-grado');
    const selAnio = document.getElementById('asigna-anio');
    const selEstatus = document.getElementById('asigna-estatus');
    const btnBorrar = document.getElementById('btn-borrar-asignacion');

    if (!modal || !titulo || !inputId || !selPrograma || !selGrado || !selAnio || !selEstatus || !btnBorrar) return;

    if (asigna) {
        titulo.textContent = `Asignación #${asigna.id}`;
        inputId.value = asigna.id;
        selPrograma.value = asigna.programa_id || '';
        selGrado.value = asigna.grado_id || '';
        selAnio.value = asigna.anio_id || '';
        selEstatus.value = asigna.asigna_estatus || 'Activa';
        
        if (window.usuarioEsDocente) {
            btnBorrar.style.display = 'none';
        } else {
            btnBorrar.style.display = '';
        }
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
    cargarVistaAsignaciones();
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
    cargarVistaAsignaciones();
}

if (window.layoutReady) {
    cargarVistaAsignaciones();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaAsignaciones();
    });
}
