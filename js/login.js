import { supabase } from './config.js';

const modal = document.getElementById('login-modal');
const btnShowLogin = document.getElementById('btn-show-login');
const btnCloseModal = document.getElementById('close-modal');
const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('login-error');

if (btnShowLogin && modal) {
    btnShowLogin.addEventListener('click', () => modal.classList.remove('hidden'));
}

if (btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
}

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('login-email')?.value || '';
        const password = document.getElementById('login-password')?.value || '';

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (errorMsg) {
                errorMsg.textContent = error.message;
                errorMsg.classList.remove('hidden');
            }
            return;
        }

        if (data?.user) {
            window.location.href = 'pages/dashboard.html';
        }
    });
}

// Control de redirección por inactividad
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('reason') === 'inactivity') {
    if (modal) {
        modal.classList.remove('hidden');
    }
    if (errorMsg) {
        errorMsg.textContent = '⚠️ Su sesión ha expirado por inactividad. Inicie sesión nuevamente.';
        errorMsg.style.color = '#d97706'; // Color ámbar de advertencia
        errorMsg.classList.remove('hidden');
    }
}

// Toggle password visibility
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('login-password');

if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        if (type === 'text') {
            togglePasswordBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
            `;
            togglePasswordBtn.setAttribute('aria-label', 'Ocultar contraseña');
        } else {
            togglePasswordBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            `;
            togglePasswordBtn.setAttribute('aria-label', 'Mostrar contraseña');
        }
    });
}

