import { mostrarMensaje } from '../ui.js';
import { ProgramaService, MateriaService } from '../services.js';

let modalInitialized = false;

export async function cargarVistaProgramas() {
    const tableBody = document.getElementById('tabla-programas-body');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading">Consultando Programas...</td></tr>';
    }

    const [resProgramas, resMaterias] = await Promise.all([
        ProgramaService.getProgramas(),
        MateriaService.getMaterias()
    ]);

    if (resProgramas.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" class="error-msg">❌ Error: ${resProgramas.error.message}</td></tr>`;
        }
        return;
    }

    if (resMaterias.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" class="error-msg">❌ Error (materias): ${resMaterias.error.message}</td></tr>`;
        }
        return;
    }

    const programas = resProgramas.data || [];
    const materias = resMaterias.data || [];
    const materiasById = new Map(materias.map(m => [String(m.id), m.materia_nombre]));

    // Rellenar select del modal
    const selMateria = document.getElementById('programa-materia');
    if (selMateria) {
        selMateria.innerHTML = '<option value="">-- Seleccionar Materia --</option>' +
            materias.map(m => `<option value="${m.id}">${m.materia_nombre}</option>`).join('');
    }

    if (tableBody) {
        if (programas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No hay programas registrados.</td></tr>';
        } else {
            tableBody.innerHTML = programas.map(p => {
                const nombreMateria = materiasById.get(String(p.materia_id)) || (p.materia_id ? `#${p.materia_id}` : 'Sin materia');
                return `
                <tr data-id="${p.id}" class="fila-programa" style="cursor: pointer;">
                    <td data-label="ID"><strong># ${p.id}</strong></td>
                    <td data-label="Materia" class="text-bold">${nombreMateria}</td>
                    <td data-label="Programa" class="text-bold">${p.programa_tema || '-'}</td>
                    <td data-label="Objetivo"><span class="text-light">${p.programa_objetivo || '-'}</span></td>
                    <td data-label="Versículo"><span class="text-light">${p.programa_texto || '-'}</span></td>
                    <td data-label="Estatus">
                        <span class="badge" style="background-color: ${p.programa_estatus === 'Disponible' ? '#c7f9cc' : '#ffe3e0'}; color: #000;">
                            ${p.programa_estatus || '-'}
                        </span>
                    </td>
                </tr>
                `;
            }).join('');
        }
    }

    // Configurar botón nuevo programa
    const btnNuevoPrograma = document.getElementById('btn-nuevo-programa');
    if (btnNuevoPrograma) {
        if (window.usuarioEsDocente) {
            btnNuevoPrograma.style.display = 'none';
        } else {
            btnNuevoPrograma.style.display = '';
        }
    }

    if (!modalInitialized) {
        configurarListeners();
        modalInitialized = true;
    }

    document.querySelectorAll('.fila-programa').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: p } = await ProgramaService.getPrograma(id);
            if (p) abrirModalPrograma(p);
        });
    });
}

function configurarListeners() {
    document.getElementById('btn-nuevo-programa')?.addEventListener('click', () => abrirModalPrograma());
    document.getElementById('modal-programa-close')?.addEventListener('click', cerrarModalPrograma);
    document.getElementById('btn-guardar-programa')?.addEventListener('click', guardarPrograma);
    document.getElementById('btn-borrar-programa')?.addEventListener('click', borrarPrograma);
    document.getElementById('btn-cancelar-programa')?.addEventListener('click', (ev) => { ev.preventDefault(); cerrarModalPrograma(); });
}

function abrirModalPrograma(programa = null) {
    const modal = document.getElementById('modal-programa');
    const titulo = document.getElementById('modal-programa-title');
    const inputId = document.getElementById('programa-id');
    const selMateria = document.getElementById('programa-materia');
    const inputTema = document.getElementById('programa-tema');
    const inputObjetivo = document.getElementById('programa-objetivo');
    const inputTexto = document.getElementById('programa-texto');
    const selEstatus = document.getElementById('programa-estatus');
    const btnBorrar = document.getElementById('btn-borrar-programa');

    if (!modal || !titulo || !inputId || !selMateria || !inputTema || !inputObjetivo || !inputTexto || !selEstatus || !btnBorrar) return;

    if (programa) {
        titulo.textContent = `Programa #${programa.id}`;
        inputId.value = programa.id;
        selMateria.value = programa.materia_id || '';
        inputTema.value = programa.programa_tema || '';
        inputObjetivo.value = programa.programa_objetivo || '';
        inputTexto.value = programa.programa_texto || '';
        selEstatus.value = programa.programa_estatus || 'Disponible';
        
        if (window.usuarioEsDocente) {
            btnBorrar.style.display = 'none';
        } else {
            btnBorrar.style.display = '';
        }
    } else {
        titulo.textContent = 'Nuevo Programa';
        inputId.value = '';
        selMateria.value = '';
        inputTema.value = '';
        inputObjetivo.value = '';
        inputTexto.value = '';
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
    const programa_tema = document.getElementById('programa-tema').value.trim();
    const programa_objetivo = document.getElementById('programa-objetivo').value.trim();
    const programa_texto = document.getElementById('programa-texto').value.trim();
    const programa_estatus = document.getElementById('programa-estatus').value;

    if (!materia_id) { mostrarMensaje('error', 'Seleccione una materia'); return; }
    if (!programa_tema) { mostrarMensaje('error', 'El título de programa es requerido'); return; }

    const payload = {
        materia_id: parseInt(materia_id, 10),
        programa_tema: programa_tema,
        programa_objetivo: programa_objetivo || null,
        programa_texto: programa_texto || null,
        programa_estatus: programa_estatus
    };

    const { error } = await ProgramaService.savePrograma(id, payload);

    if (error) {
        mostrarMensaje('error', `Error al ${id ? 'actualizar' : 'crear'} el programa: ` + error.message);
        return;
    }

    mostrarMensaje('success', `Programa ${id ? 'actualizado' : 'creado'} correctamente`);
    cerrarModalPrograma();
    cargarVistaProgramas();
}

async function borrarPrograma(e) {
    e.preventDefault();
    const id = document.getElementById('programa-id').value;
    if (!id) return;

    if (!confirm(`¿Estás seguro de eliminar el programa #${id}? Esta acción no se puede deshacer.`)) return;

    const { error } = await ProgramaService.deletePrograma(id);
    if (error) { 
        mostrarMensaje('error', 'Error al eliminar programa: ' + error.message); 
        return; 
    }

    mostrarMensaje('success', 'Programa eliminado correctamente');
    cerrarModalPrograma();
    cargarVistaProgramas();
}

if (window.layoutReady) {
    cargarVistaProgramas();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaProgramas();
    });
}
