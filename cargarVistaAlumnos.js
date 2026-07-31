// 6. Renderizar Tabla Alumnos (INCLUYE FOTO / AVATAR)
async function cargarVistaAlumnos() {
    mainContent.innerHTML = '<div class="loading">Consultando Alumnos...</div>';

    const { data: alumnos, error } = await supabase.from('alumnos').select('*');

    if (error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${error.message}</p>`;
        return;
    }

    // Ordenar alumnos de menor a mayor por su ID
    alumnos.sort((a, b) => (a.id || 0) - (b.id || 0));

    let htmlTemplate = `
        <div class="header-seccion">
            <h2>Alumnos</h2>
            <p>Información general de los alumnos.</p>
        </div>
        <div class="table-responsive table-alumnos-scroll">
        <table class="data-table">
            <thead> 
                <tr>
                    <th>ID</th>
                    <th style="width: 50px; text-align: center;">Foto</th>
                    <th>Nombre</th>
                    <th>Nacimiento</th>
                    <th>Sexo</th>
                </tr>
            </thead>
            <tbody>
                ${alumnos.map(a => {
                    const fotoUrl = a.alumno_imagen_url && a.alumno_imagen_url.trim() !== ''
                        ? a.alumno_imagen_url
                        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.alumno_nombre)}&backgroundColor=0284c7`;

                    return `
                    <tr>
                        <td><strong># ${a.id}</strong></td>
                        <td style="text-align: center;">
                            <img src="${fotoUrl}" alt="${a.alumno_nombre}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Alumno&backgroundColor=0284c7'">
                        </td>
                        <td class="text-bold">${a.alumno_nombre}</td>
                        <td><span class="text-light">${a.alumno_birthday || '-'}</span></td>
                        <td><span class="badge" style="background-color: ${a.alumno_sexo === 'Masculino' ? '#bde0fe' : '#ffafcc'}; color: #000;">
                        ${a.alumno_sexo || 'N/A'}
                        </span></td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        </div>
        `;
    mainContent.innerHTML = htmlTemplate;
}