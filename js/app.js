import { AuthService, ProfesorService, AlumnoService } from './services.js';
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
import { cargarVistaPerfil } from './views/perfil.js';

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
const navPerfil = document.getElementById('nav-perfil');
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
    navPerfil
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

    // 1. Buscar si el usuario registrado existe en la tabla de profesores
    const { data: profe } = await ProfesorService.getProfesorImagenByEmail(user.email);

    if (profe && profe.profe_imagen_url && profe.profe_imagen_url.trim() !== '') {
        fotoUrl = profe.profe_imagen_url;
    } else {
        // 2. Si no es profesor, buscar si existe en la tabla de alumnos
        const { data: alumno } = await AlumnoService.getAlumnoImagenByEmail(user.email);

        if (alumno && alumno.alumno_imagen_url && alumno.alumno_imagen_url.trim() !== '') {
            fotoUrl = alumno.alumno_imagen_url;
        }
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
navPerfil.addEventListener('click', () => cambiarVista(() => cargarVistaPerfil(mainContent, checkUser), navPerfil));

// LANZAR VERIFICACIÓN INICIAL
checkUser().then(() => {
    cargarVistaDashboard(mainContent);
});
