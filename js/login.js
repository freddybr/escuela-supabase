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
