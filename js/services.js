// js/services.js
import { supabase } from './config.js';

// Helper para peticiones de lectura con caché local transparente
async function cacheRead(cacheKey, apiCall) {
    try {
        const response = await apiCall();
        if (response && !response.error && response.data) {
            localStorage.setItem(cacheKey, JSON.stringify(response.data));
        } else if (response && response.error) {
            console.warn(`Error en API para ${cacheKey}:`, response.error);
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                return { data: JSON.parse(cachedData), error: null };
            }
        }
        return response;
    } catch (err) {
        console.warn(`Excepción de red para ${cacheKey}, cargando caché:`, err);
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            return { data: JSON.parse(cachedData), error: null };
        }
        return { data: null, error: err };
    }
}

// Funciones de la cola de sincronización Offline
export const OfflineQueue = {
    getQueue(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    },
    saveQueue(key, queue) {
        localStorage.setItem(key, JSON.stringify(queue));
    },
    addToQueue(key, item) {
        const queue = this.getQueue(key);
        queue.push(item);
        this.saveQueue(key, queue);
        window.dispatchEvent(new Event('offline-sync-queue-updated'));
    },
    clearQueue(key) {
        localStorage.removeItem(key);
        window.dispatchEvent(new Event('offline-sync-queue-updated'));
    }
};

// Servicio de Autenticación
export const AuthService = {
    async getUser() {
        return await supabase.auth.getUser();
    },
    async signOut() {
        return await supabase.auth.signOut();
    },
    async updatePassword(password) {
        return await supabase.auth.updateUser({ password });
    },
    async updatePasswordOtroUsuario(userEmail, newPassword) {
        return await supabase.rpc('cambiar_password_usuario', {
            user_email: userEmail,
            nueva_contrasena: newPassword
        });
    }
};

// Servicio de Períodos Académicos (Tabla: anio)
export const PeriodoService = {
    async getPeriodos() {
        return await cacheRead('cache_periodos', () => supabase
            .from('anio')
            .select('*')
            .order('id', { ascending: true }));
    },
    async getPeriodo(id) {
        return await supabase
            .from('anio')
            .select('*')
            .eq('id', id)
            .maybeSingle();
    },
    async savePeriodo(id, payload) {
        if (id) {
            return await supabase.from('anio').update(payload).eq('id', id);
        } else {
            return await supabase.from('anio').insert(payload);
        }
    },
    async deletePeriodo(id) {
        return await supabase.from('anio').delete().eq('id', id);
    }
};

// Servicio de Materias (Tabla: materias)
export const MateriaService = {
    async getMaterias() {
        return await cacheRead('cache_materias', () => supabase.from('materias').select('*'));
    },
    async getMateria(id) {
        return await supabase.from('materias').select('*').eq('id', id).maybeSingle();
    },
    async saveMateria(id, payload) {
        if (id) {
            return await supabase.from('materias').update(payload).eq('id', id);
        } else {
            return await supabase.from('materias').insert(payload);
        }
    },
    async deleteMateria(id) {
        return await supabase.from('materias').delete().eq('id', id);
    }
};

// Servicio de Grados (Tabla: grados)
export const GradoService = {
    async getGrados() {
        return await cacheRead('cache_grados', () => supabase.from('grados').select('*'));
    }
};

// Servicio de Programas Académicos (Tabla: programas)
export const ProgramaService = {
    async getProgramas() {
        return await cacheRead('cache_programas', () => supabase.from('programas').select('*'));
    },
    async getProgramasDisponibles() {
        return await cacheRead('cache_programas_disponibles', () => supabase.from('programas').select('*').eq('programa_estatus', 'Disponible'));
    },
    async getPrograma(id) {
        return await supabase.from('programas').select('*').eq('id', id).maybeSingle();
    },
    async savePrograma(id, payload) {
        if (id) {
            return await supabase.from('programas').update(payload).eq('id', id);
        } else {
            return await supabase.from('programas').insert(payload);
        }
    },
    async deletePrograma(id) {
        return await supabase.from('programas').delete().eq('id', id);
    }
};

// Servicio de Clases (Tabla: clases)
export const ClaseService = {
    async getClases() {
        return await cacheRead('cache_clases', () => supabase.from('clases').select('*'));
    },
    async getClasesWithProgramas() {
        return await cacheRead('cache_clases_programas', () => supabase
            .from('clases')
            .select('id, clase_num, clase_tema, clase_objetivo, clase_texto, programas(programa_tema), programa_id'));
    },
    async getClasesTemaYPrograma() {
        return await cacheRead('cache_clases_tema_programa', () => supabase.from('clases').select('id, clase_num, clase_tema, programa_id'));
    }
};

// Servicio de Alumnos (Tabla: alumnos)
export const AlumnoService = {
    async getAlumnos() {
        return await cacheRead('cache_alumnos', () => supabase.from('alumnos').select('*'));
    },
    async getAlumno(id) {
        return await supabase.from('alumnos').select('*').eq('id', id).maybeSingle();
    },
    async getAlumnoImagenByEmail(email) {
        return await supabase.from('alumnos').select('alumno_imagen_url').eq('alumno_email', email).maybeSingle();
    },
    async saveAlumno(id, payload) {
        if (id) {
            return await supabase.from('alumnos').update(payload).eq('id', id);
        } else {
            return await supabase.from('alumnos').insert(payload);
        }
    },
    async getUltimoAlumno() {
        return await supabase
            .from('alumnos')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();
    },
    async updateAlumnoImagen(id, file) {
        try {
            // 1. Obtener el nombre del alumno para seguir la convención del proyecto
            const { data: alumno } = await supabase.from('alumnos').select('alumno_nombre').eq('id', id).maybeSingle();
            const nombreBase = alumno && alumno.alumno_nombre ? alumno.alumno_nombre : 'alumno';
            const nombreNormalizado = nombreBase
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                .replace(/[^a-z0-9\s-_]/g, "")   // Quitar caracteres especiales
                .trim()
                .replace(/\s+/g, '_');           // Reemplazar espacios por guiones bajos

            const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
            const fileName = `${id}_${nombreNormalizado}_alumno.${fileExt}`;

            // 2. Subir el archivo (con upsert: true para sobreescribir si ya existe la misma extensión)
            const { error: uploadError } = await supabase.storage
                .from('fotos-alumnos')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type
                });
            if (uploadError) return { error: uploadError };

            // 3. Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('fotos-alumnos')
                .getPublicUrl(fileName);

            return await supabase.from('alumnos').update({ alumno_imagen_url: publicUrl }).eq('id', id);
        } catch (err) {
            return { error: err };
        }
    },
    async deleteAlumno(id) {
        return await supabase.from('alumnos').delete().eq('id', id);
    }
};

// Servicio de Profesores (Tabla: profesores)
export const ProfesorService = {
    async getProfesores() {
        return await cacheRead('cache_profesores', () => supabase.from('profesores').select('*'));
    },
    async getProfesor(id) {
        return await supabase.from('profesores').select('*').eq('id', id).maybeSingle();
    },
    async getProfesorImagenByEmail(email) {
        return await supabase.from('profesores').select('profe_imagen_url').eq('profe_email', email).maybeSingle();
    },
    async getProfesorByEmail(email) {
        return await supabase.from('profesores').select('*').eq('profe_email', email).maybeSingle();
    },
    async getProfesoresParaControl() {
        return await cacheRead('cache_profesores_control', () => supabase.from('profesores').select('id, profe_nombre, profe_imagen_url, grado_id'));
    },
    async saveProfesor(id, payload) {
        if (id) {
            return await supabase.from('profesores').update(payload).eq('id', id);
        } else {
            return await supabase.from('profesores').insert(payload);
        }
    },
    async getUltimoProfesor() {
        return await supabase
            .from('profesores')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();
    },
    async updateProfesorImagen(id, file) {
        try {
            // 1. Obtener el nombre del profesor para mantener la convención del proyecto
            const { data: profe } = await supabase.from('profesores').select('profe_nombre').eq('id', id).maybeSingle();
            const nombreBase = profe && profe.profe_nombre ? profe.profe_nombre : 'profesor';
            const nombreNormalizado = nombreBase
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                .replace(/[^a-z0-9\s-_]/g, "")   // Quitar caracteres especiales
                .trim()
                .replace(/\s+/g, '_');           // Reemplazar espacios por guiones bajos

            const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
            const fileName = `${id}_${nombreNormalizado}_profesor.${fileExt}`;

            // 2. Subir al bucket
            const { error: uploadError } = await supabase.storage
                .from('fotos-profesores')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type
                });
            if (uploadError) return { error: uploadError };

            // 3. Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('fotos-profesores')
                .getPublicUrl(fileName);

            return await supabase.from('profesores').update({ profe_imagen_url: publicUrl }).eq('id', id);
        } catch (err) {
            return { error: err };
        }
    },
    async deleteProfesor(id) {
        return await supabase.from('profesores').delete().eq('id', id);
    }
};

// Servicio de Asignaciones (Tabla: asignaciones, Vista: vista_asignaciones_detalles)
export const AsignacionService = {
    async getAsignaciones() {
        return await cacheRead('cache_asignaciones', () => supabase.from('asignaciones').select('*'));
    },
    async getAsignacionesActivas() {
        return await cacheRead('cache_asignaciones_activas', () => supabase.from('asignaciones').select('*').eq('asigna_estatus', 'Activa'));
    },
    async getAsignacion(id) {
        return await supabase.from('asignaciones').select('*').eq('id', id).maybeSingle();
    },
    async getAsignacionesDetalles() {
        return await cacheRead('cache_asignaciones_detalles', () => supabase.from('vista_asignaciones_detalles').select('*'));
    },
    async saveAsignacion(id, payload) {
        if (id) {
            return await supabase.from('asignaciones').update(payload).eq('id', id);
        } else {
            return await supabase.from('asignaciones').insert(payload);
        }
    },
    async deleteAsignacion(id) {
        return await supabase.from('asignaciones').delete().eq('id', id);
    }
};

// Servicio de Controles (Tabla: control, Vista: vista_control)
export const ControlService = {
    async getControles() {
        return await cacheRead('cache_controles_raw', () => supabase.from('control').select('*'));
    },
    async getControlesVista() {
        return await cacheRead('cache_controles', () => supabase.from('vista_control').select('*'));
    },
    async getControl(id) {
        return await supabase.from('control').select('*').eq('id', id).maybeSingle();
    },
    async getControlConAsignacion(id) {
        return await supabase
            .from('control')
            .select('*, asignaciones(grado_id)')
            .eq('id', id)
            .maybeSingle();
    },
    async saveControl(id, payload) {
        if (!navigator.onLine) {
            const isEdit = !!id;
            const recordId = id || 'temp-' + Date.now();
            const queueItem = {
                type: isEdit ? 'UPDATE' : 'INSERT',
                table: 'control',
                id: recordId,
                payload: payload
            };
            OfflineQueue.addToQueue('cola_control', queueItem);

            const cached = JSON.parse(localStorage.getItem('cache_controles') || '[]');
            if (isEdit) {
                const idx = cached.findIndex(c => String(c.control_id) === String(id));
                if (idx !== -1) cached[idx] = { ...cached[idx], ...payload };
            } else {
                const newRecord = {
                    control_id: recordId,
                    asigna_id: payload.asigna_id,
                    clase_id: payload.clase_id,
                    profe_id: payload.profe_id,
                    control_fecha: payload.control_fecha,
                    control_observ: payload.control_observ,
                    control_estatus: payload.control_estatus,
                    clase_num: payload.clase_num || '',
                    clase_tema: payload.clase_tema || 'Clase Offline',
                    programa_tema: payload.programa_tema || 'Programa Offline',
                    grado_numero: payload.grado_numero || 'Grado Offline',
                    profe_nombre: 'Mi Profesor'
                };
                cached.push(newRecord);
            }
            localStorage.setItem('cache_controles', JSON.stringify(cached));

            return { data: { id: recordId }, error: null };
        }

        const res = id 
            ? await supabase.from('control').update(payload).eq('id', id).select().single()
            : await supabase.from('control').insert(payload).select().single();
            
        if (!res.error && res.data) {
            // Actualizar la caché local también en modo conectado
            const cached = JSON.parse(localStorage.getItem('cache_controles') || '[]');
            const newObj = res.data;
            if (id) {
                const idx = cached.findIndex(c => String(c.control_id) === String(id));
                if (idx !== -1) cached[idx] = { ...cached[idx], ...newObj };
            } else {
                cached.push(newObj);
            }
            localStorage.setItem('cache_controles', JSON.stringify(cached));
        }
        return res;
    },
    async deleteControl(id) {
        return await supabase.from('control').delete().eq('id', id);
    }
};

// Servicio de Asistencias (Tabla: asistencias, Vista: vista_asistencias)
export const AsistenciaService = {
    async getAsistencias() {
        return await cacheRead('cache_asistencias_raw', () => supabase.from('asistencias').select('*'));
    },
    async getAsistenciasVista() {
        return await cacheRead('cache_asistencias', () => supabase.from('vista_asistencias').select('*'));
    },
    async getAsistencia(id) {
        return await supabase.from('asistencias').select('*').eq('id', id).maybeSingle();
    },
    async checkAsistenciaExistente(alumnoId, controlId) {
        // En modo offline, verificar si ya existe en la caché local
        if (!navigator.onLine) {
            const cached = JSON.parse(localStorage.getItem('cache_asistencias') || '[]');
            const match = cached.find(a => String(a.alumno_id || '') === String(alumnoId) && String(a.control_id || '') === String(controlId));
            if (match) return { data: { id: match.asistencia_id }, error: null };
            return { data: null, error: null };
        }
        return await supabase
            .from('asistencias')
            .select('id')
            .eq('alumno_id', alumnoId)
            .eq('control_id', controlId)
            .maybeSingle();
    },
    async checkAsistenciaExistenteEditar(alumnoId, controlId, skipId) {
        if (!navigator.onLine) {
            const cached = JSON.parse(localStorage.getItem('cache_asistencias') || '[]');
            const match = cached.find(a => String(a.alumno_id || '') === String(alumnoId) && String(a.control_id || '') === String(controlId) && String(a.asistencia_id || '') !== String(skipId));
            if (match) return { data: { id: match.asistencia_id }, error: null };
            return { data: null, error: null };
        }
        return await supabase
            .from('asistencias')
            .select('id')
            .eq('alumno_id', alumnoId)
            .eq('control_id', controlId)
            .neq('id', skipId)
            .maybeSingle();
    },
    async getAlumnosProcesados(controlId) {
        if (!navigator.onLine) {
            const cached = JSON.parse(localStorage.getItem('cache_asistencias') || '[]');
            const matches = cached.filter(a => String(a.control_id || '') === String(controlId));
            return { data: matches.map(m => ({ alumno_id: m.alumno_id })), error: null };
        }
        return await supabase
            .from('asistencias')
            .select('alumno_id')
            .eq('control_id', controlId);
    },
    async saveAsistencia(id, payload) {
        if (!navigator.onLine) {
            const isEdit = !!id;
            const recordId = id || 'temp-' + Date.now();
            const queueItem = {
                type: isEdit ? 'UPDATE' : 'INSERT',
                table: 'asistencias',
                id: recordId,
                payload: payload
            };
            OfflineQueue.addToQueue('cola_asistencias', queueItem);

            const cached = JSON.parse(localStorage.getItem('cache_asistencias') || '[]');
            if (isEdit) {
                const idx = cached.findIndex(a => String(a.asistencia_id) === String(id));
                if (idx !== -1) cached[idx] = { ...cached[idx], ...payload };
            } else {
                const newRecord = {
                    asistencia_id: recordId,
                    alumno_id: payload.alumno_id,
                    control_id: payload.control_id,
                    fecha: payload.fecha || new Date().toISOString().split('T')[0],
                    alumno: payload.alumno || 'Alumno Offline',
                    profesor: payload.profesor || 'Docente Offline',
                    programa: payload.programa || 'Programa Offline',
                    clase: payload.clase || 'Clase Offline',
                    grado: payload.grado || 'Grado Offline',
                    presente: payload.presente,
                    evaluacion: payload.evaluacion,
                    observaciones: payload.observaciones
                };
                cached.push(newRecord);
            }
            localStorage.setItem('cache_asistencias', JSON.stringify(cached));

            return { data: { id: recordId }, error: null };
        }

        const res = id 
            ? await supabase.from('asistencias').update(payload).eq('id', id).select().single()
            : await supabase.from('asistencias').insert(payload).select().single();
            
        if (!res.error && res.data) {
            // Actualizar la caché local también en modo conectado
            const cached = JSON.parse(localStorage.getItem('cache_asistencias') || '[]');
            const newObj = res.data;
            if (id) {
                const idx = cached.findIndex(a => String(a.asistencia_id) === String(id));
                if (idx !== -1) cached[idx] = { ...cached[idx], ...newObj };
            } else {
                cached.push(newObj);
            }
            localStorage.setItem('cache_asistencias', JSON.stringify(cached));
        }
        return res;
    },
    async deleteAsistencia(id) {
        return await supabase.from('asistencias').delete().eq('id', id);
    }
};

// Función para sincronizar la cola offline con Supabase cuando vuelve el internet
export async function syncOfflineData() {
    if (!navigator.onLine) return;

    console.log('[Offline Sync] Iniciando sincronización de datos en segundo plano...');

    // 1. Sincronizar cola de controles (Ejecución de Clases)
    const colaControl = OfflineQueue.getQueue('cola_control');
    const mapeoIdsControl = {}; // Mapear IDs temporales a IDs reales

    if (colaControl.length > 0) {
        for (const item of colaControl) {
            const payload = { ...item.payload };
            // Quitar campos virtuales que no pertenecen a la tabla base 'control'
            delete payload.clase_num;
            delete payload.clase_tema;
            delete payload.programa_tema;
            delete payload.grado_numero;
            delete payload.profe_nombre;

            if (item.type === 'INSERT') {
                const res = await supabase.from('control').insert(payload).select().single();
                if (!res.error && res.data) {
                    mapeoIdsControl[item.id] = res.data.id;
                    console.log(`[Offline Sync] Clase insertada. Temporal ${item.id} -> Real ${res.data.id}`);
                } else {
                    console.error('[Offline Sync] Error al insertar clase offline:', res.error);
                }
            } else if (item.type === 'UPDATE') {
                const realId = mapeoIdsControl[item.id] || item.id;
                const res = await supabase.from('control').update(payload).eq('id', realId);
                if (!res.error) {
                    console.log(`[Offline Sync] Clase actualizada. ID: ${realId}`);
                } else {
                    console.error('[Offline Sync] Error al actualizar clase offline:', res.error);
                }
            }
        }
        OfflineQueue.clearQueue('cola_control');
    }

    // 2. Sincronizar cola de asistencias
    const colaAsistencias = OfflineQueue.getQueue('cola_asistencias');
    if (colaAsistencias.length > 0) {
        for (const item of colaAsistencias) {
            const payload = { ...item.payload };
            // Quitar campos virtuales
            delete payload.fecha;
            delete payload.alumno;
            delete payload.profesor;
            delete payload.programa;
            delete payload.clase;
            delete payload.grado;

            // Reemplazar control_id temporal por el real si fue generado en este ciclo
            if (String(payload.control_id).startsWith('temp-')) {
                payload.control_id = mapeoIdsControl[payload.control_id] || payload.control_id;
            }

            if (item.type === 'INSERT') {
                const res = await supabase.from('asistencias').insert(payload);
                if (!res.error) {
                    console.log('[Offline Sync] Asistencia insertada.');
                } else {
                    console.error('[Offline Sync] Error al insertar asistencia offline:', res.error);
                }
            } else if (item.type === 'UPDATE') {
                const realId = item.id;
                const res = await supabase.from('asistencias').update(payload).eq('id', realId);
                if (!res.error) {
                    console.log(`[Offline Sync] Asistencia actualizada. ID: ${realId}`);
                } else {
                    console.error('[Offline Sync] Error al actualizar asistencia offline:', res.error);
                }
            }
        }
        OfflineQueue.clearQueue('cola_asistencias');
    }

    // 3. Forzar refresco de las cachés de lectura locales desde el servidor
    console.log('[Offline Sync] Refrescando cachés locales desde el servidor...');
    try {
        await Promise.all([
            supabase.from('grados').select('*').then(res => res.data && localStorage.setItem('cache_grados', JSON.stringify(res.data))),
            supabase.from('alumnos').select('*').then(res => res.data && localStorage.setItem('cache_alumnos', JSON.stringify(res.data))),
            supabase.from('vista_control').select('*').then(res => res.data && localStorage.setItem('cache_controles', JSON.stringify(res.data))),
            supabase.from('vista_asistencias').select('*').then(res => res.data && localStorage.setItem('cache_asistencias', JSON.stringify(res.data))),
            supabase.from('vista_asignaciones_detalles').select('*').then(res => res.data && localStorage.setItem('cache_asignaciones_detalles', JSON.stringify(res.data)))
        ]);
        console.log('[Offline Sync] Sincronización de cachés completada.');
        window.dispatchEvent(new Event('offline-sync-completed'));
    } catch (e) {
        console.warn('[Offline Sync] Error al refrescar cachés:', e);
    }
}
