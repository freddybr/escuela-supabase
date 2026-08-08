import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { ProfesorService, AlumnoService } from '../services.js';

let containerElement = null;
let checkUserCallback = null;
let _datosPerfil = { profesores: [], alumnos: [] };

export async function cargarVistaPerfil(container, onPhotoUpdated = null) {
    containerElement = container;
    checkUserCallback = onPhotoUpdated;
    container.innerHTML = '<div class="loading">Cargando opciones de Perfil...</div>';

    const [resProfesores, resAlumnos] = await Promise.all([
        ProfesorService.getProfesores(),
        AlumnoService.getAlumnos()
    ]);

    _datosPerfil = {
        profesores: resProfesores.data || [],
        alumnos: resAlumnos.data || []
    };

    let htmlTemplate = `
    ${renderHeaderSeccion('perfil', 'Gestión de Perfil', 'Asignación y actualización de fotografías para Usuarios.')}

    <div class="profile-panel">

        <div class="profile-row">
            <label for="perfil-tipo-usuario">Tipo de Usuario</label>
            <select id="perfil-tipo-usuario" class="form-select">
                <option value="profesor">Profesor</option>
                <option value="alumno">Alumno</option>
            </select>
        </div>

        <div class="profile-row">
            <label for="perfil-id-registro">Seleccionar Registro</label>
            <select id="perfil-id-registro" class="form-select">
            </select>
        </div>

        <div class="profile-avatar-card">
            <p id="perfil-foto-titulo" class="profile-avatar-title">Fotografía Actual</p>
            <div style="position: relative; width: 120px; height: 120px; margin: 0 auto;">
                <img id="perfil-foto-preview" src="https://api.dicebear.com/7.x/initials/svg?seed=Usuario&backgroundColor=4f46e5" alt="Vista previa" class="profile-avatar-image" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Usuario&backgroundColor=4f46e5'">
            </div>
        </div>

        <div class="profile-row">
            <label for="perfil-input-file">Seleccionar Nueva Foto</label>
            <input type="file" id="perfil-input-file" accept="image/*" class="form-control">
        </div>

        <div class="profile-button-row">
            <button type="button" id="btn-cancelar-foto" class="btn-secondary-alt" style="display: none;">
                Cancelar
            </button>
            <button type="button" id="btn-guardar-foto" class="btn-primary-alt">
                Guardar Fotografía
            </button>
        </div>
    </div>
    `;

    container.innerHTML = htmlTemplate;

    const selTipo = document.getElementById('perfil-tipo-usuario');
    const selRegistro = document.getElementById('perfil-id-registro');
    const imgPreview = document.getElementById('perfil-foto-preview');
    const txtTitulo = document.getElementById('perfil-foto-titulo');
    const inputFile = document.getElementById('perfil-input-file');
    const btnCancelar = document.getElementById('btn-cancelar-foto');
    const btnGuardar = document.getElementById('btn-guardar-foto');

    const actualizarPreviewFoto = () => {
        const option = selRegistro.options[selRegistro.selectedIndex];
        const fotoUrl = option?.getAttribute('data-foto');
        const nombre = option?.getAttribute('data-nombre') || 'Usuario';

        if (txtTitulo) txtTitulo.textContent = 'Fotografía Actual';

        if (fotoUrl && fotoUrl.trim() !== '') {
            imgPreview.src = fotoUrl;
        } else {
            const seed = encodeURIComponent(nombre.substring(0, 2));
            imgPreview.src = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=4f46e5`;
        }
    };

    const limpiarSeleccionFoto = () => {
        if (inputFile) inputFile.value = '';
        if (btnCancelar) btnCancelar.style.display = 'none';
        actualizarPreviewFoto();
    };

    const cambiarTipoPerfil = () => {
        const tipo = selTipo?.value;
        if (!selRegistro) return;

        const lista = tipo === 'profesor' ? _datosPerfil.profesores : _datosPerfil.alumnos;

        selRegistro.innerHTML = lista.map(item => {
            const nombre = tipo === 'profesor' ? item.profe_nombre : item.alumno_nombre;
            const foto = tipo === 'profesor' ? item.profe_imagen_url : item.alumno_imagen_url;
            return `<option value="${item.id}" data-foto="${foto || ''}" data-nombre="${nombre}">${nombre} (#${item.id})</option>`;
        }).join('');

        limpiarSeleccionFoto();
    };

    const previsualizarArchivoSeleccionado = (input) => {
        const file = input.files[0];

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imgPreview.src = e.target.result;
                if (btnCancelar) btnCancelar.style.display = 'block';
                if (txtTitulo) txtTitulo.textContent = '✨ Vista Previa de la Nueva Foto';
            };
            reader.readAsDataURL(file);
        }
    };

    const ejecutarSubidaFoto = () => {
        const tipo = selTipo?.value;
        const idRegistro = selRegistro?.value;
        const archivo = inputFile?.files[0];

        if (!idRegistro) {
            mostrarMensaje('error', 'Seleccione un registro válido');
            return;
        }

        if (!archivo) {
            mostrarMensaje('error', 'Seleccione un archivo de imagen antes de guardar');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const base64Url = e.target.result;
            
            const { error } = tipo === 'profesor'
                ? await ProfesorService.updateProfesorImagen(idRegistro, base64Url)
                : await AlumnoService.updateAlumnoImagen(idRegistro, base64Url);

            if (error) {
                mostrarMensaje('error', 'Error al guardar la fotografía: ' + error.message);
                return;
            }

            mostrarMensaje('success', 'Fotografía actualizada correctamente');
            if (checkUserCallback) checkUserCallback(); // Actualizar avatar si es el usuario en sesión
            cargarVistaPerfil(containerElement, checkUserCallback);
        };

        reader.readAsDataURL(archivo);
    };

    selTipo?.addEventListener('change', cambiarTipoPerfil);
    selRegistro?.addEventListener('change', actualizarPreviewFoto);
    inputFile?.addEventListener('change', (e) => previsualizarArchivoSeleccionado(e.target));
    btnCancelar?.addEventListener('click', limpiarSeleccionFoto);
    btnGuardar?.addEventListener('click', ejecutarSubidaFoto);

    // Inicializar
    cambiarTipoPerfil();
}
