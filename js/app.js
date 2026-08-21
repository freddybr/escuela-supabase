import { AuthService, ProfesorService, AlumnoService, syncOfflineData, OfflineQueue } from './services.js';
import { getFallbackAvatarUrl, setActiveNav, setupMobileMenu } from './ui.js';
import { cargarVistaDashboard } from './views/dashboard.js';
import { cargarVistaPeriodos } from './views/periodos.js';
import { cargarVistaMaterias } from './views/materias.js';
import { cargarVistaGrados } from './views/grados.js';
import { cargarVistaProgramas } from './views/programas.js';
import { cargarVistaClases } from './views/clases.js';
import { cargarVistaAlumnos } from './views/alumnos.js';
import { cargarVistaProfesores } from './views/profesores.js';
import { cargarVistaAsignaciones } from './views/asignaciones.js';
import { cargarVistaControl } from './views/control.js';
import { cargarVistaAsistencias } from './views/asistencias.js';
import { cargarVistaConfiguracion } from './views/configuracion.js';
import { cargarVistaReportes } from './views/reportes.js';

// Helper seguro para localStorage
export const safeLocalStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("Storage is blocked or unavailable:", e);
            return null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("Storage is blocked or unavailable:", e);
        }
    }
};

// Aplicar tema persistido inmediatamente
(function() {
    const savedTheme = safeLocalStorage.getItem('theme') || 'light';
    document.body.className = `theme-${savedTheme}`;
})();

// ELEMENTOS DE LA INTERFAZ MÓVIL
const menuToggle = document.getElementById('menu-toggle');
const appAside = document.getElementById('app-aside');
const asideOverlay = document.getElementById('aside-overlay');
const userAvatar = document.getElementById('user-avatar');

// ELEMENTOS DEL CONTENIDO
const mainContent = document.getElementById('main-content');
const navDashboard = document.getElementById('nav-dashboard');
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
const navReportes = document.getElementById('nav-reportes');
const navConfig = document.getElementById('nav-config');
const btnLogout = document.getElementById('btn-logout');

const navButtons = [
    navDashboard,
    navMaterias,
    navGrados,
    navProgramas,
    navPeriodos,
    navClases,
    navAlumnos,
    navProfesores,
    navAsignaciones,
    navControl,
    navAsistencias,
    navReportes,
    navConfig
];

const { toggleMenu, cerrarMenuMovil } = setupMobileMenu({ menuToggle, appAside, asideOverlay });

// LOGOUT
btnLogout.addEventListener('click', async () => {
    await AuthService.signOut();
    window.location.href = 'index.html';
});

menuToggle.addEventListener('click', toggleMenu);
asideOverlay.addEventListener('click', cerrarMenuMovil);

// VERIFICAR SESIÓN Y CARGAR AVATAR PERSONALIZADO DINÁMICAMENTE
async function checkUser() {
    const { data: { user } } = await AuthService.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    let fotoUrl = null;

    // 1. Buscar si el usuario registrado existe en la tabla de profesores (con todos los datos)
    const { data: profe } = await ProfesorService.getProfesorByEmail(user.email);

    window.usuarioEmail = user.email || '';
    if (profe) {
        if (profe.profe_imagen_url && profe.profe_imagen_url.trim() !== '') {
            fotoUrl = profe.profe_imagen_url;
        }
        
        // Asignar rol docente si corresponde
        const esDocente = profe.profe_rol && profe.profe_rol.trim().toLowerCase() === 'docente';
        window.usuarioEsDocente = !!esDocente;
        window.usuarioRol = (profe.profe_rol || '').trim().toLowerCase();
    } else {
        // 2. Si no es profesor, buscar si existe en la tabla de alumnos
        const { data: alumno } = await AlumnoService.getAlumnoImagenByEmail(user.email);

        if (alumno && alumno.alumno_imagen_url && alumno.alumno_imagen_url.trim() !== '') {
            fotoUrl = alumno.alumno_imagen_url;
        }
        window.usuarioEsDocente = false;
        window.usuarioRol = 'alumno';
    }

    if (window.usuarioEsDocente) {
        document.body.classList.add('user-docente');
        setupDocenteRestrictionObserver();
    } else {
        document.body.classList.remove('user-docente');
    }

    // Mostrar/ocultar módulo de reportes solo para Admin y Superadmin (o propietario freddybr.igle@gmail.com)
    const esAdminOSuper = window.usuarioRol === 'admin' || window.usuarioRol === 'superadmin' || window.usuarioEmail.toLowerCase() === 'freddybr.igle@gmail.com';
    if (esAdminOSuper) {
        navReportes.style.display = 'flex';
    } else {
        navReportes.style.display = 'none';
    }

    // 3. Crear el fallback de iniciales por si no tiene foto asignada
    const fallbackUrl = getFallbackAvatarUrl(user.email || 'Usuario');

    // 4. Asignar la foto o el respaldo de iniciales al avatar del header
    userAvatar.src = fotoUrl || fallbackUrl;

    // Respaldo de seguridad si el enlace de la imagen falla (error 404/link roto)
    userAvatar.onerror = () => {
        userAvatar.src = fallbackUrl;
    };
}

function cambiarVista(callback, activeButton) {
    setActiveNav(activeButton, navButtons);
    callback();
    cerrarMenuMovil();
}

// NAVEGACIÓN E INYECCIÓN
navDashboard.addEventListener('click', () => cambiarVista(() => cargarVistaDashboard(mainContent), navDashboard));
navMaterias.addEventListener('click', () => cambiarVista(() => cargarVistaMaterias(mainContent), navMaterias));
navGrados.addEventListener('click', () => cambiarVista(() => cargarVistaGrados(mainContent), navGrados));
navProgramas.addEventListener('click', () => cambiarVista(() => cargarVistaProgramas(mainContent), navProgramas));
navPeriodos.addEventListener('click', () => cambiarVista(() => cargarVistaPeriodos(mainContent), navPeriodos));
navClases.addEventListener('click', () => cambiarVista(() => cargarVistaClases(mainContent), navClases));
navAlumnos.addEventListener('click', () => cambiarVista(() => cargarVistaAlumnos(mainContent), navAlumnos));
navProfesores.addEventListener('click', () => cambiarVista(() => cargarVistaProfesores(mainContent), navProfesores));
navAsignaciones.addEventListener('click', () => cambiarVista(() => cargarVistaAsignaciones(mainContent), navAsignaciones));
navControl.addEventListener('click', () => cambiarVista(() => cargarVistaControl(mainContent), navControl));
navAsistencias.addEventListener('click', () => cambiarVista(() => cargarVistaAsistencias(mainContent), navAsistencias));
navReportes.addEventListener('click', () => cambiarVista(() => cargarVistaReportes(mainContent), navReportes));
navConfig.addEventListener('click', () => cambiarVista(() => cargarVistaConfiguracion(mainContent, checkUser), navConfig));

// LÓGICA DE MONITOREO DE INACTIVIDAD
let inactivityTimer = null;

function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }

    const minutes = parseInt(safeLocalStorage.getItem('inactiveTimeout') || '0', 10);
    if (minutes <= 0) return; // 0 significa desactivado

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

    // Escuchar el evento de cambio de configuración en tiempo real
    window.addEventListener('inactiveTimeoutChanged', () => {
        resetInactivityTimer();
    });

    resetInactivityTimer();
}

// LANZAR VERIFICACIÓN INICIAL Y MONITOREO DE INACTIVIDAD
try {
    iniciarMonitoreoInactividad();
    setupDocenteRestrictionObserver();
    checkUser()
        .then(() => {
            cargarVistaDashboard(mainContent);
        })
        .catch(err => {
            console.error("Error al inicializar la sesión del usuario:", err);
            mainContent.innerHTML = `
                <div class="error-msg-container" style="padding: 40px; text-align: center; color: #991b1b; background: rgba(239, 68, 68, 0.08); border-radius: 12px; border: 1px solid #ef4444; margin: 20px;">
                    <h3>⚠️ Error al verificar la sesión</h3>
                    <p>${err.message || err}</p>
                    <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 15px; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Reintentar</button>
                </div>
            `;
        });
} catch (error) {
    console.error("Error crítico durante el arranque de la app:", error);
    mainContent.innerHTML = `
        <div class="error-msg-container" style="padding: 40px; text-align: center; color: #991b1b; background: rgba(239, 68, 68, 0.08); border-radius: 12px; border: 1px solid #ef4444; margin: 20px;">
            <h3>❌ Error crítico de arranque</h3>
            <p>${error.message || error}</p>
        </div>
    `;
}

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
                    
                    // 1. Caso A: Dispositivo Offline (Aplica a Administradores y Docentes por igual)
                    if (!navigator.onLine) {
                        if (modalId !== 'modal-control' && modalId !== 'modal-asistencia') {
                            // Deshabilitar todos los inputs, selects y textareas
                            const inputs = target.querySelectorAll('input, select, textarea');
                            inputs.forEach(input => {
                                input.disabled = true;
                            });
                            
                            // Ocultar botones de guardar y eliminar
                            const saveBtn = target.querySelector('.btn-primary, #btn-guardar-alumno, #btn-guardar-asignacion, #btn-guardar-materia, #btn-guardar-periodo, #btn-guardar-profesor, #btn-guardar-programa');
                            if (saveBtn) saveBtn.style.setProperty('display', 'none', 'important');
                            
                            const deleteBtn = target.querySelector('.btn-danger, #btn-borrar-alumno, #btn-borrar-asignacion, #btn-borrar-materia, #btn-borrar-periodo, #btn-borrar-profesor, #btn-borrar-programa');
                            if (deleteBtn) deleteBtn.style.setProperty('display', 'none', 'important');

                            // Agregar aviso de sólo lectura si no existe ya
                            let notice = target.querySelector('.offline-read-only-notice');
                            if (!notice) {
                                notice = document.createElement('div');
                                notice.className = 'offline-read-only-notice';
                                notice.innerHTML = `<span>⚠️ Modo sin conexión: Conéctate a internet para realizar cambios en este catálogo.</span>`;
                                const modalBody = target.querySelector('.modal-content') || target;
                                modalBody.insertBefore(notice, modalBody.firstChild);
                            }
                            return; // Saltar restricción de docente normal
                        }
                    } else {
                        // Limpiar avisos offline si el dispositivo recupera conexión
                        const notice = target.querySelector('.offline-read-only-notice');
                        if (notice) notice.remove();
                    }

                    // 2. Caso B: Usuario Docente (Restringir cambios en catálogos administrativos incluso online)
                    if (window.usuarioEsDocente) {
                        if (modalId !== 'modal-control' && modalId !== 'modal-asistencia') {
                            // Deshabilitar todos los inputs, selects y textareas
                            const inputs = target.querySelectorAll('input, select, textarea');
                            inputs.forEach(input => {
                                input.disabled = true;
                            });
                            
                            // Ocultar botones de guardar y eliminar
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

// Manejo del estado de conexión (Online / Offline)
const connectionBanner = document.getElementById('connection-banner');

function actualizarEstadoConexion() {
    const isOnline = navigator.onLine;
    if (isOnline) {
        if (connectionBanner) connectionBanner.classList.add('offline-hidden');
        document.body.classList.remove('device-offline');
        
        // Sincronizar datos si hay elementos en la cola
        const totalPendientes = OfflineQueue.getQueue('cola_control').length + OfflineQueue.getQueue('cola_asistencias').length;
        if (totalPendientes > 0) {
            syncOfflineData().then(() => {
                // Si la sincronización se realiza con éxito, refrescar la vista actual para reflejar los datos reales
                const activeBtn = document.querySelector('.menu-btn.active');
                if (activeBtn) {
                    activeBtn.click();
                }
            });
        }
    } else {
        if (connectionBanner) connectionBanner.classList.remove('offline-hidden');
        document.body.classList.add('device-offline');
    }
}

window.addEventListener('online', actualizarEstadoConexion);
window.addEventListener('offline', actualizarEstadoConexion);

// Escuchar actualizaciones en la cola local para actualizar insignias si es necesario
window.addEventListener('offline-sync-queue-updated', () => {
    actualizarBadgesSincronizacion();
});

// Función para pintar insignias naranjas de sincronización en el menú si hay datos pendientes
function actualizarBadgesSincronizacion() {
    const totalControles = OfflineQueue.getQueue('cola_control').length;
    const totalAsistencias = OfflineQueue.getQueue('cola_asistencias').length;
    
    // Insignia para Control (Ejecución)
    const btnControl = document.getElementById('nav-control');
    if (btnControl) {
        let badge = btnControl.querySelector('.sync-badge');
        if (totalControles > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'sync-badge';
                btnControl.appendChild(badge);
            }
            badge.textContent = `${totalControles}`;
        } else if (badge) {
            badge.remove();
        }
    }
    
    // Insignia para Asistencias
    const btnAsistencias = document.getElementById('nav-asistencias');
    if (btnAsistencias) {
        let badge = btnAsistencias.querySelector('.sync-badge');
        if (totalAsistencias > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'sync-badge';
                btnAsistencias.appendChild(badge);
            }
            badge.textContent = `${totalAsistencias}`;
        } else if (badge) {
            badge.remove();
        }
    }
}

// Ejecutar verificación inicial de conexión e insignias
actualizarEstadoConexion();
actualizarBadgesSincronizacion();
