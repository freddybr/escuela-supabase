import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { AlumnoService, GradoService, AsistenciaService, ControlService, AsignacionService } from '../services.js';

let containerElement = null;

// Datos cargados en memoria para filtros instantáneos
let todosGrados = [];
let todosAlumnos = [];
let todasAsistencias = [];
let todosControles = [];
let todasAsignaciones = [];

export async function cargarVistaReportes(container) {
    containerElement = container;
    container.innerHTML = '<div class="loading">Cargando Módulo de Reportes...</div>';

    // 1. Cargar todos los datos necesarios en paralelo
    const [resGrados, resAlumnos, resAsistencias, resControles, resAsignaciones] = await Promise.all([
        GradoService.getGrados(),
        AlumnoService.getAlumnos(),
        AsistenciaService.getAsistenciasVista(),
        ControlService.getControlesVista(),
        AsignacionService.getAsignacionesDetalles()
    ]);

    if (resGrados.error || resAlumnos.error || resAsistencias.error || resControles.error || resAsignaciones.error) {
        container.innerHTML = `<p class="error-msg">❌ Error al cargar datos para los reportes.</p>`;
        return;
    }

    todosGrados = resGrados.data || [];
    todosAlumnos = resAlumnos.data || [];
    todasAsistencias = resAsistencias.data || [];
    todosControles = resControles.data || [];
    todasAsignaciones = resAsignaciones.data || [];

    // Ordenar alumnos alfabéticamente
    todosAlumnos.sort((a, b) => (a.alumno_nombre || '').localeCompare(b.alumno_nombre || ''));

    // 2. Renderizar Estructura del Panel de Reportes
    let htmlTemplate = `
        <div class="reportes-layout">
            ${renderHeaderSeccion('reportes', 'Módulo de Reportes', 'Visualice y exporte estadísticas académicas y de asistencias.')}

        <!-- Pestañas de Selección de Reporte -->
        <div class="report-tabs">
            <button class="report-tab-btn active" data-target="tab-alumno">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Asistencia Individual
            </button>
            <button class="report-tab-btn" data-target="tab-grado">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Asistencia de Grado
            </button>
            <button class="report-tab-btn" data-target="tab-avance">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Avance Programático (Clases)
            </button>
        </div>

        <!-- CONTENIDOS DE LAS PESTAÑAS -->
        
        <!-- PESTAÑA 1: REPORTE INDIVIDUAL -->
        <div id="tab-alumno" class="report-tab-content active">
            <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
                <div style="width: 220px;">
                    <select id="rep-alumno-grado" class="form-select">
                        <option value="">-- Seleccionar Grado --</option>
                        ${todosGrados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('')}
                    </select>
                </div>
                <div style="width: 280px;">
                    <select id="rep-alumno-select" class="form-select" disabled>
                        <option value="">-- Seleccione un Grado primero --</option>
                    </select>
                </div>
                <button id="btn-print-alumno" class="btn-primary" style="margin-left: auto; display: none;">
                    🖨️ Imprimir / PDF
                </button>
            </div>
            
            <div id="result-alumno-container" style="display: none;">
                <!-- Métricas -->
                <div class="metrics-row">
                    <div class="metric-box">
                        <h4>Porcentaje de Asistencia</h4>
                        <div class="metric-number" id="m-alumno-porcentaje">0%</div>
                        <div class="attendance-progress-container">
                            <div class="attendance-progress-bar">
                                <div id="m-alumno-progress-fill" class="attendance-progress-fill" style="width: 0%;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="metric-box">
                        <h4>Clases Registradas</h4>
                        <div class="metric-number" id="m-alumno-totales">0</div>
                    </div>
                    <div class="metric-box">
                        <h4>Presentes</h4>
                        <div class="metric-number" id="m-alumno-presentes" style="color: var(--success);">0</div>
                    </div>
                    <div class="metric-box">
                        <h4>Faltas (Ausentes)</h4>
                        <div class="metric-number" id="m-alumno-inasistencias" style="color: var(--danger);">0</div>
                    </div>
                </div>

                <!-- Tabla de Detalle -->
                <div class="table-responsive table-rep-alumno-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Programa</th>
                                <th>Clase</th>
                                <th>Estatus Asistencia</th>
                                <th>Evaluación</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody id="table-body-alumno"></tbody>
                    </table>
                </div>
            </div>
            <div id="empty-alumno-msg" class="text-center" style="padding: 40px; color: var(--text-muted);">
                Por favor, seleccione un Grado y un Alumno para generar el reporte de asistencia individual.
            </div>
        </div>

        <!-- PESTAÑA 2: REPORTE DE GRADO -->
        <div id="tab-grado" class="report-tab-content">
            <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
                <div style="width: 220px;">
                    <select id="rep-grado-select" class="form-select">
                        <option value="">-- Seleccionar Grado --</option>
                        ${todosGrados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('')}
                    </select>
                </div>
                <button id="btn-print-grado" class="btn-primary" style="margin-left: auto; display: none;">
                    🖨️ Imprimir / PDF
                </button>
            </div>

            <div id="result-grado-container" style="display: none;">
                <!-- Métricas -->
                <div class="metrics-row">
                    <div class="metric-box">
                        <h4>Promedio Asistencia del Grado</h4>
                        <div class="metric-number" id="m-grado-promedio">0%</div>
                        <div class="attendance-progress-container">
                            <div class="attendance-progress-bar">
                                <div id="m-grado-progress-fill" class="attendance-progress-fill" style="width: 0%;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="metric-box">
                        <h4>Estudiantes Registrados</h4>
                        <div class="metric-number" id="m-grado-alumnos">0</div>
                    </div>
                </div>

                <!-- Tabla -->
                <div class="table-responsive table-rep-grado-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Alumno</th>
                                <th>Correo</th>
                                <th>Clases Evaluadas</th>
                                <th>Asistencias</th>
                                <th>Inasistencias</th>
                                <th>% Asistencia</th>
                            </tr>
                        </thead>
                        <tbody id="table-body-grado"></tbody>
                    </table>
                </div>
            </div>
            <div id="empty-grado-msg" class="text-center" style="padding: 40px; color: var(--text-muted);">
                Por favor, seleccione un Grado para generar el reporte de asistencia general.
            </div>
        </div>

        <!-- PESTAÑA 3: REPORTE DE AVANCE PROGRAMÁTICO -->
        <div id="tab-avance" class="report-tab-content">
            <div class="filters-bar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
                <div style="width: 380px;">
                    <select id="rep-avance-asignacion" class="form-select">
                        <option value="">-- Seleccionar Asignación Escolar --</option>
                        ${todasAsignaciones.filter(asig => asig.asigna_estatus === 'Activa').map(asig => `<option value="${asig.asigna_id}">Asig #${asig.asigna_id} - Materia: ${asig.programa_tema} | Grado: ${asig.grado_numero}</option>`).join('')}
                    </select>
                </div>
                <button id="btn-print-avance" class="btn-primary" style="margin-left: auto; display: none;">
                    🖨️ Imprimir / PDF
                </button>
            </div>

            <div id="result-avance-container" style="display: none;">
                <!-- Métricas -->
                <div class="metrics-row">
                    <div class="metric-box">
                        <h4>Tasa de Avance Programático</h4>
                        <div class="metric-number" id="m-avance-porcentaje">0%</div>
                        <div class="attendance-progress-container">
                            <div class="attendance-progress-bar">
                                <div id="m-avance-progress-fill" class="attendance-progress-fill" style="width: 0%;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="metric-box">
                        <h4>Clases Planificadas</h4>
                        <div class="metric-number" id="m-avance-totales">0</div>
                    </div>
                    <div class="metric-box">
                        <h4>Clases Dictadas (Vistas)</h4>
                        <div class="metric-number" id="m-avance-ejecutadas" style="color: var(--success);">0</div>
                    </div>
                </div>

                <!-- Tabla -->
                <div class="table-responsive table-rep-avance-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th># Clase</th>
                                <th>Tema de Clase</th>
                                <th>Fecha Ejecución</th>
                                <th>Docente</th>
                                <th>Estatus</th>
                                <th>Observaciones de Clase</th>
                            </tr>
                        </thead>
                        <tbody id="table-body-avance"></tbody>
                    </table>
                </div>
            </div>
            <div id="empty-avance-msg" class="text-center" style="padding: 40px; color: var(--text-muted);">
                Por favor, seleccione una Asignación para visualizar el avance programático de clases.
            </div>
        </div>

        <!-- CONTENEDORES INVISIBLES EXCLUSIVOS DE IMPRESIÓN A4 -->
        <div class="print-only-header">
            <div class="print-header-main">
                <div class="print-school-info">
                    <h2 id="print-school-title">ESCUELA DIGITAL</h2>
                    <p>Reporte Oficial de Rendimiento y Seguimiento Académico</p>
                </div>
                <div class="print-report-meta">
                    <p><strong>Fecha Emisión:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                    <p id="print-report-subtitle"></p>
                </div>
            </div>
        </div>

        <div class="print-only-footer">
            <div class="signature-grid">
                <div>
                    <div class="signature-line">Docente de Grado</div>
                </div>
                <div>
                    <div class="signature-line">Coordinador / Dirección</div>
                </div>
            </div>
        </div>
        </div>
    `;

    container.innerHTML = htmlTemplate;

    // 3. Registrar Eventos de Cambio de Pestañas
    const tabButtons = container.querySelectorAll('.report-tab-btn');
    const tabContents = container.querySelectorAll('.report-tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 4. Lógica de Pestaña A: Reporte de Asistencia de Alumno
    const selectAlumnoGrado = document.getElementById('rep-alumno-grado');
    const selectAlumnoSel = document.getElementById('rep-alumno-select');
    const resultAlumnoContainer = document.getElementById('result-alumno-container');
    const emptyAlumnoMsg = document.getElementById('empty-alumno-msg');
    const btnPrintAlumno = document.getElementById('btn-print-alumno');

    // Cambiar la lista de alumnos según el grado seleccionado
    selectAlumnoGrado.addEventListener('change', () => {
        const gradoId = selectAlumnoGrado.value;
        if (!gradoId) {
            selectAlumnoSel.innerHTML = '<option value="">-- Seleccione un Grado primero --</option>';
            selectAlumnoSel.disabled = true;
            resultAlumnoContainer.style.display = 'none';
            emptyAlumnoMsg.style.display = 'block';
            btnPrintAlumno.style.display = 'none';
            return;
        }

        const alumnosFiltrados = todosAlumnos.filter(a => String(a.grado_id) === String(gradoId));
        if (alumnosFiltrados.length === 0) {
            selectAlumnoSel.innerHTML = '<option value="">-- Sin Alumnos en este Grado --</option>';
            selectAlumnoSel.disabled = true;
            resultAlumnoContainer.style.display = 'none';
            emptyAlumnoMsg.style.display = 'block';
            btnPrintAlumno.style.display = 'none';
            return;
        }

        selectAlumnoSel.innerHTML = '<option value="">-- Seleccionar Alumno --</option>' +
            alumnosFiltrados.map(a => `<option value="${a.id}" data-nombre="${a.alumno_nombre}">${a.alumno_nombre} (#${a.id})</option>`).join('');
        selectAlumnoSel.disabled = false;
    });

    // Cargar reporte al seleccionar el alumno
    selectAlumnoSel.addEventListener('change', () => {
        const alumnoId = selectAlumnoSel.value;
        const optionSel = selectAlumnoSel.options[selectAlumnoSel.selectedIndex];
        const alumnoNombre = optionSel?.getAttribute('data-nombre');

        if (!alumnoId || !alumnoNombre) {
            resultAlumnoContainer.style.display = 'none';
            emptyAlumnoMsg.style.display = 'block';
            btnPrintAlumno.style.display = 'none';
            return;
        }

        // Filtrar asistencias de este alumno en memoria
        const asistenciasAlumno = todasAsistencias.filter(as => as.alumno && as.alumno.trim().toLowerCase() === alumnoNombre.trim().toLowerCase());

        // Obtener el grado seleccionado
        const gradoId = selectAlumnoGrado.value;
        const gradoObj = todosGrados.find(g => String(g.id) === String(gradoId));
        const gradoNombre = gradoObj ? (gradoObj.grado_nombre || '') : '';
        const gradoNumero = gradoObj ? (gradoObj.grado_numero || '') : '';

        // Buscar programas asignados a este grado por grado_numero
        const asignacionesDelGrado = todasAsignaciones.filter(asig => 
            (asig.grado_numero || '').trim().toLowerCase() === gradoNumero.trim().toLowerCase()
        );
        const nombresProgramas = asignacionesDelGrado.map(asig => (asig.programa_tema || '').trim().toLowerCase());

        // Calcular Clases Registradas (clases "Vista" de la ejecución para estos programas en este grado)
        const clasesRegistradas = todosControles.filter(c => 
            (c.grado_numero || '').trim().toLowerCase() === gradoNumero.trim().toLowerCase() &&
            nombresProgramas.includes((c.programa_tema || '').trim().toLowerCase()) &&
            c.control_estatus === 'Vista'
        ).length;

        // Calcular Presentes (clases con estatus "Presente" para estos programas de este grado)
        const presentes = asistenciasAlumno.filter(as => 
            (as.grado || '').trim().toLowerCase() === gradoNombre.trim().toLowerCase() &&
            nombresProgramas.includes((as.programa || '').trim().toLowerCase()) &&
            as.presente
        ).length;

        const inasistencias = Math.max(0, clasesRegistradas - presentes);
        const rawPct = clasesRegistradas > 0 ? (presentes / clasesRegistradas * 100) : 0;
        const porcentaje = Number.isInteger(rawPct) ? rawPct : rawPct.toFixed(2);

        // Inyectar métricas
        document.getElementById('m-alumno-porcentaje').textContent = `${porcentaje}%`;
        document.getElementById('m-alumno-totales').textContent = clasesRegistradas;
        document.getElementById('m-alumno-presentes').textContent = presentes;
        document.getElementById('m-alumno-inasistencias').textContent = inasistencias;

        // Barra de progreso color
        const fill = document.getElementById('m-alumno-progress-fill');
        fill.style.width = `${porcentaje}%`;
        fill.className = 'attendance-progress-fill ' + (porcentaje >= 90 ? 'attendance-high' : porcentaje >= 80 ? 'attendance-medium' : 'attendance-low');

        // Llenar tabla
        const tbody = document.getElementById('table-body-alumno');
        tbody.innerHTML = asistenciasAlumno.map(as => `
            <tr>
                <td data-label="Fecha"><strong>${formatearFecha(as.fecha)}</strong></td>
                <td data-label="Programa">${as.programa || '-'}</td>
                <td data-label="Clase">${as.clase || '-'}</td>
                <td data-label="Estatus Asistencia">
                    <span class="badge" style="background-color: ${as.presente ? '#198754' : '#dc3545'}; color:#ffffff;">
                        ${as.presente ? 'Presente' : 'Ausente'}
                    </span>
                </td>
                <td data-label="Evaluación">${as.evaluacion || '-'}</td>
                <td data-label="Observaciones"><span class="text-light">${as.observaciones || ''}</span></td>
            </tr>
        `).join('');

        resultAlumnoContainer.style.display = 'block';
        emptyAlumnoMsg.style.display = 'none';
        btnPrintAlumno.style.display = 'block';
    });

    // 5. Lógica de Pestaña B: Reporte Grupal de Grado
    const selectGradoReporte = document.getElementById('rep-grado-select');
    const resultGradoContainer = document.getElementById('result-grado-container');
    const emptyGradoMsg = document.getElementById('empty-grado-msg');
    const btnPrintGrado = document.getElementById('btn-print-grado');

    selectGradoReporte.addEventListener('change', () => {
        const gradoId = selectGradoReporte.value;
        if (!gradoId) {
            resultGradoContainer.style.display = 'none';
            emptyGradoMsg.style.display = 'block';
            btnPrintGrado.style.display = 'none';
            return;
        }

        const alumnosGrado = todosAlumnos.filter(a => String(a.grado_id) === String(gradoId));
        if (alumnosGrado.length === 0) {
            mostrarMensaje('info', 'No hay alumnos registrados en el grado seleccionado.');
            resultGradoContainer.style.display = 'none';
            emptyGradoMsg.style.display = 'block';
            btnPrintGrado.style.display = 'none';
            return;
        }

        const gradoObj = todosGrados.find(g => String(g.id) === String(gradoId));
        const gradoNombre = gradoObj ? (gradoObj.grado_nombre || '') : '';
        const gradoNumero = gradoObj ? (gradoObj.grado_numero || '') : '';

        // Buscar programas asignados a este grado por grado_numero
        const asignacionesDelGrado = todasAsignaciones.filter(asig => 
            (asig.grado_numero || '').trim().toLowerCase() === gradoNumero.trim().toLowerCase()
        );
        const nombresProgramas = asignacionesDelGrado.map(asig => (asig.programa_tema || '').trim().toLowerCase());

        // Calcular Clases Registradas (clases "Vista" de la ejecución para estos programas en este grado)
        const clasesRegistradas = todosControles.filter(c => 
            (c.grado_numero || '').trim().toLowerCase() === gradoNumero.trim().toLowerCase() &&
            nombresProgramas.includes((c.programa_tema || '').trim().toLowerCase()) &&
            c.control_estatus === 'Vista'
        ).length;

        let sumaPorcentajes = 0;
        let totalAlumnosConDatos = 0;

        const tableRows = alumnosGrado.map(a => {
            const asistenciasAlumno = todasAsistencias.filter(as => as.alumno && as.alumno.trim().toLowerCase() === a.alumno_nombre.trim().toLowerCase());
            
            // Calcular Presentes (clases con estatus "Presente" para estos programas de este grado)
            const presentes = asistenciasAlumno.filter(as => 
                (as.grado || '').trim().toLowerCase() === gradoNombre.trim().toLowerCase() &&
                nombresProgramas.includes((as.programa || '').trim().toLowerCase()) &&
                as.presente
            ).length;

            const totalClases = clasesRegistradas;
            const inasistencias = Math.max(0, totalClases - presentes);
            const rawPct = totalClases > 0 ? (presentes / totalClases * 100) : 0;
            const porcentaje = totalClases > 0 ? (Number.isInteger(rawPct) ? rawPct : rawPct.toFixed(2)) : null;

            if (porcentaje !== null) {
                sumaPorcentajes += Number(porcentaje);
                totalAlumnosConDatos++;
            }

            const pTexto = porcentaje !== null ? `${porcentaje}%` : 'N/A';
            const badgeBg = porcentaje === null ? '#6c757d' : porcentaje >= 90 ? '#198754' : porcentaje >= 80 ? '#f59e0b' : '#dc3545';

            return `
                <tr>
                    <td data-label="ID"><strong># ${a.id}</strong></td>
                    <td data-label="Alumno" class="text-bold">${a.alumno_nombre}</td>
                    <td data-label="Correo">${a.alumno_email || '-'}</td>
                    <td data-label="Clases Evaluadas">${totalClases}</td>
                    <td data-label="Asistencias" style="color:#198754; font-weight:700;">${presentes}</td>
                    <td data-label="Inasistencias" style="color:#dc3545; font-weight:700;">${inasistencias}</td>
                    <td data-label="% Asistencia">
                        <span class="badge" style="background-color: ${badgeBg}; color:#ffffff;">
                            ${pTexto}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        const promedioGrado = totalAlumnosConDatos > 0 ? Math.round(sumaPorcentajes / totalAlumnosConDatos) : 0;

        // Inyectar métricas del grupo
        document.getElementById('m-grado-promedio').textContent = `${promedioGrado}%`;
        document.getElementById('m-grado-alumnos').textContent = alumnosGrado.length;

        const fillGrado = document.getElementById('m-grado-progress-fill');
        fillGrado.style.width = `${promedioGrado}%`;
        fillGrado.className = 'attendance-progress-fill ' + (promedioGrado >= 90 ? 'attendance-high' : promedioGrado >= 80 ? 'attendance-medium' : 'attendance-low');

        document.getElementById('table-body-grado').innerHTML = tableRows;

        resultGradoContainer.style.display = 'block';
        emptyGradoMsg.style.display = 'none';
        btnPrintGrado.style.display = 'block';
    });

    // 6. Lógica de Pestaña C: Reporte de Avance Programático
    const selectAvanceAsignacion = document.getElementById('rep-avance-asignacion');
    const resultAvanceContainer = document.getElementById('result-avance-container');
    const emptyAvanceMsg = document.getElementById('empty-avance-msg');
    const btnPrintAvance = document.getElementById('btn-print-avance');

    selectAvanceAsignacion.addEventListener('change', () => {
        const asignacionId = selectAvanceAsignacion.value;
        if (!asignacionId) {
            resultAvanceContainer.style.display = 'none';
            emptyAvanceMsg.style.display = 'block';
            btnPrintAvance.style.display = 'none';
            return;
        }

        // Buscar controles de clases dictadas asociadas a esta asignación
        const controlesAsignacion = todosControles.filter(c => String(c.asigna_id) === String(asignacionId));

        if (controlesAsignacion.length === 0) {
            mostrarMensaje('info', 'No se registran clases para la asignación escolar seleccionada.');
            resultAvanceContainer.style.display = 'none';
            emptyAvanceMsg.style.display = 'block';
            btnPrintAvance.style.display = 'none';
            return;
        }

        const totalClases = controlesAsignacion.length;
        const dictadas = controlesAsignacion.filter(c => c.control_estatus === 'Vista').length;
        const avancePorcentaje = totalClases > 0 ? Math.round((dictadas / totalClases) * 100) : 0;

        // Inyectar métricas de avance
        document.getElementById('m-avance-porcentaje').textContent = `${avancePorcentaje}%`;
        document.getElementById('m-avance-totales').textContent = totalClases;
        document.getElementById('m-avance-ejecutadas').textContent = dictadas;

        const fillAvance = document.getElementById('m-avance-progress-fill');
        fillAvance.style.width = `${avancePorcentaje}%`;
        fillAvance.className = 'attendance-progress-fill ' + (avancePorcentaje >= 90 ? 'attendance-high' : avancePorcentaje >= 70 ? 'attendance-medium' : 'attendance-low');

        // Ordenar controles por número de clase de menor a mayor
        controlesAsignacion.sort((a, b) => (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0));

        // Llenar tabla
        document.getElementById('table-body-avance').innerHTML = controlesAsignacion.map(c => {
            const badgeBg = c.control_estatus === 'Vista' ? '#198754' : c.control_estatus === 'Programada' ? '#0d6efd' : '#f59e0b';
            return `
                <tr>
                    <td data-label="# Clase"><strong># ${c.clase_num || ''}</strong></td>
                    <td data-label="Tema de Clase" class="text-bold">${c.clase_tema || '-'}</td>
                    <td data-label="Fecha Ejecución">${formatearFecha(c.control_fecha) || 'Sin fecha'}</td>
                    <td data-label="Docente">${c.profe_nombre || 'Sin asignar'}</td>
                    <td data-label="Estatus">
                        <span class="badge" style="background-color: ${badgeBg}; color:#ffffff;">
                            ${c.control_estatus || 'Pendiente'}
                        </span>
                    </td>
                    <td data-label="Observaciones de Clase"><span class="text-light">${c.control_observaciones || ''}</span></td>
                </tr>
            `;
        }).join('');

        resultAvanceContainer.style.display = 'block';
        emptyAvanceMsg.style.display = 'none';
        btnPrintAvance.style.display = 'block';
    });

    // 7. Lógica de Impresión de PDF
    const configurarImpresion = (tituloReporte, subtituloReporte) => {
        document.getElementById('print-report-subtitle').innerHTML = `<strong>Reporte:</strong> ${tituloReporte}<br><strong>Filtro:</strong> ${subtituloReporte}`;
    };

    btnPrintAlumno.addEventListener('click', () => {
        const alumnoNombre = selectAlumnoSel.options[selectAlumnoSel.selectedIndex].text;
        const gradoNombre = selectAlumnoGrado.options[selectAlumnoGrado.selectedIndex].text;
        configurarImpresion('Asistencia Individual de Alumno', `${alumnoNombre} (${gradoNombre})`);
        window.print();
    });

    btnPrintGrado.addEventListener('click', () => {
        const gradoNombre = selectGradoReporte.options[selectGradoReporte.selectedIndex].text;
        configurarImpresion('Asistencia General del Grado', gradoNombre);
        window.print();
    });

    btnPrintAvance.addEventListener('click', () => {
        const asignacionNombre = selectAvanceAsignacion.options[selectAvanceAsignacion.selectedIndex].text;
        configurarImpresion('Avance Académico Programático', asignacionNombre);
        window.print();
    });
}

// Helper para dar formato DD/MM/AAAA a las fechas de la DB (AAAA-MM-DD)
function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fechaStr;
}
