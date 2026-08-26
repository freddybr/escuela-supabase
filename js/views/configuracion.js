import { mostrarMensaje, getFallbackAvatarUrl } from '../ui.js';
import { ProfesorService, AlumnoService, AuthService } from '../services.js';

let checkUserCallback = null;
let _datosPerfil = { profesores: [], alumnos: [] };
let modalInitialized = false;

// Helper seguro para localStorage
const safeLocalStorage = {
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

export async function cargarVistaConfiguracion(onPhotoUpdated = null) {
    checkUserCallback = onPhotoUpdated;

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
    const esSuperadminGeneral = esPropietario || esSuperadmin;
    const tieneAccesoSeguridad = !!user;
    const esDocente = !!window.usuarioEsDocente;

    // Obtener valores guardados en localStorage
    const savedTheme = safeLocalStorage.getItem('theme') || 'light';
    const savedTimeout = safeLocalStorage.getItem('inactiveTimeout') || '0'; // 0 = Nunca

    // Ocultar pestaña perfil si es docente
    const tabPerfilBtn = document.getElementById('tab-btn-perfil');
    const tabCuentaBtn = document.getElementById('tab-btn-cuenta');
    const sectionPerfil = document.getElementById('section-perfil');
    const sectionCuenta = document.getElementById('section-cuenta');

    if (esDocente) {
        if (tabPerfilBtn) tabPerfilBtn.style.display = 'none';
        if (sectionPerfil) sectionPerfil.classList.remove('active');
        if (tabCuentaBtn) tabCuentaBtn.classList.add('active');
        if (sectionCuenta) sectionCuenta.classList.add('active');
    } else {
        if (tabPerfilBtn) tabPerfilBtn.style.display = '';
        if (tabPerfilBtn) tabPerfilBtn.classList.add('active');
        if (sectionPerfil) sectionPerfil.classList.add('active');
        if (tabCuentaBtn) tabCuentaBtn.classList.remove('active');
        if (sectionCuenta) sectionCuenta.classList.remove('active');
    }

    if (!tieneAccesoSeguridad) {
        if (tabCuentaBtn) tabCuentaBtn.style.display = 'none';
        if (sectionCuenta) sectionCuenta.style.display = 'none';
    } else {
        if (tabCuentaBtn) tabCuentaBtn.style.display = '';
        if (sectionCuenta) sectionCuenta.style.display = '';

        // Poblar datos de la cuenta
        const emailEl = document.getElementById('info-user-email');
        if (emailEl) emailEl.textContent = userEmail;

        const createdEl = document.getElementById('info-user-created');
        if (createdEl) createdEl.textContent = userCreated;

        const idEl = document.getElementById('info-user-id');
        if (idEl) idEl.textContent = userId;

        // Mostrar selector de usuario si es superadmin
        const containerPassUser = document.getElementById('change-password-user-container');
        if (containerPassUser) {
            if (esSuperadminGeneral) {
                const usuariosOptions = [];
                usuariosOptions.push(`<option value="${userEmail}" selected>Mi propia cuenta (${userEmail})</option>`);

                _datosPerfil.profesores.forEach(p => {
                    if (p.profe_email && p.profe_email.toLowerCase() !== userEmail.toLowerCase()) {
                        usuariosOptions.push(`<option value="${p.profe_email}">Profesor: ${p.profe_nombre} (${p.profe_email})</option>`);
                    }
                });

                _datosPerfil.alumnos.forEach(a => {
                    if (a.alumno_email && a.alumno_email.toLowerCase() !== userEmail.toLowerCase()) {
                        usuariosOptions.push(`<option value="${a.alumno_email}">Alumno: ${a.alumno_nombre} (${a.alumno_email})</option>`);
                    }
                });

                containerPassUser.innerHTML = `
                <div class="form-row">
                    <label for="change-password-target-user" style="font-weight:600; font-size:0.85rem; color:var(--text-secondary);">Seleccionar Usuario</label>
                    <select id="change-password-target-user" class="form-select">
                        ${usuariosOptions.join('')}
                    </select>
                </div>
                `;
            } else {
                containerPassUser.innerHTML = '';
            }
        }
    }

    // Inactividad
    const selectInactivity = document.getElementById('select-inactivity');
    if (selectInactivity) {
        selectInactivity.value = savedTimeout;
    }

    // Temas active classes
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-theme') === savedTheme) {
            card.classList.add('active');
        }
    });

    if (!modalInitialized) {
        configurarListeners(userEmail);
        modalInitialized = true;
    }

    // Inicializar perfil
    cambiarTipoPerfil();
}

function configurarListeners(userEmail) {
    // --- LÓGICA DE NAVEGACIÓN ENTRE PESTAÑAS ---
    const tabButtons = document.querySelectorAll('.config-tab-btn');
    const sections = document.querySelectorAll('.config-section');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');
        });
    });

    // --- LÓGICA DE GESTIÓN DE PERFIL ---
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

    const ejecutarSubidaFoto = async () => {
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

        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';
        }

        const { error } = tipo === 'profesor'
            ? await ProfesorService.updateProfesorImagen(idRegistro, archivo)
            : await AlumnoService.updateAlumnoImagen(idRegistro, archivo);

        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Fotografía';
        }

        if (error) {
            mostrarMensaje('error', 'Error al guardar la fotografía: ' + error.message);
            return;
        }

        mostrarMensaje('success', 'Fotografía actualizada correctamente');
        if (checkUserCallback) checkUserCallback(); // Actualizar avatar en la cabecera
        cargarVistaConfiguracion(checkUserCallback);
    };

    selTipo?.addEventListener('change', cambiarTipoPerfil);
    selRegistro?.addEventListener('change', actualizarPreviewFoto);
    inputFile?.addEventListener('change', (e) => previsualizarArchivoSeleccionado(e.target));
    btnCancelar?.addEventListener('click', limpiarSeleccionFoto);
    btnGuardar?.addEventListener('click', ejecutarSubidaFoto);

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

        const selectTargetUser = document.getElementById('change-password-target-user');
        const targetEmail = selectTargetUser ? selectTargetUser.value : userEmail;

        try {
            let res;
            if (targetEmail.toLowerCase() === userEmail.toLowerCase()) {
                res = await AuthService.updatePassword(newPass);
            } else {
                res = await AuthService.updatePasswordOtroUsuario(targetEmail, newPass);
            }

            if (res.error) {
                mostrarMensaje('error', 'Error al actualizar: ' + res.error.message);
            } else {
                mostrarMensaje('success', `Contraseña de ${targetEmail} actualizada correctamente.`);
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
    selectInactivity?.addEventListener('change', () => {
        const val = selectInactivity.value;
        safeLocalStorage.setItem('inactiveTimeout', val);
        mostrarMensaje('success', 'Preferencias de sesión actualizadas');
        
        // Disparar un evento personalizado para alertar a app.js
        const event = new CustomEvent('inactiveTimeoutChanged', { detail: val });
        window.dispatchEvent(event);
    });

    // --- LÓGICA DE CAMBIO DE TEMAS ---
    const themeCards = document.querySelectorAll('.theme-card');
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
            safeLocalStorage.setItem('theme', theme);
            mostrarMensaje('success', `Tema cambiado a: ${card.querySelector('.theme-card-name').textContent}`);
        });
    });
}

function cambiarTipoPerfil() {
    const selTipo = document.getElementById('perfil-tipo-usuario');
    const selRegistro = document.getElementById('perfil-id-registro');
    const btnCancelar = document.getElementById('btn-cancelar-foto');
    const inputFile = document.getElementById('perfil-input-file');
    const imgPreview = document.getElementById('perfil-foto-preview');
    const txtTitulo = document.getElementById('perfil-foto-titulo');

    const tipo = selTipo?.value;
    if (!selRegistro) return;

    const lista = tipo === 'profesor' ? _datosPerfil.profesores : _datosPerfil.alumnos;

    selRegistro.innerHTML = lista.map(item => {
        const nombre = tipo === 'profesor' ? item.profe_nombre : item.alumno_nombre;
        const foto = tipo === 'profesor' ? item.profe_imagen_url : item.alumno_imagen_url;
        return `<option value="${item.id}" data-foto="${foto || ''}" data-nombre="${nombre}">${nombre} (#${item.id})</option>`;
    }).join('');

    if (inputFile) inputFile.value = '';
    if (btnCancelar) btnCancelar.style.display = 'none';

    // actualizarPreviewFoto logic
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
}

const runConfiguracionWithUser = async (user) => {
    const checkUserCallback = async () => {
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar && user) {
            const email = user.email;
            const { data: profe } = await ProfesorService.getProfesorByEmail(email);
            let fotoUrl = null;
            if (profe) {
                fotoUrl = profe.profe_imagen_url;
            } else {
                const { data: alumno } = await AlumnoService.getAlumnoImagenByEmail(email);
                if (alumno) fotoUrl = alumno.alumno_imagen_url;
            }
            const fallbackUrl = getFallbackAvatarUrl(email || 'Usuario');
            userAvatar.src = fotoUrl || fallbackUrl;
        }
    };
    cargarVistaConfiguracion(checkUserCallback);
};

if (window.layoutReady) {
    AuthService.getUser().then(res => {
        const user = res.data?.user;
        runConfiguracionWithUser(user);
    });
} else {
    window.addEventListener('layout-ready', (e) => {
        const user = e.detail?.user;
        runConfiguracionWithUser(user);
    });
}
