import { renderHeaderSeccion, mostrarMensaje } from '../ui.js';
import { AlumnoService, GradoService, AsistenciaService, ControlService, AsignacionService } from '../services.js';

let containerElement = null;

// Datos cargados en memoria para filtros instantáneos
let todosGrados = [];
let todosAlumnos = [];
let todasAsistencias = [];
let todosControles = [];
let todasAsignaciones = [];
let modalInitialized = false;

export async function cargarVistaReportes() {
    const loadingEl = document.getElementById('reports-loading');
    const deniedContainer = document.getElementById('reports-denied-container');
    const mainLayout = document.getElementById('reports-main-layout');

    try {
        if (loadingEl) loadingEl.style.display = 'block';
        if (deniedContainer) deniedContainer.style.display = 'none';
        if (mainLayout) mainLayout.style.display = 'none';

        // Protección de seguridad a nivel de vista
        const rol = window.usuarioRol;
        const esAdminOSuper = rol === 'admin' || rol === 'superadmin' || (window.usuarioEmail && window.usuarioEmail.toLowerCase() === 'freddybr.igle@gmail.com');
        
        if (!esAdminOSuper) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (deniedContainer) deniedContainer.style.display = 'block';
            return;
        }

        // 1. Cargar todos los datos necesarios en paralelo
        const [resGrados, resAlumnos, resAsistencias, resControles, resAsignaciones] = await Promise.all([
            GradoService.getGrados(),
            AlumnoService.getAlumnos(),
            AsistenciaService.getAsistenciasVista(),
            ControlService.getControlesVista(),
            AsignacionService.getAsignacionesDetalles()
        ]);

        if (loadingEl) loadingEl.style.display = 'none';

        if (resGrados.error || resAlumnos.error || resAsistencias.error || resControles.error || resAsignaciones.error) {
            const errorMsg = [
                resGrados.error?.message,
                resAlumnos.error?.message,
                resAsistencias.error?.message,
                resControles.error?.message,
                resAsignaciones.error?.message
            ].filter(Boolean).join(' | ');
            throw new Error(errorMsg || 'Error desconocido al consultar base de datos');
        }

        if (mainLayout) mainLayout.style.display = 'block';

        todosGrados = resGrados.data || [];
        todosAlumnos = resAlumnos.data || [];
        todasAsistencias = resAsistencias.data || [];
        todosControles = resControles.data || [];
        todasAsignaciones = resAsignaciones.data || [];

        // Ordenar alumnos alfabéticamente
        todosAlumnos.sort((a, b) => (a.alumno_nombre || '').localeCompare(b.alumno_nombre || ''));

        // Rellenar selectores
        const selectAlumnoGrado = document.getElementById('rep-alumno-grado');
    if (selectAlumnoGrado) {
        selectAlumnoGrado.innerHTML = '<option value="">-- Seleccionar Grado --</option>' +
            todosGrados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('');
    }

    const selectGradoReporte = document.getElementById('rep-grado-select');
    if (selectGradoReporte) {
        selectGradoReporte.innerHTML = '<option value="">-- Seleccionar Grado --</option>' +
            todosGrados.map(g => `<option value="${g.id}">${g.grado_nombre}</option>`).join('');
    }

    const selectAvanceAsignacion = document.getElementById('rep-avance-asignacion');
    if (selectAvanceAsignacion) {
        selectAvanceAsignacion.innerHTML = '<option value="">-- Seleccionar Asignación Escolar --</option>' +
            todasAsignaciones.filter(asig => asig.asigna_estatus === 'Activa').map(asig => `<option value="${asig.asigna_id}">Asig #${asig.asigna_id} - Materia: ${asig.programa_tema} | Grado: ${asig.grado_numero}</option>`).join('');
    }

    // Configurar fecha de emisión en impresión
    const printDate = document.getElementById('print-emission-date');
    if (printDate) {
        printDate.textContent = new Date().toLocaleDateString('es-ES');
    }

        if (!modalInitialized) {
            configurarListeners();
            modalInitialized = true;
        }
    } catch (err) {
        console.error("Error al cargar módulo de reportes:", err);
        if (loadingEl) loadingEl.style.display = 'none';
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="reports-error-container" style="padding: 40px; text-align: center; color: #dc3545; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); margin: 20px;">
                    <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 10px;">❌ Error al Cargar Reportes</h3>
                    <p style="color: var(--text-light); margin-bottom: 15px;">No se pudieron cargar los datos necesarios para este módulo.</p>
                    <code style="display: block; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px; font-size: 12px; max-width: 600px; margin: 0 auto 15px; word-break: break-all;">${err.message || err}</code>
                    <button onclick="window.location.reload()" class="btn-primary" style="padding: 8px 16px; border-radius: 6px; cursor: pointer;">Reintentar</button>
                </div>
            `;
        }
    }
}

function configurarListeners() {
    // 3. Registrar Eventos de Cambio de Pestañas
    const tabButtons = document.querySelectorAll('.report-tab-btn');
    const tabContents = document.querySelectorAll('.report-tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    const selectAlumnoGrado = document.getElementById('rep-alumno-grado');
    const selectAlumnoSel = document.getElementById('rep-alumno-select');
    const resultAlumnoContainer = document.getElementById('result-alumno-container');
    const emptyAlumnoMsg = document.getElementById('empty-alumno-msg');
    const btnPrintAlumno = document.getElementById('btn-print-alumno');

    // Cambiar la lista de alumnos según el grado seleccionado
    selectAlumnoGrado?.addEventListener('change', () => {
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
    selectAlumnoSel?.addEventListener('change', () => {
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

    const selectGradoReporte = document.getElementById('rep-grado-select');
    const resultGradoContainer = document.getElementById('result-grado-container');
    const emptyGradoMsg = document.getElementById('empty-grado-msg');
    const btnPrintGrado = document.getElementById('btn-print-grado');

    selectGradoReporte?.addEventListener('change', () => {
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

    const selectAvanceAsignacion = document.getElementById('rep-avance-asignacion');
    const resultAvanceContainer = document.getElementById('result-avance-container');
    const emptyAvanceMsg = document.getElementById('empty-avance-msg');
    const btnPrintAvance = document.getElementById('btn-print-avance');

    selectAvanceAsignacion?.addEventListener('change', () => {
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

    const configurarImpresion = (tituloReporte, subtituloReporte) => {
        document.getElementById('print-report-subtitle').innerHTML = `<strong>Reporte:</strong> ${tituloReporte}<br><strong>Filtro:</strong> ${subtituloReporte}`;
    };

    btnPrintAlumno?.addEventListener('click', () => {
        const alumnoNombre = selectAlumnoSel.options[selectAlumnoSel.selectedIndex].text;
        const gradoNombre = selectAlumnoGrado.options[selectAlumnoGrado.selectedIndex].text;
        configurarImpresion('Asistencia Individual de Alumno', `${alumnoNombre} (${gradoNombre})`);
        window.print();
    });

    btnPrintGrado?.addEventListener('click', () => {
        const gradoNombre = selectGradoReporte.options[selectGradoReporte.selectedIndex].text;
        configurarImpresion('Asistencia General del Grado', gradoNombre);
        window.print();
    });

    btnPrintAvance?.addEventListener('click', () => {
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

if (window.layoutReady) {
    cargarVistaReportes();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaReportes();
    });
}
