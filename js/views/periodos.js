import { mostrarMensaje } from '../ui.js';
import { PeriodoService } from '../services.js';

let modalInitialized = false;

const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fechaStr;
};

export async function cargarVistaPeriodos() {
    const tableBody = document.getElementById('tabla-periodos-body');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="4" class="loading">Consultando períodos...</td></tr>';
    }

    const { data: periodos, error } = await PeriodoService.getPeriodos();

    if (error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="4" class="error-msg">❌ Error al cargar periodos: ${error.message}</td></tr>`;
        }
        return;
    }

    const listaPeriodos = periodos || [];

    if (tableBody) {
        if (listaPeriodos.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay períodos registrados.</td></tr>';
        } else {
            tableBody.innerHTML = listaPeriodos.map(a => `
                <tr data-id="${a.id}" class="fila-periodo" style="cursor:pointer;">
                    <td data-label="ID"><strong># ${a.id}</strong></td>
                    <td data-label="Período" class="text-bold">${a.anio_periodo}</td>
                    <td data-label="Fecha Inicio"><span class="text-light">${formatearFecha(a.anio_inicio) || 'Sin inicio'}</span></td>
                    <td data-label="Fecha Fin"><span class="text-light">${formatearFecha(a.anio_fin) || 'Sin fin'}</span></td>
                </tr>
            `).join('');
        }
    }

    // Configurar botón nuevo período
    const btnNuevoPeriodo = document.getElementById('btn-nuevo-periodo');
    if (btnNuevoPeriodo) {
        if (window.usuarioEsDocente) {
            btnNuevoPeriodo.style.display = 'none';
        } else {
            btnNuevoPeriodo.style.display = '';
        }
    }

    if (!modalInitialized) {
        configurarListeners();
        modalInitialized = true;
    }

    document.querySelectorAll('.fila-periodo').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: item } = await PeriodoService.getPeriodo(id);
            if (item) abrirModalPeriodo(item);
        });
    });
}

function configurarListeners() {
    document.getElementById('btn-nuevo-periodo')?.addEventListener('click', () => abrirModalPeriodo());
    document.getElementById('modal-periodo-close')?.addEventListener('click', cerrarModalPeriodo);
    document.getElementById('btn-guardar-periodo')?.addEventListener('click', guardarPeriodo);
    document.getElementById('btn-borrar-periodo')?.addEventListener('click', borrarPeriodo);
    document.getElementById('btn-cancelar-periodo')?.addEventListener('click', (ev) => { ev.preventDefault(); cerrarModalPeriodo(); });
}

function abrirModalPeriodo(item = null) {
    const modal = document.getElementById('modal-periodo');
    const titulo = document.getElementById('modal-periodo-title');
    const inputId = document.getElementById('periodo-id');
    const inputNombre = document.getElementById('periodo-nombre');
    const inputInicio = document.getElementById('periodo-inicio');
    const inputFin = document.getElementById('periodo-fin');
    const btnBorrar = document.getElementById('btn-borrar-periodo');

    if (!modal || !titulo || !inputId || !inputNombre || !inputInicio || !inputFin || !btnBorrar) return;

    if (item) {
        titulo.textContent = `Período #${item.id}`;
        inputId.value = item.id;
        inputNombre.value = item.anio_periodo || '';
        inputInicio.value = item.anio_inicio || '';
        inputFin.value = item.anio_fin || '';
        
        if (window.usuarioEsDocente) {
            btnBorrar.style.display = 'none';
        } else {
            btnBorrar.style.display = '';
        }
    } else {
        titulo.textContent = 'Nuevo Período';
        inputId.value = '';
        inputNombre.value = '';
        inputInicio.value = '';
        inputFin.value = '';
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
    cargarVistaPeriodos();
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
    cargarVistaPeriodos();
}

if (window.layoutReady) {
    cargarVistaPeriodos();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaPeriodos();
    });
}
