export const appState = {
    activeView: 'dashboard'
};

export function renderHeaderSeccion(key, titulo, subtitulo, acciones = '') {
    const icons = {
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

    return `
        <div class="header-seccion">
            <div class="header-seccion-main">
                <span class="header-icon">${icons[key] || ''}</span>
                <div class="header-seccion-text">
                    <h2>${titulo}</h2>
                    <p>${subtitulo}</p>
                </div>
            </div>
            ${acciones}
        </div>
    `;
}

export function renderLoadingState(message = 'Cargando aplicación...') {
    return `<div class="loading">${message}</div>`;
}

export function getFallbackAvatarUrl(seed = 'Usuario') {
    const userSeed = encodeURIComponent(seed.substring(0, 2));
    return `https://api.dicebear.com/7.x/initials/svg?seed=${userSeed}&backgroundColor=4f46e5`;
}

export function setActiveNav(activeButton, buttons = []) {
    buttons.forEach((button) => button.classList.remove('active'));
    activeButton.classList.add('active');
    appState.activeView = activeButton.id || 'dashboard';
}

export function setupMobileMenu({ menuToggle, appAside, asideOverlay }) {
    const toggleMenu = () => {
        menuToggle.classList.toggle('open');
        appAside.classList.toggle('open');
        asideOverlay.classList.toggle('open');
    };

    const cerrarMenuMovil = () => {
        menuToggle.classList.remove('open');
        appAside.classList.remove('open');
        asideOverlay.classList.remove('open');
    };

    return { toggleMenu, cerrarMenuMovil };
}

export function mostrarMensaje(tipo, texto) {
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
