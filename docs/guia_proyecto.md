# Guía del proyecto EscuelaConSupabase

## 1. Propósito general

Este proyecto es una aplicación web de gestión escolar pensada para apoyar tareas académicas y operativas en una institución pequeña o mediana. Su objetivo principal es centralizar información relacionada con alumnos, profesores, clases, programas, asignaciones, asistencias y control académico.

## 2. Filosofía de desarrollo

El proyecto sigue una filosofía de simplicidad y progreso gradual:

- mantener el stack lo más ligero posible
- priorizar HTML, CSS y JavaScript puro
- usar Supabase como backend y base de datos
- evitar frameworks innecesarios en esta etapa
- diseñar primero para móvil y luego escalar a pantallas grandes

## 3. Estructura del proyecto

- index.html: pantalla de bienvenida y login
- app.html: panel principal de la aplicación
- css/app.css: estilos del panel principal
- css/landing.css: estilos de la pantalla de bienvenida
- js/config.js: configuración de Supabase
- js/ui.js: helpers reutilizables para encabezados, estado visual y navegación
- js/app.js: lógica principal de la aplicación
- docs/: documentación técnica y de planeación

## 4. Cómo funciona la aplicación

### 4.1 Flujo inicial

1. El usuario entra a la landing en index.html.
2. Inicia sesión con Supabase.
3. Si el login es correcto, se redirige a app.html.
4. El panel carga la vista inicial del dashboard.

### 4.2 Navegación

La aplicación usa un menú lateral que funciona como drawer en pantallas pequeñas. En escritorio se puede mostrar de forma más estática, pero el enfoque principal sigue siendo móvil.

### 4.3 Datos

La información se obtiene principalmente desde Supabase y las tablas principales incluyen:

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

## 5. Arquitectura actual

La arquitectura actual es sencilla y está pensada para entenderse sin demasiada complejidad:

- HTML define la estructura de la interfaz.
- CSS define la apariencia y el diseño responsive.
- JavaScript maneja la lógica y la interacción con Supabase.
- Supabase provee autenticación y almacenamiento de datos.

## 6. Qué se ha mejorado

Se ha iniciado una reorganización para que el proyecto sea más fácil de seguir:

- se creó un archivo de utilidades visuales en js/ui.js
- se centralizaron funciones repetitivas para encabezados y menú
- se mantiene una estructura más clara para futuras mejoras

## 7. Recomendaciones de mejora

### 7.1 Mantener el enfoque simple

No conviene agregar frameworks en este momento. La base actual ya es suficiente para un producto útil.

### 7.2 Separar mejor responsabilidades

Lo ideal es dividir la lógica en secciones pequeñas:

- autenticación
- navegación
- carga de datos
- vistas
- utilidades visuales

### 7.3 Priorizar diseño mobile-first

El sistema debe verse bien en teléfono primero y luego adaptarse a tablet o escritorio.

### 7.4 Reducir duplicación de código

Repeticiones como eventos de menú, render de headers y mensajes de alerta deben centralizarse.

## 8. Próximos pasos sugeridos

1. Separar las vistas en módulos más pequeños.
2. Crear una capa simple de servicios para Supabase.
3. Revisar el flujo de formularios y modales.
4. Mejorar el diseño responsive en pantallas pequeñas.
5. Añadir manejo más claro de errores y estados de carga.

## 9. Nota para quien lo mantenga

Este proyecto está bien para aprender, iterar y crecer sin complicarse con una arquitectura pesada. La prioridad debe ser que sea fácil de entender, fácil de modificar y útil para el usuario real.
