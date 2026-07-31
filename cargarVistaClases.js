// 5. Renderizar Tabla Clases con Filtro de Programa
async function cargarVistaClases() {
    mainContent.innerHTML = '<div class="loading">Consultando Clases...</div>';

    const { data: clases, error } = await supabase
        .from('clases')
        .select('clase_num, clase_tema, clase_objetivo, programas(programa_tema), programa_id');

    if (error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    const programasUnicos = [...new Set(
        clases
            .map(c => c.programas?.programa_tema)
            .filter(Boolean)
    )].sort();

    let htmlTemplate = `
    <div class="header-seccion">
        <h2>Clases</h2>
        <p>Listado General de Clases.</p>
    </div>

    <div class="filters-bar" style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
        <div style="flex: 1; min-width: 200px;">
            <input 
                type="text" 
                id="filter-search-clases" 
                class="form-control" 
                placeholder="Buscar Tema u Objetivo..." 
                oninput="window.aplicarFiltrosClases()"
            >
        </div>
        <div style="width: 220px;">
            <select id="filter-programa-clases" class="form-select" onchange="window.aplicarFiltrosClases()">
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
                            <td><strong># ${c.clase_num}</strong></td>
                            <td class="text-bold">${c.clase_tema}</td>
                            <td><span class="text-light">${c.clase_objetivo}</span></td>
                            <td><span class="text-light">${nombrePrograma}</span></td>
                        </tr>
                        `;
                    }).join('')}
            </tbody>
        </table>
    </div>
    `;

    mainContent.innerHTML = htmlTemplate;
}

    window.aplicarFiltrosClases = function () {
        const textoBusqueda = (document.getElementById('filter-search-clases')?.value || '').toLowerCase();
        const programaSel = document.getElementById('filter-programa-clases')?.value || '';

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