# Modelo de Datos

## Base de datos

Motor:

PostgreSQL

Plataforma:

Supabase

---

# Tablas principales

## alumnos

Información básica de estudiantes.

---

## profesores

Información del personal docente.

---

## grados

Representa niveles o cursos académicos.

---

## materias

Catálogo de materias.

CRUD actualmente implementado.

---

## programas

Representa programas académicos.

CRUD actualmente implementado.

---

## clases

Representa clases impartidas.

Relaciona:

- profesores
- materias
- grados

---

## asignaciones

Relaciona docentes, materias y clases.

Actualmente posee lógica asociada mediante triggers.

---

## asistencias

Registra asistencia de alumnos.

Tiene validaciones mediante funciones y triggers.

---

## control

Registro generado para seguimiento académico.

---

## anio

Control del año académico.

---

# Vistas existentes

## vista_asignaciones

Vista utilizada para facilitar consultas relacionadas con asignaciones.

---

## vista_asistencias

Vista utilizada para alimentar consultas del frontend.

---

## vista_control

Vista utilizada para mostrar información consolidada de control académico.

---

# Funciones existentes

## generar_control_por_asignacion()

Genera registros de control automáticamente después de una asignación.

---

## programa_tema()

Función auxiliar relacionada con programas.

---

## validar_asistencia_control_vista()

Valida consistencia antes de registrar asistencia.

---

## validar_asistencia_unica_clase()

Evita registros duplicados de asistencia.

---

## validar_grado_alumno_asistencia()

Valida relación entre alumno, grado y asistencia.

---

# Triggers existentes

- trg_validar_asistencia
- trg_validar_asistencia_control
- trg_validar_grado_asistencia
- trigger_generar_control

---

# Enums existentes

## programa_estatus

Valores:

- Disponible
- Elaborando

---

## sexo

Valores:

- Masculino
- Femenino

---

## asigna_estatus

Valores:

- Activa
- Pendiente
- Terminada

---

## control_estatus

Valores:

- Vista
- Programada
- Pendiente
- -

---

## evaluacion_enum

Valores:

- Deficiente
- Bueno
- Excelente