import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { ProfesorService, AlumnoService, AuthService } from '../services.js';

let containerElement = null;
let checkUserCallback = null;
let _datosPerfil = { profesores: [], alumnos: [] };

export async function cargarVistaConfiguracion(container, onPhotoUpdated = null) {
    containerElement = container;
    checkUserCallback = onPhotoUpdated;
    container.innerHTML = '<div class="loading">Cargando opciones de configuración...</div>';

    // Obtener información del usuario autenticado
    const resUser = await AuthService.getUser();
    const user = resUser.data?.user;
    const userEmail = user?.email || 'N/A';
    const userId = user?.id || 'N/A';
    const userCreated = user?.created_at ? new Date(user.created_at).toLocaleString('es-ES') : 'N/A';

    // Consultar perfiles de la BD y validar si el email tiene rol de profesor para chequear rol
    const [resProfesores, resAlumnos, resProfesorPerfil] = await Promise.all([
        ProfesorService.getProfesores(),
        AlumnoService.getAlumnos(),
        userEmail !== 'N/A' ? ProfesorService.getProfesorByEmail(userEmail) : Promise.resolve({ data: null })
    ]);

    _datosPerfil = {
        profesores: resProfesores.data || [],
        alumnos: resAlumnos.data || []
    };

    const profesorInfo = resProfesorPerfil?.data;
    const esPropietario = userEmail.toLowerCase() === 'freddybr.igle@gmail.com';
    const esSuperadmin = profesorInfo && profesorInfo.profe_rol?.toLowerCase() === 'superadmin';
    const tieneAccesoSeguridad = esPropietario || esSuperadmin;

    // Obtener valores guardados en localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedTimeout = localStorage.getItem('inactiveTimeout') || '0'; // 0 = Nunca

    let htmlTemplate = `
    ${renderHeaderSeccion('configuracion', 'Configuración de Sistema', 'Gestione sus datos de perfil, seguridad de cuenta y personalice la apariencia.')}

    <div class="config-layout">
        <!-- BARRA LATERAL DE CONFIGURACIÓN -->
        <div class="config-sidebar">
            <button type="button" class="config-tab-btn active" data-target="section-perfil">
                <svg class="config-tab-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Perfil</span>
            </button>
            ${tieneAccesoSeguridad ? `
            <button type="button" class="config-tab-btn" data-target="section-cuenta">
                <svg class="config-tab-icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Seguridad</span>
            </button>
            ` : ''}
            <button type="button" class="config-tab-btn" data-target="section-apariencia">
                <svg class="config-tab-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M12 12h10"/></svg>
                <span>Apariencia</span>
            </button>
        </div>

        <!-- CONTENIDO DE CONFIGURACIÓN -->
        <div class="config-content">
            
            <!-- 1. SECCIÓN PERFIL -->
            <div id="section-perfil" class="config-section active">
                <h3 class="config-section-title">Asociación de Perfil</h3>
                <p class="config-section-subtitle">Gestión e inyección de fotografías para usuarios en la base de datos.</p>
                
                <div class="profile-panel" style="margin: 0; max-width: 100%; box-shadow: none; border: none; padding: 0;">
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
            </div>

            <!-- 2. SECCIÓN SEGURIDAD Y CUENTA -->
            ${tieneAccesoSeguridad ? `
            <div id="section-cuenta" class="config-section">
                <h3 class="config-section-title">Seguridad y Cuenta</h3>
                <p class="config-section-subtitle">Gestione la autenticación, contraseña y la sesión de su usuario.</p>
                
                <div class="config-card">
                    <div class="config-card-title">
                        <svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Datos de la Cuenta
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; font-size: 0.88rem;">
                        <div>
                            <strong style="color:var(--text-secondary)">Correo Electrónico:</strong>
                            <p style="color:var(--text-muted); margin-top:4px;">${userEmail}</p>
                        </div>
                        <div>
                            <strong style="color:var(--text-secondary)">Creado el:</strong>
                            <p style="color:var(--text-muted); margin-top:4px;">${userCreated}</p>
                        </div>
                        <div>
                            <strong style="color:var(--text-secondary)">Usuario ID:</strong>
                            <p style="color:var(--text-muted); margin-top:4px; font-family:monospace; word-break:break-all;">${userId}</p>
                        </div>
                    </div>
                </div>

                <div class="config-card">
                    <div class="config-card-title">
                        <svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Cambiar Contraseña
                    </div>
                    <form id="form-change-password" style="display: flex; flex-direction: column; gap: 16px;">
                        <div class="form-row">
                            <label for="new-password" style="font-weight:600; font-size:0.85rem; color:var(--text-secondary);">Nueva Contraseña</label>
                            <input type="password" id="new-password" class="form-control" placeholder="Escriba su nueva contraseña" required minlength="6">
                        </div>
                        <div class="form-row">
                            <label for="confirm-password" style="font-weight:600; font-size:0.85rem; color:var(--text-secondary);">Confirmar Nueva Contraseña</label>
                            <input type="password" id="confirm-password" class="form-control" placeholder="Repita su nueva contraseña" required minlength="6">
                        </div>
                        <div style="display:flex; justify-content:flex-end;">
                            <button type="submit" class="btn-primary-alt">Actualizar Contraseña</button>
                        </div>
                    </form>
                </div>

                <div class="config-card">
                    <div class="config-card-title">
                        <svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Gestión de Sesión por Inactividad
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                        Para proteger su información, el sistema puede cerrar sesión de forma automática si no se detecta actividad en el navegador.
                    </div>
                    <div class="form-row" style="max-width: 300px;">
                        <label for="select-inactivity" style="font-weight:600; font-size:0.85rem; color:var(--text-secondary);">Cerrar sesión automáticamente tras:</label>
                        <select id="select-inactivity" class="form-select">
                            <option value="0">Nunca cerrar sesión automáticamente</option>
                            <option value="1">1 Minuto (Para pruebas)</option>
                            <option value="15">15 Minutos</option>
                            <option value="30">30 Minutos</option>
                            <option value="60">60 Minutos (1 hora)</option>
                        </select>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- 3. SECCIÓN APARIENCIA -->
            <div id="section-apariencia" class="config-section">
                <h3 class="config-section-title">Personalización de Apariencia</h3>
                <p class="config-section-subtitle">Ajuste la paleta cromática de la aplicación según sus preferencias.</p>
                
                <div class="theme-grid">
                    <!-- Tema Claro -->
                    <div class="theme-card ${savedTheme === 'light' ? 'active' : ''}" data-theme="light">
                        <div class="theme-preview-dots">
                            <span class="theme-dot" style="background-color: #f8fafc"></span>
                            <span class="theme-dot" style="background-color: #ffffff"></span>
                            <span class="theme-dot" style="background-color: #4f46e5"></span>
                        </div>
                        <span class="theme-card-name">☀️ Claro</span>
                    </div>

                    <!-- Tema Oscuro -->
                    <div class="theme-card ${savedTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                        <div class="theme-preview-dots">
                            <span class="theme-dot" style="background-color: #0b1329"></span>
                            <span class="theme-dot" style="background-color: #1e293b"></span>
                            <span class="theme-dot" style="background-color: #818cf8"></span>
                        </div>
                        <span class="theme-card-name">🌙 Oscuro</span>
                    </div>

                    <!-- Tema Sepia -->
                    <div class="theme-card ${savedTheme === 'sepia' ? 'active' : ''}" data-theme="sepia">
                        <div class="theme-preview-dots">
                            <span class="theme-dot" style="background-color: #f4ecd8"></span>
                            <span class="theme-dot" style="background-color: #fdf6e3"></span>
                            <span class="theme-dot" style="background-color: #b45309"></span>
                        </div>
                        <span class="theme-card-name">🍂 Sepia</span>
                    </div>

                    <!-- Tema Indigo -->
                    <div class="theme-card ${savedTheme === 'indigo' ? 'active' : ''}" data-theme="indigo">
                        <div class="theme-preview-dots">
                            <span class="theme-dot" style="background-color: #f0f4ff"></span>
                            <span class="theme-dot" style="background-color: #ffffff"></span>
                            <span class="theme-dot" style="background-color: #4f46e5"></span>
                        </div>
                        <span class="theme-card-name">🌊 Océano Blue</span>
                    </div>

                    <!-- Tema Bosque -->
                    <div class="theme-card ${savedTheme === 'forest' ? 'active' : ''}" data-theme="forest">
                        <div class="theme-preview-dots">
                            <span class="theme-dot" style="background-color: #f2f7f5"></span>
                            <span class="theme-dot" style="background-color: #ffffff"></span>
                            <span class="theme-dot" style="background-color: #10b981"></span>
                        </div>
                        <span class="theme-card-name">🌲 Bosque</span>
                    </div>
                </div>
            </div>

        </div>
    </div>
    `;

    container.innerHTML = htmlTemplate;

    // --- LÓGICA DE NAVEGACIÓN ENTRE PESTAÑAS ---
    const tabButtons = container.querySelectorAll('.config-tab-btn');
    const sections = container.querySelectorAll('.config-section');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetSection = container.querySelector(`#${targetId}`);
            if (targetSection) targetSection.classList.add('active');
        });
    });

    // --- LÓGICA DE GESTIÓN DE PERFIL (Migración) ---
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
            if (checkUserCallback) checkUserCallback(); // Actualizar avatar en la cabecera si es el usuario en sesión
            cargarVistaConfiguracion(containerElement, checkUserCallback);
        };

        reader.readAsDataURL(archivo);
    };

    selTipo?.addEventListener('change', cambiarTipoPerfil);
    selRegistro?.addEventListener('change', actualizarPreviewFoto);
    inputFile?.addEventListener('change', (e) => previsualizarArchivoSeleccionado(e.target));
    btnCancelar?.addEventListener('click', limpiarSeleccionFoto);
    btnGuardar?.addEventListener('click', ejecutarSubidaFoto);

    // Inicializar perfil
    cambiarTipoPerfil();

    // --- LÓGICA DE CAMBIO DE CONTRASEÑA ---
    const formPassword = document.getElementById('form-change-password');
    formPassword?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-password');

        const newPass = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;

        if (newPass !== confirmPass) {
            mostrarMensaje('error', 'Las contraseñas no coinciden');
            return;
        }

        try {
            const { error } = await AuthService.updatePassword(newPass);
            if (error) {
                mostrarMensaje('error', 'Error al actualizar: ' + error.message);
            } else {
                mostrarMensaje('success', 'Contraseña actualizada de forma segura.');
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
            }
        } catch (err) {
            mostrarMensaje('error', 'Hubo un error inesperado al actualizar la contraseña');
            console.error(err);
        }
    });

    // --- LÓGICA DE INACTIVIDAD DE SESIÓN ---
    const selectInactivity = document.getElementById('select-inactivity');
    if (selectInactivity) {
        selectInactivity.value = savedTimeout;
        selectInactivity.addEventListener('change', () => {
            const val = selectInactivity.value;
            localStorage.setItem('inactiveTimeout', val);
            mostrarMensaje('success', 'Preferencias de sesión actualizadas');
            
            // Disparar un evento personalizado para alertar a app.js del cambio inmediato
            const event = new CustomEvent('inactiveTimeoutChanged', { detail: val });
            window.dispatchEvent(event);
        });
    }

    // --- LÓGICA DE CAMBIO DE TEMAS ---
    const themeCards = container.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            themeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            const theme = card.getAttribute('data-theme');
            
            // Remover cualquier tema anterior del body
            const bodyClasses = Array.from(document.body.classList);
            bodyClasses.forEach(cls => {
                if (cls.startsWith('theme-')) {
                    document.body.classList.remove(cls);
                }
            });

            // Aplicar nuevo tema
            document.body.classList.add(`theme-${theme}`);
            localStorage.setItem('theme', theme);
            mostrarMensaje('success', `Tema cambiado a: ${card.querySelector('.theme-card-name').textContent}`);
        });
    });
}
