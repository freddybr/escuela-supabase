// src/services/services.js
import { supabase } from './supabase.js';

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
    async getPeriodoVigente() {
        const res = await PeriodoService.getPeriodos();
        if (res.error) return res;
        const list = res.data || [];
        const vigente = list.find(p => p && (p.anio_vigente === true || p.anio_vigente === 'true')) || list[list.length - 1] || null;
        return { data: vigente, error: null };
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
            .select('id, clase_num, clase_tema, clase_objetivo, clase_texto, programas(programa_tema), programa_id');
    },
    async getClasesTemaYPrograma() {
        return await supabase.from('clases').select('id, clase_num, clase_tema, programa_id');
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
        return await supabase.from('profesores').select('*');
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
        return id 
            ? await supabase.from('control').update(payload).eq('id', id).select().single()
            : await supabase.from('control').insert(payload).select().single();
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
        return id 
            ? await supabase.from('asistencias').update(payload).eq('id', id).select().single()
            : await supabase.from('asistencias').insert(payload).select().single();
    },
    async deleteAsistencia(id) {
        return await supabase.from('asistencias').delete().eq('id', id);
    }
};
