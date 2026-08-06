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

const headerIcons = {
    dashboard: `<svg class="header-icon-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
    materias: `<svg class="header-icon-svg" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    programas: `<svg class="header-icon-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    clases: `<svg class="header-icon-svg" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    periodos: `<svg class="header-icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    asignaciones: `<svg class="header-icon-svg" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
    control: `<svg class="header-icon-svg" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    asistencias: `<svg class="header-icon-svg" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    grados: `<svg class="header-icon-svg" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    alumnos: `<svg class="header-icon-svg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    profesores: `<svg class="header-icon-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    configuracion: `<svg class="header-icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33 1.82H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    perfil: `<svg class="header-icon-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
};

function renderHeaderSeccion(key, titulo, subtitulo, acciones = '') {
    return `
        <div class="header-seccion">
            <div class="header-seccion-main">
                <span class="header-icon">${headerIcons[key] || ''}</span>
                <div class="header-seccion-text">
                    <h2>${titulo}</h2>
                    <p>${subtitulo}</p>
                </div>
            </div>
            ${acciones}
        </div>
    `;
}

// LOGOUT
btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// LANZAR VERIFICACIÓN INICIAL
checkUser();
menuToggle.addEventListener('click', toggleMenu);
asideOverlay.addEventListener('click', cerrarMenuMovil);

// VERIFICAR SESIÓN Y CARGAR AVATAR PERSONALIZADO DINÁMICAMENTE
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
navMaterias.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navMaterias.classList.add('active');
    cargarVistaMaterias();
    cerrarMenuMovil();
});

navGrados.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navGrados.classList.add('active');
    cargarVistaGrados();
    cerrarMenuMovil();
});

navProgramas.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navProgramas.classList.add('active');
    cargarVistaProgramas();
    cerrarMenuMovil();
});

navClases.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navClases.classList.add('active');
    cargarVistaClases();
    cerrarMenuMovil();
});

navAlumnos.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navAlumnos.classList.add('active');
    cargarVistaAlumnos();
    cerrarMenuMovil();
});

navProfesores.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navProfesores.classList.add('active');
    cargarVistaProfesores();
    cerrarMenuMovil();
});

navAsignaciones.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navAsignaciones.classList.add('active');
    cargarVistaAsignaciones();
    cerrarMenuMovil();
});

navControl.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navControl.classList.add('active');
    cargarVistaControl();
    cerrarMenuMovil();
});

navPeriodos.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navPeriodos.classList.add('active');
    cargarVistaPeriodos();
    cerrarMenuMovil();
});

navAsistencias.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navAsistencias.classList.add('active');
    cargarVistaAsistencias();
    cerrarMenuMovil();
});

navPerfil.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navPerfil.classList.add('active');
    cargarVistaPerfil();
    cerrarMenuMovil();
});

navDashboard.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    navDashboard.classList.add('active');
    cargarVistaDashboard();
    cerrarMenuMovil();
});

// VISTA DASHBOARD
async function cargarVistaDashboard() {
    mainContent.innerHTML = `
        ${renderHeaderSeccion('dashboard', 'Panel Principal', 'Bienvenido al Sistema de Gestión Académica.')}
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-top: 20px;">
            <div style="background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; color: #fff;">
                <h3>📚 Materias</h3>
                <p style="color: #94a3b8; margin-top: 5px;">Gestión de asignaturas y contenidos.</p>
            </div>
            <div style="background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; color: #fff;">
                <h3>👥 Alumnos</h3>
                <p style="color: #94a3b8; margin-top: 5px;">Registro y expediente escolar.</p>
            </div>
            <div style="background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; color: #fff;">
                <h3>👨‍🏫 Profesores</h3>
                <p style="color: #94a3b8; margin-top: 5px;">Planta docente y asignaciones.</p>
            </div>
            <div style="background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; color: #fff;">
                <h3>📊 Ejecución</h3>
                <p style="color: #94a3b8; margin-top: 5px;">Control de clases y asistencias.</p>
            </div>
        </div>
    `;
}

// 1. Renderizar Tabla de Periodos
async function cargarVistaPeriodos() {
    mainContent.innerHTML = '<div class="loading">Consultando periodos...</div>';

    const { data: periodos, error } = await supabase
        .from('anio')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error al cargar periodos: ${error.message}</p>`;
        return;
    }

    const listaPeriodos = periodos || [];

    let htmlTemplate = `
        ${renderHeaderSeccion('periodos', 'Períodos', 'Años académicos por período.', `<div class="header-action-container"><button id="btn-nuevo-periodo" class="btn-header-action" aria-label="Añadir">+</button></div>`)}

        <div class="table-responsive">
            <table class="data-table" id="tabla-periodos">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Período</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                    </tr>
                </thead>
                <tbody>
                    ${listaPeriodos.map(a => `
                        <tr data-id="${a.id}" class="fila-periodo" style="cursor:pointer;">
                            <td><strong># ${a.id}</strong></td>
                            <td class="text-bold">${a.anio_periodo}</td>
                            <td><span class="text-light">${a.anio_inicio || 'Sin inicio'}</span></td>
                            <td><span class="text-light">${a.anio_fin || 'Sin fin'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Modal Periodos -->
        <div id="modal-periodo" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-periodo-title">Período</h3>
                    <button id="modal-periodo-close" class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-periodo">
                        <input type="hidden" id="periodo-id">
                        
                        <div class="form-row">
                            <label>Nombre del Período (Ej: 2025-2026)</label>
                            <input id="periodo-nombre" type="text" placeholder="Ej. 2025-2026" required>
                        </div>

                        <div class="form-row">
                            <label>Fecha de Inicio</label>
                            <input id="periodo-inicio" type="date" required>
                        </div>

                        <div class="form-row">
                            <label>Fecha de Fin</label>
                            <input id="periodo-fin" type="date" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button id="btn-cancelar-periodo" class="btn-secondary">Cancelar</button>
                    <button id="btn-limpiar-periodo" class="btn-tertiary">Limpiar</button>
                    <button id="btn-borrar-periodo" class="btn-danger" style="display:none;">Eliminar</button>
                    <button id="btn-guardar-periodo" class="btn-primary">Guardar</button>
                </div>
            </div>
        </div>
    `;

    mainContent.innerHTML = htmlTemplate;

    document.getElementById('btn-nuevo-periodo').addEventListener('click', () => abrirModalPeriodo());

    document.querySelectorAll('.fila-periodo').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: item } = await supabase.from('anio').select('*').eq('id', id).maybeSingle();
            if (item) abrirModalPeriodo(item);
        });
    });

    document.getElementById('modal-periodo-close').addEventListener('click', () => cerrarModalPeriodo());
    document.getElementById('btn-guardar-periodo').addEventListener('click', guardarPeriodo);
    document.getElementById('btn-borrar-periodo').addEventListener('click', borrarPeriodo);
    document.getElementById('btn-cancelar-periodo').addEventListener('click', (e) => { e.preventDefault(); cerrarModalPeriodo(); });
    document.getElementById('btn-limpiar-periodo').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioPeriodo(); });
}

function abrirModalPeriodo(periodo = null) {
    const modal = document.getElementById('modal-periodo');
    const titulo = document.getElementById('modal-periodo-title');
    const inputId = document.getElementById('periodo-id');
    const inpNombre = document.getElementById('periodo-nombre');
    const inpInicio = document.getElementById('periodo-inicio');
    const inpFin = document.getElementById('periodo-fin');
    const btnBorrar = document.getElementById('btn-borrar-periodo');

    if (periodo) {
        titulo.textContent = `Período #${periodo.id}`;
        inputId.value = periodo.id;
        inpNombre.value = periodo.anio_periodo || '';
        inpInicio.value = periodo.anio_inicio || '';
        inpFin.value = periodo.anio_fin || '';
        btnBorrar.style.display = 'inline-block';
    } else {
        titulo.textContent = 'Nuevo Período';
        inputId.value = '';
        inpNombre.value = '';
        inpInicio.value = '';
        inpFin.value = '';
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

    if (id) {
        const { error } = await supabase.from('anio').update(payload).eq('id', id);
        if (error) { mostrarMensaje('error', 'Error al actualizar el período: ' + error.message); return; }
        mostrarMensaje('success', 'Período actualizado con éxito');
    } else {
        const { error } = await supabase.from('anio').insert(payload);
        if (error) { mostrarMensaje('error', 'Error al crear el período: ' + error.message); return; }
        mostrarMensaje('success', 'Período creado con éxito');
    }

    cerrarModalPeriodo();
    cargarVistaPeriodos();
}

async function borrarPeriodo(e) {
    e.preventDefault();
    const id = document.getElementById('periodo-id').value;
    if (!id) return;

    if (!confirm(`¿Estás seguro de eliminar el período #${id}? Esta acción afectará los registros vinculados.`)) return;

    const { error } = await supabase.from('anio').delete().eq('id', id);
    if (error) { 
        mostrarMensaje('error', 'Error al eliminar el período: ' + error.message); 
        return; 
    }

    mostrarMensaje('success', 'Período eliminado correctamente');
    cerrarModalPeriodo();
    cargarVistaPeriodos();
}

function limpiarFormularioPeriodo() {
    document.getElementById('periodo-id').value = '';
    document.getElementById('periodo-nombre').value = '';
    document.getElementById('periodo-inicio').value = '';
    document.getElementById('periodo-fin').value = '';
    document.getElementById('periodo-nombre').focus();
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
        ${renderHeaderSeccion('materias', 'Materias', 'Disciplinas académicas del diseño curricular.', `<div class="header-action-container"><button id="btn-nueva-materia" class="btn-header-action" aria-label="Añadir">+</button></div>`)}
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

    document.getElementById('btn-nueva-materia').addEventListener('click', () => abrirModalMateria());

    document.querySelectorAll('.fila-materia').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: materia } = await supabase.from('materias').select('*').eq('id', id).maybeSingle();
            abrirModalMateria(materia);
        });
    });

    document.getElementById('modal-close').addEventListener('click', cerrarModalMateria);
    document.getElementById('btn-guardar-materia').addEventListener('click', guardarMateria);
    document.getElementById('btn-borrar-materia').addEventListener('click', borrarMateria);
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
        const { error } = await supabase.from('materias').update({ materia_nombre: nombre, materia_descripcion: descripcion }).eq('id', id);
        if (error) { mostrarMensaje('error', 'Error al actualizar materia: ' + error.message); return; }
        mostrarMensaje('success', 'Materia actualizada correctamente');
    } else {
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
    document.getElementById('materia-id').value = '';
    document.getElementById('materia-nombre').value = '';
    document.getElementById('materia-descripcion').value = '';
    document.getElementById('materia-nombre').focus();
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
        ${renderHeaderSeccion('grados', 'Grados', 'Niveles educativos habilitados.')}
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

// 4. Renderizar Tabla de Programas
async function cargarVistaProgramas() {
    mainContent.innerHTML = '<div class="loading">Consultando Programas...</div>';

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
    const opcionesMaterias = materias.map(m => `<option value="${m.id}">${m.materia_nombre}</option>`).join('');

    let htmlTemplate = `
        ${renderHeaderSeccion('programas', 'Programas', 'Contenido de programas.', `<div class="header-action-container"><button id="btn-nuevo-programa" class="btn-header-action" aria-label="Añadir">+</button></div>`)}
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
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

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

// 5. Renderizar Tabla Clases
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
        clases.map(c => c.programas?.programa_tema).filter(Boolean)
    )].sort();

    let htmlTemplate = `
    ${renderHeaderSeccion('clases', 'Clases', 'Listado General de Clases.')}

    <div class="filters-bar filters-bar-small" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: center;">
        <div style="flex: 1 1 240px; min-width: 140px;">
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

// 6. Renderizar Tabla Alumnos
async function cargarVistaAlumnos() {
    mainContent.innerHTML = '<div class="loading">Consultando Alumnos...</div>';

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
    const gradosById = new Map(grados.map(g => [String(g.id), g.grado_nombre]));
    const opcionesGrados = grados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('');

    alumnos.sort((a, b) => (a.id || 0) - (b.id || 0));

    let htmlTemplate = `
        ${renderHeaderSeccion('alumnos', 'Alumnos', 'Información general y gestión de alumnos.', `<div class="header-action-container"><button id="btn-nuevo-alumno" class="btn-header-action" aria-label="Añadir">+</button></div>`) }

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

    document.getElementById('btn-nuevo-alumno').addEventListener('click', () => abrirModalAlumno());

    document.querySelectorAll('.fila-alumno').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: alumno } = await supabase.from('alumnos').select('*').eq('id', id).maybeSingle();
            if (alumno) abrirModalAlumno(alumno);
        });
    });

    document.getElementById('modal-alumno-close').addEventListener('click', () => cerrarModalAlumno());
    document.getElementById('btn-guardar-alumno').addEventListener('click', guardarAlumno);
    document.getElementById('btn-borrar-alumno').addEventListener('click', borrarAlumno);
    document.getElementById('btn-cancelar-alumno').addEventListener('click', (e) => { e.preventDefault(); cerrarModalAlumno(); });
    document.getElementById('btn-limpiar-alumno').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioAlumno(); });
}

let editandoId = null;

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
        const { error } = await supabase
            .from('alumnos')
            .update(payload)
            .eq('id', editandoId);

        if (error) { mostrarMensaje('error', 'Error al actualizar alumno: ' + error.message); return; }
        mostrarMensaje('success', 'Alumno actualizado correctamente');
    } else {
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

// 7. Renderizar Tabla Profesores
async function cargarVistaProfesores() {
    mainContent.innerHTML = '<div class="loading">Consultando Profesores...</div>';

    const [resProfesores, resGrados] = await Promise.all([
        supabase.from('profesores').select('*'),
        supabase.from('grados').select('*')
    ]);

    if (resProfesores.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${resProfesores.error.message}</p>`;
        return;
    }

    if (resGrados.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error (grados): ${resGrados.error.message}</p>`;
        return;
    }

    const profesores = resProfesores.data || [];
    const grados = resGrados.data || [];
    const gradosById = new Map(grados.map(g => [String(g.id), g.grado_nombre]));
    const opcionesGrados = grados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('');

    profesores.sort((a, b) => (a.id || 0) - (b.id || 0));

    let htmlTemplate = `
        ${renderHeaderSeccion('profesores', 'Profesores', 'Información general y gestión de profesores.', `<div class="header-action-container"><button id="btn-nuevo-profesor" class="btn-header-action" aria-label="Añadir">+</button></div>`)}

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
                        <tr data-id="${p.id}" class="fila-profesor" style="cursor: pointer;">
                            <td><strong># ${p.id}</strong></td>
                            <td style="text-align: center;">
                                <img src="${fotoUrl}" alt="${p.profe_nombre}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Profe&backgroundColor=4f46e5'">
                            </td>
                            <td><span class="badge" style="background-color: #e0e7ff; color: #3730a3;">${nombreGrado}</span></td>
                            <td class="text-bold">${p.profe_nombre}</td>
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

    mainContent.innerHTML = htmlTemplate;

    document.getElementById('btn-nuevo-profesor').addEventListener('click', () => abrirModalProfesor());

    document.querySelectorAll('.fila-profesor').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: profe } = await supabase.from('profesores').select('*').eq('id', id).maybeSingle();
            if (profe) abrirModalProfesor(profe);
        });
    });

    document.getElementById('modal-profesor-close').addEventListener('click', () => cerrarModalProfesor());
    document.getElementById('btn-guardar-profesor').addEventListener('click', guardarProfesor);
    document.getElementById('btn-borrar-profesor').addEventListener('click', borrarProfesor);
    document.getElementById('btn-cancelar-profesor').addEventListener('click', (e) => { e.preventDefault(); cerrarModalProfesor(); });
    document.getElementById('btn-limpiar-profesor').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioProfesor(); });
}

let editandoProfeId = null;

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
    modal.style.display = 'none';
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
        const { error } = await supabase
            .from('profesores')
            .update(payload)
            .eq('id', editandoProfeId);

        if (error) { mostrarMensaje('error', 'Error al actualizar profesor: ' + error.message); return; }
        mostrarMensaje('success', 'Profesor actualizado correctamente');
    } else {
        const { data: ultimoProfe, error: errorMax } = await supabase
            .from('profesores')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (errorMax) {
            mostrarMensaje('error', 'Error al obtener correlativo de ID: ' + errorMax.message);
            return;
        }

        const siguienteId = ultimoProfe ? Number(ultimoProfe.id) + 1 : 1;
        payload.id = siguienteId;

        const { error } = await supabase
            .from('profesores')
            .insert(payload);

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

    const { error } = await supabase
        .from('profesores')
        .delete()
        .eq('id', editandoProfeId);

    if (error) { mostrarMensaje('error', 'Error al eliminar profesor: ' + error.message); return; }
    mostrarMensaje('success', 'Profesor eliminado correctamente');

    cerrarModalProfesor();
    cargarVistaProfesores();
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

// 8. Renderizar Tabla Asignaciones
async function cargarVistaAsignaciones() {
    mainContent.innerHTML = '<div class="loading">Consultando Asignaciones...</div>';

    const [resVista, resProgramas, resGrados, resAnio] = await Promise.all([
        supabase.from('vista_asignaciones_detalles').select('*'),
        supabase.from('programas').select('*').eq('programa_estatus', 'Disponible'),
        supabase.from('grados').select('*'),
        supabase.from('anio').select('*')
    ]);

    if (resVista.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error al cargar asignaciones: ${resVista.error.message}</p>`;
        return;
    }

    if (resProgramas.error) mostrarMensaje('error', 'Error al cargar programas disponibles: ' + resProgramas.error.message);
    if (resGrados.error) mostrarMensaje('error', 'Error al cargar grados: ' + resGrados.error.message);
    if (resAnio.error) mostrarMensaje('error', 'Error al cargar períodos (año): ' + resAnio.error.message);

    const vistaAsignaciones = resVista.data || [];
    const programasDisponibles = resProgramas.data || [];
    const grados = resGrados.data || [];
    const anios = resAnio.data || [];

    const opcionesProgramas = programasDisponibles.map(p => 
        `<option value="${p.id}">#${p.id} - ${p.programa_tema}</option>`
    ).join('');

    const opcionesGrados = grados.map(g => 
        `<option value="${g.id}">${g.grado_nombre || g.grado_numero}</option>`
    ).join('');

    const opcionesAnios = anios.map(a => 
        `<option value="${a.id}">${a.anio_periodo}</option>`
    ).join('');

    let htmlTemplate = `
        ${renderHeaderSeccion('asignaciones', 'Asignaciones', 'Distribución de los programas entre los grados.', `<div class="header-action-container"><button id="btn-nueva-asignacion" class="btn-header-action" aria-label="Añadir">+</button></div>`)}

        <div class="table-responsive">
            <table class="data-table" id="tabla-asignaciones">
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
                    ${vistaAsignaciones.map(n => `
                        <tr data-id="${n.asigna_id}" class="fila-asignacion" style="cursor:pointer;">
                            <td><strong>${n.asigna_id}</strong></td>
                            <td class="text-bold">${n.programa_id}</td>
                            <td class="text-bold">${n.programa_tema || 'Sin programa'}</td>
                            <td><span class="text-light">${n.grado_numero || 'N/A'}</span></td>
                            <td>
                                <span class="badge" style="background-color: ${n.asigna_estatus === 'Activa' ? '#c7f9cc' : '#ffe3e0'}; color: #000;">
                                    ${n.asigna_estatus}
                                </span>
                            </td>
                            <td><span class="text-light">${n.anio_periodo || 'N/A'}</span></td>
                            <td><span class="text-light">${n.materia_nombre || 'N/A'}</span></td>
                            <td><span class="text-light">${n.total_clases ?? 0}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div id="modal-asignacion" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-asignacion-title">Asignación</h3>
                    <button id="modal-asignacion-close" class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-asignacion">
                        <input type="hidden" id="asigna-id">
                        
                        <div class="form-row">
                            <label>Programa (Disponible)</label>
                            <select id="asigna-programa" required>
                                <option value="">-- Seleccionar Programa --</option>
                                ${opcionesProgramas}
                            </select>
                        </div>

                        <div class="form-row">
                            <label>Grado</label>
                            <select id="asigna-grado" required>
                                <option value="">-- Seleccionar Grado --</option>
                                ${opcionesGrados}
                            </select>
                        </div>

                        <div class="form-row">
                            <label>Periodo (Año)</label>
                            <select id="asigna-anio" required>
                                <option value="">-- Seleccionar Periodo --</option>
                                ${opcionesAnios}
                            </select>
                        </div>

                        <div class="form-row">
                            <label>Estatus de Asignación</label>
                            <select id="asigna-estatus" required>
                                <option value="Activa">Activa</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Terminada">Terminada</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button id="btn-cancelar-asignacion" class="btn-secondary">Cancelar</button>
                    <button id="btn-limpiar-asignacion" class="btn-tertiary">Limpiar</button>
                    <button id="btn-borrar-asignacion" class="btn-danger" style="display:none;">Eliminar</button>
                    <button id="btn-guardar-asignacion" class="btn-primary">Guardar</button>
                </div>
            </div>
        </div>
    `;

    mainContent.innerHTML = htmlTemplate;

    document.getElementById('btn-nueva-asignacion').addEventListener('click', () => abrirModalAsignacion());

    document.querySelectorAll('.fila-asignacion').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: asigna } = await supabase.from('asignaciones').select('*').eq('id', id).maybeSingle();
            if (asigna) {
                abrirModalAsignacion(asigna);
            }
        });
    });

    document.getElementById('modal-asignacion-close').addEventListener('click', () => cerrarModalAsignacion());
    document.getElementById('btn-guardar-asignacion').addEventListener('click', guardarAsignacion);
    document.getElementById('btn-borrar-asignacion').addEventListener('click', borrarAsignacion);
    document.getElementById('btn-cancelar-asignacion').addEventListener('click', (e) => { e.preventDefault(); cerrarModalAsignacion(); });
    document.getElementById('btn-limpiar-asignacion').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioAsignacion(); });
}

function abrirModalAsignacion(asignacion = null) {
    const modal = document.getElementById('modal-asignacion');
    const titulo = document.getElementById('modal-asignacion-title');
    const inputId = document.getElementById('asigna-id');
    const selPrograma = document.getElementById('asigna-programa');
    const selGrado = document.getElementById('asigna-grado');
    const selAnio = document.getElementById('asigna-anio');
    const selEstatus = document.getElementById('asigna-estatus');
    const btnBorrar = document.getElementById('btn-borrar-asignacion');

    if (asignacion) {
        titulo.textContent = `Asignación #${asignacion.id}`;
        inputId.value = asignacion.id;
        selPrograma.value = asignacion.programa_id || '';
        selGrado.value = asignacion.grado_id || '';
        selAnio.value = asignacion.anio_id || '';
        selEstatus.value = asignacion.asigna_estatus || 'Activa';
        btnBorrar.style.display = 'inline-block';
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
        programa_id: parseInt(programa_id),
        grado_id: parseInt(grado_id),
        anio_id: parseInt(anio_id),
        asigna_estatus: asigna_estatus
    };

    if (id) {
        const { error } = await supabase.from('asignaciones').update(datos).eq('id', id);
        if (error) { 
            mostrarMensaje('error', 'Error al actualizar asignación: ' + error.message); 
            return; 
        }
        mostrarMensaje('success', 'Asignación actualizada correctamente');
    } else {
        const { error } = await supabase.from('asignaciones').insert(datos);
        if (error) { 
            mostrarMensaje('error', 'Error al crear asignación: ' + error.message); 
            return; 
        }
        mostrarMensaje('success', 'Asignación creada correctamente');
    }

    cerrarModalAsignacion();
    cargarVistaAsignaciones();
}

async function borrarAsignacion(e) {
    e.preventDefault();
    const id = document.getElementById('asigna-id').value;
    if (!id) return;

    if (!confirm(`¿Desea eliminar la asignación #${id}? Esta acción no se puede deshacer.`)) return;

    const { error } = await supabase.from('asignaciones').delete().eq('id', id);
    if (error) { 
        mostrarMensaje('error', 'Error al eliminar asignación: ' + error.message); 
        return; 
    }

    mostrarMensaje('success', 'Asignación eliminada correctamente');
    cerrarModalAsignacion();
    cargarVistaAsignaciones();
}

function limpiarFormularioAsignacion() {
    document.getElementById('asigna-id').value = '';
    document.getElementById('asigna-programa').value = '';
    document.getElementById('asigna-grado').value = '';
    document.getElementById('asigna-anio').value = '';
    document.getElementById('asigna-estatus').value = 'Activa';
    document.getElementById('asigna-programa').focus();
}

// 9. Renderizar Tabla Ejecución de Clases
async function cargarVistaControl(filtrosPrevios = null) {
    mainContent.innerHTML = '<div class="loading">Consultando Ejecución de Clases...</div>';

    const [resVista, resProfesores] = await Promise.all([
        supabase.from('vista_control').select('*'),
        supabase.from('profesores').select('id, profe_nombre, profe_imagen_url, grado_id')
    ]);

    if (resVista.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${resVista.error.message}</p>`;
        return;
    }

    if (resProfesores.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error al cargar profesores: ${resProfesores.error.message}</p>`;
        return;
    }

    const todosProfesores = resProfesores.data || [];
    const vista_control = resVista.data || [];

    const mapaFotosProfesores = new Map();
    todosProfesores.forEach(p => {
        mapaFotosProfesores.set(p.id, p.profe_imagen_url);
    });

    const gradosUnicos = [...new Set(vista_control.map(n => n.grado_numero).filter(Boolean))].sort((a, b) => a - b);
    
    const mapaProgramas = new Map();
    vista_control.forEach(n => {
        if (n.programa_id && !mapaProgramas.has(n.programa_id)) {
            mapaProgramas.set(n.programa_id, n.programa_tema || `Programa ${n.programa_id}`);
        }
    });
    const programasOrdenados = Array.from(mapaProgramas.entries()).sort((a, b) => a[0] - b[0]);

    const estatusUnicos = [...new Set(vista_control.map(n => n.control_estatus).filter(Boolean))].sort();

    let htmlTemplate = `
    ${renderHeaderSeccion('control', 'Ejecución', 'Control de ejecución de clases.')}

    <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: flex-start;">
        <div style="flex: 1 1 100%; min-width: 140px;">
            <input type="text" id="filter-search" class="form-control" placeholder="Buscar Fecha, Clase o Profesor..." oninput="window.aplicarFiltrosControl()">
        </div>
        <div style="width: 180px;">
            <select id="filter-grado" class="form-select" onchange="window.aplicarFiltrosControl()">
                <option value="">Todos los Grados</option>
                ${gradosUnicos.map(grado => `<option value="${grado}">Grado ${grado}</option>`).join('')}
            </select>
        </div>
        <div style="width: 220px;">
            <select id="filter-programa" class="form-select" onchange="window.aplicarFiltrosControl()">
                <option value="">Todos los Programas</option>
                ${programasOrdenados.map(([id, tema]) => `<option value="${id}" data-nombre="${tema}">${tema}</option>`).join('')}
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
                    <th># Clase</th>
                    <th>Clase</th>
                    <th style="width: 90px; text-align: center;">Foto</th>
                    <th>Profesor</th>
                    <th>Observaciones</th>
                    <th># Estatus</th>
                </tr>
            </thead>
            <tbody>
                ${[...vista_control]
                    .sort((a, b) => {
                        const gradoA = parseInt(a.grado_numero, 10) || 0;
                        const gradoB = parseInt(b.grado_numero, 10) || 0;
                        if (gradoA !== gradoB) return gradoA - gradoB;
                        return (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0);
                    })
                    .map(n => {
                        const urlImagenBase = mapaFotosProfesores.get(n.profe_id);
                        const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                            ? urlImagenBase
                            : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n.profe_nombre || 'Profe')}&backgroundColor=4f46e5`;

                        return `
                        <tr 
                            data-id="${n.control_id}"
                            data-fecha="${n.control_fecha || ''}" 
                            data-grado="${n.grado_numero || ''}"
                            data-programa="${n.programa_id || ''}" 
                            data-clase-num="${n.clase_num || ''}"
                            data-clase-tema="${n.clase_tema || ''}" 
                            data-profesor="${n.profe_nombre || ''}" 
                            data-estatus="${n.control_estatus || ''}"
                            class="fila-control"
                            style="cursor: pointer;"
                        >
                            <td><strong># ${n.control_fecha ?? 'Sin fecha'}</strong></td>
                            <td><span class="text-light">${n.clase_num ?? ''}</span></td>
                            <td><span class="text-light">${n.clase_tema ?? ''}</span></td>
                            <td style="text-align: center;">
                                <img src="${fotoUrl}" alt="${n.profe_nombre || 'Profesor'}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Profe&backgroundColor=4f46e5'">
                            </td>
                            <td><span class="text-light">${n.profe_nombre || 'Sin asignar'}</span></td>
                            <td><span class="text-light">${n.control_observaciones || ''}</span></td>
                            <td>
                                <span class="badge" style="background-color: ${n.control_estatus === 'Pendiente' ? '#ffc107' : n.control_estatus === 'Programada' ? '#198754' : n.control_estatus === 'Vista' ? '#dc3545' : '#6c757d'}; color: ${n.control_estatus === 'Pendiente' ? '#000000' : '#ffffff'};">
                                    ${n.control_estatus || 'Pendiente'}
                                </span>
                            </td>
                        </tr>
                        `;
                    }).join('')}
            </tbody>
        </table>
    </div>

    <div id="modal-control" class="modal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-control-title">Editar Ejecución de Clase</h3>
                <button id="modal-control-close" class="modal-close">✕</button>
            </div>
            <div class="modal-body">
                <form id="form-control">
                    <input type="hidden" id="control-id">

                    <div class="form-row">
                        <label>Fecha de Clase</label>
                        <input id="control-fecha" type="date" required>
                    </div>

                    <div class="form-row">
                        <label>Profesor (Filtrado por Grado)</label>
                        <select id="control-profe">
                            <option value="">-- Seleccionar Profesor --</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <label>Observaciones</label>
                        <textarea id="control-observ" rows="3" placeholder="Ingresa observaciones de la clase..."></textarea>
                    </div>

                    <div class="form-row">
                        <label>Estatus</label>
                        <select id="control-estatus" required>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Programada">Programada</option>
                            <option value="Vista">Vista</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button id="btn-cancelar-control" class="btn-secondary">Cancelar</button>
                <button id="btn-limpiar-control" class="btn-tertiary">Limpiar</button>
                <button id="btn-guardar-control" class="btn-primary">Guardar Cambios</button>
            </div>
        </div>
    </div>
    `;

    mainContent.innerHTML = htmlTemplate;

    if (filtrosPrevios) {
        if (document.getElementById('filter-search')) document.getElementById('filter-search').value = filtrosPrevios.texto;
        if (document.getElementById('filter-grado')) document.getElementById('filter-grado').value = filtrosPrevios.grado;
        if (document.getElementById('filter-programa')) document.getElementById('filter-programa').value = filtrosPrevios.programa;
        if (document.getElementById('filter-estatus')) document.getElementById('filter-estatus').value = filtrosPrevios.estatus;
        
        window.aplicarFiltrosControl();
    }

    document.querySelectorAll('.fila-control').forEach(row => {
        row.addEventListener('click', async () => {
            const controlId = row.getAttribute('data-id');
            const claseNum = row.getAttribute('data-clase-num') || '';
            const claseTema = row.getAttribute('data-clase-tema') || '';

            const { data: regControl, error: errControl } = await supabase
                .from('control')
                .select('*, asignaciones(grado_id)')
                .eq('id', controlId)
                .maybeSingle();

            if (errControl || !regControl) {
                mostrarMensaje('error', 'Error al obtener datos del registro.');
                return;
            }

            const gradoIdClase = regControl.asignaciones ? regControl.asignaciones.grado_id : null;
            const profesoresDelGrado = todosProfesores.filter(p => p.grado_id === gradoIdClase);

            abrirModalControl(regControl, profesoresDelGrado, claseNum, claseTema);
        });
    });

    document.getElementById('modal-control-close').addEventListener('click', () => cerrarModalControl());
    document.getElementById('btn-guardar-control').addEventListener('click', guardarControl);
    document.getElementById('btn-cancelar-control').addEventListener('click', (e) => { e.preventDefault(); cerrarModalControl(); });
    document.getElementById('btn-limpiar-control').addEventListener('click', (e) => { e.preventDefault(); limpiarFormularioControl(); });
}

function obtenerEstadoFiltros() {
    return {
        texto: document.getElementById('filter-search')?.value || '',
        grado: document.getElementById('filter-grado')?.value || '',
        programa: document.getElementById('filter-programa')?.value || '',
        estatus: document.getElementById('filter-estatus')?.value || ''
    };
}

function abrirModalControl(registro, profesoresDisponibles, claseNum = '', claseTema = '') {
    const modal = document.getElementById('modal-control');
    const titulo = document.getElementById('modal-control-title');
    const inputId = document.getElementById('control-id');
    const inpFecha = document.getElementById('control-fecha');
    const selProfe = document.getElementById('control-profe');
    const txtObserv = document.getElementById('control-observ');
    const selEstatus = document.getElementById('control-estatus');

    const infoClase = claseNum ? `Clase #${claseNum}: ` : '';
    titulo.textContent = `${infoClase}${claseTema || 'Editar Clase'}`;

    inputId.value = registro.id;
    inpFecha.value = registro.control_fecha || '';
    txtObserv.value = registro.control_observ || '';
    selEstatus.value = registro.control_estatus || 'Pendiente';

    if (profesoresDisponibles && profesoresDisponibles.length > 0) {
        selProfe.innerHTML = '<option value="">-- Seleccionar Profesor --</option>' +
            profesoresDisponibles.map(p => `<option value="${p.id}">${p.profe_nombre}</option>`).join('');
    } else {
        selProfe.innerHTML = '<option value="">-- No hay profesores registrados para este grado --</option>';
    }

    selProfe.value = registro.profe_id || '';
    modal.style.display = 'flex';
}

function cerrarModalControl() {
    const modal = document.getElementById('modal-control');
    if (modal) modal.style.display = 'none';
}

async function guardarControl(e) {
    e.preventDefault();

    const id = document.getElementById('control-id').value;
    const control_fecha = document.getElementById('control-fecha').value || null;
    const profe_id_val = document.getElementById('control-profe').value;
    const control_observ = document.getElementById('control-observ').value.trim();
    const control_estatus = document.getElementById('control-estatus').value;

    if (!id) return;

    const filtrosActuales = obtenerEstadoFiltros();

    const payload = {
        control_fecha: control_fecha,
        profe_id: profe_id_val ? parseInt(profe_id_val) : null,
        control_observ: control_observ || null,
        control_estatus: control_estatus
    };

    const { error } = await supabase.from('control').update(payload).eq('id', id);

    if (error) {
        mostrarMensaje('error', 'Error al actualizar el registro: ' + error.message);
        return;
    }

    mostrarMensaje('success', 'Registro de ejecución actualizado correctamente');
    cerrarModalControl();

    cargarVistaControl(filtrosActuales);
}

function limpiarFormularioControl() {
    document.getElementById('control-fecha').value = '';
    document.getElementById('control-profe').value = '';
    document.getElementById('control-observ').value = '';
    document.getElementById('control-estatus').value = 'Pendiente';
    document.getElementById('control-fecha').focus();
}

window.aplicarFiltrosControl = function () {
    const textoBusqueda = (document.getElementById('filter-search')?.value || '').toLowerCase();
    const gradoSel = document.getElementById('filter-grado')?.value || '';
    const selectPrograma = document.getElementById('filter-programa');
    const programaSel = selectPrograma?.value || '';
    const estatusSel = document.getElementById('filter-estatus')?.value || '';

    const tituloHeader = document.getElementById('titulo-control-header');
    if (tituloHeader) {
        if (programaSel && selectPrograma.selectedIndex > 0) {
            const nombrePrograma = selectPrograma.options[selectPrograma.selectedIndex].getAttribute('data-nombre');
            tituloHeader.textContent = `Ejecución - ${nombrePrograma}`;
        } else {
            tituloHeader.textContent = 'Ejecución';
        }
    }

    const filas = document.querySelectorAll('#tabla-control tbody tr');

    filas.forEach(row => {
        const fecha = row.getAttribute('data-fecha').toLowerCase();
        const clase = (row.getAttribute('data-clase-tema') || '').toLowerCase();
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
    ${renderHeaderSeccion('asistencias', 'Asistencias', 'Control y seguimiento de asistencias por clase.')}

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

// 11. Renderizar Gestión de Perfil / Fotos
async function cargarVistaPerfil() {
    mainContent.innerHTML = '<div class="loading">Cargando opciones de Perfil...</div>';

    const { data: profesores } = await supabase.from('profesores').select('id, profe_nombre, profe_imagen_url');
    const { data: alumnos } = await supabase.from('alumnos').select('id, alumno_nombre, alumno_imagen_url');

    let htmlTemplate = `
    ${renderHeaderSeccion('perfil', 'Gestión de Perfil', 'Asignación y actualización de fotografías para Usuarios.')}

    <div class="profile-panel">

        <div class="profile-row">
            <label for="perfil-tipo-usuario">Tipo de Usuario</label>
            <select id="perfil-tipo-usuario" class="form-select" onchange="window.cambiarTipoPerfil()">
                <option value="profesor">Profesor</option>
                <option value="alumno">Alumno</option>
            </select>
        </div>

        <div class="profile-row">
            <label for="perfil-id-registro">Seleccionar Registro</label>
            <select id="perfil-id-registro" class="form-select" onchange="window.actualizarPreviewFoto()">
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
            <input type="file" id="perfil-input-file" accept="image/*" class="form-control" onchange="window.previsualizarArchivoSeleccionado(this)">
        </div>

        <div class="profile-button-row">
            <button type="button" id="btn-cancelar-foto" class="btn-secondary-alt" style="display: none;" onclick="window.limpiarSeleccionFoto()">
                Cancelar
            </button>
            <button type="button" class="btn-primary-alt" onclick="window.ejecutarSubidaFoto()">
                Guardar Fotografía
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

// FUNCIONES AUXILIARES GLOBALES PARA PERFIL
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
    const idRegistro = document.getElementById('perfil-id-registro')?.value;
    const inputFile = document.getElementById('perfil-input-file');
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
        const tabla = tipo === 'profesor' ? 'profesores' : 'alumnos';
        const columnaImagen = tipo === 'profesor' ? 'profe_imagen_url' : 'alumno_imagen_url';

        const { error } = await supabase
            .from(tabla)
            .update({ [columnaImagen]: base64Url })
            .eq('id', idRegistro);

        if (error) {
            mostrarMensaje('error', 'Error al guardar la fotografía: ' + error.message);
            return;
        }

        mostrarMensaje('success', 'Fotografía actualizada correctamente');
        checkUser(); // Actualizar avatar si es el usuario en sesión
        cargarVistaPerfil();
    };

    reader.readAsDataURL(archivo);
};