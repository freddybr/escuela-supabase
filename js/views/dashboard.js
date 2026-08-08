import { renderHeaderSeccion } from '../ui.js';
import { AlumnoService, ProfesorService, ClaseService, ControlService } from '../services.js';

export async function cargarVistaDashboard(container) {
    container.innerHTML = `
        ${renderHeaderSeccion('dashboard', 'Panel General', 'Resumen general del sistema de asistencias.')}
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-top: 20px;">
            <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155;">
                <h4 style="margin: 0; color: #94a3b8;">Total Alumnos</h4>
                <p id="dash-total-alumnos" style="font-size: 2rem; margin: 10px 0 0 0; color: #fff; font-weight: bold;">Cargando...</p>
            </div>
            <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155;">
                <h4 style="margin: 0; color: #94a3b8;">Total Profesores</h4>
                <p id="dash-total-profesores" style="font-size: 2rem; margin: 10px 0 0 0; color: #fff; font-weight: bold;">Cargando...</p>
            </div>
            <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155;">
                <h4 style="margin: 0; color: #94a3b8;">Clases Registradas</h4>
                <p id="dash-total-clases" style="font-size: 2rem; margin: 10px 0 0 0; color: #fff; font-weight: bold;">Cargando...</p>
            </div>
            <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155;">
                <h4 style="margin: 0; color: #94a3b8;">Controles Realizados</h4>
                <p id="dash-total-controles" style="font-size: 2rem; margin: 10px 0 0 0; color: #fff; font-weight: bold;">Cargando...</p>
            </div>
        </div>
    `;

    try {
        const [resAlumnos, resProfesores, resClases, resControles] = await Promise.all([
            AlumnoService.getAlumnos(),
            ProfesorService.getProfesores(),
            ClaseService.getClases(),
            ControlService.getControles()
        ]);

        const elAlumnos = document.getElementById('dash-total-alumnos');
        if (elAlumnos) elAlumnos.textContent = resAlumnos.data?.length ?? 0;

        const elProfesores = document.getElementById('dash-total-profesores');
        if (elProfesores) elProfesores.textContent = resProfesores.data?.length ?? 0;

        const elClases = document.getElementById('dash-total-clases');
        if (elClases) elClases.textContent = resClases.data?.length ?? 0;

        const elControles = document.getElementById('dash-total-controles');
        if (elControles) elControles.textContent = resControles.data?.length ?? 0;
    } catch (err) {
        console.error('Error al cargar contadores del dashboard:', err);
        ['dash-total-alumnos', 'dash-total-profesores', 'dash-total-clases', 'dash-total-controles'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = 'Error';
        });
    }
}
