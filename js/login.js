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
            window.location.href = 'app.html';
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
