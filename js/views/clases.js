import { ClaseService } from '../services.js';

export async function cargarVistaClases() {
    const tableBody = document.getElementById('tabla-clases-body');
    const selectPrograma = document.getElementById('filter-programa-clases');
    const inputSearch = document.getElementById('filter-search-clases');

    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">Consultando Clases...</td></tr>';
    }

    const { data: clases, error } = await ClaseService.getClasesWithProgramas();

    if (error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" class="error-msg">❌ Error: ${error.message}</td></tr>`;
        }
        return;
    }

    const programasUnicos = [...new Set(
        clases.map(c => c.programas?.programa_tema).filter(Boolean)
    )].sort();

    // Rellenar select de programas para filtrar
    if (selectPrograma) {
        selectPrograma.innerHTML = '<option value="">Programas</option>' +
            programasUnicos.map(programa => `<option value="${programa}">${programa}</option>`).join('');
    }

    // Dibujar la tabla
    if (tableBody) {
        if (clases.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay clases registradas.</td></tr>';
        } else {
            const sortedClases = [...clases].sort((a, b) => (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0));
            tableBody.innerHTML = sortedClases.map(c => {
                const nombrePrograma = c.programas?.programa_tema || 'Sin programa';
                return `
                <tr 
                data-num="${c.clase_num || ''}"
                data-tema="${c.clase_tema || ''}" 
                data-objetivo="${c.clase_objetivo || ''}"
                data-texto="${c.clase_texto || ''}"
                data-programa="${nombrePrograma}"
                >
                    <td data-label="Num"><strong># ${c.clase_num}</strong></td>
                    <td data-label="Tema" class="text-bold">${c.clase_tema}</td>
                    <td data-label="Objetivo"><span class="text-light">${c.clase_objetivo}</span></td>
                    <td data-label="Texto"><span class="text-light">${c.clase_texto || ''}</span></td>
                    <td data-label="Programa"><span class="text-light">${nombrePrograma}</span></td>
                </tr>
                `;
            }).join('');
        }
    }

    const aplicarFiltrosClases = () => {
        const textoBusqueda = (inputSearch?.value || '').toLowerCase();
        const programaSel = selectPrograma?.value || '';

        const filas = document.querySelectorAll('#tabla-clases tbody tr');

        filas.forEach(row => {
            const num = (row.getAttribute('data-num') || '').toLowerCase();
            const tema = row.getAttribute('data-tema')?.toLowerCase() || '';
            const objetivo = row.getAttribute('data-objetivo')?.toLowerCase() || '';
            const texto = (row.getAttribute('data-texto') || '').toLowerCase();
            const programa = row.getAttribute('data-programa');

            const coincideTexto = !textoBusqueda || 
                                  num.includes(textoBusqueda) || 
                                  `#${num}`.includes(textoBusqueda) || 
                                  `# ${num}`.includes(textoBusqueda) || 
                                  tema.includes(textoBusqueda) || 
                                  objetivo.includes(textoBusqueda) || 
                                  texto.includes(textoBusqueda);
            const coincidePrograma = !programaSel || programa === programaSel;

            if (coincideTexto && coincidePrograma) {
                row.style.removeProperty('display');
            } else {
                row.style.setProperty('display', 'none', 'important');
            }
        });
    };

    inputSearch?.addEventListener('input', aplicarFiltrosClases);
    selectPrograma?.addEventListener('change', aplicarFiltrosClases);
}

if (window.layoutReady) {
    cargarVistaClases();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaClases();
    });
}
