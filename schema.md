## Table `grados`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `grado_numero` | `text` |  Nullable |
| `grado_descripcion` | `text` |  Nullable |
| `grado_nombre` | `text` |  |

## Table `materias`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `materia_nombre` | `text` |  |
| `materia_descripcion` | `text` |  Nullable |

## Table `programas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `materia_id` | `int8` |  |
| `programa_objetivo` | `text` |  Nullable |
| `programa_tema` | `text` |  |
| `programa_texto` | `text` |  Nullable |
| `programa_estatus` | `programa_estatus` |  Nullable |

## Table `asignaciones`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `programa_id` | `int8` |  |
| `grado_id` | `int8` |  |
| `asigna_estatus` | `asigna_estatus` |  Nullable |
| `anio_id` | `int8` |  Nullable |

## Table `clases`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `programa_id` | `int8` |  |
| `clase_num` | `int4` |  Nullable |
| `clase_tema` | `text` |  |
| `clase_objetivo` | `text` |  Nullable |
| `clase_texto` | `text` |  Nullable |

## Table `anio`

Anios de los Periodos escolares

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `anio_periodo` | `text` |  Nullable |
| `anio_inicio` | `date` |  Nullable |
| `anio_fin` | `date` |  Nullable |

## Table `alumnos`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `alumno_nombre` | `text` |  |
| `alumno_email` | `text` |  Nullable |
| `alumno_birthday` | `date` |  Nullable |
| `alumno_sexo` | `sexo` |  Nullable |
| `alumno_representante` | `text` |  Nullable |
| `alumno_telf` | `text` |  Nullable |
| `alumno_direccion` | `text` |  Nullable |
| `alumno_imagen_url` | `text` |  Nullable |
| `grado_id` | `int8` |  Nullable |

## Table `profesores`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `profe_nombre` | `text` |  Unique |
| `profe_email` | `text` |  Nullable |
| `profe_telf` | `text` |  Nullable |
| `profe_estatus` | `profe_estatus` |  Nullable |
| `profe_rol` | `profe_rol` |  Nullable |
| `profe_imagen_url` | `text` |  Nullable |
| `grado_id` | `int8` |  Nullable |
| `auth_user_id` | `uuid` |  Nullable Unique |

## Table `control`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `asigna_id` | `int8` |  |
| `control_fecha` | `date` |  Nullable |
| `profe_id` | `int8` |  Nullable |
| `control_observ` | `text` |  Nullable |
| `clase_id` | `int8` |  Nullable |
| `control_estatus` | `control_estatus` |  Nullable |

## Table `asistencias`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `control_id` | `int8` |  |
| `alumno_id` | `int8` |  |
| `asist_presente` | `bool` |  |
| `asist_evaluacion` | `evaluacion_enum` |  Nullable |
| `asist_observacion` | `text` |  Nullable |

## Custom Types / Enums

### `programa_estatus`

`Disponible` | `Elaborando`

### `sexo`

`Masculino` | `Femenino`

### `asigna_estatus`

`Activa` | `Pendiente` | `Terminada`

### `control_estatus`

`Vista` | `Programada` | `Pendiente` | `-`

### `evaluacion_enum`

`Deficiente` | `Bueno` | `Excelente`

### `profe_estatus`

`Activo` | `Inactivo`

### `profe_rol`

`Admin` | `Docente` | `Superadmin`

## RLS Policies

### `grados`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Permitir lectura a autenticados` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Restringir escritura a docentes` | ALL | authenticated | PERMISSIVE | `(NOT es_docente())` | `(NOT es_docente())` |

### `clases`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Permitir lectura a autenticados` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Restringir escritura a docentes` | ALL | authenticated | PERMISSIVE | `(NOT es_docente())` | `(NOT es_docente())` |

### `profesores`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Permitir actualización a dueños, Admins o Superadmins` | UPDATE | authenticated | PERMISSIVE | `(((auth.jwt() ->> 'email'::text) = profe_email) OR (EXISTS ( SELECT 1    FROM profesores profesores_1   WHERE ((profesores_1.profe_email = (auth.jwt() ->> 'email'::text)) AND (lower((profesores_1.profe_rol)::text) = ANY (ARRAY['admin'::text, 'superadmin'::text]))))))` | — |
| `Permitir lectura a usuarios autenticados` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Restringir eliminación a docentes` | DELETE | authenticated | PERMISSIVE | `(NOT es_docente())` | — |
| `Restringir inserción a docentes` | INSERT | authenticated | PERMISSIVE | — | `(NOT es_docente())` |

### `programas`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Permitir lectura a autenticados` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Restringir escritura a docentes` | ALL | authenticated | PERMISSIVE | `(NOT es_docente())` | `(NOT es_docente())` |

### `asignaciones`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Permitir lectura a autenticados` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Restringir escritura a docentes` | ALL | authenticated | PERMISSIVE | `(NOT es_docente())` | `(NOT es_docente())` |

### `control`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Permitir todo a autenticados` | ALL | authenticated | PERMISSIVE | `true` | `true` |

### `alumnos`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Permitir lectura a autenticados` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Restringir escritura a docentes` | ALL | authenticated | PERMISSIVE | `(NOT es_docente())` | `(NOT es_docente())` |

### `asistencias`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Permitir todo a autenticados` | ALL | authenticated | PERMISSIVE | `true` | `true` |

### `anio`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Permitir lectura a autenticados` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Restringir escritura a docentes` | ALL | authenticated | PERMISSIVE | `(NOT es_docente())` | `(NOT es_docente())` |

### `materias`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Restringir escritura a docentes` | ALL | authenticated | PERMISSIVE | `(NOT es_docente())` | `(NOT es_docente())` |
| `ver_materias` | SELECT | authenticated | PERMISSIVE | `((((auth.jwt() -> 'app_metadata'::text) ->> 'profe_estatus'::text) = 'Activo'::text) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'profe_rol'::text) = ANY (ARRAY['Docente'::text, 'Admin'::text])))` | — |

