import { mostrarMensaje } from '../ui.js';
import { MateriaService } from '../services.js';

let modalInitialized = false;

export async function cargarVistaMaterias() {
    const tableBody = document.getElementById('tabla-materias-body');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="3" class="loading">Consultando materias...</td></tr>';
    }

    const { data: materias, error } = await MateriaService.getMaterias();

    if (error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="3" class="error-msg">❌ Error: ${error.message}</td></tr>`;
        }
        return;
    }

    // Dibujar las filas de la tabla
    if (tableBody) {
        if (materias.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No hay materias registradas.</td></tr>';
        } else {
            tableBody.innerHTML = materias.map(m => `
                <tr data-id="${m.id}" class="fila-materia" style="cursor: pointer;">
                    <td data-label="Código"><strong># ${m.id}</strong></td>
                    <td data-label="Nombre" class="text-bold">${m.materia_nombre}</td>
                    <td data-label="Descripción">${m.materia_descripcion || 'Sin descripción'}</td>
                </tr>
            `).join('');
        }
    }

    // Configurar permisos del rol docente (ocultar botón agregar)
    const btnNuevaMateria = document.getElementById('btn-nueva-materia');
    if (btnNuevaMateria) {
        if (window.usuarioEsDocente) {
            btnNuevaMateria.style.display = 'none';
        } else {
            btnNuevaMateria.style.display = '';
        }
    }

    // Inicializar listeners del formulario y modal una sola vez
    if (!modalInitialized) {
        configurarListeners();
        modalInitialized = true;
    }

    // Configurar clics en las filas para editar
    document.querySelectorAll('.fila-materia').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: materia } = await MateriaService.getMateria(id);
            if (materia) abrirModalMateria(materia);
        });
    });
}

function configurarListeners() {
    document.getElementById('btn-nueva-materia')?.addEventListener('click', () => abrirModalMateria());
    document.getElementById('modal-close')?.addEventListener('click', cerrarModalMateria);
    document.getElementById('btn-guardar-materia')?.addEventListener('click', guardarMateria);
    document.getElementById('btn-borrar-materia')?.addEventListener('click', borrarMateria);
    document.getElementById('btn-cancelar-materia')?.addEventListener('click', (ev) => { ev.preventDefault(); cerrarModalMateria(); });
}

function abrirModalMateria(materia = null) {
    const modal = document.getElementById('modal-materia');
    const titulo = document.getElementById('modal-title');
    const inputId = document.getElementById('materia-id');
    const inputNombre = document.getElementById('materia-nombre');
    const inputDesc = document.getElementById('materia-descripcion');
    const btnBorrar = document.getElementById('btn-borrar-materia');

    if (!modal || !titulo || !inputId || !inputNombre || !inputDesc || !btnBorrar) return;

    if (materia) {
        titulo.textContent = `Materia #${materia.id}`;
        inputId.value = materia.id;
        inputNombre.value = materia.materia_nombre || '';
        inputDesc.value = materia.materia_descripcion || '';
        
        // El docente no puede ver el botón borrar
        if (window.usuarioEsDocente) {
            btnBorrar.style.display = 'none';
        } else {
            btnBorrar.style.display = '';
        }
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
    cargarVistaMaterias();
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
    cargarVistaMaterias();
}

if (window.layoutReady) {
    cargarVistaMaterias();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaMaterias();
    });
}
