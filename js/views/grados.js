import { renderHeaderSeccion } from '../ui.js';
import { GradoService } from '../services.js';

export async function cargarVistaGrados(container) {
    container.innerHTML = '<div class="loading">Consultando niveles...</div>';

    const { data: grados, error } = await GradoService.getGrados();

    if (error) {
        container.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    let htmlTemplate = `
        ${renderHeaderSeccion('grados', 'Grados', 'Niveles educativos habilitados.')}
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nivel</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    ${grados.map(g => `
                        <tr>
                            <td data-label="ID"><strong># ${g.id}</strong></td>
                            <td data-label="Nivel" class="text-bold">${g.grado_numero}</td>
                            <td data-label="Nombre" class="text-light">${g.grado_nombre}</td>
                            <td data-label="Descripción"><span class="text-light">${g.grado_descripcion}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = htmlTemplate;
}
