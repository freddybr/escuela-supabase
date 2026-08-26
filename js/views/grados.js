import { GradoService } from '../services.js';

export async function cargarVistaGrados() {
    const tableBody = document.getElementById('tabla-grados-body');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="4" class="loading">Consultando niveles...</td></tr>';
    }

    const { data: grados, error } = await GradoService.getGrados();

    if (error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="4" class="error-msg">❌ Error: ${error.message}</td></tr>`;
        }
        return;
    }

    if (tableBody) {
        if (grados.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay grados registrados.</td></tr>';
        } else {
            tableBody.innerHTML = grados.map(g => `
                <tr>
                    <td data-label="ID"><strong># ${g.id}</strong></td>
                    <td data-label="Nivel" class="text-bold">${g.grado_numero}</td>
                    <td data-label="Nombre" class="text-light">${g.grado_nombre}</td>
                    <td data-label="Descripción"><span class="text-light">${g.grado_descripcion}</span></td>
                </tr>
            `).join('');
        }
    }
}

if (window.layoutReady) {
    cargarVistaGrados();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaGrados();
    });
}
