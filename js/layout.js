// js/layout.js
import { AuthService, ProfesorService, AlumnoService } from './services.js';
import { getFallbackAvatarUrl, setupMobileMenu } from './ui.js';

// Aplicar tema persistido inmediatamente antes de pintar
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = `theme-${savedTheme}`;
})();

// Definir estructura HTML del Header
const headerHTML = `
    <header class="app-header">
        <button id="menu-toggle" class="menu-toggle-btn" aria-label="Abrir menú">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
        </button>

        <div class="app-logo">
            <span class="app-logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 10l9-6 9 6v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z"/>
                    <path d="M9 21V12h6v9"/>
                    <path d="M9 7h6"/>
                </svg>
            </span>
            Escuela Digital
        </div>
        
        <div class="user-control">
            <div class="user-avatar-container">
                <img id="user-avatar" src="https://api.dicebear.com/7.x/initials/svg?seed=Usuario" alt="Avatar" class="user-avatar">
            </div>
            <button id="btn-logout" class="btn-logout" title="Cerrar Sesión">Salir</button>
        </div>
    </header>
`;

// Definir estructura HTML del Menú Lateral (Sidebar)
const asideHTML = `
    <aside id="app-aside" class="app-aside">
        <div class="aside-header">
            <h3>Menú Académico</h3>
        </div>
        <nav class="menu-nav">
            <h4 class="menu-group-title">Contenido</h4>
            
            <!-- Dashboard -->
            <a href="dashboard.html" id="nav-dashboard" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
                <span>Dashboard</span>
            </a>

            <!-- Materias -->
            <a href="materias.html" id="nav-materias" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span>Materias</span>
            </a>

            <!-- Programas -->
            <a href="programas.html" id="nav-programas" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <span>Programas</span>
            </a>

            <!-- Clases -->
            <a href="clases.html" id="nav-clases" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <span>Clases</span>
            </a>

            <h4 class="menu-group-title">Seguimiento</h4>

            <!-- Períodos -->
            <a href="periodos.html" id="nav-periodos" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>Períodos</span>
            </a>

            <!-- Asignaciones -->
            <a href="asignaciones.html" id="nav-asignaciones" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                <span>Asignaciones</span>
            </a>

            <!-- Ejecución -->
            <a href="control.html" id="nav-control" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span>Ejecución</span>
            </a>

            <!-- Asistencias -->
            <a href="asistencias.html" id="nav-asistencias" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Asistencias</span>
            </a>

            <!-- Reportes (oculto por defecto) -->
            <a href="reportes.html" id="nav-reportes" class="menu-btn" style="display: none;">
                <svg class="menu-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span>Reportes</span>
            </a>

            <h4 class="menu-group-title">Comunidad</h4>

            <!-- Grados -->
            <a href="grados.html" id="nav-grados" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                <span>Grados</span>
            </a>

            <!-- Alumnos -->
            <a href="alumnos.html" id="nav-alumnos" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Alumnos</span>
            </a>

            <!-- Profesores -->
            <a href="profesores.html" id="nav-profesores" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Profesores</span>
            </a>

            <h4 class="menu-group-title">Ajustes</h4>

            <!-- Configuración -->
            <a href="configuracion.html" id="nav-config" class="menu-btn">
                <svg class="menu-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Configuración</span>
            </a>
        </nav>
    </aside>
`;

const overlayHTML = `<div id="aside-overlay" class="aside-overlay"></div>`;

// Inyectar layout
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inyectar HTML en el DOM
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    const appBody = document.querySelector('.app-body');
    if (appBody) {
        appBody.insertAdjacentHTML('afterbegin', asideHTML + overlayHTML);
    }

    // 2. Elementos del layout inyectado
    const menuToggle = document.getElementById('menu-toggle');
    const appAside = document.getElementById('app-aside');
    const asideOverlay = document.getElementById('aside-overlay');
    const userAvatar = document.getElementById('user-avatar');
    const btnLogout = document.getElementById('btn-logout');

    // 3. Configurar menú móvil
    const { toggleMenu, cerrarMenuMovil } = setupMobileMenu({ menuToggle, appAside, asideOverlay });
    menuToggle?.addEventListener('click', toggleMenu);
    asideOverlay?.addEventListener('click', cerrarMenuMovil);

    // 4. Configurar logout
    btnLogout?.addEventListener('click', async () => {
        await AuthService.signOut();
        window.location.href = '../index.html';
    });

    // 5. Verificar sesión y cargar perfil del usuario
    try {
        const { data: { user } } = await AuthService.getUser();
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        window.usuarioEmail = user.email || '';
        let fotoUrl = null;

        // Buscar si es profesor
        const { data: profe } = await ProfesorService.getProfesorByEmail(user.email);
        if (profe) {
            if (profe.profe_imagen_url && profe.profe_imagen_url.trim() !== '') {
                fotoUrl = profe.profe_imagen_url;
            }
            window.usuarioEsDocente = profe.profe_rol && profe.profe_rol.trim().toLowerCase() === 'docente';
            window.usuarioRol = (profe.profe_rol || '').trim().toLowerCase();
        } else {
            // Si no es profesor, buscar si es alumno
            const { data: alumno } = await AlumnoService.getAlumnoImagenByEmail(user.email);
            if (alumno && alumno.alumno_imagen_url && alumno.alumno_imagen_url.trim() !== '') {
                fotoUrl = alumno.alumno_imagen_url;
            }
            window.usuarioEsDocente = false;
            window.usuarioRol = 'alumno';
        }

        // Aplicar clase del rol docente al body para restricciones CSS
        if (window.usuarioEsDocente) {
            document.body.classList.add('user-docente');
            setupDocenteRestrictionObserver();
        } else {
            document.body.classList.remove('user-docente');
        }

        // Mostrar reportes solo para Admin, Superadmin o propietario
        const navReportes = document.getElementById('nav-reportes');
        if (navReportes) {
            const esAdminOSuper = window.usuarioRol === 'admin' || window.usuarioRol === 'superadmin' || window.usuarioEmail.toLowerCase() === 'freddybr.igle@gmail.com';
            navReportes.style.display = esAdminOSuper ? 'flex' : 'none';
        }

        // Cargar avatar del usuario
        const fallbackUrl = getFallbackAvatarUrl(user.email || 'Usuario');
        if (userAvatar) {
            userAvatar.src = fotoUrl || fallbackUrl;
            userAvatar.onerror = () => {
                userAvatar.src = fallbackUrl;
            };
        }

        window.layoutReady = true;
        // Evento personalizado indicando que el layout y los datos del usuario están listos
        window.dispatchEvent(new CustomEvent('layout-ready', { detail: { user } }));

    } catch (err) {
        console.error("Error al autenticar usuario en el layout:", err);
        window.location.href = '../index.html';
    }

    // 6. Resaltar enlace activo en la sidebar
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'dashboard.html';
    const menuBtns = document.querySelectorAll('.menu-btn');
    menuBtns.forEach(btn => {
        const href = btn.getAttribute('href');
        if (href === currentPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 7. Iniciar monitoreo de inactividad
    iniciarMonitoreoInactividad();

    // 8. Enrutador SPA-like para transiciones instantáneas sin parpadeo
    const mainContent = document.getElementById('main-content');
    const loadPageSPA = async (url) => {
        try {
            if (mainContent) {
                mainContent.style.transition = 'opacity 0.15s ease';
                mainContent.style.opacity = '0.3';
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const htmlText = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            const newMainContent = doc.getElementById('main-content');
            if (newMainContent && mainContent) {
                // Cerrar cualquier modal residual del módulo anterior
                document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

                mainContent.innerHTML = newMainContent.innerHTML;
                mainContent.className = newMainContent.className;
                mainContent.style.opacity = '1';

                // Actualizar el título de la pestaña
                document.title = doc.title;

                // Actualizar el botón activo del menú
                const filename = url.split('/').pop() || 'dashboard.html';
                menuBtns.forEach(btn => {
                    const href = btn.getAttribute('href');
                    if (href === filename) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });

                // Si el menú lateral móvil está abierto, cerrarlo
                const aside = document.getElementById('app-aside');
                const overlay = document.querySelector('.aside-overlay');
                const menuToggle = document.querySelector('.menu-toggle-btn');
                if (aside?.classList.contains('open')) {
                    aside.classList.remove('open');
                    overlay?.classList.remove('open');
                    menuToggle?.classList.remove('open');
                }

                // Registrar en el historial de navegación
                history.pushState(null, '', url);

                // Importar y re-ejecutar el script de la vista de forma dinámica
                const viewScript = doc.querySelector('script[type="module"][src*="/js/views/"]');
                if (viewScript) {
                    const src = viewScript.getAttribute('src');
                    const parts = src.split('/');
                    const scriptName = parts[parts.length - 1];
                    await import(`./views/${scriptName}?t=${Date.now()}`);
                }
            }
        } catch (error) {
            console.error("Error al navegar:", error);
            window.location.href = url;
        }
    };

    // Interceptar clics en enlaces locales .html
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#') && href.endsWith('.html')) {
                e.preventDefault();
                loadPageSPA(href);
            }
        }
    });

    // Manejar botones Atrás/Adelante del navegador
    window.addEventListener('popstate', () => {
        window.location.reload();
    });
});

// LÓGICA DE MONITOREO DE INACTIVIDAD
let inactivityTimer = null;

function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }

    const minutes = parseInt(localStorage.getItem('inactiveTimeout') || '0', 10);
    if (minutes <= 0) return;

    const timeoutMs = minutes * 60 * 1000;
    inactivityTimer = setTimeout(async () => {
        console.warn(`Sesión cerrada por inactividad de ${minutes} minutos.`);
        await AuthService.signOut();
        window.location.href = 'index.html?reason=inactivity';
    }, timeoutMs);
}

function iniciarMonitoreoInactividad() {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
        window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    window.addEventListener('inactiveTimeoutChanged', () => {
        resetInactivityTimer();
    });

    resetInactivityTimer();
}

// RESTRICTOR DE DOCENTES EN MODO LECTURA PARA FORMULARIOS
let observerInicializado = false;
function setupDocenteRestrictionObserver() {
    if (observerInicializado) return;
    observerInicializado = true;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.classList.contains('modal') && target.style.display === 'flex') {
                    const modalId = target.id;

                    if (window.usuarioEsDocente) {
                        if (modalId !== 'modal-control' && modalId !== 'modal-asistencia') {
                            const inputs = target.querySelectorAll('input, select, textarea');
                            inputs.forEach(input => {
                                input.disabled = true;
                            });
                            
                            const saveBtn = target.querySelector('.btn-primary, #btn-guardar-alumno, #btn-guardar-asignacion, #btn-guardar-materia, #btn-guardar-periodo, #btn-guardar-profesor, #btn-guardar-programa');
                            if (saveBtn) saveBtn.style.setProperty('display', 'none', 'important');
                            
                            const deleteBtn = target.querySelector('.btn-danger, #btn-borrar-alumno, #btn-borrar-asignacion, #btn-borrar-materia, #btn-borrar-periodo, #btn-borrar-profesor, #btn-borrar-programa');
                            if (deleteBtn) deleteBtn.style.setProperty('display', 'none', 'important');
                        }
                    }
                }
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['style']
    });
}
