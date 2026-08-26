import { mostrarMensaje } from '../ui.js';
import { ControlService, ProfesorService, AsignacionService } from '../services.js';

let todosProfesores = [];
let modalInitialized = false;

const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fechaStr;
};

export async function cargarVistaControl(filtrosPrevios = null) {
    const tableBody = document.getElementById('tabla-control-body');
    const selectFilterAsignacion = document.getElementById('filter-asignacion');
    const selectFilterEstatus = document.getElementById('filter-estatus');

    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" class="loading">Consultando Ejecución de Clases...</td></tr>';
    }

    const [resVista, resProfesores, resAsignaciones] = await Promise.all([
        ControlService.getControlesVista(),
        ProfesorService.getProfesoresParaControl(),
        AsignacionService.getAsignacionesDetalles()
    ]);

    if (resVista.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" class="error-msg">❌ Error: ${resVista.error.message}</td></tr>`;
        }
        return;
    }

    if (resProfesores.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" class="error-msg">❌ Error al cargar profesores: ${resProfesores.error.message}</td></tr>`;
        }
        return;
    }

    if (resAsignaciones.error) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" class="error-msg">❌ Error al cargar asignaciones: ${resAsignaciones.error.message}</td></tr>`;
        }
        return;
    }

    todosProfesores = resProfesores.data || [];
    const vista_control = resVista.data || [];
    const listaAsignaciones = resAsignaciones.data || [];

    const mapaFotosProfesores = new Map();
    todosProfesores.forEach(p => {
        mapaFotosProfesores.set(p.id, p.profe_imagen_url);
    });

    // Rellenar select de asignación
    if (selectFilterAsignacion) {
        selectFilterAsignacion.innerHTML = '<option value="">Asignaciones</option>' +
            listaAsignaciones.filter(asig => asig.asigna_estatus === 'Activa').map(asig => `<option value="${asig.asigna_id}">#${asig.asigna_id} - Prog: ${asig.programa_tema} | Grado: ${asig.grado_numero}</option>`).join('');
    }

    // Rellenar select de estatus
    const estatusUnicos = [...new Set(vista_control.map(n => n.control_estatus).filter(Boolean))].sort();
    if (selectFilterEstatus) {
        selectFilterEstatus.innerHTML = '<option value="">Estatus</option>' +
            estatusUnicos.map(e => `<option value="${e}">${e}</option>`).join('');
    }

    // Rellenar la tabla
    if (tableBody) {
        if (vista_control.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay registros de ejecución de clases.</td></tr>';
        } else {
            const sortedControl = [...vista_control].sort((a, b) => {
                const gradoA = parseInt(a.grado_numero, 10) || 0;
                const gradoB = parseInt(b.grado_numero, 10) || 0;
                if (gradoA !== gradoB) return gradoA - gradoB;
                return (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0);
            });

            tableBody.innerHTML = sortedControl.map(n => {
                const urlImagenBase = mapaFotosProfesores.get(n.profe_id);
                const fotoUrl = urlImagenBase && urlImagenBase.trim() !== ''
                    ? urlImagenBase
                    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n.profe_nombre || 'Profe')}&backgroundColor=4f46e5`;

                return `
                <tr 
                    data-id="${n.control_id}"
                    data-asigna-id="${n.asigna_id || ''}"
                    data-fecha="${n.control_fecha || ''}" 
                    data-grado="${n.grado_numero || ''}"
                    data-programa="${n.programa_id || ''}" 
                    data-clase-num="${n.clase_num || ''}"
                    data-clase-tema="${n.clase_tema || ''}" 
                    data-profesor="${n.profe_nombre || ''}" 
                    data-estatus="${n.control_estatus || ''}"
                    class="fila-control"
                    style="cursor: pointer;"
                >
                    <td data-label="Estatus">
                        <span class="badge" style="background-color: ${n.control_estatus === 'Pendiente' ? '#ffc107' : n.control_estatus === 'Programada' ? '#198754' : n.control_estatus === 'Vista' ? '#dc3545' : '#6c757d'}; color: ${n.control_estatus === 'Pendiente' ? '#000000' : '#ffffff'};">
                            ${n.control_estatus || 'Pendiente'}
                        </span>
                    </td>    
                    <td data-label="Fecha"><strong>${formatearFecha(n.control_fecha) || 'Sin fecha'}</strong></td>
                    <td data-label="# Clase"><span class="text-light">${n.clase_num ?? ''}</span></td>
                    <td data-label="Clase"><span class="text-light">${n.clase_tema ?? ''}</span></td>
                    <td data-label="Foto" style="text-align: center;">
                        <img src="${fotoUrl}" alt="${n.profe_nombre || 'Profesor'}" class="tabla-avatar" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Profe&backgroundColor=4f46e5'">
                    </td>
                    <td data-label="Profesor"><span class="text-light">${n.profe_nombre || 'Sin asignar'}</span></td>
                    <td data-label="Observaciones"><span class="text-light">${n.control_observaciones || ''}</span></td>                            
                </tr>
                `;
            }).join('');
        }
    }

    if (!modalInitialized) {
        configurarListeners();
        modalInitialized = true;
    }

    const inputSearch = document.getElementById('filter-search');
    const selectAsignacion = document.getElementById('filter-asignacion');
    const selectEstatus = document.getElementById('filter-estatus');

    const aplicarFiltrosControl = () => {
        const textoBusqueda = (inputSearch?.value || '').toLowerCase();
        const asignaSel = selectAsignacion?.value || '';
        const estatusSel = selectEstatus?.value || '';

        const tituloHeader = document.getElementById('titulo-control-header');
        if (tituloHeader) {
            if (asignaSel && selectAsignacion.selectedIndex > 0) {
                const nombreAsignacion = selectAsignacion.options[selectAsignacion.selectedIndex].text;
                tituloHeader.textContent = `Ejecución - ${nombreAsignacion}`;
            } else {
                tituloHeader.textContent = 'Ejecución';
            }
        }

        const filas = document.querySelectorAll('#tabla-control tbody tr');
        
        let countTotal = 0;
        filas.forEach(row => {
            const asignaId = row.getAttribute('data-asigna-id');
            if (!asignaSel || asignaId === asignaSel) {
                countTotal++;
            }
        });

        let countVisible = 0;

        filas.forEach(row => {
            const fechaVal = row.getAttribute('data-fecha') || '';
            const clase = (row.getAttribute('data-clase-tema') || '').toLowerCase();
            const profesor = (row.getAttribute('data-profesor') || '').toLowerCase();
            const asignaId = row.getAttribute('data-asigna-id');
            const estatus = row.getAttribute('data-estatus');

            const fechaFormateada = formatearFecha(fechaVal).toLowerCase();
            const fechaOriginal = fechaVal.toLowerCase();

            const coincideTexto = !textoBusqueda || 
                                  fechaFormateada.includes(textoBusqueda) || 
                                  fechaOriginal.includes(textoBusqueda) || 
                                  clase.includes(textoBusqueda) || 
                                  profesor.includes(textoBusqueda);
            const coincideAsignacion = !asignaSel || asignaId === asignaSel;
            const coincideEstatus = !estatusSel || estatus === estatusSel;

            if (coincideTexto && coincideAsignacion && coincideEstatus) {
                row.style.removeProperty('display');
                countVisible++;
            } else {
                row.style.setProperty('display', 'none', 'important');
            }
        });

        const contadorElemento = document.getElementById('control-contador-texto');
        if (contadorElemento) {
            if (countVisible === countTotal) {
                contadorElemento.textContent = `${countTotal} clases`;
            } else {
                contadorElemento.textContent = `${countVisible} de ${countTotal} clases`;
            }
        }
    };

    inputSearch?.addEventListener('input', aplicarFiltrosControl);
    selectAsignacion?.addEventListener('change', aplicarFiltrosControl);
    selectEstatus?.addEventListener('change', aplicarFiltrosControl);

    // Inicializar el contador
    aplicarFiltrosControl();

    if (filtrosPrevios) {
        if (inputSearch) inputSearch.value = filtrosPrevios.texto;
        if (selectAsignacion) selectAsignacion.value = filtrosPrevios.asignacion;
        if (selectEstatus) selectEstatus.value = filtrosPrevios.estatus;
        
        aplicarFiltrosControl();
    }

    // Configurar clics de las filas
    document.querySelectorAll('.fila-control').forEach(row => {
        row.addEventListener('click', async () => {
            const controlId = row.getAttribute('data-id');
            const claseNum = row.getAttribute('data-clase-num') || '';
            const claseTema = row.getAttribute('data-clase-tema') || '';

            const { data: regControl, error: errControl } = await ControlService.getControlConAsignacion(controlId);

            if (errControl || !regControl) {
                mostrarMensaje('error', 'Error al obtener datos del registro.');
                return;
            }

            const gradoIdClase = regControl.asignaciones ? regControl.asignaciones.grado_id : null;
            const profesoresDelGrado = todosProfesores.filter(p => p.grado_id === gradoIdClase);

            abrirModalControl(regControl, profesoresDelGrado, claseNum, claseTema);
        });
    });
}

function configurarListeners() {
    document.getElementById('modal-control-close')?.addEventListener('click', () => cerrarModalControl());
    document.getElementById('btn-guardar-control')?.addEventListener('click', guardarControl);
    document.getElementById('btn-cancelar-control')?.addEventListener('click', (e) => { e.preventDefault(); cerrarModalControl(); });
}

function obtenerEstadoFiltros() {
    return {
        texto: document.getElementById('filter-search')?.value || '',
        asignacion: document.getElementById('filter-asignacion')?.value || '',
        estatus: document.getElementById('filter-estatus')?.value || ''
    };
}

function abrirModalControl(registro, profesoresDisponibles, claseNum = '', claseTema = '') {
    const modal = document.getElementById('modal-control');
    const titulo = document.getElementById('modal-control-title');
    const inputId = document.getElementById('control-id');
    const inpFecha = document.getElementById('control-fecha');
    const selProfe = document.getElementById('control-profe');
    const txtObserv = document.getElementById('control-observ');
    const selEstatus = document.getElementById('control-estatus');

    if (!modal || !titulo || !inputId || !inpFecha || !selProfe || !txtObserv || !selEstatus) return;

    const infoClase = claseNum ? `Clase #${claseNum}: ` : '';
    titulo.textContent = `${infoClase}${claseTema || 'Editar Clase'}`;

    inputId.value = registro.id;
    inpFecha.value = registro.control_fecha || '';
    txtObserv.value = registro.control_observ || '';
    selEstatus.value = registro.control_estatus || 'Pendiente';

    if (profesoresDisponibles && profesoresDisponibles.length > 0) {
        selProfe.innerHTML = '<option value="">-- Seleccionar Profesor --</option>' +
            profesoresDisponibles.map(p => `<option value="${p.id}">${p.profe_nombre}</option>`).join('');
    } else {
        selProfe.innerHTML = '<option value="">-- No hay profesores registrados para este grado --</option>';
    }

    selProfe.value = registro.profe_id || '';
    modal.style.display = 'flex';
}

function cerrarModalControl() {
    const modal = document.getElementById('modal-control');
    if (modal) modal.style.display = 'none';
}

async function guardarControl(e) {
    e.preventDefault();

    const id = document.getElementById('control-id').value;
    const control_fecha = document.getElementById('control-fecha').value || null;
    const profe_id_val = document.getElementById('control-profe').value;
    const control_observ = document.getElementById('control-observ').value.trim();
    const control_estatus = document.getElementById('control-estatus').value;

    if (!id) return;

    const filtrosActuales = obtenerEstadoFiltros();

    const payload = {
        control_fecha: control_fecha,
        profe_id: profe_id_val ? parseInt(profe_id_val, 10) : null,
        control_observ: control_observ || null,
        control_estatus: control_estatus
    };

    const { error } = await ControlService.saveControl(id, payload);

    if (error) {
        mostrarMensaje('error', 'Error al actualizar el registro: ' + error.message);
        return;
    }

    mostrarMensaje('success', 'Registro de ejecución actualizado correctamente');
    cerrarModalControl();

    cargarVistaControl(filtrosActuales);
}

if (window.layoutReady) {
    cargarVistaControl();
} else {
    window.addEventListener('layout-ready', () => {
        cargarVistaControl();
    });
}
