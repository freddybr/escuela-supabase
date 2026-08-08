// js/services.js
import { supabase } from './config.js';

// Servicio de Autenticación
export const AuthService = {
    async getUser() {
        return await supabase.auth.getUser();
    },
    async signOut() {
        return await supabase.auth.signOut();
    }
};

// Servicio de Períodos Académicos (Tabla: anio)
export const PeriodoService = {
    async getPeriodos() {
        return await supabase
            .from('anio')
            .select('*')
            .order('id', { ascending: true });
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
        return await supabase.from('materias').select('*');
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
        return await supabase.from('grados').select('*');
    }
};

// Servicio de Programas Académicos (Tabla: programas)
export const ProgramaService = {
    async getProgramas() {
        return await supabase.from('programas').select('*');
    },
    async getProgramasDisponibles() {
        return await supabase.from('programas').select('*').eq('programa_estatus', 'Disponible');
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
        return await supabase.from('clases').select('*');
    },
    async getClasesWithProgramas() {
        return await supabase
            .from('clases')
            .select('id, clase_num, clase_tema, clase_objetivo, programas(programa_tema), programa_id');
    },
    async getClasesTemaYPrograma() {
        return await supabase.from('clases').select('id, clase_tema, programa_id');
    }
};

// Servicio de Alumnos (Tabla: alumnos)
export const AlumnoService = {
    async getAlumnos() {
        return await supabase.from('alumnos').select('*');
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
    async updateAlumnoImagen(id, base64Url) {
        return await supabase.from('alumnos').update({ alumno_imagen_url: base64Url }).eq('id', id);
    },
    async deleteAlumno(id) {
        return await supabase.from('alumnos').delete().eq('id', id);
    }
};

// Servicio de Profesores (Tabla: profesores)
export const ProfesorService = {
    async getProfesores() {
        return await supabase.from('profesores').select('*');
    },
    async getProfesor(id) {
        return await supabase.from('profesores').select('*').eq('id', id).maybeSingle();
    },
    async getProfesorImagenByEmail(email) {
        return await supabase.from('profesores').select('profe_imagen_url').eq('profe_email', email).maybeSingle();
    },
    async getProfesoresParaControl() {
        return await supabase.from('profesores').select('id, profe_nombre, profe_imagen_url, grado_id');
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
    async updateProfesorImagen(id, base64Url) {
        return await supabase.from('profesores').update({ profe_imagen_url: base64Url }).eq('id', id);
    },
    async deleteProfesor(id) {
        return await supabase.from('profesores').delete().eq('id', id);
    }
};

// Servicio de Asignaciones (Tabla: asignaciones, Vista: vista_asignaciones_detalles)
export const AsignacionService = {
    async getAsignaciones() {
        return await supabase.from('asignaciones').select('*');
    },
    async getAsignacionesActivas() {
        return await supabase.from('asignaciones').select('*').eq('asigna_estatus', 'Activa');
    },
    async getAsignacion(id) {
        return await supabase.from('asignaciones').select('*').eq('id', id).maybeSingle();
    },
    async getAsignacionesDetalles() {
        return await supabase.from('vista_asignaciones_detalles').select('*');
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
        return await supabase.from('control').select('*');
    },
    async getControlesVista() {
        return await supabase.from('vista_control').select('*');
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
        if (id) {
            return await supabase.from('control').update(payload).eq('id', id);
        } else {
            return await supabase.from('control').insert(payload);
        }
    },
    async deleteControl(id) {
        return await supabase.from('control').delete().eq('id', id);
    }
};

// Servicio de Asistencias (Tabla: asistencias, Vista: vista_asistencias)
export const AsistenciaService = {
    async getAsistencias() {
        return await supabase.from('asistencias').select('*');
    },
    async getAsistenciasVista() {
        return await supabase.from('vista_asistencias').select('*');
    },
    async getAsistencia(id) {
        return await supabase.from('asistencias').select('*').eq('id', id).maybeSingle();
    },
    async checkAsistenciaExistente(alumnoId, controlId) {
        return await supabase
            .from('asistencias')
            .select('id')
            .eq('alumno_id', alumnoId)
            .eq('control_id', controlId)
            .maybeSingle();
    },
    async checkAsistenciaExistenteEditar(alumnoId, controlId, skipId) {
        return await supabase
            .from('asistencias')
            .select('id')
            .eq('alumno_id', alumnoId)
            .eq('control_id', controlId)
            .neq('id', skipId)
            .maybeSingle();
    },
    async getAlumnosProcesados(controlId) {
        return await supabase
            .from('asistencias')
            .select('alumno_id')
            .eq('control_id', controlId);
    },
    async saveAsistencia(id, payload) {
        if (id) {
            return await supabase.from('asistencias').update(payload).eq('id', id);
        } else {
            return await supabase.from('asistencias').insert(payload);
        }
    },
    async deleteAsistencia(id) {
        return await supabase.from('asistencias').delete().eq('id', id);
    }
};
