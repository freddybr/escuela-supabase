import { renderHeaderSeccion } from '../ui.js';
import { ClaseService } from '../services.js';

export async function cargarVistaClases(container) {
    container.innerHTML = '<div class="loading">Consultando Clases...</div>';

    const { data: clases, error } = await ClaseService.getClasesWithProgramas();

    if (error) {
        container.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    const programasUnicos = [...new Set(
        clases.map(c => c.programas?.programa_tema).filter(Boolean)
    )].sort();

    let htmlTemplate = `
    ${renderHeaderSeccion('clases', 'Clases', 'Listado General de Clases.')}

    <div class="filters-bar filters-bar-small" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: center;">
        <div style="flex: 1 1 240px; min-width: 140px;">
            <input 
                type="text" 
                id="filter-search-clases" 
                class="form-control" 
                placeholder="Buscar Tema u Objetivo..." 
            >
        </div>
        <div style="width: 220px;">
            <select id="filter-programa-clases" class="form-select">
                <option value="">Todos los Programas</option>
                ${programasUnicos.map(programa => `<option value="${programa}">${programa}</option>`).join('')}
            </select>
        </div>
    </div>

    <div class="table-responsive table-clases-scroll">
        <table class="data-table" id="tabla-clases">
            <thead>
                <tr>
                    <th>Num</th>
                    <th>Tema</th>
                    <th>Objetivo</th>
                    <th>Programa</th>
                </tr>
            </thead>
            <tbody>
                ${[...clases]
                    .sort((a, b) => (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0))
                    .map(c => {
                        const nombrePrograma = c.programas?.programa_tema || 'Sin programa';
                        return `
                        <tr 
                        data-tema="${c.clase_tema || ''}" 
                        data-objetivo="${c.clase_objetivo || ''}"
                        data-programa="${nombrePrograma}"
                        >
                            <td data-label="Num"><strong># ${c.clase_num}</strong></td>
                            <td data-label="Tema" class="text-bold">${c.clase_tema}</td>
                            <td data-label="Objetivo"><span class="text-light">${c.clase_objetivo}</span></td>
                            <td data-label="Programa"><span class="text-light">${nombrePrograma}</span></td>
                        </tr>
                        `;
                    }).join('')}
            </tbody>
        </table>
    </div>
    `;

    container.innerHTML = htmlTemplate;

    const inputSearch = document.getElementById('filter-search-clases');
    const selectPrograma = document.getElementById('filter-programa-clases');

    const aplicarFiltrosClases = () => {
        const textoBusqueda = (inputSearch?.value || '').toLowerCase();
        const programaSel = selectPrograma?.value || '';

        const filas = document.querySelectorAll('#tabla-clases tbody tr');

        filas.forEach(row => {
            const tema = row.getAttribute('data-tema').toLowerCase();
            const objetivo = row.getAttribute('data-objetivo').toLowerCase();
            const programa = row.getAttribute('data-programa');

            const coincideTexto = !textoBusqueda || tema.includes(textoBusqueda) || objetivo.includes(textoBusqueda);
            const coincidePrograma = !programaSel || programa === programaSel;

            if (coincideTexto && coincidePrograma) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

    inputSearch?.addEventListener('input', aplicarFiltrosClases);
    selectPrograma?.addEventListener('change', aplicarFiltrosClases);
}
