# Arquitectura del Proyecto - Sistema Escolar

## Información general

**Proyecto:** Sistema de Gestión Escolar

**Objetivo:**

Crear una aplicación web sencilla para administrar la información académica y operativa de una escuela pequeña.

El sistema está pensado inicialmente para una institución de aproximadamente 50 alumnos, con capacidad de crecimiento, pero manteniendo como prioridad:

- Simplicidad.
- Orden.
- Facilidad de mantenimiento.
- Código comprensible.
- Aprendizaje durante el desarrollo.

---

## Filosofía de desarrollo

El proyecto seguirá los siguientes principios:

- Mantener una arquitectura sencilla.
- Evitar complejidad innecesaria.
- Utilizar la menor cantidad posible de librerías externas.
- Priorizar soluciones claras sobre soluciones sofisticadas.
- Mantener separación entre interfaz, lógica y datos.
- Documentar decisiones importantes.
- Construir funcionalidades completas antes de agregar mejoras avanzadas.

---

## Tecnologías actuales

### Frontend

Tecnologías utilizadas:

- HTML.
- CSS.
- JavaScript Vanilla.

Actualmente no se utiliza ningún framework frontend.

---

### Backend y Base de Datos

Plataforma:

Supabase.

Motor:

PostgreSQL.

Supabase proporciona:

- Base de datos.
- API automática.
- Autenticación.
- Gestión futura de usuarios.
- Seguridad mediante Row Level Security (RLS).

---

## Estado actual de seguridad

Durante la etapa de desarrollo:

- Existe un único usuario registrado.
- No existen políticas RLS activadas.
- Las tablas están accesibles para facilitar el desarrollo.

Plan futuro:

1. Completar funcionalidades.
2. Validar funcionamiento general.
3. Implementar autenticación multiusuario.
4. Crear roles.
5. Implementar políticas RLS.
6. Restringir acceso según permisos.

---

## Arquitectura general

El flujo actual de la aplicación es:

Usuario

↓

Interfaz HTML

↓

JavaScript del frontend

↓

Cliente Supabase

↓

API Supabase

↓

Base de datos PostgreSQL


---

## Estructura actual del proyecto

Carpetas principales:

css/

Contiene los archivos de estilos.

js/

Contiene la lógica JavaScript de la aplicación.

supabase/

Contiene información relacionada con la base de datos y scripts SQL.

docs/

Contiene documentación técnica del proyecto.

---

### Organización del código

La aplicación actualmente está desarrollada utilizando JavaScript Vanilla.

La lógica está organizada mediante módulos JavaScript que interactúan directamente con Supabase.

Objetivo futuro:

Mejorar progresivamente la organización del código mediante:

- Funciones reutilizables.
- Separación por módulos.
- Reducción de código repetido.
- Mejor manejo de errores.
- Mayor claridad en responsabilidades.

---

### Base de datos

La base de datos utiliza PostgreSQL mediante Supabase.

Tablas principales:

- alumnos
- profesores
- grados
- materias
- programas
- clases
- asignaciones
- asistencias
- control
- anio


---

### Vistas existentes

Actualmente existen vistas SQL utilizadas para simplificar consultas desde el frontend:

- vista_asignaciones
- vista_asistencias
- vista_control

La creación de nuevas vistas se evaluará según la necesidad del sistema.

---

### Lógica almacenada en Base de Datos

Actualmente existen funciones y triggers para mantener reglas importantes directamente en PostgreSQL.

Funciones existentes:

- generar_control_por_asignacion()
- programa_tema()
- validar_asistencia_control_vista()
- validar_asistencia_unica_clase()
- validar_grado_alumno_asistencia()


Triggers existentes:

- trg_validar_asistencia
- trg_validar_asistencia_control
- trg_validar_grado_asistencia
- trigger_generar_control


---

### Enfoque de desarrollo

El desarrollo se realizará por módulos.

Orden previsto:

1. CRUD básicos.
2. Validación de funcionamiento.
3. Mejora y optimización del código.
4. Seguridad.
5. Mejoras visuales.
6. Preparación para una posible migración a Next.js.

---

### Módulos actuales

Implementado:

- Conexión con Supabase.
- Lectura de tablas.
- Lectura de vistas.
- CRUD de Materias.
- CRUD de Programas.


---

### Módulos pendientes

Pendientes de implementación:

- CRUD de Alumnos.
- CRUD de Profesores.
- CRUD de Grados.
- CRUD de Clases.
- CRUD de Asignaciones.
- CRUD de Asistencia.
- CRUD de Control.


---

### Criterios para futuras mejoras

Cada modificación deberá considerar:

### Mantenibilidad

El código debe ser fácil de entender y modificar.

### Rendimiento

Las consultas y procesos deben ser eficientes.

### Seguridad

La información debe estar protegida cuando se habilite el uso multiusuario.

### Escalabilidad

Las decisiones actuales deben permitir crecimiento futuro.

### Aprendizaje

Cada implementación debe buscar mejorar la comprensión técnica del proyecto.

---

## Evolución futura

Cuando el sistema alcance una versión estable se evaluará:

- Migración a Next.js.
- Arquitectura basada en componentes.
- Mejor separación entre frontend y backend.
- Mejoras avanzadas de autenticación.
- Reportes.
- Exportación de información.