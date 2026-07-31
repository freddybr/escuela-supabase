// 4. Renderizar Tabla de Programas (mapea materia_id -> materia_nombre)
async function cargarVistaProgramas() {
    mainContent.innerHTML = '<div class="loading">Consultando Programas...</div>';

    // Obtener programas y materias en paralelo para mapear nombres sin requerir FK en la DB
    const [resProgramas, resMaterias] = await Promise.all([
        supabase.from('programas').select('*'),
        supabase.from('materias').select('*')
    ]);

    if (resProgramas.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error: ${resProgramas.error.message}</p>`;
        return;
    }

    if (resMaterias.error) {
        mainContent.innerHTML = `<p class="error-msg">❌ Error (materias): ${resMaterias.error.message}</p>`;
        return;
    }

    const programas = resProgramas.data || [];
    const materias = resMaterias.data || [];

    const materiasById = new Map(materias.map(m => [String(m.id), m.materia_nombre]));

    // Construir opciones de materias para el selector
    const opcionesMaterias = materias.map(m => `<option value="${m.id}">${m.materia_nombre}</option>`).join('');

    let htmlTemplate = `
        <div class="header-seccion" style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <h2>Programas</h2>
          <p>Contenido de programas.</p>
        </div>
        <div>
          <button id="btn-nuevo-programa" class="btn-primary">➕ Añadir</button>
        </div>
        </div>
        <div class="table-responsive">
            <table class="data-table" id="tabla-programas">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Materia</th>
                    <th>Programa</th>
                    <th>Objetivo</th>
                    <th>Versiculo</th>
                    <th>Estatus</th>
                </tr>
            </thead>
                <tbody>
                    ${programas.map(p => {
                        const nombreMateria = materiasById.get(String(p.materia_id)) || (p.materia_id ? `#${p.materia_id}` : 'Sin materia');
                        return `
                        <tr data-id="${p.id}" class="fila-programa">
                            <td><strong># ${p.id}</strong></td>
                            <td class="text-bold">${nombreMateria}</td>
                            <td class="text-bold">${p.programa_tema}</td>
                            <td><span class="text-light">${p.programa_objetivo}</span></td>
                            <td><span class="text-light">${p.programa_texto}</span></td>
                            <td>
                            <span class="badge" style="background-color: ${p.programa_estatus === 'Disponible' ? '#c7f9cc' : '#ffe3e0'}; color: #000;">
                            ${p.programa_estatus}
                            </span>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>

        <!-- Modal Programas -->
        <div id="modal-programa" class="modal" style="display:none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modal-programa-title">Programa</h3>
              <button id="modal-programa-close" class="modal-close">✕</button>
            </div>
            <div class="modal-body">
              <form id="form-programa">
                <input type="hidden" id="programa-id">
                <div class="form-row">
                  <label>Materia</label>
                  <select id="programa-materia" required>
                    <option value="">-- Seleccionar Materia --</option>
                    ${opcionesMaterias}
                  </select>
                </div>
                <div class="form-row">
                  <label>Programa (Título)</label>
                  <input id="programa-tema" type="text" required>
                </div>
                <div class="form-row">
                  <label>Objetivo</label>
                  <textarea id="programa-objetivo" rows="3"></textarea>
                </div>
                <div class="form-row">
                  <label>Versículo / Texto</label>
                  <textarea id="programa-texto" rows="3"></textarea>
                </div>
                <div class="form-row">
                  <label>Estatus</label>
                  <select id="programa-estatus" required>
                    <option value="Disponible">Disponible</option>
                    <option value="Elaborando">Elaborando</option>
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button id="btn-cancelar-programa" class="btn-secondary">Cancelar</button>
              <button id="btn-limpiar-programa" class="btn-tertiary">Limpiar</button>
              <button id="btn-borrar-programa" class="btn-danger" style="display:none;">Eliminar</button>
              <button id="btn-guardar-programa" class="btn-primary">Guardar</button>
            </div>
          </div>
        </div>

        `;
    mainContent.innerHTML = htmlTemplate;

    // Eventos
    document.getElementById('btn-nuevo-programa').addEventListener('click', () => abrirModalPrograma());

    document.querySelectorAll('.fila-programa').forEach(row => {
        row.addEventListener('click', async () => {
            const id = row.getAttribute('data-id');
            const { data: prog } = await supabase.from('programas').select('*').eq('id', id).maybeSingle();
            abrirModalPrograma(prog);
        });
    });

    document.getElementById('modal-programa-close').addEventListener('click', () => cerrarModalPrograma());
    document.getElementById('btn-guardar-programa').addEventListener('click', guardarPrograma);
    document.getElementById('btn-borrar-programa').addEventListener('click', borrarPrograma);
    document.getElementById('btn-cancelar-programa').addEventListener('click', (ev) => { ev.preventDefault(); cerrarModalPrograma(); });
    document.getElementById('btn-limpiar-programa').addEventListener('click', (ev) => { ev.preventDefault(); limpiarFormularioPrograma(); });
}

    function abrirModalPrograma(programa = null) {
        const modal = document.getElementById('modal-programa');
        const titulo = document.getElementById('modal-programa-title');
        const inputId = document.getElementById('programa-id');
        const selMateria = document.getElementById('programa-materia');
        const inpTema = document.getElementById('programa-tema');
        const inpObjetivo = document.getElementById('programa-objetivo');
        const inpTexto = document.getElementById('programa-texto');
        const selEstatus = document.getElementById('programa-estatus');
        const btnBorrar = document.getElementById('btn-borrar-programa');

        if (programa) {
            titulo.textContent = `Programa #${programa.id}`;
            inputId.value = programa.id;
            selMateria.value = programa.materia_id || '';
            inpTema.value = programa.programa_tema || '';
            inpObjetivo.value = programa.programa_objetivo || '';
            inpTexto.value = programa.programa_texto || '';
            selEstatus.value = programa.programa_estatus || 'Disponible';
            btnBorrar.style.display = '';
        } else {
            titulo.textContent = 'Nuevo Programa';
            inputId.value = '';
            selMateria.value = '';
            inpTema.value = '';
            inpObjetivo.value = '';
            inpTexto.value = '';
            selEstatus.value = 'Disponible';
            btnBorrar.style.display = 'none';
        }

        modal.style.display = 'flex';
    }

    function cerrarModalPrograma() {
        const modal = document.getElementById('modal-programa');
        modal.style.display = 'none';
    }

    async function guardarPrograma(e) {
        e.preventDefault();
        const id = document.getElementById('programa-id').value;
        const materia_id = document.getElementById('programa-materia').value;
        const tema = document.getElementById('programa-tema').value.trim();
        const objetivo = document.getElementById('programa-objetivo').value.trim();
        const texto = document.getElementById('programa-texto').value.trim();
        const estatus = document.getElementById('programa-estatus').value;

        if (!materia_id) { mostrarMensaje('error', 'Seleccione una materia'); return; }
        if (!tema) { mostrarMensaje('error', 'El título del programa es obligatorio'); return; }
        if (!['Disponible','Elaborando'].includes(estatus)) { mostrarMensaje('error', 'Estatus inválido'); return; }

        if (id) {
            const { error } = await supabase.from('programas').update({ materia_id: materia_id, programa_tema: tema, programa_objetivo: objetivo, programa_texto: texto, programa_estatus: estatus }).eq('id', id);
            if (error) { mostrarMensaje('error', 'Error al actualizar programa: ' + error.message); return; }
            mostrarMensaje('success', 'Programa actualizado correctamente');
        } else {
            const { error } = await supabase.from('programas').insert({ materia_id: materia_id, programa_tema: tema, programa_objetivo: objetivo, programa_texto: texto, programa_estatus: estatus });
            if (error) { mostrarMensaje('error', 'Error al crear programa: ' + error.message); return; }
            mostrarMensaje('success', 'Programa creado correctamente');
        }

        cerrarModalPrograma();
        cargarVistaProgramas();
    }

    async function borrarPrograma(e) {
        e.preventDefault();
        const id = document.getElementById('programa-id').value;
        if (!id) return;
        if (!confirm('¿Eliminar este programa? Esta acción no se puede deshacer.')) return;

        const { error } = await supabase.from('programas').delete().eq('id', id);
        if (error) { mostrarMensaje('error', 'Error al eliminar programa: ' + error.message); return; }
        mostrarMensaje('success', 'Programa eliminado correctamente');

        cerrarModalPrograma();
        cargarVistaProgramas();
    }

    function limpiarFormularioPrograma() {
        document.getElementById('programa-id').value = '';
        document.getElementById('programa-materia').value = '';
        document.getElementById('programa-tema').value = '';
        document.getElementById('programa-objetivo').value = '';
        document.getElementById('programa-texto').value = '';
        document.getElementById('programa-estatus').value = 'Disponible';
        document.getElementById('programa-materia').focus();
    }