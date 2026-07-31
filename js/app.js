// js/app.js
import { supabase } from './config.js';

// ELEMENTOS DE LA INTERFAZ MÓVIL
const menuToggle = document.getElementById('menu-toggle');
const appAside = document.getElementById('app-aside');
const asideOverlay = document.getElementById('aside-overlay');
const userAvatar = document.getElementById('user-avatar');

// ELEMENTOS DEL CONTENIDO
const mainContent = document.getElementById('main-content');
const navMaterias = document.getElementById('nav-materias');
const navGrados = document.getElementById('nav-grados');
const navProgramas = document.getElementById('nav-programas');
const navPeriodos = document.getElementById('nav-periodos');
const navClases = document.getElementById('nav-clases');
const navAlumnos = document.getElementById('nav-alumnos');
const navProfesores = document.getElementById('nav-profesores');
const navAsignaciones = document.getElementById('nav-asignaciones');
const navControl = document.getElementById('nav-control');
const navAsistencias = document.getElementById('nav-asistencias');
const navPerfil = document.getElementById('nav-perfil');
const navDashboard = document.getElementById('nav-dashboard');
const btnLogout = document.getElementById('btn-logout');

// LOGOUT
btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// LANZAR VERIFICACIÓN INICIAL
checkUser();
menuToggle.addEventListener('click', toggleMenu);
asideOverlay.addEventListener('click', cerrarMenuMovil);

// VERIFICAR SESIÓN Y CARGAR AVATAR PERSONALIZADO DINÁMICAMENTE (CON SOPORTE PARA IMAGEN DE PERFIL)
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    let fotoUrl = null;

    // 1. Buscar si el usuario registrado existe en la tabla de profesores
    const { data: profe } = await supabase
        .from('profesores')
        .select('profe_imagen_url')
        .eq('profe_email', user.email)
        .maybeSingle();

    if (profe && profe.profe_imagen_url && profe.profe_imagen_url.trim() !== '') {
        fotoUrl = profe.profe_imagen_url;
    } else {
        // 2. Si no es profesor, buscar si existe en la tabla de alumnos
        const { data: alumno } = await supabase
            .from('alumnos')
            .select('alumno_imagen_url')
            .eq('alumno_email', user.email)
            .maybeSingle();

        if (alumno && alumno.alumno_imagen_url && alumno.alumno_imagen_url.trim() !== '') {
            fotoUrl = alumno.alumno_imagen_url;
        }
    }

    // 3. Crear el fallback de iniciales por si no tiene foto asignada
    const userSeed = user.email ? encodeURIComponent(user.email.substring(0, 2)) : 'US';
    const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${userSeed}&backgroundColor=4f46e5`;

    // 4. Asignar la foto o el respaldo de iniciales al avatar del header
    userAvatar.src = fotoUrl || fallbackUrl;

    // Respaldo de seguridad si el enlace de la imagen falla (error 404/link roto)
    userAvatar.onerror = () => {
        userAvatar.src = fallbackUrl;
    };

    // Carga inicial por defecto
    cargarVistaDashboard();
}

// LOGICA DEL MENÚ HAMBURGUESA MÓVIL (ABRIR / CERRAR)
function toggleMenu() {
    menuToggle.classList.toggle('open');
    appAside.classList.toggle('open');
    asideOverlay.classList.toggle('open');
}

function cerrarMenuMovil() {
    menuToggle.classList.remove('open');
    appAside.classList.remove('remove');
    appAside.classList.remove('open');
    asideOverlay.classList.remove('open');
}

function mostrarMensaje(tipo, texto) {
    const mensaje = document.createElement('div');
    mensaje.className = `notification ${tipo}`;
    mensaje.textContent = texto;
    document.body.appendChild(mensaje);
    setTimeout(() => mensaje.classList.add('visible'), 20);
    setTimeout(() => {
        mensaje.classList.remove('visible');
        setTimeout(() => mensaje.remove(), 300);
    }, 3200);
}

// NAVEGACIÓN E INYECCIÓN
// 1. Navegación de Materias
navMaterias.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navMaterias.classList.add('active');
    // navGrados.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navClases.classList.remove('active');
    // navAlumnos.classList.remove('active');
    // navProfesores.classList.remove('active');
    // navAsignaciones.classList.remove('active');
    // navControl.classList.remove('active');
    // navPeriodos.classList.remove('active');
    // navAsistencias.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaMaterias();
    cerrarMenuMovil();
});

// 2. Navegación de Grados
navGrados.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navGrados.classList.add('active');
    // navMaterias.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navClases.classList.remove('active');
    // navAlumnos.classList.remove('active');
    // navProfesores.classList.remove('active');
    // navAsignaciones.classList.remove('active');
    // navControl.classList.remove('active');
    // navPeriodos.classList.remove('active');
    // navAsistencias.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaGrados();
    cerrarMenuMovil();
});

// 3. Navegación de Programas
navProgramas.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navProgramas.classList.add('active');
    // navGrados.classList.remove('active');
    // navMaterias.classList.remove('active');
    // navClases.classList.remove('active');
    // navAlumnos.classList.remove('active');
    // navProfesores.classList.remove('active');
    // navAsignaciones.classList.remove('active');
    // navControl.classList.remove('active');
    // navPeriodos.classList.remove('active');
    // navAsistencias.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaProgramas();
    cerrarMenuMovil();
});

// 4. Navegación de Clases
navClases.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navClases.classList.add('active');
    // navMaterias.classList.remove('active');
    // navGrados.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navAlumnos.classList.remove('active');
    // navProfesores.classList.remove('active');
    // navAsignaciones.classList.remove('active');
    // navControl.classList.remove('active');
    // navPeriodos.classList.remove('active');
    // navAsistencias.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaClases();
    cerrarMenuMovil();
});

// 5. Navegación de Alumnos
navAlumnos.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navAlumnos.classList.add('active');
    // navMaterias.classList.remove('active');
    // navGrados.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navClases.classList.remove('active');
    // navProfesores.classList.remove('active');
    // navAsignaciones.classList.remove('active');
    // navControl.classList.remove('active');
    // navPeriodos.classList.remove('active');
    // navAsistencias.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaAlumnos();
    cerrarMenuMovil();
});

// 6. Navegación de Profesores
navProfesores.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navProfesores.classList.add('active');
    // navMaterias.classList.remove('active');
    // navGrados.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navClases.classList.remove('active');
    // navAlumnos.classList.remove('active');
    // navAsignaciones.classList.remove('active');
    // navControl.classList.remove('active');
    // navPeriodos.classList.remove('active');
    // navAsistencias.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaProfesores();
    cerrarMenuMovil();
});

// 7. Navegación de Asignaciones
navAsignaciones.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navAsignaciones.classList.add('active');
    // navProfesores.classList.remove('active');
    // navMaterias.classList.remove('active');
    // navGrados.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navClases.classList.remove('active');
    // navAlumnos.classList.remove('active');
    // navPeriodos.classList.remove('active');
    // navControl.classList.remove('active');
    // navAsistencias.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaAsignaciones();
    cerrarMenuMovil();
});

// 8. Navegación de Ejecucion
navControl.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navControl.classList.add('active');
    // navAsignaciones.classList.remove('active');
    // navProfesores.classList.remove('active');
    // navMaterias.classList.remove('active');
    // navGrados.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navClases.classList.remove('active');
    // navAlumnos.classList.remove('active');
    // navPeriodos.classList.remove('active');
    // navAsistencias.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaControl();
    cerrarMenuMovil();
});

// 9. Navegación de Periodos
navPeriodos.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navPeriodos.classList.add('active');
    // navControl.classList.remove('active');
    // navAsignaciones.classList.remove('active');
    // navProfesores.classList.remove('active');
    // navMaterias.classList.remove('active');
    // navGrados.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navClases.classList.remove('active');
    // navAlumnos.classList.remove('active');
    // navAsistencias.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaPeriodos();
    cerrarMenuMovil();
});

// 10. Navegación de Asistencias
navAsistencias.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navAsistencias.classList.add('active');
    // navPeriodos.classList.remove('active');
    // navControl.classList.remove('active');
    // navAsignaciones.classList.remove('active');
    // navProfesores.classList.remove('active');
    // navMaterias.classList.remove('active');
    // navGrados.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navClases.classList.remove('active');
    // navAlumnos.classList.remove('active');
    // navPerfil.classList.remove('active');
    cargarVistaAsistencias();
    cerrarMenuMovil();
});

// 11. Navegación de Perfil
navPerfil.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navPerfil.classList.add('active');
    // navAsistencias.classList.remove('active');
    // navPeriodos.classList.remove('active');
    // navControl.classList.remove('active');
    // navAsignaciones.classList.remove('active');
    // navProfesores.classList.remove('active');
    // navMaterias.classList.remove('active');
    // navGrados.classList.remove('active');
    // navProgramas.classList.remove('active');
    // navClases.classList.remove('active');
    // navAlumnos.classList.remove('active');
    cargarVistaPerfil();
    cerrarMenuMovil();
});

// 12. Navegación de Dashboard
navDashboard.addEventListener('click', () => {
    // Desactivar todos y activar navDashboard
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navDashboard.classList.add('active');
    cargarVistaDashboard();
    cerrarMenuMovil();
});


// CARGA DE TABLAS DINÁMICAS DESDE SUPABASE EN TABLAS HTML
// 1. Renderizar Tabla de Años
async function cargarVistaPeriodos() {
    mainContent.innerHTML = '<div class="loading">Consultando años...</div>';

    const { data: anio, error } = await supabase.from('anio').select('*');

    if (error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    let htmlTemplate = `
        <div class="header-seccion">
        <h2>Períodos</h2>
            <p>Años académicos por período.</p>
        </div>
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Período</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                    </tr>
                </thead>
                <tbody>
                    ${anio.map(a => `
                    <tr>
                        <td><strong># ${a.id}</strong></td>
                        <td class="text-bold">${a.anio_periodo}</td>
                        <td>${a.anio_inicio || 'Sin inicio'}</td>
                        <td>${a.anio_fin || 'Sin fin'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    mainContent.innerHTML = htmlTemplate;
}

// 2. Renderizar Tabla de Materias
async function cargarVistaMaterias() {
    mainContent.innerHTML = '<div class="loading">Consultando materias...</div>';

    const { data: materias, error } = await supabase.from('materias').select('*');

    if (error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

        let htmlTemplate = `
 <div class="header-seccion" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
 <div>
 <h2>Materias</h2>
 <p>Disciplinas académicas del diseño curricular.</p>
 </div>
 <div style="display:flex;gap:8px;align-items:center;">
 <button id="btn-nueva-materia" class="btn-primary">➕ Añadir</button>
 </div>
 </div>
 <div class="table-responsive">
 <table class="data-table" id="tabla-materias">
 <thead>
 <tr>
 <th>Código</th>
 <th>Nombre</th>
 <th>Descripción Académica</th>
 </tr>
 </thead>
 <tbody>
 ${materias.map(m => `
 <tr data-id="${m.id}" class="fila-materia">
 <td><strong># ${m.id}</strong></td>
 <td class="text-bold">${m.materia_nombre}</td>
 <td>${m.materia_descripcion || 'Sin descripción'}</td>
 </tr>
 `).join('')}
 </tbody>
 </table>
 </div>

 <!-- Modal para Añadir / Editar Materia -->
 <div id="modal-materia" class="modal" style="display:none;">
     <div class="modal-content">
         <div class="modal-header">
             <h3 id="modal-title">Materia</h3>
             <button id="modal-close" class="modal-close">✕</button>
         </div>
         <div class="modal-body">
             <form id="form-materia">
                 <input type="hidden" id="materia-id">
                 <div class="form-row">
                     <label>Nombre</label>
                     <input id="materia-nombre" type="text" required>
                 </div>
                 <div class="form-row">
                     <label>Descripción</label>
                     <textarea id="materia-descripcion" rows="4"></textarea>
                 </div>
             </form>
         </div>
        <div class="modal-footer">
            <button id="btn-cancelar-materia" class="btn-secondary">Cancelar</button>
            <button id="btn-limpiar-materia" class="btn-tertiary">Limpiar</button>
            <button id="btn-borrar-materia" class="btn-danger" style="display:none;">Eliminar</button>
            <button id="btn-guardar-materia" class="btn-primary">Guardar</button>
        </div>
     </div>
 </div>
        `;
        mainContent.innerHTML = htmlTemplate;

        // Eventos: abrir modal para nueva materia
        document.getElementById('btn-nueva-materia').addEventListener('click', () => {
                abrirModalMateria();
        });

        // Eventos: filas
        document.querySelectorAll('.fila-materia').forEach(row => {
                row.addEventListener('click', async () => {
                        const id = row.getAttribute('data-id');
                        const { data: materia } = await supabase.from('materias').select('*').eq('id', id).maybeSingle();
                        abrirModalMateria(materia);
                });
        });

        // Modal controls
        document.getElementById('modal-close').addEventListener('click', cerrarModalMateria);
        document.getElementById('btn-guardar-materia').addEventListener('click', guardarMateria);
        document.getElementById('btn-borrar-materia').addEventListener('click', borrarMateria);
        // Nuevo: Cancelar y Limpiar
        document.getElementById('btn-cancelar-materia').addEventListener('click', (ev) => { ev.preventDefault(); cerrarModalMateria(); });
        document.getElementById('btn-limpiar-materia').addEventListener('click', (ev) => { ev.preventDefault(); limpiarFormularioMateria(); });
}

    function abrirModalMateria(materia = null) {
            const modal = document.getElementById('modal-materia');
            const titulo = document.getElementById('modal-title');
            const inputId = document.getElementById('materia-id');
            const inputNombre = document.getElementById('materia-nombre');
            const inputDesc = document.getElementById('materia-descripcion');
            const btnBorrar = document.getElementById('btn-borrar-materia');

            if (materia) {
                    titulo.textContent = `Materia #${materia.id}`;
                    inputId.value = materia.id;
                    inputNombre.value = materia.materia_nombre || '';
                    inputDesc.value = materia.materia_descripcion || '';
                    btnBorrar.style.display = '';
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
            modal.style.display = 'none';
    }

    async function guardarMateria(e) {
            e.preventDefault();
            const id = document.getElementById('materia-id').value;
            const nombre = document.getElementById('materia-nombre').value.trim();
            const descripcion = document.getElementById('materia-descripcion').value.trim();

            if (!nombre) {
                    alert('El nombre es obligatorio');
                    return;
            }

            if (id) {
                    // Update
                    const { error } = await supabase.from('materias').update({ materia_nombre: nombre, materia_descripcion: descripcion }).eq('id', id);
                    if (error) { mostrarMensaje('error', 'Error al actualizar materia: ' + error.message); return; }
                    mostrarMensaje('success', 'Materia actualizada correctamente');
            } else {
                    // Create
                    const { error } = await supabase.from('materias').insert({ materia_nombre: nombre, materia_descripcion: descripcion });
                    if (error) { mostrarMensaje('error', 'Error al crear materia: ' + error.message); return; }
                    mostrarMensaje('success', 'Materia creada correctamente');
            }

            cerrarModalMateria();
            cargarVistaMaterias();
    }

    async function borrarMateria(e) {
            e.preventDefault();
            const id = document.getElementById('materia-id').value;
            if (!id) return;
            if (!confirm('¿Eliminar esta materia? Esta acción no se puede deshacer.')) return;

            const { error } = await supabase.from('materias').delete().eq('id', id);
            if (error) { mostrarMensaje('error', 'Error al eliminar materia: ' + error.message); return; }
            mostrarMensaje('success', 'Materia eliminada correctamente');

            cerrarModalMateria();
            cargarVistaMaterias();
    }

    function limpiarFormularioMateria() {
        const inputId = document.getElementById('materia-id');
        const inputNombre = document.getElementById('materia-nombre');
        const inputDesc = document.getElementById('materia-descripcion');

        inputId.value = '';
        inputNombre.value = '';
        inputDesc.value = '';
        inputNombre.focus();
    }

// 3. Renderizar Tabla de Grados
async function cargarVistaGrados() {
    mainContent.innerHTML = '<div class="loading">Consultando niveles...</div>';

    const { data: grados, error } = await supabase.from('grados').select('*');

    if (error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    let htmlTemplate = `
 <div class="header-seccion">
 <h2>Grados</h2>
 <p>Niveles educativos habilitados.</p>
 </div>
 <div class="table-responsive">
 <table class="data-table">
 <thead>
 <tr>
 <th>ID</th>
 <th>Nivel</th>
 <th>Nombre</th>
 <th>Descripción</th>
 </tr>
 </thead>
 <tbody>
 ${grados.map(g => `
 <tr>
 <td><strong># ${g.id}</strong></td>
 <td class="text-bold">${g.grado_numero}</td>
 <td class="text-light">${g.grado_nombre}</td>
 <td><span class="text-light">${g.grado_descripcion}</span></td>
 </tr>
 `).join('')}
 </tbody>
 </table>
 </div>
 `;
    mainContent.innerHTML = htmlTemplate;
}

// 4. Renderizar Tabla de Programas (mapea materia_id -> materia_nombre)
async function cargarVistaProgramas() {
    mainContent.innerHTML = '<div class="loading">Consultando Programas...</div>';

    // Obtener programas y materias en paralelo para mapear nombres sin requerir FK en la DB
    const [resProgramas, resMaterias] = await Promise.all([
        supabase.from('programas').select('*'),
        supabase.from('materias').select('*')
    ]);

    if (resProgramas.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${resProgramas.error.message}</p>`;
        return;
    }

    if (resMaterias.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error (materias): ${resMaterias.error.message}</p>`;
        return;
    }

    const programas = resProgramas.data || [];
    const materias = resMaterias.data || [];

    const materiasById = new Map(materias.map(m => [String(m.id), m.materia_nombre]));

    // Construir opciones de materias para el selector
    const opcionesMaterias = materias.map(m => `<option value="${m.id}">${m.materia_nombre}</option>`).join('');

    let htmlTemplate = `
        <div class="header-seccion" style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <h2>Programas</h2>
          <p>Contenido de programas.</p>
        </div>
        <div>
          <button id="btn-nuevo-programa" class="btn-primary">➕ Añadir</button>
        </div>
        </div>
        <div class="table-responsive">
            <table class="data-table" id="tabla-programas">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Materia</th>
                    <th>Programa</th>
                    <th>Objetivo</th>
                    <th>Versiculo</th>
                    <th>Estatus</th>
                </tr>
            </thead>
                <tbody>
                    ${programas.map(p => {
                        const nombreMateria = materiasById.get(String(p.materia_id)) || (p.materia_id ? `#${p.materia_id}` : 'Sin materia');
                        return `
                        <tr data-id="${p.id}" class="fila-programa">
                            <td><strong># ${p.id}</strong></td>
                            <td class="text-bold">${nombreMateria}</td>
                            <td class="text-bold">${p.programa_tema}</td>
                            <td><span class="text-light">${p.programa_objetivo}</span></td>
                            <td><span class="text-light">${p.programa_texto}</span></td>
                            <td>
                            <span class="badge" style="background-color: ${p.programa_estatus === 'Disponible' ? '#c7f9cc' : '#ffe3e0'}; color: #000;">
                            ${p.programa_estatus}
                            </span>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>

        <!-- Modal Programas -->
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
    mainContent.innerHTML = htmlTemplate;

    // Eventos
    document.getElementById('btn-nuevo-programa').addEventListener('click', () => abrirModalPrograma());

    document.querySelectorAll('.fila-programa').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: prog } = await supabase.from('programas').select('*').eq('id', id).maybeSingle();
            abrirModalPrograma(prog);
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
        modal.style.display = 'none';
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

        if (id) {
            const { error } = await supabase.from('programas').update({ materia_id: materia_id, programa_tema: tema, programa_objetivo: objetivo, programa_texto: texto, programa_estatus: estatus }).eq('id', id);
            if (error) { mostrarMensaje('error', 'Error al actualizar programa: ' + error.message); return; }
            mostrarMensaje('success', 'Programa actualizado correctamente');
        } else {
            const { error } = await supabase.from('programas').insert({ materia_id: materia_id, programa_tema: tema, programa_objetivo: objetivo, programa_texto: texto, programa_estatus: estatus });
            if (error) { mostrarMensaje('error', 'Error al crear programa: ' + error.message); return; }
            mostrarMensaje('success', 'Programa creado correctamente');
        }

        cerrarModalPrograma();
        cargarVistaProgramas();
    }

    async function borrarPrograma(e) {
        e.preventDefault();
        const id = document.getElementById('programa-id').value;
        if (!id) return;
        if (!confirm('¿Eliminar este programa? Esta acción no se puede deshacer.')) return;

        const { error } = await supabase.from('programas').delete().eq('id', id);
        if (error) { mostrarMensaje('error', 'Error al eliminar programa: ' + error.message); return; }
        mostrarMensaje('success', 'Programa eliminado correctamente');

        cerrarModalPrograma();
        cargarVistaProgramas();
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

// 5. Renderizar Tabla Clases con Filtro de Programa
async function cargarVistaClases() {
    mainContent.innerHTML = '<div class="loading">Consultando Clases...</div>';

    const { data: clases, error } = await supabase
        .from('clases')
        .select('clase_num, clase_tema, clase_objetivo, programas(programa_tema), programa_id');

    if (error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    const programasUnicos = [...new Set(
        clases
            .map(c => c.programas?.programa_tema)
            .filter(Boolean)
    )].sort();

    let htmlTemplate = `
    <div class="header-seccion">
        <h2>Clases</h2>
        <p>Listado General de Clases.</p>
    </div>

    <div class="filters-bar" style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
        <div style="flex: 1; min-width: 200px;">
            <input 
                type="text" 
                id="filter-search-clases" 
                class="form-control" 
                placeholder="Buscar Tema u Objetivo..." 
                oninput="window.aplicarFiltrosClases()"
            >
        </div>
        <div style="width: 220px;">
            <select id="filter-programa-clases" class="form-select" onchange="window.aplicarFiltrosClases()">
                <option value="">Todos los Programas</option>
                ${programasUnicos.map(programa => `<option value="${programa}">${programa}</option>`).join('')}
            </select>
        </div>
    </div>

    <div class="table-responsive table-clases-scroll">
        <table class="data-table" id="tabla-clases">
            <thead>
                <tr>
                    <th>Num</th>
                    <th>Tema</th>
                    <th>Objetivo</th>
                    <th>Programa</th>
                </tr>
            </thead>
            <tbody>
                ${[...clases]
                    .sort((a, b) => (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0))
                    .map(c => {
                        const nombrePrograma = c.programas?.programa_tema || 'Sin programa';
                        return `
                        <tr 
                        data-tema="${c.clase_tema || ''}" 
                        data-objetivo="${c.clase_objetivo || ''}"
                        data-programa="${nombrePrograma}"
                        >
                            <td><strong># ${c.clase_num}</strong></td>
                            <td class="text-bold">${c.clase_tema}</td>
                            <td><span class="text-light">${c.clase_objetivo}</span></td>
                            <td><span class="text-light">${nombrePrograma}</span></td>
                        </tr>
                        `;
                    }).join('')}
            </tbody>
        </table>
    </div>
    `;

    mainContent.innerHTML = htmlTemplate;
}

    window.aplicarFiltrosClases = function () {
        const textoBusqueda = (document.getElementById('filter-search-clases')?.value || '').toLowerCase();
        const programaSel = document.getElementById('filter-programa-clases')?.value || '';

        const filas = document.querySelectorAll('#tabla-clases tbody tr');

        filas.forEach(row => {
            const tema = row.getAttribute('data-tema').toLowerCase();
            const objetivo = row.getAttribute('data-objetivo').toLowerCase();
            const programa = row.getAttribute('data-programa');

            const coincideTexto = !textoBusqueda || tema.includes(textoBusqueda) || objetivo.includes(textoBusqueda);
            const coincidePrograma = !programaSel || programa === programaSel;

            if (coincideTexto && coincidePrograma) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

// Renderizar Tabla e Interfaz CRUD para Alumnos (Completo con Grados y campos adicionales)
async function cargarVistaAlumnos() {
    mainContent.innerHTML = '<div class="loading">Consultando Alumnos...</div>';

    // Obtener alumnos y grados en paralelo para mapear sin problemas de relaciones
    const [resAlumnos, resGrados] = await Promise.all([
        supabase.from('alumnos').select('*'),
        supabase.from('grados').select('*')
    ]);

    if (resAlumnos.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${resAlumnos.error.message}</p>`;
        return;
    }

    if (resGrados.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error (grados): ${resGrados.error.message}</p>`;
        return;
    }

    const alumnos = resAlumnos.data || [];
    const grados = resGrados.data || [];

    // Mapeo rápido de Grados por ID para mostrar su nombre
    const gradosById = new Map(grados.map(g => [String(g.id), g.grado_nombre]));

    // Opciones para el selector de Grado en el Modal
    const opcionesGrados = grados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('');

    // Ordenar alumnos de menor a mayor por ID
    alumnos.sort((a, b) => (a.id || 0) - (b.id || 0));

    let htmlTemplate = `
        <div class="header-seccion" style="display:flex;align-items:center;justify-content:space-between;">
            <div>
                <h2>Alumnos</h2>
                <p>Información general y gestión de alumnos.</p>
            </div>
            <div>
                <button id="btn-nuevo-alumno" class="btn-primary">➕ Añadir</button>
            </div>
        </div>

        <div class="table-responsive table-alumnos-scroll">
            <table class="data-table" id="tabla-alumnos">
                <thead> 
                    <tr>
                        <th>ID</th>
                        <th style="width: 50px; text-align: center;">Foto</th>
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
                        <tr data-id="${a.id}" class="fila-alumno" style="cursor: pointer;">
                            <td><strong># ${a.id}</strong></td>
                            <td style="text-align: center;">
                                <img src="${fotoUrl}" alt="${a.alumno_nombre}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Alumno&backgroundColor=0284c7'">
                            </td>
                            <td class="text-bold">${a.alumno_nombre}</td>
                            <td><span class="badge" style="background-color: #e0e7ff; color: #3730a3;">${nombreGrado}</span></td>
                            <td><span class="text-light">${a.alumno_email || '-'}</span></td>
                            <td><span class="text-light">${a.alumno_birthday || '-'}</span></td>
                            <td>
                                <span class="badge" style="background-color: ${a.alumno_sexo === 'Masculino' ? '#bde0fe' : '#ffafcc'}; color: #000;">
                                    ${a.alumno_sexo || 'N/A'}
                                </span>
                            </td>
                            <td><span class="text-light">${a.alumno_representante || '-'}</span></td>
                            <td><span class="text-light">${a.alumno_telf || '-'}</span></td>
                            <td><span class="text-light">${a.alumno_direccion || '-'}</span></td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <!-- Modal Alumnos -->
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

    mainContent.innerHTML = htmlTemplate;

    // Asignación de Eventos
    document.getElementById('btn-nuevo-alumno').addEventListener('click', () => abrirModalAlumno());

    // Evento de clic en cada fila para Editar
    document.querySelectorAll('.fila-alumno').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: alumno } = await supabase.from('alumnos').select('*').eq('id', id).maybeSingle();
            if (alumno) abrirModalAlumno(alumno);
        });
    });

    // Controladores del Modal
    document.getElementById('modal-alumno-close').addEventListener('click', () => cerrarModalAlumno());
    document.getElementById('btn-guardar-alumno').addEventListener('click', guardarAlumno);
    document.getElementById('btn-borrar-alumno').addEventListener('click', borrarAlumno);
    document.getElementById('btn-cancelar-alumno').addEventListener('click', (e) => { e.preventDefault(); cerrarModalAlumno(); });
    document.getElementById('btn-limpiar-alumno').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioAlumno(); });
}

/* =========================================================================
   FUNCIONES DE SOPORTE CRUD PARA ALUMNOS
   ========================================================================= */

let editandoId = null; // Control para saber si se está creando o actualizando

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
    modal.style.display = 'none';
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
        // Actualizar alumno existente
        const { error } = await supabase
            .from('alumnos')
            .update(payload)
            .eq('id', editandoId);

        if (error) { mostrarMensaje('error', 'Error al actualizar alumno: ' + error.message); return; }
        mostrarMensaje('success', 'Alumno actualizado correctamente');
    } else {
        // Consultar el mayor ID actual para asignar el siguiente
        const { data: ultimoAlumno, error: errorMax } = await supabase
            .from('alumnos')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (errorMax) {
            mostrarMensaje('error', 'Error al obtener el correlativo de ID: ' + errorMax.message);
            return;
        }

        const siguienteId = ultimoAlumno ? Number(ultimoAlumno.id) + 1 : 1;
        payload.id = siguienteId;

        // Insertar nuevo alumno con el ID auto-calculado
        const { error } = await supabase
            .from('alumnos')
            .insert(payload);

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

    const { error } = await supabase
        .from('alumnos')
        .delete()
        .eq('id', editandoId);

    if (error) { mostrarMensaje('error', 'Error al eliminar alumno: ' + error.message); return; }
    mostrarMensaje('success', 'Alumno eliminado correctamente');

    cerrarModalAlumno();
    cargarVistaAlumnos();
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

// 7. Renderizar Tabla Profesores (INCLUYE FOTO / AVATAR)
async function cargarVistaProfesores() {
    mainContent.innerHTML = '<div class="loading">Consultando Profesores...</div>';

    const { data: profesores, error } = await supabase.from('profesores').select('*');

    if (error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    // Ordenar profesores de menor a mayor por su ID
    profesores.sort((a, b) => (a.id || 0) - (b.id || 0));

    let htmlTemplate = `
 <div class="header-seccion">
 <h2>Profesores</h2>
 <p>Información general de los profesores.</p>
 </div>
 <div class="table-responsive table-profesores-scroll">
 <table class="data-table">
 <thead>
 <tr>
 <th>ID</th>
 <th style="width: 50px; text-align: center;">Foto</th>
 <th>Grado</th>
 <th>Nombre</th>
 <th>Email</th>
 <th>Telefono</th>
 <th>Estatus</th>
 <th>Rol</th> 
</tr>
 </thead>
 <tbody>
 ${profesores.map(p => {
     const fotoUrl = p.profe_imagen_url && p.profe_imagen_url.trim() !== ''
         ? p.profe_imagen_url
         : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.profe_nombre)}&backgroundColor=4f46e5`;

     return `
     <tr>
     <td><strong># ${p.id}</strong></td>
     <td style="text-align: center;">
         <img src="${fotoUrl}" alt="${p.profe_nombre}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Profe&backgroundColor=4f46e5'">
     </td>
     <td class="text-bold">${p.grado_id || '-'}</td>
     <td><span class="text-light">${p.profe_nombre}</span></td>
     <td><span class="text-light">${p.profe_email || '-'}</span></td>
     <td><span class="text-light">${p.profe_telf || '-'}</span></td>
     <td>
     <span class="badge" style="background-color: ${p.profe_estatus === 'Activo' ? '#c7f9cc' : '#ffccd5'}; color: #000;">
     ${p.profe_estatus || 'N/A'}
     </span>
    </td>
     <td><span class="text-light">${p.profe_rol || '-'}</span></td>
     </tr>
     `;
 }).join('')}
 </tbody>
 </table>
 </div>
 `;
    mainContent.innerHTML = htmlTemplate;
}

// 8. Renderizar Tabla Asignaciones
async function cargarVistaAsignaciones() {
    mainContent.innerHTML = '<div class="loading">Consultando Asignaciones...</div>';

    const { data: vista_asignaciones_detalles, error } = await supabase.from('vista_asignaciones_detalles').select('*');

    if (error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    let htmlTemplate = `
 <div class="header-seccion">
 <h2>Asignaciones</h2>
 <p>Distribución de los programas entre los grados.</p>
 </div>
 <div class="table-responsive">
 <table class="data-table">
 <thead>
 <tr>
 <th>ID</th>
 <th># Prog</th>
 <th>Programa</th>
 <th>Grado</th>
 <th>Estatus</th>
 <th>Periodo</th>
 <th>Materia</th>
 <th># Clases</th>
 </tr>
 </thead>
 <tbody>
 ${vista_asignaciones_detalles.map(n => `
 <tr>
 <td><strong># ${n.asigna_id}</strong></td>
 <td class="text-bold">${n.programa_id}</td>
 <td class="text-bold">${n.programa_tema}</td>
 <td><span class="text-light">${n.grado_numero}</span></td>
 <td><span class="text-light">${n.asigna_estatus}</span></td>
 <td><span class="text-light">${n.anio_periodo}</span></td>
 <td><span class="text-light">${n.materia_nombre}</span></td>
 <td><span class="text-light">${n.total_clases}</span></td>
 </tr>
 `).join('')}
 </tbody>
 </table>
 </div>
 `;
    mainContent.innerHTML = htmlTemplate;
}

// 9. Renderizar Tabla Ejecución de Clases
async function cargarVistaControl() {
    mainContent.innerHTML = '<div class="loading">Consultando Ejecución de Clases...</div>';

    // 1. Consultar vista_control y profesores en paralelo aprovechando la relación DB
    const [resVista, resProfesores] = await Promise.all([
        supabase.from('vista_control').select('*'),
        supabase.from('profesores').select('id, profe_imagen_url')
    ]);

    if (resVista.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${resVista.error.message}</p>`;
        return;
    }

    if (resProfesores.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error al cargar fotos: ${resProfesores.error.message}</p>`;
        return;
    }

    // 2. Crear un mapa con las fotos de los profesores usando su ID
    const mapaFotosProfesores = new Map();
    resProfesores.data.forEach(p => {
        mapaFotosProfesores.set(p.id, p.profe_imagen_url);
    });

    const vista_control = resVista.data;

    vista_control.sort((a, b) => {
        if (!a.control_fecha && !b.control_fecha) return (a.control_id || 0) - (b.control_id || 0);
        if (!a.control_fecha) return 1;
        if (!b.control_fecha) return -1;

        const comparacionFecha = new Date(a.control_fecha) - new Date(b.control_fecha);
        if (comparacionFecha === 0) {
            return (a.control_id || 0) - (b.control_id || 0);
        }
        return comparacionFecha;
    });

    const gradosUnicos = [...new Set(vista_control.map(n => n.grado_numero).filter(Boolean))].sort((a, b) => a - b);
    const programasUnicos = [...new Set(vista_control.map(n => n.programa_id).filter(Boolean))].sort((a, b) => a - b);
    const estatusUnicos = [...new Set(vista_control.map(n => n.control_estatus).filter(Boolean))].sort();

    let htmlTemplate = `
    <div class="header-seccion">
        <h2>Ejecución</h2>
        <p>Control de ejecución de clases.</p>
    </div>

    <div class="filters-bar" style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
        <div style="flex: 1; min-width: 200px;">
            <input type="text" id="filter-search" class="form-control" placeholder="Buscar Fecha, Clase o Profesor..." oninput="window.aplicarFiltrosControl()">
        </div>
        <div style="width: 180px;">
            <select id="filter-grado" class="form-select" onchange="window.aplicarFiltrosControl()">
                <option value="">Todos los Grados</option>
                ${gradosUnicos.map(grado => `<option value="${grado}">Grado ${grado}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-programa" class="form-select" onchange="window.aplicarFiltrosControl()">
                <option value="">Todos los Programas</option>
                ${programasUnicos.map(id => `<option value="${id}">Programa ${id}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-estatus" class="form-select" onchange="window.aplicarFiltrosControl()">
                <option value="">Todos los Estatus</option>
                ${estatusUnicos.map(e => `<option value="${e}">${e}</option>`).join('')}
            </select>
        </div>
    </div>

    <div class="table-responsive table-control-scroll">
        <table class="data-table" id="tabla-control">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th># Grado</th>
                    <th># ID Programa</th>
                    <th>Programa</th>
                    <th># Clase</th>
                    <th>Clase</th>
                    <th style="width: 50px; text-align: center;">Foto</th>
                    <th>Profesor</th>
                    <th>Observaciones</th>
                    <th># Estatus</th>
                </tr>
            </thead>
                <tbody>
                    ${[...vista_control]
                        .sort((a, b) => {
                            // Extrae el primer dígito del grado (ej. "1er Grado" -> 1)
                            const gradoA = parseInt(a.grado_numero, 10) || 0;
                            const gradoB = parseInt(b.grado_numero, 10) || 0;

                            // 1. Primero ordena por Grado
                            if (gradoA !== gradoB) {
                                return gradoA - gradoB;
                            }

                            // 2. Si es el mismo Grado, ordena por Clase
                            return (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0);
                        })
                        .map(n => {
                            // Obtener la URL de la foto usando profe_id mapeado desde la tabla profesores
                            const urlImagenBase = mapaFotosProfesores.get(n.profe_id);
                            const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                                ? urlImagenBase
                                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n.profe_nombre || 'Profe')}&backgroundColor=4f46e5`;

                            return `
                            <tr 
                            data-fecha="${n.control_fecha || ''}" 
                            data-grado="${n.grado_numero || ''}"
                            data-programa="${n.programa_id || ''}" 
                            data-clase="${n.clase_tema || ''}" 
                            data-profesor="${n.profe_nombre || ''}" 
                            data-estatus="${n.control_estatus || ''}"
                            >
                                <td><strong># ${n.control_fecha ?? 'Sin fecha'}</strong></td>
                                <td class="text-bold">${n.grado_numero}</td>
                                <td class="text-bold">${n.programa_id}</td>
                                <td><span class="text-light">${n.programa_tema}</span></td>
                                <td><span class="text-light">${n.clase_num}</span></td>
                                <td><span class="text-light">${n.clase_tema}</span></td>
                                <td style="text-align: center;">
                                    <img src="${fotoUrl}" alt="${n.profe_nombre || 'Profesor'}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Profe&backgroundColor=4f46e5'">
                                </td>
                                <td><span class="text-light">${n.profe_nombre}</span></td>
                                <td><span class="text-light">${n.control_observaciones}</span></td>
                                <td>
                                    <span class="badge" style="background-color: ${n.control_estatus === 'Pendiente' ? '#ffc107' : n.control_estatus === 'Programada' ? '#198754' : n.control_estatus === 'Vista' ? '#dc3545' : '#6c757d'}; color: ${n.control_estatus === 'Pendiente' ? '#000000' : '#ffffff'};">
                                        ${n.control_estatus}
                                    </span>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                </tbody>
        </table>
    </div>
     `;
    
     mainContent.innerHTML = htmlTemplate;
}

    window.aplicarFiltrosControl = function () {
        const textoBusqueda = (document.getElementById('filter-search')?.value || '').toLowerCase();
        const gradoSel = document.getElementById('filter-grado')?.value || '';
        const programaSel = document.getElementById('filter-programa')?.value || '';
        const estatusSel = document.getElementById('filter-estatus')?.value || '';

        const filas = document.querySelectorAll('#tabla-control tbody tr');

        filas.forEach(row => {
            const fecha = row.getAttribute('data-fecha').toLowerCase();
            const clase = row.getAttribute('data-clase').toLowerCase();
            const profesor = row.getAttribute('data-profesor').toLowerCase();
            const grado = row.getAttribute('data-grado');
            const programa = row.getAttribute('data-programa');
            const estatus = row.getAttribute('data-estatus');

            const coincideTexto = !textoBusqueda || fecha.includes(textoBusqueda) || clase.includes(textoBusqueda) || profesor.includes(textoBusqueda);
            const coincideGrado = !gradoSel || grado === gradoSel;
            const coincidePrograma = !programaSel || programa === programaSel;
            const coincideEstatus = !estatusSel || estatus === estatusSel;

            if (coincideTexto && coincideGrado && coincidePrograma && coincideEstatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

// 10. Renderizar Tabla de Asistencias
async function cargarVistaAsistencias() {
    mainContent.innerHTML = '<div class="loading">Consultando Registro de Asistencias...</div>';

    // 1. Consultar vista_asistencias y alumnos en paralelo
    const [resVista, resAlumnos] = await Promise.all([
        supabase.from('vista_asistencias').select('*'),
        supabase.from('alumnos').select('alumno_nombre, alumno_imagen_url')
    ]);

    if (resVista.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${resVista.error.message}</p>`;
        return;
    }

    if (resAlumnos.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error al cargar fotos: ${resAlumnos.error.message}</p>`;
        return;
    }

    // 2. Crear un mapa con las fotos de los alumnos usando su nombre como clave
    const mapaFotosAlumnos = new Map();
    resAlumnos.data.forEach(a => {
        if (a.alumno_nombre) {
            mapaFotosAlumnos.set(a.alumno_nombre.trim().toLowerCase(), a.alumno_imagen_url);
        }
    });

    const vista_asistencias = resVista.data;

    vista_asistencias.sort((a, b) => {
        if (!a.fecha && !b.fecha) return (a.asistencia_id || 0) - (b.asistencia_id || 0);
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;

        const comparacionFecha = new Date(a.fecha) - new Date(b.fecha);
        if (comparacionFecha === 0) {
            return (a.asistencia_id || 0) - (b.asistencia_id || 0);
        }
        return comparacionFecha;
    });

    const alumnosUnicos = [...new Set(vista_asistencias.map(n => n.alumno).filter(Boolean))].sort();
    const gradosUnicos = [...new Set(vista_asistencias.map(n => n.grado).filter(Boolean))].sort();
    const profesoresUnicos = [...new Set(vista_asistencias.map(n => n.profesor).filter(Boolean))].sort();

    let htmlTemplate = `
    <div class="header-seccion">
        <h2>Asistencias</h2>
        <p>Control y seguimiento de asistencias por clase.</p>
    </div>

    <div class="filters-bar" style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
        <div style="flex: 1; min-width: 200px;">
            <input type="text" id="filter-search-asist" class="form-control" placeholder="Buscar Fecha, Programa, Clase u Observación..." oninput="window.aplicarFiltrosAsistencias()">
        </div>
        <div style="width: 200px;">
            <select id="filter-alumno" class="form-select" onchange="window.aplicarFiltrosAsistencias()">
                <option value="">Todos los Alumnos</option>
                ${alumnosUnicos.map(alumno => `<option value="${alumno}">${alumno}</option>`).join('')}
            </select>
        </div>
        <div style="width: 180px;">
            <select id="filter-grado-asist" class="form-select" onchange="window.aplicarFiltrosAsistencias()">
                <option value="">Todos los Grados</option>
                ${gradosUnicos.map(grado => `<option value="${grado}">${grado}</option>`).join('')}
            </select>
        </div>
        <div style="width: 200px;">
            <select id="filter-profesor" class="form-select" onchange="window.aplicarFiltrosAsistencias()">
                <option value="">Todos los Profesores</option>
                ${profesoresUnicos.map(profe => `<option value="${profe}">${profe}</option>`).join('')}
            </select>
        </div>
    </div>

    <div class="table-responsive">
        <table class="data-table" id="tabla-asistencias">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th style="width: 50px; text-align: center;">Foto</th>
                    <th>Alumno</th>
                    <th>Profesor</th>
                    <th>Programa</th>
                    <th>Clase</th>
                    <th>Grado</th>
                    <th>Asistencia</th>
                    <th>Evaluación</th>
                    <th>Observaciones</th>
                </tr>
            </thead>
            <tbody>
                ${vista_asistencias.map(n => {
                    // Obtener la URL de la foto haciendo coincidir el nombre del alumno
                    const claveNombre = (n.alumno || '').trim().toLowerCase();
                    const urlImagenBase = mapaFotosAlumnos.get(claveNombre);

                    const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                        ? urlImagenBase
                        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n.alumno || 'Alumno')}&backgroundColor=0284c7`;

                    return `
                    <tr 
                      data-fecha="${n.fecha || ''}" 
                      data-alumno="${n.alumno || ''}"
                      data-profesor="${n.profesor || ''}" 
                      data-programa="${n.programa || ''}" 
                      data-clase="${n.clase || ''}" 
                      data-grado="${n.grado || ''}"
                      data-observaciones="${n.observaciones || ''}"
                    >
                        <td><strong># ${n.fecha ?? 'Sin fecha'}</strong></td>
                        <td style="text-align: center;">
                            <img src="${fotoUrl}" alt="${n.alumno || 'Alumno'}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Alumno&backgroundColor=0284c7'">
                        </td>
                        <td class="text-bold">${n.alumno}</td>
                        <td><span class="text-light">${n.profesor}</span></td>
                        <td><span class="text-light">${n.programa}</span></td>
                        <td><span class="text-light">${n.clase}</span></td>
                        <td class="text-bold">${n.grado}</td>
                        <td>
                            <span class="badge" style="background-color: ${n.presente ? '#198754' : '#dc3545'}; color: #ffffff;">
                                ${n.presente ? 'Presente' : 'Ausente'}
                            </span>
                        </td>
                        <td>
                            <span class="badge" style="background-color: ${n.evaluacion === 'excelente' ? '#0d6efd' : n.evaluacion === 'bueno' ? '#198754' : n.evaluacion === 'deficiente' ? '#dc3545' : '#6c757d'}; color: #ffffff;">
                                ${n.evaluacion ?? 'N/A'}
                            </span>
                        </td>
                        <td><span class="text-light">${n.observaciones ?? ''}</span></td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>
    `;

    mainContent.innerHTML = htmlTemplate;
}

    window.aplicarFiltrosAsistencias = function () {
        const textoBusqueda = (document.getElementById('filter-search-asist')?.value || '').toLowerCase();
        const alumnoSel = document.getElementById('filter-alumno')?.value || '';
        const gradoSel = document.getElementById('filter-grado-asist')?.value || '';
        const profesorSel = document.getElementById('filter-profesor')?.value || '';

        const filas = document.querySelectorAll('#tabla-asistencias tbody tr');

        filas.forEach(row => {
            const fecha = row.getAttribute('data-fecha').toLowerCase();
            const programa = row.getAttribute('data-programa').toLowerCase();
            const clase = row.getAttribute('data-clase').toLowerCase();
            const observaciones = row.getAttribute('data-observaciones').toLowerCase();

            const alumno = row.getAttribute('data-alumno');
            const grado = row.getAttribute('data-grado');
            const profesor = row.getAttribute('data-profesor');

            const coincideTexto = !textoBusqueda || fecha.includes(textoBusqueda) || programa.includes(textoBusqueda) || clase.includes(textoBusqueda) || observaciones.includes(textoBusqueda);
            const coincideAlumno = !alumnoSel || alumno === alumnoSel;
            const coincideGrado = !gradoSel || grado === gradoSel;
            const coincideProfesor = !profesorSel || profesor === profesorSel;

            if (coincideTexto && coincideAlumno && coincideGrado && coincideProfesor) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };
// 11. Renderizar Formulario de Gestión de Perfil / Fotos
async function cargarVistaPerfil() {
    mainContent.innerHTML = '<div class="loading">Cargando opciones de Perfil...</div>';

    const { data: profesores } = await supabase.from('profesores').select('id, profe_nombre, profe_imagen_url');
    const { data: alumnos } = await supabase.from('alumnos').select('id, alumno_nombre, alumno_imagen_url');

    let htmlTemplate = `
    <div class="header-seccion">
        <h2>Gestión de Perfil</h2>
        <p>Asignación y actualización de fotografías para Usuarios.</p>
    </div>

    <div style="max-width: 520px; margin: 20px auto; background-color: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3); color: #f8fafc;">
        
        <div style="margin-bottom: 22px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #cbd5e1; font-size: 0.9rem;">
                👤 Tipo de Usuario
            </label>
            <select id="perfil-tipo-usuario" class="form-select" style="width: 100%; padding: 10px 14px; background-color: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; font-size: 0.95rem; outline: none;" onchange="window.cambiarTipoPerfil()">
                <option value="profesor">Profesor</option>
                <option value="alumno">Alumno</option>
            </select>
        </div>

        <div style="margin-bottom: 25px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #cbd5e1; font-size: 0.9rem;">
                📋 Seleccionar Registro
            </label>
            <select id="perfil-id-registro" class="form-select" style="width: 100%; padding: 10px 14px; background-color: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; font-size: 0.95rem; outline: none;" onchange="window.actualizarPreviewFoto()">
            </select>
        </div>

        <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #0f172a; border-radius: 8px; border: 1px dashed #475569;">
            <p id="perfil-foto-titulo" style="margin: 0 0 12px 0; font-size: 0.85rem; color: #94a3b8; font-weight: 500;">Fotografía Actual</p>
            <div style="position: relative; width: 110px; height: 110px; margin: 0 auto;">
                <img id="perfil-foto-preview" src="https://api.dicebear.com/7.x/initials/svg?seed=Usuario&backgroundColor=4f46e5" alt="Vista previa" style="width: 110px; height: 110px; object-fit: cover; border-radius: 50%; border: 3px solid #6366f1; box-shadow: 0 4px 12px rgba(0,0,0,0.4);" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Usuario&backgroundColor=4f46e5'">
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #cbd5e1; font-size: 0.9rem;">
                🖼️ Seleccionar Nueva Foto
            </label>
            <input type="file" id="perfil-input-file" accept="image/*" class="form-control" style="width: 100%; padding: 8px; background-color: #0f172a; color: #cbd5e1; border: 1px solid #475569; border-radius: 6px; cursor: pointer;" onchange="window.previsualizarArchivoSeleccionado(this)">
        </div>

        <div style="display: flex; gap: 12px;">
            <button type="button" id="btn-cancelar-foto" class="btn" style="display: none; flex: 1; background: #334155; color: #cbd5e1; padding: 12px; border: 1px solid #475569; border-radius: 6px; font-weight: 600; font-size: 0.95rem; cursor: pointer;" onclick="window.limpiarSeleccionFoto()">
                ✖️ Cancelar
            </button>
            <button type="button" class="btn" style="flex: 2; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 12px; border: none; border-radius: 6px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);" onclick="window.ejecutarSubidaFoto()">
                💾 Guardar Fotografía
            </button>
        </div>
    </div>
    `;

    mainContent.innerHTML = htmlTemplate;

    window._datosPerfil = {
        profesores: profesores || [],
        alumnos: alumnos || []
    };

    window.cambiarTipoPerfil();
}

    // Funciones Auxiliares Globales para Perfil
    window.cambiarTipoPerfil = function () {
        const tipo = document.getElementById('perfil-tipo-usuario')?.value;
        const selectRegistro = document.getElementById('perfil-id-registro');
        if (!selectRegistro || !window._datosPerfil) return;

        const lista = tipo === 'profesor' ? window._datosPerfil.profesores : window._datosPerfil.alumnos;

        selectRegistro.innerHTML = lista.map(item => {
            const nombre = tipo === 'profesor' ? item.profe_nombre : item.alumno_nombre;
            const foto = tipo === 'profesor' ? item.profe_imagen_url : item.alumno_imagen_url;
            return `<option value="${item.id}" data-foto="${foto || ''}" data-nombre="${nombre}">${nombre} (#${item.id})</option>`;
        }).join('');

        window.limpiarSeleccionFoto();
    };

    window.actualizarPreviewFoto = function () {
        const selectRegistro = document.getElementById('perfil-id-registro');
        const imgPreview = document.getElementById('perfil-foto-preview');
        const titulo = document.getElementById('perfil-foto-titulo');
        if (!selectRegistro || !imgPreview) return;

        const option = selectRegistro.options[selectRegistro.selectedIndex];
        const fotoUrl = option?.getAttribute('data-foto');
        const nombre = option?.getAttribute('data-nombre') || 'Usuario';

        if (titulo) titulo.textContent = 'Fotografía Actual';

        if (fotoUrl && fotoUrl.trim() !== '') {
            imgPreview.src = fotoUrl;
        } else {
            const seed = encodeURIComponent(nombre.substring(0, 2));
            imgPreview.src = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=4f46e5`;
        }
    };

    window.previsualizarArchivoSeleccionado = function (input) {
        const file = input.files[0];
        const imgPreview = document.getElementById('perfil-foto-preview');
        const btnCancelar = document.getElementById('btn-cancelar-foto');
        const titulo = document.getElementById('perfil-foto-titulo');

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imgPreview.src = e.target.result;
                if (btnCancelar) btnCancelar.style.display = 'block';
                if (titulo) titulo.textContent = '✨ Vista Previa de la Nueva Foto';
            };
            reader.readAsDataURL(file);
        }
    };

    window.limpiarSeleccionFoto = function () {
        const inputFile = document.getElementById('perfil-input-file');
        const btnCancelar = document.getElementById('btn-cancelar-foto');

        if (inputFile) inputFile.value = '';
        if (btnCancelar) btnCancelar.style.display = 'none';

        window.actualizarPreviewFoto();
    };

    window.ejecutarSubidaFoto = function () {
        const tipo = document.getElementById('perfil-tipo-usuario')?.value;
        const id = document.getElementById('perfil-id-registro')?.value;
        const inputFile = document.getElementById('perfil-input-file');

        if (typeof subirFotoUsuario === 'function') {
            subirFotoUsuario(tipo, id, inputFile).then(url => {
                if (url) {
                    cargarVistaPerfil();
                }
            });
        } else {
            alert("⚠️ La función 'subirFotoUsuario' no está definida globalmente.");
        }
    };

    window.subirFotoUsuario = async function (tipo, id, inputFile) {
        if (!inputFile || !inputFile.files || inputFile.files.length === 0) {
            alert("⚠️ Por favor selecciona una imagen antes de guardar.");
            return null;
        }

        const selectRegistro = document.getElementById('perfil-id-registro');
        const option = selectRegistro?.options[selectRegistro.selectedIndex];
        
        let nombreUsuario = option?.getAttribute('data-nombre') || `usuario_${id}`;

        const nombreLimpio = nombreUsuario
            .toLowerCase()
            .trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_");

        const file = inputFile.files[0];
        const fileExt = file.name.split('.').pop().toLowerCase();

        const fileName = `${nombreLimpio}_${tipo}_${id}.${fileExt}`;

        const esProfesor = tipo === 'profesor';
        const nombreBucket = esProfesor ? 'fotos-profesores' : 'fotos-alumnos';
        const nombreTabla = esProfesor ? 'profesores' : 'alumnos';
        const campoFoto = esProfesor ? 'profe_imagen_url' : 'alumno_imagen_url';

        try {
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(nombreBucket)
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from(nombreBucket)
                .getPublicUrl(fileName);

            const publicUrl = publicUrlData.publicUrl;

            const { error: updateError } = await supabase
                .from(nombreTabla)
                .update({ [campoFoto]: publicUrl })
                .eq('id', id);

            if (updateError) throw updateError;

            alert(`✅ ¡Fotografía guardada como "${fileName}" exitosamente!`);
            return publicUrl;

        } catch (err) {
            console.error("Error al subir la imagen:", err);
            alert("❌ Error al guardar la imagen: " + (err.message || err));
            return null;
        }
    };

// 12. RENDERIZAR VISTA DASHBOARD CON KPIS Y GRÁFICOS
async function cargarVistaDashboard() {
    mainContent.innerHTML = '<div class="loading">Cargando Dashboard...</div>';

    try {
        // Consultas simultáneas en paralelo
        const [resAlumnos, resProfes, resControl, resAsistencias] = await Promise.all([
            supabase.from('alumnos').select('id', { count: 'exact' }),
            supabase.from('profesores').select('id', { count: 'exact' }),
            supabase.from('vista_control').select('*'),
            supabase.from('vista_asistencias').select('*')
        ]);

        const totalAlumnos = resAlumnos.count || 0;
        const totalProfesores = resProfes.count || 0;
        const controlData = resControl.data || [];
        const asistenciasData = resAsistencias.data || [];

        // Cálculos de KPIs
        const totalAsistencias = asistenciasData.length;
        const presentes = asistenciasData.filter(a => a.presente).length;
        const porcAsistencia = totalAsistencias > 0 ? ((presentes / totalAsistencias) * 100).toFixed(1) : 0;

        const clasesVistas = controlData.filter(c => c.control_estatus === 'Vista').length;

        // Maquetación HTML del Dashboard
        let htmlTemplate = `
        <div class="header-seccion">
            <h2>📊 Dashboard General</h2>
            <p>Resumen de indicadores clave y métricas académicas.</p>
        </div>

        <!-- TARJETAS KPIS -->
        <div class="dashboard-grid">
            <div class="kpi-card">
                <h3>Alumnos Registrados</h3>
                <div class="kpi-value">🎓 ${totalAlumnos}</div>
            </div>
            <div class="kpi-card">
                <h3>Profesores Activos</h3>
                <div class="kpi-value">👨‍🏫 ${totalProfesores}</div>
            </div>
            <div class="kpi-card">
                <h3>% Asistencia Global</h3>
                <div class="kpi-value" style="color: ${porcAsistencia >= 85 ? '#4ade80' : '#f87171'};">
                    📈 ${porcAsistencia}%
                </div>
            </div>
            <div class="kpi-card">
                <h3>Clases Impartidas</h3>
                <div class="kpi-value" style="color: #60a5fa;">📚 ${clasesVistas}</div>
            </div>
        </div>

        <!-- GRÁFICOS -->
        <div class="charts-grid">
            <div class="chart-card">
                <h3>Estatus de Ejecución de Clases</h3>
                <div style="position: relative; height:250px;">
                    <canvas id="chartEstatusClases"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <h3>Asistencia por Grado (%)</h3>
                <div style="position: relative; height:250px;">
                    <canvas id="chartAsistenciaGrado"></canvas>
                </div>
            </div>
        </div>

        <!-- ÚLTIMAS CLASES EJECUTADAS -->
        <div class="header-seccion" style="margin-top: 30px;">
            <h3>Últimas Clases Registradas</h3>
        </div>
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Grado</th>
                        <th>Clase / Tema</th>
                        <th>Profesor</th>
                        <th>Estatus</th>
                    </tr>
                </thead>
                <tbody>
                    ${controlData.slice(0, 5).map(c => `
                        <tr>
                            <td><strong># ${c.control_fecha || 'Sin fecha'}</strong></td>
                            <td class="text-bold">Grado ${c.grado_numero || '-'}</td>
                            <td><span class="text-light">${c.clase_tema || '-'}</span></td>
                            <td><span class="text-light">${c.profe_nombre || '-'}</span></td>
                            <td>
                                <span class="badge" style="background-color: ${c.control_estatus === 'Pendiente' ? '#ffc107' : c.control_estatus === 'Programada' ? '#198754' : c.control_estatus === 'Vista' ? '#dc3545' : '#6c757d'}; color: ${c.control_estatus === 'Pendiente' ? '#000' : '#fff'};">
                                    ${c.control_estatus || 'N/A'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;

        mainContent.innerHTML = htmlTemplate;

        // RENDERIZAR GRÁFICOS CHART.JS TRAS INYECTAR EL HTML
        renderizarGraficoEstatus(controlData);
        renderizarGraficoAsistencia(asistenciasData);

    } catch (err) {
        console.error("Error cargando el Dashboard:", err);
        mainContent.innerHTML = `<p class="error-msg">❌ Error al cargar indicadores: ${err.message}</p>`;
    }
}

    // LÓGICA DE DIBUJO DE GRÁFICOS
    function renderizarGraficoEstatus(controlData) {
        const ctx = document.getElementById('chartEstatusClases')?.getContext('2d');
        if (!ctx) return;

        const vistas = controlData.filter(c => c.control_estatus === 'Vista').length;
        const programadas = controlData.filter(c => c.control_estatus === 'Programada').length;
        const pendientes = controlData.filter(c => c.control_estatus === 'Pendiente').length;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Vistas', 'Programadas', 'Pendientes'],
                datasets: [{
                    data: [vistas, programadas, pendientes],
                    backgroundColor: ['#dc3545', '#198754', '#ffc107'],
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#cbd5e1' } }
                }
            }
        });
    }

    function renderizarGraficoAsistencia(asistenciasData) {
        const ctx = document.getElementById('chartAsistenciaGrado')?.getContext('2d');
        if (!ctx) return;

        // Agrupar por grado
        const gradosMap = {};
        asistenciasData.forEach(a => {
            const g = a.grado || 'Sin Grado';
            if (!gradosMap[g]) gradosMap[g] = { total: 0, presentes: 0 };
            gradosMap[g].total++;
            if (a.presente) gradosMap[g].presentes++;
        });

        const labels = Object.keys(gradosMap);
        const porcentajes = labels.map(g => {
            const total = gradosMap[g].total;
            return total > 0 ? ((gradosMap[g].presentes / total) * 100).toFixed(1) : 0;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '% Asistencia',
                    data: porcentajes,
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8' } },
                    x: { ticks: { color: '#94a3b8' } }
                },
                plugins: {
                    legend: { labels: { color: '#cbd5e1' } }
                }
            }
        });
    }
